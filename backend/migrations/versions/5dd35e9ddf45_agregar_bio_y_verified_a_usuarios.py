"""Agregar bio y verified a usuarios

Revision ID: 5dd35e9ddf45
Revises: 1d0b9618e540
Create Date: 2025-08-12 22:28:01.266279

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '5dd35e9ddf45'
down_revision = '1d0b9618e540'
branch_labels = None
depends_on = None


def upgrade():
    # Check existing columns
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    # Get existing columns for conversations table
    conversations_columns = [col['name'] for col in inspector.get_columns('conversations')]
    
    with op.batch_alter_table('conversations', schema=None) as batch_op:
        if 'updated_at' not in conversations_columns:
            batch_op.add_column(sa.Column('updated_at', sa.DateTime(), nullable=True))
        if 'is_deleted' not in conversations_columns:
            batch_op.add_column(sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'))
        if 'deleted_at' not in conversations_columns:
            batch_op.add_column(sa.Column('deleted_at', sa.DateTime(), nullable=True))
        
        # Check column type before altering
        last_message_col = next((col for col in inspector.get_columns('conversations') if col['name'] == 'last_message_id'), None)
        if last_message_col and 'INTEGER' in str(last_message_col['type']):
            batch_op.alter_column('last_message_id',
                   existing_type=sa.INTEGER(),
                   type_=sa.String(length=26),
                   existing_nullable=True)
        
        batch_op.alter_column('created_at',
               existing_type=postgresql.TIMESTAMP(),
               nullable=False)
        
        # Check existing indexes
        existing_indexes = [idx['name'] for idx in inspector.get_indexes('conversations')]
        if 'ix_conversations_active' not in existing_indexes and 'is_deleted' in conversations_columns or 'is_deleted' not in conversations_columns:
            try:
                batch_op.create_index('ix_conversations_active', ['is_deleted', 'last_message_at'], unique=False)
            except:
                pass
        if 'ix_conversations_is_deleted' not in existing_indexes and 'is_deleted' in conversations_columns or 'is_deleted' not in conversations_columns:
            try:
                batch_op.create_index(batch_op.f('ix_conversations_is_deleted'), ['is_deleted'], unique=False)
            except:
                pass
        if 'ix_conversations_last_message_at' not in existing_indexes:
            try:
                batch_op.create_index(batch_op.f('ix_conversations_last_message_at'), ['last_message_at'], unique=False)
            except:
                pass
        if 'ix_conversations_user1' not in existing_indexes:
            try:
                batch_op.create_index('ix_conversations_user1', ['user1_id', 'last_message_at'], unique=False)
            except:
                pass
        if 'ix_conversations_user1_id' not in existing_indexes:
            try:
                batch_op.create_index(batch_op.f('ix_conversations_user1_id'), ['user1_id'], unique=False)
            except:
                pass
        if 'ix_conversations_user2' not in existing_indexes:
            try:
                batch_op.create_index('ix_conversations_user2', ['user2_id', 'last_message_at'], unique=False)
            except:
                pass
        if 'ix_conversations_user2_id' not in existing_indexes:
            try:
                batch_op.create_index(batch_op.f('ix_conversations_user2_id'), ['user2_id'], unique=False)
            except:
                pass
        
        # Check existing constraints
        existing_constraints = [con['name'] for con in inspector.get_unique_constraints('conversations')]
        if 'uq_conversation_users' not in existing_constraints:
            try:
                batch_op.create_unique_constraint('uq_conversation_users', ['user1_id', 'user2_id'])
            except:
                pass

    # Get existing columns for messages table
    messages_columns = [col['name'] for col in inspector.get_columns('messages')]
    
    with op.batch_alter_table('messages', schema=None) as batch_op:
        if 'message_type' not in messages_columns:
            batch_op.add_column(sa.Column('message_type', sa.String(length=20), nullable=False, server_default='text'))
        if 'updated_at' not in messages_columns:
            batch_op.add_column(sa.Column('updated_at', sa.DateTime(), nullable=True))
        if 'is_deleted' not in messages_columns:
            batch_op.add_column(sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'))
        if 'deleted_at' not in messages_columns:
            batch_op.add_column(sa.Column('deleted_at', sa.DateTime(), nullable=True))
        
        # Check column type before altering
        id_col = next((col for col in inspector.get_columns('messages') if col['name'] == 'id'), None)
        if id_col and 'INTEGER' in str(id_col['type']):
            batch_op.alter_column('id',
                   existing_type=sa.INTEGER(),
                   type_=sa.String(length=26),
                   existing_nullable=False)
        
        batch_op.alter_column('is_read',
               existing_type=sa.BOOLEAN(),
               nullable=False)
        
        # Check existing indexes
        existing_indexes = [idx['name'] for idx in inspector.get_indexes('messages')]
        if 'ix_messages_active' not in existing_indexes and 'is_deleted' in messages_columns or 'is_deleted' not in messages_columns:
            try:
                batch_op.create_index('ix_messages_active', ['is_deleted', 'created_at'], unique=False)
            except:
                pass
        if 'ix_messages_conversation' not in existing_indexes:
            try:
                batch_op.create_index('ix_messages_conversation', ['sender_id', 'receiver_id', 'created_at'], unique=False)
            except:
                pass
        if 'ix_messages_conversation_reverse' not in existing_indexes:
            try:
                batch_op.create_index('ix_messages_conversation_reverse', ['receiver_id', 'sender_id', 'created_at'], unique=False)
            except:
                pass
        if 'ix_messages_created_at' not in existing_indexes:
            try:
                batch_op.create_index(batch_op.f('ix_messages_created_at'), ['created_at'], unique=False)
            except:
                pass
        if 'ix_messages_is_deleted' not in existing_indexes and 'is_deleted' in messages_columns or 'is_deleted' not in messages_columns:
            try:
                batch_op.create_index(batch_op.f('ix_messages_is_deleted'), ['is_deleted'], unique=False)
            except:
                pass
        if 'ix_messages_is_read' not in existing_indexes:
            try:
                batch_op.create_index(batch_op.f('ix_messages_is_read'), ['is_read'], unique=False)
            except:
                pass
        if 'ix_messages_receiver_id' not in existing_indexes:
            try:
                batch_op.create_index(batch_op.f('ix_messages_receiver_id'), ['receiver_id'], unique=False)
            except:
                pass
        if 'ix_messages_sender_id' not in existing_indexes:
            try:
                batch_op.create_index(batch_op.f('ix_messages_sender_id'), ['sender_id'], unique=False)
            except:
                pass
        if 'ix_messages_timeline' not in existing_indexes:
            try:
                batch_op.create_index('ix_messages_timeline', ['created_at', 'id'], unique=False)
            except:
                pass
        if 'ix_messages_unread' not in existing_indexes:
            try:
                batch_op.create_index('ix_messages_unread', ['receiver_id', 'is_read', 'created_at'], unique=False)
            except:
                pass

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('messages', schema=None) as batch_op:
        batch_op.drop_index('ix_messages_unread')
        batch_op.drop_index('ix_messages_timeline')
        batch_op.drop_index(batch_op.f('ix_messages_sender_id'))
        batch_op.drop_index(batch_op.f('ix_messages_receiver_id'))
        batch_op.drop_index(batch_op.f('ix_messages_is_read'))
        batch_op.drop_index(batch_op.f('ix_messages_is_deleted'))
        batch_op.drop_index(batch_op.f('ix_messages_created_at'))
        batch_op.drop_index('ix_messages_conversation_reverse')
        batch_op.drop_index('ix_messages_conversation')
        batch_op.drop_index('ix_messages_active')
        batch_op.alter_column('is_read',
               existing_type=sa.BOOLEAN(),
               nullable=True)
        batch_op.alter_column('id',
               existing_type=sa.String(length=26),
               type_=sa.INTEGER(),
               existing_nullable=False)
        batch_op.drop_column('deleted_at')
        batch_op.drop_column('is_deleted')
        batch_op.drop_column('updated_at')
        batch_op.drop_column('message_type')

    with op.batch_alter_table('conversations', schema=None) as batch_op:
        batch_op.drop_constraint('uq_conversation_users', type_='unique')
        batch_op.drop_index(batch_op.f('ix_conversations_user2_id'))
        batch_op.drop_index('ix_conversations_user2')
        batch_op.drop_index(batch_op.f('ix_conversations_user1_id'))
        batch_op.drop_index('ix_conversations_user1')
        batch_op.drop_index(batch_op.f('ix_conversations_last_message_at'))
        batch_op.drop_index(batch_op.f('ix_conversations_is_deleted'))
        batch_op.drop_index('ix_conversations_active')
        batch_op.alter_column('created_at',
               existing_type=postgresql.TIMESTAMP(),
               nullable=True)
        batch_op.alter_column('last_message_id',
               existing_type=sa.String(length=26),
               type_=sa.INTEGER(),
               existing_nullable=True)
        batch_op.drop_column('deleted_at')
        batch_op.drop_column('is_deleted')
        batch_op.drop_column('updated_at')

    # ### end Alembic commands ###
