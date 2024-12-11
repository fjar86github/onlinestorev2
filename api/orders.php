<?php

// Mengimpor konfigurasi database
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

// Mengambil parameter ID produk atau ID pesanan jika ada
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uriSegments = explode('/', $uri);
$orderId = isset($uriSegments[5]) ? (int)$uriSegments[5] : null;

// Cek autentikasi untuk endpoint yang membutuhkan login
$auth = new Auth();
$userId = $auth->getUserId(); // Mendapatkan ID user dari JWT (atau sistem autentikasi lainnya)

// Membuat objek Order untuk interaksi dengan database
class Order {
    private $conn;
    private $table_name = "order_summary";//menggunakan view agar lebih rinci

    public function __construct($db) {
        $this->conn = $db;
    }

    // Mendapatkan semua pesanan berdasarkan userID dan produk terkait
    public function getOrdersByUser($userId) {
        $query = "SELECT OrderID, TotalAmount, PaymentStatus, OrderStatus, OrderCreatedAt, ProductID, ProductName, " .
            "ProductPrice, QuantityOrdered, TotalPrice, CategoryName, ProductStock, AverageRating " .  // Tambahkan spasi sebelum FROM
            "FROM " . $this->table_name . " WHERE UserID = ? ORDER BY OrderID ASC";
    
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $userId);
        $stmt->execute();
        return $stmt;
    }

    // Mendapatkan detail pesanan berdasarkan orderId dan produk terkait
    public function getOrderById($orderId) {
        $query = "SELECT OrderID,ProductID,ProductName,ProductPrice,QuantityOrdered,TotalPrice,AverageRating". 
                  "FROM " . $this->table_name . "
                  WHERE OrderID = ?";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $orderId);
        $stmt->execute();
        return $stmt;
    }

// Menambahkan method untuk update status
public function updateOrderStatus($orderId, $paymentStatus, $orderStatus) {
    // Validasi status yang diterima
    $validPaymentStatuses = ['Pending', 'Paid', 'Failed'];
    $validOrderStatuses = ['Processing', 'Shipped', 'Delivered', 'Canceled'];

    if (!in_array($paymentStatus, $validPaymentStatuses) || !in_array($orderStatus, $validOrderStatuses)) {
        return ['message' => 'Invalid status provided'];
    }

    // Query untuk update status
    $query = "UPDATE " . $this->table_name . " SET PaymentStatus = ?, OrderStatus = ? WHERE OrderID = ?";
    $stmt = $this->conn->prepare($query);

    // Binding parameter
    $stmt->bindParam(1, $paymentStatus);
    $stmt->bindParam(2, $orderStatus);
    $stmt->bindParam(3, $orderId);

    // Menjalankan query
    if ($stmt->execute()) {
        return ['message' => 'Order status updated successfully'];
    } else {
        return ['message' => 'Failed to update order status'];
    }
}

}

$order = new Order($db);

// Menangani endpoint berdasarkan metode HTTP
switch ($method) {
    case 'GET':
        if ($orderId) {
            // Mendapatkan detail pesanan berdasarkan ID pesanan
            $stmt = $order->getOrderById($orderId);
            if ($stmt->rowCount() > 0) {
                $row = $stmt->fetch(PDO::FETCH_ASSOC);
                echo json_encode($row);
            } else {
                echo json_encode(['message' => 'Order not found']);
            }
        } else {
            // Mendapatkan daftar pesanan pengguna
            if ($userId) {
                $stmt = $order->getOrdersByUser($userId);
                $orders = [];
                while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                    $orders[] = $row;
                }
                echo json_encode($orders);
            } else {
                echo json_encode(['message' => 'Unauthorized']);
            }
        }
        break;
    case 'PUT':
            // Mengambil data JSON dari request body
            $input = json_decode(file_get_contents('php://input'), true);
    
            if (!isset($input['paymentStatus']) || !isset($input['orderStatus'])) {
                echo json_encode(['message' => 'PaymentStatus and OrderStatus are required']);
                break;
            }
    
            // Memperbarui status order berdasarkan orderId
            $response = $order->updateOrderStatus($orderId, $input['paymentStatus'], $input['orderStatus']);
            echo json_encode($response);
            break;
    
    default:
        echo json_encode(['message' => 'Method not allowed']);
        break;
}
