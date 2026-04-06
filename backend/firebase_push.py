"""
Firebase Push Notification Service (Placeholder)

To enable push notifications:
1. Create a Firebase project at https://console.firebase.google.com
2. Download the service account key JSON file
3. Set FIREBASE_CREDENTIALS_PATH in backend/.env to the path of the JSON file
4. Set FIREBASE_ENABLED=true in backend/.env

The notification triggers are already wired in the sensor alert system.
"""
import os
import logging

logger = logging.getLogger(__name__)

FIREBASE_ENABLED = os.environ.get('FIREBASE_ENABLED', 'false').lower() == 'true'
FIREBASE_CREDENTIALS_PATH = os.environ.get('FIREBASE_CREDENTIALS_PATH', '')

_firebase_initialized = False


def init_firebase():
    """Initialize Firebase Admin SDK"""
    global _firebase_initialized
    if not FIREBASE_ENABLED:
        logger.info("Firebase push notifications disabled (FIREBASE_ENABLED=false)")
        return False

    if not FIREBASE_CREDENTIALS_PATH or not os.path.exists(FIREBASE_CREDENTIALS_PATH):
        logger.warning("Firebase credentials file not found. Set FIREBASE_CREDENTIALS_PATH in .env")
        return False

    try:
        import firebase_admin
        from firebase_admin import credentials
        cred = credentials.Certificate(FIREBASE_CREDENTIALS_PATH)
        firebase_admin.initialize_app(cred)
        _firebase_initialized = True
        logger.info("Firebase Admin SDK initialized successfully")
        return True
    except ImportError:
        logger.warning("firebase-admin not installed. Run: pip install firebase-admin")
        return False
    except Exception as e:
        logger.error(f"Firebase initialization failed: {e}")
        return False


async def send_push_notification(token: str, title: str, body: str, data: dict = None):
    """Send a push notification to a specific device token"""
    if not _firebase_initialized:
        logger.debug("Firebase not initialized, skipping push notification")
        return False

    try:
        from firebase_admin import messaging
        message = messaging.Message(
            notification=messaging.Notification(title=title, body=body),
            data=data or {},
            token=token,
        )
        response = messaging.send(message)
        logger.info(f"Push notification sent: {response}")
        return True
    except Exception as e:
        logger.error(f"Push notification failed: {e}")
        return False


async def send_sensor_alert_push(user_tokens: list, alert_type: str, title: str, message: str, sensor_data: dict = None):
    """Send push notification for critical sensor alerts"""
    if not _firebase_initialized or not user_tokens:
        return 0

    sent_count = 0
    for token in user_tokens:
        success = await send_push_notification(
            token=token,
            title=f"[{alert_type.upper()}] {title}",
            body=message,
            data={
                "type": "sensor_alert",
                "alert_type": alert_type,
                "soil_moisture": str(sensor_data.get("soil_moisture", "")),
                "temperature": str(sensor_data.get("temperature", "")),
            }
        )
        if success:
            sent_count += 1
    return sent_count


def register_device_token(user_id: str, device_token: str):
    """Store device token for a user (called when user enables push notifications)"""
    # This would store in MongoDB. Implementation depends on your notification_service.py
    logger.info(f"Device token registered for user {user_id}")
    return True
