/**
 * ============================================================================
 * 《地平线狂飙：无尽公路》(Horizon Overdrive) - 桌面端键鼠操控与快捷键适配模块 (desktop-controls.js)
 * ============================================================================
 * 功能说明：
 * 1. 自动检测当前设备是否为桌面端 PC（结合 User-Agent、精细指针 finePointer 与悬停能力 hover）。
 * 2. 将检测结果写入 html[data-desktop="true|false"]，供布局系统与 UI 组件自动切换宽屏桌面交互模式。
 * 3. 绑定符合主流赛车游戏人体工学的桌面端驾驶快捷键（左手无需离开 WASD 即可盲操全部车灯、喇叭、氮气与特技）：
 *    - W / ↑        : 油门加速 / 前进（在 R 挡下按 W/↑ 自动挂回 D 挡前进）
 *    - S / ↓        : 刹车减速 / 自动倒车（刹停后继续按住 S/↓ 自动挂入 R 挡倒车）
 *    - A / D 或 ← / → : 左右转向
 *    - Shift / N    : 激发或关闭氮气加速（NOS Boost 蓝焰推进，杜绝按 Shift 误触掉头）
 *    - 空格 / H     : 鸣笛喇叭（支持大拇指按空格或按 H 键随时鸣笛催促前车）
 *    - Q / E        : 左转向灯 / 右转向灯切换（再次按下同向自动回正关闭）
 *    - V / L        : 远光灯开关（连续多次点击/连按 V 键触发闪灯催促前车让道）
 *    - 2            : 危险报警闪光灯（双闪警示灯）
 *    - F            : 天穹 V8 飞车飞行 / 伴飞无人机特技 / 剧情模式攻击
 *    - Z            : 180° 漂移掉头（车速 40 km/h 以上可用）
 *    - X / U        : 360° 旋转特技（车速 40 km/h 以上可用）
 *    - R            : 车辆脱困复位 / 紧急回正（Recover）
 *    - J / K        : 幻影重机翘头（后空翻）/ 翘尾（前空翻）特技
 *    - C            : 实时切换第一人称 / 第三人称驾驶视角
 *    - G            : 打开 3D 车库实时预览并切换座驾
 *    - T            : 重新开启交互式新手驾驶教学引导 (Tutorial)
 *    - 鼠标滚轮 或 [ / ] : 免踩刹车直接切换 P / R / N / D 挡位
 * ============================================================================
 */
