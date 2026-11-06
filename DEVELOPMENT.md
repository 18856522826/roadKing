# 《地平线狂飙：无尽公路》(Horizon Overdrive) 开发与架构文档 (DEVELOPMENT.md)

## 一、项目概述

**《地平线狂飙：无尽公路》(Horizon Overdrive)** 是一款基于 React 18 与 Three.js (r162) 构建的独立原创 3D 街机公路竞速驾驶游戏。

本项目已完成 **100% 净室化工程改造（Cleanroom De-cloning）、全套品牌与暗黑霓虹视觉重塑、3D 车型与骑手模型升级、第一人称赛车手套序列帧重绘，以及原创街机核心玩法（NOS 氮气加速推进 + 惊险超车连击与计分系统）实装**：

1. **工程净室化与第三方宿主残余清零**：
   - 彻底删除了旧版遗留的平台插件与死代码文件（`toy-follow.js`、`toy-fan.js`、`toy-pc.js`、`toy-container.js`、`toy-follow.css`、`toy-fan.css`、`toy-pc.css`、`home-bg.jpg`）。
   - 全新编写原生视口自适应模块 [`viewport.js`](file:///d:/AI项目集合/赛车游戏/assets/js/viewport.js)（`window.HorizonDriveAutoOrientation`）与桌面端键鼠交互模块 [`desktop-controls.js`](file:///d:/AI项目集合/赛车游戏/assets/js/desktop-controls.js) + [`desktop-controls.css`](file:///d:/AI项目集合/赛车游戏/assets/css/desktop-controls.css)。
   - 将 [`boot.js`](file:///d:/AI项目集合/赛车游戏/assets/js/boot.js) 从 2,171 行冗余代码精简重构至 480 行高内聚原生配置与车库交互模块（`window.HorizonDriveSettings`，本地持久化键名 `horizon-drive-settings-v1`）。
   - 全局引擎命名空间统一迁移为 `window.__HD_VENDOR__`、`window.__HD_MODELS__`、`window.__HD_MAPS__`，并移除了 [`drive.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js) 中冗余的 121 KB 重复物理循环代码与平台白名单锁。
2. **品牌标识、UI 视觉主题与纯 CSS 动态 3D 地平线背景重塑**：
   - 彻底清除了所有旧版网络玩梗文案与标识，确立独立品牌 **《地平线狂飙：无尽公路》(Horizon Overdrive)**。
   - 移除静态截图背景，在 [`index.html`](file:///d:/AI项目集合/赛车游戏/index.html) 与 [`boot.css`](file:///d:/AI项目集合/赛车游戏/assets/css/boot.css) 中打造纯 CSS 动态合成波地平线背景（`.horizon-backdrop`：包含落日霞光、脉冲星辰、远山剪影与无限透视滚动的 3D 公路网格线）。
   - 全局 UI（[`boot.css`](file:///d:/AI项目集合/赛车游戏/assets/css/boot.css) 与 [`drive.css`](file:///d:/AI项目集合/赛车游戏/assets/css/drive.css)）全面升级为 **暗黑碳纤维 + 赛博电光青 (`#00e5ff`) + 氮气烈焰橙 (`#ff6d00`)** 街机竞速主题。
   - 四款座驾全面重命名并赋予专属车型定位：
     - **01 疾风 GT 轿跑 (`sedan`)**
     - **02 幻影重机 (`motorcycle`)**
     - **03 天穹 V8 飞车 (`jet`)**
     - **04 泰坦重型卡车 (`truck`)**
3. **3D 载具、骑手头盔与高速路牌模型重塑**：
   - **泰坦重型卡车 (`truck`)**：移除车头旧版汉字贴图，升级为深海蓝底配电光青描边的 `"TITAN V12"` 车头铭牌，并新增 **前部重型镀铬防撞牛栏（Bullbar）**、**车顶四联装高流明探照灯排（Lightbar）** 与 **驾驶室后方双侧直立镀铬排气管（Dual Exhaust Stacks）**。
   - **疾风 GT 轿跑 (`sedan`)**：车漆由灰绿色升级为高饱和度 **冰川金属蓝 (`#2b7de9`)**，并加装 **前唇扰流板（Front Splitter）**、**运动侧裙（Side Skirts）**、**尾部扩散器** 与 **双立柱碳纤维 GT 大尾翼（Rear GT Wing）**。
   - **天穹 V8 飞车 (`jet`)**：在 [`drive-models.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive-models.js) 中升级金属拉丝与等离子喷口发光材质。
   - **幻影重机 (`motorcycle`) 与赛博骑手 (`Jp`)**：移除 `co.face` 手绘搞笑呆脸贴图，将骑手服装升级为深色碳纤连体赛车服 (`#1e293b`)，并在头部骨骼节点程序化生成 **流线型全覆式赛车头盔 + 发光电光青护目镜 (`#00e5ff`)**。
   - **高速龙门架与车内数字仪表**：龙门架路牌升级为 `"地平线高速 / HORIZON EXPRESSWAY"`；车内液晶屏升级为 `"HORIZON / GT"` 并实时显示氮气能量条、当前积分与连击倍率。
4. **第一人称手绘风格双手握方向盘序列帧还原与对齐**：
   - 将 `1254×1254`（3×3 九宫格）第一人称打方向盘精灵图 [`driver-turns-v3.png`](file:///d:/AI项目集合/赛车游戏/assets/images/driver-turns-v3.png) 与 3D 驾驶舱手臂材质（`ns` / `Gi`）恢复为与车内仪表台 SVG 线条画风完全统一的原版手绘双手握方向盘序列图，并在 [`drive.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js) 与 [`index.html`](file:///d:/AI项目集合/赛车游戏/index.html) 中追加 `?v=20261101b` 防缓存参数。
5. **原创街机核心玩法（NOS 氮气加速推进 + 惊险超车连击与计分系统）**：
   - **主动氮气推进系统 (`NOS Boost`)**：桌面端按 `Shift` / `N` 键或点击右下角踏板上方的 `NOS` 按钮即可在氮气能量 `>= 15%` 时激活氮气推进。激活期间每秒消耗 `28%` 能量，提供强劲推背感加速度并将最高车速上限提升 `+65 km/h`（常态突破至 `365 km/h`），同时第一/第三人称相机视野 FOV 动态拓宽 `+10°` 强化极速视觉冲击；未开启时每秒自动缓慢充能 `+7%`。
   - **惊险超车连击 (`Near-Miss Combo`) 与实时积分 (`Score`)**：高速行驶（`>= 80 km/h`）贴近社会车辆（横向净距 `< 1.45m`）完成无碰撞超车时，触发 `⚡ 惊险超车 ×N` 连击，奖励 `150 × min(连击数, 5)` 积分（单次封顶 `750` 分）并瞬间回复 `+22%` 氮气能量；普通超车奖励 `+50` 积分与 `+6%` 氮气，且已有连击温和衰减 `1` 层；发生碰撞扣血时重置当前连击并关闭氮气。左上角行程卡片与结算面板实时展示当前总分与连击徽章。
6. **CrazyGames 平台一键直进模式（Instant Play）与游戏内热切换闭环**：
   - **零前置菜单直接进入 3D 驾驶 (`mode: "running"`)**：[`index.html`](file:///d:/AI项目集合/赛车游戏/index.html) 默认注入 `data-game-mode="normal"` 跳过外部静态主菜单，且 [`drive.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js) 在 3D 场景与贴图就绪的瞬间自动触发 `o.current.start()` 直接进入 `running` 驾驶状态，彻底消除了首屏“出发！”二次确认遮罩。
   - **游戏内顶栏快捷操作组 (`🚗 换车` / `⚙️ 设置`)**：驾驶界面左上角常驻 `🚗 换车`（快捷键 `G`）与 `⚙️ 设置` 按钮；打开 3D 车库或设置弹窗时自动通过 `horizon-ad-state` 暂停底层物理与音效，关闭时自动恢复驾驶；在车库内点击“驾驶这辆座驾”可直接在游戏内热重载新车型并立即开跑。
   - **首次交互音频自动解锁与 CrazyGames 合规防护**：首次按下方向键/油门或点击屏幕时自动唤醒 WebAudio 引擎合成声浪与车载电台 BGM；内置右键菜单拦截、方向键/空格防滚屏及 `window.HorizonCrazyGames` SDK v3 生命周期（`loadingStart` / `loadingStop` / `gameplayStart` / `gameplayStop`）自适应桥接。
   - **标准发行包**：根目录已生成符合 CrazyGames 规范的 [`HorizonOverdrive-CrazyGames.zip`](file:///d:/AI项目集合/赛车游戏/HorizonOverdrive-CrazyGames.zip)（根目录直含 `index.html` 与 `assets/`）。
7. **座驾积分解锁系统（车库积分钱包）**：
   - 驾驶中每次超车得分（惊险超车 `150 × 连击`、普通超车 `+50`）都会**实时存入车库积分钱包**并跨局累计；换车、回到主页、关闭页面都不会丢失积分。
   - 只有 **01 疾风 GT 轿跑** 是初始免费座驾，其余座驾需在车库里消耗积分解锁（价格见第三章第 3 节）；解锁需点两次确认，防止误触扣分。
   - 结算面板额外显示“车库积分余额”，告诉玩家积分会带到下一局。
8. **全量中英双语国际化系统（English / 简体中文，默认英语 `en`）**：
   - **默认英语 (`en`) 与持久化**：首次进入游戏默认以英语展示（`<html lang="en" data-lang="en">`），语言偏好持久化于 `HorizonDriveSettings`（`horizon-drive-settings-v1` 的 `lang` 字段），跨局与刷新自动记忆。
   - **双入口零刷新热切换**：
     - 驾驶界面左上角快捷操作组（`.hud-quick-actions`）新增一键切换按钮（英文下显示 `🌐 中文`，中文下显示 `🌐 EN`）。
     - 驾驶偏好设置面板（`.game-settings-panel`）首行新增 `Language / 界面语言`（`English` / `中文`）分段开关。
   - **全栈响应式覆盖（静态 DOM + React HUD + 28 赛段 + 3D 动态路牌 Canvas）**：切换语言时派发 `horizon-lang-change` 事件，100% 实时同步 HTML 静态节点（`data-i18n` / `data-i18n-aria` / `data-i18n-title`）、桌面端顶部键位提示条与转向灯拨杆伪元素、28 个主题地图赛段名、React 驾驶 HUD 与提示横幅，以及 **3 处 Three.js 3D 场景 Canvas 动态贴图**（高速龙门架 `drawGantrySign`、分岔路口指示牌 `drawForkSign`、对手摩托挑衅气泡 `drawBikeTaunt`）。

---

## 二、目录结构与核心资产清单

```text
d:\AI项目集合\赛车游戏\
├── index.html                        # 游戏主页面（含纯 CSS 动态 3D 地平线合成波背景、主菜单与车库面板）
├── server.py                         # 本地零依赖 HTTP 静态资源服务脚本（HorizonDriveHTTPRequestHandler）
├── 启动游戏.bat                      # Windows 一键启动批处理脚本
├── DEVELOPMENT.md                    # 全局开发与架构文档
└── assets/
    ├── audio/
    │   ├── bgm.mp3                   # 游戏背景音乐 (2.61 MB)
    │   ├── horn.mp3                  # 原始双音真车喇叭采样 / 泰坦重卡双通道降调气喇叭音源 (9.6 KB)
    │   ├── horn-sedan.mp3            # 01 疾风 GT 轿跑专属欧系 Bosch 双音蜗牛喇叭真车采样 (5.0 KB)
    │   ├── horn-moto.mp3             # 02 幻影重机专属日系 Nikko 70mm 单音扁平铁饼电喇叭真车采样 (2.9 KB)
    │   └── horn-jet.mp3              # 03 天穹 V8 飞车专属意式超跑 FIAMM 高音双号角真车采样 (4.4 KB)
    ├── css/
    │   ├── boot.css                  # 动态 3D 地平线背景与主菜单/车库/设置样式 (暗黑碳纤 + 霓虹青橙主题)
    │   ├── drive.css                 # 驾驶室 HUD、NOS 氮气按钮、惊险连击徽章、方向盘/踏板与后视镜样式
    │   ├── desktop-controls.css      # 桌面端键盘操作指南浮窗与底部提示条样式
    │   └── arcade-ui.css             # 极简街机风 UI 主题层（最后加载）：统一覆盖 HUD 默认布局、结算面板、车库、设置与加载页外观
    ├── images/
    │   ├── favicon.svg               # 地平线狂飙霓虹青橙跑车矢量图标
    │   ├── driver-turns-v3.png       # 第一人称手绘风格双手 + 方向盘 9 帧精灵序列图 (1254×1254)
    │   ├── steering-real.png         # 疾风 GT 轿跑拟真方向盘贴图
    │   ├── truck-wheel-v1.png        # 泰坦重型卡车方向盘贴图
    │   ├── motorcycle-bar-v1.png     # 幻影重机车把贴图
    │   ├── motorcycle-base-v1.png    # 幻影重机仪表底座贴图
    │   ├── bike-wheelie-v1.png       # 幻影重机翘头 (Wheelie) 特技按钮图标 (256×256)
    │   ├── bike-stoppie-v1.png       # 幻影重机翘尾 (Stoppie) 特技按钮图标 (256×256)
    │   ├── automatic-shifter.png     # 自动挡把 (P/R/N/D) 贴图
    │   ├── turn-stalk-v2.png         # 转向灯拨杆贴图
    │   ├── throttle-real-v2.png      # 油门踏板贴图
    │   ├── brake-real.png            # 刹车踏板贴图
    │   ├── high-beam-on.png          # 远光灯开启状态按钮贴图
    │   ├── high-beam-off.png         # 远光灯关闭状态按钮贴图
    │   ├── hazard-button-v1.png      # 危险报警闪光灯（双闪）按钮贴图
    │   └── horn-button.png           # 喇叭按钮贴图
    └── js/
        ├── viewport.js               # 视口方向自适应 (HorizonDriveAutoOrientation) 与安全区 CSS 变量计算
        ├── boot.js                   # 全局配置中心 (HorizonDriveSettings)、车库积分钱包 (HorizonDriveWallet)、主菜单、3D 车库（座驾积分解锁）与设置面板交互
        ├── desktop-controls.js       # 桌面端识别、键鼠操控映射、N 键氮气触发、C 键切视角与 F/X 全屏控制
        ├── vendor-engine.js          # React 18 + Three.js r162 底层渲染引擎库 (window.__HD_VENDOR__)
        ├── drive-models.js           # 天穹 V8 飞车程序化网格与骑手骨骼动作数据资产库 (window.__HD_MODELS__)
        ├── drive-maps.js             # 28 主题地图 Stylized Low-Poly 场景与动态地表/护栏引擎 (window.__HD_MAPS__)
        └── drive.js                  # 核心 3D 驾驶物理、重塑载具模型、NOS 氮气推进、惊险超车连击与 HUD 主逻辑
```

---

## 三、核心模块与数据流转机制

### 1. 全局状态存储中心 (`window.HorizonDriveSettings` in [`boot.js`](file:///d:/AI项目集合/赛车游戏/assets/js/boot.js))
- 使用 `localStorage` 与 `sessionStorage` 双重持久化（存储键名：`horizon-drive-settings-v1`）。
- 维护以下核心配置域：
  - `display`：`orientation`（横竖屏 `landscape` / `portrait`）、`camera`（视角 `first` / `third`）、`controls`（操控方式 `wheel` / `buttons`）
  - `graphics`：`lighting`（光影增强开关）
  - `vehicle`：当前选中载具（`sedan` 疾风 GT 轿跑 / `motorcycle` 幻影重机 / `jet` 天穹 V8 飞车 / `truck` 泰坦重型卡车）；`snapshot()` 读取时如果发现存的载具还没解锁，会强制退回 `sedan`，`set('vehicle', id)` 也不接受未解锁的载具
  - `progress`：车库积分钱包，`points`（可花的余额）与 `earned`（历史累计获得，只增不减）
  - `owned.<vehicleId>`：载具拥有状态，与 `unlocks.*` 一样属于**单调字段**（`isMonotonic`），跨标签页合并时一旦为 `true` 就不会被改回去
  - `audio`：`bgmVolume`（背景音乐音量 `0–100`）
  - `controlLayout`：玩家自定义拖拽调整后的 HUD 按钮坐标与缩放比例（包含新增的 `nos-boost` 氮气加速按钮）
- `commit(patch)` 的 `patch` 除了普通对象也可以传函数：函数会在**合并完其它标签页的最新存档之后**才执行，用于积分扣减这类必须基于最新余额的读改写操作。

### 3. 车库积分钱包与座驾解锁 (`window.HorizonDriveWallet` in [`boot.js`](file:///d:/AI项目集合/赛车游戏/assets/js/boot.js))

| 载具 | ID | 解锁价格（积分） | 累计需赚取积分 | 预计解锁时间（主流玩家） |
| :--- | :--- | ---: | ---: | :--- |
| 01 疾风 GT 轿跑 | `sedan` | 0（初始拥有） | 0 | 0 分钟（开局即享） |
| 02 幻影重机 | `motorcycle` | 5,000 | 5,000 | 约 1.3 分钟 |
| 04 泰坦重型卡车 | `truck` | 15,000 | 20,000 | 约 6.3 分钟 |
| 03 天穹 V8 飞车 | `jet` | 30,000 | 50,000 | **约 16.3 分钟（全车库毕业）** |

> 价格统一在 `boot.js` 的 `VEHICLE_PRICES` 常量里配置（按主流玩家约 `3,000 积分/分钟` 并计入新手引导 `+1,000` 与一次性成就奖励标定，总计 `50,000` 积分），车库界面、锁标与按钮文案都从这里读取，改价只需改这一处。详见第二十五节。

- **积分入账数据流与连击倍率软封顶**：[`drive.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js) IIFE 顶部注入的 `__hdEarn(n)` 包在两处超车计分表达式外面（`x.score=(x.score||0)+__hdEarn(150*Math.min(x.combo,5))` / `__hdEarn(50)`），会调用 `HorizonDriveWallet.earn(n)` 并原样返回分值。连击数 `x.combo` 本身不设上限（保留高连击徽章荣誉展示），但单次惊险超车计分按最高 `×5` 倍率（`750` 分）封顶，且普通超车会令当前连击温和衰减 `1` 层（`Math.max(0, combo - 1)`），防止单局高连击指数膨胀导致过早刷穿车库。**（第二十八节起已调整：倍率上限改为 ×10，普通超车不再衰减连击；本局得分另乘热度倍率，但钱包仍只存入基础分。）**
- **批量落盘**：`earn()` 先把积分累加到内存缓冲 `pendingPoints`，`1.5s` 后合并写入一次 `localStorage`，避免频繁超车时每次都同步读写存储造成卡顿；遇到 `pagehide` / `visibilitychange` / `game-home-restored` / 打开车库时会立即落盘（`flush()` 会先执行 `flushPendingPoints()`）。单次入账上限 `100,000`，非法值（负数 / NaN）直接忽略。
- **API**：`balance()`（已落盘余额 + 缓冲积分）、`earned()`、`earn(n)`、`price(id)`、`isOwned(id)`、`purchase(id)`、`flush()`、`storageMode()`。
  - `purchase(id)` 返回 `{ ok, reason, vehicle, price, points, shortfall, storage }`，`reason` 取值为 `purchased`（解锁成功）/ `owned`（已拥有，不扣分）/ `insufficient`（积分不足）/ `unknown`（未知载具）。
- **车库界面（`paintUnlock`）**：
  - 标题栏右侧显示积分余额徽章 `.garage-wallet`；载具标签下方显示 `使用中` / `已拥有` / `🔒 价格`（积分不够）/ `🔓 价格`（积分够了，橙色高亮）。
  - 解锁信息面板 `#garage-unlock`：显示价格、积分进度条和“还差 X 积分 + 怎么赚积分”的提示；浏览器禁用存储时会额外提示“积分仅本次有效”。
  - 主按钮 `.garage-confirm[data-state]` 有四种状态：`drive`（驾驶）/ `unlock`（花费积分解锁）/ `armed`（再次点击确认，`3.5s` 内不点就自动取消，切换载具也会取消）/ `locked`（积分不足，用 `aria-disabled` 并有抖动反馈，保证 Tab 焦点循环正常）。解锁成功后面板播放橙色光晕动画，按钮变回“驾驶这辆座驾”。
- **存档迁移**：启动时如果旧存档选的是未解锁载具，会自动改回 `sedan` 并写回存档，避免之后解锁时意外自动切车。

### 4. 四层渲染引擎模块通信 (`vendor-engine.js` → `drive-models.js` → `drive-maps.js` → `drive.js`)
- [`vendor-engine.js`](file:///d:/AI项目集合/赛车游戏/assets/js/vendor-engine.js) 初始化 React 18 与 Three.js r162，并将底层全部 802 个顶层符号导出至 `window.__HD_VENDOR__`。
- [`drive-models.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive-models.js) 从 `window.__HD_VENDOR__` 解构底层类与常量，注册 `window.__HD_MODELS__ = { Op, co }`。
- [`drive-maps.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive-maps.js) 从 `window.__HD_VENDOR__` 解构几何体与材质原语，注册 `window.__HD_MAPS__ = { ROUTE_SEGMENTS, shuffleRoute, getSegmentAt, getSliceIndex, getTunnelFactor, createLandscapeManager }`。
- [`drive.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js) 同时解构 `window.__HD_VENDOR__`、`window.__HD_MODELS__` 与 `window.__HD_MAPS__`，驱动统一的 3D 物理循环 `yE` 与 React HUD 主组件 `oM`。
- **第一人称座舱方向盘与 HUD 控件规整**：
  - `k9` 序列帧渲染器根据物理转向角 `Sn`（按 `A`/`←` 左转时 `Sn = +1`，按 `D`/`→` 右转时 `Sn = -1`）通过 `Math.round(4 + Sn * 4)` 计算 9 帧精灵图 [`driver-turns-v3.png`](file:///d:/AI项目集合/赛车游戏/assets/images/driver-turns-v3.png) 的帧索引（`0..3` 为顺时针右转，`4` 为回正，`5..8` 为逆时针左转）。
  - 隐藏左下角冗余的 `.wheel-wrap` 悬浮小方向盘，统一由座舱中央主方向盘呈现转向姿态，并通过 `.pedal-group { margin-left: auto; }` 保持右下角踏板与氮气加速按钮布局稳定。

### 5. 中英双语国际化与 3D 动态贴图热切换机制 (`window.HorizonI18n` & `__hdPick`)
- **全局双语中心 (`window.HorizonI18n` in [`boot.js`](file:///d:/AI项目集合/赛车游戏/assets/js/boot.js))**：
  - 默认语言为英语（`'en'`），持久化于 `HorizonDriveSettings` 的 `lang` 字段（合法值 `'en' | 'zh'`），同步挂载 `<html lang="..." data-lang="...">`。
  - 核心方法：
    - `getLang()`：获取当前语言（`'en'` 或 `'zh'`）。
    - `setLang(lang)`：切换并持久化语言，调用 `applyDOM()` 更新全部静态 DOM 节点，并派发 `window.dispatchEvent(new CustomEvent('horizon-lang-change', { detail: { lang } }))`。
    - `toggle()`：在 `'en'` 与 `'zh'` 之间一键切换。
    - `t(key, params)`：按字典键查询当前语言文本并替换 `{param}` 占位符。
    - `pick(enText, zhText)`：内联双语选择器，当前为中文时返回 `zhText`，否则默认返回 `enText`。
    - `applyDOM(root)`：自动扫描并翻译 `[data-i18n]`、`[data-i18n-aria]`、`[data-i18n-title]` 节点及 `document.title`；当 `a_()` 重建克隆的 `#boot-screen` 时亦自动调用以保持语言同步。
- **28 个主题地图赛段名双语化 ([`drive-maps.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive-maps.js))**：
  - `ROUTE_SEGMENTS` 中每项均包含 `name`（中文）与 `nameEn`（英文，如 `Azure Ridge`、`Sunset Metro`、`Sakura Avenue` 等）。
  - `window.__HD_MAPS__.getSegmentName(seg)` 根据 `document.documentElement.dataset.lang` 动态返回对应语言赛段名，供左上角行程卡片 `.eyebrow` 实时渲染。
- **React HUD 与 3D 场景 Canvas 贴图实时热重绘 ([`drive.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js))**：
  - IIFE 顶部注入 `__hdPick(en, zh)` 辅助函数，统一包裹所有 React 组件文案、物理事件提示（惊险超车、腾空飞跃、碰撞、闯红灯、斗气车、无人机、氮气等）与错误边界提示；碰撞红屏闪烁同时匹配中文 `"碰撞"` 与英文 `/collision|crash/i`。
  - 主组件 `oM` 与错误边界 `wM` 监听 `horizon-lang-change` 事件触发无损重渲染。
  - **3 处 Three.js CanvasTexture 动态重绘**：
  - **3D 场景 CanvasTexture 贴图全量英文统一与防缓存刷新**：
    1. **主路高速龙门架蓝色路牌贴图 (`drawGantrySign`)**：统一绘制为国际公路标准英文贴图 `HORIZON FWY / HORIZON EXPRESSWAY / ↑ FULL THROTTLE ↑`。
    2. **分岔路口龙门架绿色出口路牌贴图 (`drawForkSign` in `Og`)**：统一绘制为英文出口导向贴图 `↖ LEFT EXIT | ↑ THRU` / `↑ THRU | RIGHT EXIT ↗` 与 `CHOOSE LANE AHEAD` / `KEEP TO EXIT SIDE LANE FOR RAMP`。
    3. **对手摩托挑衅气泡贴图 (`drawBikeTaunt`)**：统一绘制为英文贴图 `Full throttle! Catch me if you can!`。
    4. **卡车车头铭牌贴图 (`TITAN V12`)、第一人称仪表液晶屏贴图 (`HORIZON / GT`) 与联机车手铭牌贴图 (`DRIVER ...`)**：全量保持纯英文贴图视觉一致性。
    5. **静态资源防缓存参数 (`?v=20261101`)**：在 [`index.html`](file:///d:/AI项目集合/赛车游戏/index.html) 中为所有 CSS 与 JS 引用添加版本查询参数，确保浏览器刷新时强制丢弃旧版中文贴图缓存。

---

## 四、28 个主题地图路段与 Stylized Low-Poly 视觉设计一览

在 [`drive-maps.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive-maps.js) 中，每个 45m 道路切片在启动时按材质自动静态合并（`mergeGeometries`），并在行驶过程中随路段切换动态改变地表底色（`floor`）、路肩（`shoulder`）与护栏（`rail`）：

| 序号 | 标识 (`kind`) | 路段中文名 | 核心重绘 3D 景观特征 | 地表色 | 路肩色 | 护栏色 |
| :---: | :--- | :--- | :--- | :--- | :---: | :---: |
| 1 | `mountain` | 青岚山道 | 双色层叠山峰、奇石簇、三层伞状针叶松林 | `#4e6b36` | `#687a52` | `#9aa8a6` |
| 2 | `city` | 向晚新城 | 退台玻璃幕墙大厦、冷暖双色发光窗带、街角粉青霓虹招牌、花坛行道树 | `#3b424c` | `#575f6b` | `#8ba0b5` |
| 3 | `tunnel` | 穿山隧道 | 钢拱肋衬砌、检修步道、琥珀反光带、顶部双排 LED 照明灯带与上方穿山山体 | `#2c3138` | `#484d54` | `#d6a64f` |
| 4 | `coast` | 晴海公路 | 黄金沙滩、碧蓝浅滩与深海、多层翻滚海浪白沫、海岸礁石与红白条纹海滨灯塔 | `#d6c18a` | `#b8a678` | `#bfd6de` |
| 5 | `forest` | 杉林长路 | 高低错落的三层针叶松海、远景森林山脉与路旁山石 | `#3d592b` | `#596e46` | `#8c6d53` |
| 6 | `desert` | 赤岩荒漠 | 科罗拉多多层平顶红岩台地 (Mesa)、赤褐风蚀山丘与多分支巨柱仙人掌 | `#c99762` | `#b38354` | `#b86b52` |
| 7 | `farmland` | 风车田野 | 金黄麦浪与褐土交替田垄、木质围栏、锥塔三叶大风车、美式红谷仓与圆顶储粮筒仓 | `#6e8a42` | `#879658` | `#a8845e` |
| 8 | `snow` | 霜岭雪道 | 皑皑雪冠远山、覆雪三层冷杉、红白防雾积雪标杆、镜面冰封湖与温馨暖光雪屋 | `#dce6ed` | `#bccbd6` | `#8ab4cc` |
| 9 | `bridge` | 碧海大桥 | H 型高耸红白跨海主桥塔、双横梁、航空警示灯、扇形斜拉钢索与蔚蓝海面 | `#285f78` | `#7c8792` | `#d8e2e8` |
| 10 | `autumn` | 枫叶山谷 | 金黄/橙红/绯红三色多团簇秋枫林、满地落叶圆盘与秋日彩山 | `#8c5e3c` | `#9e734e` | `#9e7b66` |
| 11 | `harbor` | 远湾港区 | 五彩双层集装箱堆场、大型岸边龙门吊机、停泊远洋集装箱货轮与港区物流仓库 | `#4b525c` | `#656d78` | `#d9a74a` |
| 12 | `sakura` | 樱花大道 | 双色团簇粉白樱花树冠、落樱花瓣地毯、日式石灯笼与朱红立柱 | `#6b8558` | `#9e858d` | `#d9bdc8` |
| 13 | `bamboo` | 翠竹长廊 | 带竹节圆环的高耸青翠竹竿群、多层舒展竹叶华盖与幽谷远山 | `#44633f` | `#627858` | `#739468` |
| 14 | `wetland` | 芦苇湖畔 | 镜面湿地湖泊、摇曳的香蒲棒与金黄芦苇丛、延伸入湖的木栈桥与四角攒尖水榭凉亭 | `#376878` | `#647a65` | `#8f785d` |
| 15 | `vineyard` | 葡萄庄园 | 整齐排列的木质葡萄藤架、饱满紫葡萄果簇与法式红瓦白墙酒庄庄园 | `#637d44` | `#7d8c5a` | `#9c9588` |
| 16 | `canyon` | 层岩峡谷 | 两侧高耸逼仄的赤红/橙黄阶梯状沉积岩大峡谷绝壁与峡谷乱石 | `#a86544` | `#94573b` | `#b57453` |
| 17 | `solar` | 光伏原野 | 晶硅深蓝反光光伏板矩阵、铝合金支架立柱与逆变器变电站机房 | `#b89f72` | `#968565` | `#95adc2` |
| 18 | `village` | 山间小镇 | 阿尔卑斯式斜坡红瓦/石板瓦白墙小屋、砖砌烟囱、木门、暖黄窗光与庭院青松 | `#58753e` | `#74825c` | `#9e7f60` |
| 19 | `airport` | 空港公路 | 现代玻璃幕墙航站楼、八棱空管指挥塔台、跑道助航灯与精细化双发涡扇宽体客机 | `#525a63` | `#6c7580` | `#9cb3c9` |
| 20 | `flowers` | 花海原野 | 樱花粉/向日葵黄/薰衣草紫/郁金香红四色交替花田垄带与远山 | `#628244` | `#7d915c` | `#d6d2c4` |
| 21 | `redwoods` | 红杉林谷 | 赤褐粗壮锥台树干的参天巨型红杉木群与三层浓密树冠 | `#5e4332` | `#6e523f` | `#8a5240` |
| 22 | `industrial` | 工业外环 | 重型蓝灰工业厂房、高耸红白警示烟囱、白色球形储气罐与架空输气管道 | `#464a52` | `#5e626b` | `#858c96` |
| 23 | `deepTunnel` | 深山长隧 | 1800m 超长深山隧道、青色与琥珀色双引导灯带、密集钢拱肋与上方崇山峻岭 | `#22262e` | `#3b404a` | `#d98a3b` |
| 24 | `boulevard` | 双向大道 | 中央分隔带修剪绿篱与反光柱、保留左侧对向车道净空、外侧行道树与天际远山 | `#4a6642` | `#647560` | `#a3b4bd` |
| 25 | `cliff` | 绝壁盘山路 | 公路悬挑托梁底座、左侧千仞丹霞绝壁、右侧万丈深渊谷底与云海群峰 | `#4e6b36` | `#6c6a64` | `#c97a63` |
| 26 | `seacliff` | 悬崖海岸 | 左依陡峭海崖、右临蔚蓝深海与礁石浅滩、翻滚白浪（隐藏默认地面底板） | `#2b6880` | `#857b68` | `#c2ced4` |
| 27 | `islands` | 群岛海堤 | 跨海双柱桥墩与横梁、海中金沙翠绿群岛与岛屿红白灯塔（隐藏默认地面底板） | `#24647d` | `#828c91` | `#d0dce3` |
| 28 | `viaduct` | 云际高架 | 20m 半空城市高架桥箱梁与桥墩、两侧从地面拔地而起的摩天大楼森林 | `#3b424c` | `#6e7680` | `#98a9b8` |

---

## 五、桌面端快捷键与直觉操控一览

| 按键 | 功能说明 |
| :--- | :--- |
| `W` / `↑` | **油门加速 / 前进**（处于 `R` 倒车挡或 `N`/`P` 挡时按下自动挂回 `D` 挡前进） |
| `S` / `↓` | **刹车减速 / 长按自动倒车**（刹停后继续按住满 `0.12s` 自动切入 `R` 挡向后倒车） |
| `A` `D` / `←` `→` | **左右转向**（倒车时保持与屏幕视觉方向一致，不反转画面） |
| `Shift` / `N` | **开启 / 关闭 NOS 氮气加速推进**（左手小指直触，杜绝误触 180° 掉头） |
| `空格 (Space)` / `H` | **鸣笛喇叭**（全车型含幻影重机均可用） |
| `Q` / `E` | **左转向灯 / 右转向灯拨杆**（再次按下同向归位关闭，全车型可用） |
| `V` / `L` | **远光灯开关（连续多次点击 / 连按触发闪灯）**（单次按下仅切换远光常亮；`0.9s` 内连续按下 $\ge 2$ 次触发闪远光催促前车让道，全车型可用） |
| `2` | **危险报警闪光灯（双闪警示灯）**（全车型可用） |
| `F` | **天穹 V8 飞车专属飞行 / 伴飞无人机特技 / 剧情模式攻击** |
| `B` / `3` | **一键快捷发送车手表情 / 街头互动喊话**（无需点开右上角二级菜单，直接与旁车互动赢取 `+30 PTS`） |
| `Z` | **180° 漂移掉头**（车速 40 km/h 以上可用；完成后保持 `D` 挡，沿新朝向反向行驶，不再自动挂 `R` 挡） |
| `X` / `U` | **360° 旋转特技**（车速 40 km/h 以上可用） |
| `R` | **车辆脱困回正复位 (Recover)** |
| `J` / `K` | **幻影重机专属特技**（`J` 翘头 / 后空翻，`K` 翘尾 / 前空翻） |
| `C` | **实时切换第一人称 / 第三人称驾驶视角** |
| `G` | **游戏内随时打开 3D 车库实时预览并切换座驾** |
| `T` | **随时重新开启交互式新手驾驶教学引导 (Driving Academy Tutorial)** |
| `鼠标滚轮` 或 `[` `]` / `PageUp` `PageDown` | **免踩刹车直接上下切换 `P` / `R` / `N` / `D` 挡位** |
| `P` / `Esc` | **暂停 / 继续游戏** |

---

## 六、运行与启动方式

### 方式一：一键脚本启动（推荐）
双击项目根目录下的 [`启动游戏.bat`](file:///d:/AI项目集合/赛车游戏/启动游戏.bat)，或在终端执行：
```powershell
python server.py
```
脚本将自动在 `http://127.0.0.1:8080/index.html` 启动本地服务并打开浏览器。

### 方式二：直接打开 HTML（支持 `file://` 离线运行）
直接用现代浏览器（Chrome / Edge / Firefox）双击打开 [`index.html`](file:///d:/AI项目集合/赛车游戏/index.html) 即可零报错畅玩且背景音乐正常播放。

---

## 七、CrazyGames 官方质量规范（Quality Requirements）全量合规升级记录

对照 CrazyGames 官方最新审核标准（https://docs.crazygames.com/requirements/quality/ ），已完成以下 6 项生产级合规改造，并通过自动化合规脚本全项校验：

1. **CrazyGames SDK v3 异步脚本挂载与严格 `init()` 门禁**：
   - 在 [`index.html`](file:///d:/AI项目集合/赛车游戏/index.html) 头部挂载 `<script src="https://sdk.crazygames.com/crazygames-sdk-v3.js" data-optional-sdk="true" async></script>`，兼容离线/本地无网容灾降级。
   - 重构 [`assets/js/boot.js`](file:///d:/AI项目集合/赛车游戏/assets/js/boot.js) 中的 `window.HorizonCrazyGames` 桥接器：严格等待 `await window.CrazyGames.SDK.init()` Promise 解析后再调用任何子模块；内置状态缓存（`pendingLoading` / `pendingGameplay`），确保首屏加载与驾驶生命周期事件在 SDK 异步就绪后精准补发且不重入。
2. **平台级静音控制闭环（`muteAudio` + `addSettingsChangeListener`）**：
   - 实时读取 `SDK.game.settings.muteAudio` 及 URL 参数 `?muteAudio=true`，注册 `SDK.game.addSettingsChangeListener` 动态监听平台静音指令，同步更新 `html[data-platform-mute="true|false"]` 并派发 `horizon-mute-change` 事件。
   - 在 [`assets/js/drive.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js) 的全局音量函数 `o0()` 与监听函数 `a0()` 中联动平台静音状态，全链路覆盖 BGM (`cE`)、喇叭 (`uE`)、WebAudio 引擎/转向灯/碰撞合成器 (`fE`) 以及风雨雷电环境音效 (`AE`)。
3. **系统语言智能对齐与安全回退（`SDK.user.systemInfo`）**：
   - 在 [`assets/js/boot.js`](file:///d:/AI项目集合/赛车游戏/assets/js/boot.js) 的 `HorizonDriveSettings` 中新增 `hasUserSet()`，并在 `HorizonI18n` 中新增 `applyPlatformSystemLocale(rawLocale, countryCode)`。当玩家未手动指定语言时，优先结合 `SDK.user.systemInfo` 与浏览器语言自动识别中文区域，非中文区域安全回退至英文（`'en'`）。
4. **高刷显示器帧率解锁与全物理衰减时间步长（`dt`）无关化**：
   - 移除 [`assets/js/drive.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js) 主渲染循环 `at(Q)` 在标准/高画质下的 `1e3/60 - 1` 硬限帧（仅在低配模式 `q === true` 下保留 30FPS 节流），彻底修复 144Hz 显示器因帧间隔 `6.94ms` 跨过 `15.66ms` 阈值导致跳帧掉到 48FPS 的问题。
   - 将后视镜碎片落地横向摩擦 `G9`（`R.velocity.x`）与重卡追尾减速（`rearTossCount`）统一改为基于 `Math.pow(factor, Math.max(1, dt * 60))` 的帧率无关公式。
5. **高光时刻（`happytime()`）与广告全生命周期桥接（`requestAd()`）**：
   - 在车库解锁新载具（[`boot.js`](file:///d:/AI项目集合/赛车游戏/assets/js/boot.js) 的 `unlockDraft()`）以及单局达成 3 连击以上惊险超车（[`drive.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js) 的 Near Miss 连击判定）时触发带 8 秒防抖锁的 `window.HorizonCrazyGames.happytime()`。
   - 封装 `window.HorizonCrazyGames.requestAd(adType, callbacks)`，在 `adStarted` 时自动暂停游戏与全部音频，并在 `adFinished` / `adError` 时安全恢复。
6. **最小字号合规（`>= 11px`）与键位提示统一**：
   - 将 [`assets/js/drive.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js) 车队 HUD (`J9`)、[`assets/css/boot.css`](file:///d:/AI项目集合/赛车游戏/assets/css/boot.css)、[`assets/css/desktop-controls.css`](file:///d:/AI项目集合/赛车游戏/assets/css/desktop-controls.css) 和 [`assets/css/drive.css`](file:///d:/AI项目集合/赛车游戏/assets/css/drive.css) 中所有 `< 11px` 的微缩字号统一提升至 `11px`。
7. **人体工学键位重塑、全车型车灯/喇叭开放与自动倒车升级**：
   - **全车型（含幻影重机 `motorcycle`）喇叭与车灯 100% 开放**：解除 [`drive.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js) 中对摩托车的喇叭（`horn`）、转向灯（`setTurnSignal`）、双闪（`toggleHazard`）与闪远光超车灯（`flashLights`）限制；为左侧 5 个车灯/喇叭控件补齐中英双语胶囊角标（`闪灯 · F/1`、`双闪 · 2`、`远光 · V/L`、`喇叭 · 空格/H`、`Q 左转 · E 右转`），并在转向灯拨杆内部按钮直接显示 `右 ➡` / `关 闭` / `⬅ 左` 三档发光标签，修复 [`boot.css`](file:///d:/AI项目集合/赛车游戏/assets/css/boot.css) 后代选择器导致的拨杆按钮高度错位。
   - **刹停长按 `S / ↓` 自动倒车 & 免踩刹直接换挡**：移除 [`drive.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js) `Zg` 与 `setGear` 中“必须按住刹车才能换挡”的限制，支持点击屏幕 `P/R/N/D` 挡把、滚动鼠标滚轮或按 `[` `]` / `PageUp` `PageDown` 直接换挡；在 `D` 挡下按住 `S / ↓`（或刹车踏板）刹停满 `0.12s` 自动切入 `R` 挡倒车，倒车时按 `W / ↑` 自动切回 `D` 挡前进，且倒车时不强制翻转相机视角、左右转向方向与屏幕视觉保持一致。
   - **核心飙车键位防误触重映射**：在 [`desktop-controls.js`](file:///d:/AI项目集合/赛车游戏/assets/js/desktop-controls.js) 中将 `Shift`（及 `N`）设为 NOS 氮气加速，`空格` / `H` 设为鸣笛喇叭，`F` / `1` 设为闪远光超车灯，`V` / `L` 设为远近光切换，`Z` / `X` 设为 180° 掉头 / 360° 转圈特技，`R` 设为车辆脱困复位（`Recover`），`J` / `K` 设为摩托翘头/翘尾特技。
   - **左下角转向控件修复**：在 [`boot.js`](file:///d:/AI项目集合/赛车游戏/assets/js/boot.js) 与 [`boot.css`](file:///d:/AI项目集合/赛车游戏/assets/css/boot.css) 中默认启用 `buttons` 模式（直接显示左下角 `◀` `▶` 转向按钮），同时在切换为 `wheel` 模式时恢复显示可拖拽方向盘。
8. **重新打包提审归档**：
   - 已将最新产物重新打包为根目录下的 [`HorizonOverdrive-CrazyGames.zip`](file:///d:/AI项目集合/赛车游戏/HorizonOverdrive-CrazyGames.zip)（约 8.56 MB），可直接上传至 CrazyGames Developer Portal 提审。

---

## 八、交互式新手教学引导系统 (`HorizonTutorial`) 架构说明

针对游戏“首屏直进 3D 驾驶（Instant Play）”的节奏特性，在 [`assets/js/boot.js`](file:///d:/AI项目集合/赛车游戏/assets/js/boot.js)、[`assets/js/drive.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js)、[`assets/js/desktop-controls.js`](file:///d:/AI项目集合/赛车游戏/assets/js/desktop-controls.js) 与 [`assets/css/drive.css`](file:///d:/AI项目集合/赛车游戏/assets/css/drive.css) 中构建了非阻塞式、60fps 真实遥测驱动的**交互式新手教学引导系统 (`window.HorizonTutorial`)**：

1. **60fps 实时物理与输入遥测桥接**：
   - 在 [`assets/js/drive.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js) 的 `yE` 主控引擎中暴露只读遥测与辅助接口 `window.__HD_TELEMETRY__ = { state, getSteering, refillNos }`，并在鸣笛函数 `horn()` 中派发 `horizon-horn-trigger` 事件。
   - 引导控制器通过 `requestAnimationFrame` 实时读取车速 `speed`、转向角 `getSteering()`、氮气激活态 `nosActive`、氮气余量 `nosEnergy`、远光闪烁 `flashing`、累计超车数 `passed`、累计撞飞车辆数 `tossed` 与当前得分 `score`，实现玩家边开边过关的丝滑反馈。
2. **6 步渐进式实操训练流程（含侧撞弹飞慢车爽点教学）**：
   - **Step 1 · 全油门起步加速 (`launch`)**：引导玩家按住 `W / ↑` 或右下角**油门踏板**（`.pedal.throttle`）将车速提升至 `80 km/h`，进度条实时显示 `当前车速 / 80 km/h`。
   - **Step 2 · 灵巧变道与转向操控 (`steer`)**：引导玩家按 `A / D` / `← / →` 或触控左下角**转向按钮 / 虚拟方向盘**（`.turn-buttons, .steering-control`）完成左右变道穿梭。
   - **Step 3 · NOS 氮气超载推进 (`nos`)**：切入该步时若氮气不足自动调用 `refillNos()` 补满至 `100%`；引导玩家按 `Shift / N` 或点击右下角 **NOS 按钮**（`.nos-boost-button`）释放蓝焰推进。
   - **Step 4 · 声光催促与惊险超车 (`overtake`)**：引导玩家连按 `V` 键（或连续点击左侧 `.high-beam-button` 远光按钮）触发闪远光灯、按 `空格 / H` 鸣笛（`.horn-button`）催促慢车让道，或高速贴近超车赢取连击积分（`.horizon-score-badge`）。
   - **Step 5 · 侧撞霸气弹飞慢车 (`takedown`)**：引导玩家与慢车并排时猛打方向键用车身侧面擦撞慢车，将其直接撞飞上天赢取 `+200 PTS` 与 `+18%` 氮气（本步训练期间自动为玩家开启 `UA.heavyRam` 无损护盾保护，防止新手因追尾角度偏差受损，检测 `state.tossed` 增加即过关）。
   - **Step 6 · 视角切换与 3D 车库解锁 (`garage`)**：引导玩家按 `C` 切换第一/第三人称视角（`.camera-toggle`），或按 `G` / 点击左上角 `🚗 换车`（`.hud-garage-btn`）了解如何用超车积分（PTS）兑换传奇跑车。
3. **双保险目标控件霓虹脉冲高亮**：
   - 结合 `.tutorial-target-pulse` 类名与根元素 `html[data-tutorial-active="true"][data-tutorial-step="..."]` 纯 CSS 属性选择器驱动 `@keyframes horizonTutorialTargetPulse` 双色霓虹呼吸光环，既不受移动端 90° 旋转视口影响，也不会被 Preact 状态重绘冲掉动画，同时保持 `pointer-events` 完全穿透不阻挡操控。
4. **20 分钟全车库收集经济模型（`60,000 PTS` 总价 vs `3,000 PTS/分钟` 产出）**：
   - **车库座驾总价 `60,000 PTS`**：疾风 GT 轿跑 `0 PTS`（初始赠送）、幻影重机 `8,000 PTS`（约 2.7 分钟解锁）、泰坦重型卡车 `20,000 PTS`（累计约 9.3 分钟解锁）、天穹 V8 飞车 `32,000 PTS`（累计约 20 分钟全车库满收集毕业）。
   - **积分与氮气产出标定（平均约 `3,000 PTS / 分钟`）**：
     - **侧撞霸气弹飞 (`Takedown`)**：每撞飞 1 辆慢车奖励 **`+200 PTS`**、氮气 **`+18%`**；
     - **惊险超车 (`Near Miss`)**：车速 `>= 100 km/h` 且与前车横向净距 `< 1.05m` 擦肩而过时触发，奖励 **`90 × Math.min(combo, 5)`** 积分（单次封顶 `450 PTS`、氮气 `+16%`，超过 6 秒未触发连击归零）；
     - **普通超车**：奖励 **`+40 PTS`**、氮气 **`+5%`**（连击温和衰减 1 层）；
     - **新手引导首次毕业基金**：首次完成全部 6 步训练发放 **`+1,000 PTS`** 启动基金（受单调字段 `tutorial.rewarded` 保护，重播不重复刷分）。
5. **双端 / 双语自适应与三重重温入口**：
   - 卡片文案根据 `html[data-desktop]`、`html[data-controls]` 与 `HorizonI18n.lang()` 动态切换 PC 立体 `<kbd>` 键帽提示或移动端触屏手势说明，支持中英双语实时切换。
   - 无论玩家已完成或跳过引导，均可随时通过 **① 左上角顶栏 `📖 引导 / 📖 Guide` 按钮**、**② 键盘快捷键 `T`**、或 **③ 驾驶偏好设置弹窗中的 `📖 重新开始引导 / 📖 Replay Tutorial`** 重新开启教学。

---

## 九、右上角战术控制区（Top-Right Tactical HUD Cluster）视觉与交互重塑

针对驾驶室右上角 5 个控件（`按键设置`、`复位`、`隐藏键位提示`、`表情互动`、`切换视角`）原版样式简陋、边框灰暗不统一及纵向重叠问题，在 [`assets/js/drive.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js)、[`assets/js/desktop-controls.js`](file:///d:/AI项目集合/赛车游戏/assets/js/desktop-controls.js)、[`assets/css/drive.css`](file:///d:/AI项目集合/赛车游戏/assets/css/drive.css) 与 [`assets/css/desktop-controls.css`](file:///d:/AI项目集合/赛车游戏/assets/css/desktop-controls.css) 中完成了全套暗黑毛玻璃 + 赛博电光青（`#00e5ff`）风格升级：

1. **三层网格右对齐与重叠消除**：
   - 统一右上角所有控件右边界为 `right: calc(12px + var(--safe-right, 0px))`；
   - 第一排 `.control-tools`（`top: 12px`，高 `36px`）、第二排 `.desktop-hints-toggle`（桌面端 `top: 54px`，高 `32px`，彻底消除原 `46px` 压盖第一排底边的重叠问题）、第三排 `.emote-controls` + `.reverse-view-button`（桌面端 `top: 94px` / 移动端 `top: 56px`，高 `38px`）纵向间距清晰匀称。
   - 清理 `main[data-drone-enabled=true]` 下旧版 `#91a6a5` 灰绿边框与 `96px !important` 强制覆盖样式，确保全模式下视觉风格一致。
2. **矢量 SVG 图标、状态呼吸灯与立体快捷键角标（`.hud-kbd`）**：
   - **按键设置 & 复位（`.control-tools`）**：注入双滑块调节 SVG 与回正刷新箭头 SVG，并为复位按钮配备桌面端立体键帽 `<kbd class="hud-kbd">R</kbd>`。
   - **键位提示开关（`.desktop-hints-toggle`）**：升级为“发光状态呼吸圆点（`.hints-status-dot`，开启时 `#00e5ff` 翠青发光，关闭时暗灰）+ 键盘矢量 SVG（`.hints-key-icon`）+ 动态双语文案”胶囊组件。
   - **车手表情（`.emote-controls > .emote-toggle`）**：废除原版简陋的黑白 Unicode 字符 `☺`（`\u263A`）及空旷的 `96px` 黑框，升级为琥珀金发光笑脸 SVG + 双语标签 `表情 / Emote`，并为展开面板 `.emote-picker` 增加毛玻璃战术容器边框与阴影。
   - **视角切换（`.reverse-view-button.camera-toggle`）**：注入镜头光圈 SVG 图标 + 视角文案 + 桌面端 `<kbd class="hud-kbd">C</kbd>` 键帽，第三人称激活态自带电光青高光描边，同时补齐 `.camera-toggle` 与 `.hud-garage-btn` 类名以联动新手引导第 6 步高亮脉冲。

---

## 十、四款座驾全维度差异化升级（物理矩阵、专属被动、WebAudio 声浪与车库五维面板）

针对此前四款座驾极速一刀切锁死（`300 / 365 km/h`）、动力/转向参数趋同、引擎声浪与喇叭音效共用、以及第一人称座舱缺少区分度的问题，在 [`index.html`](file:///d:/AI项目集合/赛车游戏/index.html)、[`assets/js/boot.js`](file:///d:/AI项目集合/赛车游戏/assets/js/boot.js)、[`assets/js/drive.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js)、[`assets/css/boot.css`](file:///d:/AI项目集合/赛车游戏/assets/css/boot.css) 与 [`assets/css/drive.css`](file:///d:/AI项目集合/赛车游戏/assets/css/drive.css) 中完成了四大流派全维度差异化实装：

### 1. 四款座驾物理矩阵 (`R9`) 与专属被动特长一览

| 维度 / 车型 | 01 疾风 GT 轿跑 (`sedan`) | 02 幻影重机 (`motorcycle`) | 04 泰坦重型卡车 (`truck`) | 03 天穹 V8 飞车 (`jet`) |
| :--- | :--- | :--- | :--- | :--- |
| **流派定位** | **均衡漂移流 (`BALANCED DRIFT`)** | **刀锋连击流 (`RAZOR COMBO`)** | **钢铁碾压流 (`HEAVY JUGGERNAUT`)** | **陆空极速流 (`AERO APEX`)** |
| **常态 / NOS 极速** | **`285 / 355 km/h`** | **`325 / 400 km/h`** | **`255 / 340 km/h`** | **`360 / 445 km/h`** |
| **起步加速倍率 (`acceleration`)** | `1.05×`（线性均衡） | `1.50×`（零百狂暴弹射） | `0.75×`（NOS 推力 `92` 狂暴增压） | `1.30×`（离子推进，2026-11-06 由 1.68× 下调） |
| **转向 / 制动倍率 (`steering` / `brakeRate`)** | `1.10×` / `1.05×` | `1.42×` / `1.30×` | `0.76×` / `0.80×` | `1.10×` / `1.20×`（2026-11-06 由 1.28× / 1.40× 下调） |
| **碰撞扣血 (`damage`)** | `-25`（4 次抗撞） | `-34`（3 次抗撞，高风险高收益） | **`-20`（5 次重甲抗撞，撞大货车/闯红灯扣 `-34`）** | `-25`（4 次抗撞） |
| **核心专属被动特长** | **🌀 尾流漂移大师**<br>施展 180° 掉头 (`Z`) 或 360° 旋转 (`X`) 特技时自动开启 `1.8s` 无损护盾并瞬间充能 `+25%` 氮气；普通超车氮气回复提升至 `+9%`。 | **⚡ 刀锋猎手 & 翘头狂飙**<br>`0.46m` 极窄碰撞箱；惊险超车净距阈值放宽 `+30%`（`1.38m`）且奖励提升至 `120×连击` 积分与 `+22%` 氮气；高速按住 `J` 翘头每秒自动跳 **`+60 PTS`** 并回复 **`+14%` 氮气**。 | **🛡️ 氮气牛栏破障 & 重型装甲**<br>侧面擦撞小车奖励 **`+280 PTS` & `+12%` 氮气**；**唯有开启 NOS 氮气冲锋时**车头牛栏才可正面撞飞前方小车（每次正面破障消耗 `-26%` 氮气并减速 `12%`）；未开氮气正撞、撞同吨位大货车（`ZA.length>=6`）或闯红灯均会真实受损扣血，彻底杜绝无脑挂机平推。 | **✈️ 6秒战术越障飞行 & 超车充能**<br>`F` 键满能量单次最多飞行 `6 秒`（「飞行续航」升级满级约 7.8 秒；空中不恢复飞行能量或氮气，空域掠过给 `+60 PTS` 基础越障分且不叠连击）；地面每次惊险超车回充 `1.5 秒`，车速 > 40 km/h 行驶时 `25 秒` 缓慢回满。详见第二十九节。 |

### 2. WebAudio 四车独立引擎声浪与专属气喇叭/电笛合成 (`fE`)
- **独立引擎声浪与滤波器曲线 (`fE.update`)**：
  - `sedan`：5 档运动跑车齿比，饱满双涡轮 V6 中频咆哮；
  - `motorcycle`：6 档高转速齿比，播放速率 `1.22 ~ 4.17×` 搭配高频低通/带通滤波，呈现万转直列四缸机车撕裂声浪；
  - `truck`：重型低速齿比，播放速率压低至 `0.46 ~ 1.64×` 搭配 `155Hz` 重低音共振与增强柴油涡轮底噪；
  - `jet`：无级超导齿比，叠加随车速升频（`900 + speed * 5.5 Hz`）的带通滤波器，释放等离子矢量涡轮呼啸声。
- **四套专属喇叭音色 (`uE.play` 真实采样双通道硬件变调 + `fE.horn` 持音包络谐波共鸣)**：
  - 基于真实汽车喇叭录音 [`horn.mp3`](file:///d:/AI项目集合/赛车游戏/assets/audio/horn.mp3) 构建双通道硬件变调（`preservesPitch = false`）与 `U_horn` 持音包络（Attack `14ms` + Sustain 饱满持音 + Release `55ms`）+ `Math.tanh` 簧片非线性谐波叠加：
  - `sedan`（疾风 GT 轿跑）：`1.0×` 原声博世双音跑车蜗牛喇叭；
  - `motorcycle`（幻影重机）：`1.34×` 高亢清脆机车街车双音电笛（`587Hz + 740Hz`）；
  - `truck`（泰坦重卡）：`0.58×` 主号角 + `0.72×` 副号角双管齐鸣 + `146.8Hz / 185Hz / 220Hz` 超低频气腔共鸣，呈现震撼美式重卡双管气喇叭（Air Horn）；
  - `jet`（天穹 V8 飞车）：`1.12×` 主号角 + `1.35×` 副号角大三度超跑双频高音号角（`466Hz / 587Hz / 698Hz`），清亮高贵、纯粹凌厉。

### 3. 第一人称专属液晶屏、天穹飞车全息飞行座舱 HUD 与 3D 车库五维面板
- **车载 3D 数字液晶屏 (`De`)**：根据车型动态切换专属铭牌与主题色（`GALE GT // V6` 冰川青 `#00e5ff`、`TITAN V12 // HD` 重工琥珀橙 `#ff9100`、`AETHER V8 // ION` 赛博星云紫 `#c084fc` 并額外绘制实时 `ION FLIGHT` 飞行能量条）。
- **天穹 V8 飞车第一人称全息座舱 (`.jet-cockpit-hud`)**：第一人称下自动为仪表台赋予深空赛博钛紫蓝金属光泽，并在视野中央与两侧渲染全息飞行准星（`.jet-hud-reticle`）、矢量推进状态翼框（`ION THRUST`）与实时马赫数表（`AERO MACH`）。
- **3D 车库五维性能面板 (`#garage-specs` & `paintSpecs`)**：在车库面板中实时展示每款座驾的流派定位徽章、专属被动特长详解以及 **极速、加速、操控、装甲** 动态渐变对比条，支持中英双语零刷新热切换。

---

## 十一、幻影重机（Phantom R1 Superbike）高精度 3D 建模与双车夹缝穿越（Lane Splitting）物理升级

针对此前摩托车 3D 建模较为简陋（仅由基础圆柱与方块拼装）以及由于社会车辆碰撞盒过宽导致玩家无法从两辆并排车中间穿过去（钻车缝）的问题，在 [`assets/js/drive.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js) 与 [`assets/js/boot.js`](file:///d:/AI项目集合/赛车游戏/assets/js/boot.js) 中完成了全套建模重塑与碰撞物理优化：

1. **幻影重机 (`ad("motorcycle")`) 与赛博骑手 (`Jp`) 233 部件高精度公升级仿赛建模**：
   - **前后弧面半热熔赛博轮胎与制动系统 (`buildSuperbikeWheel`)**：采用 `TorusGeometry` 圆环弧面胎面搭配双侧电光青发光轮毂灯环 (`#00f5d4`)、5 辐 Y 型铝合金轮毂、前轮双浮动打孔刹车盘 + 金色 Brembo 四活塞辐射卡钳、后轮 `200/55 ZR17` 赛道大宽胎 + 左侧金色 520 传动大牙盘与上下链条。
   - **攻击性鲨鱼头大包围、定风翼与 3D 全彩 TFT 液晶仪表总成**：车头转向组（`S`）新增香槟金倒置式前叉（Gold USD Forks）、上下铝合金三星联板与金色转向阻尼器（钛尺）、分离式竞技手把、牛角刹车/离合拉杆、刀锋定风翼后视镜、双曲率熏黑高风挡、冲压进气道、**对称双鹰眼 LED 矩阵大灯 + 闪电日行灯眉**、**MotoGP 级双层碳纤维破风定风翼**，以及一块 `512×256` `CanvasTexture` 实时绘制的 **3D 全彩发光 TFT 赛车液晶仪表屏 (`PHANTOM R1 // 16,000 RPM`)**。
   - **四缸裸露机械引擎、四出烧钛排气芭蕉与双侧 NOS 气瓶**：车体中部搭载铝合金双翼梁主车架、镂空钢管副车架、海鸥式铝合金后摇臂、中置金色气瓶后避震、带透明离合器边盖的直列四缸引擎、弧面水箱散热器、**四出烧钛排气芭蕉头段 + 双侧上扬六边形碳纤维尾段排气管**、雕塑感肌肉油箱、鲨鱼腮三层刀锋侧整流罩、车底电光青霓虹氛围灯带、镂空上翘战斗车尾、双侧外挂蓝色 NOS 氮气高压瓶以及贯穿式双翼红光 LED 尾灯。
   - **赛博骑手 (`Jp`) 外挂护甲与公路对手重机 (`wA`) 同步升级**：为骑手全盔加装破风大尾翼与护嘴，背部挂载空气动力学背甲驼峰（Aero Speed Hump）与发光脊椎条，双肩与双膝挂载钛合金防摔磨包滑块；同时将公路上的挑衅摩托对手 `wA` 由旧版方块人升级为全精度仿赛重机（配专属烈焰橙 `#ff6d00` 涂装）。
2. **消除社会车辆隐形空气墙 & 全车型双车夹缝穿越（Lane Split）实装**：
   - **NPC 社会车辆碰撞半宽还原**：修复 [`drive.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js) 中非 `story-3` 模式下将所有社会车辆 `halfWidth` 硬编码为 `1.58m`（全宽 `3.16m`）导致相邻车道（中心距 `4.0m`）中间仅剩 `0.80m` 空气墙死胡同的问题；将社会小轿车碰撞半宽统一还原为与 3D 视觉一致的 **`0.96m`**（大货车 **`1.06m`**，交叉路口车辆 `halfLength: 1.02m`），使并排两车之间的真实可通行净空拓宽至 **`2.04m`**。
   - **玩家座驾物理碰撞半宽 (`R9`) 精调**：幻影重机 `halfWidth: 0.34m`（全宽 `0.68m`，钻缝余量达 `1.36m`）、天穹 V8 飞车 `0.80m`、疾风 GT 轿跑 `0.82m`、泰坦重卡 `0.92m`，确保全车型对准两车之间的车道白线（`x = ±2m`）均可顺畅穿插通过。
   - **钻缝边角擦掠顺滑偏转与侧撞转化 (`_cornerGlance` in `tE`)**：在连续碰撞求解器 `tE` 中识别边缘擦碰（横向偏离中心达总半宽 `64%` 以上），若擦到可弹飞小车边角直接转化为酷炫侧向弹飞（Takedown），若擦到大货车边角则顺滑横向推开，彻底杜绝钻车缝时挂到一点车尾边角就被当成迎头追尾锁速扣血的问题。
   - **专属“⚡ 刀锋钻缝穿越 (`Lane Split`)”连击与积分加成**：高速（`>= 85 km/h`）从两辆并排行驶的车辆正中间穿过时，自动触发 `⚡ 刀锋钻缝穿越 ×N`（`⚡ Lane Split ×N`），连击直接 **`+2`**，并额外奖励 **`+180 PTS`（重机）/ `+140 PTS`（四轮）** 与 **`+14%` 氮气**。

---

## 十二、路面多样化挑衅车队与双向声光 / 表情实时互动系统

针对此前公路上仅有“1 辆固定英文台词的摩托车”和“普通方块手势小轿车”两种单向挑衅、且社会车辆对玩家的喇叭/远光灯/表情毫无回应的问题，在 [`assets/js/drive.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js) 与 [`index.html`](file:///d:/AI项目集合/赛车游戏/index.html) 中构建了 **6 大个性化街头车流角色 + 双向声光与表情互动闭环**：

### 1. 六大路面挑衅车型与 3D 专属外观 / 手势矩阵 (`cA` & `persona`)

| 角色代号 (`persona`) | 车型定位 | 3D 专属外观特征 | 车窗动态手势 (`gesture`) | 专属回应喇叭 (`hornKind`) | 气泡主题色与徽章 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`racer`** | **🏎️ 炸街霓虹超跑** | 赛博电光紫 (`#9d4edd`) / 极光青 (`#00e5a3`) 涂装、碳纤前铲、宽体侧裙、底盘霓虹氛围灯带、双立柱高耸 GT 大尾翼；巡航速度 `+18%` | 红黑赛车手套挑衅手势 | 超跑双频高音号角 (`jet`) | 电光青 `#00e5ff` (`🏎️`) |
| **`brawler`** | **🛻 改装越野皮卡** | 烈焰橙 (`#ff5400`) / 荒漠金 (`#f59e0b`) 涂装、双排座驾驶室 + 后部开放式皮卡货斗、粗壮黑色防滚龙门架、车顶 4 联装高流明探照灯、竞技前护杠 | 黑色战术护腕霸气挥拳 | 浑厚低音气喇叭 (`truck`) | 烈焰橙 `#ff5400` (`🛻`) |
| **`party`** | **🎶 落日敞篷嗨歌车** | 霓虹玫粉 (`#ff2a85`) / 电光黄 (`#facc15`) 涂装、倾斜无框前挡风、敞篷运动桶椅、紫光重低音炮、**车内 2 名戴墨镜挥荧光棒的 3D 派对乘员** | 高频挥舞发光紫青荧光应援棒 | 轻快双音跑车喇叭 (`sedan`) | 霓虹紫 `#d946ef` (`🎶`) |
| **`heavy`** | **🚛 暴躁重型卡车** | 镀铬重型前防撞护杠、驾驶室顶部双侧高流明琥珀色警示灯 (`#ffab00`)、双侧直立镀铬排气管 | 硬汉护腕挥拳叫板 | 震撼美式重卡气喇叭 (`truck`) | 琥珀金 `#ffab00` (`🚛`) |
| **`biker`** | **🏍️ 街头狂飙机车手** | 烈焰橙涂装 233 部件公升级仿赛重机 + 赛博背甲骑手；高速追逐超车并随机切换多句双语挑衅金句 | 机车挑衅手势 | 高亢街车双音电笛 (`motorcycle`) | 电光青 `#00e5ff` (`🏍️`) |
| **`commuter`** | **🚗 都市通勤 / 斗气轿车** | 多彩都市轿跑涂装，兼具礼貌避让与冷不防加塞抢道的双重街头性格 | 经典路怒手势 | 标准双音蜗牛喇叭 (`sedan`) | 天际蓝 `#38bdf8` (`🚗`) |

### 2. 全车流 3D 动态双语霓虹气泡系统 (`createNpcBubble` & `NPC_DIALOGUE_POOL`)
- 为主路全部 12 个交通槽位挂载独立的 `512×128` `CanvasTexture` + `THREE.Sprite` 头顶霓虹气泡（在交叉路口克隆车 `et` 后挂载，避免污染横向车流，且仅在台词触发或 `horizon-lang-change` 切换中英文时按需重绘，运行时零额外 Canvas 开销）。
- 内置 **6 大角色 × 5 大交互场景（`taunt` 主动挑衅、`angry` 被激怒回怼、`yield` 礼貌让道、`cheer` 表情互动点赞、`shock` 被反超/撞飞破防求饶）** 共计 50+ 组中英双语街头台词，随气泡字数自适应字号缩放并带悬浮呼吸动画。

### 3. 玩家主动声光与表情双向互动闭环（含适度安全缓冲与远距快速避让优化）
1. **鸣笛喇叭双向互动 (`空格 / H` → `handlePlayerHorn`)**：
   - **礼貌避让 / 嗨歌致意**：有效探测距离扩展至前方 `110m`（横向容差 `2.8m`）；对前方或身旁的守规矩轿车 / 敞篷嗨歌车按喇叭时，前车会打起转向灯并以 **`4.5` 快速避让阻尼（`yieldingUntil`）** 干脆利落地让出当前快车道（`tryYieldLane`），头顶弹出翠绿气泡（如 `"🔊 听到喇叭啦！快车道让给你！"`）并短促鸣笛回应。
   - **路怒对骂回怼**：对炸街超跑、改装皮卡或暴躁重卡按喇叭时，对方会按响专属重卡气喇叭/超跑号角回怼，伸出挥拳手势、弹出红框路怒气泡（如 `"💢 敢对超跑按喇叭？！先追上我再说！"`）并进入斗气拦截模式。
2. **闪远光超车灯双向互动 (`F / 1` → `flashLights`)**：
   - 无需连闪两次，在前方 `110m` 内单次闪远光灯即可唤醒前车反应：守规矩前车收到远光信号后会打转向灯快速变道让出超车线并弹出翠绿气泡；而硬茬改装皮卡/超跑或被连续晃灯激怒的前车则会爆闪尾灯、鸣笛回敬并强行封堵车道。
3. **一键快捷表情与右上角实时社交 (`B / 3` 键 → `horizon-quick-emote` & `handlePlayerEmote`)**：
   - 支持直接按键盘 **`B` 键或 `3` 键**一键轮播发送表情/快捷短语（免去飙车时点击右上角二级菜单的分心操作）；视野 `115m` 内最近的 NPC 车手会立即挥舞手势/荧光棒、鸣笛致意并弹出紫金互动气泡（如 `"🔥 座驾够帅！一起炸街狂飙！"`、`"🎉 气氛值拉满！老铁太会玩了 666！"`），同时奖励 **`+30 PTS`** 街头社交互动积分（6 秒冷却）。
4. **适度安全操控缓冲与挑衅反杀赏金 (`Rival Beatdown Bonus`)**：
   - **温和微调安全缓冲（兼顾压迫刺激感与操控容错）**：斗气车与闪灯路怒车的最小贴尾拦截脱开净距由 `2m ~ 3m` 微调至 **`6.5m`**（约 1.3 个车身），恶意前车加塞触发区间由 `12m ~ 40m` 微调至 **`18m ~ 52m`**，特色车型主动挑衅区间微调至 **`18m ~ 68m`**，气泡可见距离扩展至 `142m` 并带最高 `1.45×` 的远距透视放大补偿。
   - **反超 / 撞飞破防求饶**：当玩家高速**反超**或**侧撞弹飞**任何挑衅过自己的对手时，对手头顶气泡会瞬间切换为琥珀橙 `shock` 破防求饶台词（如 `"😱 怎么可能？！你这车改了火箭吗？！"`、`"🏳️ 大哥饶命！我乖乖滚去慢车道！"`），并额外奖励 **`+120 PTS` 挑衅制裁赏金** 与 **`+10% ~ +12%` 氮气**。

---

## 十三、背景音乐版权合规审计与 Google Lyria 原创粤语 DJ 战歌《踩尽油门》实装

针对 [`assets/audio/bgm.mp3`](file:///d:/AI项目集合/赛车游戏/assets/audio/bgm.mp3) 的商业版权合规性排查与 Google Lyria 原创粤语战歌 **《踩尽油门 (Full Cantonese Version)》** 母带级替换：

1. **旧版音频双层商业版权风险识别与本地备份**：
   - 经音频实听与指纹比对，旧版 `bgm.mp3` 为民间未授权混音版：主歌/副歌翻唱自香港 1990 年商业粤语歌曲 **《黑街》**（作词：陈少琪 / 作曲：李健达 / 原唱：陈雅雯 / 世纪唱片），且 `0:46–1:17` Drop 段直接混用了欧美商业舞曲 **《Rock to the Rhythm》**（*Cutback feat. Federal*）的人声采样，不可直接用于商业发行或上架 CrazyGames。
   - 已将旧版音频无损备份至 [`assets/audio/bgm-original-backup.mp3`](file:///d:/AI项目集合/赛车游戏/assets/audio/bgm-original-backup.mp3)（仅供本地对比，已从 [`HorizonOverdrive-CrazyGames.zip`](file:///d:/AI项目集合/赛车游戏/HorizonOverdrive-CrazyGames.zip) 商业发行包中剔除）。
   - 同时确认 [`assets/audio/horn.mp3`](file:///d:/AI项目集合/赛车游戏/assets/audio/horn.mp3)（9.6 KB）仅为 0.5 秒通用单音喇叭短音效，无版权风险。
2. **Google Lyria 原创粤语车载 DJ 战歌《踩尽油门 (Full Cantonese Version)》母带优化与接入**：
   - **版权归属**：由开发者（`earlyrise`）使用 Google Lyria 生成的原创粤语摇滚 + Melbourne Bounce 车载电音战歌 [`踩尽油门 (Full Cantonese Version).mp3`](file:///d:/AI项目集合/赛车游戏/踩尽油门%20(Full%20Cantonese%20Version).mp3)，词曲与录音制品版权 100% 归属开发者本人，彻底消除商业发行与直播 Content ID 风险。
   - **三项母带工程化优化（[`assets/audio/bgm.mp3`](file:///d:/AI项目集合/赛车游戏/assets/audio/bgm.mp3)）**：
     1. **剥离无用内嵌大图瘦身 `-30%`**：移除源文件流 1 内嵌的 `1408×768` MJPEG 专辑封面图（`-vn`），将音频体积从 `3.68 MB` 精简至 **`2.61 MB`**（`44.1kHz, 128kbps` 立体声 MP3）；
     2. **裁剪首尾空白静音实现无缝循环**：精准切掉开头 `0.00s–0.40s` 与结尾 `163.50s–165.91s` 的多余空白静音段（定长 `02:43.13`），并施加 `1.3s` 顺滑尾音过渡，杜绝游戏内循环播放时出现 3 秒冷场断档；
     3. **俱乐部级响度对齐 (`-12.4 dB`) 与防缓存刷新**：通过 `+6.0 dB` 增益与母带限幅器（`alimiter`）将原文件偏低的平均响度（`-17.8 dB`）拉齐至 **`-12.4 dB`**（峰值 `0.0 dB` 零削波），确保在游戏内不会被引擎声浪压制；同时在 [`assets/js/drive.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js) 与 [`index.html`](file:///d:/AI项目集合/赛车游戏/index.html) 中追加 `?v=20261101lyria` / `?v=20261101p` 防缓存参数并重新打包 [`HorizonOverdrive-CrazyGames.zip`](file:///d:/AI项目集合/赛车游戏/HorizonOverdrive-CrazyGames.zip)。

---

## 十四、场景启动 TDZ 异常修复 (`Cannot access 're' before initialization`) 与左上角 HUD 快捷栏横屏布局精调

针对启动或切换座驾时偶发/必现的 `Cannot access 're' before initialization`（触发 `🚗 切换座驾` / `暂时无法出发` 兜底弹窗）以及横屏下左上角快捷操作栏与里程卡片重叠的问题，在 [`assets/js/drive.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js)、[`assets/css/drive.css`](file:///d:/AI项目集合/赛车游戏/assets/css/drive.css) 与 [`index.html`](file:///d:/AI项目集合/赛车游戏/index.html) 中完成了根因修复与全载具回归验证：

1. **修复 `yE()` 3D 场景初始化阶段 `re` 变量的暂时性死区（TDZ）异常（[`assets/js/drive.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js)）**：
   - **根因定位**：在 [`yE`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js#L68-L154) 初始化过程中，创建交通车流数组 `cA` 与横向车流 `et` 后，立即调用了 `wA.npcBubble.trigger("taunt", 0)` 预热挑衅机车手 `wA` 的 3D 气泡 `CanvasTexture`。而 [`createNpcBubble`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js#L126-L152) 的 `trigger()` 方法内部执行了 `this.until = re + dur`（读取场景累计运行时间 `re`），但 `let re = 0` 的声明位置却位于座舱网格构建代码之后（第 153 行后段），从而在同步预热阶段触发了 ES6 `let` 变量的暂时性死区（TDZ）异常 `ReferenceError: Cannot access 're' before initialization`。
   - **修复方案**：将 `re = 0` 提前至 [`yE`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js#L69) 顶部的 `let cA = [], ..., Zt = -100, Rn = 0, re = 0` 声明列表中（位于 [`createNpcBubble`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js#L126) 定义与任何气泡预热调用之前），并移除后续重复的 `re = 0` 声明。经 AST 全量静态扫描与无头浏览器实测，4 款座驾（`sedan`、`motorcycle`、`truck`、`jet`）启动及车库热切换全程零报错。
2. **修复左上角 `.hud-quick-actions` 横屏重叠与 `.game-settings-open` 垂直偏移（[`assets/css/drive.css`](file:///d:/AI项目集合/赛车游戏/assets/css/drive.css)）**：
   - **垂直错位修复**：[`assets/css/boot.css`](file:///d:/AI项目集合/赛车游戏/assets/css/boot.css#L728-L735) 中的 `.game-settings-open` 带有 `margin: 0 0 14px; width: 100%;`，导致左上角快捷栏中的 `⚙️ 设置` 按钮比相邻按钮偏高且宽度被撑开。在 [`assets/css/drive.css`](file:///d:/AI项目集合/赛车游戏/assets/css/drive.css#L3453-L3458) 的 `.home-return-button .hud-quick-btn` 中显式重置 `width: auto; margin: 0; padding: 0 10px;`，确保 4 枚快捷按钮（`🚗 换车` / `⚙️ 设置` / `📖 引导` / `🌐 EN`）严格水平对齐。
   - **横屏防重叠布局**：将 `html[data-orientation=landscape] .home-return-button.hud-quick-actions` 的 `left` 由 `calc(130px + var(--safe-left, 0px))` 精调为 `calc(74px + var(--safe-left, 0px))`（[`assets/css/drive.css`](file:///d:/AI项目集合/赛车游戏/assets/css/drive.css#L3449-L3452)），既避开左侧 `闪灯 · F/1` 按钮（右边缘 `60px`），又消除与中央偏左 `0.00 km` 里程卡片（`.trip-card`）的水平重叠。

---

## 十五、幻影重机（Phantom Superbike）第三人称追尾视角、车头转向解耦与 3D 骑手骨骼姿态重塑

针对幻影重机在第三人称视角（`data-camera="third"`）下呈现“高空监控式陡峭俯拍、转向时前整流罩与风挡跟着车把扭断撕裂、骑手原版卡通巨型方头吞没头盔、臀部悬空 18cm 与螳螂架肘”等视觉异常，在 [`assets/js/drive.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js) 与 [`index.html`](file:///d:/AI项目集合/赛车游戏/index.html) 中完成了 5 项根因修复：

1. **第三人称低趴运动追尾相机（Chase Camera）与横向阻尼同步（[`drive.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js#L61-L69)）**：
   - 将幻影重机第三人称相机高度由全车型硬编码的 `4.5m` 调整为机车专属低趴高度 `2.35 + At + eo.lift * 0.42`（隧道内 `2.25m`），跟随距离 `R9.motorcycle.chase` 由 `7.8m` 收紧至 `6.2m`（隧道内 `5.8m`），使相机俯角由陡峭的 $-24.2^\circ$ 优化为平视肩背与远方地平线的 $-10.7^\circ$。
   - 将重机相机位置插值阻尼由 `8` 提升至 `14`，并将 `U.lookAt` 横向焦点设为与相机同步的平滑坐标 `gl.x * 0.72 + Ze * 0.28 - Math.sin(ZA) * 10`、视线高度设为 `1.18 + At + eo.lift * 0.55`，彻底消除高灵敏度变道时的镜头偏航摇摆（Yaw Whip）与翘头特技时的视线脱节。
2. **前整流罩 / 大灯 / 定风翼 / 风挡与车把转向枢轴 `S` 解耦（[`drive.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js#L59) `ad("motorcycle")`）**：
   - 将 **3D TFT 液晶仪表总成、鲨鱼头前整流罩、中央冲压进气道、双鹰眼 LED 大灯、MotoGP 双层碳纤维定风翼、双曲率熏黑高风挡、刀锋后视镜** 移至转向组切片索引 `z` 之前创建，使其稳固固定在主车架 `t` 上；
   - 转向枢轴 `S`（`S.position.set(0, 1.2, -0.55)`，`S.rotation.y = C * 0.22`）仅绑定 **前轮总成、金色倒置前叉、破风前挡泥板、上下三星联板、转向阻尼器与分离式低车把（高度由 `1.38m` 降至真实仿赛低把 `1.19m`）**，彻底解决打方向时车头外壳扭断错位的问题。
3. **骑手原版卡通巨型方头顶点收缩与赛道全盔校准（[`drive.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js#L59) `Jp`）**：
   - 在初始化 `co`（`B_Avatar`）蒙皮网格 `r` 时，将 `y > 2.25` 的原版直径 `1.09m` 卡通大头顶点向颈部中心 `(0, 2.38, -0.02)` 收缩至 `0.24` 倍作为赛车服脖颈内衬（不受第一/第三人称切换 `Head.scale` 影响）；
   - 将赛道全盔主体（半径 `0.28`）、电光青曲面护目镜、下巴护嘴与破风大尾翼直接挂载于 `i.Head` 骨骼颈部基准位 `(0, -0.22, 0.02)`（替代原版偏移 `+0.506m` 的 `n[4]` 空节点），彻底根治“巨型多面体方头吞没小头盔”与“长颈鹿脖子”。
4. **骑手低趴坐姿贴合与双骨 IK 极向量修正（[`drive.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js#L59) `Jp`）**：
   - 将骑手根节点 `A.position` 由 `(0, 1.27 - 1.51 * 0.65, 0.3)` 降至 `(0, 1.07 - 1.51 * 0.65, 0.28)`，使臀部严丝合缝贴合在 `y = 1.08m` 的麂皮座垫上；
   - 将手肘双骨 IK 极向量 `S` 由朝天外翻的 `(±0.7, 1.55, 0.36)` 修正为自然下沉夹车的 `(±0.46, 0.92, -0.05)`，脚踏目标点 `x` 对齐至 `(±0.28, 0.51, 0.22)`，消除“螳螂架肘”。
5. **MotoGP 压弯侧挂（Lean-in / Knee-out）与接地高度补偿（[`drive.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js#L59,L69)）**：
   - 将重机最大压弯倾角由 `0.25 rad`（$14.3^\circ$）提升至 `0.38 rad`（$21.8^\circ$）并增加 `(1 - Math.cos(bikeRoll)) * 0.12` 压弯重心下沉补偿與相机轻微随动滚转；
   - 在骑手 `K` 更新函数中引入随车速与转向角动态计算的 `lean` 侧挂因子，驱动臀部横移、脊椎内倾、头部抬头注视弯心以及弯心内侧膝盖外展（`kneePole` 横向外展 `0.16`），同时校准第一人称相机挂载点至 `(0, 1.56, -0.08)`。

---

## 十六、幻影重机（Phantom Superbike）第一人称驾驶视线遮挡根治与赛道级超清战斗座舱重塑

针对玩家在第一人称（`data-camera="first"`）驾驶幻影重机时反馈“挡视线”、前方路面车辆与隧道被车头风挡大面积死死遮挡的问题，在 [`assets/js/drive.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js) 中进行了深度投影几何推演、材质物理重塑与座舱视野架构优化：

### 1. 视线遮挡本质根因拆解与 NDC 空间验算
通过构建相机空间透视投影矩阵（FOV $80^\circ$、纵横比 $16:9$）进行全顶点三维变换推演，定位到 3 大致命结构性缺陷：
- **风挡几何失真与过厚（Windshield Geometry）**：原版代码将双曲率风挡构建为厚达 $0.32\text{m}$、高 $0.22\text{m}$ 的实心长方体（`BoxGeometry(0.3, 0.22, 0.32)`），中心位于 `(0, 1.36, -0.74)`。经 NDC 投影推演，其上沿投影直接冲高至 $\text{NDC Y} = +0.174$（完全穿过了地平线 $\text{NDC Y} = 0.0$ 并侵占屏幕上半部），水平宽度占满 $\text{NDC X} \in [-0.203, +0.203]$，像一堵实心石墙横亘在驾驶员正前方。
- **材质完全不透明且自发光遮光（Opaque & Emissive Blocking）**：`visorMat` 原先使用了不透明的 `MeshStandardMaterial`（`emissive: "#00e5ff"`，无 `transparent` 与 `opacity` 设置），导致其在 Three.js 深度缓冲中强行剔除了后方所有路面标线、交通车辆与远景隧道几何体。
- **第一人称视点低头过度（Excessive Pitch Down）**：原版第一人称相机挂载于 `(0, 1.56, -0.08)`，俯仰角为偏低的 `-0.18 rad`（低头向下看 $10.3^\circ$），将视心强行压低砸向风挡顶盖，使得本应处于眼角余光的车头部件被推到了画面正中央。

### 2. 生产级座舱视野重塑方案与参数对比

| 模块 / 关键参数 | 修复前（原版阻塞） | 修复后（赛道超清战斗座舱） | 核心体验收益 |
| :--- | :--- | :--- | :--- |
| **相机视点坐标 `U.position`** | `(0, 1.56, -0.08)` | `(0, 1.53, -0.18)` | 视点前移 $10\text{cm}$、微沉 $3\text{cm}$，精准贴合赛道骑手俯冲进攻式护目镜机位 |
| **相机俯仰角 `U.rotation.x`** | `-0.18 rad`（向下低头 $10.3^\circ$） | `-0.05 rad`（平视微俯 $2.9^\circ$） | 视线笔直贯通前方远景地平线，前方道路垂直视野净空率提升超 $75\%$ |
| **风挡材质 `visorMat`** | 不透明实心发光深块（`opacity: 1.0`） | 竞技级高透熏黑聚碳酸酯（`transparent: true, opacity: 0.26, roughness: 0.06`） | 即使视线掠过风挡，也能 $100\%$ 清晰透视前方全部车流与路面细节 |
| **风挡几何与位置** | 厚达 $0.32\text{m}$ 方块，`y = 1.36`，倾角 $-0.58$ | 流线薄片（厚度 $0.015\text{m}$），`y = 1.21`，低趴倾角 $-0.72$ | 投影最高点自 $\text{NDC Y} = +0.174$ 下降至 $-0.495$，绝不逾越地平线半步 |
| **3D TFT 液晶仪表总成** | `y = 1.302, z = -0.608`，倾角 $-0.42$ | `y = 1.19, z = -0.60`，后倾角 $-0.48$ | 稳定落在屏幕底边 $15\% \sim 25\%$ 黄金 HUD 区，清晰呈现 $299\text{ km/h}$ 与挡位 |
| **车头导流罩与后视镜** | 耸立遮挡前方车道 | 气动低矮下沉，后视镜外展分布在屏幕下左右角 | 左右侧后视镜各司其职，中央车道彻底净空 |
| **第一人称动态透光钩子** | 无自适应联动（头盔缩放后直接穿帮） | `setFirstPerson(b)` 动态调节：第一人称下 `opacity = 0.10` 且隐去边缘高亮光条 | 第一人称视野纯净极致；第三人称下风挡呈现完整酷炫熏黑质感 |

### 3. 全局构建与打包验证
- **JS 语法与运行时校验**：`node --check assets/js/drive.js` 零报错通过；
- **分发离线包同步**：重新以最大压缩率全量打包生成 [`HorizonOverdrive-CrazyGames.zip`](file:///d:/AI项目集合/赛车游戏/HorizonOverdrive-CrazyGames.zip)（11.4 MB），包含最新修复的驾驶引擎脚本、样式表与全部音频图像资源。


---

---

## 十七、四款座驾真实物理采样喇叭音源重构（双振膜频域解耦与分车型真车声学标定）

针对玩家反馈“**喇叭声还是不对，除了重卡的声音对的，其他的喇叭声一点都不符合车型**”问题，对 [`assets/audio/horn.mp3`](file:///d:/AI项目集合/赛车游戏/assets/audio/horn.mp3) 进行了 FFT 频谱解构，并彻底废除了第 17 章初版中存在微积分相位积分缺陷的纯 `Math.sin` 合成器（`mkSnailHorn` / `mkMotoDiscHorn`），全面升级为**100% 基于真实物理喇叭录音采样的频域解耦与分车型真车声学标定方案**：

### 1. 旧版合成喇叭失真根因诊断
1. **微积分瞬时频率计算缺陷导致激光枪滑音（Chirp Bug）**：旧版 `mkSnailHorn` 与 `mkMotoDiscHorn` 在计算随时间变化的频率 $f(t) = f_0(1 - A e^{-\alpha t})$ 时，错误地将相位写成了 $\phi(t) = 2\pi f(t) \cdot t$（而非积分 $\int_0^t 2\pi f(\tau)d\tau$），导致瞬时频率 $f_{\text{inst}}(t) = f(t) + t f'(t)$ 在前 $20\text{ ms}$ 出现剧烈向上扫频，使跑车、超跑与摩托每次按喇叭开头都发出类似玩具激光枪/鸟叫的“啾——”声。
2. **纯正弦波加法合成缺乏真实物理声学纹理**：静态正弦波叠加缺乏真实电磁断电器（Contact Breaker）机械触点咬合瞬态、振膜边缘非线性湍流与车外空气反射，听感如同廉价电子蜂鸣器；且摩托车误加了钟琴非谐波色散公式 $\sqrt{1 + 0.0014 h^2}$，导致声音像敲击金属钟琴而非真实摩托车铁饼电喇叭。
3. **`horn.mp3` 真实频谱本质还原**：经 `44.1 kHz` FFT 实测，[`assets/audio/horn.mp3`](file:///d:/AI项目集合/赛车游戏/assets/audio/horn.mp3) 本身是一段由两颗真实物理电磁喇叭同时发声的实录采样——低音振膜基频 $f_1 = 423.35\text{ Hz}$、高音振膜基频 $f_2 = 540.05\text{ Hz}$。重卡（`truck`）之所以听感真实，正是因为重卡保留了该真实录音采样的双通道硬件变调（`0.58x` + `0.72x`）。

### 2. 真实物理采样频域解耦与四款车型专属真车音源架构

通过零相位高斯谐波陷波滤波器组（Harmonic Comb Notch Filter），从 [`assets/audio/horn.mp3`](file:///d:/AI项目集合/赛车游戏/assets/audio/horn.mp3) 真实录音中无损分离出两颗独立的真实物理喇叭振膜采样 $V_{\text{low}}(t)$（$423.35\text{ Hz}$）与 $V_{\text{high}}(t)$（$540.05\text{ Hz}$），对照现实世界中四类车型的真实原厂喇叭声学标准，生成独立高保真采样文件并同步内嵌 WebAudio `decodeAudioData` 双重保障通道（支持 `http://` 与 `file://` 离线直开及路怒 NPC 多声道并发回应）：

| 座驾 / 角色 | 真实音源文件 (`uE` & `fE`) | 真车物理喇叭原型与核心声学参数 | 真实听感特征 |
| :--- | :--- | :--- | :--- |
| **04 泰坦重型卡车 (`truck`)** | [`horn.mp3`](file:///d:/AI项目集合/赛车游戏/assets/audio/horn.mp3)（`0.58x` + `0.72x` 双轨气笛采样）+ `wTruck` | 美式重卡双管低频气喇叭（`245 Hz + 310 Hz` 实录变调叠加 `146.83 / 185 / 220 Hz` 超低音气腔共鸣） | **100% 保持原有震撼浑厚的美式重卡气喇叭效果不变** |
| **01 疾风 GT 轿跑 (`sedan`)** | [`horn-sedan.mp3`](file:///d:/AI项目集合/赛车游戏/assets/audio/horn-sedan.mp3)（内嵌同源解码 `w`） | **欧系 Bosch / Hella 运动轿跑双音蜗牛喇叭**：真实双振膜重标定为 `380 Hz (G4) + 475 Hz (B4)` 纯正 4:5 大三度和弦，附加 `4ms` 左右安装声程差与 `370 ~ 1140 Hz` 螺旋蜗牛共鸣腔饱满低中频 | 醇厚、沉稳、富有德系轿跑（宝马/保时捷）原厂厚重感的“叭——！”声 |
| **02 幻影重机 (`motorcycle`)** | [`horn-moto.mp3`](file:///d:/AI项目集合/赛车游戏/assets/audio/horn-moto.mp3)（内嵌同源解码 `wMoto`） | **日系公升级重机 Nikko / Denso 70mm 扁平单音铁饼电喇叭**：彻底剥离双音和弦，仅保留单颗真实物理振膜并标定至 `480 Hz` 纯单音；削薄 `< 1 kHz` 腔体共鸣，强化 `2.4 ~ 3.84 kHz` 铁片中心谐振盘（Resonator Disc）金属峰与电磁断电器触点颗粒，`0.32s` 干脆收尾 | 清脆、单薄、极具街头真摩托车（雅马哈 R1 / 本田 CBR）辨识度的单音“哔——！”声 |
| **03 天穹 V8 飞车 (`jet`)** | [`horn-jet.mp3`](file:///d:/AI项目集合/赛车游戏/assets/audio/horn-jet.mp3)（内嵌同源解码 `wJet`） | **意式超级跑车 FIAMM 高亢双音号角**：真实双振膜标定为 `440 Hz (A4) + 554.37 Hz (C#5)` 高音大三度和弦（比普通轿跑高出小三度），附加 `5ms` 双号角气压相位差与 `1.3 ~ 3.5 kHz` 明亮金属号筒泛音 | 高亢、清亮、犀利，完美契合法拉利/兰博基尼级旗舰超跑的高速穿透力 |

---

## 十八、泰坦重卡（Titan Truck）与天穹飞车（Aether V8 Jet）第一人称驾驶舱参考基础车辆 SVG 全景架构重塑

针对泰坦重型卡车（`truck`）旧版独立位图座舱在横屏/超宽屏下出现左右悬空截断、方向盘上半圈被 `overflow: hidden` 削顶截断、无车手双手且缺少左右斜升车门内衬板，以及天穹 V8 飞车（`jet`）紫色 `hue-rotate` 滤镜与视野中央准星框造成视觉干扰的问题，在 [`assets/js/drive.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js)、[`assets/css/boot.css`](file:///d:/AI项目集合/赛车游戏/assets/css/boot.css) 与 [`assets/css/drive.css`](file:///d:/AI项目集合/赛车游戏/assets/css/drive.css) 中完成了参考基础车辆（疾风 GT 轿跑 `sedan`）的统一架构重塑：

### 1. 统一采用基础车辆的无截断 SVG 座舱骨架与双手握盘动画
1. **解除卡车座舱屏蔽并停用旧版位图容器**：
   - 在 [`assets/css/boot.css`](file:///d:/AI项目集合/赛车游戏/assets/css/boot.css#L1323-L1326) 中移除了 `html[data-vehicle='truck'] .dashboard-art, .dashboard-landscape, .driver-sprites { display: none !important; }`，并将旧版 `.truck-cockpit` 彻底停用；
   - 卡车与飞车全面共享基础车辆的横屏 [`dashboard-landscape`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js#L153)（`viewBox="0 0 1536 360" preserveAspectRatio="none"`，含左右斜升车门内衬板 `M0 48 L380 134 L474 360 H0Z` / `M1536 48 L1156 134 L1062 360 H1536Z` 与中央拱形仪表台）、竖屏 `dashboard-art` 以及 9 帧手绘双手握方向盘转动序列动画 [`driver-sprites`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js#L153)。
2. **移除飞车紫色滤镜与视野中央准星框**：
   - 在 [`assets/css/drive.css`](file:///d:/AI项目集合/赛车游戏/assets/css/drive.css#L3883-L3886) 与 [`assets/js/drive.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js#L153) 中移除了 `hue-rotate(215deg)` 紫色滤镜及 `.jet-cockpit-hud` 浮动准星 DOM，恢复与基础车辆一致的干净原色风格与通透前向视野。

### 2. 三款四轮座驾的专属原色 SVG 配色与仪表台细节线条

| 座驾 | 主仪表台原色渐变 (`landscape-dash`) | 左右斜升车门渐变 (`landscape-door`) | 专属 SVG 仪表台与车门细节线条 |
| :--- | :--- | :--- | :--- |
| **01 疾风 GT 轿跑 (`sedan`)** | `#6d6e7c` → `#454953`（经典蓝灰运动内饰） | `#343d49` → `#202b35` | 保持 100% 原版基准单叶斜梯形出风口与流畅内凹压线 |
| **04 泰坦重型卡车 (`truck`)** | `#555b65` → `#353a43`（硬派炭钛灰重装原色） | `#2a313b` → `#181e25`（深钢灰车门护板） | 双层百叶格栅出风口 + 工业琥珀金（`#d97706`）侧标刻线 + 中控顶沿防滑储物槽压线 + 车门双平行加固防擦折线 |
| **03 天穹 V8 飞车 (`jet`)** | `#778191` → `#4c5564`（太空冷银钛灰超跑原色） | `#374151` → `#1f2937`（深空冷灰蓝门板） | 双翼流线导风叶片 + 冰川青（`#38bdf8`）细微导光饰条 + 拱顶流线航电刻线 + 车门双导槽折线 |


---

## 十九、幻影重机 (`motorcycle`) 与赛博骑手 (`Jp`) 第三人称视觉全面重塑

针对玩家反馈第三人称视角下幻影重机与骑手外观“**有点丑**”（表现为恶魔尖角肩甲+青色穿模斑块、头盔后脑勺风暴兵鬼脸、后背死黑平板、悬空棕色方块转向灯与杂乱排气管）的问题，对 [`assets/js/drive.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js) 模块 1 中的 [`Jp`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js#L59) 与 [`ad("motorcycle")`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js#L59) 进行了底层几何拓扑诊断与全面重构：

### 1. 五大视觉缺陷根因诊断
1. **恶魔尖肩与青色圆斑穿模**：
   - 在 [`drive-models.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive-models.js) 的 `co`（`B_Avatar` 4200 顶点蒙皮网格）中，`LeftUpperArm` / `RightUpperArm` 骨骼的肩部顶点在绑定姿态下高度达到 `Y = [2.070, 2.425]`，而 `Head`（`jointIndex === 2`）位于 `Y = [2.315, 3.410]`。
   - 旧代码使用粗暴的高度阈值 `if (vy > 2.25)` 收缩头部顶点，误将双肩上沿顶点（`Y = 2.25 ~ 2.425`）强行拉入颈部中心 `(0, 2.38, -0.02)`。当双臂向前伸展抓握车把时，受大臂骨骼权重驱动的肩部顶点被撕裂拉扯成两道巨大的黑色尖刺，并使内部青色自发光护肩球体局部穿模露出。
2. **四通道蒙皮权重 (`skinWeight`) 非降序排列导致部位分色错位**：
   - `co` 模型中每个顶点的 4 个蒙皮通道 `(x, y, z, w)` 并未按权重大小降序排列（例如背部大量顶点 `skinIndex.x = 9 (RightUpperArm)` 但 `skinWeight.x = 0.00`，真正的 `1.00` 权重位于 `skinIndex.y = 1 (Spine)`）。若仅读取 `skinIndex.getX()`，会导致整个后背与小腿被误判为上臂或臀部。
3. **头盔后脑勺“白兵鬼脸”与内埋遮挡**：
   - 骑手根节点设置了 `A.rotation.y = Math.PI`，局部 `-Z` 轴正对第三人称追尾相机。旧代码在头盔后脑勺叠加了平直黑色方块与穿透头盔底部的超高脊椎黑球，配合高强度青色自发光头盔壳体，在相机视角下拼凑成滑稽的“张嘴鬼脸”。
4. **骑手体态臃肿（水桶腰与粗柱象腿）**：
   - 原版 `B_Avatar` 绑定姿态下腰部与肩部同宽（`X = ±0.31 ~ ±0.35m`），大腿与小腿直径高达 `0.32m`，加上过宽的脚踏点位（`X = ±0.28m`），导致骑手从后方看像套着两根粗大雨靴挂在车侧。
5. **悬空棕色砖块转向灯与尾部管线杂乱**：
   - 原版转向灯 `indicators` 在 `motorcycle` 分支下使用了 `X = ±0.38m`（远超 `0.22m` 车尾宽度）的 `#653812` 棕色大尺寸方块，导致车尾两侧半空中悬浮两块棕色砖头；同时高位长排气管、六棱尾段与氮气瓶全部堆叠在后轮两侧，视觉极其臃肿。

### 2. 核心重构与生产级精雕方案
1. **基于 4 通道最大蒙皮权重 (`max skinWeight`) 的人体工学拓扑雕塑与平滑法线焊接**：
   - 遍历 `skinWeight` 的 `X/Y/Z/W` 四通道找出真实主导骨骼 `j0`；
   - **头部内收**：严格仅对 `j0 === 2`（`Head` 骨骼 900 个专属顶点）内收为领口内衬核，100% 保护肩部拓扑零撕裂；
   - **倒三角竞技收腰**：对躯干顶点（`j0 === 1` 或腰部以上 `j0 === 0`）在腰线 `Y = 1.52` 处实施 `X × 0.72`、`Z × 0.82` 的平滑收腰插值，塑造标准 MotoGP 运动员 V 型背部轮廓；
   - **腿部与骑行靴修身**：围绕左右腿骨骼轴心 `X = ±0.195` 将大腿截面收紧至 `0.68` 倍、小腿与踝部收紧至 `0.58` 倍；
   - **空间共点平滑法线焊接**：对非索引 `BufferGeometry` 实施空间哈希共点法线累加归一化，启用 `vertexColors: true` 实现多色赛服平滑高光过渡。
2. **外置式 AGV 赛道全盔与 MotoGP 立体背甲系统（精准贴合网格外表面）**：
   - **头盔 (`Head`)**：采用曜石黑主壳（后表面 `Z = -0.294`），外覆绕 `Z` 轴旋转 `90°` 的无极点等宽冰川银/电光青冠带拉花，后脑勺配置 AGV Pista GP RR 风格碳纤/银白扰流尾翼与双侧电光青端板；
   - **脊椎驼峰与龙骨护板 (`Spine`)**：在背部外表面（`Z = -0.20`）外置双翼流线型空气动力学大驼峰、4 节递减式银青发光脊椎护甲块及左右斜向导流护翼；
   - **钛合金护肩滑块 (`LeftUpperArm` / `RightUpperArm`)**：在双肩外侧贴合银白钛合金防摔杯与冰蓝装饰环；
   - **低趴夹油箱骑行姿态 (`IK`)**：脚踏与膝盖指向极点内收至 `X = ±0.195m ~ ±0.21m`，过弯时自动触发内侧膝盖外探（Knee-out）与重心内移（Hang-off）联动。
3. **杜卡迪 Panigale V4 / 雅马哈 R1M 风格流线刀锋车尾与底置排气**：
   - **刀锋镂空车尾**：重塑渐缩式青黑双色风道尾翼与内凹式双刃深红 LED 尾灯组（`#ff1744`），配备精巧碳纤短尾牌照架；
   - **底置斜切尾段排气**：移除高耸杂乱的长排气管与外挂气瓶，改为紧凑型底置斜切钛合金/碳纤尾段排气（带电光青尾口环），彻底解放后轮上方视觉净空；
   - **内嵌微缩转向灯**：将 `indicators` 整合为前整流罩侧翼与短尾牌照架两侧的熏黑内嵌微缩 LED 灯条（未闪烁时呈深灰碳纤色 `#1e293b`，打灯时高亮琥珀橙 `#ff9800`），彻底消灭悬空棕色方块。

---

## 二十、左侧前大灯按钮整合与「连续多次点击远光触发闪灯（`V` 键）」拟真交互升级

针对此前左侧同时存在「闪灯 · F/1」（`.beam-flash-button`）与「远光 · V/L」（`.high-beam-button`）两个功能重复的前大灯按钮，且 `F` 键与天穹 V8 飞车飞行键冲突的问题，在 [`assets/js/drive.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js)、[`assets/js/desktop-controls.js`](file:///d:/AI项目集合/赛车游戏/assets/js/desktop-controls.js)、[`assets/css/desktop-controls.css`](file:///d:/AI项目集合/赛车游戏/assets/css/desktop-controls.css)、[`assets/css/drive.css`](file:///d:/AI项目集合/赛车游戏/assets/css/drive.css) 与 [`assets/js/boot.js`](file:///d:/AI项目集合/赛车游戏/assets/js/boot.js) 中完成了单一远光按钮整合与拟真连按闪灯逻辑：

1. **单次点击开关远光、连续多次点击触发闪灯 (`toggleHighBeam` & `flashLights` in [`drive.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js))**：
   - 从 `.road-light-controls` 及自定义按键布局编辑器中移除多余的 `.beam-flash-button` 按钮，仅保留 1 个前大灯控件 `.high-beam-button`（角标为 `远光 · V` / `Beam · V`）。
   - **单次点击 / 单按 `V` 键**：仅切换 `x.highBeam` 常亮状态（`as = x.highBeam ? 1 : 0`），车灯亮灭 100% 实时跟随玩家按键，不附加自动双闪动画，也不惊动前车。
   - **连续多次点击 / 连按 `V` 键（`0.9s` 窗口内连续点击 $\ge 2$ 次）**：车灯随玩家的每次点击物理闪烁，同时自动判定为“闪远光超车信号”并触发 `flashLights(!1)`，唤醒前方 `110m` 车流互动（礼貌车打转向灯变道让行 / 暴躁超跑路怒迎战）并推进新手教学第 4 步进度。
2. **左侧 HUD 控件栏紧凑对齐 ([`drive.css`](file:///d:/AI项目集合/赛车游戏/assets/css/drive.css))**：
   - 将 `html[data-orientation] body main>.game-ui>.aux-controls` 的顶部偏移由 `calc(var(--aux-top) + 2 * (var(--aux-size) + var(--aux-gap)))` 收紧为 `calc(var(--aux-top) + var(--aux-size) + var(--aux-gap))`，使左侧 **双闪 (`2`)、远光 (`V`)、喇叭 (`空格/H`)、转向灯拨杆 (`Q/E`)** 4 项控件等距紧密排列，消除中间空白断层。
3. **快捷键释放与新手引导 Step 4 同步 ([`desktop-controls.js`](file:///d:/AI项目集合/赛车游戏/assets/js/desktop-controls.js) & [`boot.js`](file:///d:/AI项目集合/赛车游戏/assets/js/boot.js))**：
   - 移除 `F` 键与 `1` 键的旧版闪灯映射，`F` 键彻底专供天穹 V8 飞车飞行与无人机特技使用。
   - 同步更新 `HorizonTutorial` 第 4 步（`overtake`）的高亮选择器（`.high-beam-button`）、双语提示文案（`连按 V 闪远光灯` / `Rapidly press V to flash high-beams`）与 `900ms` 连按判定逻辑。

---

## 二十一、个人最高纪录（Personal Best Record）持久化与 3D 车库定制涂装工坊（Custom Paint & Livery Workshop）

针对 P2 级单局激励与长线留存优化需求（缺乏单局个人最佳成绩持久化对比，以及解锁全部 4 款座驾后积分失去消耗出口），在 [`index.html`](file:///d:/AI项目集合/赛车游戏/index.html)、[`assets/js/boot.js`](file:///d:/AI项目集合/赛车游戏/assets/js/boot.js)、[`assets/js/drive.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js)、[`assets/css/boot.css`](file:///d:/AI项目集合/赛车游戏/assets/css/boot.css) 与 [`assets/css/drive.css`](file:///d:/AI项目集合/赛车游戏/assets/css/drive.css) 中构建了完整的 **个人最高纪录全链路追踪系统** 与 **3D 车库定制涂装工坊**：

### 1. 个人最高纪录持久化与多场景实时激励 (`records.*`)
1. **单调极值合并存储 (`isMaxMonotonic` in [`boot.js`](file:///d:/AI项目集合/赛车游戏/assets/js/boot.js))**：
   - 在 `horizon-drive-settings-v1` 中新增 `records.bestScore`（最佳单局得分）、`records.bestDistance`（最远单局行驶距离，单位 `m`）与 `records.bestCombo`（最高惊险超车连击数）。
   - 在 `mergeRaw()` 跨标签页合并策略中引入 `isMaxMonotonic(key)`，对 `records.*` 严格采用 `Math.max(diskVal, nextVal)` 高水位线合并，确保任何情况下历史最高纪录永不回退。
   - 在 `window.HorizonDriveWallet` 上暴露 `records()` 与 `submitRunRecord(stats)` 接口，返回实时纪录快照及破纪录标记（`isNewScore` / `isNewDistance` / `isNewCombo` / `anyNew`）。
2. **局内实时破纪录庆典与 HUD 最佳徽章 ([`drive.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js))**：
   - 每次开局（`oo.start()`）自动记录开局前历史基准（`_runStartBestScore` / `_runStartBestDist` / `_runStartBestCombo`）。
   - 行驶过程中实时计算本局净得分与行驶里程，一旦本局得分超越历史最佳（`_runStartBestScore > 0` 且首次突破），立即弹出 `🏆 新纪录！突破个人最佳得分！` / `🏆 NEW BEST SCORE!` 横幅并调用 `HorizonCrazyGames.happytime()` 触发平台庆典特效；左上角 HUD 积分栏同步显示 `.hud-best-pill`（破纪录时切换 `.is-new` 金色流光高亮）。
3. **单局结算对比面板与 3D 车库生涯奖杯栏**：
   - 单局结束面板（`a.mode === "ended"`，`.run-ended-panel`）升级为三列数据对比卡片（`.run-summary-grid`），直观对比本局与历史最佳的 **本局得分 / 行驶距离 / 最高连击**，破纪录单项自动点亮 `.is-record` 金色边框与 `★ 新纪录！` 角标，并提供「再来一局」与「🎨 车库与涂装」双按钮快捷入口。
   - 3D 车库预览舞台底部新增 `.garage-records-bar` 生涯最高纪录奖杯栏，随时检视三项个人生涯巅峰数据。

### 2. 毕业后积分消耗出口：3D 车库定制涂装工坊 (`VEHICLE_PAINTS`)
1. **4 车 × 5 款专属高定车漆矩阵（总计 `124,000 PTS` 终局积分池）**：
   - 每款座驾均配备 1 款默认原厂车漆（免费已拥有，色值严格对齐 3D 建模原厂色）与 4 款进阶高定涂装（解锁阶梯：`1,000` / `5,000` / `8,500` / `15,000 PTS`，单车涂装全收集需 `29,500 PTS`，四车全收集共提供 `118,000 PTS` 深度积分消耗出口）：

| 座驾 | 原厂默认 (`0 PTS`) | 进阶涂装 I (`1,000 PTS`) | 进阶涂装 II (`5,000 PTS`) | 进阶涂装 III (`8,500 PTS`) | 传奇涂装 IV (`15,000 PTS`) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **01 疾风 GT (`sedan`)** | 烈焰绯红 `#ff1744` | 湾流冰蓝 `#00b4d8` | 极光翠绿 `#10b981` | 落日流金 `#f59e0b` | 暗夜紫晶 `#a855f7` |
| **02 幻影重机 (`motorcycle`)** | 电光青蓝 `#00e5ff` | 川崎疾翠 `#22c55e` | 赤红毒蝎 `#ef4444` | 霓虹幻紫 `#d946ef` | 熔岩曜金 `#f97316` |
| **03 天穹飞车 (`jet`)** | 星云魅紫 `#7c4dff` | 钛银幽灵 `#cbd5e1` | 超新星金 `#eab308` | 深空量子蓝 `#06b6d4` | 绯红星舰 `#f43f5e` |
| **04 泰坦重卡 (`truck`)** | 熔岩重橙 `#ff6d00` | 极地重装白 `#e2e8f0` | 战地荒漠金 `#eab308` | 狂暴深红 `#dc2626` | 赛博钴蓝 `#2563eb` |

2. **3D 车库零延迟试穿预览与局内实时热切换**：
   - 在 3D 车库（`Qb`）与游戏主场景玩家座驾（`yE` 中的 `pt`）中监听 `garage-paint-changed` 事件；
   - 玩家在车库点击任意涂装色卡（`.garage-paint-swatch`）时，无需先购买即可在左侧 3D 展台实时预览涂装上车效果；已拥有涂装点击即刻装备，未拥有涂装可通过右上角 `#garage-paint-action` 胶囊按钮完成二次确认解锁并同步装备，确认出库后游戏内 3D 车身实时切换为所选高定车漆。

---

## 二十二、CrazyGames 提审上线前深度合规加固、包体瘦身（`-52.1%`）与 `SDK.data` 云存档闭环

针对上线 CrazyGames 前的穿透式源码与发布包审计，完成了以下 6 大维度的生产级修复与打包验证：

1. **隐私/无痕沙盒下自定义按键面板（`.control-editor-overlay`）防卡死修复（[`assets/js/drive.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js)）**：
   - 移除了保存函数 `B` 中 `if (!Tg().flush().persistent) throw new Error("Not persistent")` 的强阻断逻辑，确保在 CrazyGames 跨域无痕 `iframe`（禁用 `localStorage`）环境下，按键布局仍可通过 `sessionStorage` / 内存 / `SDK.data` 正常生效并关闭面板；
   - 新增 **「取消 / Cancel」** 按钮（`cancelEdit`），支持随时放弃修改并还原至打开前的按键布局且恢复游戏运行，彻底消除 UI Soft-lock 风险。
2. **普通碰撞耗尽生命值（`x.health === 0`）生命周期与天气雷声 `AudioContext` 挂起补齐（[`assets/js/drive.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js)）**：
   - 修复了普通碰撞（非闯红灯 `Ha` 且非高速迎头 `yr`）耗尽生命值直接进入 `x.mode = "ended"` 时漏调 `window.HorizonCrazyGames.gameplayStop()` 与 `u.pause()` 的问题；
   - 为天气音效模块 `AE` 补齐了切后台（`document.hidden`）或平台静音（`o0() <= 0`）时的 `g.suspend()` 物理挂起与恢复机制，确保暴风雨 2.1 秒炸雷音效在切后台或静音瞬间 100% 立即静音。
3. **全站最小字号合规（`>= 11px`）与结算面板样式对齐（[`assets/css/boot.css`](file:///d:/AI项目集合/赛车游戏/assets/css/boot.css) & [`assets/css/drive.css`](file:///d:/AI项目集合/赛车游戏/assets/css/drive.css)）**：
   - 将 `.garage-paint-swatch .swatch-badge`（原 `9px`）、`.garage-record-label`（原 `10px`）、`.hud-best-pill`（原 `10px`）、`.run-stat-label`（原 `10.5px`）与 `.run-stat-best`（原 `10px`）统一提升至 `11px`；
   - 修复了 [`drive.css`](file:///d:/AI项目集合/赛车游戏/assets/css/drive.css) 中 `.run-stat-value` 与 [`drive.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js) 中 `.run-stat-val` 类名不一致的问题，恢复结算卡片 `16px` 主数值与破纪录 `#fde68a` 金色高亮。
4. **CrazyGames SDK v3 `SDK.data` 云存档同步、多模态暂停守卫与新手引导 45 秒单步超时保护（[`assets/js/boot.js`](file:///d:/AI项目集合/赛车游戏/assets/js/boot.js)）**：
   - 在 `HorizonDriveSettings` 中接入 `window.CrazyGames.SDK.data`（`getItem` / `setItem` / `removeItem`），严格受 `window.__HD_CG_SDK_READY__`（`await SDK.init()` 完成后置真）时序锁保护，实现已登录玩家跨设备云端进度同步与无痕沙盒持久化兜底；
   - 为车库、设置弹窗与广告回调的 `horizon-ad-state` 恢复事件增加活动模态检测守卫，防止多弹窗叠加关闭其一时底层 3D 车辆提前解除暂停；
   - 在 `HorizonTutorial` 中新增 `STEP_TIMEOUT_SEC = 45` 秒单步超时自动完成机制，符合 CrazyGames `Onboarding: Never get stuck` 要求。
5. **死资产清理与提审包体积瘦身 `-52.1%`（`11.22 MB` → `5.37 MB`）**：
   - 彻底移除了含有外部版权风险的旧版备份音频 `assets/audio/bgm-original-backup.mp3`（`2.61 MB`）及未引用的废弃贴图 `beam-flash-v1.png`（`76 KB`）、`truck-base-v1.png`（`206 KB`）；
   - 将仅用于 `64×64px` 按钮的 `bike-wheelie-v1.png` 与 `bike-stoppie-v1.png` 由 `1254×1254`（共 `2.86 MB`）重采样至标准按钮尺寸 `256×256`（共 `157 KB`）；
   - 重新打包生成的 [`HorizonOverdrive-CrazyGames.zip`](file:///d:/AI项目集合/赛车游戏/HorizonOverdrive-CrazyGames.zip) 体积由 **`11.22 MB` 锐减至 `5.37 MB`（缩减 `-52.1%`）**，并通过 `audit_crazygames_project.py` 全项零警告校验。


---

## 二十三、CrazyGames 提审二次深度体检与 4 项 P0 级边界漏洞清零

针对 CrazyGames 16:9 非全屏嵌入视口（`854×480` ~ `1024×576`）布局、多轨 `AudioContext` 静音/暂停状态机、`SDK.data` 异步云存档合并时序以及 SDK 生命周期极端分支，完成以下 4 项生产级修复：

1. **16:9 嵌入视口顶栏 4 重挤压解耦与 `.hud-kbd` 最小字号对齐（[`assets/css/desktop-controls.css`](file:///d:/AI项目集合/赛车游戏/assets/css/desktop-controls.css) & [`assets/css/drive.css`](file:///d:/AI项目集合/赛车游戏/assets/css/drive.css)）**：
   - 将桌面端顶部键位提示条 `.desktop-key-help` 从 `top: calc(10px + var(--safe-top, 0px))` 下移至中央后视镜正下方（标准视口 `top: calc(106px + var(--safe-top, 0px))`，窄屏/矮屏 `@media (max-width: 900px), (max-height: 500px)` 下 `top: calc(74px + var(--safe-top, 0px)) !important` 并保持 `nowrap` 单行省略），彻底消除与 `.rear-mirror`、`.hud-quick-actions`、`.control-tools` 的水平冲突；
   - 将 [`assets/css/drive.css`](file:///d:/AI项目集合/赛车游戏/assets/css/drive.css) 中横屏左上角行程卡片的 `--trip-offset` 避让阈值由 `820px` 提升至 `1180px`（`clamp(0px, calc((1180px - var(--screen-width)) * 42), 42px)`），确保在 `854×480`、`960×540`、`1024×576` 嵌入视口下 `aside` 自动下移 `42px`，绝不与左上角 4 按钮快捷组重叠；
   - 将 `.hud-kbd` 字号由 `10.5px` 提升至 `11px`，实现全站 CSS 字号 100% `>= 11px`。
2. **天气音效（`AE`）与引擎/BGM 音频（`fE` / `cE`）静音及模态暂停物理挂起闭环（[`assets/js/drive.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js)）**：
   - 在天气音效模块 `AE` 中新增 `canPlayWeatherAudio()` 状态守卫（综合校验 `!document.hidden`、`o0() > 0`、`main[data-mode="running"]` 以及车库/设置/按键编辑弹窗未开启），阻断 `pointerdown`/`keydown` 在静音或弹窗开启时误唤醒 `g.resume()`，并在失焦 `blur`、`horizon-ad-state` 或静音时立即将 `g.suspend()` 挂起，彻底杜绝直连 `g.destination` 的 2.1 秒炸雷节点穿透静音；
   - 在 `cE` 与 `fE` 的音量同步回调中补齐 `o0() <= 0` 时对各自 `AudioContext`（`i` 与 `t`）的 `suspend()` 物理挂起与解除静音时的 `resume()` 唤醒。
3. **`SDK.data` 延迟就绪云存档防覆盖与单调合并加固（[`assets/js/boot.js`](file:///d:/AI项目集合/赛车游戏/assets/js/boot.js)）**：
   - 将 `tutorial.completed` 纳入 `isMonotonic(k)`（一旦完成永不回退），将历史累计总积分 `progress.earned` 纳入 `isMaxMonotonic(k)`（取 `Math.max` 高水位线）；
   - 在 `mergeRaw(raw)` 中针对 `progress.points` 引入基于“累计获取 `earned` - 已消费 `spent` = 可用余额 `points`”守恒定律的时序保护：当异步就绪的 `SDK.data` 云存档时间戳较旧（`r.t <= old.t`），但其历史累计积分 `docEarned` 与余额高于新会话首屏刚产生的零星积分时，自动合算保留云端高余额并递增时间戳，杜绝新设备首屏超车覆盖老玩家云端存量积分。
4. **SDK 生命周期（`gameplayStop` / `loadingStop`）全边界兜底（[`assets/js/drive.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js)）**：
   - 修复开启定速巡航（`wo.active === true`）切后台（`document.hidden === true`）时 `j()` 未暂停且未上报 `gameplayStop()` 的漏调；
   - 在 `yE.dispose()`（热切座驾卸载场景）与 `webglcontextlost`（`ue` 切入暂停态）时补齐 `window.HorizonCrazyGames.gameplayStop()`；
   - 在 `oM` 资源加载失败/超时回调 `B(T)` 与 React 根错误边界 `wM.componentDidCatch` 中补齐 `window.HorizonCrazyGames.loadingStop()`。


---

## 二十四、Git 版本控制初始化与 GitHub 远程仓库同步

为实现项目的安全版本受控管理与团队/远程协同，完成本地 Git 仓库生产级规范初始化，并与 GitHub 远程仓库实现全量代码、资源及提审物料的首次基线同步：

### 1. 仓库配置与远程关联
- **远程仓库地址**：[`https://github.com/18856522826/roadKing.git`](https://github.com/18856522826/roadKing.git)
- **主干分支**：`main`
- **关联命令**：`git remote add origin https://github.com/18856522826/roadKing.git`

### 2. 工程忽略规则标准制定（`.gitignore`）
针对 Web3D/Python 混编技术栈及系统环境，严格配置过滤规则，杜绝无效与临时碎片文件污染历史：
- **Python 运行缓存**：忽略 `__pycache__/`、`*.py[cod]`、`*$py.class` 等字节码及虚拟环境目录；
- **系统与诊断报告**：忽略 `.acl-diagnosis/` 权限修复残留目录、`*.log`、`*.tmp`、系统缩略图等；
- **清理临时垃圾**：主动清理根目录遗留碎片临时文件；
- **保留核心生产资源**：完整受控保留 `assets/` 核心音效/图像/代码库、`crazygames-materials/` 官方高清单/双端封面与实机宣传片、以及 `HorizonOverdrive-CrazyGames.zip`（5.37MB）生产提审构建包。

### 3. 本次提交主要内容
- **核心游戏引擎与座驾资产**：4 款深度优化座驾模型、物理碰撞、天气系统、第一/第三人称动态驾驶舱；
- **CrazyGames 提审合规闭环**：多平台自适应 SDK、16:9/移动端 UI 避让、生命周期状态守卫、防刷防丢异步云存档；
- **音画与视效系统**：粤语原声 BGM《踩尽油门》、全量引擎与喇叭音效、3D 涂装工坊；
- **全局工程记录**：完整的 `DEVELOPMENT.md` 架构演进与全功能开发备忘。

## 二十五、前 15 分钟节奏重标定：座驾降价、一次性成就奖励与里程基础分

旧经济模型下三辆车约 20 分钟全部解锁，但前期解锁间隔过长（第 2.3 分钟拿到重机后要再等近 7 分钟），新手引导奖励的 `1,000 PTS` 也买不起任何东西；不擅长超车的玩家几乎拿不到分。本次调整目标是让前 15 分钟每隔一两分钟就有新奖励或可购买的东西。

1. **座驾与涂装价格**（[`boot.js`](file:///d:/AI项目集合/赛车游戏/assets/js/boot.js) `VEHICLE_PRICES` / `VEHICLE_PAINTS`）：
   - 幻影重机 `8,000 → 5,000`，泰坦重卡 `20,000 → 15,000`，天穹飞车 `32,000 → 30,000`，座驾总价 `60,000 → 50,000`。
   - 每车第一款进阶涂装 `2,500 → 1,000`，新手引导毕业即可立刻完成第一次购买。
2. **一次性成就奖励**（`boot.js` 模块 6 `installAchievementController` → `window.HorizonAchievements.report(evt, data)`）：
   - 存档字段 `achv.<id>` 为只能由 `false` 变 `true` 的单调字段，领取经 `HorizonDriveWallet.claimAchievement(id)` 在 `commit` 回调里读改写，多标签页同时触发也只发放一次。
   - [`drive.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js) 通过 `__hdAchv(evt, data)` 上报 `nearMiss`（连击数 / 是否钻缝）、`takedown`、`distance`（本局米数 / 当前座驾）三类事件。
   - 达成时在后视镜下方弹出 `.horizon-achv-toast`（样式在 [`arcade-ui.css`](file:///d:/AI项目集合/赛车游戏/assets/css/arcade-ui.css)），多个成就排队依次显示。

| 成就 | 奖励 | 成就 | 奖励 |
| :--- | ---: | :--- | ---: |
| 首次惊险超车 | 300 | 单局 1 公里 | 300 |
| 首次撞飞车辆 | 500 | 单局 3 公里 | 800 |
| 惊险连击 ×3 | 500 | 单局 5 公里 | 1,500 |
| 首次钻缝穿越 | 600 | 单局 10 公里 | 3,000 |
| 惊险连击 ×5 | 1,000 | 重机 / 重卡 / 飞车首跑 1 公里 | 各 1,000 |

   合计 `11,500 PTS`。

3. **里程基础分**：每局每跑满 1 公里 `+100 PTS`（`x._hdKmPaid` 记录本局已结算公里数，新一局清零），屏幕无其它提示时显示 `🛣️ N km +100`。

**预计解锁时间线**（含引导 `+1,000`，未计成就奖励，成就会让实际时间更早）：

| 玩家水平 | 幻影重机 | 泰坦重卡 | 天穹飞车 |
| :--- | :--- | :--- | :--- |
| 新手 `1,500 PTS/分钟` | 约 2.7 分钟 | 约 12.7 分钟 | 约 32.7 分钟 |
| 主流 `3,000 PTS/分钟` | 约 1.3 分钟 | 约 6.3 分钟 | 约 16.3 分钟 |
| 高手 `4,500 PTS/分钟` | 约 0.9 分钟 | 约 4.2 分钟 | 约 10.9 分钟 |

## 二十六、座驾性能升级（氮气 / 操控 / 护甲）：第 16 ~ 60 分钟的长线积分出口

全车库在主流节奏下约第 16 分钟解锁完毕，之后原本只剩纯外观涂装。本次为每辆座驾新增 3 项 × 3 级会改变手感的性能升级，让中后期的积分有更有吸引力的去处。

1. **价格**：每项每级 `2,000` / `4,000` / `8,000 PTS`（[`boot.js`](file:///d:/AI项目集合/赛车游戏/assets/js/boot.js) `UPGRADE_PRICES`），单车三项满级 `42,000`，四车共 `168,000`。按 `3,000 PTS/分钟` 计，加上涂装 `118,000`，全部收集约需 `112` 分钟，60 分钟内始终有可购买的目标。
2. **效果**（[`drive.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js) `__hdUpg(vehicle, stat)` 每帧实时读取，购买后立即生效）：

| 升级项 | 每级效果 | 3 级累计 |
| :--- | :--- | :--- |
| 🔥 氮气系统 `nos` | 氮气消耗 −12%，自动回充 +20% | 消耗 −36%，回充 +60% |
| 🎯 操控 `handling` | 转向 +6%，刹车 +8% | 转向 +18%，刹车 +24% |
| 🛡️ 护甲 `armor` | 碰撞伤害 −10%（四舍五入为整数） | 伤害 −30%（疾风 GT 由 4 次抗撞提升到 6 次） |

3. **存档**：字段 `upgrade.<vehicle>_<stat>` 为 0 ~ 3 的整数，按“只取最大值”合并（与 `records.*` 相同），跨标签页或云存档同步时等级不会回退；`HorizonDriveWallet.purchaseUpgrade(vehicle, stat)` 在 `commit` 回调中读改写扣费，`reason` 取值 `purchased` / `max` / `vehicle_locked` / `insufficient` / `unknown`。
4. **车库界面**：涂装工坊下方新增 `.garage-upgrades` 面板（`paintUpgrades()` 渲染），每项显示名称、效果说明、3 格等级刻度与购买按钮；按钮状态 `unlock` → `armed`（再次点击确认，`3.5s` 超时撤销）→ 扣费升级，`locked` / `vehicle-locked` 抖动提示，`max` 显示已满级。

## 二十七、老玩家开始界面（符合 CrazyGames「新玩家直接进入玩法」要求）

CrazyGames [玩法要求](https://docs.crazygames.com/requirements/gameplay/)（完整接入强制）规定新玩家加载后必须直接进入玩法，确实做不到时最多允许 1 次点击。因此开始界面只对老玩家显示：

- **判定**：[`drive.js`](file:///d:/AI项目集合/赛车游戏/assets/js/drive.js) `__hdHoldStart()` 读取存档 `tutorial.completed`（完成或跳过过新手引导即为老玩家）。
- **新玩家**：加载完成后照旧直接 `start()`，同时自动开启新手引导。
- **老玩家**：加载完成后停在 `ready` 状态，复用原有准备面板（`.panel.run-ready-panel`，标题、操作说明、「出发！」与「车库与涂装」按钮），点击「出发！」才开跑；开始界面期间隐藏驾驶操作件（[`arcade-ui.css`](file:///d:/AI项目集合/赛车游戏/assets/css/arcade-ui.css)）。
- **只拦截一次**：任意一次 `start()` 都会清除 `__hdHoldPending`，本页会话内之后从车库换车重新挂载场景时照常直接开跑，不会反复多点一下。

## 二十八、20 分钟留存改造第一批：公平死亡、局内热度、连击曲线与刷分漏洞修补

目标：让单局内部有起伏和高潮，让死亡来自玩家自己的失误，而且结束后想马上再开一局。改动涉及 [`drive.js`](file:///d:/AI项目/roadking/assets/js/drive.js)、[`drive.css`](file:///d:/AI项目/roadking/assets/css/drive.css) 和 [`arcade-ui.css`](file:///d:/AI项目/roadking/assets/css/arcade-ui.css)，**没有新增游戏模式**。

### 1. 公平死亡

| 项目 | 旧规则 | 新规则 |
| :--- | :--- | :--- |
| 红灯撞上横穿车流 | 非卡车直接判死 | 正常扣 1 格耐久，受 2.5 秒无敌保护 |
| 正面追尾 | 自身车速 ≥100 km/h 直接判死 | 只有**氮气超速追尾**（自身车速超过该座驾常规极速 +10 km/h，即只有开氮气才能达到的速度）才判死：护甲 Lv0~1 直接报废；护甲 Lv2 以上或泰坦重卡改为扣 2 格 |
| 一般碰撞 | 扣 1 格 | 扣 1 格，并且热度降 1 级 |
| HUD | 百分比血条 | 分格耐久条（`.integrity-bar.is-pips`），格数 = `ceil(100 / 单次伤害)`，护甲升级会增加格数 |

- 每辆车的单次伤害保持原值，与车库面板上的「N 次抗撞」一致：疾风 GT 和飞车 25（4 格），重机 34（3 格），重卡 20（5 格）。
- 状态字段 `x.hitsLeft` / `x.hitsMax` 在每帧的里程结算 IIFE 中计算。

### 2. 路口信号灯随机初始相位与绿波奖励
- `s0().prepare()` 激活路口时随机选择初始相位：**40% 绿灯 / 20% 黄灯 / 40% 红灯**，并随机扣掉该相位 0~50% 的时长。本游戏的相位顺序是「红 → 黄 → 绿」，黄灯表示即将转绿。路口不再每次都从 15 秒红灯开始。
- **绿波**：绿灯状态下驶过路口，基础分 `+500`，并直接升 1 级热度。每个路口只结算一次，记录在 `x._hdGwAt`。

### 3. 局内热度系统（`__hdHeat`，drive.js 头部）

| 热度 | 本局得分倍率 | 升到下一级所需里程 | 密集车群概率 | 恶意变道比例 |
| :--- | ---: | ---: | ---: | ---: |
| 1 | ×1 | 1.5 km | 0% | 30% |
| 2 | ×1.5 | 3 km | 12% | 35% |
| 3 | ×2 | 4.5 km | 24% | 40% |
| 4 | ×3 | 6 km | 36% | 45% |
| 5 | ×4 | — | 48% | 50% |

- **升级途径**：累积行驶里程；每次惊险超车 `+5%` 进度；绿波直接升 1 级。
- **降级**：每次受伤碰撞降 1 级，并清空当前进度。
- **倍率只作用于本局得分**：`__hdEarn(n)` 返回「基础分 × 热度倍率」，用于本局分数和个人纪录。车库钱包**只存入基础分**，本局入账累计在 `__hdHeat.walletRun`，并显示在结算面板「车库积分余额」后面。这样做是为了不打乱座驾和升级按「约 3,000 PTS/分钟」标定的解锁节奏。惊险超车、撞飞、里程、绿波的提示显示的都是乘过倍率的本局得分。
- **车流加剧**：NPC 重生时按「密集车群概率」改用密集车群的刷新距离和排距。`gh()` 生成的恶意变道概率为 `0.3 + 0.05 × (热度 - 1)`。
- **HUD**：
  - 积分行下方新增热度徽章 `.horizon-heat-badge[data-level]`，显示等级、倍率和进度条，5 级时有脉冲动画。横屏下路口提示框相应下移 22px。
  - 全屏边缘光 `.horizon-heat-vignette[data-level]` 由蓝到红渐变，位于 3D 场景与 HUD 之间，不拦截点击。
  - 升级时弹出提示；热度达到 4 级以上时调用 CrazyGames `happytime()`。
- 开局 `start()` 时重置热度及所有相关状态字段。

### 4. 连击曲线
- 惊险超车得分改为 `90 × Math.min(combo, 10)`（重机为 120），倍率上限由 ×5 提到 ×10。
- 普通超车不再让连击 −1，只是不刷新 6 秒连击窗口。

### 5. 刷分漏洞修补
- **重机翘头**：每次翘头最多计 4 秒分（`x._wheelieN`），翘头结束后 3 秒冷却（`x._wheelieCd`）。氮气充能不受限制。
- **表情互动**：每局最多计 10 次分（`x._emoteRewards`），6 秒间隔不变。

---

## 二十九、天穹飞车重平衡与移除回环跳台（2026-11-06）

### 1. 移除飞车专属弧形坡道（回环跳台）
- 原坡道是半径 22 m、弯曲 104° 的四分之一管，顶部高约 27 m。车冲到顶后会向后抛出，不按 F 就倒扣坠毁、整局结束；按了 F 也会变成逆向行驶。
- 已从 `drive.js` 中删除坡道物理 `zg()`、弧面求交 `N9()`、场景网格 `Sg()` 和常量 `sl / sr`。创建处改为 `yA=void 0,ts=void 0`，其余引用原本都有空值判断，不会再执行。
- 所有座驾共用的斜坡卡车（`Oe` / `Rt.nearestRamp`）保留不变。

### 2. 基础数值（`R9.jet`）

| 项目 | 原值 | 新值 |
| :--- | ---: | ---: |
| 加速 `acceleration` | 1.68 | 1.30 |
| 转向 `steering` | 1.28 | 1.10 |
| 刹车 `brakeRate` | 1.40 | 1.20 |

极速 360 / 445 km/h 和 4 次抗撞不变。车库面板的加速、操控条同步改为 78%。

### 3. 飞行能量（`yg()`）
- 满能量仍为 15 单位。消耗由 `1.5/s` 改为 `2.5 / (1 + 0.1 × 飞行续航等级) /s`，基础飞行 **6 秒**，满级约 **7.8 秒**。
- 被动回充由 `15/11 每秒` 改为 `0.6 每秒`（25 秒回满），且需要车速 > 40 km/h，停车不再充能。
- 地面每次惊险超车调用 `CA.recharge(3.75)`，相当于回充 1.5 秒飞行。
- 空域掠过奖励 `+45` 改为 `+60` 基础分。

### 4. 飞车专属升级「飞行续航」
- `boot.js` 的 `UPGRADES` 新增 `{ id: 'flight', only: ['jet'] }`，每级飞行时长 +10%，价格同样是 2,000 / 4,000 / 8,000。
- 新增 `upgradeApplies(u, vehicleId)`。`upgradesFor` 会按座驾过滤升级项，`upgradeLevel` 和 `purchaseUpgrade` 也会拒绝不适用的组合。飞车的车库升级面板因此有 4 行，其余座驾仍是 3 行。
