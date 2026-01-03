import mongoose from 'mongoose';

/**
 * User Model
 * 
 * Root owner entity in AudioFile.
 * For MVP: data scaffolding only - no authentication flows.
 * 
 * Fields:
 * - userId: Stable internal ID (application-generated string, not Mongo _id)
 * - email: Required and unique across all users
 * - createdAt, updatedAt: Timestamps
 */

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model overwrite during hot reload
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;