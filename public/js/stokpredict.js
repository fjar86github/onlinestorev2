function showToast(message, duration = 3000) {
    // Cek jika elemen toast sudah ada
    let existingToast = document.getElementById('toast-notification');
    if (existingToast) {
        existingToast.remove(); // Hapus elemen sebelumnya jika ada
    }

    // Buat elemen div untuk toast
    const toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.innerText = message;
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.backgroundColor = '#333';
    toast.style.color = '#fff';
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '5px';
    toast.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.3)';
    toast.style.zIndex = '1000';
    toast.style.fontSize = '14px';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';

    // Tambahkan elemen toast ke dalam body
    document.body.appendChild(toast);

    // Animasi tampil
    setTimeout(() => {
        toast.style.opacity = '1';
    }, 100);

    // Hapus toast setelah durasi tertentu
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            toast.remove();
        }, 300); // Tambahan waktu untuk efek transisi
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

// Get user profile
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

// Fungsi checkIfSelected untuk validasi apakah ada pilihan di select
function checkIfSelected(selectcomponent, message) {
    const select = document.getElementById(selectcomponent); // Mengambil elemen select
    const selectedValue = select.value; // Mendapatkan nilai yang dipilih

    // Memeriksa apakah ada nilai yang dipilih
    if (selectedValue === "") {
        showToast(message); // Menampilkan pesan jika tidak ada yang dipilih
        select.focus(); // Fokus ke elemen select
        return false; // Kembalikan false jika tidak ada pilihan
    }
    return true; // Kembalikan true jika ada pilihan
}

async function submit() {
    // Periksa apakah select 'selectyears' dan 'selectmonth' sudah dipilih
    if (!checkIfSelected('selectyears', 'Silahkan Pilih Tahun') || !checkIfSelected('selectmonth', 'Silahkan Pilih Bulan')) {
        return; // Jika ada yang belum dipilih, hentikan eksekusi
    }

    try {
        // Mengambil nilai dari elemen select dan mengonversinya menjadi angka
        const year = parseInt(document.getElementById('selectyears').value, 10);
        const month = parseInt(document.getElementById('selectmonth').value, 10);

        const data = {
            Year: year,
            Month: month
        };

        const response = await fetch(`${rabbitmqmanageproducts}/api/stock_demand`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json' // Tambahkan jika diperlukan oleh API
            },
            body: JSON.stringify(data) // Mengonversi objek JavaScript ke string JSON
        });

        if (!response.ok) {
            throw new Error('Gagal mendapatkan Prediksi Stok Produk.');
        }

        const result = await response.json();

        // Tangani data hasil API
        if (result.status === "success" && result["Predicted Demands"].length > 0) {
            const labels = result["Predicted Demands"].map(product => product.ProductName);
            const demandData = result["Predicted Demands"].map(product => product["Predicted Demand"]);

            // Menampilkan data dalam tabel
            const productList = result["Predicted Demands"].map(product => `
                <tr>
                    <td>${product.ProductID}</td>
                    <td>${product.ProductName}</td>
                    <td>${product["Predicted Demand"]}</td>
                </tr>
            `).join('');

            document.getElementById('userProfile').innerHTML = `
                <p><b>Prediksi Permintaan Stok:</b></p>
                <table border="1" style="border-collapse: collapse; width: 100%;">
                    <thead>
                        <tr>
                            <th>Produk ID</th>
                            <th>Nama Produk</th>
                            <th>Prediksi Permintaan Stok</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${productList}
                    </tbody>
                </table>
                <canvas id="stockChart" width="400" height="200"></canvas>
            `;

            // Menampilkan grafik dengan Chart.js
            const ctx = document.getElementById('stockChart').getContext('2d');
            new Chart(ctx, {
                type: 'bar', // Anda bisa mengganti 'bar' dengan 'line' untuk grafik garis
                data: {
                    labels: labels, // Nama produk
                    datasets: [{
                        label: 'Prediksi Permintaan Stok',
                        data: demandData, // Prediksi permintaan stok
                        backgroundColor: [
                            'rgba(75, 192, 192, 0.2)', // Warna untuk setiap bar
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
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Jumlah Permintaan'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Nama Produk'
                            }
                        }
                    }
                }
            });

        } else {
            document.getElementById('userProfile').innerHTML = `
                <p>Tidak ada prediksi permintaan stok yang ditemukan.</p>
            `;
        }
    } catch (error) {
        console.error('Terjadi kesalahan:', error);
        document.getElementById('userProfile').innerHTML = `<p>Terjadi kesalahan saat memuat prediksi permintaan stok.</p>`;
    }
}


// Fungsi untuk mengisi select dengan rentang tahun
function populateYears() {
    const select = document.getElementById('selectyears'); // Menyimpan elemen select
    const currentYear = new Date().getFullYear(); // Mendapatkan tahun saat ini
    const startYear = 2000; // Tahun mulai
    const endYear = currentYear; // Tahun akhir adalah tahun saat ini

    // Menghapus semua opsi yang ada di dalam select
    select.innerHTML = '';

    // Membuat opsi default
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Pilih Tahun';
    select.appendChild(defaultOption);

    // Mengisi select dengan rentang tahun
    for (let year = startYear; year <= endYear; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        select.appendChild(option);
    }

    const select2 = document.getElementById('selectmonth'); // Menyimpan elemen select
    // Menghapus semua opsi yang ada di dalam select
    select2.innerHTML = '';

    // Membuat opsi default untuk bulan
    const defaultOption2 = document.createElement('option');
    defaultOption2.value = '';
    defaultOption2.textContent = 'Pilih Bulan';
    select2.appendChild(defaultOption2); // Menambahkan opsi default bulan

    // Mengisi select dengan rentang bulan
    for (let month = 1; month <= 12; month++) {
        const option = document.createElement('option');
        option.value = month;
        option.textContent = month;
        select2.appendChild(option);
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
    populateYears();
});