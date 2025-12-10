"""
Menu router - handles menu and menu items.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.database import get_db
from app.models import MenuCategory, MenuItem
from app.schemas import MenuCategoryWithItems, MenuItemRead, MenuItemCreate, MenuCategoryCreate
from app.auth import get_current_admin_user
from app.models import User

router = APIRouter(prefix="/menu", tags=["menu"])


@router.get("", response_model=List[MenuCategoryWithItems])
async def get_menu(db: AsyncSession = Depends(get_db)):
    """
    Get full menu with categories and items.
    Returns tree structure: categories with their items.
    """
    # Get all categories ordered by sort_order
    result = await db.execute(
        select(MenuCategory).order_by(MenuCategory.sort_order)
    )
    categories = result.scalars().all()
    
    # Get all items
    items_result = await db.execute(select(MenuItem))
    all_items = items_result.scalars().all()
    
    # Group items by category
    menu_data = []
    for category in categories:
        category_items = [item for item in all_items if item.category_id == category.id]
        menu_data.append(
            MenuCategoryWithItems(
                id=category.id,
                title=category.title,
                sort_order=category.sort_order,
                items=[MenuItemRead.model_validate(item) for item in category_items]
            )
        )
    
    return menu_data


@router.post("/categories", response_model=MenuCategoryWithItems, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_data: MenuCategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Create a new menu category (Admin only)."""
    category = MenuCategory(
        title=category_data.title,
        sort_order=category_data.sort_order
    )
    
    db.add(category)
    await db.commit()
    await db.refresh(category)
    
    return MenuCategoryWithItems(
        id=category.id,
        title=category.title,
        sort_order=category.sort_order,
        items=[]
    )


@router.put("/categories/{category_id}", response_model=MenuCategoryWithItems)
async def update_category(
    category_id: int,
    category_data: MenuCategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Update a menu category (Admin only)."""
    result = await db.execute(select(MenuCategory).where(MenuCategory.id == category_id))
    category = result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Категория не найдена"
        )
    
    # Update fields
    category.title = category_data.title
    category.sort_order = category_data.sort_order
    
    await db.commit()
    await db.refresh(category)
    
    # Get items for this category
    items_result = await db.execute(select(MenuItem).where(MenuItem.category_id == category_id))
    items = items_result.scalars().all()
    
    return MenuCategoryWithItems(
        id=category.id,
        title=category.title,
        sort_order=category.sort_order,
        items=[MenuItemRead.model_validate(item) for item in items]
    )


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Delete a menu category (Admin only)."""
    result = await db.execute(select(MenuCategory).where(MenuCategory.id == category_id))
    category = result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Категория не найдена"
        )
    
    await db.delete(category)
    await db.commit()
    
    return None


@router.post("/items", response_model=MenuItemRead, status_code=status.HTTP_201_CREATED)
async def create_menu_item(
    item_data: MenuItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Create a new menu item (Admin only)."""
    # Verify category exists
    result = await db.execute(select(MenuCategory).where(MenuCategory.id == item_data.category_id))
    category = result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Категория не найдена"
        )
    
    item = MenuItem(
        title=item_data.title,
        description=item_data.description,
        price=item_data.price,
        weight=item_data.weight,
        image_url=item_data.image_url,
        category_id=item_data.category_id,
        is_spicy=item_data.is_spicy,
        is_vegan=item_data.is_vegan
    )
    
    db.add(item)
    await db.commit()
    await db.refresh(item)
    
    return item


@router.put("/items/{item_id}", response_model=MenuItemRead)
async def update_menu_item(
    item_id: int,
    item_data: MenuItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Update a menu item (Admin only)."""
    result = await db.execute(select(MenuItem).where(MenuItem.id == item_id))
    item = result.scalar_one_or_none()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Блюдо не найдено"
        )
    
    # Update fields
    item.title = item_data.title
    item.description = item_data.description
    item.price = item_data.price
    item.weight = item_data.weight
    item.image_url = item_data.image_url
    item.category_id = item_data.category_id
    item.is_spicy = item_data.is_spicy
    item.is_vegan = item_data.is_vegan
    
    await db.commit()
    await db.refresh(item)
    
    return item


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_menu_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Delete a menu item (Admin only)."""
    result = await db.execute(select(MenuItem).where(MenuItem.id == item_id))
    item = result.scalar_one_or_none()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Блюдо не найдено"
        )
    
    await db.delete(item)
    await db.commit()
    
    return None

