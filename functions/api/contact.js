export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': new URL(request.url).origin,
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type',
    'X-Content-Type-Options': 'nosniff',
  };

  // Parse JSON body
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Ungültige Anfrage.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  // Honeypot check — silently succeed
  if (body.website) {
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  // Validate required fields
  const { name, email, message, firma, telefon } = body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'Name ist erforderlich.' }), {
      status: 422,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'E-Mail ist erforderlich.' }), {
      status: 422,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return new Response(JSON.stringify({ error: 'Ungültige E-Mail-Adresse.' }), {
      status: 422,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'Nachricht ist erforderlich.' }), {
      status: 422,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  // Read env vars
  const RESEND_API_KEY = env.RESEND_API_KEY;
  const CONTACT_TO_EMAIL = env.CONTACT_TO_EMAIL;

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'Serverkonfigurationsfehler.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
  if (!CONTACT_TO_EMAIL) {
    return new Response(JSON.stringify({ error: 'Serverkonfigurationsfehler.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  // Build timestamp
  const timestamp = new Date().toLocaleString('de-DE', {
    timeZone: 'Europe/Berlin',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Build HTML email body
  const optionalRows = [
    firma && firma.trim()
      ? `<tr>
          <td style="padding:10px 16px;background:#1a1a1a;font-size:12px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:.05em;width:120px;vertical-align:top;white-space:nowrap;">Firma</td>
          <td style="padding:10px 16px;background:#111;font-size:15px;color:#e8e8e8;border-left:1px solid #2a2a2a;">${escapeHtml(firma.trim())}</td>
        </tr>`
      : '',
    telefon && telefon.trim()
      ? `<tr>
          <td style="padding:10px 16px;background:#1a1a1a;font-size:12px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:.05em;width:120px;vertical-align:top;white-space:nowrap;">Telefon</td>
          <td style="padding:10px 16px;background:#111;font-size:15px;color:#e8e8e8;border-left:1px solid #2a2a2a;">${escapeHtml(telefon.trim())}</td>
        </tr>`
      : '',
  ].join('');

  const htmlBody = `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#0a0a0a;">
    <tr>
      <td style="padding:32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#111;border-radius:8px;overflow:hidden;border:1px solid #2a2a2a;">

          <!-- Header -->
          <tr>
            <td colspan="2" style="padding:24px 16px;background:linear-gradient(135deg,#1a1a1a,#111);border-bottom:1px solid #2a2a2a;text-align:center;">
              <p style="margin:0 0 4px;font-size:11px;color:#e8642a;font-weight:700;text-transform:uppercase;letter-spacing:.1em;">log1k.de</p>
              <h1 style="margin:0;font-size:20px;font-weight:700;color:#f0f0f0;">Neue Anfrage – log1k.de</h1>
            </td>
          </tr>

          <!-- Fields -->
          <tr>
            <td style="padding:10px 16px;background:#1a1a1a;font-size:12px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:.05em;width:120px;vertical-align:top;white-space:nowrap;">Name</td>
            <td style="padding:10px 16px;background:#111;font-size:15px;color:#e8e8e8;border-left:1px solid #2a2a2a;">${escapeHtml(name.trim())}</td>
          </tr>
          <tr>
            <td style="padding:10px 16px;background:#1a1a1a;font-size:12px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:.05em;width:120px;vertical-align:top;white-space:nowrap;">E-Mail</td>
            <td style="padding:10px 16px;background:#111;font-size:15px;border-left:1px solid #2a2a2a;"><a href="mailto:${escapeHtml(email.trim())}" style="color:#e8642a;text-decoration:none;">${escapeHtml(email.trim())}</a></td>
          </tr>
          ${optionalRows}
          <tr>
            <td style="padding:10px 16px;background:#1a1a1a;font-size:12px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:.05em;width:120px;vertical-align:top;white-space:nowrap;">Nachricht</td>
            <td style="padding:10px 16px;background:#111;font-size:15px;color:#e8e8e8;border-left:1px solid #2a2a2a;white-space:pre-wrap;line-height:1.6;">${escapeHtml(message.trim())}</td>
          </tr>

          <!-- Timestamp -->
          <tr>
            <td colspan="2" style="padding:14px 16px;background:#0d0d0d;border-top:1px solid #2a2a2a;text-align:right;">
              <span style="font-size:12px;color:#555;">Eingegangen am ${timestamp} Uhr</span>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  // Call Resend API
  let resendResponse;
  try {
    resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Log1k <noreply@log1k.de>',
        to: [CONTACT_TO_EMAIL],
        reply_to: email.trim(),
        subject: 'Neue Anfrage über log1k.de',
        html: htmlBody,
      }),
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Netzwerkfehler beim Senden. Bitte versuche es später erneut.' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  if (!resendResponse.ok) {
    let detail = '';
    try {
      const errData = await resendResponse.json();
      detail = errData.message || '';
    } catch {}
    return new Response(JSON.stringify({ error: `E-Mail konnte nicht gesendet werden.${detail ? ' ' + detail : ''}` }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

// Handle OPTIONS preflight
export async function onRequestOptions(context) {
  const { request } = context;
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': new URL(request.url).origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

// Reject all other methods
export async function onRequest(context) {
  const { request } = context;
  if (request.method === 'POST') return onRequestPost(context);
  if (request.method === 'OPTIONS') return onRequestOptions(context);
  return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
    status: 405,
    headers: {
      'Content-Type': 'application/json',
      'Allow': 'POST, OPTIONS',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
