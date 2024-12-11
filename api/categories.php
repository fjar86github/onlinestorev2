<?php

require_once(__DIR__ . '/database.php');
require_once(__DIR__ . '/auth.php');

header("Content-Type: application/json; charset=UTF-8");

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$uriSegments = explode('/', parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
$categoryId = isset($uriSegments[5]) ? (int)$uriSegments[5] : null;

$auth = new Auth();
$payload = $auth->isAuthenticated();

if (!$payload) {
    http_response_code(401);
    echo json_encode(['message' => 'Unauthorized']);
    exit;
}

if (!$auth->isAdmin()) {
    echo json_encode(['message' => 'Role Admin Diperlukan']);
    exit;
}

class Category {
    private $conn;
    private $table_name = "categories";

    public function __construct($db) {
        $this->conn = $db;
    }

    public function getAllCategories() {
        $query = "SELECT * FROM {$this->table_name}";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getCategoryById($categoryId) {
        $query = "SELECT * FROM {$this->table_name} WHERE CategoryID = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $categoryId);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function addCategory($name, $description) {
        $query = "INSERT INTO {$this->table_name} (Name, Description) VALUES (:name, :description)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':name', htmlspecialchars(strip_tags($name)));
        $stmt->bindParam(':description', htmlspecialchars(strip_tags($description)));
        return $stmt->execute();
    }

    public function updateCategory($categoryId, $name, $description) {
        $query = "UPDATE {$this->table_name} SET Name = :name, Description = :description WHERE CategoryID = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $categoryId);
        $stmt->bindParam(':name', htmlspecialchars(strip_tags($name)));
        $stmt->bindParam(':description', htmlspecialchars(strip_tags($description)));
        return $stmt->execute();
    }

    public function deleteCategory($categoryId) {
        $query = "DELETE FROM {$this->table_name} WHERE CategoryID = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $categoryId);
        return $stmt->execute();
    }
}

$category = new Category($db);

try {
    switch ($method) {
        case 'GET':
            $result = $categoryId ? $category->getCategoryById($categoryId) : $category->getAllCategories();
            if (!$result) {
                http_response_code(404);
                echo json_encode(['message' => 'Category not found']);
            } else {
                echo json_encode($result);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents("php://input"), true);
            if (!isset($data['name'], $data['description'])) {
                http_response_code(400);
                echo json_encode(['message' => 'Invalid input']);
                break;
            }
            if ($category->addCategory($data['name'], $data['description'])) {
                http_response_code(201);
                echo json_encode(['message' => 'Category created']);
            } else {
                throw new Exception('Failed to create');
            }
            break;

        case 'PUT':
            if (!$categoryId) {
                http_response_code(400);
                echo json_encode(['message' => 'Category ID is required']);
                break;
            }
            $data = json_decode(file_get_contents("php://input"), true);
            if (!isset($data['name'], $data['description'])) {
                http_response_code(400);
                echo json_encode(['message' => 'Invalid input']);
                break;
            }
            if ($category->updateCategory($categoryId, $data['name'], $data['description'])) {
                echo json_encode(['message' => 'Category updated']);
            } else {
                throw new Exception('Failed to update');
            }
            break;

        case 'DELETE':
            if (!$categoryId) {
                http_response_code(400);
                echo json_encode(['message' => 'Category ID is required']);
                break;
            }
            if ($category->deleteCategory($categoryId)) {
                echo json_encode(['message' => 'Category deleted']);
            } else {
                throw new Exception('Failed to delete');
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(['message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => $e->getMessage()]);
}