import { createRegularLabel } from './LabelService.js';

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

export async function bulkImportLabels({ libraryId, items }) {
  if (typeof libraryId !== 'string' || libraryId.trim().length === 0) {
    throw badRequest('libraryId is required and must be a non-empty string');
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw badRequest('items is required and must be a non-empty array');
  }

  const summary = {
    total: items.length,
    created: 0,
    duplicates: 0,
    errors: 0,
  };

  const results = [];

  for (const input of items) {
    const name = input?.name;

    const resultRow = {
      input: {
        name: typeof name === 'string' ? name : name ?? null,
      },
      status: 'error',
    };

    try {
      if (typeof name !== 'string' || name.trim().length === 0) {
        throw badRequest('Each item.name is required and must be a non-empty string');
      }

      const payload = {
        name,
        ...(input?.description !== undefined && { description: input.description }),
        ...(input?.metadata !== undefined && { metadata: input.metadata }),
      };

      await createRegularLabel(libraryId, payload);

      resultRow.status = 'created';
      summary.created += 1;
      results.push(resultRow);
    } catch (error) {
      if (error?.status === 409) {
        resultRow.status = 'duplicate';
        summary.duplicates += 1;
        results.push(resultRow);
        continue;
      }

      resultRow.status = 'error';
      summary.errors += 1;
      results.push(resultRow);
    }
  }

  return {
    summary,
    results,
  };
}
