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
let userData = null;

async function getUserProfile() {
    const token = localStorage.getItem('token'); // Ambil token dari localStorage
    if (!token) {
        showToast('You are not logged in. Redirecting to login page...');
        window.location.href = 'login.html';
        return;
    }

    try {
        // Ambil profil pengguna
        const response = await fetch(`${apiUrlfrontend}/profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        // Periksa apakah token valid
        if (response.status === 401) {
            showToast('Session expired. Please log in again.');
            localStorage.removeItem('token');
            window.location.href = 'login.html';
            return;
        }

        const result = await response.json();
        const userGreeting = document.getElementById('userGreeting');
        const usercard = document.getElementById('userProfile');

        // Periksa apakah data pengguna valid
        if (result.Name) {
            userData = {
                UserID: result.UserID,
                Name: result.Name,
                Email: result.Email,
                Password: result.PasswordHash
            };

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

            // Simpan data pengguna ke sessionStorage
            sessionStorage.setItem('userData', JSON.stringify(userData));

            // Tampilkan data pengguna
            userGreeting.textContent = `Selamat Datang, ${result.Name} dengan id=${result.UserID} dengan Hak Akses=${result.Role}`;
            // Tampilkan menu pengguna
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
                <li class="nav-item">
                    <a class="nav-link" href="#" id="logoutLink">Logout ${result.Name}</a>
                </li>
            `;

            // Tambahkan fitur logout
            document.getElementById('logoutLink').addEventListener('click', function () {
                localStorage.removeItem('token'); // Hapus token
                sessionStorage.removeItem('userData'); // Hapus data sesi
                window.location.href = 'login.html'; // Redirect ke halaman login
            });
        } else {
            userGreeting.textContent = 'User not found.';
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('userGreeting').textContent = 'Error loading user profile.';
        showToast('Error fetching user profile. Please try again later.');
    }
}

async function submit() {
    try {
        const response = await fetch(`${rabbitmqmanageproducts}/get-reviews`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json' // Tambahkan jika diperlukan oleh API
            }
        });

        if (!response.ok) {
            throw new Error('Gagal mendapatkan data ulasan produk.');
        }

        const result = await response.json();

        // Menangani hasil data dari API
        if (result && Array.isArray(result) && result.length > 0) {
            // Membuat list ulasan dan analisis sentimen
            const reviewList = result.map(review => `
                <tr>
                    <td>${review.ReviewID}</td>
                    <td>${review.ProductName}</td>
                    <td>${review.Comment ? review.Comment : 'Tidak ada komentar'}</td>
                    <td>${review.Sentiment}</td>
                </tr>
            `).join('');

            document.getElementById('userProfile').innerHTML = `
                <p><b>Ulasan Produk dan Analisis Sentimen:</b></p>
                <table border="1" style="border-collapse: collapse; width: 100%;">
                    <thead>
                        <tr>
                            <th>Review ID</th>
                            <th>Nama Produk</th>
                            <th>Komentar</th>
                            <th>Sentimen</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${reviewList}
                    </tbody>
                </table>
            `;

            // Menampilkan grafik sentimen dengan Chart.js
            const sentiments = result.map(review => review.Sentiment);
            const sentimentCounts = sentiments.reduce((acc, sentiment) => {
                acc[sentiment] = (acc[sentiment] || 0) + 1;
                return acc;
            }, {});

            const labels = Object.keys(sentimentCounts);
            const data = Object.values(sentimentCounts);

            const ctx = document.getElementById('stockChart').getContext('2d');
            new Chart(ctx, {
                type: 'pie', // Grafik pie untuk distribusi sentimen
                data: {
                    labels: labels, // Sentimen (Positif, Negatif, dll.)
                    datasets: [{
                        label: 'Distribusi Sentimen Ulasan Produk',
                        data: data, // Jumlah ulasan untuk tiap sentimen
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

        } else {
            document.getElementById('userProfile').innerHTML = `
                <p>Tidak ada ulasan produk yang ditemukan.</p>
            `;
        }
    } catch (error) {
        console.error('Terjadi kesalahan:', error);
        document.getElementById('userProfile').innerHTML = `<p>Terjadi kesalahan saat memuat ulasan produk dan analisis sentimen.</p>`;
    }
}

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

    getUserProfile();
    submit();
});