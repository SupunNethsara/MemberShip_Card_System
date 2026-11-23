#!/bin/bash
set -e

HOST="${CPANEL_HOST:-49.12.121.200}"
USER="${CPANEL_USER:-lankacham123@lankacham.com}"
PASS="${CPANEL_PASS:-2%$DP;j4%IX)Xe7n}"

echo "Connecting to cPanel at https://${HOST}:2083..."

# 1. Login to cPanel using curl
LOGIN_RESP=$(curl -k -s -c cookies.txt --data-urlencode "user=${USER}" --data-urlencode "pass=${PASS}" "https://${HOST}:2083/login/?login_only=1")

TOKEN=$(echo "$LOGIN_RESP" | grep -o '"security_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "cPanel login failed: $LOGIN_RESP"
    exit 1
fi

echo "Logged in successfully. Token: $TOKEN"

# 2. Upload Frontend Package
echo "Uploading frontend package..."
curl -k -s -b cookies.txt \
    --http1.1 \
    --retry 3 \
    --retry-delay 2 \
    -F "dir=/public_html/portal.lankacham.com" \
    -F "overwrite=1" \
    -F "file-0=@frontend_deploy.zip;filename=frontend_deploy.zip" \
    "https://${HOST}:2083${TOKEN}/execute/Fileman/upload_files" > /dev/null

echo "Frontend uploaded successfully."

# 3. Upload Backend Package
echo "Uploading backend package..."
curl -k -s -b cookies.txt \
    --http1.1 \
    --retry 3 \
    --retry-delay 2 \
    -F "dir=/portal_backend" \
    -F "overwrite=1" \
    -F "file-0=@backend_deploy.zip;filename=backend_deploy.zip" \
    "https://${HOST}:2083${TOKEN}/execute/Fileman/upload_files" > /dev/null

echo "Backend uploaded successfully."

# 4. Extract Frontend Package
echo "Extracting frontend package..."
curl -k -s -b cookies.txt \
    --http1.1 \
    -d "cpanel_jsonapi_module=Fileman&cpanel_jsonapi_func=fileop&cpanel_jsonapi_version=2&op=extract&sourcefiles=/public_html/portal.lankacham.com/frontend_deploy.zip&dest=/public_html/portal.lankacham.com&doubledecode=0" \
    "https://${HOST}:2083${TOKEN}/json-api/cpanel" > /dev/null

# 5. Extract Backend Package
echo "Extracting backend package..."
curl -k -s -b cookies.txt \
    --http1.1 \
    -d "cpanel_jsonapi_module=Fileman&cpanel_jsonapi_func=fileop&cpanel_jsonapi_version=2&op=extract&sourcefiles=/portal_backend/backend_deploy.zip&dest=/portal_backend&doubledecode=0" \
    "https://${HOST}:2083${TOKEN}/json-api/cpanel" > /dev/null

# 6. Cleanup remote zip files
echo "Cleaning up remote deployment archives..."
curl -k -s -b cookies.txt \
    --http1.1 \
    -d "cpanel_jsonapi_module=Fileman&cpanel_jsonapi_func=fileop&cpanel_jsonapi_version=2&op=unlink&sourcefiles=/public_html/portal.lankacham.com/frontend_deploy.zip,/portal_backend/backend_deploy.zip" \
    "https://${HOST}:2083${TOKEN}/json-api/cpanel" > /dev/null

rm -f cookies.txt
echo "Deployment to portal.lankacham.com completed successfully!"
