# Mock Apple Music Provider (Phase 8 – Block 0)

## Purpose

This directory contains the **temporary mock infrastructure** used to support
Phase 8 (Apple Music Search Integration) while live Apple Music API access
is blocked due to entitlement issues.

This mock system exists to:
- Verify **end-to-end search wiring**
- Verify **canonical normalization**
- Verify **error propagation**
- Enable downstream work (Phase 9, Phase 10) without violating phase governance

This is **verification infrastructure**, not product logic.

---

## Phase Governance

- **Phase 8** requires search integration to be fully wired and verified
- **Phase 9 (Playback Engine)** is locked until Phase 8 is COMPLETE
- Apple Music entitlement is currently BLOCKED externally

This mock system allows us to complete **all Phase 8 tasks that are not
externally blocked**, without redefining phases or bypassing Apple.

---

## What Is Mocked

- Apple Music **Catalog Search responses**
- Raw Apple-shaped payloads (NOT canonical)
- Success, empty, pagination-like, and error cases

Mock data mirrors the **Apple Music Catalog API schema** as closely as possible.

---

## What Is NOT Mocked

- Playback APIs
- Audio streams or previews
- Player state, controls, or timing
- Any Phase 9 functionality

Playback remains locked until Phase 8 is COMPLETE with live Apple data.

---

## Directory Structure

```txt
mock/
├── README.md            # This document (source of truth)
├── USAGE_LOG.md         # Append-only audit log of all mock usage
├── types.ts             # TypeScript types mirroring Apple payloads
├── data/
│   ├── search-success.json
│   ├── search-empty.json
│   ├── search-error.json
│   └── pagination-page-2.json
└── MockAppleMusicProvider.ts
