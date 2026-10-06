from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Literal, Optional

class UserRead(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    role: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    confirm_password: str
    full_name: str = Field(min_length=1)
    role: Literal["student", "instructor"]
    
    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("passwords do not match")
        return v

class StudentSignupRequest(SignupRequest):
    subject_ids: list[UUID] = []

class InstructorSignupRequest(SignupRequest):
    subject_ids: list[UUID] = []

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)

class AuthResponse(BaseModel):
    user: UserRead
    access_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    sub: str
    role: Optional[str] = None
    exp: int
    jti: str

class RefreshRequest(BaseModel):
    pass
