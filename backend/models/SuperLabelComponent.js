import mongoose from 'mongoose';

/**
 * SuperLabelComponent Model
 * 
 * Defines the flattened mapping of SUPER labels to their component REGULAR labels.
 * 
 * Key characteristics:
 * - Super labels are defined as sets of regular labels
 * - When creating a super label from another super label, only underlying regular labels are stored
 * - Super labels never reference other super labels directly (flattened structure)
 * - No duplicate regular labels within a single super label
 * 
 * Fields:
 * - libraryId: Required, scopes relationship to a library
 * - superLabelId: Stable label ID (must reference a SUPER type label)
 * - regularLabelId: Stable label ID (must reference a REGULAR type label)
 * 
 * Uniqueness: (libraryId, superLabelId, regularLabelId) is unique
 */

const superLabelComponentSchema = new mongoose.Schema(
  {
    libraryId: {
      type: String,
      required: true,
      ref: 'Library',
      index: true,
    },
    superLabelId: {
      type: String,
      required: true,
      ref: 'Label',
      index: true,
    },
    regularLabelId: {
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
// Unique constraint: a super label can't contain the same regular label twice
superLabelComponentSchema.index(
  { libraryId: 1, superLabelId: 1, regularLabelId: 1 },
  { unique: true }
);

// Prevent model overwrite during hot reload
const SuperLabelComponent = mongoose.models.SuperLabelComponent || 
  mongoose.model('SuperLabelComponent', superLabelComponentSchema);

export default SuperLabelComponent;