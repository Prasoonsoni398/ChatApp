import dns from "node:dns";
import mongoose from "mongoose";

// Safely set custom DNS for networks blocking MongoDB SRV records without failing on cloud hosts
try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch (dnsErr) {
  console.warn("[DB] Custom DNS override skipped:", dnsErr.message);
}

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error(
      "❌ [DB CRITICAL ERROR] MONGO_URI environment variable is not defined! Please set MONGO_URI in your deployment settings.",
    );
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;

