import fs from 'node:fs/promises';
import path from 'node:path';

function parseArgs(argv) {
  const args = {
    baseUrl: 'http://localhost:5050',
    token: process.env.AUDIOFILE_TOKEN ?? '',
    libraryId: process.env.AUDIOFILE_LIBRARY_ID ?? '',
    referencePath: path.resolve(process.cwd(), '..', 'data', 'audiofile_final_label_reference.md'),
    apply: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];

    if (a === '--apply') {
      args.apply = true;
      continue;
    }

    if (a === '--dry-run') {
      args.apply = false;
      continue;
    }

    const next = argv[i + 1];
    if (a === '--base-url' && typeof next === 'string') {
      args.baseUrl = next;
      i += 1;
      continue;
    }

    if (a === '--token' && typeof next === 'string') {
      args.token = next;
      i += 1;
      continue;
    }

    if (a === '--library-id' && typeof next === 'string') {
      args.libraryId = next;
      i += 1;
      continue;
    }

    if (a === '--reference' && typeof next === 'string') {
      args.referencePath = path.resolve(next);
      i += 1;
      continue;
    }
  }

  return args;
}

function requireNonEmpty(name, value) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${name} is required`);
  }
  return value.trim();
}

function normalizeLabelName(name) {
  return String(name).trim();
}

function parseReferenceMarkdown(markdown) {
  const lines = markdown.split(/\r?\n/);

  let currentCategory = null;
  const mapping = new Map();
  const categories = new Set();

  for (const line of lines) {
    const catMatch = /^##\s+(.+?)\s*(?:·|$)/.exec(line);
    if (catMatch) {
      currentCategory = catMatch[1].trim();
      categories.add(currentCategory);
      continue;
    }

    const labelMatch = /^###\s+`([^`]+)`/.exec(line);
    if (labelMatch && currentCategory) {
      const labelName = normalizeLabelName(labelMatch[1]);
      mapping.set(labelName, currentCategory);
    }
  }

  return { mapping, categories: Array.from(categories) };
}

async function httpJson(url, { method, headers, body }) {
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const msg = data?.error ? String(data.error) : `${res.status} ${res.statusText}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const baseUrl = requireNonEmpty('baseUrl (--base-url)', args.baseUrl);
  const token = requireNonEmpty('token (--token) or AUDIOFILE_TOKEN', args.token);
  const libraryId = requireNonEmpty('libraryId (--library-id) or AUDIOFILE_LIBRARY_ID', args.libraryId);

  const md = await fs.readFile(args.referencePath, 'utf8');
  const { mapping, categories } = parseReferenceMarkdown(md);

  const headers = {
    authorization: `Bearer ${token}`,
    'content-type': 'application/json',
  };

  const listUrl = `${baseUrl.replace(/\/$/, '')}/api/libraries/${libraryId}/labels`;
  const list = await httpJson(listUrl, { method: 'GET', headers });

  const labels = Array.isArray(list?.labels) ? list.labels : [];

  const plan = [];
  const missing = [];

  for (const label of labels) {
    const name = normalizeLabelName(label?.name ?? '');
    const category = mapping.get(name);

    if (!category) {
      missing.push(name);
      continue;
    }

    const currentMeta =
      label?.metadata && typeof label.metadata === 'object' && !Array.isArray(label.metadata)
        ? label.metadata
        : {};

    if (currentMeta.category === category) {
      continue;
    }

    plan.push({
      labelId: label.labelId,
      name,
      category,
      nextMetadata: { ...currentMeta, category },
    });
  }

  console.log(`Reference categories: ${categories.length}`);
  console.log(`Labels returned by API: ${labels.length}`);
  console.log(`Will update: ${plan.length}`);
  console.log(`No category found for: ${missing.length}`);
  if (missing.length > 0) {
    console.log(missing.filter(Boolean).slice(0, 50).join(', '));
    if (missing.length > 50) console.log(`...and ${missing.length - 50} more`);
  }

  if (!args.apply) {
    console.log('Dry run (no writes). Re-run with --apply to update labels.');
    return;
  }

  for (const item of plan) {
    const url = `${baseUrl.replace(/\/$/, '')}/api/libraries/${libraryId}/labels/${item.labelId}`;
    await httpJson(url, {
      method: 'PUT',
      headers,
      body: { metadata: item.nextMetadata },
    });
    console.log(`Updated ${item.name} -> ${item.category}`);
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
