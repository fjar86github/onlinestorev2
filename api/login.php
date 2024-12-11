<?php
require_once __DIR__ . '/database.php';
require_once __DIR__ . '/jwt.php';

$data = json_decode(file_get_contents("php://input"), true);

if (isset($data['email']) && isset($data['password'])) {
    $database = new Database();
    $db = $database->getConnection();

    // Query untuk mengambil user berdasarkan email
    $query = "SELECT * FROM users WHERE Email = :email";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':email', $data['email']);
    $stmt->execute();

    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // Jika user ditemukan dan password sesuai
    if ($user && password_verify($data['password'], $user['PasswordHash'])) {
        // Tambahkan 'Role' ke dalam payload JWT
        $payload = [
            'UserID' => $user['UserID'],
            'Email' => $user['Email'],
            'Role' => $user['Role'] // Pastikan ada kolom 'Role' di tabel users
        ];

        // Menghasilkan token JWT dengan menambahkan Role
        $token = JWT::encode($payload);
        
        // Kembalikan token sebagai respons
        echo json_encode(['token' => $token]);
    } else {
        echo json_encode(['message' => 'Invalid email or password.']);
    }
} else {
    echo json_encode(['message' => 'Invalid input.']);
}
?>