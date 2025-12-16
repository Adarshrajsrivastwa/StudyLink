require("dotenv").config();
const { v2: cloudinary } = require("cloudinary");

// Validate that required environment variables are present
const cloudName = process.env.CLOUDINARY_NAME || process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_KEY || process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_SECRET || process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error("Error: Cloudinary environment variables are missing!");
  console.error("Required variables:");
  console.error("  - CLOUDINARY_NAME or CLOUDINARY_CLOUD_NAME");
  console.error("  - CLOUDINARY_KEY or CLOUDINARY_API_KEY");
  console.error("  - CLOUDINARY_SECRET or CLOUDINARY_API_SECRET");
  console.error("Please check your .env file in the backend directory.");
  throw new Error("Cloudinary configuration is incomplete. Please check your .env file.");
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

module.exports = cloudinary;
