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

// Check if user is logged in for non-GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET' && !isLoggedIn()) {
    http_response_code(401);
    sendResponse(false, null, 'Unauthorized');
}

try {
    $db = Database::getInstance();
    
    // GET - Retrieve all products or a specific product
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if (isset($_GET['id'])) {
            // Get a specific product
            $product = $db->fetchOne(
                "SELECT * FROM products WHERE id = ?",
                [$_GET['id']]
            );
            
            if (!$product) {
                sendResponse(false, null, 'Product not found');
            }
            
            sendResponse(true, $product, 'Product retrieved successfully');
        } else {
            // Get all products
            $products = $db->fetchAll("SELECT * FROM products ORDER BY id");
            sendResponse(true, $products, 'Products retrieved successfully');
        }
    }
    
    // POST - Create a new product
    else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Get JSON data from request body
        $jsonData = file_get_contents('php://input');
        $data = json_decode($jsonData, true);
        
        if (!$data || !isset($data['name']) || !isset($data['sku'])) {
            sendResponse(false, null, 'Invalid product data');
        }
        
        // Insert new product
        $db->execute(
            "INSERT INTO products (sku, name, category, price, stock_quantity, low_stock_threshold, last_updated) 
             VALUES (?, ?, ?, ?, ?, ?, datetime('now'))",
            [
                $data['sku'],
                $data['name'],
                $data['category'] ?? '',
                $data['price'] ?? 0,
                $data['stock_quantity'] ?? 0,
                $data['low_stock_threshold'] ?? 5
            ]
        );
        
        $newProductId = $db->lastInsertId();
        $newProduct = $db->fetchOne("SELECT * FROM products WHERE id = ?", [$newProductId]);
        
        sendResponse(true, $newProduct, 'Product created successfully');
    }
    
    // PUT - Update a product
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
            sendResponse(false, null, 'Invalid product data');
        }
        
        // Update product
        $db->execute(
            "UPDATE products SET 
             sku = COALESCE(?, sku),
             name = COALESCE(?, name),
             category = COALESCE(?, category),
             price = COALESCE(?, price),
             stock_quantity = COALESCE(?, stock_quantity),
             low_stock_threshold = COALESCE(?, low_stock_threshold),
             last_updated = datetime('now')
             WHERE id = ?",
            [
                $data['sku'] ?? null,
                $data['name'] ?? null,
                $data['category'] ?? null,
                $data['price'] ?? null,
                $data['stock_quantity'] ?? null,
                $data['low_stock_threshold'] ?? null,
                $productId
            ]
        );
        
        $updatedProduct = $db->fetchOne("SELECT * FROM products WHERE id = ?", [$productId]);
        
        sendResponse(true, $updatedProduct, 'Product updated successfully');
    }
    
    // DELETE - Delete a product
    else if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
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
        
        // Delete product
        $db->execute("DELETE FROM products WHERE id = ?", [$productId]);
        
        sendResponse(true, null, 'Product deleted successfully');
    }
    
    // Unsupported method
    else {
        http_response_code(405);
        sendResponse(false, null, 'Method not allowed');
    }
} catch (Exception $e) {
    error_log('Products API error: ' . $e->getMessage());
    sendResponse(false, null, 'An error occurred while processing your request');
}
