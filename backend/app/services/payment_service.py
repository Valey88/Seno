"""
Payment service for YooKassa integration.
"""
import httpx
import base64
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

# YooKassa API endpoints
YOOKASSA_API_URL = "https://api.yookassa.ru/v3"
YOOKASSA_SANDBOX_URL = "https://api.yookassa.ru/v3"  # Same URL, but uses test credentials


class PaymentService:
    """Service for handling YooKassa payments."""
    
    def __init__(self):
        from app.database import settings
        self.shop_id = settings.yookassa_shop_id
        self.secret_key = settings.yookassa_secret_key
        self.return_url = settings.yookassa_return_url
        self.is_test = settings.yookassa_test_mode.lower() == "true"
        
        # Create Basic Auth header (only if credentials are provided)
        if self.shop_id and self.secret_key:
            credentials = f"{self.shop_id}:{self.secret_key}"
            encoded_credentials = base64.b64encode(credentials.encode()).decode()
            self.auth_header = f"Basic {encoded_credentials}"
        else:
            self.auth_header = None
    
    async def create_payment(
        self,
        amount: float,
        booking_id: int,
        description: str,
        customer_phone: Optional[str] = None,
        customer_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a payment in YooKassa.
        
        Args:
            amount: Payment amount in rubles
            booking_id: Booking ID for reference
            description: Payment description
            customer_phone: Customer phone number (optional)
            customer_name: Customer name (optional)
        
        Returns:
            Dict with payment data including confirmation_url
        """
        if not self.shop_id or not self.secret_key:
            logger.error("YooKassa credentials not configured")
            raise ValueError("YooKassa credentials not configured")
        
        # Prepare payment data
        payment_data = {
            "amount": {
                "value": f"{amount:.2f}",
                "currency": "RUB"
            },
            "confirmation": {
                "type": "redirect",
                "return_url": self.return_url
            },
            "capture": True,
            "description": description,
            "metadata": {
                "booking_id": str(booking_id)
            }
        }
        
        # Add customer info if provided
        if customer_phone or customer_name:
            payment_data["receipt"] = {
                "customer": {}
            }
            if customer_phone:
                payment_data["receipt"]["customer"]["phone"] = customer_phone
            if customer_name:
                payment_data["receipt"]["customer"]["full_name"] = customer_name
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{YOOKASSA_API_URL}/payments",
                    json=payment_data,
                    headers={
                        "Authorization": self.auth_header,
                        "Idempotence-Key": f"booking_{booking_id}_{int(amount * 100)}",
                        "Content-Type": "application/json"
                    }
                )
                
                response.raise_for_status()
                payment_info = response.json()
                
                logger.info(f"Payment created: {payment_info.get('id')} for booking {booking_id}")
                
                return payment_info
                
        except httpx.HTTPStatusError as e:
            logger.error(f"YooKassa API error: {e.response.status_code} - {e.response.text}")
            raise Exception(f"Ошибка создания платежа: {e.response.status_code}")
        except Exception as e:
            logger.error(f"Error creating payment: {str(e)}", exc_info=True)
            raise Exception(f"Ошибка создания платежа: {str(e)}")
    
    async def get_payment_status(self, payment_id: str) -> Dict[str, Any]:
        """
        Get payment status from YooKassa.
        
        Args:
            payment_id: YooKassa payment ID
        
        Returns:
            Dict with payment status
        """
        if not self.shop_id or not self.secret_key:
            raise ValueError("YooKassa credentials not configured")
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{YOOKASSA_API_URL}/payments/{payment_id}",
                    headers={
                        "Authorization": self.auth_header,
                        "Content-Type": "application/json"
                    }
                )
                
                response.raise_for_status()
                return response.json()
                
        except httpx.HTTPStatusError as e:
            logger.error(f"YooKassa API error: {e.response.status_code} - {e.response.text}")
            raise Exception(f"Ошибка получения статуса платежа: {e.response.status_code}")
        except Exception as e:
            logger.error(f"Error getting payment status: {str(e)}", exc_info=True)
            raise
    
    def verify_webhook(self, webhook_data: Dict[str, Any]) -> bool:
        """
        Verify webhook data from YooKassa.
        In production, you should verify the signature.
        
        Args:
            webhook_data: Webhook payload from YooKassa
        
        Returns:
            True if webhook is valid
        """
        # Basic validation
        if "event" not in webhook_data or "object" not in webhook_data:
            return False
        
        # Check if it's a payment event
        if webhook_data["event"] not in ["payment.succeeded", "payment.canceled"]:
            return False
        
        return True


# Global instance
payment_service = PaymentService()

