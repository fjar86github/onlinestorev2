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
  const token = localStorage.getItem('token'); // Use localStorage for persistence
  if (token) {
    try {
      const response = await fetch(`${apiUrlfrontend}/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // If session has expired, notify the user and redirect to login page
      if (response.status === 401) {
        showToast('Session expired. Please log in again.');
        localStorage.removeItem('token');
        window.location.href = 'login.html';
        return;
      }

      // Parse the response to get user data
      const result = await response.json();
      const userGreeting = document.getElementById('userGreeting');
      const usercard = document.getElementById('userProfile');
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

        // Store user information in sessionStorage for later use
        sessionStorage.setItem('userData', JSON.stringify(userData));

        // Display the user data in greeting
        userGreeting.textContent = `Selamat Datang, ${result.Name} dengan id=${result.UserID} dengan Hak Akses=${result.Role}`;
        usercard.innerHTML = `<h5 id="userNameProfile">UserId Pengguna: ${result.UserID}</h5>
          <p id="username">Nama Pengguna: ${result.Name}</p>
          <p id="username">Email Pengguna: ${result.Email}</p>
          <p id="username">Hak Akses Pengguna: ${result.Role}</p>
          <p id="username">Waktu Registrasi: ${result.CreatedAt}</p>
          <p><button class="btn btn-warning" onclick="editUsers()">Edit</button></p>`;
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
                  <li class="nav-item">
                      <a class="nav-link" href="#" id="logoutLink">Logout ${result.Name}</a>
                  </li>
              `;

        // Add the logout functionality
        document.getElementById('logoutLink').addEventListener('click', function () {
          localStorage.removeItem('token'); // Remove token from localStorage
          sessionStorage.removeItem('userData'); // Clear session data
          window.location.href = 'login.html'; // Redirect to login page
        });

      } else {
        userGreeting.textContent = 'User not found.';
      }
    } catch (error) {
      document.getElementById('userGreeting').textContent = 'Error loading user profile.';
      showToast('Error fetching user profile. Please try again later.');
    }
  } else {
    showToast('You are not logged in. Redirecting to login page...');
    window.location.href = 'login.html';
  }
}


async function editUsers() {
  showToast("Password tidak ditampilkan untuk keamanan, silahkan anda masukan password kembali saat memperbaharui data pengguna");
  // Google Analytics tracking for 'edit_user_profile' event
  gtag('event', 'edit_user_profile', {
    'event_category': 'User Management',
    'event_label': 'Edit User Profile',
    'value': userData.UserID  // You can use UserID or another value that is relevant for your tracking
  });
  const usercard = document.getElementById('userProfile');
  usercard.innerHTML = `
    <div class="form-group">
      <label for="userId">UsersId:</label>
      <input type="text" id="userId" class="form-control" placeholder="Userid Otomatis dari sistem" disabled value=${userData.UserID}>
    </div>
    <div class="form-group">
      <label for="userName">Nama Users:</label>
      <input type="text" id="userName" class="form-control" placeholder="Masukkan nama users" value=${userData.Name}>
    </div>
    <div class="form-group">
      <label for="useremail">Email:</label>
      <input type="text" id="useremail" class="form-control" placeholder="Masukkan email" value=${userData.Email}>
    </div>    
    <div class="form-group">
      <label for="userpassword">Password:</label>
      <input type="text" id="userpassword" class="form-control" placeholder="Masukkan Password">
    </div>
    <p><button class="btn btn-warning" id="updatebutton" onclick="updateUsers()">Update</button>
    <button class="btn btn-warning" id="cancelbutton" onclick="cancel()">Batal</button></p>
    `;
  document.getElementById('userpassword').focus();
}


async function updateUsers() {
  const userId = parseInt(document.getElementById('userId').value, 10);
  const name = document.getElementById('userName').value;
  const email = document.getElementById('useremail').value;
  const passwordHash = document.getElementById('userpassword').value;
  const role = 'Customer';
  if (!name || !email || !passwordHash) {
    showToast('Lengkapi semua data yang ada');
    document.getElementById('userName').focus();
    return;
  }
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${apiUrlfrontend}/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, passwordHash, role })
    });

    const responseData = await response.json(); // Log response
    //console.log(responseData); // Add this to monitor the response from the server

    if (!response.ok) throw new Error(responseData.message || 'Gagal memperbarui User.');
    showToast('Users berhasil diperbarui.');
    getUserProfile();
    cancel();
  } catch (error) {
    console.error('Error updating users:', error);
    showToast('Gagal memperbarui pengguna.');
  }
}

function cancel() {
  window.location.reload();
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