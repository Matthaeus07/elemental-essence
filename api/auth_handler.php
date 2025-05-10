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

// Start or resume session
session_start();

// Function to generate a safe response
function sendResponse($success, $data = null, $message = '') {
    echo json_encode([
        'success' => $success,
        'data' => $data,
        'message' => $message
    ]);
    exit;
}

// Handle login request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get JSON data from request body
    $jsonData = file_get_contents('php://input');
    $data = json_decode($jsonData, true);
    
    if (!$data || !isset($data['username']) || !isset($data['password'])) {
        sendResponse(false, null, 'Invalid request data');
    }
    
    $username = $data['username'];
    $password = $data['password'];
    
    try {
        $db = Database::getInstance();
        
        // Get user from database
        $user = $db->fetchOne(
            "SELECT id, username, password_hash, role FROM users WHERE username = ?",
            [$username]
        );
        
        if (!$user) {
            // Avoid timing attacks by still verifying a password
            password_verify($password, '$2y$10$invalidhashinvalidhashinvalidhashaa');
            sendResponse(false, null, 'Invalid credentials');
        }
        
        // Verify password
        if (password_verify($password, $user['password_hash'])) {
            // Update last login timestamp
            $db->execute(
                "UPDATE users SET last_login = datetime('now') WHERE id = ?",
                [$user['id']]
            );
            
            // Set session data
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['role'] = $user['role'];
            $_SESSION['logged_in'] = true;
            
            // Send success response (exclude password_hash)
            unset($user['password_hash']);
            sendResponse(true, $user, 'Login successful');
        } else {
            sendResponse(false, null, 'Invalid credentials');
        }
    } catch (Exception $e) {
        error_log('Login error: ' . $e->getMessage());
        sendResponse(false, null, 'An error occurred during login');
    }
} 
// Handle check auth status
else if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true) {
        sendResponse(true, [
            'id' => $_SESSION['user_id'],
            'username' => $_SESSION['username'],
            'role' => $_SESSION['role']
        ], 'User is logged in');
    } else {
        sendResponse(false, null, 'User is not logged in');
    }
}
// Handle logout
else if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    // Destroy session
    session_unset();
    session_destroy();
    sendResponse(true, null, 'Logout successful');
} else {
    sendResponse(false, null, 'Invalid request method');
}
