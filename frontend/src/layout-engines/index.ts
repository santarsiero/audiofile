/**
 * AudioFile Layout Engines
 * 
 * Barrel file for layout engine exports.
 * 
 * ARCHITECTURAL RULES:
 * - Layout engines are PURE FUNCTIONS
 * - They run in controllers/hooks, NOT in React components
 * - Components receive pre-computed layout results
 * - There is always exactly one active layout engine at a time
 */

// Types
export * from './types';

// Engines
export {
  alphabeticalGridLayoutEngine,
  simpleGridLayoutEngine,
  AlphabeticalGridLayoutEngine,
  DEFAULT_GRID_PARAMETERS,
} from './alphabeticalGrid';

export type { SortableEntityData } from './alphabeticalGrid';
