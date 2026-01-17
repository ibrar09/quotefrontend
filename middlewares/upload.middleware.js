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
        params: async (req, file) => {
            // Determine resource type based on file
            let resourceType = 'image';
            if (file.mimetype.includes('video')) resourceType = 'video';
            if (file.mimetype.includes('pdf') || file.mimetype.includes('application')) resourceType = 'raw';

            return {
                folder: 'quotations',
                resource_type: 'auto',
                public_id: file.originalname.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_') + '-' + Date.now(),
            };
        }
    })
    : null;

if (process.env.STORAGE_TYPE === 'CLOUDINARY') {
    console.log('✅ [UPLOAD] Cloudinary Storage configured (Images, Videos, PDFs).');
}

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|pdf|mp4|mov|avi|webm|application/;
    // Relaxed filter to allow PDFs and Videos
    // For stricter control, we can check specific mimetypes
    cb(null, true);
};

// Select storage engine based on config
const storage = process.env.STORAGE_TYPE === 'CLOUDINARY' ? cloudinaryStorage : diskStorage;

export const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: fileFilter
});

