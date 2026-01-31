"""
Tables router - handles table management and hall map data.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.database import get_db
from app.models import Table
from app.schemas import TableRead, TableCreate
from app.auth import get_current_admin_user
from app.models import User

router = APIRouter(prefix="/tables", tags=["tables"])


@router.get("", response_model=List[TableRead])
async def get_tables(db: AsyncSession = Depends(get_db)):
    """
    Get all tables (for hall map rendering).
    Returns tables with coordinates (x, y, rotation) for SVG positioning.
    """
    result = await db.execute(select(Table).where(Table.is_active == True))
    tables = result.scalars().all()
    
    return [TableRead.model_validate(table) for table in tables]


@router.post("", response_model=TableRead, status_code=status.HTTP_201_CREATED)
async def create_table(
    table_data: TableCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Create a new table (Admin only)."""
    table = Table(
        table_number=table_data.table_number,
        zone=table_data.zone,
        seats=table_data.seats,
        x=table_data.x,
        y=table_data.y,
        rotation=table_data.rotation,
        is_active=table_data.is_active
    )
    
    db.add(table)
    await db.commit()
    await db.refresh(table)
    
    return table


@router.put("/{table_id}", response_model=TableRead)
async def update_table(
    table_id: int,
    table_data: TableCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Update a table (Admin only)."""
    result = await db.execute(select(Table).where(Table.id == table_id))
    table = result.scalar_one_or_none()
    
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Стол не найден"
        )
    
    # Update fields
    table.table_number = table_data.table_number
    table.zone = table_data.zone
    table.seats = table_data.seats
    table.x = table_data.x
    table.y = table_data.y
    table.rotation = table_data.rotation
    table.is_active = table_data.is_active
    
    await db.commit()
    await db.refresh(table)
    
    return table


@router.delete("/{table_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_table(
    table_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Delete a table (Admin only)."""
    result = await db.execute(select(Table).where(Table.id == table_id))
    table = result.scalar_one_or_none()
    
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Стол не найден"
        )
    
    await db.delete(table)
    await db.commit()
    
    return None

