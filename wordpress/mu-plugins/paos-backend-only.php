<?php
/**
 * Plugin Name: Pao Backend Only Guard
 * Description: Redirects WordPress frontend browsing on api.paos.us back to the Next.js frontend while allowing backend, API, and media routes.
 * Version: 0.1.0
 * Author: Stephen Pao
 */

declare(strict_types=1);

defined('ABSPATH') || exit;

const PAOS_FRONTEND_URL = 'https://paos.us';
const PAOS_BACKEND_HOST = 'api.paos.us';

add_action('plugins_loaded', 'paos_backend_only_redirect_anonymous_frontend_request', 0);

function paos_backend_only_redirect_anonymous_frontend_request(): void
{
    $host = $_SERVER['HTTP_HOST'] ?? '';
    $host = strtolower(preg_replace('/:\d+$/', '', (string) $host));

    if ($host !== PAOS_BACKEND_HOST) {
        return;
    }

    $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    $normalized_path = rtrim($path, '/') ?: '/';

    $account_route = paos_backend_only_get_account_route_redirect($normalized_path);
    if ($account_route) {
        header('Location: ' . paos_backend_only_build_backend_url($account_route), true, 302);
        exit;
    }

    $allowed_prefixes = [
        '/graphql',
        '/wp-json',
        '/wp-content/uploads',
        '/wp-login.php',
        '/wp-admin',
        '/wp-cron.php',
    ];

    foreach ($allowed_prefixes as $prefix) {
        if (str_starts_with($path, $prefix)) {
            return;
        }
    }

    header('Location: ' . PAOS_FRONTEND_URL . $path, true, 301);
    exit;
}

function paos_backend_only_get_account_route_redirect(string $path): ?string
{
    $routes = [
        '/login' => '/wp-login.php',
        '/logout' => '/wp-login.php?action=logout',
        '/lostpassword' => '/wp-login.php?action=lostpassword',
        '/register' => '/wp-login.php?action=register',
        '/resetpass' => '/wp-login.php?action=rp',
    ];

    return $routes[$path] ?? null;
}

function paos_backend_only_build_backend_url(string $path): string
{
    $url = 'https://' . PAOS_BACKEND_HOST . $path;
    $query = $_SERVER['QUERY_STRING'] ?? '';

    if ($query !== '') {
        $separator = str_contains($url, '?') ? '&' : '?';
        $url .= $separator . $query;
    }

    return $url;
}
