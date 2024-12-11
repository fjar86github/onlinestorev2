<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE, PUT");
header('Content-Type: application/json');

// Aktifkan tampilan error
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set path untuk log error (jika diperlukan)
ini_set('log_errors', 1);
ini_set('error_log', '/path/to/your/error.log'); // Ganti dengan path log Anda

require_once __DIR__ . '/database.php';

$data = json_decode(file_get_contents("php://input"), true);

// Cek kesalahan saat parsing JSON
if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode(['message' => 'Input JSON tidak valid.', 'error' => json_last_error_msg()]);
    exit();
}

if (isset($data['email']) && isset($data['password']) && isset($data['name'])) {
    $database = new Database();
    $db = $database->getConnection();

    // Cek koneksi database
    if ($db === null) {
        echo json_encode(['message' => 'Koneksi database gagal.']);
        exit();
    }

    // Sanitasi input untuk mencegah SQL Injection
    $name = htmlspecialchars($data['name']);
    $email = filter_var($data['email'], FILTER_SANITIZE_EMAIL);
    $password = $data['password'];

    // Validasi email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['message' => 'Format email tidak valid.']);
        exit();
    }

    // Hash password sebelum disimpan
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
    
    try {
        // Query untuk menyimpan data pengguna
        $query = "INSERT INTO users (Name, Email, PasswordHash, Role) VALUES (?, ?, ?, 'Customer')";
        $stmt = $db->prepare($query);

        // Cek jika query preparation gagal
        if ($stmt === false) {
            echo json_encode(['message' => 'Query preparation gagal.', 'error' => $db->errorInfo()]);
            exit();
        }

        // Bind parameter
        $stmt->bindParam(1, $name);
        $stmt->bindParam(2, $email);
        $stmt->bindParam(3, $hashedPassword);

        // Eksekusi query
        if ($stmt->execute()) {
            echo json_encode(['message' => 'Pendaftaran berhasil.']);
        } else {
            // Menampilkan error jika query gagal
            $errorInfo = $stmt->errorInfo();
            echo json_encode(['message' => 'Pendaftaran gagal.', 'error' => $errorInfo]);
        }
    } catch (Exception $e) {
        // Menangkap dan menampilkan exception jika ada kesalahan
        error_log('Error: ' . $e->getMessage());
        echo json_encode(['message' => 'Terjadi kesalahan yang tidak terduga, pastikan anda menggunakan email yang berbeda', 'error' => $e->getMessage()]);
    }
} else {
    echo json_encode(['message' => 'Input tidak valid. Pastikan nama, email, dan password telah diisi.']);
}

?>
