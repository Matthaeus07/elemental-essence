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

// Function to verify if user is an admin
function isAdmin() {
    return isLoggedIn() && $_SESSION['role'] === 'admin';
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
    
    // GET - Retrieve all users or a specific user
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Get a specific user
        if (isset($_GET['id'])) {
            // Admin can view any user, non-admin can only view themselves
            if (!isAdmin() && $_GET['id'] != $_SESSION['user_id']) {
                http_response_code(403);
                sendResponse(false, null, 'Forbidden');
            }
            
            $user = $db->fetchOne(
                "SELECT id, username, role, created_at, last_login FROM users WHERE id = ?",
                [$_GET['id']]
            );
            
            if (!$user) {
                sendResponse(false, null, 'User not found');
            }
            
            sendResponse(true, $user, 'User retrieved successfully');
        } 
        // Get all users
        else {
            $users = $db->fetchAll("SELECT id, username, role, created_at, last_login FROM users ORDER BY id");
            sendResponse(true, $users, 'Users retrieved successfully');
        }
    }
    
    // POST - Create a new user (admin only)
    else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Only admin can create users
        if (!isAdmin()) {
            http_response_code(403);
            sendResponse(false, null, 'Forbidden - Only admins can create new users');
        }
        
        // Get JSON data from request body
        $jsonData = file_get_contents('php://input');
        $data = json_decode($jsonData, true);
        
        if (!$data || !isset($data['username']) || !isset($data['password']) || !isset($data['role'])) {
            sendResponse(false, null, 'Invalid user data');
        }
        
        // Check if username already exists
        $existingUser = $db->fetchOne(
            "SELECT id FROM users WHERE username = ?",
            [$data['username']]
        );
        
        if ($existingUser) {
            sendResponse(false, null, 'Username already exists');
        }
        
        // Hash password
        $passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);
        
        // Insert new user
        $db->execute(
            "INSERT INTO users (username, password_hash, role, created_at, last_login) 
             VALUES (?, ?, ?, datetime('now'), NULL)",
            [
                $data['username'],
                $passwordHash,
                $data['role']
            ]
        );
        
        $newUserId = $db->lastInsertId();
        $newUser = $db->fetchOne(
            "SELECT id, username, role, created_at, last_login FROM users WHERE id = ?", 
            [$newUserId]
        );
        
        sendResponse(true, $newUser, 'User created successfully');
    }
    
    // PUT - Update a user
    else if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        // Get user ID from query string
        if (!isset($_GET['id'])) {
            sendResponse(false, null, 'User ID is required');
        }
        
        $userId = $_GET['id'];
        
        // Non-admin users can only edit themselves
        if (!isAdmin() && $userId != $_SESSION['user_id']) {
            http_response_code(403);
            sendResponse(false, null, 'Forbidden - You can only edit your own account');
        }
        
        // Check if user exists
        $user = $db->fetchOne("SELECT * FROM users WHERE id = ?", [$userId]);
        if (!$user) {
            sendResponse(false, null, 'User not found');
        }
        
        // Get JSON data from request body
        $jsonData = file_get_contents('php://input');
        $data = json_decode($jsonData, true);
        
        if (!$data) {
            sendResponse(false, null, 'Invalid user data');
        }
        
        // Setup SQL query
        $sql = "UPDATE users SET ";
        $params = [];
        $updates = [];
        
        // Username update
        if (isset($data['username'])) {
            // Check if new username already exists (if it's different from current username)
            if ($data['username'] !== $user['username']) {
                $existingUser = $db->fetchOne(
                    "SELECT id FROM users WHERE username = ? AND id != ?",
                    [$data['username'], $userId]
                );
                
                if ($existingUser) {
                    sendResponse(false, null, 'Username already exists');
                }
                
                $updates[] = "username = ?";
                $params[] = $data['username'];
            }
        }
        
        // Password update
        if (isset($data['password']) && !empty($data['password'])) {
            $updates[] = "password_hash = ?";
            $params[] = password_hash($data['password'], PASSWORD_DEFAULT);
        }
        
        // Role update (admin only)
        if (isset($data['role'])) {
            // Only admin can change roles
            if (!isAdmin()) {
                sendResponse(false, null, 'Forbidden - Only admins can change user roles');
            }
            
            $updates[] = "role = ?";
            $params[] = $data['role'];
        }
        
        // No updates to make
        if (empty($updates)) {
            sendResponse(true, null, 'No changes to apply');
        }
        
        // Complete the SQL query
        $sql .= implode(", ", $updates) . " WHERE id = ?";
        $params[] = $userId;
        
        // Update the user
        $db->execute($sql, $params);
        
        // Get the updated user
        $updatedUser = $db->fetchOne(
            "SELECT id, username, role, created_at, last_login FROM users WHERE id = ?", 
            [$userId]
        );
        
        // Update session if current user is updated
        if ($userId == $_SESSION['user_id']) {
            $_SESSION['username'] = $updatedUser['username'];
            if (isset($data['role'])) {
                $_SESSION['role'] = $updatedUser['role'];
            }
        }
        
        sendResponse(true, $updatedUser, 'User updated successfully');
    }
    
    // DELETE - Delete a user (admin only)
    else if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        // Only admin can delete users
        if (!isAdmin()) {
            http_response_code(403);
            sendResponse(false, null, 'Forbidden - Only admins can delete users');
        }
        
        // Get user ID from query string
        if (!isset($_GET['id'])) {
            sendResponse(false, null, 'User ID is required');
        }
        
        $userId = $_GET['id'];
        
        // Cannot delete your own account
        if ($userId == $_SESSION['user_id']) {
            sendResponse(false, null, 'Cannot delete your own account');
        }
        
        // Check if user exists
        $user = $db->fetchOne("SELECT * FROM users WHERE id = ?", [$userId]);
        if (!$user) {
            sendResponse(false, null, 'User not found');
        }
        
        // Delete user
        $db->execute("DELETE FROM users WHERE id = ?", [$userId]);
        
        sendResponse(true, null, 'User deleted successfully');
    }
    
    // Unsupported method
    else {
        http_response_code(405);
        sendResponse(false, null, 'Method not allowed');
    }
} catch (Exception $e) {
    error_log('Users API error: ' . $e->getMessage());
    sendResponse(false, null, 'An error occurred while processing your request');
}