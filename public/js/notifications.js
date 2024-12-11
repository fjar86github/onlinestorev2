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

async function loadHTML(id, file) {
    try {
        const response = await fetch(file);
        if (!response.ok) throw new Error(`Gagal memuat ${file}`);
        document.getElementById(id).innerHTML = await response.text();
    } catch (error) {
        console.error(`Error loading ${file}:`, error);
    }
}

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
            localStorage.removeItem('token');
            window.location.href = 'login.html';
            return;
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

async function loadNotification() {
    const token = localStorage.getItem('token');
    const loadingIndicator = document.getElementById('loadingCategories');

    if (!token) {
        showToast('Token tidak ditemukan. Redirecting...');
        window.location.href = 'login.html';
        return;
    }

    loadingIndicator.style.display = 'block';

    try {
        const response = await fetch(`${apiUrlfrontend}/notifications`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.status === 401) {
            showToast('Session expired.');
            localStorage.removeItem('token');
            window.location.href = 'login.html';
            return;
        }

        const responseJson = await response.json();

        // Pengecekan apakah data ada
        if (!responseJson || Object.keys(responseJson).length === 0) {
            // Jika tidak ada data, tampilkan pesan bahwa data notifikasi tidak tersedia
            document.getElementById('categoryContainer').innerHTML = `<tr><td colspan="8">Data Notifikasi tidak tersedia</td></tr>`;
        } else {
            // Jika ada data, tampilkan data notifikasi
            displayNotif(responseJson);
        }
    } catch (error) {
        console.error('Error fetching notifications:', error);
        document.getElementById('categoryContainer').innerHTML = `<tr><td colspan="8">Data notifikasi tidak ada</td></tr>`;
    } finally {
        loadingIndicator.style.display = 'none';
    }
}

