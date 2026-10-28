import json
from typing import Dict, List, Any
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # Store active connections: user_id -> List[WebSocket]
        self.active_user_connections: Dict[int, List[WebSocket]] = {}
        # Anonymous or broadcast connections
        self.broadcast_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket, user_id: int = None):
        await websocket.accept()
        if user_id:
            if user_id not in self.active_user_connections:
                self.active_user_connections[user_id] = []
            self.active_user_connections[user_id].append(websocket)
        else:
            self.broadcast_connections.append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: int = None):
        if user_id and user_id in self.active_user_connections:
            if websocket in self.active_user_connections[user_id]:
                self.active_user_connections[user_id].remove(websocket)
            if not self.active_user_connections[user_id]:
                del self.active_user_connections[user_id]
        elif websocket in self.broadcast_connections:
            self.broadcast_connections.remove(websocket)

    async def send_personal_message(self, message: Dict[str, Any], user_id: int):
        if user_id in self.active_user_connections:
            payload = json.dumps(message)
            for connection in self.active_user_connections[user_id]:
                try:
                    await connection.send_text(payload)
                except Exception:
                    pass

    async def broadcast(self, message: Dict[str, Any]):
        payload = json.dumps(message)
        # Send to all users
        for user_id, conns in self.active_user_connections.items():
            for conn in conns:
                try:
                    await conn.send_text(payload)
                except Exception:
                    pass
        # Send to broadcast conns
        for conn in self.broadcast_connections:
            try:
                await conn.send_text(payload)
            except Exception:
                pass

ws_manager = ConnectionManager()
