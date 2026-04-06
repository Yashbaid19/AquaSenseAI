"""Shared application state - singleton instances used across route modules"""


class _AppState:
    ws_manager = None
    notification_service = None


app_state = _AppState()
