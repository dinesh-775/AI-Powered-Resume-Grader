import mongoose from "mongoose";

/**
 * Connect to MongoDB. The database is required for auth and history,
 * so we exit the process if the connection cannot be established.
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("[db] MONGODB_URI is not set. Please configure it in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    console.log("[db] Connected to MongoDB");
  } catch (err) {
    console.error(`[db] Connection failed: ${err.message}`);
    process.exit(1);
  }
}
