# 03 · 业界体验细节调研报告

> 2026-09-17 调研，13 轮中英文检索。所有结论已按 TripLine 技术栈（Expo RN + Reanimated 4 + Skia，只动 transform/opacity，双主题，尊重减弱动效）过滤。

## 1. 移动端表单 UX

1. 3 个以上字段的表单禁用纯内联标签（placeholder 当 label）——输入后失去上下文；仅 1–2 字段可豁免。[Baymard Institute](https://baymard.com/blog/mobile-forms-avoid-inline-labels "citation")
2. 「标签在输入框上方」是眼动测试中完成速度最快、认知负荷最低的布局；浮动标签是兼顾空间的折中。[Concept7 Forms 101](https://concept7.nl/en/articles/forms-101-5-ux-best-practices-for-user-friendly-labels-in-forms "citation")
3. 实时校验可降错误率约 30–50%；反馈必须"颜色 + 图标 + 文字"三层冗余，不能只用红边。[UXPin](https://www.uxpin.com/studio/blog/ultimate-guide-to-microinteractions-in-forms/ "citation")
4. 键盘三件套：数字键盘配工具条（下一步/完成）、onSubmit 跳下一字段、点空白收键盘。[fatbobman](https://fatbobman.com/en/posts/textfield-event-focus-keyboard/ "citation")
5. 自动格式化代替校验报错（金额千分位、日期补斜杠）。[UXPin](https://www.uxpin.com/studio/blog/ultimate-guide-to-microinteractions-in-forms/ "citation")
6. 超一屏表单分段录入，每步一个视觉焦点。[Concept7](https://concept7.nl/en/articles/forms-101-5-ux-best-practices-for-user-friendly-labels-in-forms "citation")

## 2. 选择控件形式对比

1. 分段控件只用于"切换视图/即时生效"，选项 2–5 个、永远预选中一项。[Eleken](https://www.eleken.co/blog-posts/segmented-control-ui "citation"), [Mews](https://www.mews.design/latest/components/segmented-control/usage-KrIQ9zAv "citation")
2. 表单内单选：≤8 个短选项用 chip 组；需图标+描述的重要决策用卡片选择器。[Mews](https://www.mews.design/latest/components/segmented-control/usage-KrIQ9zAv "citation")
3. 底部动作列表适合"上下文相关的临时决策"（导入来源、分享渠道）。
4. 选中态必须显而易见：填充 + 字重 + 对比度 ≥4.5:1，浅色主题下不能只用浅灰底。[Eleken](https://www.eleken.co/blog-posts/segmented-control-ui "citation")
5. 单选按下响应 ≤150ms；选中弹跳（scale 1→1.06→1）是 M3 Expressive 标准语言。[Prototypr](https://blog.prototypr.io/googles-new-material-design-expressive-has-me-excited-worried-2cd295758804 "citation")
6. 微交互有可量化回报：Airbnb 心愿单心脏弹跳 + 彩带使收藏量一个月 +30%，成本约一人周。[微交互案例集](https://creditunionwebsolutions.com/ux-design/the-micro-interaction-that-made-users-smile-a-case-study-collection-of-delightful-ui-animations-and-their-measurable-impact/ "citation")

## 3. 旅行类 App 招牌细节

1. 携程「动态卡片」：同一卡片随时间变换信息重点（行前显示航站楼、临飞显示登机口、落地显示行李），使日程成为大入口。[携程 UX 实践](http://www.uml.org.cn/DevProcess/2015040811.asp "citation")
2. Polarsteps：杂志式时间轴 + 真实路径地图 + 自动统计，移动端 polish 品类之最。[对比评测](https://www.ventureout.life/blog/wanderlog-vs-polarsteps-vs-venture-out "citation")
3. Wanderlog：拖拽排序 + 地点元数据自动补全（评分/营业时间/交通时间）。[对比评测](https://www.wandrly.app/comparisons/wanderlog-vs-polarsteps "citation")
4. 国内共识：行程卡片应支持多级信息密度（极简/标准/详细）。[竞品分析](https://www.woshipm.com/evaluating/6185111.html "citation")
5. 拟态票据（机票样式卡片）提升信任感与收藏欲。[Pixso](https://pixso.cn/designskills/lvyouappmoban/ "citation")

## 4. 周期性总结/回顾页设计（重点）

1. Wrapped 黄金公式 = 个人数据 × 身份表达 × 一键分享；2024 Wrapped 首周 2.25 亿次分享、下载 +21%。[Green Frog Labs](https://greenfroglabs.com/blog/brand-awareness-campaign "citation")
2. 数据翻译成"生活时刻"而非罗列数字："1248 次下单"→"1248 个忙碌周一"。[Granth](https://granth.in/blog/why-spotify-wrapped-works-every-year-and-how-brands-can-create-their-own-wrapped-moment/ "citation"), [数英·支付宝账单复盘](https://www.digitaling.com/articles/33943.html "citation")
3. 极限数据（最早/最多/最晚）是最强记忆钩子。[中国消费者报](https://finance.sina.com.cn/jjxw/2026-01-07/doc-inhfnqzp4681603.shtml "citation")
4. 叙事结构：逐屏翻页 + 单一视觉焦点 + 情绪递进到高潮页。[站酷](https://m.zcool.com.cn/article/ZMTIxMzEwNA==.html "citation"), [人人秀](https://rrx.cn/content-s4tbjm "citation")
5. 分享卡片"3 秒可懂、无配文也成立"：大数字 + 渐变背景 + 身份标签。[Granth](https://granth.in/blog/why-spotify-wrapped-works-every-year-and-how-brands-can-create-their-own-wrapped-moment/ "citation")
6. Strava Year in Sport：模块化图形语言 + 多彩渐变，把数据做成"有节奏的庆典"。[Manual](https://manual.studio/work/strava "citation")
7. 仪式感收尾：末尾彩蛋/许愿/立 Flag——"写下一次旅行愿望"是低成本高情感动作。[梅花网](https://www.meihua.info/article/3548009862251520 "citation")

**RN 实现路径（已验证有开源参考）**：逐屏翻页 = 横向 FlatList + snapToInterval + 分页点；分享卡片 = 离屏渲染卡片 + `react-native-view-shot` 或 Skia `makeImageFromView` 截图 + `expo-sharing`（被截视图需 `collapsable={false}`）。[Wrapped RN 教程](https://dev.to/b42/implement-spotify-wrapped-slider-in-react-native-5edi "citation"), [react-native-view-shot](https://github.com/gre/react-native-view-shot "citation"), [Skia Snapshot Views](https://shopify.github.io/react-native-skia/docs/snapshotviews/ "citation")

## 5. 背景与留白装饰

1. 2025 主流 = "平层结构 + 局部渐变点缀"：主体平色，渐变只出现在 hero/卡片/强调元素。[Gradient vs Flat 2025](https://medium.com/@uixflowagency/gradient-design-vs-flat-design-what-looks-better-in-2025-4e7da7cf55af "citation")
2. 噪点渐变 = 平滑渐变 + 5–15% 噪点覆盖，消除"数码塑料感"；mesh gradient 给仪式感页面。[Atmosphere 指南](https://atmospherewallpaper.com/guides/grainy-mesh-gradient-design "citation")
3. 浅色避免"白得单调"：米白（如 #FAF8F5）+ tonal surface 色阶区分层级而非分割线。
4. 深色不要纯黑：深炭灰/藏青 + 轻微明度渐变。
5. 大号水印图形/几何装饰适合低频仪式感页面，不适合高频工具页。

## 6. 微交互与动效纪律

1. M3 Expressive：弹簧物理取代时长/缓动；物理反馈使操作成功率 +27%。[Prototypr](https://blog.prototypr.io/googles-new-material-design-expressive-has-me-excited-worried-2cd295758804 "citation")
2. 时长速查：按压 100–150ms、勾选 150–200ms、收藏类 300–400ms spring、校验 200–300ms；微交互最多两拍。[Art of Styleframe](https://artofstyleframe.com/blog/micro-interactions-ui-when-to-animate/ "citation"), [Noirbook](https://noirbook.org/topics/interaction-design "citation")
3. 只动 transform/opacity（与本项目红线一致）。
4. 骨架屏 vs spinner：结构可预测 → 骨架屏（感知速度 +20–40%）；结果未知 → spinner。[JSBits](https://www.jsbits.com/frontend-design/design-a-skeleton-loading-system "citation")
5. 触觉宁缺毋滥：只给重要确认。[Art of Styleframe](https://artofstyleframe.com/blog/micro-interactions-ui-when-to-animate/ "citation")
6. 级联入场 30–50ms 间隔，总编排 300–700ms。[Noirbook](https://noirbook.org/topics/interaction-design "citation")
7. 乐观 UI：勾选/打卡先更新界面再落库，失败回滚——弱网（旅行高发）下感觉"即时"。[Third Rock](https://www.thirdrocktechkno.com/blog/mobile-app-ui-ux-design-best-practices/ "citation")

## 7. 空状态与引导

1. 空状态三要素：为什么空 + 一个主按钮 + 场景插画；"暂无数据"是禁忌。[Mobbin](https://mobbin.com/glossary/empty-state "citation")
2. 空状态是最好的功能教育位：展示"填满后长什么样"。[925Studios](https://www.925studios.co/blog/saas-ux-design-complete-guide-founders-2026 "citation")
3. Coach marks 克制为"首次遇见热点"，每次只指 1–2 个元素。[UserTourKit](https://usertourkit.com/blog/progressive-disclosure-onboarding "citation")
4. 引导在动作发生时出现，不做开场连环灌输。[Digia](https://www.digia.tech/post/onboarding-patterns-progressive-disclosure-vs-front-loaded-setup/ "citation")
5. 错误型空状态与内容型分开设计：非指责语气 + 重试。[Setproduct](https://www.setproduct.com/blog/empty-state-ui-design "citation")

## 8. 图标与插画资产路线

1. RN 动画资产：`lottie-react-native`（成熟但 CPU 密集）vs Skia **Skottie**（GPU、.lottie 小文件、特性子集）——项目已有 Skia，Skottie 边际成本最低。[Skottie 文档](https://shopify.github.io/react-native-skia/docs/skottie/ "citation")（注：ARCHITECTURE 既定"不引 Lottie，粒子手写"，引入 Skottie 播放资产属新决策，需评审。）
2. Lottie 纪律：只用于仪式感/一次性时刻；高频交互用 Reanimated 代码实现。
3. 2025 图标：线性双色为主流功能图标；3D/黏土风只出现在奖励位（成就徽章/人设标签）。[Tech in Deep](https://www.techindeep.com/google-pixel-update-september-2025-material-3-expressive-redesign-70936 "citation")
4. 双主题插画策略：描边 + 有限色块 + token 化配色，一套资产适配双主题。

## 15 条借鉴总榜（感知价值 × 实现成本排序）

| # | 细节 | 用在哪 | 价值 | 成本 |
|---|---|---|---|---|
| 1 | 小结升级逐屏故事流 + 人设标签 + 可分享卡片 | 旅行小结 | ★★★★★ | 中 |
| 2 | 极限数据钩子（最早起的一天/最大一笔开销） | 旅行小结 | ★★★★★ | 极低 |
| 3 | 行程动态卡片（当前项展开/过去项压缩） | 行程 | ★★★★★ | 低 |
| 4 | 打卡/勾选乐观 UI | 清单、打卡 | ★★★★ | 低 |
| 5 | 勾选 morph + 弹簧 + 轻 haptic | 清单 | ★★★★ | 低 |
| 6 | 骨架屏替 spinner | 全局加载 | ★★★★ | 低 |
| 7 | 分类 chip 选中弹跳 | 记账 | ★★★★ | 极低 |
| 8 | 金额自动格式化 + 键盘工具条 | 记账 | ★★★★ | 低 |
| 9 | 空状态三要素 | 首页/清单/手账 | ★★★★ | 低 |
| 10 | 总结页 mesh gradient + 噪点 | 小结/卡头图 | ★★★★ | 低 |
| 11 | 列表级联入场 | 各列表 | ★★★ | 极低 |
| 12 | 大数字 odometer | 小结 | ★★★ | 中 |
| 13 | 首次热点 coach mark | 首次打卡/记账 | ★★★ | 中 |
| 14 | 表单标签置顶 + 三层校验 | 各表单 | ★★★ | 低 |
| 15 | 打卡成功庆祝动画升级 | 打卡/全清单 | ★★★ | 中 |

**一句话**：最大杠杆在旅行小结（#1/#2/#10/#12 合并实施）与行程动态卡片（#3）；其余是可顺手纳入组件层的微交互纪律。
