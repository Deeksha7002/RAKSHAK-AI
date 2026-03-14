"""catch_up_baseline

Revision ID: e3ca7c6ea127
Revises: b52da8e477ec
Create Date: 2026-03-14 18:36:42.117559

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e3ca7c6ea127'
down_revision: Union[str, Sequence[str], None] = 'b52da8e477ec'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def column_exists(table_name, column_name):
    bind = op.get_bind()
    insp = sa.inspect(bind)
    columns = insp.get_columns(table_name)
    return any(c["name"] == column_name for c in columns)

def upgrade() -> None:
    # 1. Users table columns
    if not column_exists('users', 'webauthn_credentials'):
        op.add_column('users', sa.Column('webauthn_credentials', sa.JSON(), nullable=True))
    
    if not column_exists('users', 'role'):
        op.add_column('users', sa.Column('role', sa.String(), nullable=True, server_default='operator'))
        
    if not column_exists('users', 'last_login_at'):
        op.add_column('users', sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True))

    # 2. Refresh Tokens table handling
    bind = op.get_bind()
    insp = sa.inspect(bind)
    if 'refresh_tokens' in insp.get_table_names():
        if not column_exists('refresh_tokens', 'revoked'):
            op.add_column('refresh_tokens', sa.Column('revoked', sa.Boolean(), server_default='0'))
        if not column_exists('refresh_tokens', 'expires_at'):
            op.add_column('refresh_tokens', sa.Column('expires_at', sa.DateTime(timezone=True)))

    # 3. Cases table handling
    if 'cases' in insp.get_table_names():
        if not column_exists('cases', 'scam_type'):
            op.add_column('cases', sa.Column('scam_type', sa.String(), nullable=True))
        if not column_exists('cases', 'transcript'):
            op.add_column('cases', sa.Column('transcript', sa.Text(), nullable=True))
        if not column_exists('cases', 'auto_reported'):
            col_type = sa.Boolean()
            server_v = '1' if bind.dialect.name == 'sqlite' else 'TRUE'
            op.add_column('cases', sa.Column('auto_reported', col_type, server_default=server_v))

def downgrade() -> None:
    # Downgrade is empty as this is a 'Safe Baseline' catch-up
    pass
