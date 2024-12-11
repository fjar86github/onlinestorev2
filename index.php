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
$urlendpoint="/onlinestorev2/index.php";

if (strpos($uri, $urlendpoint.'/api/register') === 0){
    require_once 'api/register.php';
} elseif (strpos($uri, $urlendpoint.'/api/login') === 0) {
    require_once 'api/login.php';
} elseif (strpos($uri, $urlendpoint.'/api/profile') === 0) {
    require_once 'api/profile.php';
}elseif (strpos($uri, $urlendpoint.'/api/products') === 0) {
    require_once 'api/products.php';
}elseif (strpos($uri, $urlendpoint.'/api/cart') === 0) {
    require_once 'api/cart.php';
}elseif (strpos($uri, $urlendpoint.'/api/orders') === 0) {
    require_once 'api/orders.php';
}elseif (strpos($uri, $urlendpoint.'/api/reviews') === 0) {
    require_once 'api/reviews.php';
}elseif (strpos($uri, $urlendpoint.'/api/categories') === 0) {
    require_once 'api/categories.php';
}elseif (strpos($uri, $urlendpoint.'/api/notifications') === 0) {
    require_once 'api/notifications.php';
}elseif (strpos($uri, $urlendpoint.'/api/users') === 0) {
    require_once 'api/users.php';
}elseif (strpos($uri, $urlendpoint.'/api/transaksi') === 0) {
    require_once 'api/transaksi.php';
}elseif (strpos($uri, $urlendpoint.'/api/segmentasipelanggan') === 0) {
    require_once 'api/segmentasipelanggan.php';
}elseif (strpos($uri, $urlendpoint.'/api/chatbot') === 0) {
    require_once 'api/chatbot.php';
}elseif (strpos($uri, $urlendpoint.'/api/mysqlstatus') === 0) {
    require_once 'api/mysqlstatus.php';
}else {
    header("HTTP/1.1 404 Not Found");
    echo json_encode(['message' => 'Endpoint not found']);
}
