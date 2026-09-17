# 01 · 美术资产与风格深挖报告

> 2026-09-17 走查。行号以当日工作区为准。结论先行：**项目的"骨架"（BottomSheet、DatePickerSheet、JourneyCarousel、JourneyTabBar）动效与设计成熟度很高；问题集中在内容呈现层——总结/分享/手账/流水四处是"白卡 + 文字"默认形态，21 个图标不足以支撑图形化表达，表单控件全线无焦点/错误动效。**

## 一、美术资产清单

### 1.1 图标系统（`packages/ui/src/Icon.tsx`）

内联 SVG，24×24 viewBox，stroke 2，round cap/join。全部 **21 个**：

- Tab 栏（5）：`luggage`、`map`、`wallet`、`notebook`、`plane`
- 清单分类（8）：`id-card`、`train`、`home`、`plug`、`pill`、`shirt`、`bankcard`、`sparkle`
- 功能/装饰（8）：`sun`、`mountain`、`party`、`plus`、`check`、`chevron-left`、`arrow-up-right`、`settings`、`moon`、`pencil`、`share`

**覆盖缺口**：无 时间/时钟、日历、照片/相机、心情、天气、餐饮、定位、垃圾桶、星星/收藏、同伴 图标。直接后果：行程时间、手账心情、账本六分类（只有彩色圆点）、删除入口（全项目用裸字符 `×` 与文字「删除」，如 `ledger.tsx`、`journal.tsx`）都只能纯文字表达。

### 1.2 设计 token（`packages/ui/src/theme.ts`）

- 21 个色 token × 浅深两套；主色紫 `#5B4FE9`、强调橙 `#FF6B4A`、庆祝黄 `#FFC93C`。
- 旅程色板 `lightJourneyPalettes` / `darkJourneyPalettes` 各 4 套 × 5 色，按 `index % 4` 分配。
- motion token：`instant:120 / standard:280 / expand:350 / celebrate:800 / stagger:40 / dampingRatio:0.72`。
- **缺口**：颜色全 token 化，但形状/排版尺度未 token 化——圆角（21~32、999 散写）、字号（10~38 散写）、间距（13/15/16/18/22/24 散写）、阴影（仅两处各写一份）。这是"细节上不够精致"的结构性原因之一。

### 1.3 图片/插画/纹理资产

**几乎为零**。`apps/mobile/assets/` 仅 3 张平台图标；无插画、无纹理、无空状态图。全 App 唯一的装饰性视觉是 `JourneyCarousel.tsx` 内手写 SVG `CardScene`（三层山峦 + 太阳，opacity 0.56）。

### 1.4 字体

- 真实加载仅 `PlusJakartaSans_700Bold`（数字）。
- **中文零字体文件**：`chineseFont` 只是系统字体栈声明——iOS PingFang SC、Android HarmonyOS Sans SC（仅华为机存在，其余回落系统默认）、Web MiSans。Expressive Pop 的字体表现力在非华为 Android 端不成立。

## 二、逐页面走查

### 首页 `app/index.tsx`
结构：品牌栏 → 36pt 大标题 → 风叶轮播大卡 → 双 Bento（倒计时黄卡 + 清单白卡）→ 编辑/删除文字链 → 橙色创建钮。背景色随轮播在 4 套 backdrop 间插值（全 App 最有想法的一处），但 backdrop 都极浅近白，变化几乎不可感知。双 Bento 卡静态色块 + 数字；空状态是大色块 + 一个 72pt 山图标，空旷；「编辑旅程/删除旅程」是裸文字链接，像被遗漏的脚注。

### 五 Tab 壳 `journey/[id]/_layout.tsx`
原生 header（返回 + 旅程名 + 状态胶囊 + 分享/铅笔）干净但素，无日期/倒计时信息增量。`JourneyTabBar` 悬浮玻璃胶囊 + 弹性指示器，是 Tab 间最有生命力的一处。

### 行程 `itinerary.tsx`
Day 横滚胶囊 + 时间轴（22pt 四色轮换圆点 + 灰色连接线 + 白卡）。StateBadge 三态打卡（弹簧缩放 + 彩带 + haptic）是**全项目反馈最好的交互**。问题：圆点颜色纯装饰轮换、与内容类型无关反而误导；空态是白卡 + 小图标 + 两行字；Day 胶囊横滚有裁切。

### 账本 `ledger.tsx`
紫色预算英雄卡（38pt RollingNumber + 进度条 + 预警胶囊）最有质感；分类分段占比条是仅有的图形化数据。问题：**流水条目六分类全靠圆点颜色区分、无图标，完全同质**；折线图无网格无标注，单日数据时"大片空白 + 一个孤点"，视觉灾难；「总预算 · 修改」可点性弱。

### 手账 `journal.tsx`
**最"文字化"的页面**。卡片 = 一段字 + 一排 72pt 小缩略图 + 文字胶囊；心情是自由文本无图标；无纸感/胶带/贴纸等手账语境装饰；单条内容时下半屏全空。照片查看器无手势滑动切图、无缩放，「上一张/下一张/关闭」全是裸文字按钮。

