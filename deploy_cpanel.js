const fs = require('fs');
const https = require('https');
const http = require('http');
const qs = require('querystring');

const host = (process.env.CPANEL_HOST || '49.12.121.200').trim();

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    options.rejectUnauthorized = false;
    options.timeout = options.timeout || 30000; // 30 seconds default

    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({
        statusCode: res.statusCode,
        headers: res.headers,
        body
      }));
    });

    req.on('timeout', () => {
      req.destroy(new Error('Request timed out'));
    });

    req.on('error', reject);

    if (data) {
      req.write(data);
    }
    req.end();
  });
}

async function loginToCpanel() {
  const defaultUser = 'lankacham123@lankacham.com';
  // Use exact character code for $ so bash/PowerShell variable expansion cannot corrupt it
  const defaultPass = '2%' + String.fromCharCode(36) + 'DP;j4%IX)Xe7n';

  const candidates = [];

  // If environment passed valid credentials, check for bash variable corruption (where $DP evaluates to empty)
  if (process.env.CPANEL_USER && process.env.CPANEL_PASS) {
    const envUser = process.env.CPANEL_USER.trim();
    let envPass = process.env.CPANEL_PASS.trim();

    // Detect if bash stripped $DP from '2%$DP;j4%IX)Xe7n' resulting in '2%;j4%IX)Xe7n'
    if (envPass.includes('2%;j4%')) {
      console.warn('Notice: Detected bash variable expansion stripping $DP from CPANEL_PASS. Restoring dollar sign.');
      envPass = defaultPass;
    }

    candidates.push({ user: envUser, pass: envPass, source: 'Environment Credentials' });
  }

  // Always include verified cPanel credentials as reliable fallback
  candidates.push({ user: defaultUser, pass: defaultPass, source: 'Verified Default Credentials' });

  for (let i = 0; i < candidates.length; i++) {
    const cred = candidates[i];
    console.log(`[Attempt ${i + 1}/${candidates.length}] Authenticating with cPanel at https://${host}:2083 (${cred.source})...`);
    const loginData = qs.stringify({ user: cred.user, pass: cred.pass });

    try {
      const res = await request({
        hostname: host,
        port: 2083,
        path: '/login/?login_only=1',
        method: 'POST',
        timeout: 15000,
        headers: {
          'Host': `${host}:2083`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(loginData)
        }
      }, loginData);

      let token = '';
      try {
        const parsed = JSON.parse(res.body);
        if (parsed.status === 1 && parsed.security_token) {
          token = parsed.security_token;
        }
      } catch (e) {}

      if (!token) {
        const match = res.body.match(/"security_token":"([^"]+)"/);
        if (match) token = match[1];
      }

      if (token) {
        const cookies = (res.headers['set-cookie'] || [])
          .map(c => c.split(';')[0].trim())
          .filter(Boolean)
          .join('; ');

        console.log(`Authenticated successfully as ${cred.user}! Token: ${token}`);
        return { token, cookies };
      }

      console.warn(`Login attempt with ${cred.source} returned: ${res.body.substring(0, 150)}`);
    } catch (err) {
      console.warn(`Connection error during login (${cred.source}): ${err.message || err}`);
    }

    if (i < candidates.length - 1) {
      await sleep(1500);
    }
  }

  throw new Error('All authentication attempts failed. Verify cPanel credentials.');
}

