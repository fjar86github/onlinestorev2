<?php
class JWT {
    private static $secret_key = "your_secret_key";

    // Encode JWT
    public static function encode($payload) {
        // Header JWT (menggunakan array() untuk kompatibilitas PHP 5.3)
        $header = base64_encode(json_encode(array('typ' => 'JWT', 'alg' => 'HS256')));
        
        // Payload JWT
        $payload = base64_encode(json_encode($payload));
        
        // Membuat signature menggunakan HMAC dengan SHA256
        $signature = hash_hmac('sha256', $header . "." . $payload, self::$secret_key, true);
        
        // Gabungkan header, payload, dan signature menjadi JWT
        return $header . "." . $payload . "." . base64_encode($signature);
    }

    // Decode JWT
    public static function decode($jwt) {
        $parts = explode('.', $jwt); // Pisahkan JWT menjadi tiga bagian
        if (count($parts) === 3) {
            // Decode Header dan Payload menggunakan base64_decode
            $header = json_decode(base64_decode($parts[0]), true);
            $payload = json_decode(base64_decode($parts[1]), true);
            $signature = base64_decode($parts[2]);

            // Validasi signature dengan HMAC menggunakan SHA256
            $valid_signature = hash_hmac('sha256', $parts[0] . "." . $parts[1], self::$secret_key, true);
            if ($signature === $valid_signature) {
                // Jika signature valid, kembalikan payload
                return $payload;
            }
        }
        // Jika format atau signature tidak valid, kembalikan null
        return null;
    }
}

?>
