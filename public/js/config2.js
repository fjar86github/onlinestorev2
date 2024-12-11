// Variabel untuk menyimpan URL API
let apiUrl = "";

// Fungsi untuk memuat konfigurasi dari config.json
async function loadConfig(selectedKey) {
    try {
        const response = await fetch('./js/endpoints.json'); // Path ke file JSON
        if (!response.ok) {
            throw new Error('Failed to load api_endpoints.json');
        }
        const config = await response.json();

        // Memilih nilai berdasarkan kunci yang diberikan sebagai parameter
        const selectedValue = config[selectedKey] || 'Key not found'; // Jika kunci tidak ada, tampilkan pesan 'Key not found'
        apiUrl = selectedValue || "";
        //console.log(`Selected Value for ${selectedKey}:`, selectedValue);
    } catch (error) {
        console.error('Error loading config:', error.message);
    }
}

// Fungsi untuk menghapus item menu berdasarkan teksnya atau elemen tertentu
function removeMenuItems(menuElement, itemsToRemove) {
    // Menghapus item menu berdasarkan teks
    const menuItems = menuElement.querySelectorAll('li a');
    menuItems.forEach(item => {
        if (itemsToRemove.includes(item.textContent)) {
            item.parentElement.remove();
        }
    });

    // Menghapus menu <ul class="menu-bar"> jika ada
    const menuBar = menuElement.querySelector('.menu-bar');
    if (menuBar) {
        menuBar.remove();
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
