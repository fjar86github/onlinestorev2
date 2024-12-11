// Variabel untuk menyimpan URL API
let apiUrl = "";

// Fungsi untuk memuat konfigurasi dari config.json
async function loadConfig() {
    try {
        const response = await fetch('./js/api_endpoints.json'); // Path ke config.json
        if (!response.ok) {
            throw new Error('Failed to load api_endpoints.json');
        }
        const config = await response.json();
        apiUrl = config.apiUrl || "";
        console.log('API URL loaded:', apiUrl);
    } catch (error) {
        console.error('Error loading config:', error.message);
    }
}

// Fungsi untuk mendapatkan URL API
function getApiUrl() {
    return apiUrl;
}

// Tambahkan ke namespace global
window.ApiConfig = {
    loadConfig,
    getApiUrl
};
