CREATE TABLE IF NOT EXISTS site_content (
    id SERIAL PRIMARY KEY,
    page_name VARCHAR(50) UNIQUE NOT NULL,
    content JSONB NOT NULL
);
CREATE TABLE IF NOT EXISTS site_settings (
    key VARCHAR(50) PRIMARY KEY,
    value VARCHAR(255) NOT NULL
);
CREATE TABLE IF NOT EXISTS contact_messages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    surname VARCHAR(100),
    email VARCHAR(150),
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS custom_pages (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    is_visible BOOLEAN DEFAULT true,
    blocks JSONB DEFAULT '[]'
);
CREATE TABLE IF NOT EXISTS site_menu (
    id SERIAL PRIMARY KEY,
    structure JSONB NOT NULL
);

-- ================= SEED DATA =================

-- 1. HOME (Carousel)
INSERT INTO site_content (page_name, content) VALUES 
('home', '{
    "slides": [
        {
            "title": "Spazi, Tempi e Modi",
            "subtitle": "Innovazione per la città del futuro.",
            "cta_text": "I Nostri Servizi",
            "link": "/services.html",
            "image": "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1600&q=80"
        },
        {
            "title": "Tecnologia al servizio della PA",
            "subtitle": "Efficienza, trasparenza e controllo del territorio.",
            "cta_text": "Chi Siamo",
            "link": "/dynamic.html?p=azienda",
            "image": "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=1600&q=80"
        }
    ]
}') ON CONFLICT (page_name) DO NOTHING;

-- 2. SERVICES LIST (Overview Page)
INSERT INTO site_content (page_name, content) VALUES 
('services', '{
    "list": [
        {"title": "SGV - Gestione Verbali", "desc": "Gestione completa iter sanzionatorio.", "image": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80", "opacity": "0.7", "link": "/dynamic.html?p=servizio-sgv"},
        {"title": "SRI - Rilevamento Infrazioni", "desc": "Autovelox, ZTL e controllo traffico.", "image": "https://images.unsplash.com/photo-1516216628859-9bccecab13ca?auto=format&fit=crop&w=800&q=80", "opacity": "0.7", "link": "/dynamic.html?p=servizio-sri"},
        {"title": "Parking Suite", "desc": "Parcometri e gestione sosta a pagamento.", "image": "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80", "opacity": "0.7", "link": "/dynamic.html?p=servizio-parking"},
        {"title": "PayPark App", "desc": "Pagamento sosta via smartphone.", "image": "https://images.unsplash.com/photo-1512428559087-560fa0db7901?auto=format&fit=crop&w=800&q=80", "opacity": "0.7", "link": "/dynamic.html?p=servizio-paypark"},
        {"title": "Riscossione Coattiva", "desc": "Recupero crediti per la PA.", "image": "https://images.unsplash.com/photo-1554224155-97e3a6fee717?auto=format&fit=crop&w=800&q=80", "opacity": "0.7", "link": "/dynamic.html?p=servizio-src"},
        {"title": "CRM Cittadino", "desc": "Sportello telematico e supporto.", "image": "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80", "opacity": "0.7", "link": "/dynamic.html?p=servizio-crm"}
    ]
}') ON CONFLICT (page_name) DO NOTHING;

-- 3. MODULISTICA & CONTACTS
INSERT INTO site_content (page_name, content) VALUES ('modulistica', '{"sections": []}') ON CONFLICT (page_name) DO NOTHING;
INSERT INTO site_content (page_name, content) VALUES 
('contacts', '{
    "sedi": [
        {"name": "Sede Legale", "address": "Via Roma 236 - 82037 Telese Terme (BN)", "phone": "+39 0824 941202", "map_url": "https://maps.google.com/maps?q=Via+Roma+236+Telese+Terme&t=&z=13&ie=UTF8&iwloc=&output=embed"},
        {"name": "Sede Lazio", "address": "Via A. Sebastiani, 77 - 04026 Minturno (LT)", "phone": "+39 0771 202379", "map_url": "https://maps.google.com/maps?q=Via+Sebastiani+77+Minturno&t=&z=13&ie=UTF8&iwloc=&output=embed"},
        {"name": "Sede Sicilia", "address": "Via Avellino, 42/A - 91016 Erice (TP)", "phone": "+39 0923 1780745", "map_url": "https://maps.google.com/maps?q=Via+Avellino+42+Erice&t=&z=13&ie=UTF8&iwloc=&output=embed"}
    ],
    "pec": "soes@pec.it"
}') ON CONFLICT (page_name) DO NOTHING;

-- 4. CUSTOM PAGES (The Content)
INSERT INTO custom_pages (slug, title, blocks) VALUES 
('azienda', 'Chi Siamo', '[
    {"type":"hero", "title":"Chi Siamo", "text":"Leader nei servizi per la Pubblica Amministrazione", "image":"https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80"},
    {"type":"text", "content":"<h2 class=''text-3xl font-bold text-blue-900 mb-4''>La Nostra Mission</h2><p class=''text-lg text-gray-700''>SOES S.p.A. supporta gli Enti Locali nella gestione del territorio attraverso tecnologie proprietarie e personale altamente qualificato.</p>"},
    {"type":"cards", "items":[{"title":"Innovazione", "text":"Sviluppo software interno."},{"title":"Affidabilità", "text":"Oltre 20 anni di esperienza."},{"title":"Qualità", "text":"Certificazioni ISO 9001/14001."}]}
]'),
('servizio-sgv', 'Gestione Verbali', '[
    {"type":"hero", "title":"SGV - Gestione Verbali", "text":"Il sistema completo per la gestione delle sanzioni.", "image":"https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1600&q=80"},
    {"type":"text", "content":"<p>Il servizio SGV permette una gestione interamente digitale dell''iter sanzionatorio, dalla rilevazione su strada fino alla riscossione coattiva.</p>"}
]'),
('servizio-parking', 'Parking Suite', '[
    {"type":"hero", "title":"Parking Suite", "text":"Gestione sosta a pagamento.", "image":"https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1600&q=80"},
    {"type":"text", "content":"<p>Fornitura, installazione e manutenzione di parcometri di ultima generazione.</p>"}
]')
ON CONFLICT (slug) DO NOTHING;

-- 5. MENU
INSERT INTO site_menu (id, structure) VALUES (1, '[
    {"label": "Home", "url": "/", "children": []},
    {"label": "Azienda", "url": "/dynamic.html?p=azienda", "children": []},
    {"label": "Servizi", "url": "/services.html", "children": [
        {"label": "Gestione Verbali", "url": "/dynamic.html?p=servizio-sgv"},
        {"label": "Parking Suite", "url": "/dynamic.html?p=servizio-parking"},
        {"label": "Tutti i Servizi", "url": "/services.html"}
    ]},
    {"label": "Modulistica", "url": "/modulistica.html", "children": []},
    {"label": "Contatti", "url": "/contatti.html", "children": []}
]') ON CONFLICT (id) DO NOTHING;

INSERT INTO site_settings (key, value) VALUES ('global_alert', '') ON CONFLICT (key) DO NOTHING;