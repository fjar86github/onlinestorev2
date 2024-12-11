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
    alert('You are not logged in. Redirecting to login page...');
    window.location.href = 'login.html';
  }
}



// Variables for pagination
let currentPage = 1;
const itemsPerPage = 9; // Number of products per page
let allProducts = []; // Store all products

// Function to fetch all products (no pagination needed from API)
async function loadProducts() {
  try {
    const response = await fetch(`${apiUrlfrontend}/products.php`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load products');
    }

    const products = await response.json();
    displayProducts(products); // Display the first page by default
    setupPagination(products); // Setup pagination based on total items
  } catch (error) {
    console.error('Error fetching products:', error);
    document.getElementById('productsContainer').innerHTML = '<p>Failed to load products.</p>';
  }
}

// Function to display the fetched products dynamically (show products based on currentPage)
function displayProducts(products) {
  const productsContainer = document.getElementById('productsContainer');
  productsContainer.innerHTML = ''; // Clear previous content

  // Store products for future reference
  allProducts = products;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const productsToDisplay = products.slice(startIndex, endIndex);

  // Loop through the selected products and display them
  productsToDisplay.forEach(product => {
    const productCard = `
      <div class="col-md-4">
        <div class="card">
          <img src="${product.ImageURL || 'https://via.placeholder.com/150'}" class="card-img-top" alt="${product.Name}">
          <div class="card-body">
            <h5 class="card-title">${product.Name}</h5>
            <p class="card-text"><strong>Description:</strong> ${product.Description || 'No description available.'}</p>
            <p class="card-text"><strong>Price:</strong> $${product.Price}</p>
            <p class="card-text"><strong>Stock:</strong> ${product.Stock}</p>
            <p class="card-text"><strong>Category ID:</strong> ${product.CategoryID}</p>
            <p class="card-text"><strong>ProductID:</strong> ${product.ProductID}</p>
            <button class="btn btn-primary" onclick="addToCart('${product.ProductID}','${product.Name}')">Add to Cart</button>

            <!-- Comment and Rating Section -->
            <div class="mt-3">
              <h6>Leave a Comment and Rating</h6>
              <textarea id="comment-${product.ProductID}" class="form-control" rows="3" placeholder="Write a comment"></textarea>
              <div class="mt-2">
                <label for="rating-${product.ProductID}">Rating: </label>
                <select id="rating-${product.ProductID}" class="form-select">
                  <option value="1">1 Star</option>
                  <option value="2">2 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="5">5 Stars</option>
                </select>
              </div>
              <button class="btn btn-success mt-2" onclick="submitReview('${product.ProductID}')">Submit Review</button>
            </div>

            <!-- Display Existing Comments -->
            <div id="reviews-${product.ProductID}" class="mt-4">
              <h6>Reviews:</h6>
              <!-- Reviews will be dynamically inserted here -->
            </div>
            
          </div>
        </div>
      </div>
    `;
    productsContainer.innerHTML += productCard;
    loadReviews(product.ProductID); // Load existing reviews for the product
  });
}

