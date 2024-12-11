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


// Load external HTML files
async function loadHTML(id, file) {
  try {
    const response = await fetch(file);
    if (!response.ok) throw new Error(`Failed to load ${file}`);
    document.getElementById(id).innerHTML = await response.text();
  } catch (error) {
    console.error(`Error loading ${file}:`, error);
  }
}

// Fetch and display user profile
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
        alert('Session expired. Please log in again.');
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
    alert('You are not logged in. Redirecting to login page...');
    window.location.href = 'login.html';
  }
}

// Fetch and display products
async function loadProducts() {
  document.getElementById('loadingProducts').style.display = 'block';

  try {
    const response = await fetch(`${apiUrlfrontend}/products`);
    if (!response.ok) throw new Error('Gagal memuat produk.');

    const products = await response.json();
    displayProducts(products);
  } catch (error) {
    console.error('Error loading products:', error);
    document.getElementById('productContainer').innerHTML = '<tr><td colspan="7">Gagal memuat produk.</td></tr>';
  } finally {
    document.getElementById('loadingProducts').style.display = 'none';
  }
}


async function loadCategories() {
  const categorySelect = document.getElementById('productCategory');
  const loadingIndicator = document.getElementById('loadingCategories');

  categorySelect.innerHTML = '<option value="" disabled selected>Memuat kategori...</option>';

  try {
    const token = localStorage.getItem('token');
    //console.log('Token:', token); // Debugging untuk memastikan token tersedia
    if (!token) throw new Error('Token tidak ditemukan.');

    // Fetch data dengan token
    const response = await fetch(`${apiUrlfrontend}/categories`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      alert('Sesi habis. Silakan login lagi.');
      localStorage.removeItem('token');
      window.location.href = 'login.html';
      return;
    }

    if (!response.ok) {
      const errorData = await response.json();
      alert(`Kesalahan: ${errorData.message || 'Gagal memuat kategori.'}`);
      throw new Error('Gagal memuat kategori.');
    }

    const categories = await response.json();
    // Bersihkan opsi dropdown dan tambahkan data kategori
    categorySelect.innerHTML = '<option value="" disabled selected>Pilih Kategori</option>';
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.CategoryID; // Ganti dengan nama atribut sesuai API
      option.textContent = category.Name; // Ganti dengan nama atribut sesuai API
      categorySelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    categorySelect.innerHTML = '<option value="" disabled>Gagal memuat kategori.</option>';
  } finally {
    // Sembunyikan indikator loading
  }
}

