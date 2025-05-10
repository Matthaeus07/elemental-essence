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

// Check if user is logged in
if (!isLoggedIn()) {
    http_response_code(401);
    sendResponse(false, null, 'Unauthorized');
}

// Handle update password request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get JSON data from request body
    $jsonData = file_get_contents('php://input');
    $data = json_decode($jsonData, true);
    
    if (!$data || !isset($data['password']) || empty($data['password'])) {
        sendResponse(false, null, 'Passwort darf nicht leer sein');
    }
    
    $newPassword = $data['password'];
    $userId = $_SESSION['user_id'];
    
    try {
        $db = Database::getInstance();
        
        // Generate password hash
        $passwordHash = password_hash($newPassword, PASSWORD_DEFAULT);
        
        // Update user password
        $updated = $db->execute(
            "UPDATE users SET password_hash = ? WHERE id = ?",
            [$passwordHash, $userId]
        );
        
        if ($updated) {
            sendResponse(true, null, 'Passwort wurde erfolgreich aktualisiert');
        } else {
            sendResponse(false, null, 'Fehler beim Aktualisieren des Passworts');
        }
    } catch (Exception $e) {
        error_log('Password update error: ' . $e->getMessage());
        sendResponse(false, null, 'Ein Fehler ist beim Aktualisieren des Passworts aufgetreten');
    }
} else {
    http_response_code(405);
    sendResponse(false, null, 'Method not allowed');
}