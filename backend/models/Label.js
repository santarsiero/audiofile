import mongoose from 'mongoose';
import { normalizeLabelName } from '../utils/normalize.js';

/**
 * Label Model
 * 
 * Fundamental organizational primitive in AudioFile.
 * Supports two types: REGULAR and SUPER.
 * 
 * REGULAR labels: Atomic, user-defined tags
 * SUPER labels: Predefined combinations of regular labels (composite/macro)
 * 
 * Fields:
 * - libraryId: Required, scopes label to a library
 * - labelId: Stable internal ID (application-generated string)
 * - name: Display name of the label
 * - type: Enum - REGULAR or SUPER
 * - normName: Auto-generated normalized name for uniqueness
 * 
 * Uniqueness: (libraryId, normName) is unique - same label name can exist in different libraries
 */

const labelSchema = new mongoose.Schema(
  {
    libraryId: {
      type: String,
      required: true,
      ref: 'Library',
      index: true,
    },
    labelId: {
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
    type: {
      type: String,
      required: true,
      enum: ['REGULAR', 'SUPER'],
      index: true,
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
// normName is unique per library (allows same label name in different libraries)
labelSchema.index({ libraryId: 1, normName: 1 }, { unique: true });

// Query index for library + type
labelSchema.index({ libraryId: 1, type: 1 });

// Pre-validate hook: compute normalized name
labelSchema.pre('validate', function () {
  this.normName = normalizeLabelName(this.name);
});

// Prevent model overwrite during hot reload
const Label = mongoose.models.Label || mongoose.model('Label', labelSchema);

export default Label;