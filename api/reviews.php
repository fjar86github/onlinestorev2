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

// Mengambil parameter ID produk atau ID review jika ada
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uriSegments = explode('/', $uri);
$productId = isset($uriSegments[5]) ? (int) $uriSegments[5] : null;

// Cek autentikasi untuk endpoint yang membutuhkan login
$auth = new Auth();
$userId = $auth->getUserId(); // Mendapatkan ID user dari JWT (atau sistem autentikasi lainnya)

// Membuat objek Review untuk interaksi dengan database
class Review
{
    private $conn;
    private $table_name = "reviews";

    public function __construct($db)
    {
        $this->conn = $db;
    }

    // Menambahkan review baru
    public function addReview($productId, $userId, $rating, $comment)
    {
        $query = "INSERT INTO " . $this->table_name . " (ProductID, UserID, Rating, Comment) 
                  VALUES (:product_id, :user_id, :rating, :comment)";
        $stmt = $this->conn->prepare($query);

        // Bind parameter ke query
        $stmt->bindParam(':product_id', $productId);
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':rating', $rating);
        $stmt->bindParam(':comment', $comment);

        // Eksekusi query
        return $stmt->execute();
    }

    // Mendapatkan semua review untuk produk tertentu
    public function getReviewsByProduct($productId)
    {
        // Query untuk mendapatkan review produk dan rata-rata rating per produk
        $query = "
            SELECT 
                r.ProductID,
                r.ReviewID, 
                r.Rating, 
                r.Comment, 
                r.CreatedAt, 
                u.Name
            FROM " . $this->table_name . " r
            JOIN users u ON r.UserID = u.UserID
            WHERE r.ProductID = :product_id
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':product_id', $productId);
        $stmt->execute();

        return $stmt;
    }

}

// Inisialisasi objek Review
$review = new Review($db);

// Menangani endpoint berdasarkan metode HTTP
switch ($method) {
    case 'POST':
        // Menambahkan review baru
        if ($userId && $productId) {
            $data = json_decode(file_get_contents("php://input"));
            $rating = isset($data->rating) ? $data->rating : null;
            $comment = isset($data->comment) ? $data->comment : '';

            // Validasi input
            if ($rating && $comment) {
                // Menambahkan review ke database
                if ($review->addReview($productId, $userId, $rating, $comment)) {
                    echo json_encode(['message' => 'Review added successfully']);
                } else {
                    echo json_encode(['message' => 'Failed to add review']);
                }
            } else {
                echo json_encode(['message' => 'Rating and comment are required']);
            }
        } else {
            echo json_encode(['message' => 'Unauthorized or invalid product ID']);
        }
        break;

    case 'GET':
        // Mendapatkan review produk
        if ($productId) {
            $stmt = $review->getReviewsByProduct($productId);
            $reviews = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $reviews[] = $row;
            }
            if (count($reviews) > 0) {
                echo json_encode($reviews);
            } else {
                echo json_encode(['message' => 'No reviews found for this product']);
            }
        } else {
            echo json_encode(['message' => 'Invalid product ID']);
        }
        break;

    default:
        echo json_encode(['message' => 'Method not allowed']);
        break;
}