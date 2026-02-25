import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/store';
import { labelApi } from '@/services/labelApi';
import * as libraryApi from '@/services/libraryApi';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function BulkLabelImportModal({ isOpen, onClose }: Props) {
  const activeLibraryId = useStore((state) => state.activeLibraryId);
  const setLibraryData = useStore((state) => state.setLibraryData);
  const setSongs = useStore((state) => state.setSongs);
  const setSongSources = useStore((state) => state.setSongSources);
  const setLabels = useStore((state) => state.setLabels);
  const setSongLabels = useStore((state) => state.setSongLabels);
  const setModes = useStore((state) => state.setModes);

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setLoading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (loading) return;
    onClose();
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

      await labelApi.bulkImport(items);

      const data = await libraryApi.bootstrapLibrary(activeLibraryId);
      setLibraryData(data.library);
      setSongs(data.songs ?? []);
      setSongSources(data.songSources ?? []);
      setLabels(data.labels ?? [], data.superLabels ?? []);
      setSongLabels(data.songLabels ?? []);
      setModes(data.labelModes ?? []);

      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import labels.';
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
      <div className="bg-neutral-900 rounded-xl p-6 w-[500px] max-h-[80vh] overflow-y-auto border border-gray-800 shadow-lg">
        <div className="text-lg font-semibold text-white">Bulk Import Labels</div>

        <div className="mt-4 space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept=".json"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-gray-200 file:mr-4 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-gray-800 file:text-gray-200 hover:file:bg-gray-700"
            disabled={loading}
          />
          <div className="text-xs text-gray-400">
            {file ? `Selected: ${file.name}` : 'No file selected'}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-3 py-2 text-sm rounded-md border border-gray-700 text-gray-200 hover:bg-gray-800 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleImport()}
            disabled={loading || !file}
            className="px-3 py-2 text-sm rounded-md border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40"
          >
            {loading ? 'Importing…' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
}
