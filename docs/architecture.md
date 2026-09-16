# V1 Architecture

## Product constraint
Outfit recommendations must use wardrobe items the user actually owns. Selected items are locked constraints and cannot be replaced by the recommendation engine.

## Latency strategy

1. Process an image when an item is added, not every time an outfit is requested.
2. Persist structured attributes and embeddings so recommendation requests operate on compact precomputed data.
3. Keep wardrobe browsing, filtering, selection, and cached results local on the device where practical.
4. Use deterministic candidate filtering before expensive AI reasoning.
5. Profile ingestion and recommendation latency independently.

## Initial flow

```text
Mobile camera/gallery
        |
        v
Item ingestion
        |
        +--> image processing (next phase)
        |
        +--> structured wardrobe record
        |
        v
Wardrobe store
        |
        v
Candidate retrieval -> compatibility ranking -> top outfits
```

## V1 milestones

- Mobile wardrobe shell
- Camera/gallery item capture
- Wardrobe CRUD API and persistence
- Image preprocessing and clothing attributes
- One-item outfit generation
- Two/three-item locked outfit generation
- Caching, profiling, and on-device optimization
