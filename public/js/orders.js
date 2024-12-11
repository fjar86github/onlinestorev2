// Function to display toast messages
function showToast(message, duration = 3000) {
  let existingToast = document.getElementById('toast-notification');
  if (existingToast) {
    existingToast.remove();
  }

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

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '1';
  }, 100);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.remove();
    }, 300);
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
  const token = localStorage.getItem('token');
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

      if (userData) {
        sessionStorage.setItem('userData', JSON.stringify(userData));
        userGreeting.textContent = `Welcome, ${result.Name} with ID=${result.UserID} and Role=${result.Role}`;

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
        `;

        document.getElementById('logoutLink').addEventListener('click', function () {
          localStorage.removeItem('token');
          sessionStorage.removeItem('userData');
          window.location.href = 'login.html';
        });
      } else {
        userGreeting.textContent = 'User not found.';
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      document.getElementById('userGreeting').textContent = 'Error loading user profile.';
    }
  } else {
    showToast('You are not logged in. Redirecting to login page...');
    window.location.href = 'login.html';
  }
}

// Load orders and display them
async function loadOrder() {
  document.getElementById('loadingCategories').style.display = 'block';
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Token not found.');

    const response = await fetch(`${apiUrlfrontend}/orders`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      showToast('Session expired. Please log in again.');
      localStorage.removeItem('token');
      window.location.href = 'login.html';
      return;
    }

    if (!response.ok) {
      const errorData = await response.json();
      showToast(errorData.message || 'Failed to load orders.');
      throw new Error('Failed to load orders.');
    }

    const orders = await response.json();
    displayOrders(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    document.getElementById('categoryContainer').innerHTML = `<tr><td colspan="12">Failed to load orders: ${error.message}</td></tr>`;
  } finally {
    document.getElementById('loadingCategories').style.display = 'none';
  }
}

// Display orders in a table
function displayOrders(orders) {
  const categoryContainer = document.getElementById('categoryContainer');
  categoryContainer.innerHTML = '';

  if (orders.length === 0) {
    categoryContainer.innerHTML = '<tr><td colspan="12">No orders to display.</td></tr>';
    return;
  }

  const orderGroups = {};

  orders.forEach(({
    OrderID,
    TotalAmount,
    PaymentStatus,
    OrderStatus,
    OrderCreatedAt,
    ProductID,
    ProductName,
    ProductPrice,
    QuantityOrdered,
    TotalPrice,
    CategoryName,
    ProductStock,
    AverageRating
  }) => {
    if (!orderGroups[OrderID]) {
      orderGroups[OrderID] = [];
    }

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${OrderID}</td>
      <td>${TotalAmount}</td>
      <td>${PaymentStatus}</td>
      <td>${OrderStatus}</td>
      <td>${OrderCreatedAt}</td>
      <td>${ProductID}</td>
      <td>${ProductName}</td>
      <td>${ProductPrice}</td>
      <td>${QuantityOrdered}</td>
      <td>${CategoryName}</td>
      <td>${ProductStock}</td>
      <td>${AverageRating}</td>
    `;

    orderGroups[OrderID].push(row);
  });

  Object.keys(orderGroups).forEach(OrderID => {
    const rows = orderGroups[OrderID];
    const buttonRow = document.createElement('tr');
    buttonRow.innerHTML = `<td colspan="12" style="text-align: center;">
      <button class="update-status-btn" data-orderid="${OrderID}">Update Status</button>
    </td>`;

    rows.forEach(row => categoryContainer.appendChild(row));
    categoryContainer.appendChild(buttonRow);
  });

  // Add event listener to the "Update Status" button
  document.querySelectorAll('.update-status-btn').forEach(button => {
    button.addEventListener('click', async function () {
      const orderId = this.getAttribute('data-orderid');
      try {
        const response = await fetch(`${apiUrlfrontend}/orders/${orderId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentStatus: 'Paid',  // Example: Update payment status
            orderStatus: 'Shipped'  // Example: Update order status
          })
        });

        if (response.ok) {
          showToast('Order status updated successfully!');
          loadOrder(); // Reload the orders
          // Google Analytics tracking for successful status update
          gtag('event', 'update_order_status_success', {
            'event_category': 'Order Management',
            'event_label': 'Order Status Updated',
            'order_id': orderId,
            'value': 1,
          });
        } else {
          const errorData = await response.json();
          showToast(errorData.message || 'Failed to update order status.');
          // Google Analytics tracking for failed status update
          gtag('event', 'update_order_status_failed', {
            'event_category': 'Order Management',
            'event_label': 'Failed Status Update',
            'order_id': orderId,
            'value': 1,
          });
        }
      } catch (error) {
        console.error('Error updating order status:', error);
        showToast('Error updating order status.');
        // Google Analytics tracking for error during status update
        gtag('event', 'update_order_status_error', {
          'event_category': 'Order Management',
          'event_label': 'Error during Status Update',
          'order_id': orderId,
          'value': 1,
        });
      }
    });
  });
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
  loadOrder();
});