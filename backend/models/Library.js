import mongoose from 'mongoose';

/**
 * Library Model
 * 
 * Data partition entity in AudioFile.
 * All core entities (Song, Label, etc.) belong to exactly one library.
 * 
 * Fields:
 * - libraryId: Stable internal ID (application-generated string, not Mongo _id)
 * - ownerUserId: Foreign key to User (single owner for MVP; collaboration later)
 * - name: Library display name
 * - createdAt, updatedAt: Timestamps
 */

const librarySchema = new mongoose.Schema(
  {
    libraryId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    ownerUserId: {
      type: String,
      required: true,
      ref: 'User',
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model overwrite during hot reload
const Library = mongoose.models.Library || mongoose.model('Library', librarySchema);

export default Library;