import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import assetController from './asset.controller.js';
import assetService, { ASSETS_ROOT, USER_ASSETS_ROOT, TYPE_FOLDER_MAP } from './asset.service.js';
import { authenticate, adminOnly } from '../../middlewares/auth.middleware.js';

const router = Router();

const IMAGE_EXT = /\.(jpe?g|png|webp|svg|gif)$/i;

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const folder = TYPE_FOLDER_MAP[req.body.type] || 'bikes';
    const dest = path.join(ASSETS_ROOT, folder);
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path
      .basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'vehicle';
    cb(null, `${base}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (IMAGE_EXT.test(file.originalname)) cb(null, true);
    else cb(new Error('Only JPG, PNG, WebP, SVG, and GIF images are allowed'));
  },
});

const userStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(USER_ASSETS_ROOT, { recursive: true });
    cb(null, USER_ASSETS_ROOT);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = `user-${Date.now()}`;
    cb(null, `${base}${ext}`);
  },
});

const userUpload = multer({
  storage: userStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (IMAGE_EXT.test(file.originalname)) cb(null, true);
    else cb(new Error('Only JPG, PNG, WebP, SVG, and GIF images are allowed'));
  },
});

router.get('/vehicles', assetController.listVehicleImages);
router.post(
  '/vehicles/upload',
  authenticate,
  adminOnly,
  upload.single('image'),
  assetController.uploadVehicleImage
);
router.post(
  '/users/upload',
  authenticate,
  userUpload.single('image'),
  assetController.uploadUserPhoto
);

export default router;
