<?php
require_once __DIR__ . '/database.php';
require_once __DIR__ . '/jwt.php';

class Auth {

    // Method to check if the user is authenticated
    public function isAuthenticated() {
        // Menggunakan getallheaders untuk mengambil header, namun di PHP 5.3, getallheaders() mungkin tidak tersedia.
        // Kita bisa menggunakan apache_request_headers() sebagai pengganti.
        if (function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
        } else {
            $headers = getallheaders();
        }

        if (isset($headers['Authorization'])) {
            $token = str_replace('Bearer ', '', $headers['Authorization']);
            try {
                // Decode the token
                $payload = JWT::decode($token);
                return $payload;  // Returns the decoded payload (usually an array with user info)
            } catch (Exception $e) {
                return false;  // Token is invalid or expired
            }
        }
        return false;  // No Authorization header found
    }

    // Method to check if the authenticated user is an admin
    function isAdmin() {
        $user = $this->isAuthenticated();  // Get the user information from the token

        if ($user) {
            // Cek jika Role adalah Admin
            if (isset($user['Role']) && $user['Role'] === 'Admin') {
                return true;  // The user is an admin
            }
        }

        return false;  // The user is not an admin or not authenticated
    }

    // Method to get the authenticated user's ID
    function getUserId() {
        $user = $this->isAuthenticated(); // Get the user information from the token

        if ($user && isset($user['UserID'])) {  // Menggunakan array syntax karena $user adalah array
            return $user['UserID']; // Return userId if exists
        }

        return null; // Return null if user not authenticated or userId not found
    }
}
?>
