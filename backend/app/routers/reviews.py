"""
Reviews router - handles review creation and management.
"""

import json
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_admin_user
from app.database import get_db
from app.models import Review, User
from app.schemas import ReviewCreate, ReviewRead

router = APIRouter(prefix="/reviews", tags=["reviews"])


def map_review_to_schema(review: Review) -> ReviewRead:
    """
    Helper to convert DB model to Pydantic schema,
    parsing the JSON string back to a list.
    """
    images = []
    if review.images_json:
        try:
            images = json.loads(review.images_json)
        except Exception:
            images = []

    return ReviewRead(
        id=review.id,
        author=review.author,
        rating=review.rating,
        text=review.text,
        images=images,
        created_at=review.created_at,
        is_approved=review.is_approved,
    )


@router.post("", response_model=ReviewRead, status_code=status.HTTP_201_CREATED)
async def create_review(review_data: ReviewCreate, db: AsyncSession = Depends(get_db)):
    # Сериализуем список картинок в строку JSON для БД
    images_json_str = json.dumps(review_data.images) if review_data.images else "[]"

    # ЛОГИКА МОДЕРАЦИИ:
    # Если рейтинг >= 4, публикуем сразу (True). Иначе - на модерацию (False).
    should_auto_approve = review_data.rating >= 4

    review = Review(
        author=review_data.author,
        rating=review_data.rating,
        text=review_data.text if review_data.text else "",
        images_json=images_json_str,
        is_approved=should_auto_approve,  # <-- Используем переменную
    )

    db.add(review)
    await db.commit()
    await db.refresh(review)

    return map_review_to_schema(review)


@router.get("", response_model=List[ReviewRead])
async def get_reviews(
    approved_only: bool = Query(True, description="Return only approved reviews"),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all reviews.
    """
    query = select(Review)

    if approved_only:
        query = query.where(Review.is_approved == True)

    query = query.order_by(desc(Review.created_at)).limit(limit)

    result = await db.execute(query)
    reviews = result.scalars().all()

    # Преобразуем модели SQLAlchemy в Pydantic схемы с парсингом JSON
    return [map_review_to_schema(r) for r in reviews]


@router.put("/{review_id}/approve", response_model=ReviewRead)
async def approve_review(
    review_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Approve a review (Admin only)."""
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()

    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Отзыв не найден"
        )

    review.is_approved = True
    await db.commit()
    await db.refresh(review)

    return map_review_to_schema(review)


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Delete a review (Admin only)."""
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()

    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Отзыв не найден"
        )

    await db.delete(review)
    await db.commit()

    return None


@router.get("/pending", response_model=List[ReviewRead])
async def get_pending_reviews(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Get pending (unapproved) reviews (Admin only)."""
    result = await db.execute(
        select(Review)
        .where(Review.is_approved == False)
        .order_by(desc(Review.created_at))
    )
    reviews = result.scalars().all()

    return [map_review_to_schema(r) for r in reviews]
