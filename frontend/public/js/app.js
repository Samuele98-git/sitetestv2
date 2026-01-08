document.addEventListener('DOMContentLoaded', async () => {
    await loadGlobalStructure();
});

async function loadGlobalStructure() {
    const headerEl = document.getElementById('header-inject');
    const footerEl = document.getElementById('footer-inject');

    // --- 1. FETCH MENU STRUCTURE ---
    let menuItems = [];
    try {
        const res = await fetch('/api/menu');
        if(res.ok) menuItems = await res.json();
    } catch(e) { console.error(e); }

    // --- 2. RENDER HEADER ---
    if(headerEl) {
        const navLinks = menuItems.map(item => {
            const hasChildren = item.children && item.children.length > 0;
            if(hasChildren) {
                // Dropdown Logic
                return `
                <div class="relative group h-full flex items-center">
                    <a href="${item.url}" class="flex items-center text-gray-700 font-bold text-sm uppercase tracking-wide hover:text-[#004080] transition px-3 h-full border-b-4 border-transparent hover:border-[#004080]">
                        ${item.label} <svg class="w-3 h-3 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                    </a>
                    <div class="absolute top-full left-0 w-60 bg-white shadow-xl rounded-b-xl border-t-4 border-[#004080] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 z-50 overflow-hidden flex flex-col">
                        ${item.children.map(c => `<a href="${c.url}" class="block px-6 py-3 text-sm text-gray-600 hover:bg-blue-50 hover:text-[#004080] border-b border-gray-100 last:border-0">${c.label}</a>`).join('')}
                    </div>
                </div>`;
            }
            // Single Link
            return `<a href="${item.url}" class="flex items-center text-gray-700 font-bold text-sm uppercase tracking-wide hover:text-[#004080] transition px-3 h-full border-b-4 border-transparent hover:border-[#004080]">${item.label}</a>`;
        }).join('');

        headerEl.innerHTML = `
        <nav class="bg-white/95 backdrop-blur-md fixed w-full z-50 top-0 shadow-sm border-b border-gray-100 h-24 transition-all duration-300">
            <div class="max-w-7xl mx-auto px-4 h-full flex justify-between items-center">
                <a href="/" class="flex-shrink-0 hover:opacity-80 transition">
                    <img src="/assets/logo.png" class="h-16 w-auto" alt="SOES" onerror="this.style.display='none'">
                </a>
                <div class="hidden md:flex space-x-2 h-full items-center">
                    ${navLinks}
                </div>
                <a href="/admin.html" class="bg-[#004080] text-white px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-blue-900 shadow-lg transition transform hover:-translate-y-0.5">
                    Area Riservata
                </a>
            </div>
        </nav>`;
    }

    // --- 3. RENDER FOOTER ---
    if(footerEl) {
        footerEl.innerHTML = `
        <footer class="bg-[#002b55] text-white pt-16 pb-8 border-t-4 border-[#e63946] mt-auto">
            <div class="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12 text-sm mb-12">
                <div>
                    <img src="/assets/logo.png" class="h-12 mb-6 bg-white p-2 rounded-lg brightness-100" alt="SOES">
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
                        <li><a href="/dynamic.html?p=azienda" class="text-blue-200 hover:text-white transition">Chi Siamo</a></li>
                        <li><a href="/services.html" class="text-blue-200 hover:text-white transition">Servizi</a></li>
                        <li><a href="/modulistica.html" class="text-blue-200 hover:text-white transition">Modulistica</a></li>
                        <li><a href="#" class="text-blue-200 hover:text-white transition">Privacy Policy</a></li>
                    </ul>
                </div>
            </div>
            <div class="border-t border-blue-900 pt-8 text-center">
                <p class="text-xs text-blue-400">© 2025 SOES S.p.A. - P.IVA 01199760628 - Tutti i diritti riservati.</p>
            </div>
        </footer>`;
    }
}