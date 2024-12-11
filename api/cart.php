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

// Mengambil parameter ID produk atau ID cart jika ada
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uriSegments = explode('/', $uri);
$itemId = isset($uriSegments[5]) ? (int)$uriSegments[5] : null;

// Cek autentikasi untuk endpoint yang membutuhkan login
$auth = new Auth();
$userId = $auth->getUserId(); // Mendapatkan ID user dari JWT (atau sistem autentikasi lainnya)

// Membuat objek Cart untuk interaksi dengan database
class Cart {
    private $conn;
    private $table_name = "cart";

    public function __construct($db) {
        $this->conn = $db;
    }

    public function addItem($userId, $productId, $quantity) {
        $query = "INSERT INTO " . $this->table_name . " (UserID, ProductID, Quantity) VALUES (?, ?, ?)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $userId);
        $stmt->bindParam(2, $productId);
        $stmt->bindParam(3, $quantity);
        return $stmt->execute();
    }

    public function getCartItems($userId) {
        $query = "SELECT c.CartID, p.ProductID, p.Name, p.Price, c.Quantity FROM " . $this->table_name . " c
                  JOIN Products p ON c.ProductID = p.ProductID WHERE c.UserID = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $userId);
        $stmt->execute();
        return $stmt;
    }

    public function removeItem($userId, $itemId) {
        $query = "DELETE FROM " . $this->table_name . " WHERE UserID = ? AND CartID = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $userId);
        $stmt->bindParam(2, $itemId);
        return $stmt->execute();
    }

    public function updateItem($userId, $itemId, $quantity) {
        $query = "UPDATE " . $this->table_name . " SET Quantity = ? WHERE UserID = ? AND ProductID = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $quantity);
        $stmt->bindParam(2, $userId);
        $stmt->bindParam(3, $itemId);
        return $stmt->execute();
    }

    public function checkout($userId) {
        try {
            // Mulai transaksi
            $this->conn->beginTransaction();
    
            // Hitung totalAmount dari Cart
            $query = "SELECT SUM(p.Price * c.Quantity) 
                      FROM Cart c
                      JOIN Products p ON c.ProductID = p.ProductID
                      WHERE c.UserID = :userId";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':userId', $userId, PDO::PARAM_INT);
            $stmt->execute();
            $totalAmount = $stmt->fetchColumn();
    
            // Debug: Menampilkan totalAmount
            error_log("Total Amount: " . $totalAmount);
    
            // Masukkan data ke dalam tabel Orders
            $query = "INSERT INTO Orders (UserID, TotalAmount, PaymentStatus, OrderStatus, CreatedAt)
                      VALUES (:userId, :totalAmount, 'Pending', 'Processing', NOW())";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':userId', $userId, PDO::PARAM_INT);
            $stmt->bindParam(':totalAmount', $totalAmount, PDO::PARAM_STR);
            $stmt->execute();
    
            // Ambil OrderID terakhir yang dimasukkan
            $orderId = $this->conn->lastInsertId();
    
            // Pindahkan data dari Cart ke OrderDetails
            $query = "INSERT INTO OrderDetails (OrderID, ProductID, Quantity, Price)
                      SELECT :orderId, c.ProductID, c.Quantity, p.Price
                      FROM Cart c
                      JOIN Products p ON c.ProductID = p.ProductID
                      WHERE c.UserID = :userId";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':orderId', $orderId, PDO::PARAM_INT);
            $stmt->bindParam(':userId', $userId, PDO::PARAM_INT);
            $stmt->execute();
    
            // Update stok produk di tabel Products
            $query = "UPDATE Products p
                      JOIN Cart c ON p.ProductID = c.ProductID
                      SET p.Stock = p.Stock - c.Quantity
                      WHERE c.UserID = :userId";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':userId', $userId, PDO::PARAM_INT);
            $stmt->execute();
    
            // Hapus data dari Cart setelah order diproses
            $query = "DELETE FROM Cart WHERE UserID = :userId";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':userId', $userId, PDO::PARAM_INT);
            $stmt->execute();
    
            // Commit transaksi
            $this->conn->commit();
            return true;
        } catch (Exception $e) {
            // Rollback jika ada kesalahan
            $this->conn->rollBack();
            error_log("Checkout failed: " . $e->getMessage());
            return false;
        }
    }
    

    public function getTransactionDetails($userId) {
        $query = "SELECT * FROM transactiondetails WHERE UserID = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $userId);
        $stmt->execute();
        return $stmt;
    }
}

$cart = new Cart($db);

// Menangani endpoint berdasarkan metode HTTP
switch ($method) {
    case 'POST':
        if ($userId) {
            // Cek apakah ini untuk menambahkan item ke keranjang atau checkout
            $data = json_decode(file_get_contents("php://input"));
            
            if (isset($_GET['action']) && $_GET['action'] == 'checkout') {
                // Operasi checkout
                $checkoutSuccess = $cart->checkout($userId);
                if ($checkoutSuccess) {
                    echo json_encode(['message' => 'Checkout successful, order created']);
                } else {
                    echo json_encode(['message' => 'Checkout failed']);
                }
            } elseif (isset($data->product_id) && isset($data->quantity)) {
                // Menambahkan item ke keranjang
                $cart->addItem($userId, $data->product_id, $data->quantity);
                echo json_encode(['message' => 'Item added to cart']);
            } else {
                echo json_encode(['message' => 'Invalid operation']);
            }
        } else {
            echo json_encode(['message' => 'Unauthorized']);
        }
        break;

    case 'GET':
        if ($userId) {
            if (isset($_GET['action']) && $_GET['action'] == 'transactions') {
                // Ambil data transaksi
                $stmt = $cart->getTransactionDetails($userId);
                $transactions = [];
                while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                    $transactions[] = $row;
                }
                echo json_encode($transactions);
            } else {
                // Ambil item dari keranjang
                $stmt = $cart->getCartItems($userId);
                $items = [];
                while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                    $items[] = $row;
                }
                echo json_encode($items);
            }
        } else {
            echo json_encode(['message' => 'Unauthorized']);
        }
        break;

    case 'PUT':
        if ($userId && $itemId) {
            $data = json_decode(file_get_contents("php://input"));
            if (isset($data->quantity)) {
                $updated = $cart->updateItem($userId, $itemId, $data->quantity);
                if ($updated) {
                    echo json_encode(['message' => 'Item quantity updated']);
                } else {
                    echo json_encode(['message' => 'Failed to update item']);
                }
            } else {
                echo json_encode(['message' => 'Missing quantity']);
            }
        } else {
            echo json_encode(['message' => 'Unauthorized or missing item ID']);
        }
        break;

    case 'DELETE':
        if ($userId && $itemId) {
            $cart->removeItem($userId, $itemId);
            echo json_encode(['message' => 'Item removed from cart']);
        } else {
            echo json_encode(['message' => 'Unauthorized or missing item ID']);
        }
        break;

    default:
        echo json_encode(['message' => 'Method not allowed']);
        break;
}
