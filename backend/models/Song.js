import mongoose from 'mongoose';
import { normalizeTitle, normalizeArtist, generateNormKey } from '../utils/normalize.js';

/**
 * Song Model
 * 
 * Central entity in AudioFile. Each song exists as a single canonical entry.
 * 
 * Key characteristics:
 * - Can exist with zero sources (manual-only entries fully supported)
 * - Display fields (displayTitle, displayArtist) are user-editable and used for UI
 * - Official fields (officialTitle, officialArtist) are nullable, populated when sources attached
 * - Normalized fields (normTitle, normArtist, normKey) auto-generated for matching
 * - Stable internal songId never changes
 * 
 * Fields:
 * - libraryId: Required, scopes song to a library
 * - songId: Stable internal ID (application-generated string)
 * - displayTitle: Required, user-editable display name
 * - displayArtist: Required, user-editable artist name
 * - officialTitle: Optional, immutable reference from source
 * - officialArtist: Optional, immutable reference from source
 * - normTitle: Auto-generated normalized title
 * - normArtist: Auto-generated normalized artist
 * - normKey: Auto-generated composite key for duplicate detection
 * - metadata: Optional additional data (genre, year, BPM, etc.)
 */

const songSchema = new mongoose.Schema(
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
      unique: true,
      index: true,
    },
    displayTitle: {
      type: String,
      required: true,
      trim: true,
    },
    displayArtist: {
      type: String,
      required: true,
      trim: true,
    },
    officialTitle: {
      type: String,
      default: null,
      trim: true,
    },
    officialArtist: {
      type: String,
      default: null,
      trim: true,
    },
    normTitle: {
      type: String,
      required: true,
      index: true,
    },
    normArtist: {
      type: String,
      required: true,
      index: true,
    },
    normKey: {
      type: String,
      required: true,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// normKey is unique per library (for duplicate detection within library)
songSchema.index({ libraryId: 1, normKey: 1 }, { unique: true });

// Compound index for library queries
songSchema.index({ libraryId: 1, normTitle: 1 });
songSchema.index({ libraryId: 1, normArtist: 1 });

// Pre-validate hook: compute normalized fields
songSchema.pre('validate', function () {
  // Determine source for normalization: official if present, otherwise display
  const titleForNorm = this.officialTitle || this.displayTitle;
  const artistForNorm = this.officialArtist || this.displayArtist;

  // Compute normalized fields
  this.normTitle = normalizeTitle(titleForNorm);
  this.normArtist = normalizeArtist(artistForNorm);
  this.normKey = generateNormKey(titleForNorm, artistForNorm);
});

// Prevent model overwrite during hot reload
const Song = mongoose.models.Song || mongoose.model('Song', songSchema);

export default Song;