import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Tạo thư mục uploads nếu chưa có
export const uploadDir = path.join(__dirname, '../public/images/products');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}