import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;


let cached = global.mongoose as {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  // Skip database connection during build time if MONGODB_URI is not available
  if (!MONGODB_URI) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('MONGODB_URI not available during build time');
      return null;
    }
    throw new Error("Defina a variável de ambiente MONGODB_URI");
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      dbName: "npi",
      bufferCommands: false,
      maxPoolSize: 10,
    }).then((mongoose) => mongoose);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
