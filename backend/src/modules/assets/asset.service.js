import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ASSETS_ROOT = path.resolve(__dirname, '../../../../apps/web/public/assets/vehicles');
export const USER_ASSETS_ROOT = path.resolve(__dirname, '../../../../apps/web/public/assets/users');

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif']);

export const TYPE_FOLDER_MAP = {
  bike: 'bikes',
  car: 'cars',
  ev: 'ev',
  scooter: 'scooters',
};

const walkDir = async (dir, base = '') => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await walkDir(fullPath, rel)));
      continue;
    }

    if (!IMAGE_EXT.has(path.extname(entry.name).toLowerCase())) continue;

    files.push({
      path: `/assets/vehicles/${rel.replace(/\\/g, '/')}`,
      name: entry.name,
      folder: base.includes('/') ? base.split('/')[0] : base || 'root',
    });
  }

  return files;
};

class AssetService {
  async listVehicleImages() {
    await fs.mkdir(ASSETS_ROOT, { recursive: true });
    const images = await walkDir(ASSETS_ROOT);
    return images.sort((a, b) => a.path.localeCompare(b.path));
  }

  getUploadFolder(type) {
    return TYPE_FOLDER_MAP[type] || type || 'bikes';
  }

  buildPublicPath(folder, filename) {
    return `/assets/vehicles/${folder}/${filename}`;
  }

  buildUserPublicPath(filename) {
    return `/assets/users/${filename}`;
  }
}

export default new AssetService();
