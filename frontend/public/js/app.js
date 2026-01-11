document.addEventListener('DOMContentLoaded', async () => {
    // 1. Load Header and Footer Structure
    await loadGlobalStructure();
    
    // 2. Apply Global Settings (Colors, Fonts, Favicon, Custom CSS/JS)
    await applyGlobalSettings();
    
    // 3. Initialize Animations (Apple-style scroll reveal)
    initAnimations();
});

async function applyGlobalSettings() {
    try {
        const res = await fetch('/api/settings');
        if(res.ok) {
            const settings = await res.json();
            const getVal = (k, def) => settings.find(x => x.key === k)?.value || def;
            
            // --- Typography & Colors ---
            const font = getVal('style_font', 'Inter');
            const titleCol = getVal('style_title_color', '#004080');
            const bodyCol = getVal('style_body_color', '#374151');
            const customCss = getVal('custom_css', '');
            
            const style = document.createElement('style');
            style.innerHTML = `
                body { font-family: '${font}', sans-serif !important; color: ${bodyCol} !important; }
                h1, h2, h3, .font-bold { color: ${titleCol}; }
                .text-[#004080], .text-blue-900 { color: ${titleCol} !important; } 
                
                /* Animation Classes */
                .anim-box { opacity: 0; transition: all 1s ease-out; will-change: transform, opacity; }
                .anim-active { opacity: 1; transform: translate(0,0) scale(1) rotate(0) !important; }
                
                .anim-fade-up { transform: translateY(50px); }
                .anim-fade-down { transform: translateY(-50px); }
                .anim-fade-left { transform: translateX(-50px); }
                .anim-fade-right { transform: translateX(50px); }
                .anim-zoom-in { transform: scale(0.8); }
                .anim-flip { transform: rotateY(90deg); }

                /* Custom CSS from Admin */
                ${customCss}
            `;
            document.head.appendChild(style);

            // --- Favicon Injection ---
            const fav = getVal('site_favicon', '/assets/logo.png');
            let link = document.querySelector("link[rel~='icon']");
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.head.appendChild(link);
            }
            link.href = fav;

            // --- Logo Injection (updates placeholders) ---
            const logoUrl = getVal('site_logo', '/assets/logo.png');
            const logoEls = document.querySelectorAll('.site-logo-img');
            logoEls.forEach(img => img.src = logoUrl);

            // --- Custom JS Injection (Head) ---
            const customJs = getVal('custom_js_head', '');
            if(customJs) {
                const script = document.createElement('script');
                script.text = customJs;
                document.head.appendChild(script);
            }

            // --- Maintenance Mode Check ---
            const maintenance = getVal('maintenance_mode', 'false');
            if(maintenance === 'true' && !window.location.pathname.includes('admin')) {
                document.body.innerHTML = `
                <div class="h-screen flex flex-col items-center justify-center bg-gray-100 text-[#004080] font-sans">
                    <img src="${logoUrl}" class="h-24 mb-8">
                    <h1 class="text-4xl font-bold mb-4">Sito in Manutenzione</h1>
                    <p class="text-gray-600 text-lg">Stiamo aggiornando i nostri sistemi. Torneremo presto online.</p>
                </div>`;
            }
        }
    } catch(e) { console.error("Error applying settings", e); }
}

function initAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('anim-active');
            }
        });
    }, { threshold: 0.1 });

    // We use a slight timeout to ensure dynamic content (like page builder blocks) is rendered
    setTimeout(() => {
        document.querySelectorAll('.anim-box').forEach(el => observer.observe(el));
    }, 500);
}