(function () {
  'use strict';

  /**
   * 判断当前运行环境是否为桌面端设备
   * @param {string} deviceType 容器上报的设备类型
   * @param {string} ua 浏览器 User-Agent 字符串
   * @param {boolean} finePointer 是否具备高精度指针（如鼠标）
   * @param {boolean} hover 是否支持悬停交互
   * @param {number} touchPoints 最大触摸点数
   * @returns {boolean} 是否为 PC 桌面端
   */
  function detect(deviceType, ua, finePointer, hover, touchPoints) {
    if (deviceType === 'desktop') return true;
    if (deviceType === 'phone' || deviceType === 'tablet') return false;
    if (/Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (/Macintosh/i.test(ua) && touchPoints > 1)) return false;
    return /Windows NT|Macintosh|X11|CrOS|Linux/i.test(ua) && finePointer && hover;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = detect;
    return;
  }

  var root = document.documentElement;
  var deviceType = 'unknown';
  var fine = window.matchMedia('(any-pointer: fine)');
  var hover = window.matchMedia('(any-hover: hover)');

  /**
   * 更新根节点的 data-desktop 属性，并在状态变化时触发 resize 重新计算视口
   */
  function update() {
    var pc = detect(deviceType, navigator.userAgent || '', fine.matches, hover.matches, navigator.maxTouchPoints || 0);
    var changed = root.getAttribute('data-desktop') !== String(pc);
    root.setAttribute('data-desktop', String(pc));
    if (changed) window.dispatchEvent(new Event('resize'));
  }

  window.addEventListener('horizon-viewport-container', function (event) {
    deviceType = (event.detail && event.detail.deviceType) || 'unknown';
    update();
  });

  if (fine.addEventListener) {
    fine.addEventListener('change', update);
    hover.addEventListener('change', update);
  } else {
    fine.addListener(update);
    hover.addListener(update);
  }
  update();

  /**
   * 检查当前是否处于有效驾驶状态（非输入框聚焦、无模态弹窗遮挡、游戏主视图处于 running 状态）
   * @param {Event} event 键盘或滚轮事件
   * @returns {HTMLElement|null} 驾驶主容器元素或 null
   */
  function driving(event) {
    if (root.getAttribute('data-desktop') !== 'true') return null;
    var target = event.target;
    if (target && target.closest && target.closest('input,textarea,select,[contenteditable="true"]')) return null;
    if (Array.prototype.some.call(document.querySelectorAll('[role="dialog"]'), function (el) {
      return el.getClientRects().length > 0;
    })) return null;
    return document.querySelector('main[data-mode="running"]');
  }

  /**
   * 模拟点击驾驶舱内的对应功能按钮，确保挡位、车灯、喇叭与特技规则由核心状态机权威处理
   * @param {HTMLElement} main 驾驶主容器
   * @param {string} selector 目标按钮 CSS 选择器
   */
  function press(main, selector) {
    if (!selector) return;
    var button = main.querySelector(selector);
    if (button && !button.disabled && button.getClientRects().length) {
      button.click();
    }
  }

  /**
   * 按指定方向一步切换 P / R / N / D 挡位（无需按住刹车）
   * @param {HTMLElement} main 驾驶主容器
   * @param {number} direction 切换方向（1 为下一挡，-1 为上一挡）
   */
  function stepGear(main, direction) {
    var gear = main.querySelector('.real-shifter');
    if (!gear) return;
    var index = ['P', 'R', 'N', 'D'].indexOf(gear.getAttribute('data-gear'));
    var next = index + direction;
    if (index >= 0 && next >= 0 && next < 4) {
      press(main, '.gear-buttons button:nth-child(' + (next + 1) + ')');
    }
  }

  // 监听全局键盘按下事件，映射符合人体工学的桌面端驾驶快捷键
  window.addEventListener('keydown', function (event) {
    var key = event.key.toLowerCase();
    var handledKeys = [
      'q', 'e', '2', '3', 'b', 'shift', 'n', ' ', 'h', 'v', 'l',
      'c', 'z', 'x', 'u', 'r', 'g', 't', '[', ']', 'pageup', 'pagedown'
    ];
    if (handledKeys.indexOf(key) < 0 || event.ctrlKey || event.metaKey || event.altKey) return;
    var main = driving(event);
    if (!main) return;

    // 快捷键 B / 3：一键快捷发送车手表情并与周围车流实时互动
    if (key === 'b' || key === '3') {
      event.preventDefault();
      if (event.repeat) return;
      window.dispatchEvent(new CustomEvent('horizon-quick-emote'));
      return;
    }

    // 快捷键 T：重新开启交互式新手驾驶教学引导
    if (key === 't') {
      event.preventDefault();
      if (event.repeat) return;
      if (window.HorizonTutorial && typeof window.HorizonTutorial.restart === 'function') {
        window.HorizonTutorial.restart();
      }
      return;
    }

    // 快捷键 G：打开 3D 车库实时预览并切换座驾
    if (key === 'g') {
      event.preventDefault();
      if (event.repeat) return;
      press(main, '.garage-preview');
      return;
    }

    // 快捷键 Shift / N：激发或关闭主动氮气加速（NOS Boost）
    if (key === 'shift' || key === 'n') {
      event.preventDefault();
      if (event.repeat) return;
      window.dispatchEvent(new CustomEvent('horizon-nos-trigger'));
      return;
    }

    // 快捷键 R：车辆脱困回正复位（Recover）
    if (key === 'r') {
      event.preventDefault();
      if (event.repeat) return;
      window.dispatchEvent(new CustomEvent('horizon-recover-trigger'));
      return;
    }

    // 快捷键 C：在驾驶过程中实时切换第一人称 / 第三人称视角
    if (key === 'c') {
      event.preventDefault();
      if (event.repeat) return;
      var nextCam = root.getAttribute('data-camera') === 'third' ? 'first' : 'third';
      if (window.HorizonDriveSettings) {
        window.HorizonDriveSettings.set('display', { camera: nextCam });
      } else {
        root.setAttribute('data-camera', nextCam);
      }
      return;
    }

    // 快捷键 [ / ] 或 PageUp / PageDown：键盘直接上下切换 P / R / N / D 挡位
    if (key === '[' || key === 'pageup') {
      event.preventDefault();
      if (event.repeat) return;
      stepGear(main, -1);
      return;
    }
    if (key === ']' || key === 'pagedown') {
      event.preventDefault();
      if (event.repeat) return;
      stepGear(main, 1);
      return;
    }

    // 无人机视角下 U 键用于无人机掉头，交由底层引擎处理
    if (key === 'u' && main.getAttribute('data-drone-view') === 'true') {
      return;
    }

    event.preventDefault();
    // 捕获空格键，专用于鸣笛喇叭，防止被底层当作刹车
    if (key === ' ') event.stopImmediatePropagation();
    if (event.repeat) return;

    if (key === 'q' || key === 'e') {
      // Q / E 控制左/右转向灯拨杆（再次按下同一方向则归位关闭）
      var stalk = main.querySelector('.turn-stalk');
      if (!stalk) return;
      var side = key === 'q' ? 'left' : 'right';
      var index = stalk.getAttribute('data-signal') === side ? 2 : side === 'left' ? 3 : 1;
      press(main, '.turn-stalk button:nth-of-type(' + index + ')');
    } else {
      var keyMap = {
        ' ': '.horn-button, .aux-controls > button:nth-of-type(2)',      // 空格：鸣笛喇叭
        'h': '.horn-button, .aux-controls > button:nth-of-type(2)',      // H：鸣笛喇叭
        'v': '.high-beam-button, .aux-controls > button:first-of-type',  // V：远光灯开关（连按触发闪灯）
        'l': '.high-beam-button, .aux-controls > button:first-of-type',  // L：远光灯开关（兼容）
        '2': '.hazard-button',                                           // 2：双闪警示灯
        'z': '.stunt-buttons button:first-child',                        // Z：180° 漂移掉头
        'x': '.stunt-buttons button:last-child',                         // X：360° 旋转特技
        'u': '.stunt-buttons button:last-child'                          // U：360° 旋转特技（兼容）
      };
      press(main, keyMap[key]);
    }
  }, true);

  // 监听鼠标滚轮事件，无需按住刹车即可直接上下切换 P / R / N / D 挡位
  var wheelTotal = 0;
  var wheelAt = 0;
  var shiftedAt = 0;
  window.addEventListener('wheel', function (event) {
    if (event.ctrlKey || event.metaKey || event.altKey || !event.deltaY) return;
    var main = driving(event);
    if (!main || !main.querySelector('.gear-controls')) return;
    event.preventDefault();

    var now = Date.now();
    var delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 120 : 1);
    if (now - wheelAt > 180 || wheelTotal * delta < 0) wheelTotal = 0;
    wheelAt = now;
    wheelTotal += delta;

    // 累积滚动阈值防抖，防止误触跳挡
    if (Math.abs(wheelTotal) < 35 || now - shiftedAt < 220) return;
    var direction = wheelTotal > 0 ? 1 : -1;
    wheelTotal = 0;
    shiftedAt = now;

    stepGear(main, direction);
  }, { passive: false });

  // 在驾驶界面顶部注入 PC 按键操作提示条与显隐开关按钮（支持中英双语实时切换）
  var hintsVisible = true;
  root.setAttribute('data-key-hints', 'true');

  function isZh() {
    if (window.HorizonI18n && typeof window.HorizonI18n.lang === 'function') {
      return window.HorizonI18n.lang() === 'zh';
    }
    return root.getAttribute('data-lang') === 'zh';
  }

  function refreshHintTexts() {
    var zh = isZh();
    var hint = document.querySelector('.desktop-key-help');
    if (hint) {
      hint.textContent = zh
        ? 'W/↑ 加速 · S/↓ 刹车/倒车 · A D/← → 转向 · Shift/N 氮气 · 空格/H 喇叭 · V 远光(连按闪灯) · 2 双闪 · Q/E 转向灯 · B/3 表情 · Z/X 特技 · R 复位 · C 视角 · G 换车 · T 引导'
        : 'W/↑ Gas · S/↓ Brake/Rev · A D/← → Steer · Shift/N NOS · Space/H Horn · V Beam(Multi-tap Flash) · 2 Hazard · Q/E Signal · B/3 Emote · Z/X Stunt · R Recover · C Cam · G Garage · T Guide';
    }
    var toggle = document.querySelector('.desktop-hints-toggle');
    if (toggle) {
      var labelText = zh
        ? (hintsVisible ? '隐藏键位提示' : '显示键位提示')
        : (hintsVisible ? 'Hide Key Hints' : 'Show Key Hints');
      var labelEl = toggle.querySelector('.hints-toggle-label');
      if (labelEl) {
        labelEl.textContent = labelText;
      } else {
        toggle.innerHTML =
          '<span class="hints-status-dot" aria-hidden="true"></span>' +
          '<svg class="hints-key-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">' +
          '<rect x="2" y="4.5" width="16" height="11" rx="2.5" stroke="currentColor" stroke-width="1.5"/>' +
          '<path d="M5.5 8h1.5M9.25 8h1.5M13 8h1.5M5.5 11.5h9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
          '</svg>' +
          '<span class="hints-toggle-label">' + labelText + '</span>';
      }
      toggle.setAttribute('aria-pressed', String(hintsVisible));
      toggle.setAttribute('data-hints-active', String(hintsVisible));
    }
  }

  function decorate() {
    var ui = document.querySelector('main > .game-ui');
    if (!ui || ui.querySelector('.desktop-key-help')) return;

    var hint = document.createElement('div');
    hint.className = 'desktop-key-help';
    ui.appendChild(hint);

    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'desktop-hints-toggle';

    function syncHints() {
      root.setAttribute('data-key-hints', String(hintsVisible));
      refreshHintTexts();
    }

    toggle.addEventListener('click', function () {
      hintsVisible = !hintsVisible;
      syncHints();
    });
    ui.appendChild(toggle);
    syncHints();
  }

  window.addEventListener('horizon-lang-change', refreshHintTexts);

  new MutationObserver(function (records) {
    if (records.some(function (r) {
      return Array.prototype.some.call(r.addedNodes, function (n) { return n.nodeType === 1; });
    })) {
      decorate();
    }
  }).observe(document.body, { childList: true, subtree: true });

  decorate();
})();
