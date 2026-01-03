import mongoose from 'mongoose';

/**
 * LabelModeLabel Model
 * 
 * Join table linking LabelModes to Labels.
 * Defines which labels are visible/selectable when a particular mode is active.
 * 
 * Fields:
 * - libraryId: Required, scopes relationship to a library
 * - modeId: Stable mode ID
 * - labelId: Stable label ID (can be REGULAR or SUPER)
 * 
 * Uniqueness: (libraryId, modeId, labelId) is unique - a mode can't contain the same label twice
 */

const labelModeLabelSchema = new mongoose.Schema(
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
      ref: 'LabelMode',
      index: true,
    },
    labelId: {
      type: String,
      required: true,
      ref: 'Label',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// Unique constraint: a mode can't contain the same label twice within a library
labelModeLabelSchema.index({ libraryId: 1, modeId: 1, labelId: 1 }, { unique: true });

// Prevent model overwrite during hot reload
const LabelModeLabel = mongoose.models.LabelModeLabel || 
  mongoose.model('LabelModeLabel', labelModeLabelSchema);

export default LabelModeLabel;