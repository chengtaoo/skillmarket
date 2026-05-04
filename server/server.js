/**
 * 私有化技能市场 - 服务端 v2.0
 * 支持文件上传、ZIP导入导出、文件系统存储
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { readFileSync, writeFileSync, existsSync, mkdirSync, createReadStream, createWriteStream } from 'fs';
import { join, dirname, extname, basename } from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import { createGzip, createGunzip } from 'zlib';
import { pipeline } from 'stream/promisify';
import { promisify } from 'util';

const pipe = promisify(pipeline);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============ 配置 ============
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const DATA_DIR = join(__dirname, 'data');
const UPLOADS_DIR = join(__dirname, 'uploads');      // 技能文件存储目录
const SKILLS_DIR = join(UPLOADS_DIR, 'skills');    // 每个技能的独立目录
const TEMP_DIR = join(__dirname, 'temp');          // 临时文件目录

// 确保目录存在
[DATA_DIR, UPLOADS_DIR, SKILLS_DIR, TEMP_DIR].forEach(dir => {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
});

// ============ Multer 配置（文件上传）============
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, TEMP_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${randomUUID()}${extname(file.originalname)}`)
});
const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB 限制
});

// ============ 数据存储（JSON文件） ============
function readJson(file, defaultValue = []) {
  try {
    if (!existsSync(file)) return defaultValue;
    return JSON.parse(readFileSync(file, 'utf-8'));
  } catch (e) {
    console.error(`读取 ${file} 失败:`, e.message);
    return defaultValue;
  }
}

function writeJson(file, data) {
  try {
    writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error(`写入 ${file} 失败:`, e.message);
    return false;
  }
}

// 初始化数据
function initData() {
  // 初始化用户
  let users = readJson(USERS_FILE, []);
  if (users.length === 0) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    users = [{
      id: randomUUID(),
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
      created_at: new Date().toISOString()
    }];
    writeJson(USERS_FILE, users);
    console.log('✅ 默认管理员已创建: admin / admin123');
  }

  // 初始化分类
  let categories = readJson(CATEGORIES_FILE, null);
  if (!categories) {
    categories = [
      { id: 'ai', name: 'AI工具', icon: '🤖', color: '#6366f1' },
      { id: 'image', name: '图像处理', icon: '🎨', color: '#ec4899' },
      { id: 'video', name: '视频处理', icon: '🎬', color: '#f59e0b' },
      { id: 'dev', name: '开发工具', icon: '💻', color: '#10b981' },
      { id: 'office', name: '办公效率', icon: '📊', color: '#3b82f6' },
      { id: 'knowledge', name: '知识管理', icon: '📚', color: '#8b5cf6' },
      { id: 'data', name: '数据查询', icon: '🔢', color: '#14b8a6' },
      { id: 'search', name: '内网搜索', icon: '🔍', color: '#f97316' },
      { id: 'other', name: '其他', icon: '📦', color: '#6b7280' }
    ];
    writeJson(CATEGORIES_FILE, categories);
  }

  // 初始化示例技能
  let skills = readJson(SKILLS_FILE, []);
  if (skills.length === 0) {
    skills = [
      {
        id: randomUUID(),
        name: '多搜索引擎聚合',
        slug: 'multi-search-engine',
        description: '集成7个中文搜索引擎和9个国际搜索引擎，支持高级搜索操作符、时间过滤、站点搜索、隐私搜索引擎和WolframAlpha计算。',
        author: 'SkillMarket',
        version: '2.1.3',
        category: 'ai',
        tags: '搜索,搜索引擎,多引擎,聚合',
        icon: '🔍',
        featured: 1,
        downloads: 128,
        rating: 4.8,
        installs: 89,
        status: 'approved',
        content: `# multi-search-engine Skill\n\n## 功能特性\n- 支持16个搜索引擎\n- 高级搜索语法\n- 时间范围过滤\n- 隐私保护模式\n\n## 安装命令\n\`\`\`bash\nclawhub install multi-search-engine\n\`\`\`\n`,
        readme: `# 多搜索引擎聚合技能\n\n集成7个中文搜索引擎和9个国际搜索引擎，是进行网络信息检索的强力工具。`,
        files: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    writeJson(SKILLS_FILE, skills);
  }
}

// ============ 文件路径 ============
const SKILLS_FILE = join(DATA_DIR, 'skills.json');
const USERS_FILE = join(DATA_DIR, 'users.json');
const CATEGORIES_FILE = join(DATA_DIR, 'categories.json');

initData();

// ============ Express 配置 ============
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ============ 工具函数 ============

// 递归删除目录
function deleteFolderRecursive(dirPath) {
  if (existsSync(dirPath)) {
    const fs = require('fs');
    fs.readdirSync(dirPath).forEach(file => {
      const curPath = join(dirPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(dirPath);
  }
}

// 获取技能的文件目录
function getSkillDir(skillId) {
  return join(SKILLS_DIR, skillId);
}

// 列出技能目录中的所有文件
function listSkillFiles(skillId) {
  const skillDir = getSkillDir(skillId);
  if (!existsSync(skillDir)) return [];
  
  const fs = require('fs');
  const files = [];
  
  function walk(dir, basePath = '') {
    fs.readdirSync(dir).forEach(file => {
      const fullPath = join(dir, file);
      const relativePath = basePath ? `${basePath}/${file}` : file;
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walk(fullPath, relativePath);
      } else {
        files.push({
          name: file,
          path: relativePath,
          size: stat.size,
          isDirectory: false
        });
      }
    });
  }
  
  walk(skillDir);
  return files;
}

// ============ JWT 中间件 ============
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授权，请先登录' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token无效或已过期' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  next();
};

// ============ 认证路由 ============

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const users = readJson(USERS_FILE, []);
  const user = users.find(u => u.username === username);
  
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

app.get('/api/auth/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body;
  const users = readJson(USERS_FILE, []);
  
  if (users.length > 0) {
    return res.status(403).json({ error: '请联系管理员创建账号' });
  }
  
  const hashedPassword = bcrypt.hashSync(password, 10);
  const id = randomUUID();
  const newUser = { id, username, password: hashedPassword, role: 'admin', created_at: new Date().toISOString() };
  users.push(newUser);
  writeJson(USERS_FILE, users);
  
  const token = jwt.sign({ id, username, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id, username, role: 'admin' } });
});

app.get('/api/users', authenticate, requireAdmin, (req, res) => {
  const users = readJson(USERS_FILE, []);
  res.json({ users: users.map(u => ({ ...u, password: undefined })) });
});

app.post('/api/users', authenticate, requireAdmin, (req, res) => {
  const { username, password, role } = req.body;
  const users = readJson(USERS_FILE, []);
  
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: '用户名已存在' });
  }
  
  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = {
    id: randomUUID(),
    username,
    password: hashedPassword,
    role: role || 'user',
    created_at: new Date().toISOString()
  };
  users.push(newUser);
  writeJson(USERS_FILE, users);
  
  res.json({ success: true, user: { ...newUser, password: undefined } });
});

// ============ 技能路由 ============

app.get('/api/skills', (req, res) => {
  const { category, search, sort, status, featured } = req.query;
  let skills = readJson(SKILLS_FILE, []);
  
  if (status !== 'all') {
    skills = skills.filter(s => s.status === (status || 'approved'));
  }
  
  if (category && category !== 'all') {
    skills = skills.filter(s => s.category === category);
  }
  
  if (search) {
    const q = search.toLowerCase();
    skills = skills.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.description && s.description.toLowerCase().includes(q)) ||
      (s.tags && s.tags.toLowerCase().includes(q))
    );
  }
  
  if (featured === 'true') {
    skills = skills.filter(s => s.featured === 1);
  }
  
  switch (sort) {
    case 'downloads': skills.sort((a, b) => (b.downloads || 0) - (a.downloads || 0)); break;
    case 'rating': skills.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
    case 'newest': skills.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); break;
    case 'installs': skills.sort((a, b) => (b.installs || 0) - (a.installs || 0)); break;
    default: skills.sort((a, b) => (b.featured || 0) - (a.featured || 0) || (b.downloads || 0) - (a.downloads || 0));
  }
  
  // 返回技能列表（不含文件内容，减少传输量）
  const skillSummaries = skills.map(s => ({
    ...s,
    files: undefined,
    fileCount: listSkillFiles(s.id).length
  }));
  
  res.json({ skills: skillSummaries });
});

app.get('/api/skills/:id', (req, res) => {
  const skills = readJson(SKILLS_FILE, []);
  const skill = skills.find(s => s.id === req.params.id || s.slug === req.params.id);
  if (!skill) return res.status(404).json({ error: '技能不存在' });
  
  // 返回完整技能信息，包括文件列表
  const files = listSkillFiles(skill.id);
  res.json({ 
    skill: {
      ...skill,
      files
    }
  });
});

// ============ 文件上传 API ============

// 上传单个文件到技能
app.post('/api/skills/:id/files', authenticate, requireAdmin, upload.single('file'), (req, res) => {
  const skills = readJson(SKILLS_FILE, []);
  const skill = skills.find(s => s.id === req.params.id);
  if (!skill) return res.status(404).json({ error: '技能不存在' });
  
  if (!req.file) {
    return res.status(400).json({ error: '请选择要上传的文件' });
  }
  
  const { path: filePath, originalname, mimetype, size } = req.file;
  const skillDir = getSkillDir(skill.id);
  
  // 创建技能目录
  if (!existsSync(skillDir)) mkdirSync(skillDir, { recursive: true });
  
  // 移动文件到技能目录
  const destPath = join(skillDir, originalname);
  const fs = require('fs');
  fs.renameSync(filePath, destPath);
  
  const newFile = {
    id: randomUUID(),
    name: originalname,
    path: originalname,
    size,
    mimetype,
    created_at: new Date().toISOString()
  };
  
  // 更新技能记录
  skill.files = skill.files || [];
  skill.files.push(newFile);
  skill.updated_at = new Date().toISOString();
  writeJson(SKILLS_FILE, skills);
  
  res.json({ success: true, file: newFile });
});

// 上传多个文件到技能
app.post('/api/skills/:id/files/multiple', authenticate, requireAdmin, upload.array('files', 20), (req, res) => {
  const skills = readJson(SKILLS_FILE, []);
  const skill = skills.find(s => s.id === req.params.id);
  if (!skill) return res.status(404).json({ error: '技能不存在' });
  
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: '请选择要上传的文件' });
  }
  
  const skillDir = getSkillDir(skill.id);
  if (!existsSync(skillDir)) mkdirSync(skillDir, { recursive: true });
  
  const fs = require('fs');
  const uploadedFiles = [];
  
  req.files.forEach(file => {
    const destPath = join(skillDir, file.originalname);
    fs.renameSync(file.path, destPath);
    
    const newFile = {
      id: randomUUID(),
      name: file.originalname,
      path: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      created_at: new Date().toISOString()
    };
    uploadedFiles.push(newFile);
  });
  
  skill.files = skill.files || [];
  skill.files.push(...uploadedFiles);
  skill.updated_at = new Date().toISOString();
  writeJson(SKILLS_FILE, skills);
  
  res.json({ success: true, files: uploadedFiles });
});

// 下载技能文件
app.get('/api/skills/:id/files/:fileId', (req, res) => {
  const skills = readJson(SKILLS_FILE, []);
  const skill = skills.find(s => s.id === req.params.id);
  if (!skill) return res.status(404).json({ error: '技能不存在' });
  
  const file = (skill.files || []).find(f => f.id === req.params.fileId || f.path === req.params.fileId);
  if (!file) return res.status(404).json({ error: '文件不存在' });
  
  const filePath = join(getSkillDir(skill.id), file.path);
  if (!existsSync(filePath)) return res.status(404).json({ error: '文件已丢失' });
  
  res.download(filePath, file.name);
});

// 删除技能文件
app.delete('/api/skills/:id/files/:fileId', authenticate, requireAdmin, (req, res) => {
  const skills = readJson(SKILLS_FILE, []);
  const skill = skills.find(s => s.id === req.params.id);
  if (!skill) return res.status(404).json({ error: '技能不存在' });
  
  const fileIndex = (skill.files || []).findIndex(f => f.id === req.params.fileId);
  if (fileIndex === -1) return res.status(404).json({ error: '文件不存在' });
  
  const file = skill.files[fileIndex];
  const filePath = join(getSkillDir(skill.id), file.path);
  
  const fs = require('fs');
  if (existsSync(filePath)) fs.unlinkSync(filePath);
  
  skill.files.splice(fileIndex, 1);
  skill.updated_at = new Date().toISOString();
  writeJson(SKILLS_FILE, skills);
  
  res.json({ success: true });
});

// ============ ZIP 导入/导出 API ============

// 导出技能为 ZIP 包
app.get('/api/skills/:id/export', authenticate, requireAdmin, async (req, res) => {
  const skills = readJson(SKILLS_FILE, []);
  const skill = skills.find(s => s.id === req.params.id);
  if (!skill) return res.status(404).json({ error: '技能不存在' });
  
  const skillDir = getSkillDir(skill.id);
  const zipPath = join(TEMP_DIR, `${skill.slug}-${skill.version}.zip`);
  
  // 使用 Node.js 内置功能创建 ZIP
  const fs = require('fs');
  const { createArchive } = await import('tgz');
  
  // 准备导出数据
  const exportData = {
    manifest: {
      name: skill.name,
      slug: skill.slug,
      version: skill.version,
      author: skill.author,
      description: skill.description,
      category: skill.category,
      tags: skill.tags,
      icon: skill.icon,
      content: skill.content,
      readme: skill.readme,
      created_at: skill.created_at
    },
    files: []
  };
  
  // 列出所有文件
  if (existsSync(skillDir)) {
    const listFiles = (dir, basePath = '') => {
      fs.readdirSync(dir).forEach(file => {
        const fullPath = join(dir, file);
        const relativePath = basePath ? `${basePath}/${file}` : file;
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          listFiles(fullPath, relativePath);
        } else {
          exportData.files.push({
            path: relativePath,
            content: fs.readFileSync(fullPath, 'utf-8')
          });
        }
      });
    };
    listFiles(skillDir);
  }
  
  // 创建临时 JSON 文件
  const tempJsonPath = join(TEMP_DIR, `${randomUUID()}-export.json`);
  fs.writeFileSync(tempJsonPath, JSON.stringify(exportData, null, 2));
  
  // 创建 ZIP（包含 manifest.json 和所有文件）
  const archiver = (await import('archiver')).default;
  const archive = archiver('zip', { zlib: { level: 9 } });
  const output = createWriteStream(zipPath);
  
  archive.pipe(output);
  
  // 添加 manifest
  archive.append(JSON.stringify(exportData.manifest, null, 2), { name: 'manifest.json' });
  
  // 添加 skill.md
  if (skill.content) {
    archive.append(skill.content, { name: 'skill.md' });
  }
  
  // 添加 README.md
  if (skill.readme) {
    archive.append(skill.readme, { name: 'README.md' });
  }
  
  // 添加所有文件
  exportData.files.forEach(file => {
    archive.append(file.content, { name: `files/${file.path}` });
  });
  
  await archive.finalize();
  await new Promise(resolve => output.on('close', resolve));
  
  // 清理临时 JSON
  fs.unlinkSync(tempJsonPath);
  
  // 发送 ZIP
  res.download(zipPath, `${skill.slug}-${skill.version}.zip`, () => {
    // 下载完成后删除临时 ZIP
    if (existsSync(zipPath)) fs.unlinkSync(zipPath);
  });
});

// 导入 ZIP 包
app.post('/api/skills/import', authenticate, requireAdmin, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '请选择要导入的 ZIP 文件' });
  }
  
  const fs = require('fs');
  const zipPath = req.file.path;
  const extractDir = join(TEMP_DIR, `import-${randomUUID()}`);
  
  try {
    // 解压 ZIP
    mkdirSync(extractDir, { recursive: true });
    const { createGunzip } = await import('zlib');
    const { entry } = await import('unzipper');
    
    await new Promise((resolve, reject) => {
      createReadStream(zipPath)
        .pipe(entry())
        .on('finish', resolve)
        .on('error', reject);
    });
    
    // 使用 unzipper 解压
    await new Promise((resolve, reject) => {
      fs.createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: extractDir }))
        .on('close', resolve)
        .on('error', reject);
    });
    
    // 读取 manifest.json
    const manifestPath = join(extractDir, 'manifest.json');
    if (!existsSync(manifestPath)) {
      throw new Error('无效的技能包：缺少 manifest.json');
    }
    
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    
    // 检查 slug 是否已存在
    const skills = readJson(SKILLS_FILE, []);
    if (skills.find(s => s.slug === manifest.slug)) {
      throw new Error(`技能 slug "${manifest.slug}" 已存在，请先删除或修改`);
    }
    
    // 创建技能
    const skillId = randomUUID();
    const skillDir = getSkillDir(skillId);
    mkdirSync(skillDir, { recursive: true });
    
    // 复制文件
    const filesDir = join(extractDir, 'files');
    const importedFiles = [];
    
    if (existsSync(filesDir)) {
      const copyRecursive = (src, dest) => {
        fs.readdirSync(src).forEach(file => {
          const srcPath = join(src, file);
          const destPath = join(dest, file);
          if (fs.statSync(srcPath).isDirectory()) {
            mkdirSync(destPath, { recursive: true });
            copyRecursive(srcPath, destPath);
          } else {
            fs.copyFileSync(srcPath, destPath);
            importedFiles.push({
              id: randomUUID(),
              name: file,
              path: file,
              size: fs.statSync(destPath).size,
              created_at: new Date().toISOString()
            });
          }
        });
      };
      copyRecursive(filesDir, skillDir);
    }
    
    // 读取 skill.md 和 README.md
    const skillMdPath = join(extractDir, 'skill.md');
    const readmeMdPath = join(extractDir, 'README.md');
    
    const newSkill = {
      id: skillId,
      name: manifest.name || manifest.slug,
      slug: manifest.slug,
      description: manifest.description || '',
      author: manifest.author || '',
      version: manifest.version || '1.0.0',
      category: manifest.category || 'other',
      tags: manifest.tags || '',
      icon: manifest.icon || '📦',
      content: existsSync(skillMdPath) ? fs.readFileSync(skillMdPath, 'utf-8') : '',
      readme: existsSync(readmeMdPath) ? fs.readFileSync(readmeMdPath, 'utf-8') : '',
      files: importedFiles,
      featured: 0,
      downloads: 0,
      rating: 5.0,
      installs: 0,
      status: 'approved',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    skills.push(newSkill);
    writeJson(SKILLS_FILE, skills);
    
    // 清理临时文件
    deleteFolderRecursive(extractDir);
    fs.unlinkSync(zipPath);
    
    res.json({ success: true, skill: newSkill });
    
  } catch (error) {
    // 清理临时文件
    if (existsSync(extractDir)) deleteFolderRecursive(extractDir);
    if (existsSync(zipPath)) fs.unlinkSync(zipPath);
    
    res.status(400).json({ error: error.message });
  }
});

// ============ 技能 CRUD ============

app.post('/api/skills', authenticate, requireAdmin, (req, res) => {
  const { name, slug, description, author, version, category, tags, icon, content, readme } = req.body;
  
  if (!name || !slug) {
    return res.status(400).json({ error: '名称和slug是必填项' });
  }
  
  const skills = readJson(SKILLS_FILE, []);
  if (skills.find(s => s.slug === slug)) {
    return res.status(400).json({ error: 'Slug已存在' });
  }
  
  const skillId = randomUUID();
  const skillDir = getSkillDir(skillId);
  mkdirSync(skillDir, { recursive: true });
  
  const newSkill = {
    id: skillId,
    name,
    slug,
    description: description || '',
    author: author || '',
    version: version || '1.0.0',
    category: category || 'other',
    tags: tags || '',
    icon: icon || '📦',
    content: content || '',
    readme: readme || '',
    files: [],
    featured: 0,
    downloads: 0,
    rating: 5.0,
    installs: 0,
    status: 'approved',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  skills.push(newSkill);
  writeJson(SKILLS_FILE, skills);
  
  res.json({ success: true, skill: newSkill });
});

app.put('/api/skills/:id', authenticate, requireAdmin, (req, res) => {
  const skills = readJson(SKILLS_FILE, []);
  const idx = skills.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '技能不存在' });
  
  const { name, description, author, version, category, tags, icon, content, readme, status, featured } = req.body;
  
  skills[idx] = {
    ...skills[idx],
    name: name || skills[idx].name,
    description: description !== undefined ? description : skills[idx].description,
    author: author !== undefined ? author : skills[idx].author,
    version: version || skills[idx].version,
    category: category || skills[idx].category,
    tags: tags !== undefined ? tags : skills[idx].tags,
    icon: icon || skills[idx].icon,
    content: content !== undefined ? content : skills[idx].content,
    readme: readme !== undefined ? readme : skills[idx].readme,
    status: status || skills[idx].status,
    featured: featured !== undefined ? featured : skills[idx].featured,
    updated_at: new Date().toISOString()
  };
  
  writeJson(SKILLS_FILE, skills);
  res.json({ success: true, skill: skills[idx] });
});

app.delete('/api/skills/:id', authenticate, requireAdmin, (req, res) => {
  let skills = readJson(SKILLS_FILE, []);
  const idx = skills.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '技能不存在' });
  
  // 删除技能文件目录
  const skillDir = getSkillDir(req.params.id);
  if (existsSync(skillDir)) deleteFolderRecursive(skillDir);
  
  skills = skills.filter(s => s.id !== req.params.id);
  writeJson(SKILLS_FILE, skills);
  res.json({ success: true });
});

// 下载技能包（JSON 格式，用于客户端）
app.get('/api/skills/:id/download', (req, res) => {
  const skills = readJson(SKILLS_FILE, []);
  const skill = skills.find(s => s.id === req.params.id || s.slug === req.params.id);
  if (!skill) return res.status(404).json({ error: '技能不存在' });
  
  skill.downloads = (skill.downloads || 0) + 1;
  writeJson(SKILLS_FILE, skills);
  
  const packageFile = {
    name: skill.name,
    slug: skill.slug,
    version: skill.version,
    author: skill.author,
    description: skill.description,
    category: skill.category,
    tags: skill.tags ? skill.tags.split(',') : [],
    icon: skill.icon,
    content: skill.content,
    readme: skill.readme,
    files: []
  };
  
  res.setHeader('Content-Disposition', `attachment; filename="${skill.slug}.skill.json`);
  res.setHeader('Content-Type', 'application/json');
  res.json(packageFile);
});

// 记录安装
app.post('/api/install', (req, res) => {
  const { skillId } = req.body;
  const skills = readJson(SKILLS_FILE, []);
  const idx = skills.findIndex(s => s.id === skillId);
  if (idx !== -1) {
    skills[idx].installs = (skills[idx].installs || 0) + 1;
    writeJson(SKILLS_FILE, skills);
  }
  res.json({ success: true });
});

// ============ 分类路由 ============
app.get('/api/categories', (req, res) => {
  const categories = readJson(CATEGORIES_FILE, []);
  res.json({ categories });
});

// ============ 统计路由 ============
app.get('/api/stats', (req, res) => {
  const skills = readJson(SKILLS_FILE, []).filter(s => s.status === 'approved');
  const totalDownloads = skills.reduce((sum, s) => sum + (s.downloads || 0), 0);
  const totalInstalls = skills.reduce((sum, s) => sum + (s.installs || 0), 0);
  
  res.json({
    skills: skills.length,
    downloads: totalDownloads,
    installs: totalInstalls
  });
});

// ============ 客户端协议路由 ============
app.get('/.well-known/skillmarket', (req, res) => {
  res.json({
    version: '1.0',
    name: 'SkillMarket',
    url: req.protocol + '://' + req.get('host'),
    capabilities: ['search', 'install', 'publish', 'file-upload', 'zip-import']
  });
});

app.post('/api/v1/install', (req, res) => {
  const { slug, clientType, clientVersion } = req.body;
  const skills = readJson(SKILLS_FILE, []);
  const skill = skills.find(s => s.slug === slug && s.status === 'approved');
  
  if (!skill) {
    return res.status(404).json({ error: '技能不存在或未审核' });
  }
  
  const idx = skills.findIndex(s => s.id === skill.id);
  skills[idx].installs = (skills[idx].installs || 0) + 1;
  writeJson(SKILLS_FILE, skills);
  
  res.json({
    success: true,
    skill: {
      name: skill.name,
      slug: skill.slug,
      version: skill.version,
      content: skill.content
    }
  });
});

app.get('/api/v1/search', (req, res) => {
  const { q, category, limit } = req.query;
  let skills = readJson(SKILLS_FILE, []).filter(s => s.status === 'approved');
  
  if (q) {
    const query = q.toLowerCase();
    skills = skills.filter(s =>
      s.name.toLowerCase().includes(query) ||
      (s.description && s.description.toLowerCase().includes(query)) ||
      (s.tags && s.tags.toLowerCase().includes(query))
    );
  }
  
  if (category) {
    skills = skills.filter(s => s.category === category);
  }
  
  skills.sort((a, b) => (b.featured || 0) - (a.featured || 0) || (b.downloads || 0) - (a.downloads || 0));
  skills = skills.slice(0, parseInt(limit) || 20);
  
  res.json({ skills });
});

// ============ 静态文件服务 ============
const STATIC_DIR = join(__dirname, '..');

app.get('/', (req, res) => {
  res.sendFile(join(STATIC_DIR, 'index.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(join(STATIC_DIR, 'index.html'));
});

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(join(STATIC_DIR, 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║     🎉 私有化技能市场服务器已启动 (v2.0)                  ║
║                                                          ║
║     📍 地址: http://localhost:${PORT}                       ║
║     🌐 协议: http://localhost:${PORT}/.well-known/skillmarket
║                                                          ║
║     🔐 默认管理员账号:                                    ║
║        用户名: admin                                     ║
║        密码: admin123                                    ║
║                                                          ║
║     ✨ 新功能：                                          ║
║        📁 支持上传 Python/JS 等代码文件                  ║
║        📦 支持 ZIP 包导入导出                            ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
  `);
});
