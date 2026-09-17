---
name: tripline-context-cost
description: Route TripLine repository context and control the cost of simulator, real-device, native-build, and computer-use verification. Use for project onboarding, documentation audits, cross-module investigation, or expensive device QA; skip for generic React Native advice.
---

# TripLine Context and Verification Cost

This skill chooses **how much evidence to load and how to verify**, not what product feature to build. For module implementation, also follow `tripline-module-development`; user instructions and actual acceptance requirements take priority over cost guidance.

## Enter with a narrow question

Read root `AGENTS.md`, current Git status and 1–3 recent commits. Read only the newest `docs/PROGRESS.md` entry. Use `docs/ROADMAP.md` for live status. Then identify the specific module, platform, and decision to make; open only the corresponding module/architecture/design sections. Search paths or line matches before opening long files. Treat `docs/HANDOFF.md` as navigation, never as a status source.

Read [context and cost policy](../../../docs/engineering/context-cost-policy.md) when planning onboarding, multi-file research, broad tests, real-device work, UI automation, or a native build. Its source-of-truth table and cost ladder are authoritative; do not copy them into each session.

## Choose the least expensive sufficient evidence

- Prefer existing code, Git diff, targeted tests and bounded logs for logic/configuration questions.
- For visual or platform behavior, reuse the running Metro, installed development build and existing simulator before starting a new build. Capture one meaningful before/after state per hypothesis; expand only when it changes the conclusion.
- Before a full native build, real-device session, long UI automation, or repeated computer screenshots, state the hypothesis, shortest test path, observable pass/fail signal and stopping condition. This is a planning check, **not a new permission gate** when the user has authorized the task.
- Never substitute Web preview for required native QA, nor simulator results for claimed real-device results. Run all checks required by the change and accurately label remaining coverage.

At handoff, record which evidence was reused, which checks actually ran, files changed, unresolved device gaps, and the next action. Do not claim a prompt-cache hit or token savings without actual usage telemetry. Stable instructions and focused reads improve the chance of reuse; they do not control Codex desktop caching.
