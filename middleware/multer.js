import multer from 'multer';
import path from 'path';

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Files will be saved in the 'uploads' folder temporarily
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Generate a unique filename to avoid conflicts
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Create the multer instance
const upload = multer({ storage: storage });

export default upload;