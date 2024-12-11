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

// Function to load external HTML files (header, sidebar, footer)
function loadHTML(id, file) {
  fetch(file)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to load ${file}`);
      }
      return response.text();
    })
    .then(data => {
      document.getElementById(id).innerHTML = data;
    })
    .catch(error => {
      console.error(`Error loading ${file}:`, error);
    });
}

// Function to get user profile from API
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
        userGreeting.textContent = `Selamat Datang, ${result.Name} dengan Hak Akses=${result.Role}`;

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
      console.error('Error fetching user profile:', error);
      document.getElementById('userGreeting').textContent = 'Error loading user profile.';
    }
  } else {
    showToast('You are not logged in. Redirecting to login page...');
    window.location.href = 'login.html';
  }
}

// Function to fetch all cart (no pagination needed from API)
async function loadCart() {
  const token = localStorage.getItem('token'); // Retrieve token from localStorage
  if (!token) {
    showToast('You are not logged in. Redirecting to login page...');
    window.location.href = 'login.html';
    return;
  }
  try {
    const response = await fetch(`${apiUrlfrontend}/cart`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error('Failed to load cart');

    const cart = await response.json();
    displayCart(cart);
  } catch (error) {
    console.error('Error fetching cart:', error);
    document.getElementById('CartContainer').innerHTML = '<p>Failed to load Cart.</p>';
  }
}

// Function to display the fetched products dynamically (show products based on currentPage)
function displayCart(cart) {
  const CartContainer = document.getElementById('CartContainer');
  CartContainer.innerHTML = ''; // Clear previous content

  // Loop through the selected carts and display them
  cart.forEach(carts => {
    const cartCard = `
          <div class="col-md-4">
            <div class="card">
              <div class="card-body">
                <h5 class="card-title">${carts.CartID}</h5>
                <p class="card-text"><strong>ProductID:</strong> ${carts.ProductID || 'No ProductID.'}</p>
                <p class="card-text"><strong>Name:</strong> $${carts.Name}</p>
                <p class="card-text"><strong>Price:</strong> ${carts.Price}</p>
                <p class="card-text"><strong>Quantity:</strong> ${carts.Quantity}</p>
                <p class="card-text"><strong>Total Bayar:</strong> $${carts.Price * carts.Quantity}</p>
                <button class="btn btn-primary" onclick="deleteCart(${carts.CartID})">Remove from Cart</button>
              </div>
            </div>
          </div>
        `;
    CartContainer.innerHTML += cartCard;
  });
}

async function deleteCart(CartID) {
  const token = localStorage.getItem('token'); // Retrieve token from localStorage
  if (!token) {
    showToast('You are not logged in. Redirecting to login page...');
    window.location.href = 'login.html';
    return;
  }
  try {
    const response = await fetch(`${apiUrlfrontend}/cart/${CartID}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error('Error deleting cart item');

    const cart = await response.json();
    showToast('Item removed from cart');
    window.location.reload(); // Reload page to refresh cart
  } catch (error) {
    console.error('Error deleting cart:', error);
    document.getElementById('CartContainer').innerHTML = '<p>Failed to remove item from Cart.</p>';
  }
}

var apiUrlfrontend = '';
var rabbitmqmanageproducts = '';
var rabbitmqmanagecategory = '';
var rabbitmqcart = '';
var rabbitmqcheckout = '';

// Load all necessary components on page load

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
  loadCart(); // Load all products and display cart
  getUserProfile(); // Get user profile
});