### 清单 `ChecklistPanel.tsx`（M02/M06 共用）
紫色英雄卡 + 104pt ProgressRing + 分组白条目，规整但平淡偏工具感。**勾选框 ✓ 是瞬间出现的字符、无动画**——全 App 最高频交互反馈最弱（仅文字变灰 + 删除线）；ProgressRing 百分比跳变无过渡。

### 返程 `return.tsx` + 旅行小结 `JourneySummarySheet.tsx`
**用户点名批评对象，现状实录**：BottomSheet 内 → 标题「把这一程，收进回忆」→ 三个淡紫统计胶囊（已去行程/见闻/照片）→ 一行预算文字 → **一个白卡装 9 行纯文字全文**（其中混入「照片数按手账中的记录统计，不代表本机可读取数量」工程向文案）→ 「复制文字总结」按钮。图形化元素 = 0：无图表、无照片、无旅程主题色（连现成的 journey palette 都没用），数字在胶囊和文本里重复出现两次。

### 其余组件速览
| 组件 | 现状要点 |
|---|---|
| `JourneyForm` | 统一 TextInput（border+bg+r16）；标签/同行人是**逗号分隔纯文本**；无焦点态、无图标；错误仅底部一行红字；日期是伪下拉 + DatePickerSheet |
| `BottomSheet` | 通用容器，弹簧入场 + 拖拽关闭，质量在线，全项目 10 处复用 |
| `TimePickerSheet` | 双列点选列表，**非滚筒**（无惯性吸附/居中指示线），选 0-59 分钟很重 |
| `DatePickerSheet` | 全项目最精致组件：范围色带、BounceCapsule Q 弹、切月动画 |
| `ShareSheet` / `ImportSheet` | 与小结同款"文字墙"；分享物只是一段文本；导入预览卡出现无动画 |
| `ConfettiCelebration` | 6 片方块彩带 800ms，合规但形状是方块非彩纸形 |
| `ProgressRing` | 静态无动画，percent 跳变 |
| `BouncyButton` | 按压 0.96 回弹，主按钮统一手感，好 |
| `FeaturePage` | 早期占位页组件仍在代码库（大图标 + 白卡两行字观感） |

## 三、表单与选择交互专项（15 处）

全项目所有输入框共享同一套样式，**全局无焦点态、无浮动标签、无输入图标，错误态只有一行红色小字**；选项类全部是"变色 chip"，**无一处有按压/弹跳反馈**。明细：

| 场景 | 形式 | 反馈缺口 |
|---|---|---|
| 旅程名称/预算/同行人/标签 | 纯文本框，标签逗号分隔 | 无焦点态；无结构化输入 |
| 出发/返程日期 | 伪下拉 → DatePickerSheet | 弹层精良；选后无确认动效 |
| 行程时间 | 伪下拉 → TimePickerSheet 点选 | 非滚筒，分钟选择成本高 |
| 记账金额 | decimal-pad + 正则 | 无千分位/大号回显 |
| 记账分类 / 手账标签 / 清单分类 | chip 变色 | 无缩放弹跳、无 haptic |
| Day 切换 | 横滚胶囊变色 | 无动效 |
| 主题选择 | 三枚卡片变色 | 无过渡 |
| 三态打卡 | 胶囊循环 | ✅ 全项目标杆 |

## 四、动画使用清单与荒漠区

已有：轮播插值（4 处）、TabBar 指示器、BottomSheet 弹簧、DatePicker 三处、BouncyButton、CascadeIn、彩带、打卡缩放、RollingNumber、趋势图入场；haptic 6 处，克制合规。

**动画荒漠**：清单勾选（最高频）、ProgressRing、手账全页、照片查看器、总结/分享/导入弹层内容（数字不滚动、不逐项入场）、主题切换、首页双 Bento 卡（倒计时数字不滚动——账本有 RollingNumber 却未复用）。

## 五、截图观感证据（`artifacts/preview/`）

- `ios-home-wind-carousel-final.png`：风轮大卡全场最佳；Bento 区下半屏素。
- `ios-review-m04.png`：「每天花多少」大片空白 + 一个橙孤点。
- `ios-m05-journal.png`：一条卡 + 按钮后下半屏全空；正文出现 `[?]` 缺字方框。
- `ios-foundation-summary.png`：三胶囊 + 文字墙，坐实"很文字化很一般"。
- [`datepicker-sheet-v2.png`](../../artifacts/preview/datepicker-sheet-v2.png)：全项目最成熟界面，可作工艺标杆。

## 六、现状诊断一句话

**骨架一流、皮肉单薄**：弹层/导航/轮播/日期四个骨架组件已达业界水准；内容层（总结、手账、流水、表单、勾选）停留在"能用的默认形态"，图标与插画资产储备撑不起 Expressive Pop 的表现野心，中文字体在 Android 端缺位。