// Display products in a table
function displayProducts(products) {
  const container = document.getElementById('productContainer');
  container.innerHTML = products.length
    ? products.map(product => `
      <tr>
        <td>${product.ProductID}</td>
        <td>${product.Name}</td>
        <td>${product.Description}</td>
        <td>${product.Price}</td>
        <td>${product.Stock}</td>
        <td>${product.CategoryID}</td>
        <td>${product.ImageURL}</td>
        <td>
          <button class="btn btn-warning" onclick="editProduct(${product.ProductID})">Edit</button>
          <button class="btn btn-danger" onclick="deleteProduct(${product.ProductID})">Hapus</button>
        </td>
      </tr>`).join('')
    : '<tr><td colspan="7">Tidak ada produk yang ditemukan.</td></tr>';
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

// Add a new product
async function addProduct() {
  const name = document.getElementById('productName').value;
  const description = document.getElementById('productDescription').value;
  const price = parseFloat(document.getElementById('productPrice').value);
  const stock = parseInt(document.getElementById('productStock').value, 10);
  const category_id = parseInt(document.getElementById('productCategory').value, 10);
  const image = document.getElementById('productimage').value;

  if (!name || !description || isNaN(price) || isNaN(stock) || !category_id || !image) {
    showToast('Silahkan isi semua data dengan lengkap.');
    document.getElementById('productName').focus();
    return;
  }

  const status = await checkMySQLStatus();
  console.log('Status MySQL server add product:', status ? 'Online' : 'Offline');


  if (status) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrlfrontend}/products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, description, price, stock, category_id, image })
      });
      if (!response.ok) throw new Error('Gagal menambahkan produk.');
      document.getElementById('productCategory').selectedIndex = 0;
      document.getElementById('productName').value = '';
      document.getElementById('productDescription').value = '';
      document.getElementById('productPrice').value = '';
      document.getElementById('productStock').value = '';
      document.getElementById('productCategory').value = '';
      document.getElementById('productimage').value = '';
      // Google Analytics tracking for 'add_product' event (successful)
      gtag('event', 'add_product', {
        'event_category': 'E-commerce',
        'event_label': name,  // Use the product name as the label
        'value': price        // You can use the product's price as the event value
      });
      showToast('Produk berhasil ditambahkan.');
      window.location.reload();
    } catch (error) {
      console.error('Error adding product:', error);
      showToast('Error produk tidak dapat ditambahkan');
      // Google Analytics tracking for 'add_product_failed' event (failed)
      gtag('event', 'add_product_failed', {
        'event_category': 'E-commerce',
        'event_label': name,  // Use the product name as the label
        'value': price        // You can use the product's price as the event value
      });
    }
  } else {
    const token = localStorage.getItem('token');
    const message = {
      token,
      products: [{
        name,
        description,
        price,
        stock,
        category_id,
        image
      }]
    };
    // Base URL of the RabbitMQ API
    const baseUrl = `${rabbitmqmanageproducts}`;
    try {
      const response = await fetch(`${baseUrl}/producer/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });

      if (response.ok) {
        gtag('event', 'add_productqueue', {
          'event_category': 'E-commerce',
          'event_label': name,  // Use the product name as the label
          'value': price        // You can use the product's price as the event value
        });
        showToast("Produk berhasil ditambahkan ke antrian rabbitmq");
        window.location.reload();
      } else {
        gtag('event', 'add_productqueuefailed', {
          'event_category': 'E-commerce',
          'event_label': name,  // Use the product name as the label
          'value': price        // You can use the product's price as the event value
        });
        const errorMessage = await response.json();  // Get error message as JSON
        showToast(`Failed to send product information: ${errorMessage.error || errorMessage.message}`, 'error');
        window.location.reload();
      }
    } catch (error) {
      console.error('Error:', error);
      window.location.reload();
    }
  }
}

function cancel() {
  document.getElementById('productId').value = '';
  document.getElementById('productName').value = '';
  document.getElementById('productDescription').value = '';
  document.getElementById('productPrice').value = '';
  document.getElementById('productStock').value = '';
  document.getElementById('productCategory').selectedIndex = 0;
  document.getElementById('productimage').value = '';
  document.getElementById('updateProductButton').disabled = true;
  document.getElementById('cancelProductButton').disabled = true;
  document.getElementById('saveProductButton').disabled = false;
}
// Function to edit product details
async function editProduct(productId) {
  const status = await checkMySQLStatus();
  console.log('Status MySQL server add product:', status ? 'Online' : 'Offline');
  if (status) {
    try {
      // Menampilkan nilai productId untuk debugging
      console.log('productId:', productId);
      // Google Analytics tracking for 'edit_product' event (start editing product)
      gtag('event', 'edit_product', {
        'event_category': 'E-commerce',
        'event_label': `Edit Product ID: ${productId}`,
      });
      // Fetch product details by ProductID
      const response = await fetch(`${apiUrlfrontend}/products/${productId}`);
      if (!response.ok) throw new Error('Gagal memuat detail produk.');

      const product = await response.json();

      // Populate form fields with existing product data
      document.getElementById('productId').value = product.ProductID;
      document.getElementById('productName').value = product.Name;
      document.getElementById('productDescription').value = product.Description;
      document.getElementById('productPrice').value = product.Price;
      document.getElementById('productStock').value = product.Stock;
      document.getElementById('productCategory').value = product.CategoryID;
      document.getElementById('productimage').value = product.ImageURL;

      // Scroll ke bagian atas halaman
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Add event listener to save the edited product
      const updateButton = document.getElementById('updateProductButton');
      updateButton.onclick = async function () {
        const updatedProduct = {
          name: document.getElementById('productName').value,
          description: document.getElementById('productDescription').value,
          price: document.getElementById('productPrice').value,
          stock: document.getElementById('productStock').value,
          category_id: document.getElementById('productCategory').value,
          image: document.getElementById('productimage').value
        };
        await updateProduct(productId, updatedProduct);
      };
      document.getElementById('updateProductButton').disabled = false;
      document.getElementById('cancelProductButton').disabled = false;
      document.getElementById('saveProductButton').disabled = true;
    } catch (error) {
      console.error('Error editing product:', error);
      showToast('Gagal memuat detail produk.');
      // Google Analytics tracking for 'edit_product_failed' event (failed to load product)
      gtag('event', 'edit_product_failed', {
        'event_category': 'E-commerce',
        'event_label': `Failed Edit Product ID: ${productId}`,
      });
    }
  } else {
    showToast("Maaf ada kendala pada server basis data, mohon coba secara berkala");
  }
}

// Function to update product after editing
async function updateProduct() {
  const id = parseInt(document.getElementById('productId').value, 10);
  const name = document.getElementById('productName').value;
  const description = document.getElementById('productDescription').value;
  const price = parseFloat(document.getElementById('productPrice').value);
  const stock = parseInt(document.getElementById('productStock').value, 10);
  const category_id = parseInt(document.getElementById('productCategory').value, 10);
  const image = document.getElementById('productimage').value;

  if (!id || !name || !description || isNaN(price) || isNaN(stock) || !category_id || !image) {
    alert('Semua field wajib diisi.');
    return;
  }

  const status = await checkMySQLStatus();
  console.log('Status MySQL server add product:', status ? 'Online' : 'Offline');
  if (status) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrlfrontend}/products/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, name, description, price, stock, category_id, image })
      });

      const responseData = await response.json(); // Log response
      console.log(responseData); // Add this to monitor the response from the server

      if (!response.ok) throw new Error(responseData.message || 'Gagal memperbarui produk.');
      // Google Analytics tracking for successful product update
      gtag('event', 'update_product', {
        'event_category': 'E-commerce',
        'event_label': `Product Updated: ${id}`,
        'value': price,
      });
      showToast('Produk berhasil diperbarui.');
      window.location.reload();
    } catch (error) {
      console.error('Error updating product:', error);
      // Google Analytics tracking for failed product update
      gtag('event', 'update_product_failed', {
        'event_category': 'E-commerce',
        'event_label': `Failed Update Product ID: ${id}`,
        'value': price,
      });
      showToast('Gagal memperbarui produk.');
    }
  } else {
    const token = localStorage.getItem('token');
    const message = {
      token,
      products: [{
        id,
        name,
        description,
        price,
        stock,
        category_id,
        image
      }]
    };
    // Base URL of the RabbitMQ API
    const baseUrl = `${rabbitmqmanageproducts}`;
    try {
      const response = await fetch(`${baseUrl}/producer/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });

      if (response.ok) {
        gtag('event', 'update_productqueue', {
          'event_category': 'E-commerce',
          'event_label': name,  // Use the product name as the label
          'value': price        // You can use the product's price as the event value
        });
        showToast("Update Produk berhasil ditambahkan ke antrian rabbitmq");
        window.location.reload();
      } else {
        gtag('event', 'update_productqueuefailed', {
          'event_category': 'E-commerce',
          'event_label': name,  // Use the product name as the label
          'value': price        // You can use the product's price as the event value
        });
        const errorMessage = await response.json();  // Get error message as JSON
        showToast(`Failed to send update product information: ${errorMessage.error || errorMessage.message}`, 'error');
        window.location.reload();
      }
    } catch (error) {
      console.error('Error:', error);
      window.location.reload();
    }
  }
}

