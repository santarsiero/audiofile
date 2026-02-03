import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./models/User.js";
import Library from "./models/Library.js";
import Song from "./models/Song.js";
import Label from "./models/Label.js";
import SongLabel from "./models/SongLabel.js";
import SuperLabelComponent from "./models/SuperLabelComponent.js";
import SongSource from "./models/SongSource.js";
import LabelMode from "./models/LabelMode.js";
import LabelModeLabel from "./models/LabelModeLabel.js";
import RefreshToken from "./models/RefreshToken.js";
import librariesRouter from "./routes/libraries.js";
import providersRouter from "./routes/providers.js";
import authRouter from "./routes/auth.js";
import { requireAuth } from "./middleware/requireAuth.js";

process.on("uncaughtException", (err) => {
  console.error("[UNCAUGHT EXCEPTION]", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("[UNHANDLED REJECTION]", reason);
});

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/libraries", requireAuth, librariesRouter);
app.use("/api/providers", providersRouter);
app.use("/api/auth", authRouter);
console.log(
  "Mounted /api/libraries routes:",
  (librariesRouter?.stack || [])
    .filter((l) => l.route)
    .map((l) => ({ path: l.route.path, methods: l.route.methods }))
);

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "audiofile-backend" });
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI in .env");
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Mongo connection error:", err);
    process.exit(1);
  });