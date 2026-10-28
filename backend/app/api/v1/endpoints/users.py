from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.user_service import UserService
from app.schemas.user import UserResponse, UserUpdate, UserProfileUpdate, UserProfileResponse
from app.api.deps import get_current_active_user, require_admin
from app.models.user import User

router = APIRouter()

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_active_user)):
    """Fetch current logged in user profile."""
    return current_user

@router.get("/", response_model=List[UserResponse], dependencies=[Depends(require_admin)])
def list_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Admin endpoint to list enterprise users."""
    service = UserService(db)
    return service.get_all(skip=skip, limit=limit)

@router.get("/{user_id}", response_model=UserResponse)
def get_user_by_id(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """Fetch user profile details."""
    service = UserService(db)
    return service.get_by_id(user_id)

@router.put("/profile/me", response_model=UserProfileResponse)
def update_my_profile(
    p_in: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update current user's profile information and notification preferences."""
    service = UserService(db)
    return service.update_profile(current_user.id, p_in)

@router.put("/{user_id}", response_model=UserResponse, dependencies=[Depends(require_admin)])
def update_user(user_id: int, u_in: UserUpdate, db: Session = Depends(get_db)):
    """Admin endpoint to update user roles or activation status."""
    service = UserService(db)
    return service.update_user(user_id, u_in)
