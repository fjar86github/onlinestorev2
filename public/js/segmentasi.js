
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

// Load external HTML files for header, sidebar, and footer
async function loadHTML(id, file) {
    try {
        const response = await fetch(file);
        if (!response.ok) throw new Error(`Failed to load ${file}`);
        const data = await response.text();
        document.getElementById(id).innerHTML = data;
    } catch (error) {
        console.error(`Error loading ${file}:`, error);
    }
}

// Declare userData outside any function to ensure it's accessible globally
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
            //localStorage.removeItem('token');
            //window.location.href = 'login.html';
            //return;
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

async function submit() {
    const token = localStorage.getItem('token'); // Ambil token dari localStorage

    if (!token) {
        showToast('You are not logged in. Redirecting to login page...');
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${apiUrlfrontend}/segmentasipelanggan`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch customer segmentation data. Status: ${response.status}`);
        }

        const result = await response.json();

        if (Array.isArray(result) && result.length > 0) {
            // Membuat list pelanggan
            const reviewList = result.map(review => `
                <tr>
                    <td>${review.UserID || 'Tidak ada data'}</td>
                    <td>${review.Name || 'Tidak ada data'}</td>
                    <td>${review.SpendingCategory || 'Tidak ada data'}</td>
                    <td>${review.FrequencyCategory || 'Tidak ada data'}</td>
                    <td>${review.FavoriteCategory || 'Tidak ada data'}</td>
                </tr>
            `).join('');

            document.getElementById('userProfile').innerHTML = `
    <p><b>Segmentasi Pelanggan Berdasarkan Frekuensi dan Jumlah Pemesanan:</b></p>
    <style>
        .customer-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .customer-table th, .customer-table td {
            text-align: left;
            padding: 12px 15px;
            border: 1px solid #ddd;
        }
        .customer-table th {
            background-color: #4CAF50;
            color: white;
        }
        .customer-table tr:nth-child(even) {
            background-color: #f2f2f2;
        }
        .customer-table tr:hover {
            background-color: #ddd;
        }
        .customer-table td {
            word-wrap: break-word;
            max-width: 200px;
        }
    </style>
    <table class="customer-table">
        <thead>
            <tr>
                <th>UserID</th>
                <th>Nama Pelanggan</th>
                <th>Kategori Pengeluaran</th>
                <th>Frekuensi Pemesanan</th>
                <th>Kategori Favorit</th>
            </tr>
        </thead>
        <tbody>
            ${reviewList}
        </tbody>
    </table>
`;

            // Fungsi untuk menghitung distribusi kategori
            const calculateDistribution = (data, key) => {
                return data.reduce((acc, item) => {
                    const value = item[key] || 'Tidak ada data';
                    acc[value] = (acc[value] || 0) + 1;
                    return acc;
                }, {});
            };

            // Menghitung distribusi kategori
            const spendingCategoryCounts = calculateDistribution(result, 'SpendingCategory');
            const frequencyCategoryCounts = calculateDistribution(result, 'FrequencyCategory');
            const favoriteCategoryCounts = calculateDistribution(result, 'FavoriteCategory');

            // Membuat grafik pie untuk tiap kategori
            const createPieChart = (ctxId, label, categoryCounts) => {
                const labels = Object.keys(categoryCounts);
                const data = Object.values(categoryCounts);

                const ctx = document.getElementById(ctxId).getContext('2d');
                new Chart(ctx, {
                    type: 'pie',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: label,
                            data: data,
                            backgroundColor: [
                                'rgba(75, 192, 192, 0.2)',
                                'rgba(153, 102, 255, 0.2)',
                                'rgba(255, 159, 64, 0.2)',
                                'rgba(54, 162, 235, 0.2)',
                                'rgba(255, 206, 86, 0.2)'
                            ],
                            borderColor: [
                                'rgba(75, 192, 192, 1)',
                                'rgba(153, 102, 255, 1)',
                                'rgba(255, 159, 64, 1)',
                                'rgba(54, 162, 235, 1)',
                                'rgba(255, 206, 86, 1)'
                            ],
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                display: true,
                                position: 'top'
                            }
                        }
                    }
                });
            };

            // Render grafik
            createPieChart('spendingCategoryChart', 'Distribusi Kategori Pengeluaran', spendingCategoryCounts);
            createPieChart('frequencyCategoryChart', 'Distribusi Frekuensi Pemesanan', frequencyCategoryCounts);
            createPieChart('favoriteCategoryChart', 'Distribusi Kategori Favorit', favoriteCategoryCounts);

        } else {
            document.getElementById('userProfile').innerHTML = `
                <p>Tidak ada segmentasi pelanggan yang dihasilkan.</p>
            `;
        }
    } catch (error) {
        console.error('Terjadi kesalahan:', error);
        document.getElementById('userProfile').innerHTML = `
            <p>Terjadi kesalahan saat analisis segmentasi pelanggan. Silakan coba lagi nanti.</p>
        `;
    }
}


// Initialize page
var apiUrlfrontend = '';
var rabbitmqmanageproducts = '';
var rabbitmqmanagecategory = '';
var rabbitmqcart = '';
var rabbitmqcheckout = '';

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

    getUserProfile();
    submit();
});