import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'), false);
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, 
    files: 5, 
  },
});

export const uploadToCloudinary = (fileBuffer, originalName, mimetype) => {
  return new Promise((resolve, reject) => {
    const resourceType = mimetype === 'application/pdf' ? 'raw' : 'image';
    
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'rentconnect/identity-documents',
        resource_type: resourceType,
        ...(resourceType === 'image' && {
          transformation: [
            { width: 1000, height: 1000, crop: 'limit', quality: 'auto' }
          ]
        }),
        public_id: `${Date.now()}-${originalName.split('.')[0]}`,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            originalName: originalName,
            fileSize: result.bytes,
            resourceType: result.resource_type
          });
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};

export const handleCloudinaryUpload = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next();
    }

    const uploadPromises = req.files.map(file =>
      uploadToCloudinary(file.buffer, file.originalname, file.mimetype)
    );

    const uploadResults = await Promise.all(uploadPromises);
    
    req.files = req.files.map((file, index) => ({
      ...file,
      path: uploadResults[index].url,
      filename: uploadResults[index].publicId,
      size: uploadResults[index].fileSize
    }));

    next();
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    next(error);
  }
};

export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'File too large. Maximum size is 10MB per file.',
        success: false,
        status: 400
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        message: 'Too many files. Maximum 5 files allowed.',
        success: false,
        status: 400
      });
    }
  }
  
  if (err.message.includes('Invalid file type')) {
    return res.status(400).json({
      message: err.message,
      success: false,
      status: 400
    });
  }

  next(err);
};

export { cloudinary };