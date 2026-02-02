# Phase 8 Provider Contract (Internal)

## Provider isolation rules
- Provider implementations must live under `backend/providers/`.
- Core services, routes, models, and UI must not depend on provider-specific implementations.
- Providers must not import from the application outside `backend/providers/`.

## Search contract
- `search(query, options)` returns provider search results.
- Each result must include `title` and `artist`.

## Import semantics (non-atomic)
- `import(trackId, options)` may perform multi-step work.
- Partial failures are possible; callers must not assume all-or-nothing behavior.

## Error philosophy
- Failures must be surfaced as errors (not represented as empty successful results).
- An empty set of results is only valid for a successful search with no matches.

## Undo scope
- Undo is limited to canvas-only state; it does not attempt to reverse external/provider state.

## Logging boundaries
- Provider modules may log provider-internal diagnostics.
- Provider modules must not log secrets.
- Provider modules must not assume any global logging configuration from the app.
