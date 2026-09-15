# TripLine module playbook

## 1. Frame the increment

- Identify the M-number, current ROADMAP status, relevant EARS requirements, dependencies, and unresolved product choices.
- Separate product behavior, shared contract changes, persistence changes, and presentation changes.
- If a dependency contract is not frozen, use a typed mock at the boundary and record the assumption rather than coupling to unfinished internals.
- Name the exact files owned by the increment so concurrent work does not overlap.

## 2. Design before editing

- Reuse existing entity fields and pure functions before extending a schema. Check the reusable-assets inventory in [project-structure.md](project-structure.md) before writing new UI — checklist-style features should consume `ChecklistPanel` with a `phase` parameter, and celebration feedback should consume `ConfettiCelebration`, not a fourth copy.
- When a new entity is added, native and web persistence change as a pair in the same commit: SQLite CRUD, `PreviewStore` fields with backward-compatible backfill, and web `deleteJourney` cascade. A native-only change is a silent parity break.
- Demo seeding has two traps: the seeded flag can outlive the DB row (cold deep-link before visiting home shows an empty page), and templates added after existing installs need a backfill path (`ensureDemo*`-style existence check), not only create-time seeding.
- Define one public storage operation per user intent; keep transaction and cascade behavior inside the repository.
- Keep route screens thin: load data, coordinate state, compose components, and navigate.
- Cover empty, loading, failure, and restored/reopened states. Include reduced motion and light/dark behavior for visual changes.
- For cross-cutting or hard-to-reverse decisions, add a Proposed ADR before or with implementation.

## 3. Implement in checkpoints

1. Add or adjust pure logic and its focused tests.
2. Implement native and web persistence through matching APIs.
3. Build reusable UI, then integrate it into routes.
4. Run focused lint, typecheck, and tests.
5. Commit a coherent working checkpoint before starting a separate concern.

Never delete tests, relax types, modify historical deliverables, or edit an Accepted ADR to make the change fit.

## 4. Validate actual behavior

- Run repository checks: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `git diff --check`.
- iOS: start the development server, open the installed development build in the target simulator/device, and walk the changed path.
- Android: use `adb reverse tcp:8081 tcp:8081` for an emulator or USB device when needed, open the development build, and walk the same path.
- Exercise create/read/update/delete and restart persistence when data changes.
- Check both themes and reduced motion when the change touches design or animation.
- Save final screenshots only when they provide useful review evidence. A screenshot proves layout, not persistence or interaction.

## 5. Handoff checklist

- [ ] Behavior matches approved scope and unresolved choices remain explicit.
- [ ] Shared contracts remain frozen or have the required new review record.
- [ ] Native and web persistence adapters remain behaviorally aligned.
- [ ] Reusable logic/components were extracted at the correct layer.
- [ ] Accessibility labels, touch targets, safe areas, reduced motion, and light/dark themes were checked where relevant.
- [ ] Full lint, typecheck, tests, and diff check pass.
- [ ] iOS and Android evidence states exactly what was exercised.
- [ ] `ROADMAP.md` and a new top entry in `PROGRESS.md` are updated.
- [ ] The branch is runnable and Git commits form useful rollback points.
