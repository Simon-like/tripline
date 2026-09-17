---
name: tripline-module-development
description: Plan, implement, refactor, review, or validate a TripLine product module in this repository while preserving its review gates, shared contracts, Expo React Native architecture, native/web storage parity, Expressive Pop design system, and handoff records. Use for M00-M17 module work or cross-module UI/data changes; do not use for generic React Native advice or device-only troubleshooting.
---

# TripLine Module Development

Use the repository as the source of truth. Do not reconstruct requirements from chat memory when a project document exists.

## Start from evidence

1. Read root `AGENTS.md`, current Git status and recent commits, then the newest entry in `docs/PROGRESS.md` and the relevant row in `docs/ROADMAP.md`. Use `tripline-context-cost` when investigating a broad area or planning expensive device work.
2. Read the relevant `docs/modules/Mxx-*.md`. Open only the needed sections of `docs/CONTEXT.md` for product/design, `docs/ARCHITECTURE.md` for technical boundaries, and `docs/WORKFLOW.md` for review/claim/handoff. Use `docs/MODULES.md` when choosing modules. Use the original PRD or `deliverables/` only to trace a decision; keep both read-only.
3. Preserve existing user work and establish a tested checkpoint before a broad change when the working tree is not already clean. State the module phase and authorization. Do not promote a review status unless Simon explicitly passes that gate. A direct instruction to implement authorizes construction, but does not silently mark requirements or acceptance complete.

Read [project-structure.md](references/project-structure.md) before choosing files. Read [module-playbook.md](references/module-playbook.md) before implementation or review.

## Keep boundaries clear

- Put route composition and screen orchestration in `apps/mobile/app/`.
- Put reusable app UI in `apps/mobile/src/components/`; keep pages from copying form, animation, navigation, or typography behavior.
- Put platform storage behind matching `database.ts` / `database.web.ts` or `storage.ts` / `storage.web.ts` APIs. Update both implementations in the same change.
- Put platform-free schemas, inferred types, calculations, and serialization in `packages/shared`. Treat frozen exports as contracts; changes need a new review and sometimes an ADR.
- Put reusable tokens and SVG icons in `packages/ui`. Consume semantic tokens in screens instead of scattering colors.
- Do not import another module's screen internals. Communicate through frozen shared entities or narrow reusable components.

## Preserve the product language

- Follow Expressive Pop: strong hierarchy, generous empty space, clear guidance, rounded surfaces, restrained delight.
- Use `TripText` for visible text, the explicit Chinese font stack, and no Chinese italics.
- Use `Icon` for icon positions; do not use Emoji as UI icons.
- Animate `transform` and `opacity`; prefer Reanimated duration plus damping ratio, respect reduced motion, and reserve haptics for confirmation moments.
- Maintain both light and dark semantic tokens. Validate automatic, light, and dark appearance when a change affects color.
- Keep the five journey tabs for journey functions. Settings, appearance, future account, and synchronization belong outside that tab bar.
- Develop with the Expo development build. Expo Go is not a valid check for MMKV, Skia, blur, notifications, or other native modules.

## Finish as a maintainable increment

1. Test pure domain and selection rules close to their implementation. Do not add tests that merely repeat rendering code.
2. Run focused checks while iterating, then `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `git diff --check` once before handoff.
3. Smoke-test affected flows on both iOS and Android development builds. Record exactly what was observed; do not claim a module passed when only the app shell loaded.
4. Update `docs/CONTEXT.md` for global facts, add an ADR for a durable tradeoff, update the relevant module document, and always update `docs/ROADMAP.md` plus a new top entry in `docs/PROGRESS.md`. Keep `README.md` in sync when delivered features, setup, debugging, native configuration, or packaging steps change.
5. Commit coherent checkpoints with Chinese outcome-oriented messages. Leave a clean, runnable main branch or document the exact recovery path.

Use the completion checklist in [module-playbook.md](references/module-playbook.md) when reporting the result.