async function loadReviews(productId) {
  try {
    const response = await fetch(`${apiUrlfrontend}/reviews.php/${productId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const reviews = await response.json();

      //console.log('Reviews data received:', reviews);

      // Get the reviews container element
      const reviewsContainer = document.getElementById(`reviews-${productId}`);

      if (!reviewsContainer) {
        console.error(`Reviews container not found for product ID: ${productId}`);
        return;
      }

      // If reviews are available
      if (Array.isArray(reviews) && reviews.length > 0) {
        // Debug: Check all ratings values
        const ratings = reviews.map(review => parseFloat(review.Rating));
        //console.log('Parsed Ratings:', ratings);

        // Menghitung rerata rating
        const totalRating = ratings.reduce((sum, rating) => {
          // Pastikan rating adalah angka yang valid dan tidak NaN
          if (!isNaN(rating)) {
            return sum + rating;
          }
          return sum;  // Jika rating tidak valid, lewati
        }, 0);

        const averageRating = (totalRating / reviews.length).toFixed(2); // Rata-rata dua angka desimal

        //  console.log('Total Rating:', totalRating);
        // console.log('Average Rating:', averageRating);

        // Menampilkan rerata rating terlebih dahulu
        reviewsContainer.innerHTML = `
          <p><strong>Rerata Rating: ${averageRating} Stars</strong></p>
        `;

        // Menampilkan semua review
        reviewsContainer.innerHTML += reviews.map(review => `
          <div class="review-item">
            <p><strong>Rating: ${review.Rating} Stars</strong></p>
            <p>${review.Comment}</p>
          </div>
        `).join('');
      } else {
        // If no reviews are available, display a default message
        reviewsContainer.innerHTML = `
          <div class="review-item">
            <p><strong>Review belum diisikan.</strong></p>
          </div>
        `;
      }
    } else {
      console.error('Failed to load reviews: Response not ok');
    }
  } catch (error) {
    console.error('Error loading reviews:', error);
  }
}

// Function to submit a review
async function submitReview(productId) {
  const comment = document.getElementById(`comment-${productId}`).value;
  const rating = document.getElementById(`rating-${productId}`).value;
  const token = localStorage.getItem('token'); // Use localStorage for persistence

  if (!comment || !rating) {
    showToast('Please provide both a comment and a rating.');
    return;
  }

  if (!token) {
    showToast('You need to log in to submit a review.');
    window.location.href = 'login.html'; // Redirect to login page if no token
    return;
  }

  const reviewData = {
    rating: rating,
    comment: comment
  };

  try {
    const response = await fetch(`${apiUrlfrontend}/reviews.php/${productId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reviewData),
    });

    if (response.ok) {
      showToast('Review submitted successfully!');
      loadReviews(productId); // Reload the reviews for this product
      // Track the "submit_review" event when the user submits a review
      gtag('event', 'submit_review', {
        'event_category': 'E-commerce',
        'event_label': `Product ID: ${productId}`,
        'value': rating,  // The rating value can be tracked as the event value
        'comment_length': comment.length // Track the length of the comment as an additional metric
      });
      document.getElementById(`comment-${productId}`).value = '';
      document.getElementById(`rating-${productId}`).selectedIndex = 0;
      document.getElementById(`comment-${productId}`).focus();
    } else {
      console.error('Failed to submit review');
      showToast('Error submitting review.');
    }
  } catch (error) {
    console.error('Error submitting review:', error);
    showToast('An error occurred while submitting your review.');
    gtag('event', 'submit_review_failed', {
      'event_category': 'E-commerce',
      'event_label': `Product ID: ${productId}`,
      'value': rating,  // The rating value can be tracked as the event value
      'comment_length': comment.length // Track the length of the comment as an additional metric
    });
  }
}

// Function to handle pagination navigation
function setupPagination(products) {
  const paginationContainer = document.getElementById('paginationContainer');
  paginationContainer.innerHTML = ''; // Clear previous content

  const totalItems = products.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Create Previous Button
  const prevButton = document.createElement('button');
  prevButton.textContent = 'Previous';
  prevButton.className = 'btn btn-outline-primary m-1';
  prevButton.disabled = currentPage === 1; // Disable if we're on the first page
  prevButton.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      displayProducts(products); // Display the previous page
      setupPagination(products); // Re-render pagination to highlight the correct page
    }
  };
  paginationContainer.appendChild(prevButton);

  // Page buttons
  for (let i = 1; i <= totalPages; i++) {
    const pageButton = document.createElement('button');
    pageButton.textContent = i;
    pageButton.className = 'btn btn-outline-primary m-1';

    // Add active class if this is the current page
    if (i === currentPage) {
      pageButton.classList.add('active');
    }

    pageButton.onclick = () => {
      currentPage = i; // Update the current page
      displayProducts(products); // Load the selected page
      setupPagination(products); // Re-render pagination to highlight the correct page
    };

    paginationContainer.appendChild(pageButton);
  }

  // Create Next Button
  const nextButton = document.createElement('button');
  nextButton.textContent = 'Next';
  nextButton.className = 'btn btn-outline-primary m-1';
  nextButton.disabled = currentPage === totalPages; // Disable if we're on the last page
  nextButton.onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      displayProducts(products); // Display the next page
      setupPagination(products); // Re-render pagination to highlight the correct page
    }
  };
  paginationContainer.appendChild(nextButton);
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

