import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WelcomeEmailPayload {
  shopName: string;
  email: string;
  password: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { shopName, email, password }: WelcomeEmailPayload = await req.json();

    if (!shopName || !email || !password) {
      return new Response(
        JSON.stringify({ error: 'shopName, email, and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    if (!RESEND_API_KEY) {
      console.error('[send-welcome-email] RESEND_API_KEY secret is not set');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff;">
        <div style="background: #1E3A5F; padding: 32px 40px; border-radius: 12px 12px 0 0;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">
            🖨️ Welcome to PrintHub
          </h1>
        </div>
        <div style="padding: 32px 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="color: #374151; font-size: 16px; margin: 0 0 16px;">Hi <strong>${shopName}</strong>,</p>
          <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
            Your print shop account has been created on PrintHub. You can now log in and start configuring your products and pricing.
          </p>

          <div style="background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px 24px; margin-bottom: 28px;">
            <p style="color: #374151; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 12px;">Your Login Credentials</p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="color: #6b7280; font-size: 14px; padding: 4px 0; width: 80px;">Email</td>
                <td style="color: #1e293b; font-size: 14px; font-weight: 600; padding: 4px 0;">${email}</td>
              </tr>
              <tr>
                <td style="color: #6b7280; font-size: 14px; padding: 4px 0;">Password</td>
                <td style="color: #1e293b; font-size: 14px; font-weight: 600; padding: 4px 0; font-family: monospace;">${password}</td>
              </tr>
            </table>
          </div>

          <p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin: 0 0 24px;">
            For security, we recommend changing your password after your first login.
          </p>

          <p style="color: #9ca3af; font-size: 13px; margin: 0;">
            — The PrintHub Team
          </p>
        </div>
      </div>
    `;

    console.log('[send-welcome-email] Sending welcome email to', email);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'PrintHub <noreply@printing24-7.com>',
        to: [email],
        subject: `Welcome to PrintHub — Your shop account is ready`,
        html,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error('[send-welcome-email] Resend API error', result);
      return new Response(
        JSON.stringify({ error: result.message ?? 'Failed to send email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[send-welcome-email] Email sent successfully, id:', result.id);
    return new Response(
      JSON.stringify({ success: true, id: result.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('[send-welcome-email] Unexpected error', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});