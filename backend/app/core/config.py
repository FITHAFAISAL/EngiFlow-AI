import os

class Settings:
    PROJECT_NAME: str = "EngiFlow AI"
    TAGLINE: str = "From Requirement to Delivery — Tracked, Verified, Predicted."
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./engiflow.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "engiflow-secret-key-abc-company")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

settings = Settings()
