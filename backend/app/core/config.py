import os
from typing import List, Union
from pydantic import AnyHttpUrl, validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "LOGIMIND v2 - AI Logistics Intelligence Platform"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security & Tokens
    SECRET_KEY: str = "logimind-super-secret-production-key-change-in-env-98234729384729"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    OTP_EXPIRE_MINUTES: int = 10
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]

    # Database: Supports MySQL and SQLite fallback
    DATABASE_URL: str = "sqlite:///./logimind_v2.db"
    # To use MySQL in production: "mysql+pymysql://root:password@localhost:3306/logimind_v2"
    
    # AI & LLM Integration
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "demo-key-for-ai-engine")
    OPENAI_MODEL: str = "gpt-4o-mini"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    AI_CONFIDENCE_THRESHOLD: float = 0.85
    
    # Weather API (Open-Meteo / WeatherAPI)
    WEATHER_API_KEY: str = os.getenv("WEATHER_API_KEY", "demo-weather-key")
    
    # Email / Notifications (SMTP)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = os.getenv("SMTP_USER", "notifications@logimind.ai")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "secret")
    SMTP_FROM_NAME: str = "LOGIMIND v2"
    EMAILS_ENABLED: bool = False

    # Google OAuth 2.0 & Google Maps Platform
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_MAPS_API_KEY: str = os.getenv("GOOGLE_MAPS_API_KEY", "")

    # Twilio SMS (for phone OTP)
    TWILIO_ACCOUNT_SID: str = os.getenv("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN: str = os.getenv("TWILIO_AUTH_TOKEN", "")
    TWILIO_PHONE_NUMBER: str = os.getenv("TWILIO_PHONE_NUMBER", "")
    SMS_ENABLED: bool = False

    # Frontend URL (for OAuth redirects)
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
