<?php

require_once(__DIR__ . '/database.php');
require_once(__DIR__ . '/auth.php');

header("Content-Type: application/json; charset=UTF-8");

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$uriSegments = explode('/', parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
$notificationId = isset($uriSegments[5]) ? (int) $uriSegments[5] : null;

$searchQuery = isset($_GET['search']) ? htmlspecialchars($_GET['search']) : '';

$auth = new Auth();
$payload = $auth->isAuthenticated();

if (!$payload) {
    http_response_code(401);
    echo json_encode(['message' => 'Unauthorized']);
    exit;
}

class PushNotification
{
    private $conn;
    private $table_name = "pushnotifications";

    public function __construct($db)
    {
        $this->conn = $db;
    }

    public function getAllNotifications()
    {
        $query = "SELECT * FROM {$this->table_name}";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getNotificationById($notificationId)
    {
        $query = "SELECT * FROM {$this->table_name} WHERE NotificationID = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $notificationId);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function addNotification($userId, $token, $message, $type)
    {
        $query = "INSERT INTO {$this->table_name} (UserID, Token, message, type) 
                  VALUES (:userId, :token, :message, :type)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':userId', htmlspecialchars(strip_tags($userId)));
        $stmt->bindParam(':token', htmlspecialchars(strip_tags($token)));
        $stmt->bindParam(':message', htmlspecialchars(strip_tags($message)));
        $stmt->bindParam(':type', htmlspecialchars(strip_tags($type)));
        return $stmt->execute();
    }

    public function updateNotification($notificationId, $userid, $token, $message, $type)
    {
        $query = "UPDATE {$this->table_name} SET UserID=:userid, Token=:token, message = :message, type = :type
                  WHERE NotificationID = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $notificationId);
        $stmt->bindParam(':userid', $userid);
        $stmt->bindParam(':token', $token);
        $stmt->bindParam(':message', htmlspecialchars(strip_tags($message)));
        $stmt->bindParam(':type', htmlspecialchars(strip_tags($type)));
        return $stmt->execute();
    }

    public function deleteNotification($notificationId)
    {
        $query = "DELETE FROM {$this->table_name} WHERE NotificationID = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $notificationId);
        return $stmt->execute();
    }

    public function listNotifications($searchQuery = '')
    {
        $query = "SELECT * FROM " . $this->table_name;
        if (!empty($searchQuery)) {
            $query .= " WHERE message LIKE :search ORDER BY NotificationID ASC";
        }
        $stmt = $this->conn->prepare($query);
        if (!empty($searchQuery)) {
            $searchTerm = "%$searchQuery%";
            $stmt->bindParam(':search', $searchTerm, PDO::PARAM_STR);
        }
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC); // Mengembalikan hasil dalam bentuk array
    }
}

$notification = new PushNotification($db);

try {
    switch ($method) {
        case 'GET':
            if ($notificationId) {
                $result = $notification->getNotificationById($notificationId);
            } else if (!empty($searchQuery)) {
                $result = $notification->listNotifications($searchQuery);
            } else {
                $result = $notification->getAllNotifications();
            }

            if (!$result) {
                http_response_code(404);
                echo json_encode(['message' => 'Notification not found']);
            } else {
                echo json_encode($result);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents("php://input"), true);
            if (!isset($data['userId'], $data['token'], $data['message'], $data['type'])) {
                http_response_code(400);
                echo json_encode(['message' => 'Invalid input']);
                break;
            }
            if ($notification->addNotification($data['userId'], $data['token'], $data['message'], $data['type'])) {
                http_response_code(201);
                echo json_encode(['message' => 'Notification created']);
            } else {
                throw new Exception('Failed to create notification');
            }
            break;

        case 'PUT':
            if (!$notificationId) {
                http_response_code(400);
                echo json_encode(['message' => 'Notification ID is required']);
                break;
            }
            $data = json_decode(file_get_contents("php://input"), true);
            if (!isset($data['userId'], $data['token'], $data['message'], $data['type'])) {
                http_response_code(400);
                echo json_encode(['message' => 'Invalid input']);
                break;
            }
            if ($notification->updateNotification($notificationId, $data['userId'], $data['token'], $data['message'], $data['type'])) {
                echo json_encode(['message' => 'Notification updated']);
            } else {
                http_response_code(500);
                echo json_encode(['message' => 'Failed to update notification']);
            }
            break;

        case 'DELETE':
            if (!$notificationId) {
                http_response_code(400);
                echo json_encode(['message' => 'Notification ID is required']);
                break;
            }
            if ($notification->deleteNotification($notificationId)) {
                echo json_encode(['message' => 'Notification deleted']);
            } else {
                throw new Exception('Failed to delete notification');
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
