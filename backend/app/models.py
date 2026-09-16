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


class WardrobeItemCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    category: ItemCategory = ItemCategory.other
    color: str | None = Field(default=None, max_length=60)
    image_uri: str | None = None


class WardrobeItemUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    category: ItemCategory | None = None
    color: str | None = Field(default=None, max_length=60)
    image_uri: str | None = None


class WardrobeItem(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    name: str
    category: ItemCategory
    color: str | None = None
    image_uri: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
