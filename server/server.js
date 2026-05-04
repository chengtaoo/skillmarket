/**
 * 私有化技能市场 - 服务端
 * 使用 JSON 文件存储，无需数据库
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============ 配置 ============
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const DATA_DIR = join(__dirname, 'data');
const SKILLS_FILE = join(DATA_DIR, 'skills.json');
const USERS_FILE = join(DATA_DIR, 'users.json');
const CATEGORIES_FILE = join(DATA_DIR, 'categories.json');

// 确保数据目录存在
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

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
        content: `# multi-search-engine Skill

## 功能特性
- 支持16个搜索引擎
- 高级搜索语法
- 时间范围过滤
- 隐私保护模式

## 安装命令
\`\`\`bash
clawhub install multi-search-engine
\`\`\`
`,
        readme: `# 多搜索引擎聚合技能

集成7个中文搜索引擎和9个国际搜索引擎，是进行网络信息检索的强力工具。`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: randomUUID(),
        name: '企业工商信息查询',
        slug: 'plugin-enterprise-search',
        description: '支持查询企业基本信息、工商信息、投资信息、资质证书、股权信息等。',
        author: 'SkillMarket',
        version: '1.0.0',
        category: 'dev',
        tags: '企业查询,工商信息,天眼查',
        icon: '🏢',
        featured: 1,
        downloads: 85,
        rating: 4.9,
        installs: 62,
        status: 'approved',
        content: `# 企业工商信息查询 Skill

## 功能
- 企业基本信息查询
- 工商信息展示
- 投资关系图谱
- 股权结构分析`,
        readme: `# 企业工商信息查询

支持多维度企业信息查询，是商务调研和法律尽职调查的得力助手。`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: randomUUID(),
        name: 'AI视频分析',
        slug: 'analyze-video-by-qwen',
        description: '使用阿里云 Qwen 3.5 Plus 多模态模型对视频进行智能分析，提取关键帧和内容理解。',
        author: 'SkillMarket',
        version: '1.0.0',
        category: 'video',
        tags: '视频分析,AI,Qwen,多模态',
        icon: '🎥',
        featured: 0,
        downloads: 56,
        rating: 4.6,
        installs: 34,
        status: 'approved',
        content: `# AI视频分析 Skill

## 功能
- 视频关键帧提取
- 内容智能理解
- 语音转文字
- 场景识别`,
        readme: `# AI视频分析

基于阿里云通义千问模型的视频内容分析工具。`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    writeJson(SKILLS_FILE, skills);
  }
}

initData();

// ============ Express 配置 ============
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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

// 登录
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

// 获取当前用户
app.get('/api/auth/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// 注册（仅第一个用户）
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

// 获取用户列表
app.get('/api/users', authenticate, requireAdmin, (req, res) => {
  const users = readJson(USERS_FILE, []);
  res.json({ users: users.map(u => ({ ...u, password: undefined })) });
});

// 创建用户
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

// 获取技能列表
app.get('/api/skills', (req, res) => {
  const { category, search, sort, status, featured } = req.query;
  let skills = readJson(SKILLS_FILE, []);
  
  // 默认只显示已审核的技能
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
  
  // 排序
  switch (sort) {
    case 'downloads': skills.sort((a, b) => (b.downloads || 0) - (a.downloads || 0)); break;
    case 'rating': skills.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
    case 'newest': skills.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); break;
    case 'installs': skills.sort((a, b) => (b.installs || 0) - (a.installs || 0)); break;
    default: skills.sort((a, b) => (b.featured || 0) - (a.featured || 0) || (b.downloads || 0) - (a.downloads || 0));
  }
  
  res.json({ skills });
});

// 获取单个技能
app.get('/api/skills/:id', (req, res) => {
  const skills = readJson(SKILLS_FILE, []);
  const skill = skills.find(s => s.id === req.params.id || s.slug === req.params.id);
  if (!skill) return res.status(404).json({ error: '技能不存在' });
  res.json({ skill });
});

// 上传技能（需管理员）
app.post('/api/skills', authenticate, requireAdmin, (req, res) => {
  const { name, slug, description, author, version, category, tags, icon, content, readme } = req.body;
  
  if (!name || !slug || !content) {
    return res.status(400).json({ error: '名称、slug和内容是必填项' });
  }
  
  const skills = readJson(SKILLS_FILE, []);
  if (skills.find(s => s.slug === slug)) {
    return res.status(400).json({ error: 'Slug已存在，请使用唯一的slug' });
  }
  
  const newSkill = {
    id: randomUUID(),
    name,
    slug,
    description: description || '',
    author: author || '',
    version: version || '1.0.0',
    category: category || 'other',
    tags: tags || '',
    icon: icon || '📦',
    content,
    readme: readme || '',
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

// 更新技能（需管理员）
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

// 删除技能（需管理员）
app.delete('/api/skills/:id', authenticate, requireAdmin, (req, res) => {
  let skills = readJson(SKILLS_FILE, []);
  const idx = skills.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '技能不存在' });
  
  skills = skills.filter(s => s.id !== req.params.id);
  writeJson(SKILLS_FILE, skills);
  res.json({ success: true });
});

// 下载技能包
app.get('/api/skills/:id/download', (req, res) => {
  const skills = readJson(SKILLS_FILE, []);
  const skill = skills.find(s => s.id === req.params.id || s.slug === req.params.id);
  if (!skill) return res.status(404).json({ error: '技能不存在' });
  
  // 增加下载计数
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

// .well-known/skillmarket 协议端点
app.get('/.well-known/skillmarket', (req, res) => {
  res.json({
    version: '1.0',
    name: 'SkillMarket',
    url: req.protocol + '://' + req.get('host'),
    capabilities: ['search', 'install', 'publish']
  });
});

// 客户端安装协议
app.post('/api/v1/install', (req, res) => {
  const { slug, clientType, clientVersion } = req.body;
  const skills = readJson(SKILLS_FILE, []);
  const skill = skills.find(s => s.slug === slug && s.status === 'approved');
  
  if (!skill) {
    return res.status(404).json({ error: '技能不存在或未审核' });
  }
  
  // 记录安装
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

// 客户端搜索协议
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

// ============ 静态文件服务（前端页面）===========
const STATIC_DIR = join(__dirname, '..');

// 根路径返回 index.html
app.get('/', (req, res) => {
  res.sendFile(join(STATIC_DIR, 'index.html'));
});

// index.html 路径也返回 index.html
app.get('/index.html', (req, res) => {
  res.sendFile(join(STATIC_DIR, 'index.html'));
});

// SPA 路由支持（所有非API路径返回 index.html）
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(join(STATIC_DIR, 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║     🎉 私有化技能市场服务器已启动                         ║
║                                                          ║
║     📍 地址: http://localhost:${PORT}                       ║
║     🌐 协议: http://localhost:${PORT}/.well-known/skillmarket
║                                                          ║
║     🔐 默认管理员账号:                                    ║
║        用户名: admin                                     ║
║        密码: admin123                                    ║
║                                                          ║
║     ⚠️  请在生产环境中修改 JWT_SECRET 和管理员密码       ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
  `);
});
