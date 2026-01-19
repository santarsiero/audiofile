# AudioFile Frontend - Phase 4 Implementation

## Overview

This is the complete Phase 4 frontend architecture for AudioFile, following the locked specifications:
- Frontend MVP Source of Truth
- Phase 4 Frontend Architecture Contract
- MVP Specification documents

## Technology Stack

- **TypeScript** (strict mode)
- **React 18** with Vite
- **Zustand** for state management
- **Tailwind CSS** for styling
- **React Router** for routing

## Folder Structure

```
src/
├── components/           # UI components organized by feature
│   ├── layout/          # MainLayout, Header, LeftPanel, RightPanel
│   ├── canvas/          # Canvas, SongCard, FloatingControls
│   └── ...              # (More to come: songs, labels, filter, etc.)
├── pages/               # Route-level components
│   └── LibraryPage.tsx  # Main workspace page
├── services/            # DATA LAYER - API client
│   ├── api.ts           # Base API client with error handling
│   ├── songApi.ts       # Song operations
│   ├── labelApi.ts      # Label operations
│   ├── filterApi.ts     # Filter operations
│   └── ...
├── store/               # VIEW STATE LAYER - Zustand
│   ├── index.ts         # Main store combining all slices
│   └── slices/          # Individual state slices
│       ├── librarySlice.ts
│       ├── songsSlice.ts
│       ├── labelsSlice.ts
│       ├── filtersSlice.ts
│       ├── canvasSlice.ts
│       ├── settingsSlice.ts
│       ├── modesSlice.ts
│       └── panelsSlice.ts
├── layout-engines/      # LAYOUT LAYER - Pure functions
│   ├── types.ts         # Layout engine interface
│   └── alphabeticalGrid.ts  # Default grid layout engine
├── domain/              # Domain helpers
│   ├── normalize.ts     # Text normalization
│   ├── canvasItems.ts   # Canvas instance helpers
│   └── validation.ts    # Input validation
├── types/               # TypeScript definitions
│   ├── entities.ts      # Core entities (Song, Label, etc.)
│   ├── canvas.ts        # Canvas item types
│   ├── api.ts           # API request/response types
│   └── state.ts         # View state types
├── hooks/               # Custom React hooks (placeholder)
└── utils/               # General utilities (placeholder)
```

## Integration with Windsurf

### Option 1: Replace Entire Frontend

1. Delete existing `frontend/src` contents
2. Copy this `src/` folder to `frontend/src/`
3. Replace `package.json` with this one
4. Replace config files (`tsconfig.json`, `vite.config.ts`, etc.)
5. Run `npm install`
6. Run `npm run dev`

### Option 2: Incremental Integration

1. Install new dependencies:
   ```bash
   npm install zustand react-router-dom
   npm install -D @types/react @types/react-dom typescript tailwindcss postcss autoprefixer
   ```

2. Copy config files:
   - `tsconfig.json`
   - `tsconfig.node.json`
   - `vite.config.ts`
   - `tailwind.config.js`
   - `postcss.config.js`

3. Rename existing `.jsx` files to `.tsx`

4. Copy folders in this order:
   - `src/types/` (first - no dependencies)
   - `src/domain/` (depends on types)
   - `src/services/` (depends on types)
   - `src/layout-engines/` (depends on types, domain)
   - `src/store/` (depends on types, domain)
   - `src/components/` (depends on store, types)
   - `src/pages/` (depends on components, store)
   - `src/main.tsx` and `src/App.tsx`
   - `src/index.css`

5. Run `npm run dev` to verify

## Environment Variables

Create `.env` file:
```
VITE_API_BASE_URL=http://localhost:5050/api
```

## Architecture Rules (ENFORCED)

### 1. Three-Layer Separation
- **Data Layer** (`services/`): API calls only, no layout logic
- **View State Layer** (`store/`): Filters, modes, settings, canvas state
- **Layout Layer** (`layout-engines/`): Pure functions, no state mutation

### 2. Layout Engines Are Pure
- Same input → Same output
- No state mutation
- No side effects
- Synchronous only

### 3. Canvas Items vs Entities
- Backend entities are canonical (one per songId)
- Canvas items are visual instances (multiple allowed per entity)
- Removing from canvas ≠ deleting from backend

### 4. Frontend Owns Layout
- Backend returns unordered data
- Frontend computes all ordering, grouping, positioning
- Layout logic NEVER in backend

## What's Implemented

### ✅ Complete
- Full type definitions (entities, canvas, API, state)
- Zustand store with 8 slices
- API service layer (ready for backend)
- AlphabeticalGridLayoutEngine
- MainLayout with Header, LeftPanel, RightPanel (placeholder content)
- Canvas component with pan/zoom
- SongCard component
- FloatingControls (zoom, recenter, undo)
- LibraryPage with bootstrap lifecycle
- Settings state with persistence
- Dark/Light theme support

### 🔲 Placeholder (Ready for Phase 5-6)
- Song list component
- Label list component
- Search functionality
- Add Song/Label forms
- Info panels (song, label, superlabel)
- Actual drag-and-drop
- Label tagging UI
- Mind-map visualization (Phase 6)

## Next Steps (Phase 5)

1. Connect to real backend API
2. Implement bootstrap flow
3. Build out song list component
4. Build out label list component
5. Implement tagging UI
6. Implement filter panel
7. Connect layout engine to canvas population

## Verification

After integration, verify:
1. `npm run dev` starts without errors
2. Navigate to `http://localhost:3000`
3. Should see AudioFile header with tabs
4. Theme toggle works
5. Canvas shows empty state
6. Redux DevTools shows store state

---

**Architecture Contract Status: LOCKED**
**Frontend MVP Spec Status: LOCKED**
**Ready for Windsurf Integration**
