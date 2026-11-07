/**
 * ============================================================================
 * 《地平线狂飙：无尽公路》(Horizon Overdrive) - 游戏引导、状态存储与车库管理模块 (boot.js)
 * ============================================================================
 * 【核心子模块架构】
 * 1. installPlayerSettings      : 全局持久化配置中心 (window.HorizonDriveSettings)，
 *                                 管理显示方向/视角/操作、光影画质、载具、背景音乐音量与自定义键位布局；
 *                                 同时提供车库积分钱包 (window.HorizonDriveWallet)：驾驶积分实时入账、载具积分解锁。
 * 2. installViewportAndSettings : 视口自适应旋转与缩放引擎 (fitHome / apply)、设置弹窗与音量滑块联动。
 * 3. installGarageController    : 车库 3D 预览交互与六大原创载具（疾风 GT 轿跑 / 幻影重机 / 天穹 V8 飞车 / 泰坦重型卡车 / 烈焰超跑 / 雷霆方程式）
 *                                 切换管理，未解锁载具需消耗积分解锁（二次确认防误触）。
 * 4. installLaunchDispatcher    : 异常启动兜底提示、CrazyGames SDK v3 桥接与首页“开始驾驶”事件派发器。
 * 5. installTutorialController  : 交互式新手教学引导系统 (window.HorizonTutorial)，基于 60fps 实时遥测与双端输入检测，
 *                                 提供 6 步非阻塞式实操驾驶训练、目标控件霓虹脉冲高亮、45s 单步超时保护与首次毕业 +1,000 PTS 奖励入账。
 * 6. installAchievementController : 一次性成就奖励 (window.HorizonAchievements)，由 drive.js 上报惊险超车 / 撞飞 / 里程事件，
 *                                 首次达成时经钱包 claimAchievement 发放积分并弹出达成提示。
 * ============================================================================
 */
