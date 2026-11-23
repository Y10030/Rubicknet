<?php
/* Rubicknet · recibe los formularios de contratar.html y contratar-camaras.html
   y los envía por correo a informes@rubicknet.com (con los archivos adjuntos).
   No guarda archivos en el servidor. */
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

const DESTINO   = 'pruebaspaginawebrubicknet@gmail.com'; // PRUEBAS: cambiar a informes@rubicknet.com al publicar
const REMITENTE = 'web@rubicknet.com';          // debe ser un correo de tu propio dominio
const MAX_BYTES = 4 * 1024 * 1024;
const PERMITIDOS = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'application/pdf' => 'pdf'];

if (!function_exists('mb_substr')) { function mb_substr($s, $a, $l = null) { return substr($s, $a, $l); } }

function detectar_mime($ruta) {
    $b = (string) @file_get_contents($ruta, false, null, 0, 12);
    if (substr($b, 0, 3) === "\xFF\xD8\xFF") return 'image/jpeg';
    if (substr($b, 0, 4) === "\x89PNG") return 'image/png';
    if (substr($b, 0, 4) === 'RIFF' && substr($b, 8, 4) === 'WEBP') return 'image/webp';
    if (substr($b, 0, 4) === '%PDF') return 'application/pdf';
    return '';
}

function responder($ok, $mensaje, $codigo = 200) {
    http_response_code($codigo);
    echo json_encode(['ok' => $ok, 'mensaje' => $mensaje], JSON_UNESCAPED_UNICODE);
    exit;
}
function una_linea($v, $max = 200) {
    $v = is_string($v) ? $v : '';
    return mb_substr(trim(preg_replace('/\s+/u', ' ', $v)), 0, $max);
}
function varias_lineas($v, $max = 600) {
    $v = is_string($v) ? $v : '';
    return mb_substr(trim(str_replace("\r", '', $v)), 0, $max);
}
function archivos($clave) {
    $salida = [];
    if (empty($_FILES[$clave])) return $salida;
    $f = $_FILES[$clave];
    if (!is_array($f['name'])) { foreach (array_keys($f) as $k) $f[$k] = [$f[$k]]; }
    foreach ($f['name'] as $i => $n) {
        if ($f['error'][$i] === UPLOAD_ERR_NO_FILE) continue;
        $salida[] = ['tmp' => $f['tmp_name'][$i], 'err' => $f['error'][$i], 'size' => $f['size'][$i]];
    }
    return $salida;
}
function validar_archivos($lista, $etiqueta, $solo_imagen = false) {
    $ok = [];
    foreach ($lista as $a) {
        if ($a['err'] !== UPLOAD_ERR_OK || $a['size'] > MAX_BYTES || !is_uploaded_file($a['tmp'])) {
            responder(false, "No pudimos recibir el archivo de $etiqueta. Revisa que pese menos de 4 MB.", 422);
        }
        $mime = detectar_mime($a['tmp']);
        if (!isset(PERMITIDOS[$mime]) || ($solo_imagen && $mime === 'application/pdf')) {
            responder(false, $solo_imagen ? "El archivo de $etiqueta debe ser una imagen JPG, PNG o WEBP." : "El archivo de $etiqueta debe ser JPG, PNG, WEBP o PDF.", 422);
        }
        $ok[] = ['tmp' => $a['tmp'], 'mime' => $mime, 'ext' => PERMITIDOS[$mime]];
    }
    return $ok;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') responder(false, 'Método no permitido.', 405);
if (!empty($_POST['sitio_web'])) responder(true, 'Gracias.'); // trampa para bots

$formulario = (($_POST['formulario'] ?? '') === 'camaras') ? 'camaras' : 'internet';
$nombre   = una_linea($_POST['nombre'] ?? '', 120);
$telefono = una_linea($_POST['telefono'] ?? '', 30);
$correo   = una_linea($_POST['correo'] ?? '', 120);

if ($nombre === '' || strlen(preg_replace('/\D/', '', $telefono)) < 10) responder(false, 'Revisa tu nombre y tu teléfono (10 dígitos).', 422);
if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) responder(false, 'Revisa tu correo electrónico.', 422);
if (empty($_POST['acepto_privacidad'])) responder(false, 'Debes aceptar el aviso de privacidad.', 422);

