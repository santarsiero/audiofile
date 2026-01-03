import mongoose from 'mongoose';
import { normalizeModeName } from '../utils/normalize.js';

/**
 * LabelMode Model
 * 
 * User-defined configurations that control which labels are visible/selectable in the UI.
 * 
 * Purpose:
 * - Speed up tagging and filtering by showing only relevant labels
 * - Reduce cognitive load with large label sets
 * - Create context-specific workflows (e.g., "House Mode", "Techno Mode", "Warm-up Mode")
 * 
 * Does NOT:
 * - Remove labels from songs
 * - Clear active filters
 * - Hide informational display
 * 
 * Fields:
 * - libraryId: Required, scopes mode to a library
 * - modeId: Stable internal ID (application-generated string)
 * - name: Display name of the mode
 * - normName: Auto-generated normalized name for uniqueness
 */

const labelModeSchema = new mongoose.Schema(
  {
    libraryId: {
      type: String,
      required: true,
      ref: 'Library',
      index: true,
    },
    modeId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    normName: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// normName is unique per library (allows same mode name in different libraries)
labelModeSchema.index({ libraryId: 1, normName: 1 }, { unique: true });

// Pre-validate hook: compute normalized name
labelModeSchema.pre('validate', function () {
  this.normName = normalizeModeName(this.name);
});

// Prevent model overwrite during hot reload
const LabelMode = mongoose.models.LabelMode || mongoose.model('LabelMode', labelModeSchema);

export default LabelMode;