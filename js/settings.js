/* js/settings.js - REVISI (Fix Alignment & Segment Button) */

let cachedSettingsData = { users: [], menus: [] };
const AVAILABLE_ICONS = [ 'fa-home', 'fa-user', 'fa-users', 'fa-cog', 'fa-book', 'fa-graduation-cap', 'fa-chart-bar', 'fa-money-bill', 'fa-calendar', 'fa-envelope', 'fa-file-alt', 'fa-folder', 'fa-image', 'fa-video', 'fa-link', 'fa-lock', 'fa-mosque' ];

// --- 1. INISIALISASI ---
function initSettingsLogic() { loadSettingsData(); initIconPicker(); bindSettingsForms(); bindSettingsEvents(); }

// --- 2. EVENT LISTENER KHUSUS SETTING (Delegation) ---
function bindSettingsEvents() {
    const contentArea = document.getElementById('content-area');
    if (!contentArea) return;

    contentArea.onclick = (e) => {
        if (e.target.id === 'btn-open-user') {
            document.getElementById('form-user').reset();
            document.getElementById('u-id').value = '';
            document.getElementById('title-user').innerText = 'Tambah User';
            document.getElementById('modal-user').classList.add('active');
        }
        if (e.target.id === 'btn-open-menu') {
            document.getElementById('form-menu').reset();
            document.getElementById('m-id').value = '';
            document.getElementById('title-menu').innerText = 'Tambah Menu';
            document.getElementById('icon-preview-display').className = ''; 
            document.getElementById('icon-text-display').innerText = 'Pilih Ikon...';
            resetSegmentButtons('internal');
            toggleSourceUI('internal'); 
            populateGithubFiles(); 
            document.getElementById('modal-menu').classList.add('active');
        }
        if (e.target.closest('.btn-edit-row')) {
            const btn = e.target.closest('.btn-edit-row');
            openEditModal(btn.getAttribute('data-sheet'), btn.getAttribute('data-id'));
        }
        if (e.target.closest('.btn-delete-row')) {
            const btn = e.target.closest('.btn-delete-row');
            showConfirm("Data yang dihapus tidak bisa dikembalikan. Yakin hapus?", () => { deleteSettingsRow(btn.getAttribute('data-sheet'), btn.getAttribute('data-id')); });
        }
        if (e.target.closest('#btn-pick-icon')) { e.preventDefault(); document.getElementById('modal-icon-picker').classList.add('active'); }
        if (e.target.closest('.icon-item')) {
            const iconItem = e.target.closest('.icon-item');
            const selectedIcon = iconItem.getAttribute('data-icon');
            document.getElementById('m-icon').value = selectedIcon;
            document.getElementById('icon-preview-display').className = `fa-solid ${selectedIcon}`;
            document.getElementById('icon-text-display').innerText = selectedIcon;
            document.getElementById('modal-icon-picker').classList.remove('active');
        }
    };
}

function resetSegmentButtons(value) {
    const btns = document.querySelectorAll('.segment-btn');
    btns.forEach(btn => {
        if(btn.getAttribute('data-value') === value) btn.classList.add('active');
        else btn.classList.remove('active');
    });
}

