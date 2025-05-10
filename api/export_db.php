<?php
// Prevent direct access to this file
if (!defined('ELEMENTAL_ESSENCE')) {
    http_response_code(403);
    exit('Direct access forbidden');
}

// Start session to check authentication
session_start();

// Function to verify if user is logged in
function isLoggedIn() {
    return isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true;
}

// Check if user is logged in
if (!isLoggedIn()) {
    http_response_code(401);
    exit(json_encode(['success' => false, 'message' => 'Unauthorized']));
}

try {
    // Path to database file
    $dbPath = dirname(__DIR__) . '/db/elemental_essence.db';
    
    // Verify the file exists
    if (!file_exists($dbPath)) {
        throw new Exception("Database file not found: $dbPath");
    }
    
    // Set headers for file download
    header('Content-Description: File Transfer');
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="elemental_essence_' . date('Y-m-d') . '.db"');
    header('Expires: 0');
    header('Cache-Control: must-revalidate');
    header('Pragma: public');
    header('Content-Length: ' . filesize($dbPath));
    
    // Clear output buffer to avoid any unwanted output
    ob_clean();
    flush();
    
    // Output file contents
    readfile($dbPath);
    exit;
} catch (Exception $e) {
    error_log('Database export error: ' . $e->getMessage());
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to export database']);
    exit;
}