<?php

require_once(dirname(__FILE__) . '/database.php');
require_once(dirname(__FILE__) . '/auth.php');

header("Content-Type: application/json; charset=UTF-8");

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$uriSegments = explode('/', parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
$mode = isset($uriSegments[5]) ? (int) $uriSegments[5] : null;

$searchQuery = isset($_GET['search']) ? htmlspecialchars($_GET['search']) : '';

$auth = new Auth();
$payload = $auth->isAuthenticated();

if (!$payload) {
    http_response_code(401);
    echo json_encode(['message' => 'Unauthorized']);
    exit;
}

class Transaksi
{
    private $conn;

    public function __construct($db)
    {
        $this->conn = $db;
    }

    public function getSales($searchQuery = '')
    {
        $query = "SELECT p.ProductID, p.Name AS ProductName, p.Price, SUM(od.Quantity) AS TotalQuantitySold,
                  SUM(od.Quantity * od.Price) AS TotalSales 
                  FROM products p 
                  JOIN orderdetails od ON p.ProductID = od.ProductID
                  WHERE p.Name LIKE :search 
                  GROUP BY p.ProductID, p.Name 
                  ORDER BY TotalSales DESC;";
        $stmt = $this->conn->prepare($query);
        $searchTerm = "%$searchQuery%";
        $stmt->bindParam(':search', $searchTerm, PDO::PARAM_STR);
        $this->executeStatement($stmt);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getSalesbyCategory($searchQuery = '')
    {
        $query = "SELECT c.CategoryID, c.Name AS CategoryName, SUM(od.Quantity * od.Price) AS TotalCategorySales
                  FROM categories c 
                  JOIN products p ON c.CategoryID = p.CategoryID 
                  JOIN orderdetails od ON p.ProductID = od.ProductID
                  WHERE c.Name LIKE :search 
                  GROUP BY c.CategoryID, c.Name 
                  ORDER BY TotalCategorySales DESC;";
        $stmt = $this->conn->prepare($query);
        $searchTerm = "%$searchQuery%";
        $stmt->bindParam(':search', $searchTerm, PDO::PARAM_STR);
        $this->executeStatement($stmt);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getPotentialRevenue($searchQuery = '')
    {
        $query = "SELECT ProductID, Name AS ProductName, Stock, Price, (Stock * Price) AS PotentialRevenue
                  FROM products 
                  WHERE Name LIKE :search 
                  ORDER BY PotentialRevenue DESC;";
        $stmt = $this->conn->prepare($query);
        $searchTerm = "%$searchQuery%";
        $stmt->bindParam(':search', $searchTerm, PDO::PARAM_STR);
        $this->executeStatement($stmt);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getOrderedUserAll($searchQuery = '')
    {
        $query = "SELECT * FROM transactiondetails 
                  WHERE UserName LIKE :search 
                  ORDER BY UserID ASC;";
        $stmt = $this->conn->prepare($query);
        $searchTerm = "%$searchQuery%";
        $stmt->bindParam(':search', $searchTerm, PDO::PARAM_STR);
        $this->executeStatement($stmt);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getRating($searchQuery = '')
    {
        $query = "SELECT p.ProductID, p.Name AS ProductName, CalculateAverageRating(p.ProductID) AS AverageRating
                  FROM products p WHERE p.Name LIKE :search ORDER BY AverageRating DESC;";
        $stmt = $this->conn->prepare($query);
        $searchTerm = "%$searchQuery%";
        $stmt->bindParam(':search', $searchTerm, PDO::PARAM_STR);
        $this->executeStatement($stmt);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getUserOrderedAmount($searchQuery = '')
    {
        $query = "SELECT o.UserID, SUM(o.TotalAmount) AS TotalSpent, COUNT(o.OrderID) AS TotalOrders
                  FROM orders o 
                  WHERE o.UserID LIKE :search 
                  GROUP BY o.UserID 
                  ORDER BY TotalSpent DESC;";
        $stmt = $this->conn->prepare($query);
        $searchTerm = "%$searchQuery%";
        $stmt->bindParam(':search', $searchTerm, PDO::PARAM_STR);
        $this->executeStatement($stmt);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getUserOrderedCount($searchQuery = '')
    {
        $query = "SELECT o.UserID, u.Name, COUNT(*) AS TotalOrders, SUM(o.TotalAmount) AS TotalSpent
                FROM orders o JOIN users u ON o.UserID = u.UserID GROUP BY o.UserID
                ORDER BY TotalSpent DESC;";
        $stmt = $this->conn->prepare($query);
        $searchTerm = "%$searchQuery%";
        $stmt->bindParam(':search', $searchTerm, PDO::PARAM_STR);
        $this->executeStatement($stmt);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    public function getTotalPenjualan($searchQuery = '')
    {
        $query = "SELECT DATE_FORMAT(o.CreatedAt, '%Y-%m') AS Bulan, SUM(o.TotalAmount) AS TotalPenjualan
                  FROM orders o WHERE Bulan LIKE :search GROUP BY Bulan ORDER BY Bulan DESC;";
        $stmt = $this->conn->prepare($query);
        $searchTerm = "%$searchQuery%";
        $stmt->bindParam(':search', $searchTerm, PDO::PARAM_STR);
        $this->executeStatement($stmt);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    private function executeStatement($stmt)
    {
        try {
            $stmt->execute();
        } catch (PDOException $e) {
            error_log('SQL Error: ' . $e->getMessage());
            throw new Exception('Database query error');
        }
    }
}

$transaksi = new Transaksi($db);

try {
    $result = ['message' => 'Invalid mode specified']; // Default response
    switch ($method) {
        case 'GET':
            if ($mode == 1) {
                $result = $transaksi->getSales($searchQuery);
            } elseif ($mode == 2) {
                $result = $transaksi->getSalesbyCategory($searchQuery);
            } elseif ($mode == 3) {
                $result = $transaksi->getPotentialRevenue($searchQuery);
            } elseif ($mode == 4) {
                $result = $transaksi->getOrderedUserAll($searchQuery);
            } elseif ($mode == 5) {
                $result = $transaksi->getRating($searchQuery);
            } elseif ($mode == 6) {
                $result = $transaksi->getUserOrderedAmount($searchQuery);
            } elseif ($mode == 7) {
                $result = $transaksi->getUserOrderedCount($searchQuery);
            } elseif ($mode == 7) {
                $result = $transaksi->getTotalPenjualan($searchQuery);
            }
            break;
        default:
            http_response_code(405);
            $result = ['message' => 'Method not allowed'];
    }
    echo json_encode($result);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => $e->getMessage()]);
}