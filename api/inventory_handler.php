<?php
// Prevent direct access to this file
if (!defined('ELEMENTAL_ESSENCE')) {
    http_response_code(403);
    exit('Direct access forbidden');
}

// Set content type to JSON
header('Content-Type: application/json');

// Include database connection
require_once 'db.php';

// Start session to check authentication
session_start();

// Function to verify if user is logged in
function isLoggedIn() {
    return isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true;
}

// Function to generate a safe response
function sendResponse($success, $data = null, $message = '') {
    echo json_encode([
        'success' => $success,
        'data' => $data,
        'message' => $message
    ]);
    exit;
}

// Check if user is logged in for all requests
if (!isLoggedIn()) {
    http_response_code(401);
    sendResponse(false, null, 'Unauthorized');
}

try {
    $db = Database::getInstance();
    
    // GET - Retrieve inventory data
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Dashboard data - aggregated inventory info
        if (isset($_GET['dashboard'])) {
            // Get dashboard data
            $response = [];
            
            // Total number of products
            $totalProducts = $db->fetchOne("SELECT COUNT(*) as count FROM products");
            $response['totalProducts'] = $totalProducts['count'];
            
            // Total stock quantity
            $totalStock = $db->fetchOne("SELECT SUM(stock_quantity) as total FROM products");
            $response['totalStock'] = $totalStock['total'] ?? 0;
            
            // Products with low stock (above 0 but below threshold)
            $lowStock = $db->fetchAll(
                "SELECT * FROM products WHERE stock_quantity > 0 AND stock_quantity <= low_stock_threshold"
            );
            $response['lowStock'] = count($lowStock);
            $response['lowStockItems'] = $lowStock;
            
            // Out of stock products
            $outOfStock = $db->fetchAll("SELECT * FROM products WHERE stock_quantity = 0");
            $response['outOfStock'] = count($outOfStock);
            $response['outOfStockItems'] = $outOfStock;
            
            sendResponse(true, $response, 'Dashboard data retrieved successfully');
        }
        // Get all inventory data
        else {
            $products = $db->fetchAll("SELECT * FROM products ORDER BY id");
            sendResponse(true, $products, 'Inventory data retrieved successfully');
        }
    }
    
    // PUT - Update inventory (stock quantity and/or low stock threshold)
    else if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        // Get product ID from query string
        if (!isset($_GET['id'])) {
            sendResponse(false, null, 'Product ID is required');
        }
        
        $productId = $_GET['id'];
        
        // Check if product exists
        $product = $db->fetchOne("SELECT * FROM products WHERE id = ?", [$productId]);
        if (!$product) {
            sendResponse(false, null, 'Product not found');
        }
        
        // Get JSON data from request body
        $jsonData = file_get_contents('php://input');
        $data = json_decode($jsonData, true);
        
        if (!$data) {
            sendResponse(false, null, 'Invalid request data');
        }
        
        // Make sure at least one parameter is being updated
        if (!isset($data['stock_quantity']) && !isset($data['low_stock_threshold'])) {
            sendResponse(false, null, 'No update parameters provided');
        }
        
        // Set up the SQL query and parameters based on what's being updated
        $sql = "UPDATE products SET last_updated = datetime('now')";
        $params = [];
        
        if (isset($data['stock_quantity'])) {
            $sql .= ", stock_quantity = ?";
            $params[] = $data['stock_quantity'];
        }
        
        if (isset($data['low_stock_threshold'])) {
            $sql .= ", low_stock_threshold = ?";
            $params[] = $data['low_stock_threshold'];
        }
        
        $sql .= " WHERE id = ?";
        $params[] = $productId;
        
        // Update the product
        $db->execute($sql, $params);
        
        // Get the updated product
        $updatedProduct = $db->fetchOne("SELECT * FROM products WHERE id = ?", [$productId]);
        
        sendResponse(true, $updatedProduct, 'Product inventory updated successfully');
    }
    
    // Unsupported method
    else {
        http_response_code(405);
        sendResponse(false, null, 'Method not allowed');
    }
} catch (Exception $e) {
    error_log('Inventory API error: ' . $e->getMessage());
    sendResponse(false, null, 'An error occurred while processing your request');
}