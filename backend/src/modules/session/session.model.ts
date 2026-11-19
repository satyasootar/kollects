import mongoose, { Schema } from "mongoose";
import type { ISession } from "./session.validation.js";

const sessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // SHA-256 of the current refresh token; the raw token is never stored.
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },

    // The token this session rotated away from, kept briefly so a concurrent refresh
    // from another tab isn't mistaken for token theft.
    prevTokenHash: String,

    rotatedAt: Date,

    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },

    userAgent: String,

    ipAddress: String,

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Session = mongoose.model<ISession>("Session", sessionSchema);
