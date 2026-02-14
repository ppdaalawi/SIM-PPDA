/* js/api.js */
let githubFilesCache = null;

async function fetchData(action, payload = {}) {
    // DIHILANGKAN: showLoader(true) -> biarkan core.js yang pegang kontrol
    
    const dataToSend = { action: action, ...payload };

    try {
        const formData = new FormData();
        formData.append('data', JSON.stringify(dataToSend));

        const response = await fetch(APP_CONFIG.API_URL, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

        const result = await response.json();

        if (result.status === 'error' && typeof showToast === 'function') {
            showToast(result.message, 'error');
        }

        return result;

    } catch (error) {
        console.error("Fetch Error:", error);
        if(typeof showToast === 'function') showToast("Gagal menghubungi server.", "error");
        return { status: 'error', message: error.toString() };
    }
    // DIHILANGKAN: finally { showLoader(false) }
}

async function fetchGithubFiles() {
    if (githubFilesCache) return githubFilesCache;
    try {
        const res = await fetchData('get_github_files');
        if (res.status === 'success') {
            githubFilesCache = res.data;
            return res.data;
        }
        return [];
    } catch (e) {
        return [];
    }
}
