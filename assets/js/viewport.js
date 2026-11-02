/**
 * ============================================================================
 * 《地平线狂飙：无尽公路》(Horizon Overdrive) - 视口容器、横竖屏方向与安全区适配模块 (viewport.js)
 * ============================================================================
 * 功能说明：
 * 1. 提供 window.HorizonDriveAutoOrientation() 方法，根据桌面端/移动端设备属性或当前窗口宽高比，
 *    自动推导最合适的初始屏幕方向（横屏 landscape / 竖屏 portrait）。
 * 2. 当用户在“游戏设置”中手动点击横竖屏切换按钮时，锁定用户本轮会话的方向偏好。
 * 3. 维护安全区 CSS 变量（--safe-top / --safe-right / --safe-bottom / --safe-left），
 *    兼容移动端刘海屏与桌面端全屏视口。
 * ============================================================================
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var state = null;
  var manualOrientation = false;

  /**
   * 自动推导当前视口最适合的屏幕方向
   * - 若用户已在本页手动切换过方向，则返回 null（尊重用户手动选择）
   * - 若检测为 PC 桌面端，默认优先使用横屏（landscape）以获得最佳宽屏驾驶视野
   * - 否则根据浏览器实际视口宽高比自动返回 landscape 或 portrait
   * @returns {string|null} 'landscape' | 'portrait' | null
   */
  window.HorizonDriveAutoOrientation = function () {
    if (manualOrientation) return null;
    if (root.getAttribute('data-desktop') === 'true') return 'landscape';
    if (state) return null;
    var w = root.clientWidth || window.innerWidth;
    var h = root.clientHeight || window.innerHeight;
    return w > 0 && h > 0 ? (w > h ? 'landscape' : 'portrait') : null;
  };

  /**
   * 同步安全区边距 CSS 变量（处理移动端屏幕 CSS 旋转 90 度后的方向映射）
   */
  function safeArea() {
    var safe = (state && state.safeArea) || { top: 0, right: 0, bottom: 0, left: 0 };
    var rotated = root.getAttribute('data-rotated') === 'true';
    var sides = ['top', 'right', 'bottom', 'left'];
    var mapped = rotated ? ['right', 'bottom', 'left', 'top'] : sides;
    sides.forEach(function (side, i) {
      var value = Number(safe[mapped[i]]);
      var pixels = (Number.isFinite(value) ? Math.max(0, value) : 0) + 'px';
      root.style.setProperty('--safe-' + side, pixels);
      root.style.setProperty('--safe-area-inset-' + side, pixels);
    });
  }

  // 初始化默认安全区变量
  safeArea();
  window.addEventListener('game-layout-change', safeArea);

  // 监听用户在“游戏设置”中手动选择横屏或竖屏
  document.addEventListener('click', function (event) {
    var button = event.target && event.target.closest && event.target.closest('.drive-preferences button[data-orientation]');
    if (button) {
      manualOrientation = true;
      window.dispatchEvent(new Event('resize'));
    }
  });
})();
