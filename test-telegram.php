<?php
/* Prueba de Telegram. Ábrelo en el navegador: http://TU-SITIO/test-telegram.php
   BÓRRALO cuando termines (contiene el token). */
header('Content-Type: text/plain; charset=utf-8');
$token = '9091317443:AAHBNKoNA7J_pa9KM-LVtPQDn3amx_dFdkY';
$chat  = '6285296458';

echo "PHP " . PHP_VERSION . "\n";
echo "curl cargado: " . (function_exists('curl_init') ? 'SI' : 'NO  <-- activa la extension curl en php.ini') . "\n\n";
if (!function_exists('curl_init')) exit;

$ch = curl_init("https://api.telegram.org/bot$token/sendMessage");
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => ['chat_id' => $chat, 'text' => 'Prueba desde Rubicknet ' . date('H:i:s')],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 20,
]);
$resp = curl_exec($ch);
echo "HTTP: " . curl_getinfo($ch, CURLINFO_HTTP_CODE) . "\n";
echo "Error cURL: " . (curl_errno($ch) ? curl_errno($ch) . ' - ' . curl_error($ch) : 'ninguno') . "\n";
echo "Respuesta: " . $resp . "\n";
curl_close($ch);