// --- 3. LOGIKA FORM & BINDING ---
function bindSettingsForms() {
    const formUser = document.getElementById('form-user');
    if(formUser) {
        const newFormUser = formUser.cloneNode(true); formUser.parentNode.replaceChild(newFormUser, formUser);
        newFormUser.addEventListener('submit', async (e) => {
            e.preventDefault(); showLoader(true, "Menyimpan User");
            const id = document.getElementById('u-id').value;
            const rowData = [document.getElementById('u-username').value, document.getElementById('u-password').value, document.getElementById('u-role').value, document.getElementById('u-nama').value, document.getElementById('u-status').value];
            let res = id ? await fetchData('edit_data', { sheetName: 'users', id: id, rowData: rowData }) : await fetchData('add_data', { sheetName: 'users', rowData: rowData });
            showLoader(false);
            if(res.status === 'success') { document.getElementById('modal-user').classList.remove('active'); showToast('User Disimpan'); loadSettingsData(); }
        });
    }

    const formMenu = document.getElementById('form-menu');
    if(formMenu) {
        const newFormMenu = formMenu.cloneNode(true); formMenu.parentNode.replaceChild(newFormMenu, formMenu);

        // Bind Segment Buttons
        const segmentBtns = newFormMenu.querySelectorAll('.segment-btn');
        segmentBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                segmentBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                toggleSourceUI(btn.getAttribute('data-value'));
            });
        });

        newFormMenu.addEventListener('submit', async (e) => {
            e.preventDefault(); showLoader(true, "Menyimpan Menu");
            const id = document.getElementById('m-id').value;
            const activeBtn = document.querySelector('.segment-btn.active');
            const sourceType = activeBtn ? activeBtn.getAttribute('data-value') : 'internal';
            let url = sourceType === 'internal' ? document.getElementById('m-file-list').value : document.getElementById('m-url-manual').value;
            let targetMode = sourceType === 'internal' ? 'same' : document.getElementById('m-target').value;
            const rowData = [document.getElementById('m-label').value, url, document.getElementById('m-icon').value, document.getElementById('m-access').value, document.getElementById('m-status').value, sourceType, targetMode];
            let res = id ? await fetchData('edit_data', { sheetName: 'menus', id: id, rowData: rowData }) : await fetchData('add_data', { sheetName: 'menus', rowData: rowData });
            showLoader(false);
            if(res.status === 'success') { document.getElementById('modal-menu').classList.remove('active'); showToast('Menu Disimpan'); initDashboard(); loadSettingsData(); }
        });
    }
    
    const ppdbToggle = document.getElementById('ppdb-toggle');
    if(ppdbToggle) ppdbToggle.onchange = async function() { showLoader(true, "Update PPDB"); const newStatus = this.checked ? 'OPEN' : 'CLOSED'; const res = await fetchData('update_settings', { settings: { 'status_ppdb': newStatus } }); showLoader(false); if(res.status === 'success') document.getElementById('ppdb-text').innerText = newStatus === 'OPEN' ? "Dibuka" : "Ditutup"; else this.checked = !this.checked; };
    
    const btnRefresh = document.getElementById('btn-refresh-files');
    if(btnRefresh) { const newRefresh = btnRefresh.cloneNode(true); btnRefresh.parentNode.replaceChild(newRefresh, btnRefresh); newRefresh.addEventListener('click', async (e) => { e.preventDefault(); newRefresh.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; showLoader(true, "Refresh GitHub"); githubFilesCache = null; await populateGithubFiles(); showLoader(false); newRefresh.innerHTML = '<i class="fa-solid fa-sync-alt"></i>'; }); }
}

function toggleSourceUI(type) {
    const divInternal = document.getElementById('div-internal'); const divExternal = document.getElementById('div-external'); const selectTarget = document.getElementById('m-target').parentElement; 
    if (type === 'internal') { divInternal.style.display = 'block'; divExternal.style.display = 'none'; selectTarget.style.display = 'none'; } 
    else { divInternal.style.display = 'none'; divExternal.style.display = 'block'; selectTarget.style.display = 'block'; }
}

// --- 4. HELPER FUNCTIONS ---
async function populateGithubFiles() { const select = document.getElementById('m-file-list'); const files = await fetchGithubFiles(); select.innerHTML = ''; if(files.length === 0) select.innerHTML = '<option value="">Gagal Memuat</option>'; else files.forEach(file => { const opt = document.createElement('option'); opt.value = `pages/${file}`; opt.innerText = file; select.appendChild(opt); }); }
function initIconPicker() { const pickerContainer = document.getElementById('icon-picker-grid'); if(!pickerContainer) return; pickerContainer.innerHTML = ''; AVAILABLE_ICONS.forEach(icon => { const div = document.createElement('div'); div.className = 'icon-item'; div.setAttribute('data-icon', icon); div.innerHTML = `<i class="fa-solid ${icon}"></i>`; pickerContainer.appendChild(div); }); }

