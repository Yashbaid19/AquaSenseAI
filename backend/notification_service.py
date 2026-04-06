from datetime import datetime, timezone
from typing import Dict, List
import asyncio


class NotificationService:
    """Service for managing farm notifications"""

    NOTIFICATION_TYPES = {
        'critical': {'priority': 1, 'color': 'red'},
        'warning': {'priority': 2, 'color': 'amber'},
        'info': {'priority': 3, 'color': 'blue'},
        'success': {'priority': 4, 'color': 'emerald'}
    }

    def __init__(self, db):
        self.db = db
        self.notifications_collection = db.notifications

    async def create_notification(self, user_id: str, notification_type: str, title: str, message: str, data: Dict = None):
        """Create and store a notification"""
        notification = {
            'user_id': user_id,
            'type': notification_type,
            'title': title,
            'message': message,
            'data': data or {},
            'read': False,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'priority': self.NOTIFICATION_TYPES.get(notification_type, {}).get('priority', 3)
        }

        result = await self.notifications_collection.insert_one(notification)
        notification['id'] = str(result.inserted_id)

        return notification

    async def get_user_notifications(self, user_id: str, limit: int = 50, unread_only: bool = False):
        """Get notifications for a user"""
        query = {'user_id': user_id}
        if unread_only:
            query['read'] = False

        notifications = await self.notifications_collection.find(
            query,
            {'_id': 0}
        ).sort('timestamp', -1).limit(limit).to_list(limit)

        return notifications

    async def mark_as_read(self, user_id: str, notification_ids: List[str] = None):
        """Mark notifications as read"""
        query = {'user_id': user_id}
        if notification_ids:
            query['id'] = {'$in': notification_ids}

        await self.notifications_collection.update_many(query, {'$set': {'read': True}})

    async def check_sensor_alerts(self, user_id: str, sensor_data: Dict):
        """Check sensor data and create alerts if needed, and send push notifications"""
        alerts = []

        # Check soil moisture
        soil_moisture = sensor_data.get('soil_moisture', 100)
        if soil_moisture < 25:
            alert = await self.create_notification(
                user_id=user_id,
                notification_type='critical',
                title='Critical Soil Moisture',
                message=f'Soil moisture critically low at {soil_moisture}%. Immediate irrigation required.',
                data={'soil_moisture': soil_moisture, 'action': 'irrigate_now'}
            )
            alerts.append(alert)
        elif soil_moisture < 30:
            alert = await self.create_notification(
                user_id=user_id,
                notification_type='warning',
                title='Low Soil Moisture',
                message=f'Soil moisture is low at {soil_moisture}%. Consider irrigation soon.',
                data={'soil_moisture': soil_moisture, 'action': 'plan_irrigation'}
            )
            alerts.append(alert)

        # Check temperature
        temperature = sensor_data.get('temperature', 25)
        if temperature > 38:
            alert = await self.create_notification(
                user_id=user_id,
                notification_type='warning',
                title='High Temperature Alert',
                message=f'Temperature is {temperature}C. Crops may need extra water.',
                data={'temperature': temperature}
            )
            alerts.append(alert)

        # Check water stress
        water_stress = sensor_data.get('water_stress_index', 0)
        if water_stress > 0.7:
            alert = await self.create_notification(
                user_id=user_id,
                notification_type='warning',
                title='High Water Stress',
                message=f'Water stress index is {water_stress}. Check irrigation schedule.',
                data={'water_stress_index': water_stress}
            )
            alerts.append(alert)

        # Send Firebase push for critical alerts
        if alerts:
            try:
                from firebase_push import send_sensor_alert_push
                user_tokens = await self._get_user_push_tokens(user_id)
                for alert in alerts:
                    if alert.get('type') == 'critical':
                        await send_sensor_alert_push(
                            user_tokens=user_tokens,
                            alert_type=alert['type'],
                            title=alert['title'],
                            message=alert['message'],
                            sensor_data=sensor_data
                        )
            except Exception:
                pass  # Firebase is optional

        return alerts

    async def _get_user_push_tokens(self, user_id: str) -> List[str]:
        """Get push notification tokens for a user"""
        doc = await self.db.push_tokens.find_one({"user_id": user_id}, {"_id": 0})
        if doc:
            return doc.get("tokens", [])
        return []

    async def create_rain_forecast_alert(self, user_id: str, hours_until_rain: int):
        """Create notification for upcoming rainfall"""
        return await self.create_notification(
            user_id=user_id,
            notification_type='info',
            title='Rain Forecast',
            message=f'Rain expected in {hours_until_rain} hours. Consider delaying irrigation.',
            data={'hours_until_rain': hours_until_rain}
        )


def get_notification_service(db):
    return NotificationService(db)
