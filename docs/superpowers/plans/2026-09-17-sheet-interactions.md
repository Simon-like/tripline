# Bottom sheet interaction refinement implementation plan

> **For agentic workers:** Execute the steps in this task inline; the user has already authorized implementation. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give all TripLine bottom sheets an independently fading backdrop, a draggable grabber, calm keyboard handling, and picker-based itinerary time entry.

**Architecture:** Centralize modal animation and drag dismissal in `BottomSheet`. Keep existing screen-specific contents and data logic intact. Reuse `DatePickerSheet` for journey dates and add a dedicated `TimePickerSheet` for itinerary time.

**Tech Stack:** Expo SDK 55, React Native, Reanimated 4, Gesture Handler, existing semantic theme tokens.

## Global Constraints

- Do not change frozen `packages/shared` contracts or install native dependencies.
- Animate only transform and opacity; respect reduced motion and both themes.
- Preserve current route and storage behavior on iOS, Android, and web.
- Do not touch preexisting uncommitted preview artifacts.

---

### Task 1: Shared presentation

**Files:** Create `apps/mobile/src/components/BottomSheet.tsx` and `apps/mobile/src/components/sheetGesture.ts`; modify bottom-sheet call sites in home, journey form, checklist, itinerary, ledger, journal, share, import, and summary.

- [x] Add a focused test for drag dismissal: distance over 104 dp or downward velocity over 900 dp/s closes; short or upward drags return.
- [x] Implement an unanimated transparent native Modal containing separate backdrop opacity and panel translateY animations.
- [x] Make only the 44 dp grabber drag-enabled. On cancellation, spring back; on dismissal, animate out then invoke `onClose`.
- [x] Migrate each slide Modal without changing its content or confirmation dialogs.
- [x] Run lint and typecheck, then commit a coherent checkpoint.

### Task 2: Keyboard and time selection

**Files:** Modify `apps/mobile/app.json`, sheet form screens, and create `apps/mobile/src/components/TimePickerSheet.tsx`.

- [x] Remove all sheet `autoFocus` and outer `KeyboardAvoidingView` usage.
- [x] Keep sheet height stable; allow form content to scroll with iOS automatic keyboard insets, drag-to-dismiss keyboard, and Android pan layout mode.
- [x] Replace itinerary time TextInput with a 24-hour hour/minute picker; default to a useful time, preserve `HH:mm` schema format, and keep explicit confirmation.
- [x] Audit all visible date/time edit controls and confirm journey range dates already use `DatePickerSheet`.
- [x] Run focused checks and commit.

### Task 3: Home polish and handoff

**Files:** Modify `apps/mobile/app/index.tsx`, `apps/mobile/src/components/ProgressRing.tsx`, `packages/ui/src/theme.ts` if a new semantic color is needed, plus `docs/ROADMAP.md` and `docs/PROGRESS.md`.

- [x] Shrink the compact checklist count and ring percentage without changing tile dimensions.
- [x] Give the decorative sun a restrained warm color from a semantic token; leave the mountain decorative.
- [x] Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `git diff --check`.
- [x] Smoke-test affected flows on iOS and Android when local development builds are available; record exactly what was observed.
- [x] Update handoff records and commit.

Reference decisions: [Apple sheet grabber and swipe guidance](https://developer.apple.com/design/human-interface-guidelines/sheets), [React Native ScrollView keyboard insets and drag dismissal](https://reactnative.dev/docs/0.83/scrollview), [Expo Android pan mode](https://docs.expo.dev/guides/keyboard-handling/).
