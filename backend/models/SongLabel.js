import mongoose from 'mongoose';

/**
 * SongLabel Model
 * 
 * Join table linking Songs to Labels.
 * 
 * CRITICAL: This table stores ONLY REGULAR labels.
 * Super labels are expanded to their component regular labels before storage.
 * Runtime enforcement of REGULAR-only constraint can be added later in services.
 * 
 * Fields:
 * - libraryId: Required, scopes relationship to a library
 * - songId: Stable song ID
 * - labelId: Stable label ID (must reference a REGULAR label)
 * 
 * Uniqueness: (libraryId, songId, labelId) is unique - a song can't have the same label twice
 */

const songLabelSchema = new mongoose.Schema(
  {
    libraryId: {
      type: String,
      required: true,
      ref: 'Library',
      index: true,
    },
    songId: {
      type: String,
      required: true,
      ref: 'Song',
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
// Unique constraint: a song can't have the same label twice within a library
songLabelSchema.index({ libraryId: 1, songId: 1, labelId: 1 }, { unique: true });

// Prevent model overwrite during hot reload
const SongLabel = mongoose.models.SongLabel || mongoose.model('SongLabel', songLabelSchema);

export default SongLabel;