function displayNotif(notifications) {
    const container = document.getElementById('categoryContainer');
    container.innerHTML = '';

    if (notifications.length === 0) {
        container.innerHTML = '<tr><td colspan="8">Tidak ada notifikasi untuk ditampilkan.</td></tr>';
        return;
    }

    notifications.forEach(({ NotificationID, UserID, Token, message, type, created_at, updated_at }) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${NotificationID}</td>
            <td>${UserID}</td>
            <td>${Token}</td>
            <td>${message}</td>
            <td>${type}</td>
            <td>${created_at}</td>
            <td>${updated_at}</td>
            <td>
                <button class="btn btn-warning" onclick="editNotif(${NotificationID})">Edit</button>
                <button class="btn btn-danger" onclick="deleteNotif(${NotificationID})">Hapus</button>
            </td>
        `;
        container.appendChild(row);
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

async function addnotif() {
    const userId = document.getElementById('useridselect').value;
    const token = document.getElementById('notiftoken').value;
    const message = document.getElementById('notifpesan').value;
    const type = document.getElementById('notiftype').value;

    if (!userId || !token || !message || !type) {
        showToast('Isi semua data yang diperlukan.');
        return;
    }

    const status = await checkMySQLStatus();
    console.log('Status MySQL server add product:', status ? 'Online' : 'Offline');
    if (status) {
        try {
            const authToken = localStorage.getItem('token'); // Mengambil token autentikasi
            const response = await fetch(`${apiUrlfrontend}/notifications`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({ userId, token, message, type }),
            });

            const result = await response.json();
            showToast(result.message);
            // Google Analytics tracking for successful notification add
            if (response.ok) {
                gtag('event', 'add_notification_success', {
                    'event_category': 'Notifications',
                    'event_label': 'Notification Added',
                    'value': 1,
                });
            }
            cancelNotif();
            if (response.ok) loadNotification(); // Refresh daftar notifikasi
        } catch (error) {
            console.error('Error adding notifications:', error);
            showToast('Error menambahkan notifikasi.');
            // Google Analytics tracking for failed notification add
            gtag('event', 'add_notification_failed', {
                'event_category': 'Notifications',
                'event_label': 'Add Failed',
                'value': 1,
            });
        }
    } else {
        const token = localStorage.getItem('token');
        const message2 = {
            token,
            notifications: [{
                userId, // Pindahkan 'id' ke dalam objek dalam array 'users'
                token2: token,
                message,
                type
            }]
        };
        // Base URL of the RabbitMQ API
        const baseUrl = `${rabbitmqnotif}`;
        try {
            const response = await fetch(`${baseUrl}/producer/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(message2)
            });

            if (response.ok) {
                gtag('event', 'add_notificationsqueue', {
                    'event_category': 'E-commerce',
                    'event_label': userId,  // Use the users name as the label
                    'value': message        // You can use the  as the event value
                });
                showToast("Produk berhasil ditambahkan ke antrian rabbitmq");
                window.location.reload();
            } else {
                gtag('event', 'add_notificationsqueuefailed', {
                    'event_category': 'E-commerce',
                    'event_label': userId,  // Use the product name as the label
                    'value': message        // You can use the message as the event value
                });
                const errorMessage = await response.json();  // Get error message as JSON
                showToast(`Failed to send notifications information: ${errorMessage.error || errorMessage.message}`, 'error');
                window.location.reload();
            }
        } catch (error) {
            console.error('Error:', error);
            window.location.reload();
        }
    }


}
async function editNotif(notificationId) {
    try {
        const token = localStorage.getItem('token');

        // Cek apakah token ada
        if (!token) {
            showToast('Token tidak ditemukan. Anda akan diarahkan ke halaman login.');
            window.location.href = 'login.html';
            return;
        }

        // Mengambil data notifikasi
        const response = await fetch(`${apiUrlfrontend}/notifications/${notificationId}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        // Cek apakah request berhasil
        if (!response.ok) throw new Error('Gagal memuat detail notifikasi.');

        const notif = await response.json();
        // Mengisi form dengan data notifikasi yang diterima
        document.getElementById('notifid').value = notif.NotificationID;  // Akses NotificationID
        document.getElementById('useridselect').value = notif.UserID;
        document.getElementById('notiftoken').value = notif.Token;
        document.getElementById('notifpesan').value = notif.message;
        document.getElementById('notiftype').value = notif.type;

        // Menangani klik tombol update
        const updateButton = document.getElementById('updatenotifButton');
        updateButton.onclick = async function () {
            const updatedNotif = {
                userId: document.getElementById('useridselect').value.trim(),
                token: document.getElementById('notiftoken').value.trim(),
                message: document.getElementById('notifpesan').value.trim(),
                type: document.getElementById('notiftype').value.trim(),
            };

            // Validasi form
            if (!notificationId || !updatedNotif.userId || !updatedNotif.token || !updatedNotif.message || !updatedNotif.type) {
                showToast('Semua bidang harus diisi.');
                return;
            }
            const status = await checkMySQLStatus();
            console.log('Status MySQL server update notif:', status ? 'Online' : 'Offline');
            if (status) {
                // Mengirimkan request untuk memperbarui notifikasi
                const updateResponse = await fetch(`${apiUrlfrontend}/notifications/${notificationId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(updatedNotif),
                });

                // Cek apakah update berhasil
                if (!updateResponse.ok) throw new Error('Gagal memperbarui notifikasi.');

                showToast('Notifikasi berhasil diperbarui.');
                // Google Analytics tracking for successful notification update
                gtag('event', 'edit_notification_success', {
                    'event_category': 'Notifications',
                    'event_label': 'Notification Updated',
                    'value': 1,
                });
            } else {
                const token = localStorage.getItem('token');
                const message = {
                    token,
                    notifications: [{
                        notifid: notificationId, // Pindahkan 'id' ke dalam objek dalam array 'users'
                        userId:document.getElementById('useridselect').value, // Pindahkan 'id' ke dalam objek dalam array 'users'
                        token2: document.getElementById('notiftoken').value,
                        message:document.getElementById('notifpesan').value,
                        type:document.getElementById('notiftype').value
                    }]
                };
                // Base URL of the RabbitMQ API
                const baseUrl = `${rabbitmqnotif}`;
                try {
                    const response = await fetch(`${baseUrl}/producer/update`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(message)
                    });

                    if (response.ok) {
                        gtag('event', 'update_notificationsqueue', {
                            'event_category': 'E-commerce',
                            'event_label': notificationId,  // Use the users name as the label
                            'value': message        // You can use the  as the event value
                        });
                        showToast("Produk berhasil ditambahkan ke antrian rabbitmq");
                        window.location.reload();
                    } else {
                        gtag('event', 'update_notificationsqueuefailed', {
                            'event_category': 'E-commerce',
                            'event_label': notificationId,  // Use the product name as the label
                            'value': message        // You can use the product's price as the event value
                        });
                        const errorMessage = await response.json();  // Get error message as JSON
                        showToast(`Failed to update notifications information: ${errorMessage.error || errorMessage.message}`, 'error');
                        window.location.reload();
                    }
                } catch (error) {
                    console.error('Error:', error);
                    window.location.reload();
                }
            }
            cancelNotif();
            loadNotification();  // Memuat ulang notifikasi
        };

        // Mengaktifkan tombol update
        document.getElementById('updatenotifButton').disabled = false;
        document.getElementById('cancelnotifButton').disabled = false;
        document.getElementById('addnotifButton').disabled = true;
    } catch (error) {
        console.error('Error editing notification:', error);
        showToast('Error memperbarui notifikasi.');
        // Google Analytics tracking for error in updating notification
        gtag('event', 'edit_notification_failed', {
            'event_category': 'Notifications',
            'event_label': 'Update Failed',
            'value': 1,
        });
    }
}

