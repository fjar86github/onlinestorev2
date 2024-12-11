<?php

// Mengimpor konfigurasi database dan helper
require_once(__DIR__ . '/database.php');
require_once(__DIR__ . '/jwt.php');
require_once(__DIR__ . '/auth.php');

// Menyiapkan respon
header("Content-Type: application/json; charset=UTF-8");

// Menghubungkan ke database
$database = new Database();
$db = $database->getConnection();

// Mendapatkan metode HTTP
$method = $_SERVER['REQUEST_METHOD'];

// Mengambil parameter ID produk jika ada
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uriSegments = explode('/', $uri);
$productId = isset($uriSegments[5]) ? (int) $uriSegments[5] : null;

// Cek autentikasi untuk endpoint yang membutuhkan login
$auth = new Auth();
$userId = $auth->getUserId(); // Mendapatkan ID user dari JWT (atau sistem autentikasi lainnya)

// Membuat objek CustomerSegmentation untuk interaksi dengan database
class CustomerSegmentation
{
    private $conn;

    public function __construct($db)
    {
        $this->conn = $db;
    }

    // Mendapatkan segmentasi pelanggan
    public function getCustomerSegmentation()
    {
        $query = "
            SELECT 
                Summary.UserID, 
                Summary.Name, 
                CASE 
                    WHEN Summary.TotalSpent > 1000 THEN 'High Spender' 
                    WHEN Summary.TotalSpent BETWEEN 500 AND 1000 THEN 'Mid Spender' 
                    ELSE 'Low Spender' 
                END AS SpendingCategory, 
                CASE 
                    WHEN Summary.PurchaseFrequency > 5 THEN 'Frequent Buyer' 
                    ELSE 'Occasional Buyer' 
                END AS FrequencyCategory, 
                Summary.FavoriteCategory
            FROM (
                SELECT 
                    o.UserID, 
                    u.Name, 
                    COUNT(o.OrderID) AS PurchaseFrequency, 
                    SUM(o.TotalAmount) AS TotalSpent, 
                    c.Name AS FavoriteCategory
                FROM 
                    orders o
                JOIN 
                    orderdetails od ON o.OrderID = od.OrderID
                JOIN 
                    products p ON od.ProductID = p.ProductID
                JOIN 
                    categories c ON p.CategoryID = c.CategoryID
                JOIN 
                    users u ON o.UserID = u.UserID
                GROUP BY 
                    o.UserID, u.Name, c.Name
            ) AS Summary";
        
        $stmt = $this->conn->prepare($query);

        if ($stmt->execute()) {
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } else {
            return false; // Kembalikan false jika eksekusi query gagal
        }
    }
}

// Inisialisasi objek CustomerSegmentation
$segment = new CustomerSegmentation($db);

// Menangani endpoint berdasarkan metode HTTP
switch ($method) {
    case 'GET':
        // Mendapatkan segmentasi pelanggan
        $data = $segment->getCustomerSegmentation();

        if ($data !== false) {
            echo json_encode($data);
        } else {
            echo json_encode(['message' => 'Failed to retrieve customer segmentation']);
        }
        break;

    default:
        echo json_encode(['message' => 'Method not allowed']);
        break;
}
