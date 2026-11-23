#!/bin/sh
set -e

# Generate app key if missing
if [ -z "$APP_KEY" ]; then
    echo "Notice: APP_KEY is empty. Generating one..."
    php artisan key:generate --force || true
fi

# Link storage if not linked
if [ ! -L /var/www/html/public/storage ]; then
    php artisan storage:link || true
fi

# Rediscover packages for production autoload
rm -f /var/www/html/bootstrap/cache/packages.php /var/www/html/bootstrap/cache/services.php || true
php artisan package:discover || true

# Execute CMD
exec "$@"
