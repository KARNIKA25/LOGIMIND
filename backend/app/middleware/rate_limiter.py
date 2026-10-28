import time
from collections import defaultdict
from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

class RateLimiterMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_requests: int = 250, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.request_records = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        # Exempt static, docs, and health checks
        if request.url.path in ["/docs", "/openapi.json", "/redoc", "/api/v1/health"]:
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        
        # Clean up timestamps older than window
        timestamps = [ts for ts in self.request_records[client_ip] if now - ts < self.window_seconds]
        
        if len(timestamps) >= self.max_requests:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "success": False,
                    "error": {
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": f"Rate limit exceeded. Maximum {self.max_requests} requests per {self.window_seconds}s.",
                        "retry_after_seconds": int(self.window_seconds - (now - timestamps[0]))
                    }
                }
            )

        timestamps.append(now)
        self.request_records[client_ip] = timestamps
        return await call_next(request)