async function loadSettingsData() {
    showLoader(true, "Memuat Data");
    await Promise.all([
        (async () => { 
            const resU = await fetchData('get_data', { sheetName: 'users' }); 
            if(resU.status === 'success') { 
                cachedSettingsData.users = resU.data; 
                const tbodyU = document.getElementById('body-user'); 
                if(tbodyU) { 
                    tbodyU.innerHTML = ''; 
                    for(let i=1; i<resU.data.length; i++) { 
                        const r = resU.data[i]; 
                        // PERBAIKAN: text-align:right langsung di TD
                        tbodyU.innerHTML += `<tr>
                            <td><b>${r[1]}</b><br><small style="color:var(--text-grey)">${r[4]}</small></td>
                            <td>${r[3]}</td>
                            <td style="text-align:right">
                                <button class="btn-icon btn-orange btn-edit-row" data-sheet="users" data-id="${r[0]}"><i class="fa-solid fa-pen"></i></button>
                                <button class="btn-icon btn-red btn-delete-row" data-sheet="users" data-id="${r[0]}"><i class="fa-solid fa-trash"></i></button>
                            </td>
                        </tr>`; 
                    } 
                } 
            } 
        })(),
        (async () => { 
            const resM = await fetchData('get_data', { sheetName: 'menus' }); 
            if(resM.status === 'success') { 
                cachedSettingsData.menus = resM.data; 
                const tbodyM = document.getElementById('body-menu'); 
                if(tbodyM) { 
                    tbodyM.innerHTML = ''; 
                    for(let i=1; i<resM.data.length; i++) { 
                        const r = resM.data[i]; 
                        let badge = r[6] === 'external' 
                            ? `<span style="color:#1976d2; background:#e3f2fd; padding:2px 8px; border-radius:10px; font-size:10px">External</span>` 
                            : `<span style="color:var(--primary-main); background:var(--primary-bg); padding:2px 8px; border-radius:10px; font-size:10px">Internal</span>`;
                        // PERBAIKAN: text-align:right langsung di TD
                        tbodyM.innerHTML += `<tr>
                            <td><i class="fa-solid ${r[3]}" style="margin-right:5px; color:var(--primary-main)"></i> ${r[1]}</td>
                            <td>${badge}</td>
                            <td style="text-align:right">
                                <button class="btn-icon btn-orange btn-edit-row" data-sheet="menus" data-id="${r[0]}"><i class="fa-solid fa-pen"></i></button>
                                <button class="btn-icon btn-red btn-delete-row" data-sheet="menus" data-id="${r[0]}"><i class="fa-solid fa-trash"></i></button>
                            </td>
                        </tr>`; 
                    } 
                } 
            } 
        })(),
        (async () => { 
            const resS = await fetchData('get_data', { sheetName: 'app_settings' }); 
            if(resS.status === 'success') { 
                const text = document.getElementById('ppdb-text'); const toggle = document.getElementById('ppdb-toggle'); 
                for(let i=1; i<resS.data.length; i++) { 
                    if(resS.data[i][0] === 'status_ppdb') { 
                        const status = resS.data[i][1]; const isOpen = (status === 'OPEN'); 
                        if(toggle) { toggle.checked = isOpen; text.innerText = isOpen ? "Pendaftaran Dibuka" : "Pendaftaran Ditutup"; } break; 
                    } 
                } 
            } 
        })()
    ]);
    showLoader(false);
}

async function deleteSettingsRow(sheet, id) { showLoader(true, "Menghapus"); const res = await fetchData('delete_data', { sheetName: sheet, id: id }); showLoader(false); if(res.status === 'success') { showToast('Data berhasil dihapus'); loadSettingsData(); if(sheet === 'menus') initDashboard(); } }

function openEditModal(sheet, id) {
    let dataRow = null;
    if(sheet === 'users') { 
        dataRow = cachedSettingsData.users.find(r => r[0] == id); if(!dataRow) return; 
        document.getElementById('u-id').value = dataRow[0]; document.getElementById('u-username').value = dataRow[1]; document.getElementById('u-password').value = ''; document.getElementById('u-role').value = dataRow[3]; document.getElementById('u-nama').value = dataRow[4]; document.getElementById('u-status').value = dataRow[5]; 
        document.getElementById('title-user').innerText = 'Edit User'; 
        document.getElementById('modal-user').classList.add('active'); 
    } 
    else if(sheet === 'menus') { 
        dataRow = cachedSettingsData.menus.find(r => r[0] == id); if(!dataRow) return; 
        document.getElementById('m-id').value = dataRow[0]; document.getElementById('m-label').value = dataRow[1]; 
        document.getElementById('m-icon').value = dataRow[3]; 
        document.getElementById('icon-preview-display').className = `fa-solid ${dataRow[3]}`;
        document.getElementById('icon-text-display').innerText = dataRow[3];
        document.getElementById('m-access').value = dataRow[4]; document.getElementById('m-status').value = dataRow[5]; 
        const sourceType = dataRow[6] || 'internal';
        resetSegmentButtons(sourceType);
        toggleSourceUI(sourceType);
        if (sourceType === 'internal') { populateGithubFiles().then(() => { document.getElementById('m-file-list').value = dataRow[2]; }); } 
        else { document.getElementById('m-url-manual').value = dataRow[2]; document.getElementById('m-target').value = dataRow[7] || 'tab_new'; } 
        document.getElementById('title-menu').innerText = 'Edit Menu'; 
        document.getElementById('modal-menu').classList.add('active'); 
    }
}
