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

    const response = await fetch(`${apiUrlfrontend}/categories`, {
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
   // console.log('Categories:', categories); // Log the response data
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
    categoryContainer.innerHTML = '<tr><td colspan="4">Tidak ada kategori untuk ditampilkan.</td></tr>';
    return;
  }

  categories.forEach(({ CategoryID, Name, Description }) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${CategoryID}</td>
      <td>${Name}</td>
      <td>${Description}</td>
      <td>
        <button class="btn btn-warning" onclick="editCategory(${CategoryID})">Edit</button>
        <button class="btn btn-danger" onclick="deleteCategory(${CategoryID})">Hapus</button>
      </td>
    `;
    categoryContainer.appendChild(row);
  });
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

// Add a new category
async function addCategory() {
  const name = document.getElementById('categoryName').value;
  const description = document.getElementById('categoryDescription').value;

  if (!name || !description) {
    showToast('Isi semua bidang yang diperlukan.');
    return;
  }

  const status = await checkMySQLStatus();
  console.log('Status MySQL server add product:', status ? 'Online' : 'Offline');
  if (status) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrlfrontend}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description }),
      });

      const result = await response.json();
      showToast(result.message);
      if (response.ok) {
        loadCategories(); // Google Analytics tracking for 'add_category' event
        gtag('event', 'add_category', {
          'event_category': 'E-commerce',
          'event_label': name, // Use the category name as the label
          'value': 1 // Value is 1 as we're adding a new category
        });
      }
    } catch (error) {
      console.error('Error adding category:', error);
      showToast('Error menambahkan kategori.');
    }
  } else {
    const token = localStorage.getItem('token');
    const message = {
      token,
      categories: [{
        name,
        description
      }]
    };
    // Base URL of the RabbitMQ API
    const baseUrl = `${rabbitmqmanagecategory}`;
    try {
      const response = await fetch(`${baseUrl}/producer/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });

      if (response.ok) {
        gtag('event', 'add_categoriesqueue', {
          'event_category': 'E-commerce',
          'event_label': name,  // Use the category name as the label
          'value': description        // You can use the category's price as the event value
        });
        showToast("Kategori berhasil ditambahkan ke antrian rabbitmq");
        window.location.reload();
      } else {
        gtag('event', 'add_categoriesqueuefailed', {
          'event_category': 'E-commerce',
          'event_label': name,  // Use the category name as the label
          'value': description        // You can use the category's price as the event value
        });
        const errorMessage = await response.json();  // Get error message as JSON
        showToast(`Failed to send categories information: ${errorMessage.error || errorMessage.message}`, 'error');
        window.location.reload();
      }
    } catch (error) {
      console.error('Error:', error);
      window.location.reload();
    }
  }

}

// Edit a category
async function editCategory(categoryId) {
  try {
    // Menampilkan nilai categoryId untuk debugging
    //console.log('categoryId:', categoryId);

    // Mengambil token dari localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      showToast('Token tidak ditemukan. Anda akan diarahkan ke halaman login.');
      window.location.href = '/login.html'; // Ganti dengan URL halaman login Anda
      return;
    }

    // Fetch category details by CategoryID dengan header Authorization
    const response = await fetch(`${apiUrlfrontend}/categories/${categoryId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      // Jika token tidak valid atau kadaluarsa
      showToast('Sesi Anda telah berakhir. Silakan login ulang.');
      window.location.href = '/login.html'; // Ganti dengan URL halaman login Anda
      return;
    }

    if (!response.ok) {
      const errorMessage = `Gagal memuat detail kategori. Status: ${response.status}`;
      throw new Error(errorMessage);
    }

    const category = await response.json();

    // Populate form fields dengan data kategori
    document.getElementById('categoryid').value = category.CategoryID || '';
    document.getElementById('categoryName').value = category.Name || '';
    document.getElementById('categoryDescription').value = category.Description || '';

    // Google Analytics tracking for 'edit_category' event
    gtag('event', 'edit_category', {
      'event_category': 'E-commerce',
      'event_label': category.Name, // Use the category name as the label
      'value': 1 // Value is 1 as the category is being edited
    });

    // Scroll ke bagian atas halaman
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Menambahkan event listener untuk tombol update
    const updateButton = document.getElementById('updateCategoryButton');
    updateButton.onclick = async function () {
      const updatedCategory = {
        name: document.getElementById('categoryName').value.trim(),
        description: document.getElementById('categoryDescription').value.trim(),
      };

      // Validasi input
      if (!updatedCategory.name || !updatedCategory.description) {
        showToast('Nama dan deskripsi kategori wajib diisi.');
        return;
      }

      await updateCategory(categoryId, updatedCategory);
      // Google Analytics tracking for 'update_category' event after editing
      gtag('event', 'update_category', {
        'event_category': 'E-commerce',
        'event_label': updatedCategory.name, // Use the updated category name as the label
        'value': 1 // Value is 1 as the category is updated
      });
    };

    // Mengaktifkan tombol update
    document.getElementById('updateCategoryButton').disabled = false;
    document.getElementById('cancelCategoryButton').disabled = false;
    document.getElementById('addCategoryButton').disabled = true;
  } catch (error) {
    console.error('Error editing category:', error);
  }
}
// Function to update product after editing
async function updateCategory() {
  const id = parseInt(document.getElementById('categoryid').value, 10);
  const name = document.getElementById('categoryName').value;
  const description = document.getElementById('categoryDescription').value;

  if (!id || !name || !description) {
    showToast('Lengkapi semua data yang ada');
    return;
  }

  const status = await checkMySQLStatus();
  console.log('Status MySQL server add product:', status ? 'Online' : 'Offline');
  if (status) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrlfrontend}/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, name, description })
      });

      const responseData = await response.json(); // Log response
      //console.log(responseData); // Add this to monitor the response from the server

      if (!response.ok) throw new Error(responseData.message || 'Gagal memperbarui kategori.');
      document.getElementById('categoryid').value = '';
      document.getElementById('categoryName').value = '';
      document.getElementById('categoryDescription').value = '';
      document.getElementById('updateCategoryButton').disabled = true;
      document.getElementById('cancelCategoryButton').disabled = true;
      showToast('Kategori berhasil diperbarui.');
      loadCategories();
      document.getElementById('addCategoryButton').disabled = false;
      // Google Analytics tracking for 'update_category' event
      gtag('event', 'update_category', {
        'event_category': 'E-commerce',
        'event_label': name, // Use the updated category name as the label
        'value': 1 // Value is 1 to indicate a successful update
      });
    } catch (error) {
      console.error('Error updating kategori:', error);
      showToast('Gagal memperbarui kategori.');
      // Google Analytics tracking for 'update_category_failed' event
      gtag('event', 'update_category_failed', {
        'event_category': 'E-commerce',
        'event_label': name, // Use the category name as the label
        'value': 0 // Value is 0 to indicate a failure in updating
      });
    }
  } else {
    const token = localStorage.getItem('token');
    const message = {
      token,
      categories: [{
        id,
        name,
        description
      }]
    };
    // Base URL of the RabbitMQ API
    const baseUrl = `${rabbitmqmanagecategory}`;
    try {
      const response = await fetch(`${baseUrl}/producer/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });

      if (response.ok) {
        gtag('event', 'update_categoriesqueue', {
          'event_category': 'E-commerce',
          'event_label': id,  // Use the category id as the label
          'value': name        // You can use the category's name as the event value
        });
        showToast("Kategori berhasil ditambahkan ke antrian rabbitmq");
        window.location.reload();
      } else {
        gtag('event', 'update_categoriesqueuefailed', {
          'event_category': 'E-commerce',
          'event_label': id,  // Use the category id as the label
          'value': description        // You can use the category's description as the event value
        });
        const errorMessage = await response.json();  // Get error message as JSON
        showToast(`Failed to send categories information: ${errorMessage.error || errorMessage.message}`, 'error');
        window.location.reload();
      }
    } catch (error) {
      console.error('Error:', error);
      window.location.reload();
    }
  }


}

