// Nama cache
const CACHE_NAME = 'my-site-cache-v1';

// File yang akan di-cache
const FILES_TO_CACHE = [
    '/onlinestorev2/public',
    '/onlinestorev2/public/cart.html',
    '/onlinestorev2/public/checkout.html',
    '/onlinestorev2/public/index.html',
    '/onlinestorev2/public/login.html',
    '/onlinestorev2/public/manage-categories.html',
    '/onlinestorev2/public/manage-products.html',
    '/onlinestorev2/public/manage-users.html',
    '/onlinestorev2/public/notifications.html',
    '/onlinestorev2/public/offline.html',
    '/onlinestorev2/public/orders.html',
    '/onlinestorev2/public/product-list.html',
    '/onlinestorev2/public/recomended.html',
    '/onlinestorev2/public/register.html',
    '/onlinestorev2/public/segmentasipelanggan.html',
    '/onlinestorev2/public/sentiment.html',
    '/onlinestorev2/public/service-worker.js',
    '/onlinestorev2/public/stokpredict.html',
    '/onlinestorev2/public/transaksi.html',
    '/onlinestorev2/public/user-profile.html',
    '/onlinestorev2/public/css/styles.css',
    '/onlinestorev2/public/css/themes.css',
    // Menambahkan semua file dalam folder js (pastikan menambahkan file spesifik)
    '/onlinestorev2/public/js/api_endpoints.json',
    '/onlinestorev2/public/js/cart.js',
    '/onlinestorev2/public/js/chatbot.js',
    '/onlinestorev2/public/js/checkout.js',
    '/onlinestorev2/public/js/config.js',
    '/onlinestorev2/public/js/manage-categories.js',
    '/onlinestorev2/public/js/manage-products.js',
    '/onlinestorev2/public/js/manage-users.js',
    '/onlinestorev2/public/js/notifications.js',
    '/onlinestorev2/public/js/orders.js',
    '/onlinestorev2/public/js/product-list.js',
    '/onlinestorev2/public/js/products.js',
    '/onlinestorev2/public/js/recomended.js',
    '/onlinestorev2/public/js/segmentasi.js',
    '/onlinestorev2/public/js/sentiment.js',
    '/onlinestorev2/public/js/stokpredict.js',
    '/onlinestorev2/public/js/transaksi.js',
    '/onlinestorev2/public/js/userprofile.js',
    '/onlinestorev2/public/js/workerconfig.js',

    // Menambahkan semua file dalam folder templates (pastikan menambahkan file spesifik)
    '/onlinestorev2/public/templates/footer.html',
    '/onlinestorev2/public/templates/header.html',
    '/onlinestorev2/public/templates/sidebar.html',
];

// Event 'install' untuk menyimpan file ke cache
self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return Promise.all(FILES_TO_CACHE.map(function (url) {
                return fetch(url).then(function (response) {
                    if (response.ok) {
                        // Cache the file if it's successfully fetched
                        cache.put(url, response);
                    } else {
                        console.error('Failed to fetch:', url, response.status);
                    }
                }).catch(function (error) {
                    // Log error if the file request fails
                    console.error('Error fetching file:', url, error);
                });
            }));
        })
    );
});

// Event 'activate' untuk menghapus cache lama
self.addEventListener('activate', function (event) {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.map(function (cacheName) {
                    // Menghapus cache yang tidak ada dalam whitelist
                    if (!cacheWhitelist.includes(cacheName)) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Event 'fetch' untuk menangani request dan cache
self.addEventListener('fetch', function (event) {
    event.respondWith(
        // Mengecek koneksi jaringan terlebih dahulu
        fetch(event.request).then(function (networkResponse) {
            // Jika ada koneksi, simpan ke cache dan kembalikan responsnya
            return caches.open(CACHE_NAME).then(function (cache) {
                cache.put(event.request, networkResponse.clone());
                return networkResponse;
            });
        }).catch(function () {
            // Jika jaringan tidak tersedia, ambil data dari cache
            return caches.match(event.request).then(function (cacheResponse) {
                return cacheResponse || new Response('Offline: Data tidak tersedia', {
                    status: 503,
                    statusText: 'Service Unavailable'
                });
            });
        })
    );
});
