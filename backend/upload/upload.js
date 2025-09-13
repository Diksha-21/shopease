import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Product from '../model/product.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadConfigs = {
  profile: {
    directory: path.join('uploads', 'profile-images'),
    prefix: 'profile-',
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
    maxSize: 5 * 1024 * 1024 // 5MB
  },
  product: {
    directory: path.join('uploads', 'product-images'),
    prefix: 'product-',
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
    maxSize: 10 * 1024 * 1024 // 10MB
  }
};

const createStorage = (config) => {
  const uploadDir = path.join(__dirname, config.directory);
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const originalname = path.parse(file.originalname).name;
      const ext = path.extname(file.originalname).toLowerCase();
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `${config.prefix}${originalname}-${uniqueSuffix}${ext}`);
    }
  });
};

export const createUploader = (type = 'profile', mode = 'single', fieldName = 'image') => {
  const config = uploadConfigs[type];

  if (!config) {
    throw new Error(`Invalid upload type: ${type}`);
  }

  const upload = multer({
    storage: createStorage(config),
    limits: { fileSize: config.maxSize },
    fileFilter: (req, file, cb) => {
      if (config.allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`Only ${config.allowedTypes.join(', ')} files are allowed`));
      }
    }
  });

  return (req, res, next) => {
    const uploadHandler = mode === 'multiple'
      ? upload.array(fieldName, 5)
      : upload.single(fieldName);

    uploadHandler(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ success: false, message: err.message });
      } else if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      next();
    });
  };
};


export const handleProductImages = (req, res, next) => {
  const upload = createUploader('product', 'multiple', 'images');
  
  upload(req, res, (err) => {
    if (err) {
      if (req.files) {
        req.files.forEach(file => {
          fs.unlinkSync(file.path);
        });
      }
      return res.status(400).json({ 
        success: false,
        message: err.message 
      });
    }
    
    if (req.method === 'POST' && (!req.files || req.files.length === 0)) {
      return res.status(400).json({
        success: false,
        message: "At least one product image is required"
      });
    }
    
    next();
  });
};

export const deleteFile = (filename, type = 'product') => {
  const config = uploadConfigs[type];
  const fullPath = path.join(__dirname, config.directory, filename);
  
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    return true;
  }
  return false;
};

export const cleanupOrphanedFiles = async (type = 'product') => {
  const config = uploadConfigs[type];
  const dirPath = path.join(__dirname, config.directory);
  
  try {
    const files = fs.readdirSync(dirPath);
    const products = await Product.find({});
    const usedImages = products.flatMap(p => p.images);
    
    files.forEach(file => {
      if (!usedImages.includes(file)) {
        fs.unlinkSync(path.join(dirPath, file));
        console.log(`Deleted orphaned file: ${file}`);
      }
    });
  } catch (err) {
    console.error('Cleanup error:', err);
  }
};

export default createUploader;