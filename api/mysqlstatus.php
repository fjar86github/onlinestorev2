<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Content-Type: application/json; charset=UTF-8");

// Mengimpor konfigurasi database
require_once(__DIR__ . '/database.php');

// Endpoint hanya mendukung metode GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed']);
    exit();
}

// Mengecek status MySQL server
$database = new Database();

try {
    $db = $database->getConnection();
    // Mengecek koneksi database
    if ($db) {
        http_response_code(200);
        echo json_encode(['status' => 'online']);
    } else {
        http_response_code(500);
        echo json_encode(['status' => 'offline']);
    }
} catch (Exception $e) {
    // Menangani kesalahan tanpa menampilkan pesan error
    http_response_code(500);
    echo json_encode(['status' => 'offline']);
}
?>
