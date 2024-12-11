<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Mengimpor konfigurasi database
require_once(__DIR__ . '/database.php');
require_once(__DIR__ . '/jwt.php');
require_once(__DIR__ . '/auth.php');

// Menyiapkan header respon
header("Content-Type: application/json; charset=UTF-8");

// Menghubungkan ke database
$database = new Database();
$db = $database->getConnection();

// Mendapatkan metode HTTP
$method = $_SERVER['REQUEST_METHOD'];

// Mengambil parameter pencarian atau ID produk
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uriSegments = explode('/', $uri);
$productId = isset($uriSegments[5]) ? (int)$uriSegments[5] : null;
$searchQuery = isset($_GET['search']) ? htmlspecialchars($_GET['search']) : '';

// Cek autentikasi untuk endpoint admin
$auth = new Auth();
$isAdmin = $auth->isAdmin();

// Membuat objek produk
class Product {
    private $conn;
    private $table_name = "products";

    public function __construct($db) {
        $this->conn = $db;
    }

    public function listProducts($searchQuery = '') {
        $query = "SELECT ProductID, Name, Description, Price, Stock, CategoryID, ImageURL FROM " . $this->table_name;
        if (!empty($searchQuery)) {
            $query .= " WHERE Name LIKE :search OR Description LIKE :search";
        }
        $stmt = $this->conn->prepare($query);
        if (!empty($searchQuery)) {
            $searchTerm = "%$searchQuery%";
            $stmt->bindParam(':search', $searchTerm, PDO::PARAM_STR);
        }
        $stmt->execute();
        return $stmt;
    }

    public function getProductDetails($id) {
        $query = "SELECT ProductID, Name, Description, Price, Stock, CategoryID, ImageURL FROM " . $this->table_name." WHERE ProductID = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt;
    }

    public function AddProduct($name, $description, $price, $stock, $categoryID, $image) {
        $query = "CALL AddProduct(:name, :description, :price, :stock, :categoryID, :image)";
        $stmt = $this->conn->prepare($query);
    
        // Bind parameter
        $stmt->bindParam(':name', $name, PDO::PARAM_STR);
        $stmt->bindParam(':description', $description, PDO::PARAM_STR);
        $stmt->bindParam(':price', $price, PDO::PARAM_STR);
        $stmt->bindParam(':stock', $stock, PDO::PARAM_INT);
        $stmt->bindParam(':categoryID', $categoryID, PDO::PARAM_INT);
        $stmt->bindParam(':image', $image, PDO::PARAM_STR);
    
        // Eksekusi query
        if ($stmt->execute()) {
            return true;
        }
    
        // Jika gagal
        return false;
    }

    public function updateProduct($id, $name, $description, $price, $stock, $categoryID, $image) {
        $query = "UPDATE " . $this->table_name . " 
                  SET Name = :name, Description = :description, Price = :price, Stock = :stock, CategoryID = :categoryID, ImageURL = :image
                  WHERE ProductID = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':name', $name, PDO::PARAM_STR);
        $stmt->bindParam(':description', $description, PDO::PARAM_STR);
        $stmt->bindParam(':price', $price, PDO::PARAM_STR);
        $stmt->bindParam(':stock', $stock, PDO::PARAM_INT);
        $stmt->bindParam(':categoryID', $categoryID, PDO::PARAM_INT);
        $stmt->bindParam(':image', $image, PDO::PARAM_STR);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);  // Parameter :id juga harus dibind
        return $stmt->execute();
    }
    
    public function deleteProduct($id) {
        $query = "DELETE FROM " . $this->table_name . " WHERE ProductID = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
    
        return $stmt->execute();
    }
}

$product = new Product($db);

// Menangani endpoint berdasarkan metode HTTP
switch ($method) {
    case 'GET':
        if ($productId) {
            // Detail produk
            $stmt = $product->getProductDetails($productId);
            if ($stmt->rowCount() > 0) {
                echo json_encode($stmt->fetch(PDO::FETCH_ASSOC));
            } else {
                http_response_code(404);
                echo json_encode(['message' => 'Product not found']);
            }
        } else {
            // Daftar produk
            $stmt = $product->listProducts($searchQuery);
            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($products);
        }
        break;

    case 'POST':
        if ($isAdmin) {
            $data = json_decode(file_get_contents("php://input"), true);
            if (!empty($data['name']) && !empty($data['description']) && isset($data['price'], $data['stock'], $data['category_id']) && !empty($data['image'])) {
                if ($product->AddProduct($data['name'], $data['description'], $data['price'], $data['stock'], $data['category_id'], $data['image'])) {
                    http_response_code(201);
                    echo json_encode([
                        'message' => 'Product added successfully',
                        'receivedData' => $data  // Mengirimkan data yang diterima ke frontend
                    ]);
                } else {
                    http_response_code(500);
                    echo json_encode(['message' => 'Failed to add product']);
                }
            } else {
                http_response_code(400);
                echo json_encode(['message' => 'Incomplete data']);
            }
        } else {
            http_response_code(403);
            echo json_encode(['message' => 'Unauthorized']);
        }
        break;

    case 'PUT':
        if ($isAdmin && $productId) {
            $data = json_decode(file_get_contents("php://input"), true);
            if (!empty($data['name']) && !empty($data['description']) && isset($data['price'], $data['stock'], $data['category_id'], $data['image'])) {
                if ($product->updateProduct($productId, $data['name'], $data['description'], $data['price'], $data['stock'], $data['category_id'], $data['image'])) {
                    echo json_encode(['message' => 'Product updated successfully']);
                } else {
                    http_response_code(500);
                    echo json_encode(['message' => 'Failed to update product']);
                }
            } else {
                http_response_code(400);
                echo json_encode(['message' => 'Incomplete data']);
            }
        } else {
            http_response_code(403);
            echo json_encode(['message' => 'Unauthorized or Product ID missing']);
        }
        break;

    case 'DELETE':
        if ($isAdmin && $productId) {
            if ($product->deleteProduct($productId)) {
                echo json_encode(['message' => 'Product deleted successfully']);
            } else {
                http_response_code(500);
                echo json_encode(['message' => 'Failed to delete product']);
            }
        } else {
            http_response_code(403);
            echo json_encode(['message' => 'Unauthorized or Product ID missing']);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['message' => 'Method not allowed']);
        break;
}
?>
