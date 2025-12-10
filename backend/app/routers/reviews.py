"""
Reviews router - handles review creation and management.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List, Optional

from app.database import get_db
from app.models import Review, User
from app.schemas import ReviewCreate, ReviewRead
from app.auth import get_current_admin_user

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.get("", response_model=List[ReviewRead])
async def get_reviews(
    approved_only: bool = Query(True, description="Return only approved reviews"),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all reviews (public endpoint).
    By default returns only approved reviews.
    """
    query = select(Review)
    
    if approved_only:
        query = query.where(Review.is_approved == True)
    
    query = query.order_by(desc(Review.created_at)).limit(limit)
    
    result = await db.execute(query)
    reviews = result.scalars().all()
    
    return [ReviewRead.model_validate(review) for review in reviews]


@router.post("", response_model=ReviewRead, status_code=status.HTTP_201_CREATED)
async def create_review(
    review_data: ReviewCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new review (public endpoint).
    Reviews are created with is_approved=False and require admin moderation.
    """
    review = Review(
        author=review_data.author,
        rating=review_data.rating,
        text=review_data.text,
        image_url=review_data.image_url,
        is_approved=False  # Requires admin approval
    )
    
    db.add(review)
    await db.commit()
    await db.refresh(review)
    
    return review


@router.put("/{review_id}/approve", response_model=ReviewRead)
async def approve_review(
    review_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Approve a review (Admin only)."""
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Отзыв не найден"
        )
    
    review.is_approved = True
    await db.commit()
    await db.refresh(review)
    
    return review


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Delete a review (Admin only)."""
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Отзыв не найден"
        )
    
    await db.delete(review)
    await db.commit()
    
    return None


@router.get("/pending", response_model=List[ReviewRead])
async def get_pending_reviews(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Get pending (unapproved) reviews (Admin only)."""
    result = await db.execute(
        select(Review)
        .where(Review.is_approved == False)
        .order_by(desc(Review.created_at))
    )
    reviews = result.scalars().all()
    
    return [ReviewRead.model_validate(review) for review in reviews]

