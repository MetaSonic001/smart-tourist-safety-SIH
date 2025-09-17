"""Initial migration - Create tables

Revision ID: 001
Revises: 
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Create users table
    op.create_table('users',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('username', sa.String(length=50), nullable=False),
        sa.Column('email', sa.String(length=100), nullable=False),
        sa.Column('full_name', sa.String(length=100), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=True),
        sa.Column('role', sa.String(length=20), nullable=False),
        sa.Column('phone', sa.String(length=20), nullable=True),
        sa.Column('keycloak_id', sa.String(length=100), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('user_id'),
        sa.UniqueConstraint('email'),
        sa.UniqueConstraint('username')
    )
    
    # Create onboarding_sessions table
    op.create_table('onboarding_sessions',
        sa.Column('session_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('entry_point', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('device_id', sa.String(length=100), nullable=True),
        sa.Column('location_data', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('tourist_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.PrimaryKeyConstraint('session_id')
    )
    
    # Create tourists table
    op.create_table('tourists',
        sa.Column('tourist_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('digital_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('pii_pointer', sa.Text(), nullable=False),
        sa.Column('consent_hash', sa.String(length=64), nullable=False),
        sa.Column('issued_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('opt_in_tracking', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('blockchain_tx_id', sa.String(length=100), nullable=True),
        sa.Column('entry_point', sa.String(length=50), nullable=False),
        sa.PrimaryKeyConstraint('tourist_id'),
        sa.UniqueConstraint('digital_id')
    )
    
    # Create indexes
    op.create_index(op.f('ix_tourists_digital_id'), 'tourists', ['digital_id'], unique=False)
    op.create_index(op.f('ix_tourists_issued_at'), 'tourists', ['issued_at'], unique=False)
    op.create_index(op.f('ix_sessions_status'), 'onboarding_sessions', ['status'], unique=False)
    op.create_index(op.f('ix_sessions_created_at'), 'onboarding_sessions', ['created_at'], unique=False)

def downgrade() -> None:
    op.drop_index(op.f('ix_sessions_created_at'), table_name='onboarding_sessions')
    op.drop_index(op.f('ix_sessions_status'), table_name='onboarding_sessions')
    op.drop_index(op.f('ix_tourists_issued_at'), table_name='tourists')
    op.drop_index(op.f('ix_tourists_digital_id'), table_name='tourists')
    op.drop_table('tourists')
    op.drop_table('onboarding_sessions')
    op.drop_table('users')
