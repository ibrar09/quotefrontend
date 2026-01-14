import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';
dotenv.config();

console.log('🔧 [UPLOAD] Initializing Upload Middleware...');

// Configure Cloudinary
if (process.env.STORAGE_TYPE === 'CLOUDINARY') {
    console.log('☁️ [UPLOAD] Using Cloudinary Storage');
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        console.error('❌ [UPLOAD] Cloudinary credentials missing in .env!');
    }

    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
} else {
    console.log('📂 [UPLOAD] Using Local Disk Storage');
}

// Local Storage Config
const uploadDir = 'uploads/quotations';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Cloudinary Storage Config
const cloudinaryStorage = process.env.STORAGE_TYPE === 'CLOUDINARY'
    ? new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: 'quotations',
            allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
            public_id: (req, file) => {
                const name = file.originalname.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
                return `${name}-${Date.now()}`;
            }
        }
    })
    : null;

if (process.env.STORAGE_TYPE === 'CLOUDINARY') {
    console.log('✅ [UPLOAD] Cloudinary Storage configured with allowedFormats.');
}

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        console.warn(`⚠️ [UPLOAD] Blocked invalid file type: ${file.originalname}`);
        cb(new Error('Only images (jpg, jpeg, png, webp) are allowed'));
    }
};

// Select storage engine based on config
const storage = process.env.STORAGE_TYPE === 'CLOUDINARY' ? cloudinaryStorage : diskStorage;

export const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: fileFilter
});

