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
app.use(express.json({limit: '50mb'})); 
app.set('trust proxy', true);

// Database
const pool = new Pool({
    user: process.env.DB_USER, host: process.env.DB_HOST,
    database: process.env.DB_NAME, password: process.env.DB_PASS, port: 5432,
});

// Uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let folder = uploadDir;
        if(req.body.folder) {
            const safeFolder = req.body.folder.replace(/[^a-zA-Z0-9_-]/g, '');
            folder = path.join(uploadDir, safeFolder);
            if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
        }
        cb(null, folder);
    },
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

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

// 1. MENU & FOOTER
app.get('/api/menu', async (req, res) => {
    const { rows } = await pool.query('SELECT structure FROM site_menu WHERE id = 1');
    res.json(rows[0]?.structure || []);
});
app.post('/api/menu', checkAuth, async (req, res) => {
    await pool.query('INSERT INTO site_menu (id, structure) VALUES (1, $1) ON CONFLICT (id) DO UPDATE SET structure = $1', [JSON.stringify(req.body.structure)]);
    res.json({ success: true });
});
app.get('/api/footer', async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM footer_links ORDER BY position ASC');
    res.json(rows);
});
app.post('/api/footer', checkAuth, async (req, res) => {
    const links = req.body;
    await pool.query('DELETE FROM footer_links');
    for(const l of links) {
        await pool.query('INSERT INTO footer_links (label, url, section, position) VALUES ($1, $2, $3, $4)', [l.label, l.url, l.section, l.position]);
    }
    res.json({ success: true });
});

// 2. PAGES (BUILDER)
app.get('/api/pages', async (req, res) => {
    const { rows } = await pool.query('SELECT id, slug, title, is_visible, start_time, end_time, page_password, meta_desc, meta_keywords FROM custom_pages ORDER BY id ASC');
    res.json(rows);
});
app.get('/api/pages/:slug', async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM custom_pages WHERE slug = $1', [req.params.slug]);
    if (rows.length > 0) {
        const page = rows[0];
        const now = new Date();
        if (page.start_time && new Date(page.start_time) > now) return res.status(404).json({ error: 'Page not yet available' });
        if (page.end_time && new Date(page.end_time) < now) return res.status(404).json({ error: 'Page expired' });
        
        const providedPass = req.query.pwd;
        if(page.page_password && page.page_password !== '') {
            if(providedPass !== page.page_password) {
                return res.json({ title: page.title, is_protected: true });
            }
        }
        res.json(page);
    } else {
        res.status(404).json({ error: 'Page not found' });
    }
});
app.post('/api/pages', checkAuth, async (req, res) => {
    const { id, slug, title, is_visible, blocks, start_time, end_time, page_password, meta_desc, meta_keywords } = req.body;
    if (id) {
        await pool.query('UPDATE custom_pages SET slug=$1, title=$2, is_visible=$3, blocks=$4, start_time=$5, end_time=$6, page_password=$7, meta_desc=$8, meta_keywords=$9 WHERE id=$10', 
            [slug, title, is_visible, JSON.stringify(blocks), start_time || null, end_time || null, page_password || null, meta_desc, meta_keywords, id]);
    } else {
        await pool.query('INSERT INTO custom_pages (slug, title, is_visible, blocks, start_time, end_time, page_password, meta_desc, meta_keywords) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', 
            [slug, title, is_visible, JSON.stringify(blocks), start_time || null, end_time || null, page_password || null, meta_desc, meta_keywords]);
    }
    res.json({ success: true });
});
app.delete('/api/pages/:id', checkAuth, async (req, res) => {
    await pool.query('DELETE FROM custom_pages WHERE id = $1', [req.params.id]);
    res.json({ success: true });
});

// 3. COMPETITION / CVs
app.post('/api/cv', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Nessun file caricato' });
        
        const { name, surname, email, phone, city, zip_code, address, birth_place, tax_code, page_slug } = req.body;
        const ip = req.ip || req.connection.remoteAddress;

        if(!name || !surname || !email || !tax_code) {
             if(req.file) fs.unlinkSync(req.file.path);
             return res.status(400).json({ error: 'Campi obbligatori mancanti.' });
        }
        if (req.file.mimetype !== 'application/pdf') {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'Formato non valido. Solo PDF ammessi.' });
        }

        const sRes = await pool.query('SELECT * FROM site_settings WHERE key IN (\'cv_limit\', \'cv_max_size_mb\')');
        const limitSetting = sRes.rows.find(x => x.key === 'cv_limit')?.value || 30;
        const sizeSetting = sRes.rows.find(x => x.key === 'cv_max_size_mb')?.value || 5;

        if (req.file.size > parseInt(sizeSetting) * 1024 * 1024) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: `File troppo grande. Max ${sizeSetting}MB.` });
        }

        const dupCheck = await pool.query('SELECT id FROM competition_cvs WHERE page_slug = $1 AND (tax_code = $2 OR email = $3)', [page_slug, tax_code, email]);
        if(dupCheck.rows.length > 0) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'Candidatura già presente per questo codice fiscale o email.' });
        }

        const countRes = await pool.query('SELECT COUNT(*) FROM competition_cvs WHERE page_slug = $1', [page_slug]);
        if (parseInt(countRes.rows[0].count) >= parseInt(limitSetting)) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'Numero massimo di candidature raggiunto.' });
        }

        let dbPath = '/uploads/' + req.file.filename;
        if(req.body.folder) {
             const safeFolder = req.body.folder.replace(/[^a-zA-Z0-9_-]/g, '');
             dbPath = '/uploads/' + safeFolder + '/' + req.file.filename;
        }

        await pool.query(`INSERT INTO competition_cvs 
            (submission_datetime, surname, name, tax_code, birth_place, address, zip_code, city, email, phone, ip_address, page_slug, file_path) 
            VALUES (NOW(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`, 
            [surname, name, tax_code, birth_place, address, zip_code, city, email, phone, ip, page_slug, dbPath]);
        
        res.json({ success: true });

    } catch (e) {
        console.error(e);
        if(req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: 'Errore interno del server' });
    }
});
app.get('/api/cvs', checkAuth, async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM competition_cvs ORDER BY submission_datetime DESC');
    res.json(rows);
});
app.delete('/api/cvs/:id', checkAuth, async (req, res) => {
    await pool.query('DELETE FROM competition_cvs WHERE id = $1', [req.params.id]);
    res.json({ success: true });
});

// 4. OTHER ROUTES
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
    const items = Array.isArray(req.body) ? req.body : [req.body];
    for (const item of items) {
        await pool.query('INSERT INTO site_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2', [item.key, item.value]);
    }
    res.json({ success: true });
});
app.post('/api/upload', checkAuth, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).send('No file');
    let filePath = '/uploads/' + req.file.filename;
    if(req.body.folder) {
        const safeFolder = req.body.folder.replace(/[^a-zA-Z0-9_-]/g, '');
        filePath = '/uploads/' + safeFolder + '/' + req.file.filename;
    }
    res.json({ filePath });
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