// Example add to cart function
async function addToCart(productId, productName) {
  const token = localStorage.getItem('token'); // Token autentikasi
  if (!token) {
    showToast('You need to log in to add items to the cart.');
    window.location.href = 'login.html'; // Redirect to login page if no token
    return;
  }

  const status = await checkMySQLStatus();
  console.log('Status MySQL server add product:', status ? 'Online' : 'Offline');

  if (status) {
    try {
      // Fetch the current cart to check if the product already exists
      const cartResponse = await fetch(`${apiUrlfrontend}/cart.php`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!cartResponse.ok) {
        throw new Error(`Failed to fetch cart data. Status: ${cartResponse.status}`);
      }

      const cartData = await cartResponse.json(); // If the response is JSON, parse it
      //console.log(cartData);  // Log the response to check its structure

      let productInCart = cartData.find(item => item.ProductID === productId);

      if (productInCart) {
        // If product is already in cart, increment the quantity
        const updatedQuantity = parseInt(productInCart.Quantity) + 1;
        const updatePayload = {
          product_id: productId,
          quantity: updatedQuantity,
        };
        //console.log(`${apiUrlfrontend}/cart.php/${productInCart.ProductID}`);
        const updateResponse = await fetch(`${apiUrlfrontend}/cart.php/${productInCart.ProductID}`, {
          method: 'PUT', // Assuming you use PUT to update cart items
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatePayload),
        });

        if (updateResponse.ok) {
          showToast(`${productName} quantity updated to ${updatedQuantity}!`);
        } else {
          throw new Error('Failed to update product quantity.');
        }
      } else {
        // If product is not in cart, add it with quantity 1
        const addPayload = {
          product_id: productId,
          quantity: 1,
        };

        const addResponse = await fetch(`${apiUrlfrontend}/cart.php`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(addPayload),
        });

        if (addResponse.ok) {
          showToast(`${productName} added to cart!`);
          // Track the "add_to_cart" event when adding a new product
          gtag('event', 'add_to_cart', {
            'event_category': 'E-commerce',
            'event_label': productName,
            'value': 1 // Value is 1 as we're adding 1 unit to the cart
          });
        } else {
          throw new Error(`Failed to add ${productName} to cart.`);
        }
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      showToast('An error occurred while adding to the cart.');
      gtag('event', 'add_to_cart_failed', {
        'event_category': 'E-commerce',
        'event_label': productName,
        'value': 1 // Value is 1 as we're adding 1 unit to the cart
      });
    }
  } else {
    const token = localStorage.getItem('token');
    // Base URL of the RabbitMQ API
    const baseUrl = `${rabbitmqcart}`;
    // Ambil data keranjang dari local storage atau state
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    // Cari apakah produk sudah ada di keranjang
    const existingProductIndex = cart.findIndex(item => item.product_id === productId);

    // Jika produk sudah ada di keranjang, tambahkan kuantitasnya
    if (existingProductIndex !== -1) {
      cart[existingProductIndex].quantity += 1;
    } else {
      // Jika produk belum ada, tambahkan produk baru dengan quantity 1
      cart.push({
        product_id: productId,
        quantity: 1
      });
    }

    // Simpan kembali ke local storage atau state
    localStorage.setItem('cart', JSON.stringify(cart));

    const message = {
      token,
      cart: cart  // Kirim seluruh cart yang sudah diupdate
    };
    try {
      const response = await fetch(`${baseUrl}/producer/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message)
      });

      if (response.ok) {
        gtag('event', 'add_cartqueue', {
          'event_category': 'E-commerce',
          'event_label': productId,  // Use the category name as the label
          'value': 'Tambah keranjang'        // You can use the category's price as the event value
        });
        showToast("Produk berhasil ditambahkan ke keranjang antrian rabbitmq");
        window.location.reload();
      } else {
        gtag('event', 'add_cartqueuefailed', {
          'event_category': 'E-commerce',
          'event_label': productId,  // Use the category name as the label
          'value': 'Tambah keranjang'        // You can use the category's price as the event value
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

var apiUrlfrontend = '';
var rabbitmqmanageproducts = '';
var rabbitmqmanagecategory = '';
var rabbitmqcart = '';
var rabbitmqcheckout = '';

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

  loadProducts(); // Load all products and paginate them
  getUserProfile();
});