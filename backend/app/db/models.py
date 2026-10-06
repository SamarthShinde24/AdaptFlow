import enum
from datetime import datetime
from uuid import UUID, uuid4
from typing import List, Optional, Any
from sqlalchemy import String, Float, ForeignKey, Integer, Text, Boolean, text, JSON, Index, DateTime
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PGUUID, JSONB, ARRAY
from pgvector.sqlalchemy import Vector


class Base(DeclarativeBase):
    pass


class RoleEnum(str, enum.Enum):
    student = "student"
    instructor = "instructor"


class MaterialTypeEnum(str, enum.Enum):
    textbook = "textbook"
    video = "video"
    slide = "slide"


class MaterialStatusEnum(str, enum.Enum):
    pending = "pending"
    parsing = "parsing"
    indexed = "indexed"
    failed = "failed"


class SubmissionStatusEnum(str, enum.Enum):
    submitted = "submitted"
    graded = "graded"
    late = "late"


class ChatRoleEnum(str, enum.Enum):
    user = "user"
    assistant = "assistant"
    system = "system"


class DifficultyEnum(str, enum.Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"


class QuizStatusEnum(str, enum.Enum):
    active = "active"
    completed = "completed"
    abandoned = "abandoned"


class JobStatusEnum(str, enum.Enum):
    queued = "queued"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    full_name: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[RoleEnum] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"), onupdate=text("now()"), nullable=False)

    subjects: Mapped[List["UserSubject"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    materials: Mapped[List["Material"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    assignments_created: Mapped[List["Assignment"]] = relationship(back_populates="instructor")
    student_assignments: Mapped[List["AssignmentStudent"]] = relationship(back_populates="student", cascade="all, delete-orphan")
    submissions: Mapped[List["Submission"]] = relationship(back_populates="student", cascade="all, delete-orphan")
    chat_sessions: Mapped[List["ChatSession"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    quiz_sessions: Mapped[List["QuizSession"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    refresh_tokens: Mapped[List["RefreshToken"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Subject(Base):
    __tablename__ = "subjects"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"), nullable=False)

    users: Mapped[List["UserSubject"]] = relationship(back_populates="subject", cascade="all, delete-orphan")


class UserSubject(Base):
    __tablename__ = "user_subjects"

    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    subject_id: Mapped[UUID] = mapped_column(ForeignKey("subjects.id", ondelete="CASCADE"), primary_key=True)

    user: Mapped["User"] = relationship(back_populates="subjects")
    subject: Mapped["Subject"] = relationship(back_populates="users")

    __table_args__ = (
        Index("ix_user_subjects_user_id", "user_id"),
        Index("ix_user_subjects_subject_id", "subject_id"),
    )


class Material(Base):
    __tablename__ = "materials"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    material_type: Mapped[MaterialTypeEnum] = mapped_column(String, nullable=False)
    file_path: Mapped[str] = mapped_column(String, nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    mime_type: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[MaterialStatusEnum] = mapped_column(String, nullable=False, index=True)
    course_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    subject: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    chunk_size: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    chunk_overlap: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    total_units_extracted: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"), nullable=False, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"), onupdate=text("now()"), nullable=False)

    user: Mapped["User"] = relationship(back_populates="materials")
    knowledge_units: Mapped[List["KnowledgeUnit"]] = relationship(back_populates="material", cascade="all, delete-orphan")
    quiz_sessions: Mapped[List["QuizSession"]] = relationship(back_populates="material")
    jobs: Mapped[List["ProcessingJob"]] = relationship(back_populates="material", cascade="all, delete-orphan")


class KnowledgeUnit(Base):
    __tablename__ = "knowledge_units"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    material_id: Mapped[UUID] = mapped_column(ForeignKey("materials.id", ondelete="CASCADE"), nullable=False, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    modality: Mapped[str] = mapped_column(String, nullable=False)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tags: Mapped[Optional[List[str]]] = mapped_column(ARRAY(String), nullable=True)
    source_tracking: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)
    embedding: Mapped[Any] = mapped_column(Vector(384), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"), nullable=False)

    material: Mapped["Material"] = relationship(back_populates="knowledge_units")


class Assignment(Base):
    __tablename__ = "assignments"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    instructor_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    course: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    instructions: Mapped[str] = mapped_column(Text, nullable=False)
    deadline: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    accepted_formats: Mapped[Optional[List[str]]] = mapped_column(ARRAY(String), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"), onupdate=text("now()"), nullable=False)

    instructor: Mapped["User"] = relationship(back_populates="assignments_created")
    students: Mapped[List["AssignmentStudent"]] = relationship(back_populates="assignment", cascade="all, delete-orphan")
    submissions: Mapped[List["Submission"]] = relationship(back_populates="assignment", cascade="all, delete-orphan")


class AssignmentStudent(Base):
    __tablename__ = "assignment_students"

    assignment_id: Mapped[UUID] = mapped_column(ForeignKey("assignments.id", ondelete="CASCADE"), primary_key=True)
    student_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)

    assignment: Mapped["Assignment"] = relationship(back_populates="students")
    student: Mapped["User"] = relationship(back_populates="student_assignments")

    __table_args__ = (
        Index("ix_assignment_students_assignment_id", "assignment_id"),
        Index("ix_assignment_students_student_id", "student_id"),
    )


class Submission(Base):
    __tablename__ = "submissions"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    assignment_id: Mapped[UUID] = mapped_column(ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    file_name: Mapped[str] = mapped_column(String, nullable=False)
    file_path: Mapped[str] = mapped_column(String, nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    mime_type: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[SubmissionStatusEnum] = mapped_column(String, nullable=False, index=True)
    grade: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    feedback: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"), nullable=False)

    assignment: Mapped["Assignment"] = relationship(back_populates="submissions")
    student: Mapped["User"] = relationship(back_populates="submissions")


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"), onupdate=text("now()"), nullable=False)

    user: Mapped["User"] = relationship(back_populates="chat_sessions")
    messages: Mapped[List["ChatMessage"]] = relationship(back_populates="session", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    session_id: Mapped[UUID] = mapped_column(ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    role: Mapped[ChatRoleEnum] = mapped_column(String, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    citations: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"), nullable=False)

    session: Mapped["ChatSession"] = relationship(back_populates="messages")


class QuizSession(Base):
    __tablename__ = "quiz_sessions"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    material_id: Mapped[Optional[UUID]] = mapped_column(ForeignKey("materials.id", ondelete="SET NULL"), nullable=True, index=True)
    difficulty: Mapped[DifficultyEnum] = mapped_column(String, nullable=False)
    question_count: Mapped[int] = mapped_column(Integer, nullable=False)
    questions: Mapped[Any] = mapped_column(JSONB, nullable=False)
    answers: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)
    score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    status: Mapped[QuizStatusEnum] = mapped_column(String, nullable=False, index=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship(back_populates="quiz_sessions")
    material: Mapped["Material"] = relationship(back_populates="quiz_sessions")


class ProcessingJob(Base):
    __tablename__ = "processing_jobs"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    material_id: Mapped[UUID] = mapped_column(ForeignKey("materials.id", ondelete="CASCADE"), nullable=False, index=True)
    status: Mapped[JobStatusEnum] = mapped_column(String, nullable=False, index=True)
    progress: Mapped[float] = mapped_column(Float, default=0.0)
    units_extracted: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"), onupdate=text("now()"), nullable=False)

    material: Mapped["Material"] = relationship(back_populates="jobs")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"), nullable=False)

    user: Mapped["User"] = relationship(back_populates="refresh_tokens")