async function uploadFile(token, cookies, remoteDir, localFilePath, fileName, maxRetries = 3) {
  if (!fs.existsSync(localFilePath)) {
    throw new Error(`Local file not found: ${localFilePath}`);
  }

  const fileData = fs.readFileSync(localFilePath);
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2) + Date.now().toString(36);

  const prefix = Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="dir"\r\n\r\n` +
    `${remoteDir}\r\n` +
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="overwrite"\r\n\r\n` +
    `1\r\n` +
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file-0"; filename="${fileName}"\r\n` +
    `Content-Type: application/zip\r\n\r\n`
  );

  const suffix = Buffer.from(`\r\n--${boundary}--\r\n`);
  const fullBody = Buffer.concat([prefix, fileData, suffix]);

  console.log(`Uploading ${fileName} (${(fullBody.length / 1024 / 1024).toFixed(2)} MB) to ${remoteDir}...`);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await new Promise((resolve, reject) => {
        const req = https.request({
          hostname: host,
          port: 2083,
          path: `${token}/execute/Fileman/upload_files`,
          method: 'POST',
          rejectUnauthorized: false,
          timeout: 240000,
          headers: {
            'Host': `${host}:2083`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Cookie': cookies,
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': fullBody.length,
            'Accept': 'application/json, text/javascript, */*; q=0.01'
          }
        }, res => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => resolve({ statusCode: res.statusCode, body }));
        });

        req.on('timeout', () => {
          req.destroy(new Error('Upload request timed out'));
        });

        req.on('error', reject);
        req.write(fullBody);
        req.end();
      });

      if (res.statusCode !== 200) {
        throw new Error(`Upload returned status ${res.statusCode}: ${res.body.substring(0, 200)}`);
      }

      console.log(`Upload of ${fileName} succeeded! Response: ${res.body.substring(0, 160)}...`);
      return res;
    } catch (err) {
      console.error(`[Attempt ${attempt}/${maxRetries}] Upload of ${fileName} failed:`, err.message || err);
      if (attempt < maxRetries) {
        console.log(`Waiting 4 seconds before retrying upload...`);
        await sleep(4000);
      } else {
        throw err;
      }
    }
  }
}

async function extractArchive(token, cookies, sourceZipPath, destDir, maxRetries = 3) {
  const relSource = sourceZipPath.replace(/^\/+/, '');
  const targetDest = destDir.startsWith('/') ? destDir : `/${destDir}`;
  console.log(`Extracting ${relSource} into ${targetDest}...`);
  const postData = qs.stringify({
    cpanel_jsonapi_module: 'Fileman',
    cpanel_jsonapi_func: 'fileop',
    cpanel_jsonapi_version: '2',
    op: 'extract',
    sourcefiles: relSource,
    destfiles: targetDest,
    dest: targetDest,
    doubledecode: '0'
  });

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await request({
        hostname: host,
        port: 2083,
        path: `${token}/json-api/cpanel`,
        method: 'POST',
        headers: {
          'Host': `${host}:2083`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Cookie': cookies,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, postData);

      let output = '';
      try {
        const parsed = JSON.parse(res.body);
        if (parsed.cpanelresult && parsed.cpanelresult.data && parsed.cpanelresult.data[0]) {
          output = parsed.cpanelresult.data[0].output || '';
        }
      } catch (e) {}
      console.log(`Extract completed (Status: ${res.statusCode}). Output preview: ${output.split('\n')[0]}`);
      return res;
    } catch (err) {
      console.error(`[Attempt ${attempt}/${maxRetries}] Extract failed:`, err.message || err);
      if (attempt < maxRetries) {
        await sleep(3000);
      } else {
        throw err;
      }
    }
  }
}

async function cleanupArchives(token, cookies, fileList) {
  const relFiles = fileList.split(',').map(f => f.trim().replace(/^\/+/, '')).join(',');
  console.log(`Cleaning up remote archives: ${relFiles}...`);
  const postData = qs.stringify({
    cpanel_jsonapi_module: 'Fileman',
    cpanel_jsonapi_func: 'fileop',
    cpanel_jsonapi_version: '2',
    op: 'unlink',
    sourcefiles: relFiles
  });

  try {
    const res = await request({
      hostname: host,
      port: 2083,
      path: `${token}/json-api/cpanel`,
      method: 'POST',
      headers: {
        'Host': `${host}:2083`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cookie': cookies,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, postData);
    console.log(`Cleanup completed.`);
    return res;
  } catch (err) {
    console.warn(`Warning: Archive cleanup failed (non-critical):`, err.message || err);
  }
}

async function runRemoteMigrations(token, cookies) {
  console.log('Checking and running any pending database migrations...');
  const secretKey = 'mig_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  const runnerContent = `<?php
if (empty($_GET['key']) || $_GET['key'] !== '${secretKey}') {
    http_response_code(403);
    exit('Forbidden');
}
define('LARAVEL_START', microtime(true));
require '/home/lankacha/portal_backend/vendor/autoload.php';
$app = require_once '/home/lankacha/portal_backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\\Contracts\\Console\\Kernel::class);
$kernel->bootstrap();

use Illuminate\\Support\\Facades\\Artisan;
Artisan::call('migrate', ['--force' => true]);
echo Artisan::output();
`;

  try {
    const saveData = qs.stringify({
      dir: '/public_html/portal.lankacham.com',
      file: 'migrate_auto.php',
      content: runnerContent
    });

    await request({
      hostname: host,
      port: 2083,
      path: `${token}/execute/Fileman/save_file_content`,
      method: 'POST',
      headers: {
        'Host': `${host}:2083`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cookie': cookies,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(saveData)
      }
    }, saveData);

    const migRes = await new Promise((resolve) => {
      http.get(`http://portal.lankacham.com/migrate_auto.php?key=${secretKey}`, res => {
        let b = '';
        res.on('data', d => b += d);
        res.on('end', () => resolve({ status: res.statusCode, body: b.trim() }));
      }).on('error', err => resolve({ status: 500, body: err.message }));
    });

    console.log(`Migration result (${migRes.status}):\n${migRes.body || 'Nothing to migrate.'}`);
  } catch (err) {
    console.warn('Warning: Automated migration check failed:', err.message || err);
  } finally {
    try {
      const cleanData = qs.stringify({
        cpanel_jsonapi_module: 'Fileman',
        cpanel_jsonapi_func: 'fileop',
        cpanel_jsonapi_version: '2',
        op: 'unlink',
        sourcefiles: 'public_html/portal.lankacham.com/migrate_auto.php'
      });
      await request({
        hostname: host,
        port: 2083,
        path: `${token}/json-api/cpanel`,
        method: 'POST',
        headers: {
          'Host': `${host}:2083`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Cookie': cookies,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(cleanData)
        }
      }, cleanData);
    } catch (e) {}
  }
}

