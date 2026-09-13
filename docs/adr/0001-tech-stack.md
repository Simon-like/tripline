# ADR 0001 · 技术栈决策（Monorepo + Expo SDK 55 + 本地优先数据层 + V2 NestJS）

- **Status**：Accepted
- **日期**：2026-09-13
- **Deciders**：Simon（批准）、Kimi（整理），论据来自 [05-技术栈调研](../../deliverables/research/05-技术栈调研.md)

## Context

- 项目由单人 + 多 AI agent 接力施工，需要低心智负担、强契约、可并行的工程结构。
- V1 无后端、全功能离线可用；V2 才引入云同步与账号。
- 产品必须双端落地（iOS + Android），且动画质感是核心卖点（方向 B「弹跳气泡」）。
- 共享数据需在无服务器条件下可用（导出码），并保留向云同步平滑演进的能力。

## Decision

1. **Monorepo**：pnpm workspaces + Turborepo；pnpm catalogs 统一锁版本；`.npmrc` 必须含 `node-linker=hoisted` 与 `public-hoist-pattern`（`*expo*`、`*react-native*` 等）。
2. **移动端**：Expo SDK 55（RN 0.83，New Architecture 强制）；**development build 为开发基线**；EAS Build 云打包；Expo Go 只做原型演示。
3. **共享契约**：`packages/shared` = Zod schema + `z.infer` 类型 + 导出码编解码 + 常量枚举；MUST 零平台依赖；MUST TS 源码直出不预构建。
4. **动画与图表**：Reanimated 4（弹簧只指定 `duration` + `dampingRatio`）+ Gesture Handler + Skia（粒子/彩带手写）；图表 victory-native。
5. **数据层 V1**：expo-sqlite（领域数据：UUID + createdAt/updatedAt/deletedAt 软删除 + schemaVersion + sync_queue 变更日志表）+ react-native-mmkv（设置/游标）；图片经 expo-image-manipulator 压缩后存沙盒，DB 只存路径。
6. **V1→V2 演进**：导出码（`{schemaVersion, payload, checksum}`）→ NestJS `sync/pull` + `sync/push`，冲突 last-write-wins（按 updatedAt）；后端 Drizzle + PostgreSQL + nestjs-zod；导出码导入 = 一次匿名 push，格式 v1 永久可读。
7. 目录结构：`apps/mobile`、`apps/api`（V2 才建）、`packages/shared|ui|config|db`（db 为 V2），详见 [ARCHITECTURE.md](../ARCHITECTURE.md)。

## Consequences

**正面**
- 前后端契约单一来源（Zod），V2 接后端时无需重写类型层。
- 本地 schema 自带 UUID/软删除/版本号，云同步演进几乎零迁移成本（id 不变、天然幂等）。
- Reanimated 4 弹簧语言与设计方向 B 完全同构，动画质感有架构保障。

**代价**
- dev build 首次构建成本高，无法享受 Expo Go 的秒级启动。
- 同步逻辑（sync_queue、last-write-wins）需自研，无现成框架。
- pnpm hoisted 配置是易踩坑点，新环境搭建必须核对 `.npmrc`。

**已接受的风险**
- SDK 55 新架构强制，个别老库可能不兼容——以 React Native Directory 检查为准入门槛，不兼容即换库。
- victory-native / Skia 依赖链较长，版本升级时需整链回归。
- Drizzle 生态比 Prisma 年轻，遇到问题文档可能较少——以 TypeScript 类型安全与 monorepo 共享图收益对冲。
