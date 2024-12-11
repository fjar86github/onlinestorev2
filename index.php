<?php

// Menambahkan header CORS
header("Access-Control-Allow-Origin: *"); // Mengizinkan semua origin, bisa diganti dengan domain tertentu jika dibutuhkan
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS"); // Metode HTTP yang diizinkan
header("Access-Control-Allow-Headers: Content-Type, Authorization"); // Header yang diizinkan

// Autoloader untuk memuat file PHP
spl_autoload_register(function ($class_name) {
    $file = __DIR__ . '/helpers/' . $class_name . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});

// Include konfigurasi database
require_once(__DIR__ . '/api/database.php');

// Menghubungkan ke database
$database = new Database();
$db = $database->getConnection();

// Inisialisasi JWT Helper dan Auth Helper
use Helpers\JWT;
use Helpers\Auth;

// Menangani permintaan API
$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Jika permintaan adalah OPTIONS, hanya kembalikan header CORS dan status 200 OK
if ($method == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Path endpoint yang diinginkan
$baseApiPath = '/index.php/api/';

// Menangani permintaan berdasarkan path yang diterima
if (strpos($uri, $baseApiPath . 'register') === 0) {
    require_once 'api/register.php';
} elseif (strpos($uri, $baseApiPath . 'login') === 0) {
    require_once 'api/login.php';
} elseif (strpos($uri, $baseApiPath . 'profile') === 0) {
    require_once 'api/profile.php';
} elseif (strpos($uri, $baseApiPath . 'products') === 0) {
    require_once 'api/products.php';
} elseif (strpos($uri, $baseApiPath . 'cart') === 0) {
    require_once 'api/cart.php';
} elseif (strpos($uri, $baseApiPath . 'orders') === 0) {
    require_once 'api/orders.php';
} elseif (strpos($uri, $baseApiPath . 'reviews') === 0) {
    require_once 'api/reviews.php';
} elseif (strpos($uri, $baseApiPath . 'categories') === 0) {
    require_once 'api/categories.php';
} elseif (strpos($uri, $baseApiPath . 'notifications') === 0) {
    require_once 'api/notifications.php';
} elseif (strpos($uri, $baseApiPath . 'users') === 0) {
    require_once 'api/users.php';
} elseif (strpos($uri, $baseApiPath . 'transaksi') === 0) {
    require_once 'api/transaksi.php';
} elseif (strpos($uri, $baseApiPath . 'segmentasipelanggan') === 0) {
    require_once 'api/segmentasipelanggan.php';
} elseif (strpos($uri, $baseApiPath . 'chatbot') === 0) {
    require_once 'api/chatbot.php';
} elseif (strpos($uri, $baseApiPath . 'mysqlstatus') === 0) {
    require_once 'api/mysqlstatus.php';
} else {
    // Jika tidak ditemukan endpoint yang sesuai
    header("HTTP/1.1 404 Not Found");
    print("base uri=".$uri."<br>");
    echo json_encode(['message' => 'Endpoint not found']);
}
