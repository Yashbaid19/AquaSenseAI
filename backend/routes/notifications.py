from fastapi import APIRouter, Depends
from deps import app_state
from auth import get_current_user_id

router = APIRouter(tags=["notifications"])


@router.get("/notifications")
async def get_notifications(user_id: str = Depends(get_current_user_id), unread_only: bool = False):
    return await app_state.notification_service.get_user_notifications(user_id, unread_only=unread_only)


@router.post("/notifications/mark-read")
async def mark_notifications_read(request: dict, user_id: str = Depends(get_current_user_id)):
    notification_ids = request.get("notification_ids")
    await app_state.notification_service.mark_as_read(user_id, notification_ids)
    return {"status": "success"}


@router.get("/notifications/count")
async def get_unread_count(user_id: str = Depends(get_current_user_id)):
    notifications = await app_state.notification_service.get_user_notifications(user_id, unread_only=True)
    return {"unread_count": len(notifications)}