// Function to delete a product
async function deleteProduct(productId) {
  const status = await checkMySQLStatus();
  console.log('Status MySQL server add product:', status ? 'Online' : 'Offline');
  const id = productId;
  if (status) {
    if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${apiUrlfrontend}/products/${productId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Gagal menghapus produk.');
        // Google Analytics tracking for successful product deletion
        gtag('event', 'delete_product', {
          'event_category': 'E-commerce',
          'event_label': `Product Deleted: ${productId}`,
          'value': 1,
        });
        showToast('Produk berhasil dihapus.');
        loadProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        // Google Analytics tracking for failed product deletion
        gtag('event', 'delete_product_failed', {
          'event_category': 'E-commerce',
          'event_label': `Failed Delete Product ID: ${productId}`,
          'value': 1,
        });
        showToast('Gagal menghapus produk.');
      }
    }
  } else {
    const token = localStorage.getItem('token');
    const message = {
      token,
      products: [{
        id
      }]
    };
    // Base URL of the RabbitMQ API
    const baseUrl = `${rabbitmqmanageproducts}`;
    try {
      const response = await fetch(`${baseUrl}/producer/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });

      if (response.ok) {
        gtag('event', 'delete_productqueue', {
          'event_category': 'E-commerce',
          'event_label': productId,  // Use the product name as the label
          'value': 'delete product ' + productId        // You can use the product's price as the event value
        });
        showToast("Delete Produk berhasil ditambahkan ke antrian rabbitmq");
        window.location.reload();
      } else {
        gtag('event', 'delete_productqueuefailed', {
          'event_category': 'E-commerce',
          'event_label': id,  // Use the product name as the label
          'value': 'delete product ' + productId        // You can use the product's price as the event value
        });
        const errorMessage = await response.json();  // Get error message as JSON
        showToast(`Failed to send delete product information: ${errorMessage.error || errorMessage.message}`, 'error');
        window.location.reload();
      }
    } catch (error) {
      console.error('Error:', error);
      window.location.reload();
    }
  }
}

async function loadProducts(searchQuery = '') {
  try {
    const response = await fetch(`${apiUrlfrontend}/products.php?search=${encodeURIComponent(searchQuery)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) throw new Error('Failed to load products');

    const products = await response.json();
    displayProducts(products);
    //setupPagination(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    document.getElementById('productsContainer').innerHTML = '<p>Failed to load products.</p>';
  }
}

document.getElementById('searchButton').addEventListener('click', () => {
  const searchQuery = document.getElementById('searchInput').value.trim();
  loadProducts(searchQuery);
});

// Optionally handle search on pressing Enter
document.getElementById('searchInput').addEventListener('keyup', (event) => {
  if (event.key === 'Enter') {
    const searchQuery = event.target.value.trim();
    currentPage = 1;
    loadProducts(searchQuery);
  }
});


var apiUrlfrontend = '';
var rabbitmqmanageproducts = '';
var rabbitmqmanagecategory = '';
var rabbitmqcart = '';
var rabbitmqcheckout = '';
// Initial load

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
  console.log({
    apiUrlfrontend,
    rabbitmqmanageproducts,
    rabbitmqmanagecategory,
    rabbitmqcart,
    rabbitmqcheckout,
  });

  loadHTML('header', 'templates/header.html');
  loadHTML('sidebar', 'templates/sidebar.html');
  loadHTML('footer', 'templates/footer.html');

  // Memuat data pengguna, produk, dan kategori
  getUserProfile();
  loadProducts();
  loadCategories();
});