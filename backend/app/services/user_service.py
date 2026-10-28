from typing import Optional, List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.user_repo import UserRepository
from app.models.user import User, UserProfile
from app.schemas.user import UserUpdate, UserProfileUpdate
from app.core.security import get_password_hash

class UserService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = UserRepository(db)

    def get_all(self, skip: int = 0, limit: int = 100) -> List[User]:
        return self.repo.get_multi(skip=skip, limit=limit)

    def get_by_id(self, user_id: int) -> User:
        u = self.repo.get(user_id)
        if not u:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return u

    def update_user(self, user_id: int, u_in: UserUpdate) -> User:
        user = self.get_by_id(user_id)
        data = u_in.model_dump(exclude_unset=True)
        if "password" in data and data["password"]:
            data["hashed_password"] = get_password_hash(data.pop("password"))
        return self.repo.update(user, data)

    def update_profile(self, user_id: int, p_in: UserProfileUpdate) -> UserProfile:
        user = self.get_by_id(user_id)
        if not user.profile:
            profile = UserProfile(user_id=user_id, **p_in.model_dump(exclude_unset=True))
            self.db.add(profile)
            self.db.commit()
            self.db.refresh(profile)
            return profile
        
        for k, v in p_in.model_dump(exclude_unset=True).items():
            setattr(user.profile, k, v)
        self.db.commit()
        self.db.refresh(user.profile)
        return user.profile
