from datetime import datetime, timezone
from enum import Enum
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class ItemCategory(str, Enum):
    top = "top"
    bottom = "bottom"
    shoes = "shoes"
    outerwear = "outerwear"
    accessory = "accessory"
    other = "other"


class ClothingAnalysis(BaseModel):
    category: ItemCategory
    item_type: str = Field(min_length=1, max_length=80)
    primary_color: str = Field(min_length=1, max_length=60)
    secondary_colors: list[str] = Field(default_factory=list)
    pattern: str = Field(min_length=1, max_length=40)
    style_tags: list[str] = Field(default_factory=list)
    season_tags: list[str] = Field(default_factory=list)
    confidence: float = Field(ge=0, le=1)


class WardrobeItemCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    category: ItemCategory = ItemCategory.other
    color: str | None = Field(default=None, max_length=60)
    image_uri: str | None = None
    item_type: str | None = Field(default=None, max_length=80)
    secondary_colors: list[str] = Field(default_factory=list)
    pattern: str | None = Field(default=None, max_length=40)
    style_tags: list[str] = Field(default_factory=list)
    season_tags: list[str] = Field(default_factory=list)
    ai_confidence: float | None = Field(default=None, ge=0, le=1)


class WardrobeItemUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    category: ItemCategory | None = None
    color: str | None = Field(default=None, max_length=60)
    image_uri: str | None = None
    item_type: str | None = Field(default=None, max_length=80)
    secondary_colors: list[str] | None = None
    pattern: str | None = Field(default=None, max_length=40)
    style_tags: list[str] | None = None
    season_tags: list[str] | None = None
    ai_confidence: float | None = Field(default=None, ge=0, le=1)


class WardrobeItem(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    name: str
    category: ItemCategory
    color: str | None = None
    image_uri: str | None = None
    item_type: str | None = None
    secondary_colors: list[str] = Field(default_factory=list)
    pattern: str | None = None
    style_tags: list[str] = Field(default_factory=list)
    season_tags: list[str] = Field(default_factory=list)
    ai_confidence: float | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