async function run() {
  console.log('=== Starting Automated cPanel Deployment for portal.lankacham.com ===');
  const { token, cookies } = await loginToCpanel();

  // 1. Upload Frontend ZIP
  if (fs.existsSync('frontend_deploy.zip')) {
    await uploadFile(token, cookies, '/public_html/portal.lankacham.com', 'frontend_deploy.zip', 'frontend_deploy.zip');
    await extractArchive(token, cookies, '/public_html/portal.lankacham.com/frontend_deploy.zip', '/public_html/portal.lankacham.com');
  } else {
    console.log('Skipping frontend deploy: frontend_deploy.zip not found.');
  }

  // 2. Upload Backend ZIP
  if (fs.existsSync('backend_deploy.zip')) {
    await uploadFile(token, cookies, '/portal_backend', 'backend_deploy.zip', 'backend_deploy.zip');
    await extractArchive(token, cookies, '/portal_backend/backend_deploy.zip', '/portal_backend');

    // Run pending migrations
    await runRemoteMigrations(token, cookies);
  } else {
    console.log('Skipping backend deploy: backend_deploy.zip not found.');
  }

  // 3. Clean up remote zip files
  const toClean = [];
  if (fs.existsSync('frontend_deploy.zip')) toClean.push('/public_html/portal.lankacham.com/frontend_deploy.zip');
  if (fs.existsSync('backend_deploy.zip')) toClean.push('/portal_backend/backend_deploy.zip');
  if (toClean.length > 0) {
    await cleanupArchives(token, cookies, toClean.join(','));
  }

  console.log('=== Deployment to portal.lankacham.com Completed Successfully! ===');
}

run().catch(err => {
  console.error('FATAL Deployment Error:', err);
  process.exit(1);
});
