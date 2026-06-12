<?php
/**
 * Plugin Name: Pao WPGraphQL Private Content Guard
 * Description: Prevents anonymous WPGraphQL requests from exposing non-public Pao Family posts.
 * Version: 0.1.0
 * Author: Stephen Pao
 */

declare(strict_types=1);

defined('ABSPATH') || exit;

const PAOS_PUBLIC_CATEGORY_SLUGS = ['featured-photo', 'yhpao'];

/**
 * Returns whether this WPGraphQL request came from the trusted Next.js server.
 *
 * Define PAOS_GRAPHQL_SERVER_TOKEN in wp-config.php and set the same value as
 * WORDPRESS_GRAPHQL_AUTH_TOKEN in the Next.js environment.
 */
function paos_graphql_is_trusted_server_request(): bool
{
    if (!defined('PAOS_GRAPHQL_SERVER_TOKEN') || !is_string(PAOS_GRAPHQL_SERVER_TOKEN) || PAOS_GRAPHQL_SERVER_TOKEN === '') {
        return false;
    }

    $provided_token = paos_graphql_get_request_auth_token();

    return is_string($provided_token) && hash_equals(PAOS_GRAPHQL_SERVER_TOKEN, $provided_token);
}

/**
 * Reads the shared token from common PHP server-header locations.
 */
function paos_graphql_get_request_auth_token(): string
{
    $server_header_names = [
        'HTTP_X_PAOS_GRAPHQL_AUTH',
        'REDIRECT_HTTP_X_PAOS_GRAPHQL_AUTH',
    ];

    foreach ($server_header_names as $header_name) {
        if (isset($_SERVER[$header_name]) && is_string($_SERVER[$header_name])) {
            return trim($_SERVER[$header_name]);
        }
    }

    if (function_exists('getallheaders')) {
        $headers = getallheaders();

        if (is_array($headers)) {
            foreach ($headers as $header_name => $header_value) {
                if (strtolower((string) $header_name) === 'x-paos-graphql-auth' && is_string($header_value)) {
                    return trim($header_value);
                }
            }
        }
    }

    return '';
}

/**
 * Returns whether the current request can read a post body through WPGraphQL.
 */
function paos_graphql_can_read_post(int $post_id): bool
{
    if (is_user_logged_in() || paos_graphql_is_trusted_server_request()) {
        return true;
    }

    return has_category(PAOS_PUBLIC_CATEGORY_SLUGS, $post_id);
}

/**
 * Returns public category IDs used by anonymous WPGraphQL queries.
 *
 * @return int[]
 */
function paos_graphql_get_public_category_ids(): array
{
    $category_ids = [];

    foreach (PAOS_PUBLIC_CATEGORY_SLUGS as $category_slug) {
        $category = get_category_by_slug($category_slug);

        if ($category) {
            $category_ids[] = (int) $category->term_id;
        }
    }

    return $category_ids;
}

/**
 * Best-effort extraction for WP_Post and WPGraphQL model objects.
 */
function paos_graphql_get_post_id_from_source($source): ?int
{
    if ($source instanceof WP_Post) {
        return (int) $source->ID;
    }

    if (is_object($source)) {
        if (isset($source->databaseId) && is_numeric($source->databaseId)) {
            return (int) $source->databaseId;
        }

        if (isset($source->ID) && is_numeric($source->ID)) {
            return (int) $source->ID;
        }
    }

    return null;
}

/**
 * Restrict anonymous GraphQL post archive/search connections to the public
 * category. This keeps broad queries from returning private-family archive
 * posts in the first place.
 */
add_filter(
    'graphql_post_object_connection_query_args',
    static function (array $query_args): array {
        if (is_user_logged_in() || paos_graphql_is_trusted_server_request()) {
            return $query_args;
        }

        $post_type = $query_args['post_type'] ?? 'post';
        if (is_array($post_type)) {
            $is_post_query = in_array('post', $post_type, true);
        } else {
            $is_post_query = $post_type === 'post';
        }

        if (!$is_post_query) {
            return $query_args;
        }

        $public_category_ids = paos_graphql_get_public_category_ids();
        if (!$public_category_ids) {
            $query_args['post__in'] = [0];
            return $query_args;
        }

        $query_args['tax_query'] = $query_args['tax_query'] ?? [];
        $query_args['tax_query'][] = [
            'taxonomy' => 'category',
            'field' => 'term_id',
            'terms' => $public_category_ids,
        ];

        return $query_args;
    },
    10,
    1
);

/**
 * Redact sensitive fields if a non-public post is fetched directly by ID, slug,
 * URI, or another resolver that bypasses connection query args.
 */
add_filter(
    'graphql_resolve_field',
    static function ($result, $source, $args, $context, $info, $type_name, $field_key) {
        if (is_user_logged_in() || paos_graphql_is_trusted_server_request() || $type_name !== 'Post') {
            return $result;
        }

        $post_id = paos_graphql_get_post_id_from_source($source);
        if (!$post_id || get_post_type($post_id) !== 'post') {
            return $result;
        }

        if (paos_graphql_can_read_post($post_id)) {
            return $result;
        }

        $redacted_fields = [
            'content',
            'excerpt',
            'featuredImage',
            'comments',
            'commentCount',
            'enclosure',
        ];

        if (in_array((string) $field_key, $redacted_fields, true)) {
            return null;
        }

        return $result;
    },
    10,
    7
);
