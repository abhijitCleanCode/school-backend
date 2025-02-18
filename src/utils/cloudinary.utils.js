import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadFileOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      console.log("File path does not exist");
      return null;
    }

    // upload file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "raw", // Set resource_type to "raw" for PDFs
      type: "upload", // Ensure the file is uploaded
      access_mode: "public", // Make the file publicly accessible
    });
    console.log(
      "utils :: cloudinary.utils.js :: uploadFileOnCloudinary :: response: ",
      response
    );

    // file has been uploaded successfully
    console.log("File is uploaded on cloudinary");

    return response;
  } catch (error) {
    // this is must that's sync, remove the locally saved temporary file as the upload operation got failed
    fs.unlinkSync(localFilePath);
    console.log("File upload operation failed: ", error);
    return null;
  }
};

export { uploadFileOnCloudinary };
