"""
Email service for sending verification codes.
"""
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails."""
    
    def __init__(self):
        self.smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.from_email = os.getenv("FROM_EMAIL", self.smtp_user)
        self.use_tls = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
    
    async def send_verification_code(self, email: str, code: str) -> bool:
        """
        Send verification code to email.
        Returns True if sent successfully, False otherwise.
        """
        if not self.smtp_user or not self.smtp_password:
            logger.warning("SMTP credentials not configured. Email will not be sent.")
            logger.info(f"Verification code for {email}: {code}")
            return False
        
        try:
            # Create message
            msg = MIMEMultipart()
            msg['From'] = self.from_email
            msg['To'] = email
            msg['Subject'] = "Код подтверждения - Трактир Сеновал"
            
            # Email body
            body = f"""
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #D4AF37;">Трактир Сеновал</h2>
                        <p>Здравствуйте!</p>
                        <p>Ваш код подтверждения для регистрации:</p>
                        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
                            <h1 style="color: #D4AF37; font-size: 32px; letter-spacing: 8px; margin: 0;">{code}</h1>
                        </div>
                        <p>Код действителен в течение 10 минут.</p>
                        <p style="color: #666; font-size: 12px; margin-top: 30px;">
                            Если вы не запрашивали этот код, проигнорируйте это письмо.
                        </p>
                    </div>
                </body>
            </html>
            """
            
            msg.attach(MIMEText(body, 'html', 'utf-8'))
            
            # Send email
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                if self.use_tls:
                    server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)
            
            logger.info(f"Verification code sent to {email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {email}: {str(e)}")
            # In development, log the code instead
            logger.info(f"Verification code for {email}: {code}")
            return False


# Global instance
email_service = EmailService()

