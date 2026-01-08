const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json({limit: '50mb'})); // Increased limit for big page saves

// Uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Database
const pool = new Pool({
    user: process.env.DB_USER, host: process.env.DB_HOST,
    database: process.env.DB_NAME, password: process.env.DB_PASS, port: 5432,
});

// Auth
const client = jwksClient({ jwksUri: 'http://keycloak:8080/realms/soes-realm/protocol/openid-connect/certs' });
function getKey(header, callback) {
    client.getSigningKey(header.kid, (err, key) => callback(err, key ? key.getPublicKey() : null));
}
const checkAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });
    const token = authHeader.split(' ')[1];
    jwt.verify(token, getKey, { algorithms: ['RS256'] }, (err, decoded) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = decoded; next();
    });
};

// --- ROUTES ---

// 1. MENU
app.get('/api/menu', async (req, res) => {
    const { rows } = await pool.query('SELECT structure FROM site_menu WHERE id = 1');
    res.json(rows[0]?.structure || []);
});
app.post('/api/menu', checkAuth, async (req, res) => {
    await pool.query('INSERT INTO site_menu (id, structure) VALUES (1, $1) ON CONFLICT (id) DO UPDATE SET structure = $1', [JSON.stringify(req.body.structure)]);
    res.json({ success: true });
});

// 2. PAGES (BUILDER)
app.get('/api/pages', async (req, res) => { // List
    const { rows } = await pool.query('SELECT id, slug, title, is_visible FROM custom_pages ORDER BY id ASC');
    res.json(rows);
});
app.get('/api/pages/:slug', async (req, res) => { // Single
    const { rows } = await pool.query('SELECT * FROM custom_pages WHERE slug = $1', [req.params.slug]);
    if (rows.length > 0) res.json(rows[0]); else res.status(404).json({ error: 'Page not found' });
});
app.post('/api/pages', checkAuth, async (req, res) => { // Create/Update
    const { id, slug, title, is_visible, blocks } = req.body;
    if (id) {
        await pool.query('UPDATE custom_pages SET slug=$1, title=$2, is_visible=$3, blocks=$4 WHERE id=$5', [slug, title, is_visible, JSON.stringify(blocks), id]);
    } else {
        await pool.query('INSERT INTO custom_pages (slug, title, is_visible, blocks) VALUES ($1, $2, $3, $4)', [slug, title, is_visible, JSON.stringify(blocks)]);
    }
    res.json({ success: true });
});
app.delete('/api/pages/:id', checkAuth, async (req, res) => {
    await pool.query('DELETE FROM custom_pages WHERE id = $1', [req.params.id]);
    res.json({ success: true });
});

// 3. EXISTING ROUTES
app.get('/api/content/:page', async (req, res) => {
    const { rows } = await pool.query('SELECT content FROM site_content WHERE page_name = $1', [req.params.page]);
    res.json(rows.length > 0 ? rows[0].content : {});
});
app.post('/api/content/:page', checkAuth, async (req, res) => {
    await pool.query('INSERT INTO site_content (page_name, content) VALUES ($1, $2) ON CONFLICT (page_name) DO UPDATE SET content = $2', [req.params.page, req.body.content]);
    res.json({ success: true });
});
app.get('/api/settings', async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM site_settings'); res.json(rows);
});
app.post('/api/settings', checkAuth, async (req, res) => {
    await pool.query('UPDATE site_settings SET value = $1 WHERE key = $2', [req.body.value, req.body.key]); res.json({ success: true });
});
app.post('/api/upload', checkAuth, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).send('No file');
    res.json({ filePath: '/uploads/' + req.file.filename });
});
app.post('/api/contact', async (req, res) => {
    const { name, surname, email, message } = req.body;
    await pool.query('INSERT INTO contact_messages (name, surname, email, message) VALUES ($1, $2, $3, $4)', [name, surname, email, message]);
    res.json({ success: true });
});
app.get('/api/messages', checkAuth, async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM contact_messages ORDER BY created_at DESC'); res.json(rows);
});
app.delete('/api/messages/:id', checkAuth, async (req, res) => {
    await pool.query('DELETE FROM contact_messages WHERE id = $1', [req.params.id]); res.json({ success: true });
});

app.listen(3000, () => console.log('API Running on 3000'));