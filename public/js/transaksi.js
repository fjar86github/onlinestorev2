function showToast(message, duration = 3000) {
    const existingToast = document.getElementById('toast-notification');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.innerText = message;
    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: '#333',
        color: '#fff',
        padding: '10px 20px',
        borderRadius: '5px',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.3)',
        zIndex: '1000',
        fontSize: '14px',
        opacity: '0',
        transition: 'opacity 0.3s ease'
    });

    document.body.appendChild(toast);

    setTimeout(() => (toast.style.opacity = '1'), 100);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

async function loadHTML(id, file) {
    try {
        const response = await fetch(file);
        if (!response.ok) throw new Error(`Gagal memuat ${file}`);
        document.getElementById(id).innerHTML = await response.text();
    } catch (error) {
        console.error(`Error loading ${file}:`, error);
    }
}

async function getUserProfile() {
    const token = localStorage.getItem('token');
    if (!token) {
        showToast('Anda belum login. Redirecting...');
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${apiUrlfrontend}/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.status === 401) {
            showToast('Session expired. Please log in again.');
            localStorage.removeItem('token');
            window.location.href = 'login.html';
            return;
        }

        const result = await response.json();
        const { UserID, Name, Role } = result;
        if (result && result.Role) {
            // Mengatur menu berdasarkan peran pengguna
            const sidebarMenu = document.querySelector('.sidebar-menu');
            console.log('Role user dari sidebar', result.Role);
            if (result.Role === 'Customer') {
                // Hapus menu yang tidak relevan untuk Customer
                removeMenuItems(sidebarMenu, [
                    'Manage Categories',
                    'Notifications',
                    'Manage Products',
                    'Manage Users',
                    'Data Transaksi Semua Pengguna',
                    'Prediksi Permintaan Stok',
                    'Analisis Sentimen Produk',
                    'Analisis Segmentasi Pelanggan',
                ]);
            } else if (result.Role === 'Admin') {
                // Tambahkan logika khusus untuk Admin jika diperlukan
            }
        }
        document.getElementById('userGreeting').textContent = `Selamat Datang, ${Name} (ID: ${UserID}, Role: ${Role})`;
        // Update the header with user's name and logout button
        const userInfo = document.getElementById('userInfo');
        userInfo.innerHTML = `
        <li class="nav-item">
                        <a class="nav-link" href="product-list.html">Products</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="cart.html">Cart</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="checkout.html">Checkout</a>
                    </li>
                     <li class="nav-item">
                            <a class="nav-link" href="recomended.html">Rekomendasi Produk</a>
                        </li>
          <a class="nav-link" href="#" id="logoutLink">Logout ${result.Name}</a>
          </li>
        `;
    } catch (error) {
        document.getElementById('userGreeting').textContent = 'Error loading profile.';
        console.error('Error:', error);
    }
}

async function fetchData(mode, searchQuery = '') {
    const token = localStorage.getItem('token');

    if (!token) {
        showToast('Anda belum login. Redirecting...');
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${apiUrlfrontend}/transaksi/${mode}?search=${encodeURIComponent(searchQuery)}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
            const errorData = await response.json();
            showToast(`Error: ${errorData.message}`);
            return;
        }

        const data = await response.json();
        populateTable(data);
    } catch (error) {
        console.error('Error fetching data:', error);
        showToast('Gagal mengambil data.');
    }
}

function populateTable(data) {
    const table = document.querySelector('table');
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');

    // Hapus data lama
    thead.innerHTML = '';
    tbody.innerHTML = '';

    if (data.length === 0) {
        const noDataRow = document.createElement('tr');
        noDataRow.innerHTML = `<td colspan="100%">Tidak ada data tersedia</td>`;
        tbody.appendChild(noDataRow);
        return;
    }

    // Buat Header Tabel
    const headers = Object.keys(data[0]);
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header; // Nama kolom dari API
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    // Buat Body Tabel
    data.forEach(row => {
        const tr = document.createElement('tr');
        headers.forEach(header => {
            const td = document.createElement('td');
            td.textContent = row[header] !== null && row[header] !== undefined ? row[header] : '-'; // Isi data
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}

const dataOpsi = document.getElementById("dataopsi");
const categoryContainer = document.getElementById("categoryContainer");
const tableHead = document.querySelector(".table thead");

// Event listener untuk dropdown
dataOpsi.addEventListener("change", () => {
    const selectedOption = dataOpsi.value;
    fetchData(selectedOption, '');
});

document.getElementById('searchButton').addEventListener('click', () => {
    const searchQuery = document.getElementById('searchInput').value.trim();
    fetchData(dataOpsi.value, searchQuery);
});

// Optionally handle search on pressing Enter
document.getElementById('searchInput').addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        const searchQuery = event.target.value.trim();
        currentPage = 1;
        fetchData(dataOpsi.value, searchQuery);
    }
});

var apiUrlfrontend = '';
var rabbitmqmanageproducts = '';
var rabbitmqmanagecategory = '';
var rabbitmqcart = '';
var rabbitmqcheckout = '';
// Initialize page

window.addEventListener('DOMContentLoaded', async () => {
    await ApiConfig.loadConfig("apiUrl"); // Memastikan konfigurasi dimuat
    apiUrlfrontend = ApiConfig.getApiUrl();
    await ApiConfig.loadConfig("rabbitmqmanageproducts"); // Memastikan konfigurasi dimuat
    rabbitmqmanageproducts = ApiConfig.getApiUrl();
    await ApiConfig.loadConfig("rabbitmqmanagecategory"); // Memastikan konfigurasi dimuat
    rabbitmqmanagecategory = ApiConfig.getApiUrl();
    await ApiConfig.loadConfig("rabbitmqcart"); // Memastikan konfigurasi dimuat
    rabbitmqcart = ApiConfig.getApiUrl();
    await ApiConfig.loadConfig("rabbitmqcheckout"); // Memastikan konfigurasi dimuat
    rabbitmqcheckout = ApiConfig.getApiUrl();
    // Log semua variabel dalam satu objek
    loadHTML('header', 'templates/header.html');
    loadHTML('sidebar', 'templates/sidebar.html');
    loadHTML('footer', 'templates/footer.html');

    fetchData(1, '');
    getUserProfile();
});