// Function to delete a product
async function deleteCategory(categoryId) {
  if (confirm('Apakah Anda yakin ingin menghapus kategori ini?')) {

    const status = await checkMySQLStatus();
    console.log('Status MySQL server add product:', status ? 'Online' : 'Offline');
    if (status) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${apiUrlfrontend}/categories/${categoryId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Gagal menghapus kategori.');
        showToast('Kategori berhasil dihapus.');
        loadCategories();
        // Google Analytics tracking for 'delete_category' event (successful)
        gtag('event', 'delete_category', {
          'event_category': 'E-commerce',
          'event_label': categoryId.toString(), // Use the category ID as the label
          'value': 1 // Value is 1 to indicate a successful deletion
        });
      } catch (error) {
        console.error('Error deleting categories:', error);
        showToast('Gagal menghapus kategori.');
        // Google Analytics tracking for 'delete_category_failed' event (failed)
        gtag('event', 'delete_category_failed', {
          'event_category': 'E-commerce',
          'event_label': categoryId.toString(), // Use the category ID as the label
          'value': 0 // Value is 0 to indicate a failed deletion
        });
      }
    } else {
      const token = localStorage.getItem('token');
      const message = {
        token,
        categories: [{
          id: categoryId
        }]
      };
      // Base URL of the RabbitMQ API
      const baseUrl = `${rabbitmqmanagecategory}`;
      try {
        const response = await fetch(`${baseUrl}/producer/delete`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(message)
        });

        if (response.ok) {
          gtag('event', 'delete_categoriesqueue', {
            'event_category': 'E-commerce',
            'event_label': id,  // Use the category id as the label
            'value': 'Menghapus kategori'        // You can use the category's name as the event value
          });
          showToast("Kategori berhasil dihapus ke antrian rabbitmq");
          window.location.reload();
        } else {
          gtag('event', 'delete_categoriesqueuefailed', {
            'event_category': 'E-commerce',
            'event_label': id,  // Use the category id as the label
            'value': 'Menghapus kategori'        // You can use the category's description as the event value
          });
          const errorMessage = await response.json();  // Get error message as JSON
          showToast(`Failed to send categories information: ${errorMessage.error || errorMessage.message}`, 'error');
          window.location.reload();
        }
      } catch (error) {
        console.error('Error:', error);
        window.location.reload();
      }
    }
  }
}

function cancel() {
  document.getElementById('categoryid').value = '';
  document.getElementById('categoryName').value = '';
  document.getElementById('categoryDescription').value = '';
  document.getElementById('updateCategoryButton').disabled = true;
  document.getElementById('cancelCategoryButton').disabled = true;
  document.getElementById('addCategoryButton').disabled = false;
  document.getElementById('categoryName').focus();
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