/**
 * 将 npm 中的前端静态资源复制到 public/vendor，便于内网离线访问。
 */
import { cpSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverRoot = join(__dirname, '..');
const destRoot = join(serverRoot, 'public', 'vendor', 'fontawesome-free');
const pkgRoot = join(serverRoot, 'node_modules', '@fortawesome', 'fontawesome-free');

if (!existsSync(pkgRoot)) {
  console.warn('[copy-vendor] 跳过：未安装 @fortawesome/fontawesome-free（请先 npm install）');
  process.exit(0);
}

mkdirSync(join(destRoot, 'css'), { recursive: true });
mkdirSync(join(destRoot, 'webfonts'), { recursive: true });

cpSync(join(pkgRoot, 'css', 'all.min.css'), join(destRoot, 'css', 'all.min.css'));
cpSync(join(pkgRoot, 'webfonts'), join(destRoot, 'webfonts'), { recursive: true });

console.log('[copy-vendor] 已复制 Font Awesome → public/vendor/fontawesome-free');
