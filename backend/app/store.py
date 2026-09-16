from uuid import UUID

from .models import WardrobeItem, WardrobeItemCreate, WardrobeItemUpdate


class WardrobeStore:
    """Fast in-memory store for the first vertical slice.

    The interface intentionally isolates persistence so SQLite/Postgres can
    replace this implementation without changing the API contract.
    """

    def __init__(self) -> None:
        self._items: dict[UUID, WardrobeItem] = {}

    def list(self) -> list[WardrobeItem]:
        return sorted(self._items.values(), key=lambda item: item.created_at, reverse=True)

    def get(self, item_id: UUID) -> WardrobeItem | None:
        return self._items.get(item_id)

    def create(self, data: WardrobeItemCreate) -> WardrobeItem:
        item = WardrobeItem(**data.model_dump())
        self._items[item.id] = item
        return item

    def update(self, item_id: UUID, data: WardrobeItemUpdate) -> WardrobeItem | None:
        current = self.get(item_id)
        if current is None:
            return None
        updated = current.model_copy(update=data.model_dump(exclude_unset=True))
        self._items[item_id] = updated
        return updated

    def delete(self, item_id: UUID) -> bool:
        return self._items.pop(item_id, None) is not None


wardrobe_store = WardrobeStore()
