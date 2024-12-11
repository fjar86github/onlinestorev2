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
      if (response.status === 401) {
        showToast('Session expired. Please log in again.');
        localStorage.removeItem('token');
        window.location.href = 'login.html';
        return;
      }

      const result = await response.json();
      const userGreeting = document.getElementById('userGreeting');
      const userData = result.Name ? {
        UserID: result.UserID,
        Name: result.Name,
        Role: result.Role
      } : null;

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
      if (userData) {
        sessionStorage.setItem('userData', JSON.stringify(userData)); // Store user data in sessionStorage
        userGreeting.textContent = `Selamat Datang, ${result.Name} dengan id=${result.UserID} dengan Hak Akses=${result.Role}`;

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
    }
  } else {
    showToast('You are not logged in. Redirecting to login page...');
    window.location.href = 'login.html';
  }
}

// Load categories
async function loadCategories() {
  document.getElementById('loadingCategories').style.display = 'block'; // Show loading state
  try {
    const token = localStorage.getItem('token');
    //console.log(token);
    if (!token) throw new Error('Token tidak ditemukan.');

    const response = await fetch(`${apiUrlfrontend}/cart`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      showToast('Sesi habis. Silakan login lagi.');
      localStorage.removeItem('token');
      window.location.href = 'login.html';
      return;
    }

    if (!response.ok) {
      const errorData = await response.json();
      showToast(errorData);
      throw new Error('Gagal memuat kategori.');
    }

    const categories = await response.json();
    //console.log('Categories:', categories); // Log the response data
    displayCategories(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    document.getElementById('categoryContainer').innerHTML = `<tr><td colspan="4">Gagal memuat kategori: ${error.message}</td></tr>`;
  } finally {
    document.getElementById('loadingCategories').style.display = 'none'; // Hide loading state
  }
}

// Display categories in a table
function displayCategories(categories) {
  const categoryContainer = document.getElementById('categoryContainer');
  categoryContainer.innerHTML = '';

  if (categories.length === 0) {
    categoryContainer.innerHTML = '<tr><td colspan="7">Tidak ada kategori untuk ditampilkan.</td></tr>';
    return;
  }

  let totalHarga = 0; // Variabel untuk menghitung total harga seluruh produk

  categories.forEach(({ CartID, ProductID, Name, Price, Quantity }) => {
    // Pastikan Price dan Quantity adalah angka
    Price = parseFloat(Price);  // Mengkonversi Price menjadi angka
    Quantity = parseInt(Quantity); // Mengkonversi Quantity menjadi angka

    if (isNaN(Price) || isNaN(Quantity)) {
      console.error("Harga atau jumlah tidak valid:", Price, Quantity);
      return; // Skip jika ada data yang tidak valid
    }

    const row = document.createElement('tr');
    const totalPerItem = Price * Quantity; // Total per item
    totalHarga += totalPerItem; // Menambahkan total per item ke total harga keseluruhan

    row.innerHTML = `
        <td>${CartID}</td>
        <td>${ProductID}</td>
        <td>${Name}</td>
        <td>${formatCurrency(Price)}</td> <!-- Format Harga -->
        <td>${Quantity}</td>
        <td>${formatCurrency(totalPerItem)}</td>  <!-- Menampilkan total per produk -->
        <td>
          <button class="btn btn-danger" onclick="deleteCart(${CartID})">Hapus</button>
        </td>
      `;
    categoryContainer.appendChild(row);
  });

  // Menambahkan row untuk menampilkan total harga keseluruhan
  const totalRow = document.createElement('tr');
  totalRow.innerHTML = `
      <td colspan="5" style="text-align:right; font-weight: bold;">Total Harga Semua Produk</td>
      <td style="font-weight: bold; color: green;">${formatCurrency(totalHarga)}</td>
      <td></td>
    `;
  categoryContainer.appendChild(totalRow);

  // Menambahkan tombol checkout
  const checkoutRow = document.createElement('tr');
  checkoutRow.innerHTML = `
      <td colspan="6" style="text-align:right;">
        <button class="btn btn-success" onclick="checkout(${totalHarga})">Checkout</button>
      </td>
      <td></td>
    `;
  categoryContainer.appendChild(checkoutRow);
}

// Fungsi untuk memformat angka menjadi IDR (Rp)
function formatCurrency(amount) {
  return 'Rp ' + amount.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Fungsi untuk checkout
async function checkout(totalHarga) {
  const token = localStorage.getItem('token');
  const status = await checkMySQLStatus();
  console.log('Status MySQL server add product:', status ? 'Online' : 'Offline');

  if (!token) {
    showToast('Anda belum login. Silakan login terlebih dahulu.');
    window.location.href = 'login.html';
    return;
  }

  if (status) {
    try {
      const response = await fetch(`${apiUrlfrontend}/cart?action=checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        showToast('Sesi Anda telah habis. Silakan login lagi.');
        localStorage.removeItem('token');
        window.location.href = 'login.html';
        return;
      }

      const responseData = await response.json();

      if (!response.ok) {
        showToast(`Checkout gagal: ${responseData.message || 'Terjadi kesalahan'}`);
        throw new Error(responseData.message || 'Checkout failed');
      }
      showToast('Checkout berhasil. Terima kasih telah berbelanja!');
      gtag('event', 'checkout', {
        'event_category': 'E-commerce',
        'event_label': 'Checkout', // Use the category ID as the label
        'value': 1 // Value is 1 to indicate a successful checkout
      });
      setTimeout(() => location.reload(), 1000);
      // Redirect ke halaman order summary atau home
      //window.location.reload();
    } catch (error) {
      console.error('Error during checkout:', error.message);
      showToast('Terjadi kesalahan saat melakukan checkout. Silakan coba lagi.');
      gtag('event', 'checkoutfailed', {
        'event_category': 'E-commerce',
        'event_label': 'Checkout', // Use the category ID as the label
        'value': 1 // Value is 1 to indicate a successful checkout
      });
    }
  } else {
    const token = localStorage.getItem('token'); // Gunakan nama variabel yang lebih deskriptif
    const baseUrl = `${rabbitmqcheckout}`;

    try {
      const response = await fetch(`${baseUrl}/producer/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // Pastikan token benar
        },
        body: JSON.stringify({
          token: token, // Pastikan JSON memiliki key 'token' seperti yang diminta back-end
        })
      });

      if (response.ok) {
        gtag('event', 'checkout_queue', {
          event_category: 'E-commerce',
          event_label: token,
          value: 'Pesanan masuk ke antrian'
        });
        showToast("Pesanan masuk ke antrian rabbitmq");
        window.location.reload();
      } else {
        gtag('event', 'checkout_failed_queue', {
          event_category: 'E-commerce',
          event_label: token,
          value: 'Menghapus keranjang'
        });
        const errorMessage = await response.json();
        showToast(`Failed to send checkout information: ${errorMessage.error || errorMessage.message}`, 'error');
        window.location.reload();
      }
    } catch (error) {
      console.error('Error:', error);
      window.location.reload();
    }
  }
}