// Function to update notification after editing
async function updateNotif() {
    const notificationId = parseInt(document.getElementById('notifid').value, 10);
    const userId = document.getElementById('useridselect').value;
    const token = document.getElementById('notiftoken').value;  // Pastikan token ini yang digunakan
    const message = document.getElementById('notifpesan').value;
    const type = document.getElementById('notiftype').value;

    // Menampilkan semua data sebelum dikirim
    alert(`Notification ID: ${notificationId}\nUser ID: ${userId}\nToken: ${token}\nMessage: ${message}\nType: ${type}`);

    // Validasi input
    if (!notificationId || isNaN(notificationId)) {
        console.error('Notification ID tidak valid:', notificationId);
        showToast('Notification ID tidak valid');
        return;
    }
    if (!userId) {
        console.error('User ID kosong:', userId);
        showToast('User ID harus diisi');
        return;
    }
    if (!token) {
        console.error('Token kosong:', token);
        showToast('Token harus diisi');
        return;
    }
    if (!message) {
        console.error('Message kosong:', message);
        showToast('Pesan harus diisi');
        return;
    }
    if (!type) {
        console.error('Type kosong:', type);
        showToast('Tipe harus diisi');
        return;
    }

    // Menyiapkan URL dan token otentikasi
    const Tokensaya = localStorage.getItem('token'); // Ambil token dari localStorage
    //console.log('Token:', Tokensaya);

    try {
        const response = await fetch(`${apiUrlfrontend}/notifications/${notificationId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${Tokensaya}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, token, message, type })
        });

        //console.log('Request Body:', { userId, token, message, type });

        const responseData = await response.json();
        //console.log('Response Status:', response.status);
        //console.log('Response Data:', responseData);

        if (!response.ok) {
            throw new Error(responseData.message || 'Server mengembalikan status gagal.');
        }

        // Reset form setelah berhasil diperbarui
        document.getElementById('notifid').value = '';
        document.getElementById('useridselect').selectedIndex = 0;
        document.getElementById('notiftoken').value = '';
        document.getElementById('notifpesan').value = '';
        document.getElementById('notiftype').selectedIndex = 0;

        // Nonaktifkan tombol setelah update
        document.getElementById('updatenotifButton').disabled = true;
        document.getElementById('cancelnotifButton').disabled = true;

        // Google Analytics tracking for successful notification update
        gtag('event', 'update_notification_success', {
            'event_category': 'Notifications',
            'event_label': 'Notification Updated',
            'value': 1,
        });

        // Tampilkan pesan sukses
        showToast('Notifikasi berhasil diperbarui.');

        // Muat ulang kategori atau data lain yang relevan
        loadCategories();

        // Aktifkan tombol tambah kategori setelah update
        document.getElementById('addCategoryButton').disabled = false;

    } catch (error) {
        console.error('Kesalahan saat memperbarui notifikasi:', error);
        showToast('Gagal memperbarui notifikasi.');
        // Google Analytics tracking for update failed
        gtag('event', 'update_notification_failed', {
            'event_category': 'Notifications',
            'event_label': 'Update Failed',
            'value': 1,
        });
    }
}

async function deleteNotif(notificationId) {
    try {
        const token = localStorage.getItem('token');
        const status = await checkMySQLStatus();
        console.log('Status MySQL server add product:', status ? 'Online' : 'Offline');
        if (!token) {
            showToast('Token tidak ditemukan. Anda akan diarahkan ke halaman login.');
            window.location.href = 'login.html';
            return;
        }
        if (status) {
            const response = await fetch(`${apiUrlfrontend}/notifications/${notificationId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error('Gagal menghapus notifikasi.');
            // Google Analytics tracking for successful notification deletion
            gtag('event', 'delete_notification_success', {
                'event_category': 'Notifications',
                'event_label': 'Notification Deleted',
                'value': 1,
            });
            showToast('Notifikasi berhasil dihapus.');
        } else {
            const token = localStorage.getItem('token');
            const message = {
                token,
                notifications: [{
                    notifid: notificationId
                }]
            };
            // Base URL of the RabbitMQ API
            const baseUrl = `${rabbitmqnotif}`;
            try {
                const response = await fetch(`${baseUrl}/producer/delete`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(message)
                });

                if (response.ok) {
                    gtag('event', 'delete_notificationsqueue', {
                        'event_category': 'E-commerce',
                        'event_label': notificationId,  // Use the users name as the label
                        'value': 1        // You can use the  as the event value
                    });
                    showToast("Produk berhasil ditambahkan ke antrian rabbitmq");
                    window.location.reload();
                } else {
                    gtag('event', 'delete_notificationsqueuefailed', {
                        'event_category': 'E-commerce',
                        'event_label': notificationId,  // Use the product name as the label
                        'value': 1        // You can use the product's price as the event value
                    });
                    const errorMessage = await response.json();  // Get error message as JSON
                    showToast(`Failed to delete notifications queue information: ${errorMessage.error || errorMessage.message}`, 'error');
                    window.location.reload();
                }
            } catch (error) {
                console.error('Error:', error);
                window.location.reload();
            }
        }
        loadNotification();
    } catch (error) {
        console.error('Error deleting notification:', error);
        showToast('Error menghapus notifikasi.');
        // Google Analytics tracking for error during deletion
        gtag('event', 'delete_notification_failed', {
            'event_category': 'Notifications',
            'event_label': 'Deletion Failed',
            'value': 1,
        });
    }
}