async function loadGlobalStructure() {
    const headerEl = document.getElementById('header-inject');
    const footerEl = document.getElementById('footer-inject');

    let menuItems = [];
    let footerLinks = [];
    try {
        const r1 = await fetch('/api/menu'); if(r1.ok) menuItems = await r1.json();
        const r2 = await fetch('/api/footer'); if(r2.ok) footerLinks = await r2.json();
    } catch(e) { console.error(e); }

    // --- Render Header ---
    if(headerEl) {
        const navLinks = menuItems.map(item => {
            const hasChildren = item.children && item.children.length > 0;
            if(hasChildren) {
                return `
                <div class="relative group h-full flex items-center">
                    <a href="${item.url}" class="flex items-center font-bold text-sm uppercase tracking-wide hover:opacity-80 transition px-3 h-full border-b-4 border-transparent hover:border-current">
                        ${item.label} <svg class="w-3 h-3 ml-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                    </a>
                    <div class="absolute top-full left-0 w-60 bg-white shadow-xl rounded-b-xl border-t-4 border-current opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 z-50 overflow-hidden flex flex-col">
                        ${item.children.map(c => `<a href="${c.url}" class="block px-6 py-3 text-sm text-gray-600 hover:bg-gray-50 border-b border-gray-100 last:border-0">${c.label}</a>`).join('')}
                    </div>
                </div>`;
            }
            return `<a href="${item.url}" class="flex items-center font-bold text-sm uppercase tracking-wide hover:opacity-80 transition px-3 h-full border-b-4 border-transparent hover:border-current">${item.label}</a>`;
        }).join('');

        headerEl.innerHTML = `
        <nav class="bg-white/95 backdrop-blur-md fixed w-full z-50 top-0 shadow-sm border-b border-gray-100 h-24 transition-all duration-300">
            <div class="max-w-7xl mx-auto px-4 h-full flex justify-between items-center">
                <a href="/" class="flex-shrink-0 hover:opacity-80 transition">
                    <img src="/assets/logo.png" class="site-logo-img h-16 w-auto object-contain" alt="SOES" onerror="this.style.display='none'">
                </a>
                <div class="hidden md:flex space-x-2 h-full items-center text-[#004080]">
                    ${navLinks}
                </div>
                <a href="/admin.html" class="bg-[#004080] text-white px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-blue-900 shadow-lg transition transform hover:-translate-y-0.5">
                    Area Riservata
                </a>
            </div>
        </nav>`;
    }

    // --- Render Footer ---
    if(footerEl) {
        const utilLinks = footerLinks.filter(x => x.section === 'link_utili').map(l => `<li><a href="${l.url}" class="text-blue-200 hover:text-white transition">${l.label}</a></li>`).join('');
        const infoLinks = footerLinks.filter(x => x.section === 'info').map(l => `<li><a href="${l.url}" class="hover:text-white">${l.label}</a></li>`).join('');
        
        footerEl.innerHTML = `
        <footer class="bg-[#002b55] text-white pt-16 pb-8 border-t-4 border-[#e63946] mt-auto">
            <div class="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12 text-sm mb-12">
                <div>
                    <img src="/assets/logo.png" class="site-logo-img h-12 mb-6 bg-white p-2 rounded-lg brightness-100 object-contain" alt="SOES">
                    <p class="text-blue-200 leading-relaxed">Innovazione tecnologica e professionalità al servizio della Pubblica Amministrazione.</p>
                </div>
                <div>
                    <h4 class="font-bold text-white text-base uppercase tracking-wider mb-6 border-b border-blue-800 pb-2 inline-block">Sede Legale</h4>
                    <p class="text-blue-200 mb-1">Via Roma 236</p>
                    <p class="text-blue-200 mb-1">82037 Telese Terme (BN)</p>
                    <p class="text-blue-200 mt-4"><span class="text-blue-400">Tel:</span> +39 0824 941202</p>
                </div>
                <div>
                    <h4 class="font-bold text-white text-base uppercase tracking-wider mb-6 border-b border-blue-800 pb-2 inline-block">Sedi Operative</h4>
                    <div class="mb-4">
                        <p class="text-white font-bold text-xs uppercase mb-1">Sede Lazio</p>
                        <p class="text-blue-200">Via A. Sebastiani, 77 - Minturno</p>
                    </div>
                    <div>
                        <p class="text-white font-bold text-xs uppercase mb-1">Sede Sicilia</p>
                        <p class="text-blue-200">Via Avellino, 42/A - Erice</p>
                    </div>
                </div>
                <div>
                    <h4 class="font-bold text-white text-base uppercase tracking-wider mb-6 border-b border-blue-800 pb-2 inline-block">Link Utili</h4>
                    <ul class="space-y-3">
                        ${utilLinks}
                    </ul>
                </div>
            </div>
            <div class="border-t border-blue-900 pt-8 text-center flex flex-col md:flex-row justify-between items-center px-4 max-w-7xl mx-auto">
                <p class="text-xs text-blue-400">© Samuele Di Blasio & 2025 SOES S.p.A. - P.IVA 01199760628 - Tutti i diritti riservati.</p>
                <ul class="flex gap-4 text-xs text-blue-400 mt-4 md:mt-0">
                    ${infoLinks}
                </ul>
            </div>
        </footer>`;
    }
}