(function () {
  'use strict';

  // ==================== [模块 1] 全局玩家偏好与配置存储中心 ====================
  (function installPlayerSettings() {
    if (window.HorizonDriveSettings) return;

    var KEY = 'horizon-drive-settings-v1';
    var FEATURES = [
      'invincible', 'cruise', 'speed', 'drone', 'autoReverse',
      'density', 'motorcycles', 'ramps', 'rampInterval',
      'storm', 'fog', 'snow'
    ];
    var WEATHER = ['storm', 'fog', 'snow'];
    // 全部载具 ID（顺序与车库列表一致）
    var VEHICLES = ['sedan', 'motorcycle', 'jet', 'truck', 'police'];
    // 载具解锁价格（单位：积分，总计 72,000 积分）；价格为 0 的载具视为初始赠送、永久拥有
    // 05 猎隼拦截者 22,000 插在重卡与飞车之间，填补 15,000 → 30,000 的最大空档
    // 按约 3,000 PTS/分钟（含一次性成就奖励）标定：约第 1.3 / 6.3 / 16.3 分钟依次解锁，保证前 15 分钟每隔几分钟就有新座驾或新涂装
    var VEHICLE_PRICES = {
      sedan: 0,
      motorcycle: 5000,
      truck: 15000,
      police: 22000,
      jet: 30000
    };
    /**
     * 五款座驾的专属定制涂装工坊配置表（每车 1 款免费原厂涂装 + 4 款积分解锁涂装）
     * 原厂涂装色值与 drive.js (ad) 及 drive-models.js (Op) 的 3D 材质主色严格一一对齐
     */
    var VEHICLE_PAINTS = {
      sedan: [
        { id: 'stock', hex: '#2b7de9', price: 0, nameEn: 'Cobalt GT (Stock)', nameZh: '原厂钴蓝' },
        { id: 'nitro', hex: '#ff5500', price: 1000, nameEn: 'Nitro Blaze', nameZh: '烈焰氮气橙' },
        { id: 'emerald', hex: '#00e676', price: 5000, nameEn: 'Venom Emerald', nameZh: '赛博毒液绿' },
        { id: 'amethyst', hex: '#9d4edd', price: 8500, nameEn: 'Midnight Amethyst', nameZh: '幻夜紫罗兰' },
        { id: 'gold', hex: '#ffd000', price: 15000, nameEn: 'Apex Sovereign Gold', nameZh: '冠军流光金' }
      ],
      motorcycle: [
        { id: 'stock', hex: '#00d2ff', price: 0, nameEn: 'Cyber Cyan (Stock)', nameZh: '原厂霓虹青' },
        { id: 'crimson', hex: '#ff1744', price: 1000, nameEn: 'Crimson Katana', nameZh: '赤红刀锋' },
        { id: 'lime', hex: '#aacc00', price: 5000, nameEn: 'Hyper Lime', nameZh: '荧光暴走绿' },
        { id: 'plasma', hex: '#e040fb', price: 8500, nameEn: 'Plasma Reactor', nameZh: '等离子星紫' },
        { id: 'aurum', hex: '#ffb703', price: 15000, nameEn: 'Aurum Phantom', nameZh: '曜金幻影' }
      ],
      truck: [
        { id: 'stock', hex: '#d62828', price: 0, nameEn: 'Vulcan Red (Stock)', nameZh: '原厂熔岩红' },
        { id: 'desert', hex: '#e09f3e', price: 1000, nameEn: 'Sandstorm Tactical', nameZh: '荒漠风暴黄' },
        { id: 'cobalt', hex: '#1d4ed8', price: 5000, nameEn: 'Aegis Cobalt', nameZh: '深海重甲蓝' },
        { id: 'obsidian', hex: '#334155', price: 8500, nameEn: 'Obsidian Stealth', nameZh: '黑曜石装甲' },
        { id: 'gilded', hex: '#f59e0b', price: 15000, nameEn: 'Gilded Juggernaut', nameZh: '黄金巨兽' }
      ],
      jet: [
        { id: 'stock', hex: '#dce8f5', price: 0, nameEn: 'Starlight Silver (Stock)', nameZh: '原厂星舰银' },
        { id: 'ion', hex: '#00b4d8', price: 1000, nameEn: 'Ion Horizon', nameZh: '离子天穹蓝' },
        { id: 'supernova', hex: '#ff3d00', price: 5000, nameEn: 'Supernova Flare', nameZh: '超新星赤焰' },
        { id: 'nebula', hex: '#a855f7', price: 8500, nameEn: 'Nebula Violet', nameZh: '星云暗物质' },
        { id: 'celestial', hex: '#ffbe0b', price: 15000, nameEn: 'Celestial Emperor', nameZh: '天穹帝皇金' }
      ],
      police: [
        { id: 'stock', hex: '#1e3a8a', price: 0, nameEn: 'Patrol Navy (Stock)', nameZh: '原厂警务藏蓝' },
        { id: 'stealth', hex: '#0f172a', price: 1000, nameEn: 'Night Stealth', nameZh: '暗夜潜行黑' },
        { id: 'sentinel', hex: '#64748b', price: 5000, nameEn: 'Steel Sentinel', nameZh: '钢灰哨兵' },
        { id: 'pursuit', hex: '#b91c1c', price: 8500, nameEn: 'Crimson Pursuit', nameZh: '赤焰追缉' },
        { id: 'medal', hex: '#eab308', price: 15000, nameEn: 'Gold Medal of Honor', nameZh: '金徽荣耀' }
      ]
    };
    /**
     * 一次性成就奖励（每项每个存档只发一次，合计 13,300 PTS），集中在前 15 分钟陆续触发，配合座驾价格制造持续的新鲜感：
     * 惊险超车 / 连击 / 撞飞 / 钻缝 为第一次玩就能碰到的操作，单局里程逐级抬高门槛，新座驾首跑奖励鼓励换车体验不同玩法
     */
    var ACHIEVEMENTS = [
      { id: 'near_miss_1', pts: 300, icon: '⚡', nameEn: 'First Near Miss', nameZh: '首次惊险超车' },
      { id: 'takedown_1', pts: 500, icon: '💥', nameEn: 'First Takedown', nameZh: '首次撞飞车辆' },
      { id: 'combo_3', pts: 500, icon: '🔥', nameEn: 'Near-Miss Combo ×3', nameZh: '惊险连击 ×3' },
      { id: 'split_1', pts: 600, icon: '🗡️', nameEn: 'First Lane Split', nameZh: '首次钻缝穿越' },
      { id: 'combo_5', pts: 1000, icon: '🌪️', nameEn: 'Near-Miss Combo ×5', nameZh: '惊险连击 ×5' },
      { id: 'run_1km', pts: 300, icon: '🛣️', nameEn: 'Single Run: 1 km', nameZh: '单局跑满 1 公里' },
      { id: 'run_3km', pts: 800, icon: '🛣️', nameEn: 'Single Run: 3 km', nameZh: '单局跑满 3 公里' },
      { id: 'run_5km', pts: 1500, icon: '🏁', nameEn: 'Single Run: 5 km', nameZh: '单局跑满 5 公里' },
      { id: 'run_10km', pts: 3000, icon: '🏆', nameEn: 'Single Run: 10 km', nameZh: '单局跑满 10 公里' },
      { id: 'drive_motorcycle', pts: 1000, icon: '🏍️', nameEn: 'Phantom Bike: First 1 km', nameZh: '幻影重机首跑 1 公里' },
      { id: 'drive_truck', pts: 1000, icon: '🚛', nameEn: 'Titan Truck: First 1 km', nameZh: '泰坦重卡首跑 1 公里' },
      { id: 'drive_jet', pts: 1000, icon: '🚀', nameEn: 'Aether Jet: First 1 km', nameZh: '天穹飞车首跑 1 公里' },
      { id: 'drive_police', pts: 1000, icon: '🚓', nameEn: 'Falcon Interceptor: First 1 km', nameZh: '猎隼拦截者首跑 1 公里' },
      { id: 'bust_1', pts: 800, icon: '🚔', nameEn: 'First Bust', nameZh: '首次抓捕通缉车' }
    ];
    /**
     * 座驾性能升级：每车 3 项（飞车额外 1 项「飞行续航」）× 3 级，每级价格 2,000 / 4,000 / 8,000（单车满级 42,000，飞车 56,000，四车 182,000），
     * 作为全车库解锁（约第 16 分钟）之后到第 60 分钟的主要积分出口；drive.js 通过 upgradeLevel() 按等级实时读取效果系数
     */
    var UPGRADES = [
      { id: 'nos', icon: '🔥', nameEn: 'Nitro System', nameZh: '氮气系统', effectEn: 'Per level: −12% NOS burn, +20% passive recharge', effectZh: '每级：氮气消耗 −12%，自动回充 +20%' },
      { id: 'handling', icon: '🎯', nameEn: 'Handling', nameZh: '操控', effectEn: 'Per level: +6% steering, +8% braking', effectZh: '每级：转向 +6%，刹车 +8%' },
      { id: 'armor', icon: '🛡️', nameEn: 'Armor', nameZh: '护甲', effectEn: 'Per level: −10% crash damage', effectZh: '每级：碰撞伤害 −10%' },
      // 飞车专属：飞行能量消耗每级 ÷(1+10%)，基础 6 秒 → 满级约 7.8 秒
      { id: 'flight', only: ['jet'], icon: '✈️', nameEn: 'Flight Endurance', nameZh: '飞行续航', effectEn: 'Per level: +10% flight time (6s base)', effectZh: '每级：飞行时长 +10%（基础 6 秒）' }
    ];
    // 升级项是否适用于该座驾（only 为空表示全车通用）
    function upgradeApplies(u, vehicleId) {
      return !u.only || u.only.indexOf(vehicleId) >= 0;
    }
    // 第 1 / 2 / 3 级的升级价格，数组长度即最高等级
    var UPGRADE_PRICES = [2000, 4000, 8000];
    // 积分余额与累计积分的数值上限（防止异常数据溢出）
    var POINTS_MAX = 999999999;
    var DEFAULTS = {
      'lang': 'en',
      'display.orientation': 'portrait',
      'display.camera': 'first',
      'display.controls': 'buttons',
      'graphics.lighting': false,
      'vehicle': 'sedan',
      // 车库积分钱包：points 为可消费余额，earned 为历史累计获得积分（只增不减，用于统计）
      'progress.points': 0,
      'progress.earned': 0,
      // 个人生涯最高纪录：单局最高积分、单局最远里程（米）、单局最高惊险连击数（跨标签页高水位单调合并）
      'records.bestScore': 0,
      'records.bestDistance': 0,
      'records.bestCombo': 0,
      'audio.bgmVolume': 50,
      'mods.target': 300,
      'mods.density': 'normal',
      'mods.rampInterval': 1000,
      'controlLayout.portrait': {},
      'controlLayout.landscape': {},
      'assistant.positions.portrait': null,
      'assistant.positions.landscape': null,
      // 新手教学引导状态：completed 表示已完成或主动跳过，rewarded 表示是否已领取首次毕业 1000 积分奖励
      'tutorial.completed': false,
      'tutorial.rewarded': false
    };

    FEATURES.forEach(function (k) {
      DEFAULTS['mods.on.' + k] = false;
      DEFAULTS['unlocks.' + k] = true;
    });
    // 载具拥有状态与定制涂装默认状态：免费载具及原厂涂装默认拥有，付费项需消耗积分解锁
    ACHIEVEMENTS.forEach(function (a) {
      DEFAULTS['achv.' + a.id] = false;
    });
    VEHICLES.forEach(function (id) {
      UPGRADES.forEach(function (u) {
        DEFAULTS['upgrade.' + id + '_' + u.id] = 0;
      });
      DEFAULTS['owned.' + id] = VEHICLE_PRICES[id] === 0;
      DEFAULTS['paint.' + id] = 'stock';
      (VEHICLE_PAINTS[id] || []).forEach(function (p) {
        DEFAULTS['paintOwned.' + id + '_' + p.id] = p.price === 0;
      });
    });

    var fields = {};
    var listeners = [];
    var clock = 1;
    var writer = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
    var storageState = { persistent: false, session: false, mode: 'memory' };
    // 驾驶中实时获得、尚未落盘的积分缓冲（批量写入，避免每次超车都同步读写 localStorage 造成卡顿）
    var pendingPoints = 0;
    var pendingTimer = 0;
    // 积分缓冲自动落盘延迟（毫秒）
    var EARN_FLUSH_DELAY = 1500;
    // 单次入账上限（防御异常调用一次性刷入海量积分）
    var EARN_MAX_PER_CALL = 100000;

    function own(o, k) {
      return Object.prototype.hasOwnProperty.call(o, k);
    }
    function isPlainObject(v) {
      return v !== null && typeof v === 'object' && !Array.isArray(v);
    }
    function copy(v) {
      return JSON.parse(JSON.stringify(v));
    }
    function equal(a, b) {
      return JSON.stringify(a) === JSON.stringify(b);
    }
    function numeric(v, min, max) {
      if (typeof v !== 'number' && !(typeof v === 'string' && v.trim() !== '')) return void 0;
      var n = Number(v);
      return isFinite(n) ? Math.max(min, Math.min(max, n)) : void 0;
    }

    function normalize(k, v) {
      if (!own(DEFAULTS, k)) return void 0;
      var allowed = {
        'lang': ['en', 'zh'],
        'display.orientation': ['portrait', 'landscape'],
        'display.camera': ['first', 'third'],
        'display.controls': ['wheel', 'buttons'],
        'vehicle': ['sedan', 'motorcycle', 'truck', 'jet', 'police'],
        'mods.density': ['empty', 'sparse', 'normal', 'dense']
      };
      if (allowed[k]) return allowed[k].indexOf(v) >= 0 ? v : void 0;
      if (k === 'graphics.lighting') return typeof v === 'boolean' ? v : void 0;
      if (k === 'audio.bgmVolume') return numeric(v, 0, 100);
      if (k === 'mods.target') return numeric(v, 0, 9999);
      if (k === 'mods.rampInterval') return numeric(v, 200, 2000);
      if (k.indexOf('upgrade.') === 0) {
        // 升级等级为 0 ~ 最高等级的整数
        var lv = numeric(v, 0, UPGRADE_PRICES.length);
        return lv === void 0 ? void 0 : Math.floor(lv);
      }
      if (k.indexOf('progress.') === 0 || k.indexOf('records.') === 0) {
        // 积分与生涯最高纪录必须为非负整数
        var pts = numeric(v, 0, POINTS_MAX);
        return pts === void 0 ? void 0 : Math.floor(pts);
      }
      if (k.indexOf('paint.') === 0) {
        var vehId = k.slice(6);
        var list = VEHICLE_PAINTS[vehId];
        if (!list || typeof v !== 'string') return void 0;
        for (var pi = 0; pi < list.length; pi++) {
          if (list[pi].id === v) return v;
        }
        return void 0;
      }
      if (k.indexOf('mods.on.') === 0 || k.indexOf('unlocks.') === 0 || k.indexOf('owned.') === 0 || k.indexOf('paintOwned.') === 0 || k.indexOf('tutorial.') === 0 || k.indexOf('achv.') === 0) {
        return typeof v === 'boolean' ? v : void 0;
      }
      if (k.indexOf('controlLayout.') === 0) {
        if (!isPlainObject(v)) return void 0;
        var layout = {};
        Object.keys(v).forEach(function (id) {
          var p = v[id];
          if (!/^[a-z-]+$/.test(id) || !isPlainObject(p) ||
              typeof p.x !== 'number' || typeof p.y !== 'number' || typeof p.scale !== 'number' ||
              !isFinite(p.x) || !isFinite(p.y) || !isFinite(p.scale)) return;
          layout[id] = {
            x: Math.max(0, Math.min(1, p.x)),
            y: Math.max(0, Math.min(1, p.y)),
            scale: Math.max(0.5, Math.min(1.8, p.scale))
          };
        });
        return layout;
      }
      if (k.indexOf('assistant.positions.') === 0) {
        if (v === null) return null;
        if (!isPlainObject(v) || typeof v.x !== 'number' || typeof v.y !== 'number' ||
            !isFinite(v.x) || !isFinite(v.y)) return void 0;
        return { x: Math.max(0, Math.min(1, v.x)), y: Math.max(0, Math.min(1, v.y)) };
      }
    }

    function readStorage(name, key) {
      try {
        return window[name].getItem(key);
      } catch (_) {
        return null;
      }
    }
    /**
     * 安全读取 CrazyGames SDK v3 Data Module 云存档（严格受 __HD_CG_SDK_READY__ 时序锁保护）
     */
    function readCloudStorage(key) {
      try {
        if (!window.__HD_CG_SDK_READY__) return null;
        var sdk = window.CrazyGames && window.CrazyGames.SDK;
        if (sdk && sdk.data && typeof sdk.data.getItem === 'function') {
          return sdk.data.getItem(key);
        }
      } catch (_) {}
      return null;
    }
    function parseJSON(raw) {
      try {
        return JSON.parse(raw);
      } catch (_) {
        return null;
      }
    }
    function writeStorage(name, key, val) {
      try {
        var s = window[name];
        s.setItem(key, val);
        return s.getItem(key) === val;
      } catch (_) {
        return false;
      }
    }
    /**
     * 安全写入 CrazyGames SDK v3 Data Module 云存档（支持跨设备同步与无痕沙盒兜底）
     */
    function writeCloudStorage(key, val) {
      try {
        if (!window.__HD_CG_SDK_READY__) return false;
        var sdk = window.CrazyGames && window.CrazyGames.SDK;
        if (sdk && sdk.data && typeof sdk.data.setItem === 'function') {
          sdk.data.setItem(key, val);
          return true;
        }
      } catch (_) {}
      return false;
    }
    function sectionOf(k) {
      return k.split('.')[0];
    }
    /**
     * 判断字段是否为“只能由 false 变 true”的单调解锁字段
     * （功能解锁 unlocks.*、载具拥有 owned.*、涂装拥有 paintOwned.*、成就领取 achv.*、新手引导完成状态 tutorial.completed 与首次奖励 tutorial.rewarded），跨标签页或云存档合并时一旦解锁永不回退
     */
    function isMonotonic(k) {
      return k.indexOf('unlocks.') === 0 || k.indexOf('owned.') === 0 || k.indexOf('paintOwned.') === 0 || k.indexOf('achv.') === 0 || k === 'tutorial.rewarded' || k === 'tutorial.completed';
    }
    /**
     * 判断字段是否为“只取最大值”的高水位累计/纪录字段（records.*、升级等级 upgrade.* 与历史累计总积分 progress.earned），防止旧标签页或新会话低数值覆盖历史最高纪录
     */
    function isMaxMonotonic(k) {
      return k.indexOf('records.') === 0 || k.indexOf('upgrade.') === 0 || k === 'progress.earned';
    }

    function mergeRaw(raw) {
      var doc = parseJSON(raw);
      var changed = [];
      if (!isPlainObject(doc) || doc.version !== 1 || !isPlainObject(doc.fields)) return changed;
      /* 预先快照合并前内存中的历史累计获得积分与当前可用余额，用于 SDK.data 延迟就绪时基于“累计获取 - 已消费 = 可用余额”守恒定律保护老玩家云存档余额 */
      var prevMemEarned = fields['progress.earned'] && typeof fields['progress.earned'].v === 'number' ? fields['progress.earned'].v : 0;
      var prevMemPoints = fields['progress.points'] && typeof fields['progress.points'].v === 'number' ? fields['progress.points'].v : 0;
      var docEarnedRec = doc.fields['progress.earned'];
      var docEarned = isPlainObject(docEarnedRec) ? normalize('progress.earned', docEarnedRec.v) : void 0;
      if (typeof docEarned !== 'number') docEarned = 0;
      Object.keys(doc.fields).forEach(function (k) {
        var r = doc.fields[k];
        if (!isPlainObject(r) || !own(DEFAULTS, k)) return;
        var v = normalize(k, r.v);
        if (v === void 0 || typeof r.t !== 'number' || !isFinite(r.t) || r.t < 1 ||
            r.t > Number.MAX_SAFE_INTEGER - 1000 || Math.floor(r.t) !== r.t ||
            typeof r.s !== 'string' || r.s.length > 120) return;
        var old = fields[k];
        if (isMonotonic(k) && old && old.v === true && v !== true) return;
        if (isMaxMonotonic(k) && old && typeof old.v === 'number') {
          if (v > old.v) {
            fields[k] = { v: v, t: Math.max(r.t, old.t), s: r.s };
            clock = Math.max(clock, r.t);
            changed.push(sectionOf(k));
          }
          return;
        }
        /* 云存档延迟就绪保护：当外部存档时间戳较老 (r.t <= old.t)，但其历史累计获取积分 docEarned 高于当前新会话 prevMemEarned 且余额更高时，按守恒关系合并余额而不丢弃云端存量积分 */
        if (k === 'progress.points' && old && typeof old.v === 'number' && r.t <= old.t) {
          if (v > old.v && docEarned > prevMemEarned) {
            var docSpent = Math.max(0, docEarned - v);
            var memSpent = Math.max(0, prevMemEarned - prevMemPoints);
            var mergedPoints = Math.max(v, Math.max(docEarned, prevMemEarned) - Math.max(docSpent, memSpent));
            var nextT = Math.max(r.t, old.t);
            fields[k] = { v: mergedPoints, t: nextT, s: r.s };
            clock = Math.max(clock, nextT);
            if (!equal(old.v, mergedPoints)) changed.push(sectionOf(k));
          }
          return;
        }
        if (!old || (isMonotonic(k) && v === true && old.v !== true) ||
            r.t > old.t || (r.t === old.t && r.s > old.s)) {
          fields[k] = { v: v, t: r.t, s: r.s };
          clock = Math.max(clock, r.t);
          if (!old || !equal(old.v, v)) changed.push(sectionOf(k));
        }
      });
      return changed;
    }

    var deviceType = 'unknown';
    function automaticLighting() {
      var nav = window.navigator || {};
      var ua = nav.userAgent || '';
      var root = document.documentElement;
      var pc = root && root.getAttribute ? root.getAttribute('data-desktop') : null;
      var mobile = deviceType === 'phone' || deviceType === 'tablet' || pc === 'false' ||
                   /Android|iPhone|iPad|iPod|Mobile/i.test(ua) ||
                   (/Macintosh/i.test(ua) && nav.maxTouchPoints > 1);
      if (!mobile && (deviceType === 'desktop' || pc === 'true' || /Windows NT|Macintosh|X11|CrOS|Linux/i.test(ua))) {
        return true;
      }
      return Number(nav.hardwareConcurrency) >= 8 && Number(nav.deviceMemory) >= 8;
    }

    function value(k) {
      return own(fields, k)
        ? copy(fields[k].v)
        : k === 'graphics.lighting'
          ? automaticLighting()
          : copy(DEFAULTS[k]);
    }

    window.addEventListener('horizon-viewport-container', function (e) {
      deviceType = (e.detail && e.detail.deviceType) || 'unknown';
      if (!own(fields, 'graphics.lighting')) emit(['graphics'], 'device');
    });

    /**
     * 判断某载具当前是否已拥有（免费载具恒为已拥有）
     * @param {string} id 载具 ID
     * @returns {boolean}
     */
    function isOwned(id) {
      if (!own(VEHICLE_PRICES, id)) return false;
      return VEHICLE_PRICES[id] === 0 || value('owned.' + id) === true;
    }

    /**
     * 查找指定载具下的某款涂装定义对象
     * @param {string} vehicleId 载具 ID
     * @param {string} paintId 涂装 ID
     */
    function findPaintDef(vehicleId, paintId) {
      var list = VEHICLE_PAINTS[vehicleId];
      if (!list) return null;
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === paintId) return list[i];
      }
      return null;
    }

    /**
     * 判断某载具的某款涂装是否已拥有（原厂免费涂装恒为已拥有）
     */
    function isPaintOwned(vehicleId, paintId) {
      var def = findPaintDef(vehicleId, paintId);
      if (!def) return false;
      return def.price === 0 || value('paintOwned.' + vehicleId + '_' + paintId) === true;
    }

    /**
     * 获取指定载具当前已装备的涂装 ID（若存档中的涂装尚未拥有则安全回退为 'stock'）
     */
    function getSelectedPaint(vehicleId) {
      if (!own(VEHICLE_PAINTS, vehicleId)) return 'stock';
      var stored = value('paint.' + vehicleId) || 'stock';
      return isPaintOwned(vehicleId, stored) ? stored : 'stock';
    }

    /**
     * 获取指定载具当前已装备涂装的 16 进制颜色字符串
     */
    function getSelectedPaintHex(vehicleId) {
      var pid = getSelectedPaint(vehicleId);
      var def = findPaintDef(vehicleId, pid) || findPaintDef(vehicleId, 'stock');
      return def ? def.hex : '#2b7de9';
    }

    function snapshot() {
      var storedVehicle = value('vehicle');
      var out = {
        lang: value('lang'),
        graphics: { lighting: value('graphics.lighting') },
        display: {
          orientation: value('display.orientation'),
          camera: value('display.camera'),
          controls: value('display.controls')
        },
        controlLayout: {
          portrait: value('controlLayout.portrait'),
          landscape: value('controlLayout.landscape')
        },
        // 安全兜底：存档中的载具若尚未解锁（旧存档 / 跨标签页脏数据），一律回退为免费的疾风 GT 轿跑
        vehicle: isOwned(storedVehicle) ? storedVehicle : 'sedan',
        // 车库积分钱包（已落盘部分；未落盘的驾驶中积分请通过 HorizonDriveWallet.balance() 获取）
        progress: {
          points: value('progress.points'),
          earned: value('progress.earned')
        },
        // 个人生涯最高纪录（单局最高得分、最远里程（米）、最高惊险连击数）
        records: {
          bestScore: value('records.bestScore'),
          bestDistance: value('records.bestDistance'),
          bestCombo: value('records.bestCombo')
        },
        // 车库载具解锁状态与价格表
        garage: { owned: {}, prices: copy(VEHICLE_PRICES) },
        // 载具定制涂装当前装备状态与拥有表
        paint: { selected: {}, hex: {}, owned: {} },
        audio: { bgmVolume: value('audio.bgmVolume') },
        tutorial: {
          completed: value('tutorial.completed'),
          rewarded: value('tutorial.rewarded')
        },
        mods: {
          on: {},
          target: value('mods.target'),
          density: value('mods.density'),
          rampInterval: value('mods.rampInterval')
        },
        unlocks: {},
        assistant: { positions: {}, weather: [] }
      };
      FEATURES.forEach(function (k) {
        out.mods.on[k] = value('mods.on.' + k);
        out.unlocks[k] = true;
      });
      VEHICLES.forEach(function (id) {
        out.garage.owned[id] = isOwned(id);
        out.paint.selected[id] = getSelectedPaint(id);
        out.paint.hex[id] = getSelectedPaintHex(id);
        (VEHICLE_PAINTS[id] || []).forEach(function (p) {
          out.paint.owned[id + '_' + p.id] = isPaintOwned(id, p.id);
        });
      });
      ['portrait', 'landscape'].forEach(function (k) {
        var p = value('assistant.positions.' + k);
        if (p) out.assistant.positions[k] = p;
      });
      out.assistant.weather = WEATHER.filter(function (k) {
        return out.mods.on[k] === true && out.unlocks[k] === true;
      });
      return out;
    }

    function emit(sections, reason) {
      if (!sections.length) return;
      var unique = sections.filter(function (k, i, a) {
        return a.indexOf(k) === i;
      });
      listeners.slice().forEach(function (fn) {
        try {
          fn({ sections: unique, reason: reason });
        } catch (e) {
          if (window.console) window.console.error(e);
        }
      });
    }

    function mergeAvailable() {
      return mergeRaw(readStorage('localStorage', KEY))
        .concat(mergeRaw(readStorage('sessionStorage', KEY)))
        .concat(mergeRaw(readCloudStorage(KEY)));
    }

    function persist() {
      if (!Object.keys(fields).length) return;
      var json = JSON.stringify({ version: 1, fields: fields });
      var localOk = writeStorage('localStorage', KEY, json);
      var cloudOk = writeCloudStorage(KEY, json);
      storageState.persistent = !!(localOk || cloudOk);
      storageState.session = writeStorage('sessionStorage', KEY, json);
      storageState.mode = storageState.persistent ? 'persistent' : storageState.session ? 'session' : 'memory';
    }

    function flush() {
      // 先把驾驶中缓冲的积分落盘，保证页面隐藏 / 关闭 / 回到主页时积分不丢失
      flushPendingPoints();
      var changed = mergeAvailable();
      persist();
      emit(changed, 'external');
      return copy(storageState);
    }

    /**
     * 提交一组字段变更并持久化
     * @param {Object|Function} patch 变更字段表；也可传入函数，函数会在“合并完其它标签页最新存档之后”
     *                                才被调用并返回字段表，用于积分扣减等必须基于最新数据计算的读改写操作
     * @param {string} [reason] 变更原因（透传给订阅者）
     */
    function commit(patch, reason) {
      var changed = mergeAvailable();
      if (typeof patch === 'function') patch = patch() || {};
      var t = Math.max(Date.now(), clock + 1);
      var touched = [];
      Object.keys(patch).forEach(function (k) {
        var v = normalize(k, patch[k]);
        if (v === void 0) return;
        if (fields[k] && equal(fields[k].v, v)) return;
        fields[k] = { v: copy(v), t: t, s: writer };
        clock = t;
        touched.push(sectionOf(k));
      });
      if (touched.length) {
        persist();
      }
      emit(changed.concat(touched), reason || 'selection');
      return snapshot();
    }

    function set(section, patch) {
      var p = {};
      if (section === 'lang') {
        p.lang = patch;
      } else if (section === 'vehicle') {
        // 未解锁的载具禁止被选为当前座驾
        if (isOwned(patch)) p.vehicle = patch;
      } else if (section === 'display' && isPlainObject(patch)) {
        ['orientation', 'camera', 'controls'].forEach(function (k) {
          if (own(patch, k)) p['display.' + k] = patch[k];
        });
      } else if (section === 'graphics' && isPlainObject(patch) && own(patch, 'lighting')) {
        p['graphics.lighting'] = patch.lighting;
      } else if (section === 'audio' && isPlainObject(patch) && own(patch, 'bgmVolume')) {
        p['audio.bgmVolume'] = patch.bgmVolume;
      } else if (section === 'tutorial' && isPlainObject(patch)) {
        ['completed', 'rewarded'].forEach(function (k) {
          if (own(patch, k)) p['tutorial.' + k] = patch[k];
        });
      } else if (section === 'controlLayout' && isPlainObject(patch)) {
        ['portrait', 'landscape'].forEach(function (k) {
          if (own(patch, k)) p['controlLayout.' + k] = patch[k];
        });
      } else if (section === 'mods' && isPlainObject(patch)) {
        ['target', 'density', 'rampInterval'].forEach(function (k) {
          if (own(patch, k)) p['mods.' + k] = patch[k];
        });
        if (isPlainObject(patch.on)) {
          FEATURES.forEach(function (k) {
            if (own(patch.on, k)) p['mods.on.' + k] = patch.on[k];
          });
        }
      }
      return commit(p, 'selection');
    }

    mergeAvailable();
    if (Object.keys(fields).length) persist();
    // 存档迁移：旧版本存档中可能已选中尚未解锁的付费载具，统一重置为免费的疾风 GT 轿跑
    if (own(fields, 'vehicle') && !isOwned(fields.vehicle.v)) commit({ vehicle: 'sedan' }, 'migration');

    // ==================== 车库积分钱包（驾驶积分入账 + 载具解锁消费） ====================

    /**
     * 将缓冲中的驾驶积分写入存档（余额与累计积分同时增加）
     */
    function flushPendingPoints() {
      if (pendingTimer) {
        clearTimeout(pendingTimer);
        pendingTimer = 0;
      }
      if (pendingPoints <= 0) return;
      var gain = pendingPoints;
      pendingPoints = 0;
      commit(function () {
        return {
          'progress.points': Math.min(POINTS_MAX, value('progress.points') + gain),
          'progress.earned': Math.min(POINTS_MAX, value('progress.earned') + gain)
        };
      }, 'earn');
    }

    /**
     * 驾驶中获得积分时调用（由 drive.js 在每次超车计分时实时调用）
     * @param {number} n 本次获得的积分
     * @returns {number} 实际入账的积分
     */
    function earn(n) {
      var gain = Math.floor(Number(n));
      if (!isFinite(gain) || gain <= 0) return 0;
      gain = Math.min(gain, EARN_MAX_PER_CALL);
      pendingPoints = Math.min(POINTS_MAX, pendingPoints + gain);
      if (!pendingTimer) pendingTimer = setTimeout(flushPendingPoints, EARN_FLUSH_DELAY);
      return gain;
    }

    /**
     * 当前可用积分余额（已落盘余额 + 尚未落盘的驾驶积分）
     */
    function balance() {
      return Math.min(POINTS_MAX, value('progress.points') + pendingPoints);
    }

    /**
     * 领取一次性成就奖励：读改写在 commit 回调中完成，多标签页同时触发也只会发放一次
     * @param {string} id 成就 ID
     * @returns {{id:string, pts:number, icon:string, nameEn:string, nameZh:string}|null} 本次新领取的成就定义；已领取或未知 ID 返回 null
     */
    function claimAchievement(id) {
      var def = null;
      for (var i = 0; i < ACHIEVEMENTS.length; i++) {
        if (ACHIEVEMENTS[i].id === id) def = ACHIEVEMENTS[i];
      }
      if (!def) return null;
      var claimed = false;
      commit(function () {
        if (value('achv.' + id) === true) return {};
        claimed = true;
        var patch = {};
        patch['achv.' + id] = true;
        return patch;
      }, 'achievement');
      if (!claimed) return null;
      earn(def.pts);
      flushPendingPoints();
      return copy(def);
    }

    /**
     * 消耗积分解锁指定载具
     * 读改写在 commit 的回调中完成，确保基于“合并其它标签页后”的最新余额计算，避免多开页面重复扣费 / 透支
     * @param {string} id 载具 ID
     * @returns {{ok:boolean, reason:string, vehicle:string, price:number, points:number, shortfall:number, storage:string}}
     *          reason 取值：purchased 解锁成功 / owned 已拥有 / insufficient 积分不足 / unknown 未知载具
     */
    function purchase(id) {
      if (!own(VEHICLE_PRICES, id)) {
        return { ok: false, reason: 'unknown', vehicle: id, price: 0, points: balance(), shortfall: 0, storage: storageState.mode };
      }
      flushPendingPoints();
      var result = null;
      commit(function () {
        var price = VEHICLE_PRICES[id];
        var points = value('progress.points');
        if (isOwned(id)) {
          result = { ok: true, reason: 'owned', price: price, points: points, shortfall: 0 };
          return {};
        }
        if (points < price) {
          result = { ok: false, reason: 'insufficient', price: price, points: points, shortfall: price - points };
          return {};
        }
        result = { ok: true, reason: 'purchased', price: price, points: points - price, shortfall: 0 };
        var patch = { 'progress.points': points - price };
        patch['owned.' + id] = true;
        return patch;
      }, 'purchase');
      result.vehicle = id;
      result.storage = storageState.mode;
      return result;
    }

    /**
     * 获取个人生涯最高纪录快照
     * @returns {{bestScore:number, bestDistance:number, bestCombo:number}}
     */
    function getRecords() {
      return {
        bestScore: Math.max(0, Math.floor(Number(value('records.bestScore')) || 0)),
        bestDistance: Math.max(0, Math.floor(Number(value('records.bestDistance')) || 0)),
        bestCombo: Math.max(0, Math.floor(Number(value('records.bestCombo')) || 0))
      };
    }

    /**
     * 提交单局成绩并与个人历史最高纪录进行高水位比对与持久化
     * @param {{score?:number, distance?:number, combo?:number}} stats 单局成绩（distance 单位为米）
     * @returns {{bestScore:number, bestDistance:number, bestCombo:number, isNewScore:boolean, isNewDistance:boolean, isNewCombo:boolean}}
     */
    function submitRunRecord(stats) {
      var st = stats || {};
      var curScore = Math.max(0, Math.min(POINTS_MAX, Math.floor(Number(st.score) || 0)));
      var curDist = Math.max(0, Math.min(POINTS_MAX, Math.floor(Number(st.distance) || 0)));
      var curCombo = Math.max(0, Math.min(POINTS_MAX, Math.floor(Number(st.combo) || 0)));
      var prev = getRecords();
      var isNewScore = curScore > prev.bestScore;
      var isNewDistance = curDist > prev.bestDistance;
      var isNewCombo = curCombo > prev.bestCombo;

      if (isNewScore || isNewDistance || isNewCombo) {
        commit(function () {
          var latest = getRecords();
          var patch = {};
          if (curScore > latest.bestScore) patch['records.bestScore'] = curScore;
          if (curDist > latest.bestDistance) patch['records.bestDistance'] = curDist;
          if (curCombo > latest.bestCombo) patch['records.bestCombo'] = curCombo;
          return patch;
        }, 'record');
      }
      var finalRec = getRecords();
      return {
        bestScore: finalRec.bestScore,
        bestDistance: finalRec.bestDistance,
        bestCombo: finalRec.bestCombo,
        isNewScore: isNewScore,
        isNewDistance: isNewDistance,
        isNewCombo: isNewCombo
      };
    }

    /**
     * 获取指定载具的全部定制涂装配置与当前解锁/装备状态
     * @param {string} vehicleId 载具 ID
     */
    function paintsFor(vehicleId) {
      var list = VEHICLE_PAINTS[vehicleId] || VEHICLE_PAINTS.sedan;
      var equippedId = getSelectedPaint(vehicleId);
      return list.map(function (p) {
        var owned = isPaintOwned(vehicleId, p.id);
        return {
          id: p.id,
          hex: p.hex,
          price: p.price,
          nameEn: p.nameEn,
          nameZh: p.nameZh,
          owned: owned,
          equipped: p.id === equippedId
        };
      });
    }

    /**
     * 装备某款已拥有的定制涂装，并通知 3D 展台与游戏内座驾实时变色
     * @param {string} vehicleId 载具 ID
     * @param {string} paintId 涂装 ID
     */
    function selectPaint(vehicleId, paintId) {
      var def = findPaintDef(vehicleId, paintId);
      if (!def || !isPaintOwned(vehicleId, paintId)) {
        return { ok: false, reason: 'locked', vehicle: vehicleId, paintId: paintId, hex: getSelectedPaintHex(vehicleId) };
      }
      var patch = {};
      patch['paint.' + vehicleId] = paintId;
      commit(patch, 'paint');
      window.dispatchEvent(new CustomEvent('garage-paint-changed', {
        detail: { vehicle: vehicleId, paintId: paintId, hex: def.hex, preview: false }
      }));
      return { ok: true, reason: 'equipped', vehicle: vehicleId, paintId: paintId, hex: def.hex };
    }

    /**
     * 消耗积分解锁指定载具的定制涂装，并在解锁成功后自动装备
     * @param {string} vehicleId 载具 ID
     * @param {string} paintId 涂装 ID
     */
    function purchasePaint(vehicleId, paintId) {
      var def = findPaintDef(vehicleId, paintId);
      if (!def) {
        return { ok: false, reason: 'unknown', vehicle: vehicleId, paintId: paintId, price: 0, points: balance(), shortfall: 0 };
      }
      flushPendingPoints();
      var result = null;
      commit(function () {
        var price = def.price;
        var points = value('progress.points');
        if (!isOwned(vehicleId)) {
          result = { ok: false, reason: 'vehicle_locked', price: price, points: points, shortfall: 0 };
          return {};
        }
        if (isPaintOwned(vehicleId, paintId)) {
          result = { ok: true, reason: 'owned', price: price, points: points, shortfall: 0 };
          var equipPatch = {};
          equipPatch['paint.' + vehicleId] = paintId;
          return equipPatch;
        }
        if (points < price) {
          result = { ok: false, reason: 'insufficient', price: price, points: points, shortfall: price - points };
          return {};
        }
        result = { ok: true, reason: 'purchased', price: price, points: points - price, shortfall: 0 };
        var patch = { 'progress.points': points - price };
        patch['paintOwned.' + vehicleId + '_' + paintId] = true;
        patch['paint.' + vehicleId] = paintId;
        return patch;
      }, 'purchase_paint');
      result.vehicle = vehicleId;
      result.paintId = paintId;
      result.hex = def.hex;
      result.storage = storageState.mode;
      if (result.ok) {
        window.dispatchEvent(new CustomEvent('garage-paint-changed', {
          detail: { vehicle: vehicleId, paintId: paintId, hex: def.hex, preview: false }
        }));
      }
      return result;
    }

    function findUpgradeDef(stat) {
      for (var i = 0; i < UPGRADES.length; i++) {
        if (UPGRADES[i].id === stat) return UPGRADES[i];
      }
      return null;
    }

    /**
     * 某座驾某项升级的当前等级（0 ~ UPGRADE_PRICES.length），未知座驾或升级项返回 0
     */
    function upgradeLevel(vehicleId, stat) {
      var def = findUpgradeDef(stat);
      if (!own(VEHICLE_PRICES, vehicleId) || !def || !upgradeApplies(def, vehicleId)) return 0;
      return value('upgrade.' + vehicleId + '_' + stat) || 0;
    }

    /**
     * 某座驾全部升级项的展示数据（含当前等级、下一级价格；已满级时 nextPrice 为 null）
     */
    function upgradesFor(vehicleId) {
      return UPGRADES.filter(function (u) {
        return upgradeApplies(u, vehicleId);
      }).map(function (u) {
        var out = copy(u);
        out.level = upgradeLevel(vehicleId, u.id);
        out.maxLevel = UPGRADE_PRICES.length;
        out.nextPrice = out.level < out.maxLevel ? UPGRADE_PRICES[out.level] : null;
        return out;
      });
    }

    /**
     * 消耗积分将某座驾某项升级提升 1 级；读改写在 commit 回调中完成，避免多开页面重复扣费
     * @returns {{ok:boolean, reason:string, vehicle:string, stat:string, level:number, price:number, points:number, shortfall:number}}
     *          reason 取值 purchased / max / vehicle_locked / insufficient / unknown
     */
    function purchaseUpgrade(vehicleId, stat) {
      var def = findUpgradeDef(stat);
      if (!own(VEHICLE_PRICES, vehicleId) || !def || !upgradeApplies(def, vehicleId)) {
        return { ok: false, reason: 'unknown', vehicle: vehicleId, stat: stat, level: 0, price: 0, points: balance(), shortfall: 0 };
      }
      flushPendingPoints();
      var result = null;
      commit(function () {
        var key = 'upgrade.' + vehicleId + '_' + stat;
        var level = value(key) || 0;
        var points = value('progress.points');
        if (!isOwned(vehicleId)) {
          result = { ok: false, reason: 'vehicle_locked', level: level, price: 0, points: points, shortfall: 0 };
          return {};
        }
        if (level >= UPGRADE_PRICES.length) {
          result = { ok: false, reason: 'max', level: level, price: 0, points: points, shortfall: 0 };
          return {};
        }
        var price = UPGRADE_PRICES[level];
        if (points < price) {
          result = { ok: false, reason: 'insufficient', level: level, price: price, points: points, shortfall: price - points };
          return {};
        }
        result = { ok: true, reason: 'purchased', level: level + 1, price: price, points: points - price, shortfall: 0 };
        var patch = { 'progress.points': points - price };
        patch[key] = level + 1;
        return patch;
      }, 'purchase_upgrade');
      result.vehicle = vehicleId;
      result.stat = stat;
      return result;
    }

    window.HorizonDriveWallet = {
      vehicles: VEHICLES.slice(),
      price: function (id) {
        return own(VEHICLE_PRICES, id) ? VEHICLE_PRICES[id] : null;
      },
      isOwned: isOwned,
      balance: balance,
      earned: function () {
        return Math.min(POINTS_MAX, value('progress.earned') + pendingPoints);
      },
      earn: earn,
      purchase: purchase,
      records: getRecords,
      submitRunRecord: submitRunRecord,
      paintsFor: paintsFor,
      paintInfo: findPaintDef,
      isPaintOwned: isPaintOwned,
      selectedPaint: getSelectedPaint,
      selectedPaintHex: getSelectedPaintHex,
      selectPaint: selectPaint,
      purchasePaint: purchasePaint,
      flush: flushPendingPoints,
      achievements: function () {
        return ACHIEVEMENTS.map(function (a) {
          var out = copy(a);
          out.claimed = value('achv.' + a.id) === true;
          return out;
        });
      },
      claimAchievement: claimAchievement,
      upgradeLevel: upgradeLevel,
      upgradesFor: upgradesFor,
      purchaseUpgrade: purchaseUpgrade,
      storageMode: function () {
        // 尚无任何存档字段时 persist 未执行过，storageState 仍为初始 memory，需主动探测存储是否可写
        if (Object.keys(fields).length) return storageState.mode;
        var probeKey = KEY + ':probe';
        var mode = (writeStorage('localStorage', probeKey, '1') || writeCloudStorage(probeKey, '1')) ? 'persistent'
          : writeStorage('sessionStorage', probeKey, '1') ? 'session' : 'memory';
        try { window.localStorage.removeItem(probeKey); } catch (_) {}
        try { window.sessionStorage.removeItem(probeKey); } catch (_) {}
        try {
          if (window.__HD_CG_SDK_READY__ && window.CrazyGames && window.CrazyGames.SDK && window.CrazyGames.SDK.data) {
            window.CrazyGames.SDK.data.removeItem(probeKey);
          }
        } catch (_) {}
        return mode;
      }
    };

    window.HorizonDriveSettings = {
      version: 1,
      key: KEY,
      hasUserSet: function (k) {
        return own(fields, k);
      },
      get: function (section) {
        var s = snapshot();
        return section ? copy(s[section]) : s;
      },
      set: set,
      flush: flush,
      syncCloudData: flush,
      status: function () {
        return copy(storageState);
      },
      subscribe: function (fn) {
        if (typeof fn !== 'function') return function () {};
        listeners.push(fn);
        return function () {
          var i = listeners.indexOf(fn);
          if (i >= 0) listeners.splice(i, 1);
        };
      }
    };

    window.addEventListener('storage', function (e) {
      if (e.key === KEY) {
        var changed = mergeRaw(e.newValue).concat(mergeAvailable());
        persist();
        emit(changed, 'external');
      }
    });
    window.addEventListener('pagehide', flush);
    window.addEventListener('pageshow', flush);
    window.addEventListener('game-home-restored', flush);
    document.addEventListener('visibilitychange', flush);
  })();

  // ==================== [模块 1.5] 全局中英双语国际化中心 (HorizonI18n) ====================
  (function installI18nCenter() {
    if (window.HorizonI18n) return;
    var settings = window.HorizonDriveSettings;

    // 静态 DOM 面板、车库与设置弹窗的完整中英双语词典
    var DICT = {
      en: {
        'doc.title': 'Horizon Overdrive: Endless Highway',
        'home.menuAria': 'Horizon Overdrive Main Menu',
        'home.eyebrow': 'HORIZON OVERDRIVE · 3D ARCADE RACING',
        'home.title': 'HORIZON OVERDRIVE',
        'home.tagline': 'Roaring engines, slicing the wind—race into the endless horizon.',
        'home.captionTitle': '28 Seamless All-Terrain Stages',
        'home.captionSub': 'Misty Peaks / Neon Metro / Sea Bridge / Red Canyon / Alpine Snow',
        'home.readyTitle': 'Ready to Roll',
        'home.readyIntro': 'Tune your ride and unleash full-throttle speed across every terrain.',
        'home.currentVehicle': 'CURRENT RIDE',
        'home.switchVehicle': 'Switch Ride',
        'home.settingsOpen': 'Driving Preferences',
        'home.startTitle': 'START OVERDRIVE',
        'home.startSub': 'Press Shift / N for NOS Boost, chain Near-Miss Combos & side-ram slow traffic!',
        'home.hint': 'Near-miss overtakes recharge NOS fast · Press Shift / N for Overdrive Boost',
        'settings.title': 'Driving Preferences',
        'settings.closeAria': 'Close settings',
        'settings.langAria': 'Language',
        'settings.language': 'Language',
        'settings.oriAria': 'Screen orientation',
        'settings.orientation': 'Orientation',
        'settings.portrait': 'Portrait',
        'settings.landscape': 'Landscape',
        'settings.camAria': 'Camera view',
        'settings.camera': 'Camera View',
        'settings.firstPerson': '1st Person',
        'settings.thirdPerson': '3rd Person',
        'settings.ctrlAria': 'Control mode',
        'settings.controls': 'Controls',
        'settings.wheel': 'Wheel',
        'settings.buttons': 'Buttons',
        'settings.lightAria': 'Dynamic lighting',
        'settings.lighting': 'Dynamic Lighting',
        'settings.on': 'On',
        'settings.off': 'Off',
        'settings.bgmVolume': 'Radio BGM Volume',
        'settings.bgmAria': 'Background music volume',
        'settings.tutorialAria': 'Onboarding tutorial',
        'settings.tutorial': 'Driving Academy',
        'settings.tutorialReplay': '📖 Replay Tutorial',
        'settings.done': 'Save & Resume Driving',
        'boot.title': 'HORIZON OVERDRIVE',
        'boot.tagline': 'Endless All-Terrain Highway · High-Speed Arcade Racing',
        'boot.loading': 'Building 3D highway & vehicle physics engine…',
        'boot.failed': 'Engine failed to load. Please refresh the page to retry.',
        'garage.title': 'HORIZON GARAGE',
        'garage.walletTitle': 'Points earned from overtakes are automatically saved to your garage wallet',
        'garage.pointsLabel': 'PTS',
        'garage.closeAria': 'Close garage',
        'garage.renderAria': '3D vehicle preview, drag or press arrow keys to rotate',
        'garage.dragHint': 'DRAG LEFT / RIGHT FOR 360° INSPECTION',
        'garage.chooseAria': 'Select vehicle',
        'garage.progressAria': 'Unlock progress',
        'garage.specsAria': 'Vehicle performance specifications',
        'garage.statSpeed': 'Top Speed (Base / NOS)',
        'garage.statAccel': 'Acceleration',
        'garage.statHandling': 'Handling & Brakes',
        'garage.statArmor': 'Armor & Durability',
        'garage.recordsAria': 'Personal best records',
        'garage.recScore': '🏆 BEST SCORE',
        'garage.recDistance': '🛣️ BEST TRIP',
        'garage.recCombo': '⚡ MAX COMBO',
        'garage.paintAria': 'Custom paint and livery workshop',
        'garage.paintTitle': '🎨 Custom Livery',
        'garage.paintSwatchesAria': 'Choose paint color',
        'vehicle.sedanShort': 'Gale GT',
        'vehicle.motorcycleShort': 'Phantom Bike',
        'vehicle.jetShort': 'Aether V8 Jet',
        'vehicle.truckShort': 'Titan Truck',
        'vehicle.policeShort': 'Falcon PD',
        'vehicle.sedan': 'Gale GT Coupe',
        'vehicle.sedanDesc': 'Low-slung widebody aero kit with a carbon GT wing. Balanced 285/355 km/h GT dynamics—drift stunts recharge +25% NOS & trigger a temporary shield.',
        'vehicle.motorcycle': 'Phantom Superbike',
        'vehicle.motorcycleDesc': 'Track-tuned 325/400 km/h superbike with an ultra-slim 0.34m frame for effortless lane splitting. +30% wider Near-Miss zone, +180 PTS Lane-Split bonus & wheelie auto-NOS/score boost.',
        'vehicle.jet': 'Aether V8 AeroCar',
        'vehicle.jetDesc': 'Apex 360/445 km/h hypercar with six vectored ion thrusters. Press F for a 6s tactical flight to leap over gridlock; ground near-misses recharge it fast.',
        'vehicle.truck': 'Titan V12 Heavy Truck',
        'vehicle.truckDesc': 'Heavy-duty V12 hauler with reinforced armor. Side-swipe small cars for 1.4× PTS, or activate NOS to charge the front bullbar and smash through cars ahead!',
        'vehicle.police': 'Falcon Interceptor',
        'vehicle.policeDesc': 'Pursuit-tuned 310/390 km/h interceptor. Blazing-fast 290 km/h WANTED cars appear on the highway—hit NOS and ram them within 25s for +1,500 PTS, a full NOS refill and +1 HEAT. Press F to sound the siren and make traffic ahead pull over.'
      },
      zh: {
        'doc.title': '地平线狂飙：无尽公路 (Horizon Overdrive)',
        'home.menuAria': '地平线狂飙 主控台',
        'home.eyebrow': 'HORIZON OVERDRIVE · 3D 公路狂飙',
        'home.title': '地平线狂飙',
        'home.tagline': '引擎轰鸣，破风疾驰——驶向没有尽头的远方地平线。',
        'home.captionTitle': '28 段无缝全地形公路',
        'home.captionSub': '云雾群峰 / 霓虹都市 / 跨海大桥 / 红岩峡谷 / 雪域高原',
        'home.readyTitle': '准备出发',
        'home.readyIntro': '自由切换专属座驾与视角，在昼夜流转与多变气候中全速狂飙。',
        'home.currentVehicle': '当前座驾',
        'home.switchVehicle': '切换座驾',
        'home.settingsOpen': '驾驶偏好设置',
        'home.startTitle': '开始狂飙',
        'home.startSub': '按 Shift / N 键喷射氮气加速，贴近超车触发惊险连击，侧撞弹飞慢车！',
        'home.hint': '贴近超车可快速积攒氮气 · 按 Shift / N 键触发极速狂飙',
        'settings.title': '驾驶偏好设置',
        'settings.closeAria': '关闭设置',
        'settings.langAria': '界面语言',
        'settings.language': '界面语言',
        'settings.oriAria': '屏幕方向',
        'settings.orientation': '屏幕方向',
        'settings.portrait': '竖屏',
        'settings.landscape': '横屏',
        'settings.camAria': '驾驶视角',
        'settings.camera': '驾驶视角',
        'settings.firstPerson': '第一人称',
        'settings.thirdPerson': '第三人称',
        'settings.ctrlAria': '操控方式',
        'settings.controls': '操控方式',
        'settings.wheel': '方向盘',
        'settings.buttons': '按键',
        'settings.lightAria': '动态光影',
        'settings.lighting': '动态光影',
        'settings.on': '开启',
        'settings.off': '关闭',
        'settings.bgmVolume': '车载电台音量',
        'settings.bgmAria': '背景音乐音量',
        'settings.tutorialAria': '新手教学引导',
        'settings.tutorial': '新手教学引导',
        'settings.tutorialReplay': '📖 重新开始引导',
        'settings.done': '完成并返回驾驶',
        'boot.title': '地平线狂飙',
        'boot.tagline': '无尽全地形公路 · 极速街机竞速',
        'boot.loading': '正在构建 3D 公路与载具物理引擎…',
        'boot.failed': '引擎加载未完成，请刷新页面重试。',
        'garage.title': '地平线车库',
        'garage.walletTitle': '驾驶中超车获得的积分会自动存入车库钱包',
        'garage.pointsLabel': '积分',
        'garage.closeAria': '关闭车库',
        'garage.renderAria': '座驾 3D 预览，左右拖拽或按方向键可旋转欣赏',
        'garage.dragHint': '左右拖拽可 360° 检视座驾',
        'garage.chooseAria': '选择座驾',
        'garage.progressAria': '解锁进度',
        'garage.specsAria': '座驾性能参数对比',
        'garage.statSpeed': '最高极速 (常态 / 氮气)',
        'garage.statAccel': '起步与加速爆发',
        'garage.statHandling': '转向与制动灵敏度',
        'garage.statArmor': '车身装甲与抗撞度',
        'garage.recordsAria': '个人生涯最高纪录',
        'garage.recScore': '🏆 最高得分',
        'garage.recDistance': '🛣️ 最远里程',
        'garage.recCombo': '⚡ 最高连击',
        'garage.paintAria': '定制涂装工坊',
        'garage.paintTitle': '🎨 定制涂装',
        'garage.paintSwatchesAria': '选择车身涂装颜色',
        'vehicle.sedanShort': '疾风轿跑',
        'vehicle.motorcycleShort': '幻影重机',
        'vehicle.jetShort': '天穹飞车',
        'vehicle.truckShort': '泰坦重卡',
        'vehicle.policeShort': '猎隼警车',
        'vehicle.sedan': '疾风 GT 轿跑',
        'vehicle.sedanDesc': '低趴宽体套件配碳纤维大尾翼，285/355 km/h 黄金均衡调校；施展漂移特技可瞬间充能 +25% 氮气并展开无损护盾。',
        'vehicle.motorcycle': '幻影重机',
        'vehicle.motorcycleDesc': '赛道级万转四缸仿赛重机（325/400 km/h），0.34m 超窄车身可在两车夹缝中丝滑穿插（钻缝额外奖 +180 分）；惊险超车享 1.35× 收益，按住 J 翘头可持续跳分回氮。',
        'vehicle.jet': '天穹 V8 飞车',
        'vehicle.jetDesc': '360/445 km/h 陆空双栖终极超跑，搭载六喷口矢量离子推进器；按 F 可开启 6 秒战术飞行跃过拥堵车海，落地惊险超车可快速回充飞行能量！',
        'vehicle.truck': '泰坦重型卡车',
        'vehicle.truckDesc': '配备重型防撞牛栏与强化装甲——侧面擦撞小车享 1.4× 积分，开启 NOS 氮气冲锋时可用车头牛栏正面撞飞前方小轿车（每次破障消耗 26% 氮气，注意避让大货车）！',
        'vehicle.police': '猎隼拦截者',
        'vehicle.policeDesc': '310/390 km/h 追缉调校拦截车。公路上会出现 290 km/h 的高速通缉车，开氮气追上并在 25 秒内撞下即得 +1,500 分、氮气回满并升 1 级热度；按 F 拉响警笛，前方车辆会主动让道。'
      }
    };

    // 当平台通过 SDK.user.systemInfo 自动检测语言但玩家尚未手动保存偏好时，使用会话级自动语种覆盖
    var autoDetectedLang = null;

    /**
     * 获取当前激活的语言代码（'en' 或 'zh'，默认 'en'）
     */
    function lang() {
      if (settings && settings.hasUserSet && settings.hasUserSet('lang')) {
        return settings.get('lang') === 'zh' ? 'zh' : 'en';
      }
      if (autoDetectedLang) {
        return autoDetectedLang;
      }
      var l = settings && settings.get ? settings.get('lang') : 'en';
      return l === 'zh' ? 'zh' : 'en';
    }

    /**
     * 当前是否为英语模式
     */
    function isEn() {
      return lang() === 'en';
    }

    /**
     * 根据当前语言快速从英/中两个候选值中择一返回
     */
    function pick(enVal, zhVal) {
      return lang() === 'zh' ? zhVal : enVal;
    }

    /**
     * 根据词典键名获取翻译文本，支持 {name} 占位符替换
     */
    function t(key, vars) {
      var cur = lang();
      var table = DICT[cur] || DICT.en;
      var raw = Object.prototype.hasOwnProperty.call(table, key) ? table[key] : (DICT.en[key] || key);
      if (vars && typeof raw === 'string') {
        Object.keys(vars).forEach(function (k) {
          raw = raw.replace(new RegExp('\\{' + k + '\\}', 'g'), String(vars[k]));
        });
      }
      return raw;
    }

    /**
     * 扫描指定根节点下的所有 data-i18n / data-i18n-aria / data-i18n-title 元素并更新文案
     */
    function applyDOM(rootEl) {
      var scope = rootEl || document;
      if (!scope || !scope.querySelectorAll) return;
      scope.querySelectorAll('[data-i18n]').forEach(function (el) {
        var key = el.getAttribute('data-i18n');
        if (key) el.textContent = t(key);
      });
      scope.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
        var key = el.getAttribute('data-i18n-aria');
        if (key) el.setAttribute('aria-label', t(key));
      });
      scope.querySelectorAll('[data-i18n-title]').forEach(function (el) {
        var key = el.getAttribute('data-i18n-title');
        if (key) el.setAttribute('title', t(key));
      });
    }

    var lastSyncedLang = null;
    /**
     * 同步 html 标签属性、文档标题、静态 DOM 节点，并在语言发生变更时广播全局事件
     */
    function syncDocumentLang(forceEmit) {
      var cur = lang();
      var changed = cur !== lastSyncedLang;
      lastSyncedLang = cur;
      var root = document.documentElement;
      if (root) {
        root.setAttribute('lang', cur === 'zh' ? 'zh-CN' : 'en');
        root.setAttribute('data-lang', cur);
      }
      document.title = t('doc.title');
      applyDOM(document);
      if (changed || forceEmit) {
        window.dispatchEvent(new CustomEvent('horizon-lang-change', { detail: { lang: cur } }));
      }
    }

    /**
     * 切换并持久化指定语言（'en' 或 'zh'）
     */
    function setLang(nextLang) {
      var target = nextLang === 'zh' ? 'zh' : 'en';
      autoDetectedLang = target;
      if (settings && settings.set) {
        settings.set('lang', target);
      }
      syncDocumentLang(true);
      return target;
    }

    /**
     * 根据 CrazyGames SDK.user.systemInfo 自动匹配初始语言
     * - 仅在玩家尚未于本地存储中手动保存过语言偏好时生效
     * - 匹配中文区域时自动对齐为 'zh'，其余所有未支持语种一律安全回退为 'en'
     * @param {string} rawLocale 平台返回的语言区域字符串（如 'zh-CN', 'en-US'）
     * @param {string} countryCode 平台返回的国家/地区代码（如 'CN', 'US'）
     */
    function applyPlatformSystemLocale(rawLocale, countryCode) {
      if (settings && settings.hasUserSet && settings.hasUserSet('lang')) {
        return lang();
      }
      var loc = String(rawLocale || '').trim().toLowerCase();
      var cc = String(countryCode || '').trim().toUpperCase();
      var isChinese = loc.indexOf('zh') === 0 || ['CN', 'TW', 'HK', 'MO'].indexOf(cc) >= 0;
      autoDetectedLang = isChinese ? 'zh' : 'en';
      syncDocumentLang(true);
      return autoDetectedLang;
    }

    /**
     * 在英文与简体中文之间一键切换
     */
    function toggle() {
      return setLang(lang() === 'en' ? 'zh' : 'en');
    }

    window.HorizonI18n = {
      lang: lang,
      isEn: isEn,
      pick: pick,
      t: t,
      setLang: setLang,
      toggle: toggle,
      applyDOM: applyDOM,
      applyPlatformSystemLocale: applyPlatformSystemLocale
    };

    if (settings && settings.subscribe) {
      settings.subscribe(function (change) {
        if (change.sections.indexOf('lang') >= 0) {
          syncDocumentLang(true);
        }
      });
    }

    syncDocumentLang(false);
  })();

  // ==================== [模块 2] 视口横竖屏旋转适配与游戏设置弹窗 ====================
  (function installViewportAndSettings() {
    var root = document.documentElement;
    var gapProbe = document.createElement('div');
    gapProbe.style.cssText = 'position:absolute;visibility:hidden;display:flex;flex-direction:column;row-gap:1px;';
    gapProbe.appendChild(document.createElement('div'));
    gapProbe.appendChild(document.createElement('div'));
    document.body.appendChild(gapProbe);
    root.setAttribute('data-flex-gap', gapProbe.scrollHeight === 1 ? 'true' : 'false');
    gapProbe.remove();

    var settings = window.HorizonDriveSettings;
    var i18n = window.HorizonI18n;

    function syncLighting() {
      var enabled = settings.get('graphics').lighting;
      root.setAttribute('data-lighting', enabled ? 'on' : 'off');
      document.querySelectorAll('.drive-preferences button').forEach(function (b) {
        if (b.hasAttribute('data-lighting')) {
          b.setAttribute('aria-pressed', String(b.getAttribute('data-lighting') === (enabled ? 'on' : 'off')));
        }
      });
    }
    syncLighting();

    var displayOptions = {
      orientation: ['portrait', 'landscape'],
      camera: ['first', 'third'],
      controls: ['wheel', 'buttons']
    };
    var displayValues = settings.get('display');
    var autoOrientation = window.HorizonDriveAutoOrientation && window.HorizonDriveAutoOrientation();
    if (autoOrientation) displayValues.orientation = autoOrientation;

    function syncDisplaySettings() {
      displayValues = settings.get('display');
      var autoOri = window.HorizonDriveAutoOrientation && window.HorizonDriveAutoOrientation();
      if (autoOri) displayValues.orientation = autoOri;
      Object.keys(displayValues).forEach(function (key) {
        root.setAttribute('data-' + key, displayValues[key]);
      });
      var curLang = i18n ? i18n.lang() : 'en';
      var summary = document.getElementById('settings-summary');
      if (summary) {
        if (curLang === 'zh') {
          summary.textContent =
            (displayValues.orientation === 'landscape' ? '横屏' : '竖屏') + ' · ' +
            (displayValues.camera === 'third' ? '第三人称' : '第一人称') + ' · ' +
            (displayValues.controls === 'buttons' ? '按键' : '方向盘');
        } else {
          summary.textContent =
            (displayValues.orientation === 'landscape' ? 'Landscape' : 'Portrait') + ' · ' +
            (displayValues.camera === 'third' ? '3rd Person' : '1st Person') + ' · ' +
            (displayValues.controls === 'buttons' ? 'Buttons' : 'Wheel');
        }
      }
      document.querySelectorAll('.drive-preferences button').forEach(function (button) {
        if (button.hasAttribute('data-lang-select')) {
          button.setAttribute('aria-pressed', String(button.getAttribute('data-lang-select') === curLang));
        }
        Object.keys(displayOptions).forEach(function (key) {
          if (button.hasAttribute('data-' + key)) {
            button.setAttribute('aria-pressed', String(button.getAttribute('data-' + key) === displayValues[key]));
          }
        });
      });
    }

    function saveDisplaySettings() {
      var val = Object.assign({}, displayValues);
      if (window.HorizonDriveAutoOrientation && window.HorizonDriveAutoOrientation()) {
        val.orientation = settings.get('display').orientation;
      }
      settings.set('display', val);
    }
    syncDisplaySettings();

    function setMusic(val) {
      root.setAttribute('data-bgm-volume', String(val));
      var slider = document.getElementById('bgm-volume');
      var output = document.getElementById('bgm-volume-value');
      if (slider) slider.value = String(val);
      if (output) output.textContent = String(val);
    }
    setMusic(settings.get('audio').bgmVolume);

    document.addEventListener('input', function (e) {
      if (e.target.id !== 'bgm-volume') return;
      var val = Math.max(0, Math.min(100, Number(e.target.value)));
      settings.set('audio', { bgmVolume: val });
    });

    var settingsReturn;
    var settingsKeyboard = false;

    /**
     * 关闭驾驶偏好设置弹窗，并通知 3D 驾驶引擎恢复运行状态
     */
    function closeSettings() {
      var overlay = document.querySelector('.game-settings-overlay');
      if (!overlay) return;
      var wasOpen = !overlay.hidden;
      overlay.hidden = true;
      var menu = document.getElementById('mode-screen');
      if (menu) {
        menu.removeAttribute('aria-hidden');
        menu.inert = false;
      }
      if (wasOpen) {
        var garageStillOpen = document.querySelector('.garage-overlay:not([hidden])');
        if (!garageStillOpen) {
          window.dispatchEvent(new CustomEvent('horizon-ad-state', { detail: false }));
        }
      }
      if (settingsKeyboard && settingsReturn) settingsReturn.focus({ preventScroll: true });
    }

    document.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('.game-settings-open')) {
        var overlay = document.querySelector('.game-settings-overlay');
        if (!overlay) return;
        settingsReturn = e.target.closest('.game-settings-open');
        settingsKeyboard = e.detail === 0;
        document.body.appendChild(overlay);
        overlay.hidden = false;
        // 打开设置弹窗时自动暂停底层 3D 驾驶与音频
        window.dispatchEvent(new CustomEvent('horizon-ad-state', { detail: true }));
        var menu = document.getElementById('mode-screen');
        if (menu) {
          menu.setAttribute('aria-hidden', 'true');
          menu.inert = true;
        }
        if (settingsKeyboard) overlay.querySelector('[data-settings-close]').focus({ preventScroll: true });
      } else if ((e.target.closest && e.target.closest('[data-settings-close]')) || e.target.classList.contains('game-settings-overlay')) {
        closeSettings();
      }
    });

    document.addEventListener('keydown', function (e) {
      var overlay = document.querySelector('.game-settings-overlay');
      if (!overlay || overlay.hidden) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        closeSettings();
      } else if (e.key === 'Tab') {
        var items = overlay.querySelectorAll('button,input');
        var first = items[0];
        var last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus({ preventScroll: true });
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus({ preventScroll: true });
        }
      }
    }, true);

    function fitHome(width, height, land) {
      var menu = document.getElementById('mode-screen');
      var content = menu && menu.querySelector('.mode-content');
      if (!content || getComputedStyle(menu).display === 'none') return;
      var frame = menu.querySelector('.home-fit-frame');
      if (!frame) {
        frame = document.createElement('div');
        frame.className = 'home-fit-frame';
        menu.insertBefore(frame, content);
        frame.appendChild(content);
      }
      var style = getComputedStyle(menu);
      var availableWidth = width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      var availableHeight = height - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
      var designWidth = land ? Math.max(640, Math.min(1020, availableWidth)) : Math.max(320, Math.min(440, availableWidth));
      content.style.width = designWidth + 'px';
      content.style.transform = 'none';
      var scale = Math.max(0.1, Math.min(1, availableWidth / designWidth, availableHeight / content.offsetHeight));
      frame.style.width = designWidth * scale + 'px';
      frame.style.height = content.offsetHeight * scale + 'px';
      content.style.transform = 'scale(' + scale + ')';
    }

    var timer;
    function apply() {
      var w = root.clientWidth || window.innerWidth;
      var h = root.clientHeight || window.innerHeight;
      if (!(w > 0 && h > 0)) return;
      syncDisplaySettings();
      var land = root.getAttribute('data-orientation') === 'landscape';
      // 桌面端始终保持正向视口，防止旋转90度
      var rotate = root.getAttribute('data-desktop') === 'true' ? false : (land ? w < h : w > h);
      var width = rotate ? h : w;
      var height = rotate ? w : h;
      root.style.setProperty('--aux-portrait-top', Math.max(146, height * 0.25) + 'px');
      root.setAttribute('data-rotated', rotate ? 'true' : 'false');
      root.setAttribute('data-menu-compact', height < 650 ? 'true' : 'false');
      root.setAttribute('data-menu-tight', height < (land ? 340 : 460) ? 'true' : 'false');
      root.style.setProperty('--screen-width', width + 'px');
      root.style.setProperty('--screen-height', height + 'px');
      document.body.style.width = width + 'px';
      document.body.style.height = height + 'px';
      document.body.style.setProperty('--app-height', height + 'px');
      document.body.style.setProperty('--app-width', width + 'px');
      document.body.style.transform = rotate ? 'translateX(' + w + 'px) rotate(90deg)' : 'rotate(0deg)';
      fitHome(width, height, land);
      window.dispatchEvent(new Event('game-layout-change'));
    }

    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('.drive-preferences button');
      if (!b) return;
      if (b.hasAttribute('data-tutorial-replay')) {
        closeSettings();
        if (window.HorizonTutorial && typeof window.HorizonTutorial.restart === 'function') {
          window.HorizonTutorial.restart();
        }
        return;
      }
      var langSelect = b.getAttribute('data-lang-select');
      if (langSelect === 'en' || langSelect === 'zh') {
        if (i18n) i18n.setLang(langSelect);
        syncDisplaySettings();
        apply();
        return;
      }
      var light = b.getAttribute('data-lighting');
      if (light === 'on' || light === 'off') {
        settings.set('graphics', { lighting: light === 'on' });
        return;
      }
      var changed = false;
      Object.keys(displayOptions).forEach(function (key) {
        var val = b.getAttribute('data-' + key);
        if (displayOptions[key].indexOf(val) !== -1) {
          displayValues[key] = val;
          changed = true;
        }
      });
      if (!changed) return;
      saveDisplaySettings();
      syncDisplaySettings();
      var orientation = b.getAttribute('data-orientation');
      if (displayOptions.orientation.indexOf(orientation) !== -1) {
        apply();
        try {
          var o = window.screen.orientation;
          if (o && o.lock) {
            var p = o.lock(orientation);
            if (p && p.catch) p.catch(function () {});
          }
        } catch (_) {}
      }
    });

    window.addEventListener('horizon-lang-change', function () {
      syncDisplaySettings();
      apply();
    });

    window.addEventListener('resize', function () {
      clearTimeout(timer);
      timer = setTimeout(apply, 50);
    });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', function () {
        clearTimeout(timer);
        timer = setTimeout(apply, 50);
      });
    }
    window.addEventListener('orientationchange', function () {
      apply();
      setTimeout(apply, 300);
    });

    function restoreHomeLayout() {
      closeSettings();
      syncLighting();
      syncDisplaySettings();
      setMusic(settings.get('audio').bgmVolume);
      settings.flush();
      apply();
    }

    settings.subscribe(function (change) {
      if (change.sections.indexOf('graphics') >= 0) {
        syncLighting();
        window.dispatchEvent(new Event('lighting-change'));
      }
      if (change.sections.indexOf('display') >= 0) {
        syncDisplaySettings();
        apply();
      }
      if (change.sections.indexOf('audio') >= 0) {
        setMusic(settings.get('audio').bgmVolume);
        window.dispatchEvent(new Event('bgm-volume-change'));
      }
    });

    window.addEventListener('game-home-restored', restoreHomeLayout);
    window.addEventListener('pageshow', function () {
      syncLighting();
      syncDisplaySettings();
      setMusic(settings.get('audio').bgmVolume);
      apply();
    });
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) apply();
    });
    if (window.ResizeObserver) {
      var sizeObserver = new ResizeObserver(function () {
        clearTimeout(timer);
        timer = setTimeout(apply, 50);
      });
      sizeObserver.observe(root);
    }
    apply();
  })();

  // ==================== [模块 3] 车库三维预览与载具切换控制器 ====================
  (function installGarageController(jetEnabled) {
    if (jetEnabled === void 0) jetEnabled = true;
    var root = document.documentElement;
    var i18n = window.HorizonI18n;
    var namesEn = {
      sedan: 'Gale GT Coupe',
      motorcycle: 'Phantom Superbike',
      jet: 'Aether V8 AeroCar',
      truck: 'Titan V12 Heavy Truck',
      police: 'Falcon Interceptor'
    };
    var namesZh = {
      sedan: '疾风 GT 轿跑',
      motorcycle: '幻影重机',
      jet: '天穹 V8 飞车',
      truck: '泰坦重型卡车',
      police: '猎隼拦截者'
    };
    function getVehicleName(id) {
      return i18n && i18n.lang() === 'zh' ? (namesZh[id] || namesZh.sedan) : (namesEn[id] || namesEn.sedan);
    }
    function pick(enVal, zhVal) {
      return i18n ? i18n.pick(enVal, zhVal) : enVal;
    }

    /**
     * 五款座驾的真实性能参数与专属被动特长字典（与 drive.js 中的 R9 物理矩阵严格一一对应）
     */
    var VEHICLE_SPECS = {
      sedan: {
        roleEn: 'BALANCED DRIFT',
        roleZh: '均衡漂移流',
        perkTitleEn: '🌀 Slipstream Drift Master',
        perkTitleZh: '🌀 尾流漂移大师',
        perkDescEn: '180°/360° drift stunts grant a 1.8s damage shield & +25% NOS; normal overtakes restore +9% NOS.',
        perkDescZh: '180°/360° 漂移特技自动开启 1.8s 无损护盾并瞬间充能 +25% 氮气；普通超车额外多回 +4% 氮气。',
        speedPct: 68,
        speedEn: '285 / 355 km/h',
        speedZh: '285 / 355 km/h',
        accelPct: 66,
        accelEn: '1.05× Linear',
        accelZh: '1.05× 线性均衡',
        handlingPct: 76,
        handlingEn: '1.10× Agile',
        handlingZh: '1.10× 精准灵巧',
        armorPct: 55,
        armorEn: '4 Hits (-25%)',
        armorZh: '4 次抗撞 (-25%)'
      },
      motorcycle: {
        roleEn: 'RAZOR COMBO',
        roleZh: '刀锋连击流',
        perkTitleEn: '⚡ Blade Weaver & Wheelie Frenzy',
        perkTitleZh: '⚡ 刀锋猎手 & 翘头狂飙',
        perkDescEn: 'Near-Miss zone +30% with 1.35× PTS & NOS. High-speed wheelies (J) grant +60 PTS/s & +14% NOS/s!',
        perkDescZh: '惊险超车判定放宽 +30% 且享 1.35× 积分与氮气；高速按 J 翘头每秒自动跳 +60 分并回复 +14% 氮气！',
        speedPct: 84,
        speedEn: '325 / 400 km/h',
        speedZh: '325 / 400 km/h',
        accelPct: 88,
        accelEn: '1.50× Explosive',
        accelZh: '1.50× 狂暴弹射',
        handlingPct: 98,
        handlingEn: '1.42× Razor',
        handlingZh: '1.42× 刀锋压弯',
        armorPct: 35,
        armorEn: '3 Hits (-34%)',
        armorZh: '3 次抗撞 (-34%)'
      },
      truck: {
        roleEn: 'HEAVY JUGGERNAUT',
        roleZh: '重甲破障流',
        perkTitleEn: '🛡️ NOS Bullbar Ram & Heavy Armor',
        perkTitleZh: '🛡️ 氮气牛栏破障 & 重型装甲',
        perkDescEn: 'Side-swipe cars for +280 PTS; while NOS is active, front bullbar smashes small cars ahead (-26% NOS per ram). Avoid semi-trucks!',
        perkDescZh: '侧撞小车奖励 +280 分；开启 NOS 氮气期间车头牛栏可正面撞飞前方小车（每次消耗 26% 氮气），未开氮气或撞大货车仍会受损！',
        speedPct: 56,
        speedEn: '255 / 340 km/h',
        speedZh: '255 / 340 km/h',
        accelPct: 52,
        accelEn: '0.75× / 1.45× NOS',
        accelZh: '0.75× / 氮气狂暴',
        handlingPct: 52,
        handlingEn: '0.76× Heavy',
        handlingZh: '0.76× 沉稳重型',
        armorPct: 90,
        armorEn: '5 Hits (-20%)',
        armorZh: '5 次重甲 (-20%)'
      },
      jet: {
        roleEn: 'AERO APEX',
        roleZh: '陆空极速流',
        perkTitleEn: '✈️ 6s Tactical Flight & Near-Miss Recharge',
        perkTitleZh: '✈️ 6秒战术越障飞行 & 超车充能',
        perkDescEn: 'Highest land speed (360/445 km/h). Press F for up to 6s of flight over gridlock (+60 PTS flyover). Each ground near-miss restores 1.5s of flight; driving slowly refills the rest.',
        perkDescZh: '全场最高陆地极速 (360/445 km/h)；按 F 可起飞 6 秒越过堵车（空域掠过 +60 分）；地面每次惊险超车回充 1.5 秒飞行能量，行驶中也会缓慢回充。',
        speedPct: 100,
        speedEn: '360 / 445 km/h',
        speedZh: '360 / 445 km/h',
        accelPct: 78,
        accelEn: '1.30× Ion Thrust',
        accelZh: '1.30× 离子推进',
        handlingPct: 78,
        handlingEn: '1.10× Mag-Lev',
        handlingZh: '1.10× 磁悬转向',
        armorPct: 55,
        armorEn: '4 Hits (-25%)',
        armorZh: '4 次抗撞 (-25%)'
      },
      police: {
        roleEn: 'PURSUIT HUNTER',
        roleZh: '追缉猎手流',
        perkTitleEn: '🚨 Wanted Pursuit & Siren',
        perkTitleZh: '🚨 通缉追捕 & 警笛开道',
        perkDescEn: '290 km/h WANTED cars spawn about every 1.5 km. Ram one from the side or rear within 25s for +1,500 PTS, full NOS & +1 HEAT (rear rams on suspects deal no damage). F: siren makes traffic ahead pull over for 4s (15s cooldown).',
        perkDescZh: '约每 1.5 公里刷出一辆 290 km/h 的高速通缉车，25 秒内从侧面或后方撞下即得 +1,500 分、氮气回满并升 1 级热度（追尾通缉车不扣血）；按 F 拉响警笛，前方车辆让道 4 秒（冷却 15 秒）。',
        speedPct: 76,
        speedEn: '310 / 390 km/h',
        speedZh: '310 / 390 km/h',
        accelPct: 72,
        accelEn: '1.20× Pursuit',
        accelZh: '1.20× 追缉调校',
        handlingPct: 82,
        handlingEn: '1.20× Interceptor',
        handlingZh: '1.20× 拦截操控',
        armorPct: 55,
        armorEn: '4 Hits (-25%)',
        armorZh: '4 次抗撞 (-25%)'
      }
    };

    var selected = 'sedan';
    var draft = 'sedan';
    var draftPaint = 'stock';
    var returnTo;
    var keyboardOpen = false;
    var settings = window.HorizonDriveSettings;
    var wallet = window.HorizonDriveWallet;
    // 解锁二次确认状态：armed 为当前处于“再次点击确认”状态的载具 ID，超时自动撤销，防止误触扣费
    var armed = null;
    var armTimer = 0;
    // 涂装解锁二次确认状态：paintArmed 格式为 vehicleId + ':' + paintId
    var paintArmed = null;
    var paintArmTimer = 0;
    var ARM_TIMEOUT = 3500;
    // 车库提示信息（解锁成功 / 积分不足等），切换载具时清空；同时保存中英文文案以支持热切换语言
    var notice = null;
    var celebrateTimer = 0;

    /**
     * 千分位格式化积分数字
     */
    function fmt(n) {
      return String(Math.max(0, Math.floor(Number(n) || 0))).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    function vehicleChoice() {
      var id = settings.get('vehicle');
      return !jetEnabled && id === 'jet' ? 'sedan' : id;
    }

    selected = vehicleChoice();
    root.setAttribute('data-vehicle', selected);

    function updateHome() {
      selected = vehicleChoice();
      root.setAttribute('data-vehicle', selected);
      var name = document.querySelector('.home-vehicle strong');
      if (name) name.textContent = getVehicleName(selected);
    }

    /**
     * 刷新车库五维性能面板与专属被动特长徽章
     */
    function paintSpecs() {
      var spec = VEHICLE_SPECS[draft] || VEHICLE_SPECS.sedan;
      var box = document.getElementById('garage-specs');
      if (box) box.setAttribute('data-spec-vehicle', draft);
      var roleEl = document.getElementById('garage-perk-role');
      if (roleEl) roleEl.textContent = pick(spec.roleEn, spec.roleZh);
      var titleEl = document.getElementById('garage-perk-title');
      if (titleEl) titleEl.textContent = pick(spec.perkTitleEn, spec.perkTitleZh);
      var descEl = document.getElementById('garage-perk-desc');
      if (descEl) descEl.textContent = pick(spec.perkDescEn, spec.perkDescZh);

      var speedVal = document.getElementById('garage-stat-speed-val');
      if (speedVal) speedVal.textContent = pick(spec.speedEn, spec.speedZh);
      var speedBar = document.getElementById('garage-stat-speed-bar');
      if (speedBar) speedBar.style.width = spec.speedPct + '%';

      var accelVal = document.getElementById('garage-stat-accel-val');
      if (accelVal) accelVal.textContent = pick(spec.accelEn, spec.accelZh);
      var accelBar = document.getElementById('garage-stat-accel-bar');
      if (accelBar) accelBar.style.width = spec.accelPct + '%';

      var handVal = document.getElementById('garage-stat-handling-val');
      if (handVal) handVal.textContent = pick(spec.handlingEn, spec.handlingZh);
      var handBar = document.getElementById('garage-stat-handling-bar');
      if (handBar) handBar.style.width = spec.handlingPct + '%';

      var armorVal = document.getElementById('garage-stat-armor-val');
      if (armorVal) armorVal.textContent = pick(spec.armorEn, spec.armorZh);
      var armorBar = document.getElementById('garage-stat-armor-bar');
      if (armorBar) armorBar.style.width = spec.armorPct + '%';
    }

    /**
     * 刷新车库左栏底部的个人生涯最高纪录荣誉条
     */
    function paintRecords() {
      if (!wallet || typeof wallet.records !== 'function') return;
      var rec = wallet.records();
      var scoreEl = document.getElementById('garage-rec-score');
      if (scoreEl) scoreEl.textContent = fmt(rec.bestScore) + pick(' PTS', ' 积分');
      var distEl = document.getElementById('garage-rec-distance');
      if (distEl) distEl.textContent = (Math.max(0, Number(rec.bestDistance) || 0) / 1000).toFixed(1) + ' km';
      var comboEl = document.getElementById('garage-rec-combo');
      if (comboEl) comboEl.textContent = '×' + Math.max(0, Math.floor(Number(rec.bestCombo) || 0));
    }

    /**
     * 撤销涂装“再次点击确认解锁”状态
     */
    // 升级项“再次点击确认购买”状态（键为 座驾:升级项），与涂装确认互不干扰
    var upgradeArmed = null;
    var upgradeArmTimer = 0;

    function disarmUpgrade() {
      upgradeArmed = null;
      if (upgradeArmTimer) {
        clearTimeout(upgradeArmTimer);
        upgradeArmTimer = 0;
      }
    }

    function armUpgrade(key) {
      disarmUpgrade();
      upgradeArmed = key;
      upgradeArmTimer = setTimeout(function () {
        upgradeArmTimer = 0;
        upgradeArmed = null;
        paintUpgrades();
      }, ARM_TIMEOUT);
    }

    /**
     * 刷新性能升级面板：每项显示名称、效果说明、等级刻度与购买按钮
     */
    function paintUpgrades() {
      var box = document.getElementById('garage-upgrades-list');
      if (!box || !wallet || typeof wallet.upgradesFor !== 'function') return;
      var title = document.getElementById('garage-upgrades-title');
      if (title) title.textContent = pick('🔧 Performance Upgrades', '🔧 性能升级');
      var list = wallet.upgradesFor(draft);
      var points = wallet.balance();
      var vehicleOwned = wallet.isOwned(draft);
      if (box.children.length !== list.length) {
        box.innerHTML = '';
        list.forEach(function (u) {
          var row = document.createElement('div');
          row.className = 'garage-upgrade-row';
          row.innerHTML =
            '<span class="garage-upgrade-info"><b></b><small></small></span>' +
            '<span class="garage-upgrade-pips" aria-hidden="true"></span>' +
            '<button type="button" class="garage-upgrade-buy"></button>';
          row.querySelector('.garage-upgrade-buy').setAttribute('data-upgrade-buy', u.id);
          box.appendChild(row);
        });
      }
      list.forEach(function (u, idx) {
        var row = box.children[idx];
        row.setAttribute('data-upgrade', u.id);
        row.querySelector('.garage-upgrade-info b').textContent = u.icon + ' ' + pick(u.nameEn, u.nameZh);
        row.querySelector('.garage-upgrade-info small').textContent = pick(u.effectEn, u.effectZh);
        var pips = row.querySelector('.garage-upgrade-pips');
        var pipHtml = '';
        for (var p = 0; p < u.maxLevel; p++) pipHtml += '<i' + (p < u.level ? ' class="on"' : '') + '></i>';
        pips.innerHTML = pipHtml;
        var btn = row.querySelector('.garage-upgrade-buy');
        btn.setAttribute('data-upgrade-buy', u.id);
        var state;
        if (u.nextPrice === null) {
          state = 'max';
          btn.textContent = pick('MAX', '已满级');
        } else if (!vehicleOwned) {
          state = 'vehicle-locked';
          btn.textContent = '🔒 ' + fmt(u.nextPrice);
        } else if (points < u.nextPrice) {
          state = 'locked';
          btn.textContent = '🔒 ' + fmt(u.nextPrice);
        } else if (upgradeArmed === draft + ':' + u.id) {
          state = 'armed';
          btn.textContent = pick('Confirm −' + fmt(u.nextPrice), '确认 −' + fmt(u.nextPrice));
        } else {
          state = 'unlock';
          btn.textContent = pick('Lv ' + (u.level + 1) + ' · ' + fmt(u.nextPrice), '升到 ' + (u.level + 1) + ' 级 · ' + fmt(u.nextPrice));
        }
        btn.setAttribute('data-upgrade-state', state);
        var label = pick(u.nameEn, u.nameZh) + ' Lv ' + u.level + '/' + u.maxLevel;
        btn.setAttribute('aria-label', label + ' · ' + btn.textContent);
        if (state === 'max' || state === 'locked' || state === 'vehicle-locked') btn.setAttribute('aria-disabled', 'true');
        else btn.removeAttribute('aria-disabled');
        btn.title = state === 'vehicle-locked' ? pick('Unlock this ride first', '需先解锁座驾') : label;
      });
    }

    function disarmPaint() {
      paintArmed = null;
      if (paintArmTimer) {
        clearTimeout(paintArmTimer);
        paintArmTimer = 0;
      }
    }

    /**
     * 进入涂装“再次点击确认解锁”状态，超时后自动撤销
     */
    function armPaint(key) {
      disarmPaint();
      paintArmed = key;
      paintArmTimer = setTimeout(function () {
        paintArmTimer = 0;
        paintArmed = null;
        paintWorkshop();
      }, ARM_TIMEOUT);
    }

    /**
     * 刷新定制涂装工坊面板与 3D 展台实时预览颜色
     */
    function paintWorkshop() {
      if (!wallet || typeof wallet.paintsFor !== 'function') return;
      var list = wallet.paintsFor(draft);
      if (!list || !list.length) return;
      var points = wallet.balance();
      var vehicleOwned = wallet.isOwned(draft);

      var curPaint = null;
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === draftPaint) {
          curPaint = list[i];
          break;
        }
      }
      if (!curPaint) {
        var eqId = wallet.selectedPaint(draft);
        for (var j = 0; j < list.length; j++) {
          if (list[j].id === eqId) {
            curPaint = list[j];
            break;
          }
        }
        if (!curPaint) curPaint = list[0];
        draftPaint = curPaint.id;
      }

      // 同步 3D 展台预览颜色属性并通知 Three.js 展台实时变色
      var host = document.getElementById('garage-render');
      if (host) host.setAttribute('data-preview-paint', curPaint.hex);
      window.dispatchEvent(new CustomEvent('garage-paint-changed', {
        detail: { vehicle: draft, paintId: curPaint.id, hex: curPaint.hex, preview: true }
      }));

      var nameEl = document.getElementById('garage-paint-name');
      if (nameEl) nameEl.textContent = pick(curPaint.nameEn, curPaint.nameZh);

      var swatchesBox = document.getElementById('garage-paint-swatches');
      if (swatchesBox) {
        var existingBtns = swatchesBox.querySelectorAll('.garage-paint-swatch');
        if (swatchesBox.getAttribute('data-swatch-vehicle') !== draft || existingBtns.length !== list.length) {
          swatchesBox.setAttribute('data-swatch-vehicle', draft);
          swatchesBox.innerHTML = '';
          list.forEach(function (p) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'garage-paint-swatch';
            btn.setAttribute('data-choose-paint', p.id);
            btn.style.setProperty('--swatch-color', p.hex);
            var badge = document.createElement('i');
            badge.className = 'swatch-badge';
            badge.setAttribute('aria-hidden', 'true');
            btn.appendChild(badge);
            swatchesBox.appendChild(btn);
          });
          existingBtns = swatchesBox.querySelectorAll('.garage-paint-swatch');
        }
        for (var k = 0; k < list.length; k++) {
          var item = list[k];
          var swBtn = existingBtns[k];
          if (!swBtn) continue;
          var pName = pick(item.nameEn, item.nameZh);
          swBtn.style.setProperty('--swatch-color', item.hex);
          swBtn.setAttribute('aria-pressed', String(item.id === draftPaint));
          swBtn.setAttribute('data-owned', String(item.owned));
          swBtn.setAttribute('data-equipped', String(item.equipped));
          var bEl = swBtn.querySelector('.swatch-badge');
          if (bEl) {
            bEl.textContent = item.equipped ? '✓' : (!item.owned ? '🔒' : '');
          }
          var statusLabel = item.equipped
            ? pick('Equipped', '已装备')
            : item.owned
              ? pick('Owned · Click to equip', '已拥有 · 点击立即装备')
              : pick('Locked · ' + fmt(item.price) + ' PTS', '未解锁 · ' + fmt(item.price) + ' 积分');
          swBtn.title = pName + ' (' + statusLabel + ')';
          swBtn.setAttribute('aria-label', pName + ' ' + statusLabel);
        }
      }

      var actionBtn = document.getElementById('garage-paint-action');
      if (actionBtn) {
        var pState;
        var armKey = draft + ':' + curPaint.id;
        if (curPaint.equipped) {
          pState = 'equipped';
          actionBtn.textContent = pick('✔ Equipped', '✔ 已装备');
        } else if (curPaint.owned) {
          pState = 'equip';
          actionBtn.textContent = pick('Equip Paint', '装备涂装');
        } else if (!vehicleOwned) {
          pState = 'vehicle-locked';
          actionBtn.textContent = pick('🔒 Unlock Ride First (' + fmt(curPaint.price) + ' PTS)', '🔒 需先解锁座驾 (' + fmt(curPaint.price) + ' 积分)');
        } else if (points < curPaint.price) {
          pState = 'locked';
          actionBtn.textContent = pick('🔒 ' + fmt(curPaint.price) + ' PTS', '🔒 ' + fmt(curPaint.price) + ' 积分');
        } else if (paintArmed === armKey) {
          pState = 'armed';
          actionBtn.textContent = pick('Confirm -' + fmt(curPaint.price) + ' PTS', '确认 -' + fmt(curPaint.price) + ' 积分');
        } else {
          pState = 'unlock';
          actionBtn.textContent = pick('🔓 Unlock · ' + fmt(curPaint.price) + ' PTS', '🔓 解锁 · ' + fmt(curPaint.price) + ' 积分');
        }
        actionBtn.setAttribute('data-paint-state', pState);
        if (pState === 'equipped' || pState === 'locked' || pState === 'vehicle-locked') {
          actionBtn.setAttribute('aria-disabled', 'true');
        } else {
          actionBtn.removeAttribute('aria-disabled');
        }
      }
    }

    settings.subscribe(function (change) {
      if (change.sections.indexOf('vehicle') >= 0) updateHome();
      // 积分余额、载具拥有、涂装或最高纪录变化（含其它标签页同步）时刷新车库对应面板
      if (
        change.sections.indexOf('progress') >= 0 ||
        change.sections.indexOf('owned') >= 0 ||
        change.sections.indexOf('paint') >= 0 ||
        change.sections.indexOf('paintOwned') >= 0 ||
        change.sections.indexOf('upgrade') >= 0
      ) {
        paintWorkshop();
        paintUpgrades();
        paintUnlock();
      }
      if (change.sections.indexOf('records') >= 0) {
        paintRecords();
      }
    });

    window.addEventListener('horizon-lang-change', function () {
      updateHome();
      paintRecords();
      paintSpecs();
      paintWorkshop();
      paintUpgrades();
      paintUnlock();
    });

    window.addEventListener('game-home-restored', function () {
      close();
      updateHome();
      draft = selected;
      draftPaint = wallet ? wallet.selectedPaint(draft) : 'stock';
      paint();
    });
    window.addEventListener('pageshow', updateHome);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', updateHome);
    else updateHome();

    function paint() {
      var host = document.getElementById('garage-render');
      if (host) {
        host.setAttribute('data-vehicle', draft);
        if (wallet) host.setAttribute('data-preview-paint', wallet.selectedPaintHex(draft));
      }
      window.dispatchEvent(new Event('garage-vehicle-changed'));
      document.querySelectorAll('[data-garage-car]').forEach(function (e) {
        e.hidden = e.getAttribute('data-garage-car') !== draft;
      });
      document.querySelectorAll('[data-choose-vehicle]').forEach(function (e) {
        e.setAttribute('aria-pressed', String(e.getAttribute('data-choose-vehicle') === draft));
      });
      // 切换到其它载具时撤销未完成的解锁确认与旧提示
      if (armed !== draft) disarm();
      disarmPaint();
      disarmUpgrade();
      if (notice && notice.vehicle !== draft) notice = null;
      paintRecords();
      paintSpecs();
      paintWorkshop();
      paintUpgrades();
      paintUnlock();
    }

    /**
     * 撤销“再次点击确认解锁”状态
     */
    function disarm() {
      armed = null;
      if (armTimer) {
        clearTimeout(armTimer);
        armTimer = 0;
      }
    }

    /**
     * 进入“再次点击确认解锁”状态，超时后自动撤销
     */
    function arm(id) {
      disarm();
      armed = id;
      armTimer = setTimeout(function () {
        armTimer = 0;
        armed = null;
        paintUnlock();
      }, ARM_TIMEOUT);
    }

    /**
     * 刷新车库中与积分解锁相关的全部界面：
     * 顶部积分余额、载具列表锁标/价格、解锁进度条、提示文案与底部主按钮状态
     */
    function paintUnlock() {
      if (!wallet) return;
      var points = wallet.balance();
      var price = wallet.price(draft) || 0;
      var owned = wallet.isOwned(draft);

      // 1. 顶部积分余额
      var pointsEl = document.getElementById('garage-wallet-points');
      if (pointsEl) pointsEl.textContent = fmt(points);

      // 2. 载具列表：未解锁载具显示锁标与价格，余额足够时高亮为“可解锁”
      document.querySelectorAll('[data-choose-vehicle]').forEach(function (btn) {
        var id = btn.getAttribute('data-choose-vehicle');
        var p = wallet.price(id) || 0;
        var has = wallet.isOwned(id);
        var tag = btn.querySelector('.garage-option-tag');
        if (!tag) {
          tag = document.createElement('em');
          tag.className = 'garage-option-tag';
          btn.appendChild(tag);
        }
        btn.setAttribute('data-locked', has ? 'false' : 'true');
        if (has) {
          tag.textContent = id === selected ? pick('In Use', '使用中') : pick('Owned', '已拥有');
          tag.setAttribute('data-tag', id === selected ? 'current' : 'owned');
          btn.removeAttribute('title');
        } else {
          tag.textContent = (points >= p ? '🔓 ' : '🔒 ') + fmt(p);
          tag.setAttribute('data-tag', points >= p ? 'affordable' : 'locked');
          btn.title = pick('Locked · Requires ' + fmt(p) + ' PTS', '未解锁 · 需要 ' + fmt(p) + ' 积分');
        }
      });

      // 3. 解锁信息面板：价格、进度条与获取积分提示
      var panel = document.getElementById('garage-unlock');
      if (panel) {
        var label = document.getElementById('garage-unlock-label');
        var value = document.getElementById('garage-unlock-value');
        var bar = panel.querySelector('.garage-unlock-bar');
        var fill = bar && bar.querySelector('i');
        var tip = document.getElementById('garage-unlock-tip');
        panel.setAttribute('data-owned', owned ? 'true' : 'false');
        if (owned) {
          if (label) label.textContent = pick('Ride Status', '座驾状态');
          if (value) value.textContent = price === 0 ? pick('✔ Starter Ride · Owned', '✔ 初始座驾 · 已拥有') : pick('✔ Unlocked', '✔ 已解锁');
          if (bar) bar.hidden = true;
        } else {
          var ratio = price > 0 ? Math.min(1, points / price) : 1;
          if (label) label.textContent = pick('Unlock Price', '解锁价格');
          if (value) value.textContent = fmt(price) + pick(' PTS', ' 积分');
          if (bar) {
            bar.hidden = false;
            bar.setAttribute('aria-valuenow', String(Math.round(ratio * 100)));
            bar.setAttribute('aria-valuetext', fmt(points) + ' / ' + fmt(price) + pick(' PTS', ' 积分'));
          }
          if (fill) fill.style.width = (ratio * 100).toFixed(1) + '%';
        }
        if (tip) {
          var text = '';
          var kind = 'info';
          if (notice && notice.vehicle === draft) {
            text = pick(notice.en, notice.zh);
            kind = notice.kind;
          } else if (!owned && points < price) {
            text = pick(
              'Need ' + fmt(price - points) + ' more PTS · Near misses award 90×Combo PTS (max 450), takedowns +200, every 1 km +100',
              '还差 ' + fmt(price - points) + ' 积分 · 惊险超车可获得 90×连击 积分（单次封顶 450），撞飞慢车 +200，每跑 1 公里 +100'
            );
          } else if (!owned) {
            text = pick(
              'Enough points! Click the button below to unlock this ride',
              '积分充足，点击下方按钮即可解锁这辆座驾'
            );
          }
          if (text && wallet.storageMode() === 'memory') {
            text += pick(
              ' (Local storage is disabled in this browser; points & unlocks apply to this session only)',
              '（当前浏览器禁用了本地存储，积分与解锁仅在本次打开期间有效）'
            );
          }
          tip.textContent = text;
          tip.hidden = !text;
          tip.setAttribute('data-kind', kind);
        }
      }

      // 4. 底部主按钮：驾驶 / 解锁 / 再次确认 / 积分不足 四态
      var confirmBtn = document.querySelector('.garage-confirm');
      if (confirmBtn) {
        var state;
        if (owned) {
          state = 'drive';
          confirmBtn.textContent = pick('Drive This Ride', '驾驶这辆座驾');
        } else if (points < price) {
          state = 'locked';
          confirmBtn.textContent = pick('🔒 Insufficient PTS · Need ' + fmt(price - points), '🔒 积分不足 · 还差 ' + fmt(price - points));
        } else if (armed === draft) {
          state = 'armed';
          confirmBtn.textContent = pick('Click Again to Confirm (-' + fmt(price) + ' PTS)', '再次点击确认解锁（-' + fmt(price) + ' 积分）');
        } else {
          state = 'unlock';
          confirmBtn.textContent = pick('🔓 Unlock for ' + fmt(price) + ' PTS', '🔓 花费 ' + fmt(price) + ' 积分解锁');
        }
        confirmBtn.setAttribute('data-state', state);
        // 积分不足时使用 aria-disabled 而非 disabled，保证键盘 Tab 焦点循环不被打断
        if (state === 'locked') confirmBtn.setAttribute('aria-disabled', 'true');
        else confirmBtn.removeAttribute('aria-disabled');
      }
    }

    /**
     * 执行积分解锁，并展示解锁成功 / 失败反馈
     */
    function unlockDraft() {
      var id = draft;
      disarm();
      var result = wallet.purchase(id);
      if (result.ok && result.reason === 'purchased') {
        // 解锁新座驾时上报 CrazyGames happytime 高光时刻
        if (window.HorizonCrazyGames && typeof window.HorizonCrazyGames.happytime === 'function') {
          window.HorizonCrazyGames.happytime();
        }
        notice = {
          vehicle: id,
          kind: 'success',
          en: '🎉 Unlocked! Spent ' + fmt(result.price) + ' PTS · ' + fmt(result.points) + ' PTS remaining',
          zh: '🎉 解锁成功！已消耗 ' + fmt(result.price) + ' 积分，剩余 ' + fmt(result.points) + ' 积分'
        };
        var panelEl = document.querySelector('.garage-panel');
        if (panelEl) {
          panelEl.classList.remove('garage-just-unlocked');
          // 强制回流以便重复触发解锁庆祝动画
          void panelEl.offsetWidth;
          panelEl.classList.add('garage-just-unlocked');
          clearTimeout(celebrateTimer);
          celebrateTimer = setTimeout(function () {
            panelEl.classList.remove('garage-just-unlocked');
          }, 1400);
        }
      } else if (result.reason === 'insufficient') {
        notice = {
          vehicle: id,
          kind: 'error',
          en: 'Insufficient PTS · Need ' + fmt(result.shortfall) + ' more PTS',
          zh: '积分不足，还差 ' + fmt(result.shortfall) + ' 积分'
        };
      } else if (!result.ok) {
        notice = {
          vehicle: id,
          kind: 'error',
          en: 'Unlock failed. Please refresh the page and try again.',
          zh: '解锁失败，请刷新页面后重试'
        };
      }
      paintWorkshop();
      paintUnlock();
    }

    /**
     * 执行定制涂装积分解锁并自动装备
     */
    function unlockDraftPaint() {
      var id = draft;
      var pid = draftPaint;
      disarmPaint();
      var pDef = wallet.paintInfo(id, pid);
      var pTitleEn = pDef ? pDef.nameEn : pid;
      var pTitleZh = pDef ? pDef.nameZh : pid;
      var result = wallet.purchasePaint(id, pid);
      if (result.ok && result.reason === 'purchased') {
        if (window.HorizonCrazyGames && typeof window.HorizonCrazyGames.happytime === 'function') {
          window.HorizonCrazyGames.happytime();
        }
        notice = {
          vehicle: id,
          kind: 'success',
          en: '🎨 Livery "' + pTitleEn + '" Unlocked & Equipped! (-' + fmt(result.price) + ' PTS)',
          zh: '🎨 涂装「' + pTitleZh + '」解锁并装备成功！（-' + fmt(result.price) + ' 积分）'
        };
        var panelEl = document.querySelector('.garage-panel');
        if (panelEl) {
          panelEl.classList.remove('garage-just-unlocked');
          void panelEl.offsetWidth;
          panelEl.classList.add('garage-just-unlocked');
          clearTimeout(celebrateTimer);
          celebrateTimer = setTimeout(function () {
            panelEl.classList.remove('garage-just-unlocked');
          }, 1400);
        }
      } else if (result.reason === 'insufficient') {
        notice = {
          vehicle: id,
          kind: 'error',
          en: 'Insufficient PTS for livery · Need ' + fmt(result.shortfall) + ' more PTS',
          zh: '涂装解锁积分不足，还差 ' + fmt(result.shortfall) + ' 积分'
        };
      }
      paintWorkshop();
      paintUnlock();
    }

    /**
     * 打开 3D 车库弹窗
     * @param {HTMLElement|null} triggerBtn 触发车库的按钮引用（用于关闭后恢复焦点）
     * @param {boolean} isKeyboard 是否由键盘触发
     */
    function openGarage(triggerBtn, isKeyboard) {
      var overlay = document.querySelector('.garage-overlay');
      if (!overlay) return;
      document.body.appendChild(overlay);
      // 打开车库前先把驾驶中缓冲的积分落盘，确保余额显示为最新值
      if (wallet) wallet.flush();
      draft = selected;
      draftPaint = wallet ? wallet.selectedPaint(draft) : 'stock';
      disarm();
      disarmPaint();
      notice = null;
      paint();
      returnTo = triggerBtn || null;
      keyboardOpen = !!isKeyboard;
      overlay.hidden = false;
      // 打开车库时暂停底层 3D 驾驶与音频
      window.dispatchEvent(new CustomEvent('horizon-ad-state', { detail: true }));
      window.dispatchEvent(new Event('garage-opened'));
      var menu = document.getElementById('mode-screen');
      if (menu) {
        menu.inert = true;
        menu.setAttribute('aria-hidden', 'true');
      }
      if (keyboardOpen) {
        var closeBtn = overlay.querySelector('[data-garage-close]');
        if (closeBtn) closeBtn.focus({ preventScroll: true });
      }
    }

    window.addEventListener('horizon-open-garage', function () {
      openGarage(null, false);
    });

    /**
     * 关闭 3D 车库弹窗，并在未切换载具时自动恢复底层驾驶状态
     * @param {boolean} [switchingVehicle=false] 是否因确认切换新载具而关闭
     */
    function close(switchingVehicle) {
      var overlay = document.querySelector('.garage-overlay');
      var wasOpen = overlay && !overlay.hidden;
      disarm();
      disarmPaint();
      // 关闭时将展台预览涂装还原为已装备涂装，防止未购买涂装残留
      if (wallet) {
        draftPaint = wallet.selectedPaint(selected);
        var host = document.getElementById('garage-render');
        var eqHex = wallet.selectedPaintHex(selected);
        if (host) host.setAttribute('data-preview-paint', eqHex);
      }
      window.dispatchEvent(new Event('garage-closed'));
      if (overlay) overlay.hidden = true;
      var menu = document.getElementById('mode-screen');
      if (menu) {
        menu.inert = false;
        menu.removeAttribute('aria-hidden');
      }
      if (wasOpen && !switchingVehicle) {
        var settingsStillOpen = document.querySelector('.game-settings-overlay:not([hidden])');
        if (!settingsStillOpen) {
          window.dispatchEvent(new CustomEvent('horizon-ad-state', { detail: false }));
        }
      }
      if (keyboardOpen && returnTo) returnTo.focus({ preventScroll: true });
    }

    document.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('button');
      if (t && t.classList.contains('garage-preview')) {
        openGarage(t, e.detail === 0);
      } else if (t && t.hasAttribute('data-choose-vehicle')) {
        draft = t.getAttribute('data-choose-vehicle');
        draftPaint = wallet ? wallet.selectedPaint(draft) : 'stock';
        paint();
      } else if (t && t.hasAttribute('data-choose-paint')) {
        var pid = t.getAttribute('data-choose-paint');
        draftPaint = pid;
        disarmPaint();
        if (wallet && wallet.isPaintOwned(draft, pid)) {
          wallet.selectPaint(draft, pid);
        }
        paintWorkshop();
        paintUnlock();
      } else if (t && t.hasAttribute('data-upgrade-buy')) {
        var stat = t.getAttribute('data-upgrade-buy');
        var uState = t.getAttribute('data-upgrade-state');
        if (uState === 'locked' || uState === 'vehicle-locked') {
          t.classList.remove('garage-shake');
          void t.offsetWidth;
          t.classList.add('garage-shake');
          return;
        }
        if (uState === 'unlock') {
          armUpgrade(draft + ':' + stat);
          paintUpgrades();
          return;
        }
        if (uState === 'armed' && wallet) {
          disarmUpgrade();
          var uResult = wallet.purchaseUpgrade(draft, stat);
          if (uResult.ok && window.HorizonCrazyGames && typeof window.HorizonCrazyGames.happytime === 'function') {
            window.HorizonCrazyGames.happytime();
          }
          paintUpgrades();
          paintUnlock();
          return;
        }
      } else if (t && t.id === 'garage-paint-action') {
        var pState = t.getAttribute('data-paint-state');
        if (pState === 'locked' || pState === 'vehicle-locked') {
          t.classList.remove('garage-shake');
          void t.offsetWidth;
          t.classList.add('garage-shake');
          return;
        }
        if (pState === 'equip' && wallet) {
          wallet.selectPaint(draft, draftPaint);
          paintWorkshop();
          return;
        }
        if (pState === 'unlock') {
          armPaint(draft + ':' + draftPaint);
          paintWorkshop();
          return;
        }
        if (pState === 'armed') {
          unlockDraftPaint();
          return;
        }
      } else if (t && t.classList.contains('garage-confirm')) {
        var state = t.getAttribute('data-state');
        if (wallet && state === 'locked') {
          // 积分不足：抖动提示，不执行任何操作
          t.classList.remove('garage-shake');
          void t.offsetWidth;
          t.classList.add('garage-shake');
          return;
        }
        if (wallet && state === 'unlock') {
          arm(draft);
          paintUnlock();
          return;
        }
        if (wallet && state === 'armed') {
          unlockDraft();
          return;
        }
        // 防御：按钮状态与实际拥有状态不一致时（如其它标签页数据变化），仅刷新界面而不切换载具
        if (wallet && !wallet.isOwned(draft)) {
          paintUnlock();
          return;
        }
        settings.set('vehicle', draft);
        if (draft === 'jet') settings.set('display', { camera: 'third' });
        selected = vehicleChoice();
        root.setAttribute('data-vehicle', selected);
        updateHome();
        close(true);
        // 在游戏内确认座驾后，立即通知 3D 引擎热重载切换新座驾并直接开跑
        window.dispatchEvent(new CustomEvent('garage-vehicle-confirmed', { detail: { vehicle: selected } }));
      } else if ((t && t.hasAttribute('data-garage-close')) || e.target.classList.contains('garage-overlay')) {
        close(false);
      }
    });

    document.addEventListener('keydown', function (e) {
      var overlay = document.querySelector('.garage-overlay');
      if (!overlay || overlay.hidden) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        close(false);
      }
      if (e.key === 'Tab') {
        var items = overlay.querySelectorAll('button');
        var first = items[0];
        var last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus({ preventScroll: true });
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus({ preventScroll: true });
        }
      }
    }, true);
  })(true);

  // ==================== [模块 4] CrazyGames 直进启动、合规防护与 SDK 生命周期桥接 ====================
  (function installLaunchDispatcher() {
    // 默认直接设置为 normal 游戏模式，跳过外部静态大厅直接进入 3D 驾驶
    if (!document.documentElement.getAttribute('data-game-mode')) {
      document.documentElement.setAttribute('data-game-mode', 'normal');
    }

    window.addEventListener('error', function (e) {
      if (e.target && e.target.tagName !== 'SCRIPT' && e.target !== window) return;
      if (e.target && e.target.getAttribute && e.target.getAttribute('data-optional-sdk') === 'true') return;
      if (e.target && e.target.src && /crazygames-sdk/i.test(e.target.src)) return;
      var p = document.getElementById('boot-message');
      var b = document.getElementById('boot-screen');
      if (p) {
        p.setAttribute('data-i18n', 'boot.failed');
        p.textContent = window.HorizonI18n ? window.HorizonI18n.t('boot.failed') : 'Engine failed to load. Please refresh the page to retry.';
      }
      if (b) b.setAttribute('data-failed', 'true');
    }, true);

    // CrazyGames 平台合规要求：禁止右键菜单干扰游戏操作、拦截方向键与空格键触发外部容器滚动
    window.addEventListener('contextmenu', function (e) {
      if (e.target && e.target.closest && e.target.closest('input,textarea')) return;
      e.preventDefault();
    });
    window.addEventListener('keydown', function (e) {
      if (e.target && e.target.closest && e.target.closest('input,textarea,select,[contenteditable="true"]')) return;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].indexOf(e.key) >= 0) {
        e.preventDefault();
      }
    }, { passive: false });

    // ==================== CrazyGames SDK v3 生产级合规适配器 ====================
    // 1. 严格遵循 await CrazyGames.SDK.init() 时序守卫，绝不在 init 完成前访问 .game 或 .user；
    // 2. 完整实现平台级强制静音（SDK.game.settings.muteAudio + addSettingsChangeListener + ?muteAudio=true）；
    // 3. 自动读取 SDK.user.systemInfo 对齐初始语言（未支持语种一律安全回退 'en'）；
    // 4. 完整支持 loadingStart/Stop、幂等 gameplayStart/Stop、防抖 happytime 与带音频挂起的 requestAd。
    var sdkInitialized = false;
    var sdkInitializing = false;
    var cgGameplayActive = false;
    var desiredGameplayActive = false;
    var pendingLoadingState = null; // 'start' | 'stop' | null
    var lastHappyTimeAt = 0;

    // 解析 URL 参数中的 ?muteAudio=true|1，方便本地与 QA 自动化静音测试
    var urlForceMuted = false;
    try {
      var searchParams = new URLSearchParams(window.location.search || '');
      var muteParam = (searchParams.get('muteAudio') || '').toLowerCase();
      urlForceMuted = muteParam === 'true' || muteParam === '1';
    } catch (_) {}

    var sdkSettingMuted = false;
    var adPlayingMuted = false;

    /**
     * 计算并同步当前全局是否处于平台强制静音或广告静音状态
     */
    function syncEffectiveMuteState() {
      var effectiveMuted = !!(urlForceMuted || sdkSettingMuted || adPlayingMuted);
      document.documentElement.setAttribute('data-platform-mute', effectiveMuted ? 'true' : 'false');
      window.dispatchEvent(new CustomEvent('horizon-mute-change', { detail: { muted: effectiveMuted } }));
      return effectiveMuted;
    }
    syncEffectiveMuteState();

    function getCrazySDK() {
      try {
        return window.CrazyGames && window.CrazyGames.SDK ? window.CrazyGames.SDK : null;
      } catch (_) {
        return null;
      }
    }

    /**
     * 在 SDK.init() 完成后读取 SDK.game.settings.muteAudio 并注册实时监听器
     */
    function bindPlatformAudioSettings() {
      if (!sdkInitialized) return;
      var sdk = getCrazySDK();
      if (!sdk || !sdk.game) return;
      try {
        if (sdk.game.settings && typeof sdk.game.settings.muteAudio === 'boolean') {
          sdkSettingMuted = sdk.game.settings.muteAudio;
          syncEffectiveMuteState();
        }
      } catch (_) {}
      try {
        if (typeof sdk.game.addSettingsChangeListener === 'function') {
          sdk.game.addSettingsChangeListener(function (updatedSettings) {
            if (updatedSettings && typeof updatedSettings.muteAudio === 'boolean') {
              sdkSettingMuted = updatedSettings.muteAudio;
              syncEffectiveMuteState();
            }
          });
        }
      } catch (_) {}
    }

    /**
     * 在 SDK.init() 完成后读取 SDK.user.systemInfo 自动对齐初始语言
     */
    function syncPlatformLocale() {
      if (!sdkInitialized) return;
      var sdk = getCrazySDK();
      if (!sdk || !sdk.user) return;
      try {
        var sysInfo = sdk.user.systemInfo;
        if (sysInfo && window.HorizonI18n && typeof window.HorizonI18n.applyPlatformSystemLocale === 'function') {
          var rawLocale = sysInfo.locale || sysInfo.language || '';
          var countryCode = sysInfo.countryCode || '';
          window.HorizonI18n.applyPlatformSystemLocale(rawLocale, countryCode);
        }
      } catch (_) {}
    }

    /**
     * 初始化 CrazyGames SDK v3 并在 resolve 后重放挂起的生命周期事件
     */
    function initCrazySDK() {
      if (sdkInitialized || sdkInitializing) return;
      var sdk = getCrazySDK();
      if (!sdk || typeof sdk.init !== 'function') return;
      sdkInitializing = true;
      try {
        Promise.resolve(window.CrazyGames.SDK.init()).then(function () {
          sdkInitialized = true;
          sdkInitializing = false;
          window.__HD_CG_SDK_READY__ = true;
          if (window.HorizonDriveSettings && typeof window.HorizonDriveSettings.syncCloudData === 'function') {
            try { window.HorizonDriveSettings.syncCloudData(); } catch (_) {}
          }
          bindPlatformAudioSettings();
          syncPlatformLocale();

          var activeSdk = getCrazySDK();
          if (!activeSdk || !activeSdk.game) return;
          if (pendingLoadingState === 'start') {
            try { activeSdk.game.loadingStart(); } catch (_) {}
          } else if (pendingLoadingState === 'stop') {
            try {
              activeSdk.game.loadingStart();
              activeSdk.game.loadingStop();
            } catch (_) {}
          }
          pendingLoadingState = null;

          if (desiredGameplayActive && !cgGameplayActive) {
            cgGameplayActive = true;
            try { activeSdk.game.gameplayStart(); } catch (_) {}
          }
        }).catch(function () {
          sdkInitializing = false;
        });
      } catch (_) {
        sdkInitializing = false;
      }
    }

    window.HorizonCrazyGames = {
      init: initCrazySDK,
      isMuted: function () {
        return !!(urlForceMuted || sdkSettingMuted || adPlayingMuted);
      },
      loadingStart: function () {
        initCrazySDK();
        if (!sdkInitialized) {
          pendingLoadingState = 'start';
          return;
        }
        var sdk = getCrazySDK();
        if (sdk && sdk.game && typeof sdk.game.loadingStart === 'function') {
          try { sdk.game.loadingStart(); } catch (_) {}
        }
      },
      loadingStop: function () {
        initCrazySDK();
        if (!sdkInitialized) {
          pendingLoadingState = 'stop';
          return;
        }
        var sdk = getCrazySDK();
        if (sdk && sdk.game && typeof sdk.game.loadingStop === 'function') {
          try { sdk.game.loadingStop(); } catch (_) {}
        }
      },
      gameplayStart: function () {
        desiredGameplayActive = true;
        initCrazySDK();
        if (!sdkInitialized || cgGameplayActive) return;
        cgGameplayActive = true;
        var sdk = getCrazySDK();
        if (sdk && sdk.game && typeof sdk.game.gameplayStart === 'function') {
          try { sdk.game.gameplayStart(); } catch (_) {}
        }
      },
      gameplayStop: function () {
        desiredGameplayActive = false;
        if (!sdkInitialized || !cgGameplayActive) return;
        cgGameplayActive = false;
        var sdk = getCrazySDK();
        if (sdk && sdk.game && typeof sdk.game.gameplayStop === 'function') {
          try { sdk.game.gameplayStop(); } catch (_) {}
        }
      },
      happytime: function () {
        var now = Date.now();
        if (now - lastHappyTimeAt < 3000) return;
        lastHappyTimeAt = now;
        initCrazySDK();
        if (!sdkInitialized) return;
        var sdk = getCrazySDK();
        if (sdk && sdk.game && typeof sdk.game.happytime === 'function') {
          try { sdk.game.happytime(); } catch (_) {}
        }
      },
      requestAd: function (adType, callbacks) {
        var type = adType === 'rewarded' ? 'rewarded' : 'midgame';
        var cb = callbacks || {};
        initCrazySDK();
        var sdk = getCrazySDK();
        if (!sdkInitialized || !sdk || !sdk.ad || typeof sdk.ad.requestAd !== 'function') {
          if (typeof cb.adFinished === 'function') cb.adFinished();
          return;
        }
        try {
          sdk.ad.requestAd(type, {
            adStarted: function () {
              adPlayingMuted = true;
              syncEffectiveMuteState();
              window.dispatchEvent(new CustomEvent('horizon-ad-state', { detail: true }));
              if (typeof cb.adStarted === 'function') cb.adStarted();
            },
            adFinished: function () {
              adPlayingMuted = false;
              syncEffectiveMuteState();
              var modalOpen = document.querySelector('.garage-overlay:not([hidden]), .game-settings-overlay:not([hidden])');
              if (!modalOpen) {
                window.dispatchEvent(new CustomEvent('horizon-ad-state', { detail: false }));
              }
              if (typeof cb.adFinished === 'function') cb.adFinished();
            },
            adError: function (error) {
              adPlayingMuted = false;
              syncEffectiveMuteState();
              var modalOpen = document.querySelector('.garage-overlay:not([hidden]), .game-settings-overlay:not([hidden])');
              if (!modalOpen) {
                window.dispatchEvent(new CustomEvent('horizon-ad-state', { detail: false }));
              }
              if (typeof cb.adError === 'function') cb.adError(error);
            }
          });
        } catch (err) {
          adPlayingMuted = false;
          syncEffectiveMuteState();
          if (typeof cb.adError === 'function') cb.adError(err);
        }
      }
    };

    // 启动时尝试初始化 SDK；若 async 脚本稍后加载完成，在 load 事件中再次触发初始化
    initCrazySDK();
    window.addEventListener('load', initCrazySDK);
    var sdkScriptEl = document.querySelector('script[src*="crazygames-sdk"]');
    if (sdkScriptEl) {
      sdkScriptEl.addEventListener('load', initCrazySDK);
    }

    document.addEventListener('click', function (e) {
      var t = e.target;
      while (t && t !== document) {
        if (t.getAttribute && t.getAttribute('data-mode-selection')) break;
        t = t.parentNode;
      }
      if (!t || t === document || document.documentElement.getAttribute('data-game-mode')) return;
      var m = t.getAttribute('data-mode-selection');
      if (m !== 'normal' && m !== 'simulation') return;
      document.documentElement.setAttribute('data-game-mode', 'normal');
      var p = document.getElementById('boot-message');
      if (p) {
        p.setAttribute('data-i18n', 'boot.loading');
        p.textContent = window.HorizonI18n ? window.HorizonI18n.t('boot.loading') : 'Building 3D highway & vehicle physics engine…';
      }
      window.dispatchEvent(new Event('game-mode-selected'));
    });
  })();

  // ==================== [模块 5] 交互式新手教学引导控制器 (HorizonTutorial) ====================
  (function installTutorialController() {
    if (window.HorizonTutorial) return;

    var settings = window.HorizonDriveSettings;
    var wallet = window.HorizonDriveWallet;
    var i18n = window.HorizonI18n;
    var root = document.documentElement;

    // 首次完成全部 6 步驾驶训练发放的车库启动基金（PTS）
    var GRADUATION_REWARD_PTS = 1000;
    // 单步达成 100% 后自动切入下一步的停顿时长（秒），让玩家看清绿条满格反馈
    var STEP_COMPLETE_HOLD_SEC = 0.65;
    // 单步最大停留超时时长（秒）：超过 45 秒未完成时自动推进，遵循 CrazyGames Onboarding 防卡死规范
    var STEP_TIMEOUT_SEC = 45;

    /**
     * 6 步渐进式实操训练定义
     * 每一步包含：唯一 id、图标、目标控件选择器数组、中英文标题与双端（PC 键鼠 / 移动触屏）自适应富文本说明
     */
    var STEPS = [
      {
        id: 'launch',
        icon: '🚀',
        targets: ['.pedal.throttle'],
        title: function (zh) {
          return zh ? '全油门起步加速' : 'Full-Throttle Launch';
        },
        desc: function (zh, isDesktop) {
          if (zh) {
            return isDesktop
              ? '按住键盘 <kbd>W</kbd> 或 <kbd>↑</kbd> 键（也可按住右下角<strong>油门踏板</strong>），将车速提升至 <strong>80 km/h</strong>。'
              : '按住右下角高亮的<strong>油门踏板</strong>不放，全力加速将车速提升至 <strong>80 km/h</strong>。';
          }
          return isDesktop
            ? 'Hold <kbd>W</kbd> or <kbd>↑</kbd> (or press the bottom-right <strong>Throttle Pedal</strong>) to reach <strong>80 km/h</strong>.'
            : 'Press and hold the highlighted <strong>Throttle Pedal</strong> on the bottom-right to accelerate to <strong>80 km/h</strong>.';
        }
      },
      {
        id: 'steer',
        icon: '🎯',
        targets: ['.turn-buttons', '.steering-control'],
        title: function (zh) {
          return zh ? '灵巧变道与转向操控' : 'Agile Lane-Change Steering';
        },
        desc: function (zh, isDesktop, isWheel) {
          if (zh) {
            if (isDesktop) {
              return '按 <kbd>A</kbd> <kbd>D</kbd> 或 <kbd>←</kbd> <kbd>→</kbd> 方向键左右变道，在高速车流中灵活穿梭。';
            }
            return isWheel
              ? '左右滑动左下角高亮的<strong>虚拟方向盘</strong>，控制赛车平滑变道穿梭。'
              : '点击或按住左下角高亮的<strong>左 / 右转向键</strong>，控制赛车灵活变道。';
          }
          if (isDesktop) {
            return 'Press <kbd>A</kbd> <kbd>D</kbd> or <kbd>←</kbd> <kbd>→</kbd> to weave left and right across highway lanes.';
          }
          return isWheel
            ? 'Drag the highlighted <strong>Steering Wheel</strong> on the bottom-left to change lanes smoothly.'
            : 'Tap or hold the highlighted <strong>Left / Right Turn Buttons</strong> on the bottom-left to steer.';
        }
      },
      {
        id: 'nos',
        icon: '⚡',
        targets: ['.nos-boost-button'],
        title: function (zh) {
          return zh ? 'NOS 氮气超载推进' : 'NOS Overdrive Boost';
        },
        desc: function (zh, isDesktop) {
          if (zh) {
            return isDesktop
              ? '已为你补满氮气！按住 <kbd>Shift</kbd> 或 <kbd>N</kbd> 键（或点击右下角 <strong>NOS 按钮</strong>）释放蓝焰极速推进！'
              : '已为你补满氮气！点击或按住右下角闪烁的 <strong>NOS 氮气按钮</strong>，释放极速推进！';
          }
          return isDesktop
            ? 'NOS tank refilled! Hold <kbd>Shift</kbd> or <kbd>N</kbd> (or press the <strong>NOS Button</strong>) to unleash nitro boost!'
            : 'NOS tank refilled! Tap or hold the glowing <strong>NOS Boost Button</strong> on the bottom-right for maximum speed!';
        }
      },
      {
        id: 'overtake',
        icon: '📢',
        targets: ['.high-beam-button', '.horn-button', '.horizon-score-badge'],
        title: function (zh) {
          return zh ? '声光催促与惊险超车' : 'Flash, Horn & Near-Miss Overtake';
        },
        desc: function (zh, isDesktop) {
          if (zh) {
            return isDesktop
              ? '连按 <kbd>V</kbd> 闪远光灯、按 <kbd>空格</kbd> / <kbd>H</kbd> 鸣笛催促慢车让道，或高速贴近超车赢取连击积分与氮气！'
              : '连续点击左侧<strong>远光灯</strong>闪烁或按<strong>喇叭按钮</strong>催促前车变道，或高速贴近超越慢车赢取连击积分！';
          }
          return isDesktop
            ? 'Rapidly press <kbd>V</kbd> to flash high-beams, <kbd>Space</kbd> / <kbd>H</kbd> to honk at slow traffic, or pull a fast overtake!'
            : 'Rapidly tap the <strong>High-Beam</strong> button to flash or tap <strong>Horn</strong> to clear slow cars, or overtake traffic to score points!';
        }
      },
      {
        id: 'takedown',
        icon: '💥',
        targets: ['.turn-buttons', '.steering-control', '.horizon-score-badge'],
        title: function (zh) {
          return zh ? '侧撞霸气弹飞慢车' : 'Side-Swipe Traffic Takedown';
        },
        desc: function (zh, isDesktop, isWheel) {
          if (zh) {
            if (isDesktop) {
              return '与前方慢车并排时猛按 <kbd>A</kbd> <kbd>D</kbd> 或 <kbd>←</kbd> <kbd>→</kbd> <strong>用车身侧面擦撞慢车</strong>（训练期间已开启无损护盾），将其直接<strong>撞飞上天</strong>赢取 <strong>+200 积分</strong>！';
            }
            return isWheel
              ? '与慢车并排时猛打<strong>虚拟方向盘</strong>用车身侧面擦撞慢车（训练期间开启无损护盾），将其<strong>撞飞上天</strong>赢取 <strong>+200 积分</strong>！'
              : '与慢车并排时猛按<strong>左 / 右转向键</strong>用车身侧面擦撞慢车（训练期间开启无损护盾），将其<strong>撞飞上天</strong>赢取 <strong>+200 积分</strong>！';
          }
          if (isDesktop) {
            return 'Pull alongside a slow car and steer hard with <kbd>A</kbd> <kbd>D</kbd> or <kbd>←</kbd> <kbd>→</kbd> to <strong>side-swipe & launch it flying</strong> (shield active) for <strong>+200 PTS</strong>!';
          }
          return 'Pull alongside a slow car and steer hard into its side to <strong>launch it flying</strong> (shield active) for <strong>+200 PTS</strong>!';
        }
      },
      {
        id: 'garage',
        icon: '🏆',
        targets: ['.camera-toggle', '.hud-garage-btn'],
        title: function (zh) {
          return zh ? '视角切换与 3D 车库解锁' : 'Camera View & 3D Garage Unlocks';
        },
        desc: function (zh, isDesktop) {
          var rewarded = settings && settings.get && settings.get('tutorial') && settings.get('tutorial').rewarded;
          var bonusZh = rewarded ? '' : '（完成即可领取 <strong>+1,000 PTS</strong> 启动基金）';
          var bonusEn = rewarded ? '' : ' (Complete to claim <strong>+1,000 PTS</strong> starter bonus!)';
          if (zh) {
            return isDesktop
              ? '按 <kbd>C</kbd> 切换第一/第三人称视角，或按 <kbd>G</kbd> / 点击右上角 <strong>🚗 换车</strong> 用积分兑换传奇跑车！' + bonusZh
              : '点击左上角<strong>切换视角</strong>，或点击右上角 <strong>🚗 换车</strong> 用超车积分兑换传奇跑车！' + bonusZh;
          }
          return isDesktop
            ? 'Press <kbd>C</kbd> to toggle 1st/3rd-person camera, or press <kbd>G</kbd> / click <strong>🚗 Garage</strong> on the top-right to unlock iconic vehicles!' + bonusEn
            : 'Tap the top-left <strong>Camera Toggle</strong>, or tap <strong>🚗 Garage</strong> on the top-right to unlock iconic vehicles!' + bonusEn;
        }
      }
    ];

    // 运行时状态机变量
    var active = false;
    var stepIndex = 0;
    var stepProgress = 0;
    var stepDoneHold = 0;
    var stepElapsed = 0;
    var lastFrameTime = 0;

    // 各步骤内部累积指标
    var steerAccum = 0;
    var nosAccum = 0;
    var overtakeSignalProgress = 0;
    var basePassed = 0;
    var baseTossed = 0;
    var baseScore = 0;
    var baseCamera = 'first';
    var hornTriggeredInStep = false;
    var garageOpenedInStep = false;

    // 键盘实时按压状态表（辅助物理遥测实现丝滑检测）
    var pressedKeys = {
      throttle: false,
      steerLeft: false,
      steerRight: false,
      nos: false,
      flash: false,
      horn: false
    };

    // DOM 节点引用
    var cardEl = null;
    var badgeEl = null;
    var dotsEl = null;
    var skipBtnEl = null;
    var iconEl = null;
    var titleEl = null;
    var descEl = null;
    var progressFillEl = null;
    var progressLabelEl = null;
    var nextBtnEl = null;
    var toastEl = null;
    var toastTimer = 0;

    /**
     * 判断当前是否为简体中文环境
     */
    function isZh() {
      return i18n && typeof i18n.lang === 'function' ? i18n.lang() === 'zh' : false;
    }

    /**
     * 判断当前是否为桌面端键鼠环境
     */
    function isDesktopMode() {
      return root.getAttribute('data-desktop') === 'true';
    }

    /**
     * 判断当前触屏操控模式是否为虚拟方向盘
     */
    function isWheelMode() {
      return root.getAttribute('data-controls') === 'wheel';
    }

    /**
     * 获取 drive.js 注入的实时遥测桥接对象
     */
    function getTelemetry() {
      return window.__HD_TELEMETRY__ || null;
    }

    /**
     * 判断当前是否处于纯正的 3D 驾驶运行态（无模态弹窗遮挡、非暂停、非结算页）
     */
    function isDrivingRunning() {
      var mainEl = document.querySelector('main');
      if (!mainEl || mainEl.getAttribute('data-mode') !== 'running') return false;
      var garageOverlay = document.querySelector('.garage-overlay');
      if (garageOverlay && !garageOverlay.hidden) {
        // 如果玩家正在第 5 步且主动打开了 3D 车库，记录已完成车库探索
        if (active && STEPS[stepIndex] && STEPS[stepIndex].id === 'garage') {
          garageOpenedInStep = true;
        }
        return false;
      }
      var settingsOverlay = document.querySelector('.game-settings-overlay');
      if (settingsOverlay && !settingsOverlay.hidden) return false;
      var editorOverlay = document.querySelector('.control-editor-overlay');
      if (editorOverlay) return false;
      return true;
    }

    /**
     * 创建或获取新手引导 HUD 战术卡片 DOM
     */
    function ensureCardDOM() {
      if (cardEl && cardEl.parentNode) return cardEl;
      cardEl = document.createElement('aside');
      cardEl.className = 'horizon-tutorial-card';
      cardEl.setAttribute('role', 'region');
      cardEl.setAttribute('aria-live', 'polite');
      cardEl.hidden = true;

      cardEl.innerHTML = [
        '<div class="tutorial-card-header">',
        '  <div class="tutorial-header-left">',
        '    <span class="tutorial-academy-pill">ACADEMY</span>',
        '    <span class="tutorial-step-badge"></span>',
        '  </div>',
        '  <div class="tutorial-header-right">',
        '    <div class="tutorial-step-dots" aria-hidden="true"></div>',
        '    <button type="button" class="tutorial-skip-btn"></button>',
        '  </div>',
        '</div>',
        '<div class="tutorial-card-body">',
        '  <div class="tutorial-step-icon" aria-hidden="true"></div>',
        '  <div class="tutorial-step-copy">',
        '    <h3 class="tutorial-step-title"></h3>',
        '    <p class="tutorial-step-desc"></p>',
        '  </div>',
        '</div>',
        '<div class="tutorial-card-footer">',
        '  <div class="tutorial-progress-wrap">',
        '    <div class="tutorial-progress-track">',
        '      <div class="tutorial-progress-fill"></div>',
        '    </div>',
        '    <span class="tutorial-progress-label">0%</span>',
        '  </div>',
        '  <div class="tutorial-action-group">',
        '    <button type="button" class="tutorial-next-btn"></button>',
        '  </div>',
        '</div>'
      ].join('');

      badgeEl = cardEl.querySelector('.tutorial-step-badge');
      dotsEl = cardEl.querySelector('.tutorial-step-dots');
      skipBtnEl = cardEl.querySelector('.tutorial-skip-btn');
      iconEl = cardEl.querySelector('.tutorial-step-icon');
      titleEl = cardEl.querySelector('.tutorial-step-title');
      descEl = cardEl.querySelector('.tutorial-step-desc');
      progressFillEl = cardEl.querySelector('.tutorial-progress-fill');
      progressLabelEl = cardEl.querySelector('.tutorial-progress-label');
      nextBtnEl = cardEl.querySelector('.tutorial-next-btn');

      // 绑定卡片内部按钮事件（阻止冒泡以免误触底层驾驶区）
      skipBtnEl.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        skipTutorial();
      });

      nextBtnEl.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        advanceOrCompleteStep(true);
      });

      document.body.appendChild(cardEl);
      return cardEl;
    }

    /**
     * 清理所有目标控件上的脉冲高亮类名与根元素属性
     */
    function clearTargetHighlights() {
      root.removeAttribute('data-tutorial-step');
      var highlighted = document.querySelectorAll('.tutorial-target-pulse');
      for (var i = 0; i < highlighted.length; i++) {
        highlighted[i].classList.remove('tutorial-target-pulse');
      }
    }

    /**
     * 为当前步骤对应的目标控件同步添加脉冲高亮类名与根属性（仅高亮当前视口内可见的控件）
     */
    function syncTargetHighlights() {
      if (!active || !isDrivingRunning()) {
        clearTargetHighlights();
        return;
      }
      var step = STEPS[stepIndex];
      if (!step) {
        clearTargetHighlights();
        return;
      }
      if (root.getAttribute('data-tutorial-step') !== step.id) {
        root.setAttribute('data-tutorial-step', step.id);
      }
      // 先筛选当前选择器列表中处于可见状态的 DOM 节点（排除桌面端已 display:none 的按钮）
      var wanted = [];
      for (var i = 0; i < step.targets.length; i++) {
        var nodes = document.querySelectorAll(step.targets[i]);
        for (var j = 0; j < nodes.length; j++) {
          if (nodes[j].getClientRects && nodes[j].getClientRects().length > 0) {
            wanted.push(nodes[j]);
          }
        }
      }
      var existing = document.querySelectorAll('.tutorial-target-pulse');
      for (var k = 0; k < existing.length; k++) {
        if (wanted.indexOf(existing[k]) === -1) {
          existing[k].classList.remove('tutorial-target-pulse');
        }
      }
      for (var m = 0; m < wanted.length; m++) {
        if (!wanted[m].classList.contains('tutorial-target-pulse')) {
          wanted[m].classList.add('tutorial-target-pulse');
        }
      }
    }

    /**
     * 重置并初始化指定步骤的基准遥测数据
     */
    function enterStep(idx) {
      stepIndex = Math.max(0, Math.min(STEPS.length - 1, idx));
      stepProgress = 0;
      stepDoneHold = 0;
      stepElapsed = 0;
      steerAccum = 0;
      nosAccum = 0;
      overtakeSignalProgress = 0;
      hornTriggeredInStep = false;
      garageOpenedInStep = false;

      var tel = getTelemetry();
      var st = tel && tel.state ? tel.state : null;
      basePassed = st && typeof st.passed === 'number' ? st.passed : 0;
      baseTossed = st && typeof st.tossed === 'number' ? st.tossed : 0;
      baseScore = st && typeof st.score === 'number' ? st.score : 0;
      baseCamera = settings && settings.get && settings.get('display')
        ? settings.get('display').camera
        : (root.getAttribute('data-camera') || 'first');

      var step = STEPS[stepIndex];
      // 进入第 3 步（NOS 氮气推进）时，若当前氮气量不足 60%，自动为玩家补满氮气罐，确保零门槛体验
      if (step && step.id === 'nos' && tel && typeof tel.refillNos === 'function') {
        if (!st || typeof st.nosEnergy !== 'number' || st.nosEnergy < 60) {
          try { tel.refillNos(); } catch (_) {}
        }
      }

      if (cardEl) {
        cardEl.classList.remove('is-step-complete');
      }
      renderCardStaticContent();
      renderProgressUI(0);
      syncTargetHighlights();
    }

    /**
     * 渲染卡片上的静态文案、步骤圆点、键鼠/触控自适应描述与按钮文案
     */
    function renderCardStaticContent() {
      ensureCardDOM();
      var step = STEPS[stepIndex];
      if (!step) return;

      var zh = isZh();
      var desktop = isDesktopMode();
      var wheel = isWheelMode();
      var total = STEPS.length;
      var currentNum = stepIndex + 1;

      cardEl.setAttribute('aria-label', zh ? '新手驾驶教学引导' : 'Driving Academy Tutorial');
      var pillEl = cardEl.querySelector('.tutorial-academy-pill');
      if (pillEl) {
        pillEl.textContent = zh ? '驾驶学院' : 'ACADEMY';
      }
      badgeEl.textContent = zh
        ? ('步骤 ' + currentNum + ' / ' + total)
        : ('STEP ' + currentNum + ' / ' + total);

      // 渲染 5 步进度圆点
      var dotsHtml = '';
      for (var i = 0; i < total; i++) {
        var cls = 'tutorial-dot';
        if (i < stepIndex) cls += ' is-done';
        else if (i === stepIndex) cls += ' is-current';
        dotsHtml += '<span class="' + cls + '"></span>';
      }
      dotsEl.innerHTML = dotsHtml;

      skipBtnEl.textContent = zh ? '跳过 ✕' : 'Skip ✕';
      skipBtnEl.setAttribute('title', zh ? '跳过新手引导 (可随时按 T 键或在设置中重播)' : 'Skip tutorial (Press T or open Settings anytime to replay)');

      iconEl.textContent = step.icon;
      titleEl.textContent = step.title(zh);
      descEl.innerHTML = step.desc(zh, desktop, wheel);

      var isLast = stepIndex === total - 1;
      var rewarded = settings && settings.get && settings.get('tutorial') && settings.get('tutorial').rewarded;
      if (isLast) {
        nextBtnEl.className = 'tutorial-next-btn is-primary-claim';
        if (!rewarded) {
          nextBtnEl.textContent = zh ? '🎁 领取 +1,000 积分完成' : '🎁 Claim +1,000 PTS';
        } else {
          nextBtnEl.textContent = zh ? '✓ 完成教学引导' : '✓ Finish Tutorial';
        }
      } else {
        nextBtnEl.className = 'tutorial-next-btn';
        nextBtnEl.textContent = zh ? '下一步 →' : 'Next →';
      }
    }

    /**
     * 更新进度条宽度与进度数值标签
     */
    function renderProgressUI(progressVal) {
      if (!cardEl) return;
      var clamped = Math.max(0, Math.min(1, progressVal));
      var pct = Math.round(clamped * 100);
      progressFillEl.style.width = pct + '%';

      var zh = isZh();
      var step = STEPS[stepIndex];
      var tel = getTelemetry();
      var st = tel && tel.state ? tel.state : null;

      if (clamped >= 0.999) {
        if (step && step.id === 'takedown') {
          progressLabelEl.textContent = zh ? '💥 已撞飞！' : '💥 Smashed!';
        } else {
          progressLabelEl.textContent = zh ? '✓ 已达成！' : '✓ Completed!';
        }
        return;
      }

      if (step && step.id === 'launch') {
        var spd = st && typeof st.speed === 'number' ? Math.max(0, Math.min(80, Math.round(st.speed))) : Math.round(clamped * 80);
        progressLabelEl.textContent = spd + ' / 80 km/h';
      } else if (step && step.id === 'takedown') {
        progressLabelEl.textContent = zh ? '0 / 1 辆' : '0 / 1 Car';
      } else {
        progressLabelEl.textContent = pct + '%';
      }
    }

    /**
     * 展示毕业奖励或教学完成横幅提示
     */
    function showGraduationToast(rewardedNow) {
      if (!toastEl) {
        toastEl = document.createElement('div');
        toastEl.className = 'horizon-tutorial-toast';
        toastEl.setAttribute('role', 'status');
        toastEl.setAttribute('aria-live', 'polite');
        document.body.appendChild(toastEl);
      }
      var zh = isZh();
      if (rewardedNow) {
        toastEl.innerHTML = [
          '<div class="tutorial-toast-icon">🏆</div>',
          '<div class="tutorial-toast-content">',
          '  <div class="tutorial-toast-title">' + (zh ? '驾驶学院毕业！已发放车库启动基金' : 'Driving Academy Graduated! Starter Bonus Unlocked') + '</div>',
          '  <div class="tutorial-toast-sub">' + (zh ? '打开车库（桌面端按 G）就能用这 1,000 积分兑换第一款涂装' : 'Open the Garage (press G on desktop) — 1,000 PTS buys your first livery') + '</div>',
          '</div>',
          '<div class="tutorial-toast-reward">+1,000 PTS</div>'
        ].join('');
      } else {
        toastEl.innerHTML = [
          '<div class="tutorial-toast-icon">🏁</div>',
          '<div class="tutorial-toast-content">',
          '  <div class="tutorial-toast-title">' + (zh ? '驾驶教学重温完成！祝你狂飙愉快' : 'Driving Academy Completed! Enjoy the Overdrive') + '</div>',
          '  <div class="tutorial-toast-sub">' + (zh ? '随时可按 T 键或点击顶栏「📖 引导」再次查看' : 'Press T or click "📖 Guide" on the top bar anytime to replay') + '</div>',
          '</div>'
        ].join('');
      }

      toastEl.hidden = false;
      // 触发重绘以启动入场动画
      void toastEl.offsetWidth;
      toastEl.classList.add('is-visible');

      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(function () {
        if (toastEl) {
          toastEl.classList.remove('is-visible');
          setTimeout(function () {
            if (toastEl && !toastEl.classList.contains('is-visible')) {
              toastEl.hidden = true;
            }
          }, 360);
        }
      }, 4600);
    }

    /**
     * 推进到下一步，若已是最后一步则结算毕业奖励并关闭引导
     */
    function advanceOrCompleteStep(isManualClick) {
      if (!active) return;
      if (stepIndex < STEPS.length - 1) {
        enterStep(stepIndex + 1);
      } else {
        completeTutorial(false, isManualClick);
      }
    }

    /**
     * 结束新手引导
     * @param {boolean} skipped 是否为用户点击“跳过”
     */
    function completeTutorial(skipped) {
      active = false;
      root.setAttribute('data-tutorial-active', 'false');
      clearTargetHighlights();
      if (cardEl) {
        cardEl.hidden = true;
        cardEl.classList.remove('is-step-complete');
      }

      var tutState = (settings && settings.get && settings.get('tutorial')) || { completed: false, rewarded: false };
      if (skipped) {
        if (settings && typeof settings.set === 'function') {
          settings.set('tutorial', { completed: true });
        }
        return;
      }

      // 正式完成全部 5 步：检查是否首次领取 +1,500 PTS 毕业奖励
      var shouldReward = !tutState.rewarded;
      if (shouldReward && wallet && typeof wallet.earn === 'function') {
        wallet.earn(GRADUATION_REWARD_PTS);
        if (typeof wallet.flush === 'function') {
          wallet.flush();
        }
      }
      if (settings && typeof settings.set === 'function') {
        settings.set('tutorial', {
          completed: true,
          rewarded: true
        });
      }
      if (window.HorizonCrazyGames && typeof window.HorizonCrazyGames.happytime === 'function') {
        window.HorizonCrazyGames.happytime();
      }
      showGraduationToast(shouldReward);
    }

    /**
     * 跳过当前新手引导
     */
    function skipTutorial() {
      completeTutorial(true);
    }

    /**
     * 启动或重新开始新手引导
     * @param {boolean} forceRestart 是否强制从第 1 步重头开始（忽略 completed 状态）
     */
    function startTutorial(forceRestart) {
      var tutState = (settings && settings.get && settings.get('tutorial')) || { completed: false, rewarded: false };
      if (!forceRestart && tutState.completed) return;

      // 当用户主动触发“重新开始教学 / 按 T 键 / 点击顶栏引导”时：
      // 1. 自动关闭可能遮挡画面的设置弹窗或 3D 车库弹窗；
      // 2. 若当前处于待机出发页 (ready)、结算页 (ended) 或暂停页 (paused)，自动触发开始/继续驾驶，确保教学卡片立即展现。
      if (forceRestart) {
        var settingsCloseBtn = document.querySelector('.game-settings-overlay:not([hidden]) [data-settings-close]');
        if (settingsCloseBtn) settingsCloseBtn.click();
        var garageCloseBtn = document.querySelector('.garage-overlay:not([hidden]) [data-garage-close]');
        if (garageCloseBtn) garageCloseBtn.click();

        var mainEl = document.querySelector('main');
        var curMode = mainEl ? mainEl.getAttribute('data-mode') : '';
        if (curMode === 'ready' || curMode === 'ended') {
          var startBtn = mainEl.querySelector('.panel button.start');
          if (startBtn && !startBtn.disabled) startBtn.click();
        } else if (curMode === 'paused') {
          var resumeBtn = mainEl.querySelector('button.resume-drive');
          if (resumeBtn && !resumeBtn.disabled) resumeBtn.click();
        }
      }

      ensureCardDOM();
      active = true;
      lastFrameTime = performance.now();
      enterStep(0);
    }

    /**
     * 每帧更新当前步骤的动作完成度（60fps 遥测驱动）
     */
    function tickTutorial(now) {
      requestAnimationFrame(tickTutorial);

      var dt = lastFrameTime ? Math.min(0.1, Math.max(0.001, (now - lastFrameTime) / 1000)) : 0.016;
      lastFrameTime = now;

      if (!active) {
        if (cardEl && !cardEl.hidden) cardEl.hidden = true;
        return;
      }

      // 如果玩家在第 6 步打开了车库，即便车库遮罩打开中（或者刚关闭），立即判定第 6 步达成并毕业！
      if (STEPS[stepIndex] && STEPS[stepIndex].id === 'garage' && garageOpenedInStep) {
        completeTutorial(false);
        return;
      }

      var running = isDrivingRunning();
      if (!running) {
        if (cardEl && !cardEl.hidden) cardEl.hidden = true;
        root.setAttribute('data-tutorial-active', 'false');
        clearTargetHighlights();
        return;
      }

      ensureCardDOM();
      if (cardEl.hidden) {
        cardEl.hidden = false;
      }
      if (root.getAttribute('data-tutorial-active') !== 'true') {
        root.setAttribute('data-tutorial-active', 'true');
      }
      syncTargetHighlights();

      var step = STEPS[stepIndex];
      if (!step) return;

      var tel = getTelemetry();
      var st = tel && tel.state ? tel.state : null;
      var steering = tel && typeof tel.getSteering === 'function' ? Number(tel.getSteering()) || 0 : 0;

      // 防御校准：若中途切换座驾或重开一局导致遥测计数器重置归零，自动将基准值下调对齐，防止产生负数欠债
      if (st) {
        if (typeof st.passed === 'number' && st.passed < basePassed) basePassed = st.passed;
        if (typeof st.tossed === 'number' && st.tossed < baseTossed) baseTossed = st.tossed;
        if (typeof st.score === 'number' && st.score < baseScore) baseScore = st.score;
      }

      // 如果当前步骤已经达到 100%，等待短暂庆祝停顿后自动切入下一步
      if (stepProgress >= 1) {
        stepDoneHold += dt;
        if (stepDoneHold >= STEP_COMPLETE_HOLD_SEC) {
          advanceOrCompleteStep(false);
        }
        return;
      }

      // 仅在非最后一步、且车辆实际处于行驶或操控状态下才累加 45s 防卡关超时兜底，防止 0 车速挂机自动通关领奖
      var curSpeed = st && typeof st.speed === 'number' ? st.speed : 0;
      var isActivelyPlaying = curSpeed > 15 || pressedKeys.throttle || pressedKeys.steerLeft || pressedKeys.steerRight || pressedKeys.nos;
      if (stepIndex < STEPS.length - 1 && isActivelyPlaying) {
        stepElapsed += dt;
        if (stepElapsed >= STEP_TIMEOUT_SEC) {
          stepProgress = 1;
          renderProgressUI(1);
          if (cardEl) cardEl.classList.add('is-step-complete');
          return;
        }
      }

      var newProgress = stepProgress;

      if (step.id === 'launch') {
        // Step 1: 车速达到 80 km/h
        newProgress = Math.max(stepProgress, Math.min(1, curSpeed / 80));
      } else if (step.id === 'steer') {
        // Step 2: 左右变道转向累积
        var absSteer = Math.abs(steering);
        var keySteer = pressedKeys.steerLeft || pressedKeys.steerRight;
        if (absSteer > 0.05 || keySteer) {
          var rate = Math.max(absSteer * 1.4, keySteer ? 0.85 : 0);
          steerAccum += rate * dt;
        }
        newProgress = Math.min(1, steerAccum / 0.95);
      } else if (step.id === 'nos') {
        // Step 3: 激活 NOS 氮气推进
        if (st && typeof st.nosEnergy === 'number' && st.nosEnergy < 25 && tel && typeof tel.refillNos === 'function') {
          try { tel.refillNos(); } catch (_) {}
        }
        var isNosOn = (st && st.nosActive === true) || pressedKeys.nos;
        if (isNosOn) {
          nosAccum += dt;
        }
        newProgress = Math.min(1, nosAccum / 0.7);
      } else if (step.id === 'overtake') {
        // Step 4: 闪远光灯、按喇叭催促前车（每次触发 +50% 信号进度，按住持续累加）或完成 1 次超车/得分
        var passedDelta = st && typeof st.passed === 'number' ? Math.max(0, st.passed - basePassed) : 0;
        var scoreDelta = st && typeof st.score === 'number' ? Math.max(0, st.score - baseScore) : 0;

        if (passedDelta >= 1 || scoreDelta >= 40) {
          newProgress = 1;
        } else {
          if (pressedKeys.flash || pressedKeys.horn) {
            overtakeSignalProgress = Math.min(1, overtakeSignalProgress + dt * 0.45);
          }
          var scoreRatio = Math.min(0.9, scoreDelta / 40);
          newProgress = Math.min(1, Math.max(stepProgress, overtakeSignalProgress, scoreRatio));
        }
      } else if (step.id === 'takedown') {
        // Step 5: 侧撞霸气弹飞慢车（检测 st.tossed 增加）
        var tossedDelta = st && typeof st.tossed === 'number' ? Math.max(0, st.tossed - baseTossed) : 0;
        if (tossedDelta >= 1) {
          newProgress = 1;
        }
      } else if (step.id === 'garage') {
        // Step 6: 切换视角（按 C 或点击左上角）或打开车库（按 G 或点击右上角）
        var curCam = settings && settings.get && settings.get('display')
          ? settings.get('display').camera
          : (root.getAttribute('data-camera') || 'first');
        if (curCam !== baseCamera || garageOpenedInStep) {
          newProgress = 1;
        }
      }

      if (newProgress !== stepProgress) {
        stepProgress = Math.max(0, Math.min(1, newProgress));
        renderProgressUI(stepProgress);
        if (stepProgress >= 1 && cardEl) {
          cardEl.classList.add('is-step-complete');
        }
      }
    }

    /**
     * 在第 4 步（声光催促与超车）中记录一次离散的闪灯或鸣笛动作（每次动作推进 50% 信号进度，2 次即可满格）
     */
    function bumpOvertakeSignal() {
      if (active && STEPS[stepIndex] && STEPS[stepIndex].id === 'overtake') {
        overtakeSignalProgress = Math.min(1, overtakeSignalProgress + 0.5);
      }
    }

    // 记录远光灯按键连按时间戳（900ms 内连续按下 >= 2 次判定为闪灯）
    var lastBeamTapMs = -10000;
    var beamTapStreak = 0;

    // 监听键盘输入辅助判定与快捷键
    window.addEventListener('keydown', function (e) {
      var code = e.code || '';
      var key = (e.key || '').toLowerCase();
      if (code === 'KeyW' || code === 'ArrowUp' || key === 'w' || key === 'arrowup') pressedKeys.throttle = true;
      if (code === 'KeyA' || code === 'ArrowLeft' || key === 'a' || key === 'arrowleft') pressedKeys.steerLeft = true;
      if (code === 'KeyD' || code === 'ArrowRight' || key === 'd' || key === 'arrowright') pressedKeys.steerRight = true;
      if (code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyN' || key === 'shift' || key === 'n') pressedKeys.nos = true;
      if (!e.repeat && (code === 'KeyV' || code === 'KeyL' || key === 'v' || key === 'l')) {
        var nowMs = performance.now();
        beamTapStreak = (nowMs - lastBeamTapMs <= 900) ? (beamTapStreak + 1) : 1;
        lastBeamTapMs = nowMs;
        if (beamTapStreak >= 2) pressedKeys.flash = true;
        bumpOvertakeSignal();
      }
      if (code === 'Space' || code === 'KeyH' || key === ' ' || key === 'h') {
        pressedKeys.horn = true;
        if (!e.repeat) {
          bumpOvertakeSignal();
        }
      }
    });

    window.addEventListener('keyup', function (e) {
      var code = e.code || '';
      var key = (e.key || '').toLowerCase();
      if (code === 'KeyW' || code === 'ArrowUp' || key === 'w' || key === 'arrowup') pressedKeys.throttle = false;
      if (code === 'KeyA' || code === 'ArrowLeft' || key === 'a' || key === 'arrowleft') pressedKeys.steerLeft = false;
      if (code === 'KeyD' || code === 'ArrowRight' || key === 'd' || key === 'arrowright') pressedKeys.steerRight = false;
      if (code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyN' || key === 'shift' || key === 'n') pressedKeys.nos = false;
      if (code === 'KeyV' || code === 'KeyL' || key === 'v' || key === 'l') pressedKeys.flash = false;
      if (code === 'Space' || code === 'KeyH' || key === ' ' || key === 'h') pressedKeys.horn = false;
    });

    // 监听 drive.js 派发的鸣笛事件与远光灯闪烁事件（兼容移动端按钮点击与桌面端按键）
    window.addEventListener('horizon-horn-trigger', function () {
      bumpOvertakeSignal();
    });
    window.addEventListener('horizon-flash-trigger', function () {
      bumpOvertakeSignal();
    });

    // 监听中途车库切换座驾事件：重置遥测基准值，防止场景重建归零后产生负数差值
    window.addEventListener('garage-vehicle-confirmed', function () {
      if (!active) return;
      basePassed = 0;
      baseTossed = 0;
      baseScore = 0;
    });

    // 监听语言、操控模式、视口变化，实时刷新引导卡片文案
    window.addEventListener('horizon-lang-change', function () {
      if (active) {
        renderCardStaticContent();
        renderProgressUI(stepProgress);
      }
    });

    window.addEventListener('game-layout-change', function () {
      if (active) {
        renderCardStaticContent();
      }
    });

    if (settings && typeof settings.subscribe === 'function') {
      settings.subscribe(function (change) {
        if (!active) return;
        if (change.sections.indexOf('display') >= 0 || change.sections.indexOf('lang') >= 0) {
          renderCardStaticContent();
        }
      });
    }

    // 导出全局 API 供顶栏按钮、设置面板与快捷键调用
    window.HorizonTutorial = {
      start: function () {
        startTutorial(false);
      },
      restart: function () {
        startTutorial(true);
      },
      skip: skipTutorial,
      next: function () {
        advanceOrCompleteStep(true);
      },
      isActive: function () {
        return active;
      }
    };

    // 启动 60fps 遥测检测循环，并在首次进入 3D 驾驶时为新玩家自动开启引导
    requestAnimationFrame(tickTutorial);
    var initCheckTimer = setInterval(function () {
      var mainEl = document.querySelector('main');
      if (mainEl && mainEl.getAttribute('data-mode') === 'running') {
        clearInterval(initCheckTimer);
        startTutorial(false);
      }
    }, 250);
  })();

  // ==================== [模块 6] 一次性成就奖励与达成提示 (HorizonAchievements) ====================
  (function installAchievementController() {
    if (window.HorizonAchievements) return;

    var wallet = window.HorizonDriveWallet;
    // 单局里程成就门槛（米）
    var RUN_DISTANCE_GOALS = [[1000, 'run_1km'], [3000, 'run_3km'], [5000, 'run_5km'], [10000, 'run_10km']];
    // 新座驾首跑成就所需里程（米）
    var FIRST_DRIVE_METERS = 1000;
    // 每条达成提示的停留时长（毫秒）
    var TOAST_MS = 2600;
    // 本页会话内已确认领取过的成就，避免达到门槛后每帧重复读写存档
    var settled = {};
    var queue = [];
    var toastEl = null;
    var toastTimer = 0;

    function isZh() {
      var i18n = window.HorizonI18n;
      return i18n && typeof i18n.lang === 'function' ? i18n.lang() === 'zh' : false;
    }

    function claim(id) {
      if (settled[id] || !wallet || typeof wallet.claimAchievement !== 'function') return;
      settled[id] = true;
      var def = wallet.claimAchievement(id);
      if (def) {
        queue.push(def);
        if (!toastTimer) showNext();
      }
    }

    function showNext() {
      var def = queue.shift();
      if (!def) {
        toastTimer = 0;
        if (toastEl) toastEl.classList.remove('is-visible');
        return;
      }
      if (!toastEl) {
        toastEl = document.createElement('div');
        toastEl.className = 'horizon-achv-toast';
        toastEl.setAttribute('role', 'status');
        toastEl.setAttribute('aria-live', 'polite');
        document.body.appendChild(toastEl);
      }
      var zh = isZh();
      toastEl.innerHTML =
        '<span class="achv-icon" aria-hidden="true">' + def.icon + '</span>' +
        '<span class="achv-text"><small>' + (zh ? '成就达成' : 'ACHIEVEMENT') + '</small><b>' + (zh ? def.nameZh : def.nameEn) + '</b></span>' +
        '<span class="achv-pts">+' + String(def.pts).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '</span>';
      toastEl.classList.remove('is-visible');
      void toastEl.offsetWidth;
      toastEl.classList.add('is-visible');
      if (window.HorizonCrazyGames && typeof window.HorizonCrazyGames.happytime === 'function') {
        window.HorizonCrazyGames.happytime();
      }
      toastTimer = setTimeout(showNext, TOAST_MS);
    }

    /**
     * 由 drive.js 在驾驶事件发生时调用
     * @param {string} evt 事件类型：nearMiss（data.combo / data.split）、takedown、distance（data.m 本局里程米数 / data.vehicle 当前座驾）
     * @param {object} data 事件数据
     */
    function report(evt, data) {
      var d = data || {};
      if (evt === 'nearMiss') {
        claim('near_miss_1');
        if (d.combo >= 3) claim('combo_3');
        if (d.combo >= 5) claim('combo_5');
        if (d.split) claim('split_1');
      } else if (evt === 'takedown') {
        claim('takedown_1');
      } else if (evt === 'bust') {
        claim('bust_1');
      } else if (evt === 'distance') {
        var m = Number(d.m) || 0;
        for (var i = 0; i < RUN_DISTANCE_GOALS.length; i++) {
          if (m >= RUN_DISTANCE_GOALS[i][0]) claim(RUN_DISTANCE_GOALS[i][1]);
        }
        if (m >= FIRST_DRIVE_METERS && (d.vehicle === 'motorcycle' || d.vehicle === 'truck' || d.vehicle === 'jet' || d.vehicle === 'police')) {
          claim('drive_' + d.vehicle);
        }
      }
    }

    window.HorizonAchievements = { report: report };
  })();
})();
