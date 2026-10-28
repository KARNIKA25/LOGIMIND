import pytest
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.core.security import create_access_token, get_password_hash
from app.models.user import User, UserProfile, UserRole

# In-memory SQLite engine for lightning fast and isolated test execution
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture
def db() -> Generator:
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client(db) -> Generator:
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def admin_user(db) -> User:
    user = User(
        email="admin_test@logimind.ai",
        username="admin_test",
        hashed_password=get_password_hash("TestPass123!"),
        role=UserRole.ADMIN,
        is_active=True,
        is_verified=True,
    )
    db.add(user)
    db.flush()
    profile = UserProfile(
        user_id=user.id,
        first_name="Admin",
        last_name="Tester",
    )
    db.add(profile)
    db.commit()
    db.refresh(user)
    return user

@pytest.fixture
def admin_token_headers(admin_user: User) -> dict:
    access_token = create_access_token(
        subject=str(admin_user.id),
        extra_claims={"role": admin_user.role.value, "type": "access"}
    )
    return {"Authorization": f"Bearer {access_token}"}
