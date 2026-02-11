<?php
declare(strict_types=1);

const GMS_RECIPIENT_EMAIL = 'pilgrimbird@gmail.com';
const GMS_FROM_EMAIL = 'no-reply@goodmindsociety.org';

function ensure_session(): void {
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }
}

function json_response(bool $ok, string $error = '', int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=UTF-8');
    if ($ok) {
        echo json_encode(['ok' => true]);
        return;
    }
    echo json_encode(['ok' => false, 'error' => $error]);
}

function clean_header(string $value): string {
    return trim(str_replace(["\r", "\n"], '', $value));
}

function sanitize_text(string $value): string {
    return trim(strip_tags($value));
}

function sanitize_email(string $value): string {
    return trim(filter_var($value, FILTER_SANITIZE_EMAIL));
}

function is_rate_limited(string $key, int $limit = 5, int $windowSeconds = 300): bool {
    ensure_session();
    if (!isset($_SESSION['rate'])) {
        $_SESSION['rate'] = [];
    }
    if (!isset($_SESSION['rate'][$key])) {
        $_SESSION['rate'][$key] = [];
    }
    $now = time();
    $recent = array_filter($_SESSION['rate'][$key], function ($timestamp) use ($now, $windowSeconds) {
        return ($now - $timestamp) < $windowSeconds;
    });
    $_SESSION['rate'][$key] = $recent;
    if (count($recent) >= $limit) {
        return true;
    }
    $_SESSION['rate'][$key][] = $now;
    return false;
}

function handle_form(string $subjectPrefix, string $rateKey): void {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        json_response(false, 'method_not_allowed', 405);
        return;
    }

    ensure_session();

    $honeypot = $_POST['website'] ?? '';
    if (!empty($honeypot)) {
        json_response(false, 'spam', 400);
        return;
    }

    if (is_rate_limited($rateKey)) {
        json_response(false, 'rate_limited', 429);
        return;
    }

    $name = sanitize_text((string)($_POST['name'] ?? ''));
    $email = sanitize_email((string)($_POST['email'] ?? ''));
    $message = sanitize_text((string)($_POST['message'] ?? ''));

    if ($name === '' || $email === '' || $message === '') {
        json_response(false, 'missing_fields', 400);
        return;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        json_response(false, 'invalid_email', 400);
        return;
    }

    $subject = clean_header($subjectPrefix) . ' form submission';
    $safeEmail = clean_header($email);
    $body = "Name: {$name}\n";
    $body .= "Email: {$safeEmail}\n";
    $body .= "Message:\n{$message}\n\n";
    $body .= "IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . "\n";
    $body .= "User Agent: " . ($_SERVER['HTTP_USER_AGENT'] ?? 'unknown') . "\n";

    $headers = [
        'From: GoodMind Society <' . GMS_FROM_EMAIL . '>',
        'Reply-To: ' . $safeEmail,
        'Content-Type: text/plain; charset=UTF-8'
    ];

    $sent = mail(GMS_RECIPIENT_EMAIL, $subject, $body, implode("\r\n", $headers));

    if (!$sent) {
        json_response(false, 'send_failed', 500);
        return;
    }

    json_response(true);
}
