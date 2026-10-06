"""initial_schema

Revision ID: 001
Revises: 
Create Date: 2026-10-06 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import pgvector.sqlalchemy

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Enable necessary extensions
    op.execute('CREATE EXTENSION IF NOT EXISTS vector;')
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')

    # 2. Create trigger function for updated_at
    op.execute("""
    CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = now();
        RETURN NEW;
    END;
    $$ language 'plpgsql';
    """)

    # 3. Create tables
    # users
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), primary_key=True),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('password_hash', sa.String(), nullable=False),
        sa.Column('full_name', sa.String(), nullable=False),
        sa.Column('role', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    
    op.execute("""
    CREATE TRIGGER trg_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
    """)

    # subjects
    op.create_table(
        'subjects',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), primary_key=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_subjects_name'), 'subjects', ['name'], unique=True)

    # user_subjects
    op.create_table(
        'user_subjects',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('subject_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('subjects.id', ondelete='CASCADE'), primary_key=True),
    )
    op.create_index('ix_user_subjects_user_id', 'user_subjects', ['user_id'])
    op.create_index('ix_user_subjects_subject_id', 'user_subjects', ['subject_id'])

    # materials
    op.create_table(
        'materials',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('material_type', sa.String(), nullable=False),
        sa.Column('file_path', sa.String(), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('mime_type', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('course_id', sa.String(), nullable=True),
        sa.Column('subject', sa.String(), nullable=True),
        sa.Column('chunk_size', sa.Integer(), nullable=True),
        sa.Column('chunk_overlap', sa.Integer(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('total_units_extracted', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_materials_status'), 'materials', ['status'])
    op.create_index(op.f('ix_materials_created_at'), 'materials', ['created_at'])

    op.execute("""
    CREATE TRIGGER trg_materials_updated_at 
    BEFORE UPDATE ON materials 
    FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
    """)

    # knowledge_units
    op.create_table(
        'knowledge_units',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), primary_key=True),
        sa.Column('material_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('materials.id', ondelete='CASCADE'), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('modality', sa.String(), nullable=False),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('tags', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('source_tracking', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('embedding', pgvector.sqlalchemy.Vector(384), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_knowledge_units_material_id'), 'knowledge_units', ['material_id'])

    # assignments
    op.create_table(
        'assignments',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), primary_key=True),
        sa.Column('instructor_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('course', sa.String(), nullable=True),
        sa.Column('instructions', sa.Text(), nullable=False),
        sa.Column('deadline', sa.DateTime(timezone=True), nullable=False),
        sa.Column('accepted_formats', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_assignments_instructor_id'), 'assignments', ['instructor_id'])

    op.execute("""
    CREATE TRIGGER trg_assignments_updated_at 
    BEFORE UPDATE ON assignments 
    FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
    """)

    # assignment_students
    op.create_table(
        'assignment_students',
        sa.Column('assignment_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('assignments.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('student_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
    )
    op.create_index('ix_assignment_students_assignment_id', 'assignment_students', ['assignment_id'])
    op.create_index('ix_assignment_students_student_id', 'assignment_students', ['student_id'])

    # submissions
    op.create_table(
        'submissions',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), primary_key=True),
        sa.Column('assignment_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('assignments.id', ondelete='CASCADE'), nullable=False),
        sa.Column('student_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('file_name', sa.String(), nullable=False),
        sa.Column('file_path', sa.String(), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('mime_type', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('grade', sa.Float(), nullable=True),
        sa.Column('feedback', sa.Text(), nullable=True),
        sa.Column('submitted_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_submissions_assignment_id'), 'submissions', ['assignment_id'])
    op.create_index(op.f('ix_submissions_student_id'), 'submissions', ['student_id'])
    op.create_index(op.f('ix_submissions_status'), 'submissions', ['status'])

    # chat_sessions
    op.create_table(
        'chat_sessions',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_chat_sessions_user_id'), 'chat_sessions', ['user_id'])

    op.execute("""
    CREATE TRIGGER trg_chat_sessions_updated_at 
    BEFORE UPDATE ON chat_sessions 
    FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
    """)

    # chat_messages
    op.create_table(
        'chat_messages',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), primary_key=True),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('chat_sessions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('role', sa.String(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('citations', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_chat_messages_session_id'), 'chat_messages', ['session_id'])

    # quiz_sessions
    op.create_table(
        'quiz_sessions',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('material_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('materials.id', ondelete='SET NULL'), nullable=True),
        sa.Column('difficulty', sa.String(), nullable=False),
        sa.Column('question_count', sa.Integer(), nullable=False),
        sa.Column('questions', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('answers', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('score', sa.Float(), nullable=True),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(op.f('ix_quiz_sessions_user_id'), 'quiz_sessions', ['user_id'])
    op.create_index(op.f('ix_quiz_sessions_material_id'), 'quiz_sessions', ['material_id'])
    op.create_index(op.f('ix_quiz_sessions_status'), 'quiz_sessions', ['status'])

    # processing_jobs
    op.create_table(
        'processing_jobs',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), primary_key=True),
        sa.Column('material_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('materials.id', ondelete='CASCADE'), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('progress', sa.Float(), default=0.0),
        sa.Column('units_extracted', sa.Integer(), default=0),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_processing_jobs_material_id'), 'processing_jobs', ['material_id'])
    op.create_index(op.f('ix_processing_jobs_status'), 'processing_jobs', ['status'])

    op.execute("""
    CREATE TRIGGER trg_processing_jobs_updated_at 
    BEFORE UPDATE ON processing_jobs 
    FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
    """)

    # refresh_tokens
    op.create_table(
        'refresh_tokens',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('token_hash', sa.String(), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('revoked', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_refresh_tokens_user_id'), 'refresh_tokens', ['user_id'])
    op.create_index(op.f('ix_refresh_tokens_token_hash'), 'refresh_tokens', ['token_hash'], unique=True)


def downgrade() -> None:
    # Drop tables
    op.drop_table('refresh_tokens')
    op.drop_table('processing_jobs')
    op.drop_table('quiz_sessions')
    op.drop_table('chat_messages')
    op.drop_table('chat_sessions')
    op.drop_table('submissions')
    op.drop_table('assignment_students')
    op.drop_table('assignments')
    op.drop_table('knowledge_units')
    op.drop_table('materials')
    op.drop_table('user_subjects')
    op.drop_table('subjects')
    op.drop_table('users')

    # Drop triggers and function
    op.execute("DROP FUNCTION IF EXISTS set_updated_at() CASCADE;")

    # Drop extensions
    # op.execute('DROP EXTENSION IF EXISTS vector;')
    # op.execute('DROP EXTENSION IF EXISTS "uuid-ossp";')
