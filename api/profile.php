<?php
require_once __DIR__ . '/auth.php';
// Instantiate the Auth class
$auth = new Auth();
$payload = $auth->isAuthenticated();
if ($payload) {
    $database = new Database();
    $db = $database->getConnection();

    $query = "SELECT UserID, Name, Email, Role, CreatedAt,PasswordHash FROM users WHERE UserID = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $payload['UserID']);
    $stmt->execute();

    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($user) {
        echo json_encode($user);
    } else {
        echo json_encode(['message' => 'User not found.']);
    }
} else {
    echo json_encode(['message' => 'Unauthorized.']);
}
?>