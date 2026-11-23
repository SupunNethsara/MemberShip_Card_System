<!doctype html>
<html lang="{{ $lang }}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{ $t['subject'] }}</title>
</head>
<body style="margin:0;padding:0;background:#f3f6fc;font-family:Inter,'Noto Sans Sinhala','Noto Sans Tamil',Arial,sans-serif;color:#13224a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f6fc;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4eaf6;">
          <tr><td style="height:4px;background:#e0aa36;font-size:0;line-height:0;">&nbsp;</td></tr>
          <tr>
            <td style="padding:28px 32px 8px;font-size:15px;font-weight:700;color:#13224a;">{{ $t['site'] }}</td>
          </tr>
          <tr>
            <td style="padding:8px 32px 0;font-size:15px;line-height:1.6;color:#334155;">
              {{ $t['hello'] }}{{ $name ? ' '.$name : '' }},<br>
              {{ $t['intro'] }}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 32px;">
              <div style="display:inline-block;padding:14px 24px;border-radius:10px;background:#f3f6fc;border:1px solid #e4eaf6;font-family:'Courier New',monospace;font-size:32px;font-weight:700;letter-spacing:8px;color:#0b1631;">{{ $code }}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px;font-size:13px;line-height:1.6;color:#64748b;">
              {{ $t['expires'] }}<br>
              {{ $t['ignore'] }}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
