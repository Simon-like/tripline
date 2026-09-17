# 06 · 中文字体落地成本调研

> 2026-09-17 调研（Simon 要求"先调研成本再接入"）。**结论速览：推荐路线 A——标题场景子集内嵌 MiSans（DemiBold + Heavy 两档）+ 正文走系统字体，包体积增量约 +0.5–1.5 MB，工时约 2–3 天。落地前有 2 件事需 Simon 拍板（见文末）。**

## 1. 候选字体授权对比

| 字体 | 免费商用 | App 内嵌 | 子集化合规 | 字重梯度 | 评价 |
|---|---|---|---|---|---|
| **MiSans** | ✅ 官方 FAQ 明确全球免费商用 | ✅ 明确允许（须软件中注明使用） | ⚠️ 协议禁"改编"，纯删字符属低风险但需人工复核 | 10 档（含 DemiBold≈SemiBold）+ 可变字体 | 与现有 token 声明一致，首选 |
| HarmonyOS Sans SC | ✅ | ✅ 条款与 MiSans 同模板（须显著注明） | ⚠️ 同上 | 多档 + 可变 | 备选；B 站桌面端有内嵌先例 |
| 思源黑体 / Noto Sans SC | ✅ OFL 1.1 | ✅ 明确允许 | ✅ **明确允许修改**（最干净） | 7 档，**缺 600 档** | 零授权风险备选 |
| 阿里巴巴普惠体 3.0 | ✅ | ⚠️ 未明确授予嵌入式权利 | ⚠️ | 9 档 | 不建议首选 |
| OPPO Sans 4.0 | ✅ | ⚠️ 未逐字明确，低风险 | ⚠️ 禁改编 | 5 档 | 可选但需复核 |

出处：[MiSans 官方 FAQ](https://hyperos.mi.com/font/zh/faq/ "citation")，[MiSans 许可协议 PDF](https://hyperos.mi.com/font-download/MiSans字体知识产权许可协议.pdf "citation")，[HarmonyOS Sans 协议全文](https://www.100font.com/thread-171.htm "citation")，[SIL OFL 解读](https://www.100font.com/thread-99.htm "citation")，[普惠体 3.0 法律声明](https://www.iconfont.cn/fonts/detail?cnid=adI1E7HF7yme "citation")，[ColorOS OPPO Sans 页](https://www.coloros.com/article/A00000050/ "citation")

注意：Google Fonts 的 Noto Sans SC 可变字体/unicode-range 分包方案**不适合 RN**——RN/Android 无按需加载机制，expo-font 打包完整单文件，RN 应走静态字重 + 子集化。

## 2. 体积成本

| 方案 | 体积（单字重） | 对 55MB APK 的影响 |
|---|---|---|
| 全量中文 ttf（思源 16–17MB / MiSans woff2 ≈4.9MB / HarmonyOS ttf 5MB+） | 5–17 MB | +18%~36%，**不可接受** |
| 3500 常用字子集 | woff2 0.2–1 MB / ttf 1–2 MB | 可接受 |
| App 文案子集（数百字） | 几 KB–几十 KB | 极小，但**正文不可用**——用户自由输入（地名如「夔门」「阆中」恰是生僻字高发区）缺字会变豆腐块 |

子集工具：推荐 **pyftsubset**（fonttools，工业标准、CI 友好）；Web 端可用 cn-font-split 分包；不推荐 fontmin（会破坏字体表）。动态子集需后端，V1 不成立，只能静态子集（字符清单 = 3500 常用字 ∪ 源码文案扫描）。

出处：[思源全量实测 16.9MB](https://www.cnblogs.com/smileZAZ/p/18838981 "citation")，[MiSans woff2 实测](https://hehehai.cn/posts/chinese-web-font-optimize "citation")，[子集压缩实测](https://www.livissnack.com/blog/web-font-subset-performance "citation")

## 3. RN 接入成本

- **expo-font config plugin 内嵌**（官方推荐）：app.json 声明路径，随原生构建打进包，启动即可用无闪跳；⚠️ **woff/woff2 仅 iOS 支持，子集产物必须导出 ttf**；需 dev build（已是基线 ✅）。[Expo Fonts 文档](https://docs.expo.dev/develop/user-interface/fonts/ "citation")
- **Android 字体回退链是最大隐性成本**：RN fontFamily 精确匹配，缺字不走家族内回退而走系统字体——若内嵌字体用于正文，用户输入生僻字会同行混排破版；`fontWeight:'600'` 不会自动映射 DemiBold 文件，每字重需独立 fontFamily 注册并做进组件封装。[RN 字体探究](https://keqingrong.cn/blog/2021-09-11-font-in-react-native-2/ "citation")
- **启动时间**：子集 ttf（≤1.5MB）原生注册开销毫秒级，不威胁 2s 冷启动预算；禁止全量内嵌。
- **Web 端**：config plugin 不覆盖 Web，需 useFonts 或 @font-face 指向 woff2（一次子集化脚本出 ttf + woff2 双产物）。

## 4. 路线对比与推荐

| 路线 | 体积增量 | 授权风险 | 工时 | 表现力 | 结论 |
|---|---|---|---|---|---|
| **A 标题子集内嵌 + 正文系统字体** | +0.5–1.5 MB | MiSans 低风险（思源零风险） | 2–3 天 | ★★★★ | ⭐ 推荐：80% 视觉收益，5% 成本 |
| B 全量/3500 字全场景内嵌 | +10–30 MB（或 +2–4MB 但用户输入混排破版） | 低 | 3–5 天 | ★★★★★ | ❌ 不推荐 |
| C 不内嵌，仅修字体栈映射 | +0 | 无 | 0.5–1 天 | ★★ | 过渡方案 |

**推荐路线 A + MiSans（DemiBold + Heavy）**：与 token 声明一致、有 SemiBold 级字重、授权明确允许内嵌（仅需关于页注明 + 保留协议副本）。Display/Body 组件分层：标题组件用内嵌字体（约 4000 字符子集兜底），正文与用户输入走系统栈。

**需 Simon 拍板两件事**：
1. **子集化合规复核**：MiSans 协议禁"改编"，纯删字符社区普遍按低风险执行；若要求零风险则改用思源黑体（代价：放弃 600 字重档）。
2. **标题缺字回退策略的验收标准**（标题遇子集外字符回退系统粗体是否可接受）。

**落地清单**（授权后执行）：pyftsubset 子集脚本（字符源：3500 常用字表 + 源码文案扫描）→ ttf（原生）+ woff2（Web）→ config plugin 注册 `MiSans-DemiBold`/`MiSans-Heavy` → Display 组件 fontFamily 映射 → 关于页字体署名 → 双端 dev build 回归（重点 Android 非华为机）。