// Optional: Format currency helper
function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
}

// Fungsi untuk mengecek status MySQL dan mengembalikan nilai true/false
async function checkMySQLStatus() {
  try {
    // Mengambil status dari API
    const response = await fetch(`${apiUrlfrontend}/mysqlstatus.php`);

    // Mengecek apakah response berhasil (status code 200)
    if (response.ok) {
      const data = await response.json();

      // Mengembalikan true jika status MySQL online
      return data.status === 'online';
    } else {
    }
  } catch (error) {
    // Menangani error jika API tidak dapat dijangkau
    return false; // Jika terjadi error, anggap status offline
  }
}

// Function to delete a product
async function deleteCart(CartID) {
  if (confirm('Apakah Anda yakin ingin menghapus keranjang ini?')) {

    const status = await checkMySQLStatus();
    console.log('Status MySQL server add product:', status ? 'Online' : 'Offline');
    if (status) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${apiUrlfrontend}/cart/${CartID}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Gagal menghapus keranjang.');
        showToast('Keranjang berhasil dihapus.');
        loadCategories();
        // Google Analytics tracking for 'delete_category' event (successful)
        gtag('event', 'delete_cart', {
          'event_category': 'E-commerce',
          'event_label': CartID.toString(), // Use the category ID as the label
          'value': 1 // Value is 1 to indicate a successful deletion
        });
      } catch (error) {
        console.error('Error deleting cart:', error);
        showToast('Gagal menghapus keranjang.');
        // Google Analytics tracking for 'delete_category_failed' event (failed)
        gtag('event', 'delete_cart_failed', {
          'event_category': 'E-commerce',
          'event_label': CartID.toString(), // Use the category ID as the label
          'value': 0 // Value is 0 to indicate a failed deletion
        });
      }
    } else {
      const token = localStorage.getItem('token');
      const message = {
        token,
        cart: [{
          id: CartID
        }]
      };
      // Base URL of the RabbitMQ API
      const baseUrl = `${rabbitmqcart}`;
      try {
        const response = await fetch(`${baseUrl}/producer/delete`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(message)
        });

        if (response.ok) {
          gtag('event', 'delete_cartqueue', {
            'event_category': 'E-commerce',
            'event_label': id,  // Use the category id as the label
            'value': 'Menghapus keranjang'        // You can use the category's name as the event value
          });
          showToast("Keranjang berhasil dihapus ke antrian rabbitmq");
          window.location.reload();
        } else {
          gtag('event', 'delete_cartqueuefailed', {
            'event_category': 'E-commerce',
            'event_label': id,  // Use the category id as the label
            'value': 'Menghapus keranjang'        // You can use the category's description as the event value
          });
          const errorMessage = await response.json();  // Get error message as JSON
          showToast(`Failed to send cart information: ${errorMessage.error || errorMessage.message}`, 'error');
          window.location.reload();
        }
      } catch (error) {
        console.error('Error:', error);
        window.location.reload();
      }
    }
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
  loadCategories();
});