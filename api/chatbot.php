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

// Cek autentikasi untuk endpoint yang membutuhkan login
$auth = new Auth();
$userId = $auth->getUserId(); // Mendapatkan ID user dari JWT (atau sistem autentikasi lainnya)

// Validasi jika autentikasi gagal
if (!$userId) {
    echo json_encode(['message' => 'Unauthorized']);
    exit();
}

// Mengambil input dari pengguna
$input = json_decode(file_get_contents('php://input'), true);
$userMessage = isset($input['message']) ? $input['message'] : ''; // Pesan yang dikirim oleh pengguna

// Menyiapkan response chatbot
function getProductDetails($productName, $conn)
{
    $stmt = $conn->prepare("SELECT * FROM products WHERE Name LIKE ?");
    $stmt->execute(['%' . $productName . '%']);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($result) {
        return "Product: " . $result['Name'] . "\nDescription: " . $result['Description'] . "\nPrice: $" . $result['Price'] . "\nStock: " . $result['Stock'];
    } else {
        return "Sorry, I couldn't find that product.";
    }
}

function getOrderStatus($orderId, $conn)
{
    $stmt = $conn->prepare("SELECT * FROM orders WHERE OrderID = ?");
    $stmt->execute([$orderId]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($order) {
        return "Order Status: " . $order['OrderStatus'] . "\nPayment Status: " . $order['PaymentStatus'] . "\nTotal: $" . $order['TotalAmount'];
    } else {
        return "Sorry, I couldn't find that order.";
    }
}

function getCategoryDetails($categoryName, $conn)
{
    $stmt = $conn->prepare("SELECT * FROM categories WHERE Name LIKE ?");
    $stmt->execute(['%' . $categoryName . '%']);
    $category = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($category) {
        return "Category: " . $category['Name'] . "\nDescription: " . $category['Description'];
    } else {
        return "Sorry, I couldn't find that category.";
    }
}

// Mengambil respon berdasarkan pesan pengguna
$response = '';
if (strpos(strtolower($userMessage), 'product') !== false) {
    // Pengguna menanyakan tentang produk
    $productName = trim(str_replace("product", "", strtolower($userMessage)));
    $response = getProductDetails($productName, $db);
} elseif (strpos(strtolower($userMessage), 'order') !== false) {
    // Pengguna menanyakan status order
    preg_match('/order\s*(\d+)/i', $userMessage, $matches); // Perbaikan regex untuk order dengan nomor
    if (isset($matches[1])) {
        $orderId = $matches[1];
        $response = getOrderStatus($orderId, $db);
    } else {
        $response = "Sorry, I couldn't find that order.";
    }
} elseif (strpos(strtolower($userMessage), 'category') !== false) {
    // Pengguna menanyakan tentang kategori
    $categoryName = trim(str_replace("category", "", strtolower($userMessage)));
    $response = getCategoryDetails($categoryName, $db);
} else {
    // Respon default jika tidak dapat dipahami
    $response = "I'm sorry, I didn't understand that.";
}

// Mengembalikan response ke pengguna
echo json_encode(['response' => $response]);

?>