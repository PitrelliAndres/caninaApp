"""Add device_tokens table for push notifications

Revision ID: add_device_tokens
Revises: <previous_revision>
Create Date: 2025-01-13

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_device_tokens'
down_revision = None  # TODO: Set to previous migration ID
branch_labels = None
depends_on = None


def upgrade():
    # Create device_platform enum
    device_platform = postgresql.ENUM('ios', 'android', 'web', name='device_platform', create_type=False)
    device_platform.create(op.get_bind(), checkfirst=True)

    # Create device_tokens table
    op.create_table('device_tokens',
        sa.Column('id', sa.String(length=26), nullable=False),
        sa.Column('user_id', sa.String(length=26), nullable=False),
        sa.Column('token', sa.String(length=255), nullable=False),
        sa.Column('platform', device_platform, nullable=False),
        sa.Column('device_id', sa.String(length=100), nullable=True),
        sa.Column('app_version', sa.String(length=20), nullable=True),
        sa.Column('os_version', sa.String(length=20), nullable=True),
        sa.Column('device_model', sa.String(length=50), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('last_used_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes
    op.create_index(
        'ix_device_tokens_user_active',
        'device_tokens',
        ['user_id', 'is_active'],
        unique=False
    )
    op.create_index(
        'ix_device_tokens_user_platform',
        'device_tokens',
        ['user_id', 'platform'],
        unique=False
    )
    op.create_index(
        'ix_device_tokens_token',
        'device_tokens',
        ['token'],
        unique=True
    )
    op.create_index(
        'ix_device_tokens_user_id',
        'device_tokens',
        ['user_id'],
        unique=False
    )


def downgrade():
    # Drop indexes
    op.drop_index('ix_device_tokens_user_id', table_name='device_tokens')
    op.drop_index('ix_device_tokens_token', table_name='device_tokens')
    op.drop_index('ix_device_tokens_user_platform', table_name='device_tokens')
    op.drop_index('ix_device_tokens_user_active', table_name='device_tokens')

    # Drop table
    op.drop_table('device_tokens')

    # Drop enum type
    device_platform = postgresql.ENUM('ios', 'android', 'web', name='device_platform')
    device_platform.drop(op.get_bind(), checkfirst=True)
