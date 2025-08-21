import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined");
}

let cached = global.mongoose;

if(!cached){
    cached = global.mongoose = { conn: null, promise: null }
}

export async function connectToDatabase(){
    if(cached.conn){
        return cached.conn
    };

    if(!cached.promise){
        const ops = {
            bufferCommands: true,//If the database connection drops, keep commands in memory and run them when the connection is restored.
            maxPoolSize: 10,//The maximum number of connections in the pool.
        }
        
        cached.promise = mongoose
        .connect(MONGODB_URI, ops).then((mongoose)=>mongoose.connection)
    }

    try {
        cached.conn = await cached.promise
    } catch (error) {
        cached.promise = null;
        throw error
    }

    return cached.conn;
}