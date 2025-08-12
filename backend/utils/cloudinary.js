import {v2 as cloudinary} from "cloudinary";

import fs from "fs";
import { resourceUsage } from "process";

cloudinary.config({ 
        cloud_name:process.env.CLOUDINARY_CLOUD_NAME, 
        api_key:process.env.CLOUDINARY_API_KEY,
        api_secret:process.env.CLOUDINARY_API_SECRET
    });


const uploadOnCloudinary = async (localFilePath) => {
    try{
        const response = await cloudinary.uploader.upload(localFilePath,{resource_type:"image"});
        console.log("file uploaded successfully",response.url());
        fs.unlinkSync(localFilePath);
        return response;
     }
    catch(err){

        fs.unlinkSync(localFilePath);
        //throw out the temp file on the server as upload operation is failed 
        return null;

    }
};



// It’s basically because of how HTTP file uploads work and how Multer is designed.

// When a browser uploads a file (multipart/form-data), your backend has to receive that file’s data in chunks. Multer acts as a “parser” for this stream.

// Now, Multer has to put that stream somewhere while your code decides what to do with it.
// By default, it gives you two options:

// Disk storage → writes chunks to a temp file on the server (most common).

// Memory storage → keeps chunks in RAM as a Buffer (good for small files).

// It does this because:

// Node.js needs the whole file before you can send it to Cloudinary (unless you use a streaming approach).

// Multer’s “disk storage” is just a temporary holding spot for the uploaded file so your backend can process it.

// But here’s the key:

// Multer itself does NOT automatically delete those temp files.

// It’s your job to delete them after you’re done (successful upload to Cloudinary or if something fails).

// If you don’t, they’ll pile up on the server’s storage and can eventually cause the server to run out of space.

// Typical Flow with Multer + Cloudinary
// Multer saves file temporarily to server’s disk.

// Your code uploads that file to Cloudinary.

// If Cloudinary upload is successful →
// fs.unlinkSync(localFilePath) deletes the local file.

// If Cloudinary upload fails →
// still run fs.unlinkSync(localFilePath) to clean up.

// Why not just let it stay there?
// Because:

// On cloud servers, disk space is small (sometimes only a few hundred MBs).

// On local dev, unnecessary files will keep filling your project folder.