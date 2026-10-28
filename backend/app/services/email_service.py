"""
Email service: sends OTP, verification, and welcome emails.
Falls back to console logging when SMTP is not configured.
"""
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.core.config import settings

logger = logging.getLogger(__name__)


def _build_otp_html(otp_code: str, purpose: str, recipient_name: str = "User") -> str:
    purpose_labels = {
        "EMAIL_VERIFY": ("Verify Your Email Address", "confirm your email", "#6366f1"),
        "PASSWORD_RESET": ("Reset Your Password", "reset your password", "#ef4444"),
        "PHONE_VERIFY": ("Verify Your Phone Number", "verify your phone", "#06b6d4"),
        "2FA": ("Two-Factor Authentication Code", "complete sign-in", "#f59e0b"),
        "LOGIN": ("Your Login Verification Code", "complete your login", "#6366f1"),
    }
    title, action, color = purpose_labels.get(purpose, ("Verification Code", "verify", "#6366f1"))

    return f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f1a;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a2e;border-radius:16px;overflow:hidden;border:1px solid rgba(99,102,241,0.2);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center;">
            <div style="font-size:28px;font-weight:900;color:#fff;letter-spacing:-0.5px;">🧠 LOGIMIND v2</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.7);margin-top:4px;">Enterprise Logistics Intelligence</div>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h2 style="color:#e2e8f0;font-size:22px;font-weight:700;margin:0 0 12px;">{title}</h2>
            <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 28px;">
              Hi <strong style="color:#e2e8f0;">{recipient_name}</strong>,<br/>
              Please use the verification code below to {action}. This code is valid for <strong style="color:{color};">10 minutes</strong>.
            </p>
            <!-- OTP Box -->
            <div style="background:#0f0f1a;border:2px solid {color};border-radius:12px;padding:28px;text-align:center;margin-bottom:28px;">
              <div style="font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:3px;margin-bottom:12px;">Your Verification Code</div>
              <div style="font-size:44px;font-weight:900;color:{color};letter-spacing:12px;font-family:monospace;">{otp_code}</div>
            </div>
            <p style="color:#64748b;font-size:13px;line-height:1.6;margin:0;">
              ⚠️ <strong style="color:#94a3b8;">Never share this code</strong> with anyone. LOGIMIND will never ask for your OTP via phone or email.<br/><br/>
              If you didn't request this, please <a href="mailto:security@logimind.ai" style="color:{color};">contact security</a> immediately.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#0f0f1a;padding:20px 40px;border-top:1px solid rgba(255,255,255,0.05);">
            <p style="color:#475569;font-size:12px;margin:0;text-align:center;">
              © 2026 LOGIMIND v2 · Enterprise Logistics Intelligence<br/>
              This is an automated message — please do not reply.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
"""


def send_otp_email(to_email: str, otp_code: str, purpose: str, recipient_name: str = "User") -> bool:
    """Send OTP email. Returns True on success, False on failure."""
    subject_map = {
        "EMAIL_VERIFY": f"[LOGIMIND] Verify your email — {otp_code}",
        "PASSWORD_RESET": f"[LOGIMIND] Password reset code — {otp_code}",
        "PHONE_VERIFY": f"[LOGIMIND] Phone verification code — {otp_code}",
        "2FA": f"[LOGIMIND] 2FA code — {otp_code}",
        "LOGIN": f"[LOGIMIND] Login code — {otp_code}",
    }
    subject = subject_map.get(purpose, f"[LOGIMIND] Verification code — {otp_code}")
    html_body = _build_otp_html(otp_code, purpose, recipient_name)

    if not settings.EMAILS_ENABLED:
        # Development fallback — log to console
        logger.info(
            f"\n{'='*60}\n"
            f"  [EMAIL OTP] (dev mode - not sent via SMTP)\n"
            f"  To:      {to_email}\n"
            f"  Subject: {subject}\n"
            f"  OTP:     {otp_code}  (purpose: {purpose})\n"
            f"{'='*60}"
        )
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_USER}>"
        msg["To"] = to_email
        msg.attach(MIMEText(f"Your LOGIMIND verification code is: {otp_code}", "plain"))
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USER, to_email, msg.as_string())

        logger.info(f"OTP email sent to {to_email} for purpose {purpose}")
        return True
    except Exception as e:
        logger.error(f"Failed to send OTP email to {to_email}: {e}")
        return False


def send_welcome_email(to_email: str, name: str, username: str) -> bool:
    """Send a welcome email after successful registration + verification."""
    subject = "[LOGIMIND] Welcome to LOGIMIND v2 — Account Activated!"
    html_body = f"""
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f1a;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a2e;border-radius:16px;overflow:hidden;border:1px solid rgba(99,102,241,0.2);">
        <tr>
          <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center;">
            <div style="font-size:28px;font-weight:900;color:#fff;">🧠 LOGIMIND v2</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.7);">Enterprise Logistics Intelligence</div>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h2 style="color:#e2e8f0;font-size:24px;font-weight:700;margin:0 0 16px;">🎉 Welcome aboard, {name}!</h2>
            <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 20px;">
              Your LOGIMIND v2 account has been verified and activated. You're now part of the next generation of AI-powered logistics intelligence.
            </p>
            <div style="background:#0f0f1a;border:1px solid rgba(99,102,241,0.3);border-radius:12px;padding:20px;margin-bottom:24px;">
              <div style="color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">Your Account</div>
              <div style="color:#e2e8f0;font-size:15px;">👤 Username: <strong style="color:#6366f1;">@{username}</strong></div>
              <div style="color:#e2e8f0;font-size:15px;margin-top:6px;">📧 Email: <strong>{to_email}</strong></div>
            </div>
            <a href="{settings.FRONTEND_URL}/login" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">Access Your Dashboard →</a>
          </td>
        </tr>
        <tr>
          <td style="background:#0f0f1a;padding:20px 40px;border-top:1px solid rgba(255,255,255,0.05);">
            <p style="color:#475569;font-size:12px;margin:0;text-align:center;">© 2026 LOGIMIND v2</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
"""
    if not settings.EMAILS_ENABLED:
        logger.info(f"[WELCOME EMAIL] (dev): To {to_email}, Name: {name}")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_USER}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html_body, "html"))
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USER, to_email, msg.as_string())
        return True
    except Exception as e:
        logger.error(f"Failed to send welcome email: {e}")
        return False
