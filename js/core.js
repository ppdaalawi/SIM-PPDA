/* js/core.js - LOGIKA UTAMA & UTILITAS */

// --- 0. VARIABEL GLOBAL ---
let loaderInterval = null;

// --- 1. UI UTILITIES ---
function showLoader(isLoading, text = "Memproses") {
    const loader = document.getElementById('app-loader');
    if (!loader) return;
    if (isLoading) {
        loader.classList.remove('hidden');
        if (!loader.querySelector('.loader-content')) {
            loader.innerHTML = `<div class="loader-content"><div class="spinner"></div><div class="loader-text" id="loader-text-display">Memproses</div></div>`;
        }
        startLoaderAnimation(text);
    } else {
        if (loaderInterval) { clearInterval(loaderInterval); loaderInterval = null; }
        loader.classList.add('hidden');
    }
}

function startLoaderAnimation(baseText) {
    const display = document.getElementById('loader-text-display');
    if (!display) return;
    if (loaderInterval) clearInterval(loaderInterval);
    let dots = 0;
    display.textContent = baseText;
    loaderInterval = setInterval(() => {
        dots++; if (dots > 3) dots = 0;
        display.textContent = baseText + '.'.repeat(dots) + ' '.repeat(3 - dots);
    }, 500);
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span> <i class="fa-solid ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// --- CUSTOM CONFIRM MODAL ---
// --- CUSTOM CONFIRM MODAL (FIXED) ---
function showConfirm(message, callback) {
    const modal = document.getElementById('confirm-modal');
    const msgEl = document.getElementById('confirm-message');
    const yesBtn = document.getElementById('confirm-yes');
    const noBtn = document.getElementById('confirm-no');
    
    if(!modal) {
        // Fallback jika modal tidak ada
        if(confirm(message)) callback();
        return;
    }

    msgEl.textContent = message;
    // Tambahkan class khusus agar bisa di-style berbeda & clear previous style
    modal.classList.add('active', 'confirm-modal-overlay'); 

    const close = () => {
        modal.classList.remove('active');
        // Hapus listener agar tidak bocor memori
        yesBtn.onclick = null;
        noBtn.onclick = null;
        modal.onclick = null; // Hapus listener overlay
    };
    
    // Klik Tombol Ya
    yesBtn.onclick = () => {
        close();
        if (typeof callback === 'function') callback();
    };

    // Klik Tombol Batal
    noBtn.onclick = close;

    // Klik Background Overlay -> Batal
    modal.onclick = (e) => {
        // Hanya close jika yang diklik adalah overlay-nya sendiri, bukan box
        if (e.target === modal) {
            close();
        }
    };
}

function logoutUser() {
    showConfirm("Apakah Anda yakin ingin keluar dari sistem?", () => {
        localStorage.removeItem('ppda_user');
        window.location.href = 'index.html';
    });
}

// --- 2. GLOBAL EVENT LISTENER (Untuk Sidebar & Modal Global) ---
document.addEventListener('click', function(e) {
    // Handle Logout dari Sidebar
    if (e.target.closest('#btn-logout')) { logoutUser(); }

    // Handle Tutup Modal (X) & Overlay
    if (e.target.classList.contains('close-modal')) {
        const targetId = e.target.getAttribute('data-target');
        document.getElementById(targetId).classList.remove('active');
    }
    if (e.target.classList.contains('modal-overlay') && !e.target.classList.contains('confirm-modal-overlay')) {
        e.target.classList.remove('active');
    }
    
    // Handle Overlay Click (Mobile Close)
    if (e.target.id === 'sidebar-overlay') closeSidebar();
});

// --- 3. INIT DASHBOARD & LOGIN ---
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const isLoginPage = (window.location.pathname.includes('index.html') || window.location.pathname === '/');
    
    if (isLoginPage && loginForm) {
        // --- LOGIC LOGIN BARU ---
        const toggleBtn = document.getElementById('toggle-password');
        const passInput = document.getElementById('password');
        
        if(toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const type = passInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passInput.setAttribute('type', type);
                toggleBtn.innerHTML = type === 'password' 
                    ? '<i class="fa-solid fa-eye"></i>' 
                    : '<i class="fa-solid fa-eye-slash"></i>';
            });
        }

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const u = document.getElementById('username').value;
            const p = document.getElementById('password').value;
            const btnLogin = document.getElementById('btn-login');
            
            btnLogin.disabled = true;
            btnLogin.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';
            showLoader(false); // Matikan global loader

            const res = await fetchData('login', { username: u, password: p });
            
            if (res.status === 'success') {
                showToast('Login Berhasil!', 'success');
                localStorage.setItem('ppda_user', JSON.stringify(res.data));
                btnLogin.innerHTML = '<i class="fa-solid fa-check"></i> Berhasil';
                btnLogin.style.background = 'var(--primary-light)';
                setTimeout(() => window.location.href = 'dashboard.html', 1000);
            } else {
                btnLogin.disabled = false;
                btnLogin.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Masuk';
            }
        });

    } else if (!isLoginPage) {
        initDashboard();
    }
});

