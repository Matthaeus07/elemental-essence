<?php
// Define constant to prevent direct access to included files
define('ELEMENTAL_ESSENCE', true);

// Get the requested endpoint
$endpoint = $_GET['endpoint'] ?? '';

// Enable error reporting during development (comment out in production)
// error_reporting(E_ALL);
// ini_set('display_errors', 1);

// Handle CORS (if needed)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Route to the appropriate API file
switch ($endpoint) {
    case 'auth':
        require_once 'auth_handler.php';
        break;
        
    case 'products':
        require_once 'products_handler.php';
        break;
        
    case 'inventory':
        require_once 'inventory_handler.php';
        break;
        
    case 'password':
        require_once 'password_handler.php';
        break;
        
    case 'users':
        require_once 'users_handler.php';
        break;
        
    case 'export_db':
        require_once 'export_db.php';
        break;
        
    case 'setup':
        // Only accessible in development
        if ($_SERVER['REMOTE_ADDR'] === '127.0.0.1' || $_SERVER['REMOTE_ADDR'] === '::1') {
            require_once 'db_setup.php';
        } else {
            header('HTTP/1.1 403 Forbidden');
            echo json_encode(['success' => false, 'message' => 'Access denied']);
        }
        break;
        
    default:
        header('HTTP/1.1 404 Not Found');
        echo json_encode(['success' => false, 'message' => 'API endpoint not found']);
}