import multer from 'multer';
import path from 'path';


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), "public", "tempMulter"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024*5, //1 mb
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new Error("Only JPG, PNG, GIF, and WEBP images are allowed"),
        false
      );
    }
    cb(null, true);
  },
});




//cb is callback (error, result) 

// function doTask(cb) {
//   let success = true;
//   if (!success) {
//     cb(new Error("Something went wrong"));
//   } else {
//     cb(null, "Task done!");
//   }
// }

// doTask((err, message) => {
//   if (err) return console.error(err);
//   console.log(message);
// });


// then Multer will automatically:
// Save the uploaded files to the folder you set in destination (/public/tempMulter in your case).
// Assign their info (including file path) to req.files as an array of objects, like:
// [
//   {
//     fieldname: 'images',
//     originalname: 'question1.png',
//     encoding: '7bit',
//     mimetype: 'image/png',
//     destination: '/public/tempMulter',
//     filename: 'images-17234567890-123456789',
//     path: '/public/tempMulter/images-17234567890-123456789',
//     size: 102400
//   },
//   
// ] without multer req.file in the the controller will fail as it dont know what is inside it actually
// In your createExam controller, you can loop through req.files and attach each file’s path to the corresponding question in your array before saving to DB.