async function initDashboard() {
    const userSession = localStorage.getItem('ppda_user');
    if (!userSession) { window.location.href = 'index.html'; return; }
    const user = JSON.parse(userSession);
    
    // Set User Info
    document.getElementById('user-name-display').textContent = user.nama;
    document.getElementById('user-avatar-display').textContent = user.nama.charAt(0).toUpperCase();

    // --- LOGIKA TOGGLE SIDEBAR ---
    const mobileToggle = document.getElementById('mobile-toggle');
    const sidebar = document.getElementById('sidebar');

    if (mobileToggle) {
        mobileToggle.onclick = () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.toggle('sidebar-active');
                document.getElementById('sidebar-overlay').classList.toggle('active');
            } else {
                sidebar.classList.toggle('sidebar-closed');
            }
        };
    }

    showLoader(true, "Memuat Menu Navigasi");
    const res = await fetchData('get_menu', { role: user.role });
    showLoader(false);

    if (res.status === 'success') {
        renderSidebar(res.data);
        if (res.data.length > 0) {
            const firstLink = document.querySelector('.nav-link');
            if(firstLink) firstLink.click();
        }
    }
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('sidebar-active');
    document.getElementById('sidebar-overlay').classList.remove('active');
}

function renderSidebar(menus) {
    const list = document.getElementById('sidebar-menu-list');
    list.innerHTML = '';
    menus.forEach(menu => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="#" data-url="${menu.url}" data-label="${menu.label}" data-type="${menu.source_type}" data-target="${menu.target_mode}" class="nav-link"><i class="fa-solid ${menu.icon}"></i> ${menu.label}</a>`;
        list.appendChild(li);
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const el = e.currentTarget;
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            el.classList.add('active');
            
            if (window.innerWidth <= 768) closeSidebar();
            
            const menuData = { 
                url: el.getAttribute('data-url'), label: el.getAttribute('data-label'), 
                source_type: el.getAttribute('data-type'), target_mode: el.getAttribute('data-target') 
            };
            handleMenuClick(menuData, false);
        });
    });
}

// --- 4. LOGIKA MENU & SPA ---
function handleMenuClick(menu, isFirstLoad) {
    const contentArea = document.getElementById('content-area');
    if (menu.source_type === 'external') {
        if (menu.target_mode === 'tab_new') window.open(menu.url, '_blank');
        else {
            showLoader(true, "Memuat Konten Eksternal");
            contentArea.innerHTML = `<div style="height: 100%; width: 100%;"><iframe src="${menu.url}" frameborder="0" style="width: 100%; height: calc(100vh - 60px); border: none;"></iframe></div>`;
            document.title = menu.label + " - SIM PPDA";
            setTimeout(() => showLoader(false), 1500);
        }
    } else loadPage(menu.url, null, menu.label);
}

async function loadPage(url, elementClick, pageTitle) {
    showLoader(true, "Memuat Halaman " + pageTitle);
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('File tidak ditemukan');
        const htmlContent = await response.text();
        document.getElementById('content-area').innerHTML = htmlContent;
        if (pageTitle) document.title = pageTitle + " - SIM PPDA";
        
        // Cek jika halaman settings, panggil fungsi init dari settings.js
        if(url.includes('settings.html')) {
            if(typeof initSettingsLogic === 'function') {
                initSettingsLogic();
            } else {
                console.error("Fungsi initSettingsLogic tidak ditemukan. Pastikan settings.js dimuat.");
            }
        }
    } catch (error) {
        document.getElementById('content-area').innerHTML = `<div class="card text-center"><h3>Error</h3><p>${error.message}</p></div>`;
    } finally { showLoader(false); }
}
