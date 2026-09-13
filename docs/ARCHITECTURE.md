# ARCHITECTURE.md · 技术架构

> 本文档是技术架构的权威说明：写任何模块的**技术方案段之前必读**。结论来自调研底稿 [05-技术栈调研](../deliverables/research/05-技术栈调研.md)（本文件全文收录其结论表与红线，不再回查底稿）；重大取舍的决策理由见 [adr/0001-tech-stack.md](adr/0001-tech-stack.md)。

## Monorepo 目录树与包职责

```
tripline/
├── apps/
│   ├── mobile/        # Expo (RN) App，唯一面向用户的端（V1 唯一 app）
│   └── api/           # NestJS 后端（V2 才加入，M13 时创建）
├── packages/
│   ├── shared/        # Zod schema + z.infer 类型 + 导出码编解码 + 常量枚举；零平台依赖，TS 源码直出
│   ├── ui/            # RN 设计系统组件（Bento 卡、胶囊按钮、弹簧动画封装）
│   ├── config/        # tsconfig.base、eslint/biome、design tokens 构建配置
│   └── db/            # V2：Drizzle schema（M13 时创建）
├── pnpm-workspace.yaml
├── turbo.json
└── .npmrc             # node-linker=hoisted + public-hoist-pattern（*expo*、*react-native* 等）
```

| 包 | 职责 | 红线 |
|---|---|---|
| `apps/mobile` | 全部用户界面与设备能力 | 不直连后端（V1）；不绕过 shared 定义数据形状 |
| `apps/api` | V2 云同步与账号 | V2 前不存在，禁止提前创建 |
| `packages/shared` | 前后端唯一契约来源 | 零原生依赖、零平台 API；TS 源码直出（`"exports": { ".": "./src/index.ts" }`），不预构建 |
| `packages/ui` | 设计系统组件 | 只消费 token，不写死色值 |
| `packages/config` | 工程配置共享 | 不含业务逻辑 |

## 技术选型结论表（全文收录调研 05）

| 领域 | 选型 | 理由 | 风险 |
|---|---|---|---|
| Monorepo | pnpm + Turborepo | Expo 官方一等支持；Turbo 轻量 | pnpm 需 hoisted 配置 |
| 共享类型 | packages/shared + Zod | 校验+类型单一来源 | 须保持零平台依赖 |
| 移动端 | Expo SDK 55 / RN 0.83 | 当前稳定版，新架构强制 | 老库不兼容即报错 |
| 开发基线 | Development build + EAS | MMKV/Skia 都需原生代码 | 首次构建成本高 |
| 动画 | Reanimated 4 + Gesture Handler + Skia | 新弹簧 API 契合 M3 Expressive | worklet 学习曲线 |
| 图表 | victory-native (Skia) | GPU 60fps，活跃维护 | 依赖链较长 |
| 本地存储 | expo-sqlite + MMKV | 结构化 + 高速 KV | 同步逻辑自研 |
| 后端 ORM | Drizzle + PostgreSQL | TS 原生 schema | 生态比 Prisma 年轻 |
| 校验集成 | nestjs-zod | DTO/Pipe/Swagger 一体 | 第三方包依赖 |

补充：Expo 自 SDK 52 起 `expo/metro-config` 自动检测 workspaces，不需手写 watchFolders；SDK 55 起 New Architecture 强制且不可关闭；Android targetSdk 36 强制 edge-to-edge。

## shared 包契约规则

1. **零平台依赖**：不 import 任何 RN/Expo/Node API，纯 TypeScript + Zod。
2. **TS 源码直出**：不预构建；Metro 直接编译 workspace TS，Nest 侧 dev 用 tsx/SWC。
3. **单一来源**：数据结构只在这里定义；app 与未来的 api 都从 shared `z.infer` 取类型，禁止各自另写接口。
4. **接口冻结流程**：schema 第一版随模块技术评审通过后冻结 → 冻结后变更须发起新评审（说明影响面+迁移策略）→ 重大取舍提 ADR → 每次变更递增 `schemaVersion` 并提供迁移/upcaster。

## 数据层设计（V1）

组合：**expo-sqlite（领域数据）+ react-native-mmkv（设置/标记/同步游标）**。MMKV 同步读写快但无查询索引；结构化数据一律进 SQLite（WAL 模式）。图片用 expo-file-system 存沙盒目录，expo-image-manipulator 入库前压缩缩放转 JPEG，**DB 只存相对路径**。

### 表结构概要

