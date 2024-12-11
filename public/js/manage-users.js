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
async function loadUsers() {
  document.getElementById('loadingCategories').style.display = 'block'; // Show loading state
  try {
    const token = localStorage.getItem('token');
    //console.log(token);
    if (!token) throw new Error('Token tidak ditemukan.');

    const response = await fetch(`${apiUrlfrontend}/users`, {
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
      throw new Error('Gagal memuat users.');
    }

    const userslist = await response.json();
    //console.log('Userlist:', userslist); // Log the response data
    displayUsers(userslist);
  } catch (error) {
    console.error('Error fetching categories:', error);
    document.getElementById('categoryContainer').innerHTML = `<tr><td colspan="4">Gagal memuat users: ${error.message}</td></tr>`;
  } finally {
    document.getElementById('loadingCategories').style.display = 'none'; // Hide loading state
  }
}

// Display categories in a table
function displayUsers(user) {
  const categoryContainer = document.getElementById('categoryContainer');
  categoryContainer.innerHTML = '';

  if (user.length === 0) {
    categoryContainer.innerHTML = '<tr><td colspan="4">Tidak ada pengguna untuk ditampilkan.</td></tr>';
    return;
  }

  user.forEach(({ UserID, Name, Email, PasswordHash, Role }) => {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${UserID}</td>
        <td>${Name}</td>
        <td>${Email}</td>
        <td>${PasswordHash}</td>
        <td>${Role}</td>
        <td>
          <button class="btn btn-warning" onclick="editUsers(${UserID})">Edit</button>
          <button class="btn btn-danger" onclick="deleteUsers(${UserID})">Hapus</button>
        </td>
      `;
    categoryContainer.appendChild(row);
  });
  cancel();
}


// Edit a users
async function editUsers(userId) {
  try {
    // Menampilkan nilai userId untuk debugging
    //console.log('userId:', userId);

    // Mengambil token dari localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      showToast('Token tidak ditemukan. Anda akan diarahkan ke halaman login.');
      window.location.href = '/login.html'; // Ganti dengan URL halaman login Anda
      return;
    }

    // Fetch user details by userId dengan header Authorization
    const response = await fetch(`${apiUrlfrontend}/users/${userId}`, {
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
      const errorMessage = `Gagal memuat detail pengguna. Status: ${response.status}`;
      throw new Error(errorMessage);
    }

    const user = await response.json();

    // Populate form fields dengan data user
    document.getElementById('userId').value = user.UserID || '';
    document.getElementById('userName').value = user.Name || '';
    document.getElementById('useremail').value = user.Email || '';
    document.getElementById('userpassword').value = user.PasswordHash || '';
    document.getElementById('userRoles').value = user.Role || ''; // Pastikan ID elemen sesuai

    // Scroll ke bagian atas halaman
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Menambahkan event listener untuk tombol update
    const updateButton = document.getElementById('updateUserButton');
    updateButton.onclick = async function () {
      const updatedUser = {
        name: document.getElementById('userName').value.trim(),
        email: document.getElementById('useremail').value.trim(),
        passwordHash: document.getElementById('userpassword').value.trim(),
        role: document.getElementById('userRoles').value.trim(),
      };

      // Validasi input
      if (!updatedUser.name || !updatedUser.email || !updatedUser.passwordHash || !updatedUser.role) {
        showToast('Lengkapi semua data yang dibutuhkan.');
        return;
      }

      // Validasi email format
      const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
      if (!emailPattern.test(updatedUser.email)) {
        showToast('Format email tidak valid.');
        return;
      }

      // Mengirim permintaan untuk memperbarui user
      await updateUser(userId, updatedUser);
      // Google Analytics tracking for successful user edit
      gtag('event', 'edit_user_success', {
        'event_category': 'User Management',
        'event_label': `User Edited: ${userId}`,
        'value': 1,
      });
    };

    // Mengaktifkan tombol update
    document.getElementById('updateUserButton').disabled = false;
    document.getElementById('cancelUserButton').disabled = false;

  } catch (error) {
    console.error('Error editing user:', error);
    // Google Analytics tracking for successful user edit
    gtag('event', 'edit_user_failed', {
      'event_category': 'User Management',
      'event_label': `User Edited: ${userId}`,
      'value': 1,
    });
  }
}


function cancel() {
  document.getElementById('userId').value = '';
  document.getElementById('userName').value = '';
  document.getElementById('useremail').value = '';
  document.getElementById('userpassword').value = '';
  document.getElementById('userRoles').selectedIndex = 0;
  document.getElementById('userName').focus();
  document.getElementById('updateUserButton').disabled = true;
  document.getElementById('cancelUserButton').disabled = true;
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


// Fungsi untuk memperbarui user di server
async function updateUser() {
  const userId = parseInt(document.getElementById('userId').value, 10);
  const name = document.getElementById('userName').value;
  const email = document.getElementById('useremail').value;
  const passwordHash = document.getElementById('userpassword').value;
  const role = document.getElementById('userRoles').value;

  if (!name || !email || !passwordHash || !role) {
    showToast('Lengkapi semua data yang ada');
    document.getElementById('userName').focus();
    return;
  }

  const status = await checkMySQLStatus();
  console.log('Status MySQL server add product:', status ? 'Online' : 'Offline');

  if (status) {
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
      // Google Analytics tracking for successful user update
      gtag('event', 'update_user_success', {
        'event_category': 'User Management',
        'event_label': `User Updated: ${userId}`,
        'value': 1,
      });
      loadUsers();
    } catch (error) {
      console.error('Error updating users:', error);
      showToast('Gagal memperbarui pengguna.');
      // Google Analytics tracking for update failure
      gtag('event', 'update_user_failed', {
        'event_category': 'User Management',
        'event_label': `Update Failed: ${userId}`,
        'value': 1,
      });
    }
  } else {
    const token = localStorage.getItem('token');
    const message = {
      token,
      users: [{
        id: userId, // Pindahkan 'id' ke dalam objek dalam array 'users'
        name,
        email,
        password: passwordHash,
        role
      }]
    };
    // Base URL of the RabbitMQ API
    const baseUrl = `${rabbitmqusers}`;
    try {
      const response = await fetch(`${baseUrl}/producer/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });

      if (response.ok) {
        gtag('event', 'update_usersqueue', {
          'event_category': 'E-commerce',
          'event_label': name,  // Use the users name as the label
          'value': 'update users'        // You can use the  as the event value
        });
        showToast("Produk berhasil ditambahkan ke antrian rabbitmq");
        window.location.reload();
      } else {
        gtag('event', 'update_usersqueuefailed', {
          'event_category': 'E-commerce',
          'event_label': name,  // Use the product name as the label
          'value': 'update users'        // You can use the product's price as the event value
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

// Delete a category
async function deleteUsers(userId) {
  if (confirm('Apakah Anda yakin ingin menghapus pengguna ' + userId)) {
    const status = await checkMySQLStatus();
    console.log('Status MySQL server add product:', status ? 'Online' : 'Offline');
    if (status) {
      try {
        const token = localStorage.getItem('token');  // Getting the token from localStorage for authentication
        const response = await fetch(`${apiUrlfrontend}/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,  // Adding the token to the headers for authentication
          },
        });

        if (!response.ok) throw new Error('Gagal menghapus pengguna.');
        const result = await response.json();  // Parsing the response if it's successful
        showToast(result.message);
        // Google Analytics tracking for successful user deletion
        gtag('event', 'delete_user_success', {
          'event_category': 'User Management',
          'event_label': `User Deleted: ${userId}`,
          'value': 1,
        });
        loadUsers();  // Reloading the users list after successful deletion
      } catch (error) {
        console.error('Error deleting users:', error);
        showToast('Gagal menghapus pengguna.');  // Showing an error message if there's an issue
        // Google Analytics tracking for user deletion failure
        gtag('event', 'delete_user_failed', {
          'event_category': 'User Management',
          'event_label': `Delete Failed: ${userId}`,
          'value': 1,
        });
      }
    } else {
      const token = localStorage.getItem('token');
      const message = {
        token,
        users: [{
          id: userId
        }]
      };
      // Base URL of the RabbitMQ API
      const baseUrl = `${rabbitmqusers}`;
      try {
        const response = await fetch(`${baseUrl}/producer/delete`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(message)
        });

        if (response.ok) {
          gtag('event', 'delete_usersqueue', {
            'event_category': 'E-commerce',
            'event_label': userId,  // Use the users name as the label
            'value': 'delete users'        // You can use the  as the event value
          });
          showToast("Produk berhasil ditambahkan ke antrian rabbitmq");
          window.location.reload();
        } else {
          gtag('event', 'delete_usersqueuefailed', {
            'event_category': 'E-commerce',
            'event_label': userId,  // Use the product name as the label
            'value': 'delete users'        // You can use the product's price as the event value
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
}

async function loadUsers(searchQuery = '') {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Token tidak ditemukan.');

    const response = await fetch(`${apiUrlfrontend}/users.php?search=${encodeURIComponent(searchQuery)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error('Failed to load users');

    const users = await response.json();
    displayUsers(users);
    document.getElementById('searchInput').focus();
  } catch (error) {
    console.error('Error fetching users:', error);
    document.getElementById('categoryContainer').innerHTML = '<p>Failed to load users.</p>';
  }
}

document.getElementById('searchButton').addEventListener('click', () => {
  const searchQuery = document.getElementById('searchInput').value.trim();
  loadUsers(searchQuery);
});

// Optionally handle search on pressing Enter
document.getElementById('searchInput').addEventListener('keyup', (event) => {
  if (event.key === 'Enter') {
    const searchQuery = event.target.value.trim();
    currentPage = 1;
    loadUsers(searchQuery);
  }
});


var apiUrlfrontend = '';
var rabbitmqmanageproducts = '';
var rabbitmqmanagecategory = '';
var rabbitmqcart = '';
var rabbitmqcheckout = '';
var rabbitmqusers = ''
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
  await ApiConfig.loadConfig("rabbitmqusers"); // Memastikan konfigurasi dimuat
  rabbitmqusers = ApiConfig.getApiUrl();

  loadHTML('header', 'templates/header.html');
  loadHTML('sidebar', 'templates/sidebar.html');
  loadHTML('footer', 'templates/footer.html');

  getUserProfile();
  loadUsers();
});