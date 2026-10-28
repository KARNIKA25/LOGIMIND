import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError

from app.core.config import settings
from app.core.logging import configure_logging
from app.api.v1.router import api_router
from app.middleware.error_handler import GlobalErrorHandlerMiddleware
from app.middleware.rate_limiter import RateLimiterMiddleware
from app.db.session import engine
from app.db.base import Base

configure_logging()
logger = logging.getLogger("logimind.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create all DB tables
    logger.info("[STARTUP] LogiMind v2 - Initializing Database Schema...")
    Base.metadata.create_all(bind=engine)
    logger.info("[OK] Database schema synchronized successfully.")
    
    # Seed demo data on first launch
    from app.db.seeder import run_seed
    from app.db.session import SessionLocal
    db = SessionLocal()
    try:
        run_seed(db)
    finally:
        db.close()
    
    logger.info(f"[OK] {settings.PROJECT_NAME} v{settings.VERSION} is LIVE and ready.")
    yield
    # Shutdown
    logger.info("[SHUTDOWN] LogiMind v2 shutting down gracefully.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="""
# 🧠 LOGIMIND v2 — AI-Powered Enterprise Logistics Intelligence Platform

A production-grade, AI-augmented logistics management system built with **Clean Architecture**, **FastAPI**, and **React 19**.

## Key Capabilities
- 🚚 **Real-Time Shipment Tracking** with IoT telematics
- 🗺️ **Multi-Criteria Route Optimization** (Weather + Traffic + Carbon)
- 🤖 **AI Co-Pilot** for natural language queries & demand forecasting
- 🏭 **Warehouse Intelligence** with zone-level utilization heatmaps
- 📦 **Inventory Management** with automated reorder and stock transfer
- 🚗 **Fleet Management** for vehicles and drivers
- 📊 **Executive Analytics Dashboard** with real-time KPIs
- 🔔 **Real-Time WebSocket Notifications**
    """,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom middleware
app.add_middleware(GlobalErrorHandlerMiddleware)
app.add_middleware(RateLimiterMiddleware, max_requests=300, window_seconds=60)

# Validation error handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Request payload validation failed. Check field constraints.",
                "details": exc.errors()
            }
        }
    )

# Register API router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/api/v1/health", tags=["System Health"])
def health_check():
    """System liveness probe for load balancers and container orchestrators."""
    return {
        "status": "OPERATIONAL",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "engine": "FastAPI + SQLAlchemy + AI Engine"
    }

@app.get("/", include_in_schema=False)
def root():
    return {
        "platform": "LOGIMIND v2",
        "status": "operational",
        "docs": "/docs",
        "api": settings.API_V1_STR
    }
