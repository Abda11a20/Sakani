require('dotenv').config();

const connectionString = `cloudinary://${process.env.CLOUDINARY_API_KEY}:${process.env.CLOUDINARY_API_SECRET}@${process.env.CLOUDINARY_CLOUD_NAME}`;
process.env.CLOUDINARY_URL = connectionString;

const cloudinary = require('cloudinary').v2;

console.log("Parsed Config:", {
  cloud_name: cloudinary.config().cloud_name,
  api_key: cloudinary.config().api_key,
});

const sampleBase64 = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

cloudinary.uploader.upload(sampleBase64, { folder: "sakany/test" })
  .then(result => {
    console.log("Upload Success!", result.secure_url);
    process.exit(0);
  })
  .catch(error => {
    console.error("Upload Failed!", error);
    process.exit(1);
  });
