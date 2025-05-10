<?php
// Prevent direct access to this file
if (!defined('ELEMENTAL_ESSENCE')) {
    http_response_code(403);
    exit('Direct access forbidden');
}

class Database {
    private static $instance = null;
    private $db = null;
    
    private function __construct() {
        try {
            // Path to SQLite database relative to script location
            $dbPath = dirname(__DIR__) . '/db/elemental_essence.db';
            
            // Check if database file exists
            if (!file_exists($dbPath)) {
                throw new Exception("Database file not found: $dbPath");
            }
            
            // Connect to SQLite database
            $this->db = new PDO("sqlite:$dbPath");
            
            // Set error mode to exceptions
            $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            // Use SQLite's foreign keys
            $this->db->exec('PRAGMA foreign_keys = ON;');
        } catch (PDOException $e) {
            error_log('Database connection error: ' . $e->getMessage());
            throw new Exception('Database connection failed');
        }
    }
    
    // Get database instance (singleton pattern)
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    // Get database connection
    public function getConnection() {
        return $this->db;
    }
    
    // Execute a query and return the result set
    public function query($sql, $params = []) {
        try {
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            error_log('Query error: ' . $e->getMessage() . ' - SQL: ' . $sql);
            throw new Exception('Database query failed');
        }
    }
    
    // Execute a query and return all rows
    public function fetchAll($sql, $params = []) {
        return $this->query($sql, $params)->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Execute a query and return a single row
    public function fetchOne($sql, $params = []) {
        return $this->query($sql, $params)->fetch(PDO::FETCH_ASSOC);
    }
    
    // Execute a query and return the number of affected rows
    public function execute($sql, $params = []) {
        return $this->query($sql, $params)->rowCount();
    }
    
    // Get the last inserted ID
    public function lastInsertId() {
        return $this->db->lastInsertId();
    }
}
