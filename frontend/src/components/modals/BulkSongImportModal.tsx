import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@/store';
import { songApi } from '@/services/songApi';
import * as libraryApi from '@/services/libraryApi';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function BulkSongImportModal({ isOpen, onClose }: Props) {
  const activeLibraryId = useStore((state) => state.activeLibraryId);
  const labelIds = useStore((state) => state.labelIds);
  const labelsById = useStore((state) => state.labelsById);

  const setLibraryData = useStore((state) => state.setLibraryData);
  const setSongs = useStore((state) => state.setSongs);
  const setSongSources = useStore((state) => state.setSongSources);
  const setLabels = useStore((state) => state.setLabels);
  const setSongLabels = useStore((state) => state.setSongLabels);
  const setModes = useStore((state) => state.setModes);

  const [file, setFile] = useState<File | null>(null);
  const [labelSearch, setLabelSearch] = useState('');
  const [selectedLabelIds, setSelectedLabelIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setLabelSearch('');
      setSelectedLabelIds(new Set());
      setLoading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }, [isOpen]);

  const normalizedQuery = labelSearch.trim().toLowerCase();
  const filteredLabels = useMemo(() => {
    const base = labelIds
      .map((id) => labelsById[id])
      .filter(Boolean)
      .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

    if (!normalizedQuery) return base;

    return base.filter((label) => label.name.toLowerCase().includes(normalizedQuery));
  }, [labelIds, labelsById, normalizedQuery]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  const toggleLabel = (labelId: string) => {
    setSelectedLabelIds((prev) => {
      const next = new Set(prev);
      if (next.has(labelId)) {
        next.delete(labelId);
      } else {
        next.add(labelId);
      }
      return next;
    });
  };

  const handleImport = async () => {
    if (!activeLibraryId) {
      window.alert('No active library selected.');
      return;
    }

    if (!file) {
      window.alert('Please select a JSON file to import.');
      return;
    }

    setLoading(true);

    try {
      const text = await file.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        window.alert('Invalid JSON file.');
        return;
      }

      const items = Array.isArray(parsed) ? parsed : (parsed as { items?: unknown }).items;
      if (!Array.isArray(items)) {
        window.alert('JSON must be an array or an object with an "items" array.');
        return;
      }

      const applyLabelIds = Array.from(selectedLabelIds);
      await songApi.bulkImport(items, applyLabelIds);

      const data = await libraryApi.bootstrapLibrary(activeLibraryId);
      setLibraryData(data.library);
      setSongs(data.songs ?? []);
      setSongSources(data.songSources ?? []);
      setLabels(data.labels ?? [], data.superLabels ?? []);
      setSongLabels(data.songLabels ?? []);
      setModes(data.labelModes ?? []);

      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import songs.';
      window.alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="bg-neutral-900 rounded-xl p-6 w-[500px] max-h-[80vh] overflow-y-auto border border-neutral-750 shadow-af-lg">
        <div className="text-lg font-semibold text-neutral-100">Bulk Import Songs</div>

        <div className="mt-4 space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept=".json"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-neutral-200 file:mr-4 file:py-2 file:px-3 file:rounded-af-md file:border-0 file:text-sm file:font-medium file:bg-neutral-800 file:text-neutral-200 hover:file:bg-neutral-700"
            disabled={loading}
          />
          <div className="text-xs text-neutral-500">
            {file ? `Selected: ${file.name}` : 'No file selected'}
          </div>
        </div>

        <div className="mt-6">
          <div className="text-sm font-semibold text-neutral-200">Assign Labels to All Imported Songs</div>
          <input
            value={labelSearch}
            onChange={(e) => setLabelSearch(e.target.value)}
            placeholder="Search labels…"
            className="mt-2 w-full h-9 px-3 text-sm bg-neutral-800 text-neutral-100 border border-neutral-750 rounded-af-md placeholder:text-neutral-500 focus:ring-1 focus:ring-neutral-400 focus:border-neutral-500 focus:outline-none"
            disabled={loading}
          />

          <div className="mt-3 flex flex-wrap gap-2">
            {filteredLabels.slice(0, 80).map((label) => {
              const selected = selectedLabelIds.has(label.labelId);
              return (
                <button
                  key={label.labelId}
                  type="button"
                  onClick={() => toggleLabel(label.labelId)}
                  disabled={loading}
                  className={
                    selected
                      ? 'px-3 py-1.5 text-xs rounded-af-pill border border-neutral-400 bg-neutral-700 text-neutral-100 ring-1 ring-neutral-400'
                      : 'px-3 py-1.5 text-xs rounded-af-pill border border-neutral-700 bg-neutral-800 text-neutral-200 hover:bg-neutral-700'
                  }
                >
                  {label.name}
                </button>
              );
            })}
          </div>

          {selectedLabelIds.size > 0 ? (
            <div className="mt-2 text-xs text-neutral-500">
              Selected: {selectedLabelIds.size}
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-3 py-2 text-sm rounded-af-md border border-neutral-750 text-neutral-200 hover:bg-neutral-800 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleImport()}
            disabled={loading || !file}
            className="px-3 py-2 text-sm rounded-af-md border border-neutral-600 bg-neutral-700 text-neutral-100 hover:bg-neutral-600 disabled:opacity-40"
          >
            {loading ? 'Importing…' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
}