所有领域表公共字段：`id`（UUID v4 客户端生成）、`createdAt` / `updatedAt`（毫秒时间戳）、`deletedAt`（软删除 tombstone，NULL=未删除）、`schemaVersion`。

| 表 | 关键业务字段 | 说明 |
|---|---|---|
| `journey` | name, startDate, endDate, budget, companions, tags | 旅程；状态由日期推导，不落库 |
| `checklist_item` | journeyId, category, title, checked, sortOrder | 行前清单与返程检查共用（以 category/类型字段区分） |
| `itinerary_item` | journeyId, date, time, content, note, state | state ∈ planned/visited/cancelled 三态 |
| `expense` | journeyId, amount, category, note, payer? | payer 为 M11 预留，V1 可空 |
| `journal_entry` | journeyId, text, photoPaths[], tags, mood?, timestamp | photoPaths 存沙盒相对路径数组 |
| `sync_queue` | entityType, entityId, operation, payload, createdAt | 变更日志表：所有写操作落一条，V2 上行的数据源 |

字段细节以 M00 技术方案段冻结的 shared Zod schema 为准，本表是结构意图不是最终契约。

## V1 → V2 云同步演进路径

1. **V1**：本地 schema 即带 UUID / updatedAt / 软删除 / schemaVersion；导出码 = `{schemaVersion, payload, checksum}` 编码串，含版本号与校验和。
2. **V2 接入**：`POST /sync/pull?since=<cursor>` + `POST /sync/push`（变更数组含 id/updatedAt/deletedAt）；冲突起步用 **last-write-wins**（按 updatedAt），服务端存 serverUpdatedAt 作游标。**导出码导入 = 一次匿名 push**。
3. **迁移路径**：V2 上线提供"导入导出码 → 注册账号 → 首启全量 push"：本地数据原样上行（id 不变，天然幂等）。
4. **schema 演进**：本地 SQLite 迁移脚本升 schemaVersion；服务端拒绝低版本 payload 或做 upcaster；导出码格式 v1 永久可读。

## 动画实现策略

- **Reanimated 4**：弹簧只指定 `duration` + `dampingRatio`（不手写 stiffness/damping），行为可预测；CSS animations/transitions 处理状态驱动动画，shared value + worklet 处理手势/滚动驱动。
- **粒子/彩带**：@shopify/react-native-skia + Reanimated 手写，不引 Lottie（控制资产体积）。
- **庆祝分级**：单项完成=对勾 morph+轻弹跳；整清单完成=彩带 600ms；整趟旅程完结=全屏庆祝+成就卡。
- **性能**：只动画 `transform`/`opacity`；所有动画闭环跑在 UI 线程；尊重系统"减弱动态效果"（替换为瞬时但可见的状态跳变，不是简单归零时长）。
- 动效参数与 12 条原则见 [CONTEXT.md](CONTEXT.md) 设计 token 节与其引用的调研 03。

## 双端兼容红线（10 条，全文收录，违反即 blocker）

1. 禁止硬编码状态栏/刘海高度，一律 useSafeAreaInsets()。
2. 所有文本必须指定自定义字体与显式 lineHeight。
3. Android 硬件返回键必须覆盖所有 Modal/抽屉/深层页面。
4. 键盘避让两端分开配置并分别真机验证，输入框被遮挡即 blocker。
5. 动画闭环必须跑在 UI 线程（Reanimated worklet / Skia），JS 线程动画不可接受。
6. 所有动画尊重系统"减弱动态效果"（Reduce Motion）设置。
7. 原生依赖必须全部通过 React Native Directory 新架构检查。
8. 深色模式不是可选：颜色全部走 token，禁止散落硬编码色值。
9. 图片入库前必须压缩并控制分辨率，DB 只存路径不存二进制。
10. Expo Go 只做原型演示；含 MMKV/Skia/推送的功能必须以 dev build 验证，发布前双端真机（含一台中端 Android）全量回归。

## 性能预算

| 指标 | 预算 |
|---|---|
| 冷启动 | ≤ 2s（本地数据） |
| 交互响应 | 清单勾选、Tab 切换 < 100ms，无白屏 |
| 动画 | 中端 Android 实机 60fps |
| 存储 | 照片压缩后单张 ≤ 200KB；总占用达 80% 触发预警 |
| 离线 | V1 全功能离线可用，零网络依赖 |
| 兼容性 | Android 7.0+（minSdk 24）；iOS 随 Expo SDK 55 基线 |

---

*架构级变更走 ADR（见 [adr/0000-adr-convention.md](adr/0000-adr-convention.md)）；本文档随之更新，但已接受的 ADR 原文不改。*
