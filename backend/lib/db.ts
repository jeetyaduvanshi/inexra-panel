import mongoose from 'mongoose';
import dns from 'dns';

// Ensure MongoDB Atlas SRV DNS lookup succeeds on Windows/local networks
try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
    console.warn("Could not configure DNS servers:", e);
}

const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

declare global {
    // eslint-disable-next-line no-var
    var mongoose: MongooseCache | undefined;
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
    if (cached!.conn) {
        return cached!.conn;
    }

    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error('Please define the MONGODB_URI environment variable');
    }

    if (!cached!.promise) {
        const opts = {
            bufferCommands: false,
        };

        cached!.promise = mongoose.connect(uri, opts).then((mongoose) => {
            console.log("✅ MongoDB Connected Successfully");
            return mongoose;
        });
    }

    try {
        cached!.conn = await cached!.promise;
    } catch (e) {
        cached!.promise = null;
        console.error("❌ MongoDB Connection Error:", e);
        throw e;
    }

    return cached!.conn;
}

export default connectToDatabase;
