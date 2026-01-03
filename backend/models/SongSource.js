import mongoose from 'mongoose';

/**
 * SongSource Model
 * 
 * Represents external sources/integrations for songs (Apple Music, Spotify, local files, etc.)
 * 
 * NOT USED IN MVP - exists for future integration support.
 * Schema is defined now to avoid refactoring later.
 * 
 * Fields:
 * - libraryId: Required, scopes source to a library
 * - sourceId: Stable internal ID (application-generated string)
 * - songId: Foreign key to Song (a song can have multiple sources)
 * - providerType: Enum identifying the source provider
 * - externalId: Provider's unique identifier for this track
 * - uri: Provider-specific URI/URL for accessing the track
 * - metadata: Additional provider-specific data (JSON)
 */

const songSourceSchema = new mongoose.Schema(
  {
    libraryId: {
      type: String,
      required: true,
      ref: 'Library',
      index: true,
    },
    sourceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    songId: {
      type: String,
      required: true,
      ref: 'Song',
      index: true,
    },
    providerType: {
      type: String,
      required: true,
      enum: ['APPLE_MUSIC', 'SPOTIFY', 'LOCAL_FILE', 'YOUTUBE', 'SOUNDCLOUD', 'OTHER'],
      index: true,
    },
    externalId: {
      type: String,
      required: true,
      trim: true,
    },
    uri: {
      type: String,
      required: true,
      trim: true,
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
// A song can't have the same provider source twice within a library
songSourceSchema.index(
  { libraryId: 1, songId: 1, providerType: 1, externalId: 1 },
  { unique: true }
);

// Prevent model overwrite during hot reload
const SongSource = mongoose.models.SongSource || mongoose.model('SongSource', songSourceSchema);

export default SongSource;