async function loadCategories() {
    const categorySelect = document.getElementById('useridselect');
    const loadingIndicator = document.getElementById('loadingCategories');

    categorySelect.innerHTML = '<option value="" disabled selected>Memuat data pengguna...</option>';

    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Token tidak ditemukan.');

        // Fetch data dengan token
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
            showToast(`Kesalahan: ${errorData.message || 'Gagal memuat kategori.'}`);
            throw new Error('Gagal memuat kategori.');
        }

        const categories = await response.json();
        // Bersihkan opsi dropdown dan tambahkan data kategori
        categorySelect.innerHTML = '<option value="" disabled selected>Pilih Kategori</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.UserID; // Ganti dengan nama atribut sesuai API
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

function cancelNotif() {
    document.getElementById('notifid').value = '';
    document.getElementById('useridselect').selectedIndex = 0;
    document.getElementById('notiftoken').value = '';
    document.getElementById('notifpesan').value = '';
    document.getElementById('notiftype').selectedIndex = 0;
    document.getElementById('updatenotifButton').disabled = true;
    document.getElementById('cancelnotifButton').disabled = true;
    document.getElementById('addnotifButton').disabled = false;
    document.getElementById('useridselect').focus();
}

async function loadNotification(searchQuery = '') {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${apiUrlfrontend}/notifications.php?search=${encodeURIComponent(searchQuery)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to load Notifications');

        const notif = await response.json();
        displayNotif(notif);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        document.getElementById('categoryContainer').innerHTML = '<p>Failed to load notifications.</p>';
    }
}
document.getElementById('searchButton').addEventListener('click', () => {
    const searchQuery = document.getElementById('searchInput').value.trim();
    loadNotification(searchQuery);
});

// Optionally handle search on pressing Enter
document.getElementById('searchInput').addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        const searchQuery = event.target.value.trim();
        currentPage = 1;
        loadNotification(searchQuery);
    }
});
var apiUrlfrontend = '';
var rabbitmqmanageproducts = '';
var rabbitmqmanagecategory = '';
var rabbitmqcart = '';
var rabbitmqcheckout = '';
var rabbitmqnotif = '';
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
    await ApiConfig.loadConfig("rabbitmqnotif"); // Memastikan konfigurasi dimuat
    rabbitmqnotif = ApiConfig.getApiUrl();
    loadHTML('header', 'templates/header.html');
    loadHTML('sidebar', 'templates/sidebar.html');
    loadHTML('footer', 'templates/footer.html');

    getUserProfile();
    loadCategories();
    loadNotification();
});