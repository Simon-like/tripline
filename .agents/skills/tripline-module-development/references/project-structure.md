# TripLine project structure

## Repository map

| Path | Responsibility | Boundary |
|---|---|---|
| `apps/mobile/app/` | Expo Router screens and route layouts | Compose state and navigation; extract repeated UI |
| `apps/mobile/app/index.tsx` | Home journey selection, creation, overview | Keep journey ordering and capacity rules in pure helpers |
| `apps/mobile/app/journey/[id]/` | Five journey-scoped feature routes | Always read the route journey ID; keep the five-tab shell stable |
| `apps/mobile/src/components/` | Reusable mobile components | Theme-aware and accessible; no direct database ownership |
| `apps/mobile/src/data/database.ts` | SQLite repository for native builds | Same public API as the web adapter |
| `apps/mobile/src/data/database.web.ts` | Browser local-storage adapter | Preserve cascade/delete and behavior parity with SQLite |
| `apps/mobile/src/data/` pure helpers | App-level selection and derived view rules | No React or platform dependencies |
| `apps/mobile/src/settings/` | MMKV and web setting adapters | Same keys, defaults, and public API on both platforms |
| `apps/mobile/src/theme.tsx` | Resolves automatic/light/dark choice | Reads semantic tokens from `packages/ui` |
| `packages/shared/src/` | Zod entities, inferred types, domain logic, export code | Zero platform dependencies; frozen exports are cross-module contracts |
| `packages/ui/src/` | Light/dark tokens, journey palettes, SVG `Icon` | No screen-specific state or data access |
| `packages/config/` | Shared TypeScript configuration | Tooling only |
| `docs/modules/` | Requirement and technical lifecycle per module | Follow its template and gate labels |
| `docs/adr/` | Durable architecture decisions | Accepted records are immutable; supersede with a new ADR |
| `artifacts/preview/` | Reproducible visual verification evidence | Keep only useful final evidence |

## Placement rules

- A calculation used by more than one feature belongs in `packages/shared` when it is platform-free and part of domain behavior.
- A mobile-only selection or presentation rule belongs beside mobile data helpers, with a focused test.
- A visual primitive reused by multiple pages belongs in `apps/mobile/src/components`; a globally reusable icon or token belongs in `packages/ui`.
- Any native/web persistence mutation must be implemented and reviewed as a pair.
- New native dependencies require New Architecture compatibility review and a rebuilt development build on both platforms.

## Current navigation shape

Home owns journey discovery, the complete journey manager, settings access, and future account entry. A selected journey opens the five-tab shell: checklist, itinerary, ledger, journal, and return. Do not add a sixth tab for global functions.
