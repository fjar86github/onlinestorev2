<?php

require_once(__DIR__ . '/database.php');
require_once(__DIR__ . '/auth.php');

header("Content-Type: application/json; charset=UTF-8");

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$uriSegments = explode('/', parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
$UserID = isset($uriSegments[5]) ? (int) $uriSegments[5] : null;
$searchQuery = isset($_GET['search']) ? htmlspecialchars($_GET['search']) : '';

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

class Users
{
    private $conn;
    private $table_name = "users";

    public function __construct($db)
    {
        $this->conn = $db;
    }

    public function listUsers($searchQuery = '')
    {
        $query = "SELECT * FROM " . $this->table_name;
        if (!empty($searchQuery)) {
            $query .= " WHERE Name LIKE :search";
        }
        $stmt = $this->conn->prepare($query);
        if (!empty($searchQuery)) {
            $searchTerm = "%$searchQuery%";
            $stmt->bindParam(':search', $searchTerm, PDO::PARAM_STR);
        }
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getUserById($userID)
    {
        $query = "SELECT * FROM {$this->table_name} WHERE UserID = :userID";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':userID', $userID);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function updateUser($userID, $name, $email, $password, $role)
    {
        $passwordHash = password_hash($password, PASSWORD_BCRYPT);
        $query = "UPDATE {$this->table_name} 
                  SET Name = :name, 
                      Email = :email, 
                      PasswordHash = :passwordHash, 
                      Role = :role 
                  WHERE UserID = :userID";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':userID', $userID, PDO::PARAM_INT);
        $stmt->bindParam(':name', htmlspecialchars(strip_tags($name)), PDO::PARAM_STR);
        $stmt->bindParam(':email', htmlspecialchars(strip_tags($email)), PDO::PARAM_STR);
        $stmt->bindParam(':passwordHash', $passwordHash, PDO::PARAM_STR);
        $stmt->bindParam(':role', htmlspecialchars(strip_tags($role)), PDO::PARAM_STR);

        return $stmt->execute();
    }

    public function deleteUser($userID)
    {
        $deleteLogsQuery = "DELETE FROM userlogs WHERE UserID = :userID";
        $stmt = $this->conn->prepare($deleteLogsQuery);
        $stmt->bindParam(':userID', $userID);
        if (!$stmt->execute()) {
            return false;
        }

        $query = "DELETE FROM {$this->table_name} WHERE UserID = :userID";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':userID', $userID);

        return $stmt->execute();
    }
}

$users = new Users($db);

try {
    switch ($method) {
        case 'GET':
            if ($UserID) {
                $result = $users->getUserById($UserID);
                if (!$result) {
                    http_response_code(404);
                    echo json_encode(['message' => 'User not found']);
                } else {
                    echo json_encode($result);
                }
            } else {
                $result = $users->listUsers($searchQuery);
                echo json_encode($result);
            }
            break;

        case 'PUT':
            if (!$UserID) {
                http_response_code(400);
                echo json_encode(['message' => 'User ID is required']);
                break;
            }
            $data = json_decode(file_get_contents("php://input"), true);
            if (!isset($data['name'], $data['email'], $data['password'], $data['role'])) {
                http_response_code(400);
                echo json_encode(['message' => 'Invalid input']);
                break;
            }

            if ($users->updateUser($UserID, $data['name'], $data['email'], $data['password'], $data['role'])) {
                echo json_encode(['message' => 'User updated']);
            } else {
                throw new Exception('Failed to update user');
            }
            break;

        case 'DELETE':
            if (!$UserID) {
                http_response_code(400);
                echo json_encode(['message' => 'User ID is required']);
                break;
            }

            if ($users->deleteUser($UserID)) {
                echo json_encode(['message' => 'User deleted']);
            } else {
                throw new Exception('Failed to delete user');
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