$adjuntos = [];
if ($formulario === 'internet') {
    $direccion = varias_lineas($_POST['direccion'] ?? '', 400);
    $azotea    = una_linea($_POST['azotea'] ?? '', 30);
    $paquete   = una_linea($_POST['paquete'] ?? '', 5);
    if ($direccion === '') responder(false, 'Escribe la dirección de instalación.', 422);
    if (!in_array($paquete, ['30', '40', '50'], true)) responder(false, 'Elige un paquete.', 422);
    if (!in_array($azotea, ['Sí', 'No', 'No estoy seguro'], true)) responder(false, 'Indica si cuentas con acceso a azotea.', 422);
    if (empty($_POST['acepto_pagare'])) responder(false, 'Debes aceptar firmar el pagaré por el préstamo del equipo.', 422);

    /* Ubicación: pin del mapa (lat/lng) o, si el mapa no cargó, enlace de Google Maps */
    $lat = $_POST['lat'] ?? ''; $lng = $_POST['lng'] ?? '';
    $link = una_linea($_POST['ubicacion_link'] ?? '', 300);
    if (is_numeric($lat) && is_numeric($lng) && abs((float)$lat) <= 90 && abs((float)$lng) <= 180) {
        $link = 'https://www.google.com/maps?q=' . round((float)$lat, 6) . ',' . round((float)$lng, 6);
    } elseif (!preg_match('#^https?://#i', $link)) {
        responder(false, 'Marca tu ubicación en el mapa.', 422);
    }

    $frente  = validar_archivos(archivos('ine_frente'), 'el frente de tu INE', true);
    $reverso = validar_archivos(archivos('ine_reverso'), 'el reverso de tu INE', true);
    $comp    = validar_archivos(archivos('comprobante'), 'tu comprobante de domicilio');
    if (count($frente) !== 1 || count($reverso) !== 1 || count($comp) !== 1) {
        responder(false, 'Adjunta el frente y el reverso de tu INE y tu comprobante de domicilio.', 422);
    }
    $adjuntos[] = $frente[0]  + ['nombre' => 'INE-frente.' . $frente[0]['ext']];
    $adjuntos[] = $reverso[0] + ['nombre' => 'INE-reverso.' . $reverso[0]['ext']];
    $adjuntos[] = $comp[0]    + ['nombre' => 'Comprobante-domicilio.' . $comp[0]['ext']];

    $asunto = "Nueva contratación de internet: $paquete Mbps - $nombre";
    $texto  = "NUEVA SOLICITUD DE CONTRATACIÓN DE INTERNET\n\n"
            . "Paquete: $paquete Mbps\nNombre: $nombre\nTeléfono: $telefono\nCorreo: $correo\n"
            . "Dirección: $direccion\nUbicación (mapa): " . $link . "\n"
            . "Acceso a azotea: $azotea\n"
            . "Acepta firmar pagaré por préstamo de equipo: Sí\nAcepta aviso de privacidad: Sí\n"
            . "\nArchivos adjuntos: " . count($adjuntos) . "\n";
} else {
    $tipo = una_linea($_POST['tipo'] ?? '', 20);
    $servicios = $_POST['servicio'] ?? [];
    $servicios = array_map(function ($s) { return una_linea($s, 80); }, is_array($servicios) ? array_slice($servicios, 0, 5) : []);
    if (!in_array($tipo, ['Casa', 'Empresa'], true) || !$servicios) responder(false, 'Elige el tipo de lugar y al menos un servicio.', 422);
    $asunto = "Cotización de cámaras/automatización ($tipo) - $nombre";
    $texto  = "SOLICITUD DE CÁMARAS Y AUTOMATIZACIÓN\n\nPara: $tipo\nInterés: " . implode(', ', $servicios)
            . "\nNombre: $nombre\nTeléfono: $telefono\nCorreo: $correo\n"
            . "Colonia / C.P.: " . una_linea($_POST['colonia'] ?? '', 120) . "\n"
            . "Mensaje: " . varias_lineas($_POST['mensaje'] ?? '', 600) . "\nAcepta aviso de privacidad: Sí\n";
}

$limite = 'rbk_' . md5(uniqid('', true));
$cabeceras  = 'From: Rubicknet Web <' . REMITENTE . ">\r\nReply-To: $correo\r\nMIME-Version: 1.0\r\n";
$cabeceras .= "Content-Type: multipart/mixed; boundary=\"$limite\"\r\n";
$cuerpo  = "--$limite\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n$texto\r\n";
foreach ($adjuntos as $a) {
    $cuerpo .= "--$limite\r\nContent-Type: {$a['mime']}; name=\"{$a['nombre']}\"\r\nContent-Transfer-Encoding: base64\r\n"
             . "Content-Disposition: attachment; filename=\"{$a['nombre']}\"\r\n\r\n"
             . chunk_split(base64_encode(file_get_contents($a['tmp']))) . "\r\n";
}
$cuerpo .= "--$limite--";

/* Modo prueba: en tu computadora (localhost) no se envía correo; se guarda un .eml en la carpeta correos-prueba */
if (in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1'], true)) {
    $carpeta = __DIR__ . '/correos-prueba';
    if (!is_dir($carpeta)) @mkdir($carpeta, 0755, true);
    $eml = 'To: ' . DESTINO . "\r\nSubject: =?UTF-8?B?" . base64_encode($asunto) . "?=\r\n" . $cabeceras . "\r\n" . $cuerpo;
    file_put_contents($carpeta . '/' . date('Ymd-His') . '-' . $formulario . '.eml', $eml);
    responder(true, 'Solicitud recibida (modo prueba local).');
}

$enviado = mail(DESTINO, '=?UTF-8?B?' . base64_encode($asunto) . '?=', $cuerpo, $cabeceras);
if (!$enviado) responder(false, 'No pudimos enviar tu solicitud. Inténtalo de nuevo o escríbenos por WhatsApp.', 500);
responder(true, 'Solicitud recibida.');
