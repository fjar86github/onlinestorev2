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
      usercard.innerHTML = `
        <h5 id="userNameProfile">UserId Pengguna: ${result.UserID}</h5>
        <p id="username">Nama Pengguna: ${result.Name}</p>
        <p id="username">Email Pengguna: ${result.Email}</p>
        <p id="username">Hak Akses Pengguna: ${result.Role}</p>
        <p id="username">Waktu Registrasi: ${result.CreatedAt}</p>
        <p><button class="btn btn-warning" onclick="editUsers()">Edit</button></p>
      `;

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

      // Ambil rekomendasi produk
      await getRecommendedProducts(result.UserID, token);
    } else {
      userGreeting.textContent = 'User not found.';
    }
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('userGreeting').textContent = 'Error loading user profile.';
    showToast('Error fetching user profile. Please try again later.');
  }
}

async function getRecommendedProducts(userID) {
  try {
    const response = await fetch(`${rabbitmqmanageproducts}/api/recommend_knn/${userID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json' // Tambahkan jika diperlukan oleh API
      }
    });

    if (!response.ok) {
      throw new Error('Gagal mendapatkan rekomendasi produk.');
    }

    const result = await response.json();

    // Tangani data hasil API
    if (result.status === "success" && result["Recommended Products (KNN)"].length > 0) {
      const productList = result["Recommended Products (KNN)"].map(product => `
          <div class="card">
              <div class="card-content">
                  <h4 class="product-title">${product}</h4>
              </div>
          </div>
      `).join('');

      document.getElementById('userProfile').innerHTML = `
          <h5 id="userNameProfile">UserId Pengguna: ${result.UserID}</h5>
          <p><b>Rekomendasi Produk:</b></p>
          <div class="product-grid">
              ${productList}
          </div>
      `;
    } else {
      document.getElementById('userProfile').innerHTML = `
        <h5 id="userNameProfile">UserId Pengguna: ${result.UserID}</h5>
        <p>Tidak ada rekomendasi produk yang ditemukan.</p>
      `;
    }
  } catch (error) {
    console.error('Terjadi kesalahan:', error);
    document.getElementById('usercard').innerHTML = `<p>Terjadi kesalahan saat memuat rekomendasi produk.</p>`;
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
});