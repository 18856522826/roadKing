# -*- coding: utf-8 -*-
"""
《地平线狂飙：无尽公路》(Horizon Overdrive) - CrazyGames 60FPS 实机高光试玩视频自动录制与合成管线
====================================================================================================
核心技术特性：
1. 零侵入内存增强服务 (In-Memory Telemetry Director Server)：
   - 在内存中为 /assets/js/drive.js 动态挂载 __HD_TELEMETRY__.director 导演接口，不改动任何生产文件。
2. 确定性 60FPS 虚拟时钟步进 (Deterministic 60FPS Virtual Clock Stepper)：
   - 接管 requestAnimationFrame 与 performance.now()，每帧精确推进 16.6667ms，彻底杜绝录制掉帧与卡顿。
3. 18.0 秒 (1,080 帧) 六幕高能实机蒙太奇：
   - Opening (0.0s - 0.4s) : 官方封面无缝动态缩放切入实机 (Seamless Cover-to-Gameplay Hook)
   - Scene 1 (0.4s - 3.6s) : 疾风 GT 轿跑 (Cobalt GT) · 碧海跨海大桥 355 km/h NOS 蓝焰冲刺 + 惊险超车连击 + 360° 旋转漂移
   - Scene 2 (3.6s - 7.2s) : 幻影重机 (Phantom R1) · 樱花大道双车刀锋钻缝 (Lane Split) + 高速翘头 (Wheelie) + MotoGP 压弯
   - Scene 3 (7.2s - 10.4s): 沉浸式第一人称座舱 · 向晚新城落日霞光双手极速打盘 + 远光闪灯催促 + 3D 霓虹路怒气泡反超
   - Scene 4 (10.4s - 13.6s): 泰坦重型卡车 (Titan V12) · 层岩大峡谷开启 NOS 牛栏破障，霸气将慢车撞飞上天旋转
   - Scene 5 (13.6s - 16.4s): 天穹 V8 飞车 (Aether V8 Jet) · 云际高架 445 km/h 展开等离子机翼腾空跃障飞行
   - Scene 6 (16.4s - 18.0s): 3D 旋转车库与高定涂装工坊快闪巡礼 + 循环回切封面
4. 输出产物：
   - video-preview-landscape-1920x1080.mp4 (16:9 横屏无声悬停预览版，CrazyGames 必填)
   - video-preview-portrait-1080x1620.mp4  (2:3 竖屏无声悬停预览版，CrazyGames 必填)
   - trailer-with-bgm-1920x1080.mp4        (16:9 横屏有声高燃战歌宣传片版，附赠宣传素材)
====================================================================================================
"""

import asyncio
import base64
import functools
import http.server
import io
import json
import os
import shutil
import socketserver
import subprocess
import sys
import tempfile
import threading
import time
import urllib.request

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageEnhance
import websockets

sys.stdout.reconfigure(encoding="utf-8")

WORKSPACE_DIR = r"d:\AI项目集合\赛车游戏"
COVERS_DIR = os.path.join(WORKSPACE_DIR, "crazygames-materials", "covers")
VIDEOS_DIR = os.path.join(WORKSPACE_DIR, "crazygames-materials", "videos")
BGM_PATH = os.path.join(WORKSPACE_DIR, "assets", "audio", "bgm.mp3")
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()

FPS = 60
DT_MS = 1000.0 / FPS


# ============================================================================
# 一、零侵入内存增强静态资源服务器（动态注入 __HD_TELEMETRY__.director）
# ============================================================================
DIRECTOR_PATCH_TARGET = (
    'window.__HD_TELEMETRY__={state:x,getSteering:()=>Sn,refillNos:()=>{x.nosEnergy=100,A(ee({},x)),No()}}'
)

DIRECTOR_PATCH_REPLACEMENT = r'''window.__HD_TELEMETRY__={
  state:x,
  getSteering:()=>Sn,
  refillNos:()=>{x.nosEnergy=100,A(ee({},x)),No()},
  director:{
    get ctrl(){return typeof oo!=="undefined"?oo:null},
    get traffic(){return cA},
    get rivalBike(){return wA},
    setEnv(skyTimeOffset,clearWeather=!0){
      if(skyTimeOffset!=null)Kn=skyTimeOffset-re;
      if(clearWeather&&Bt&&Bt.values){Bt.values[0]=0;Bt.values[1]=0;Bt.values[2]=0;Bt.values[3]=0}
      if(typeof zc==="function")zc();
    },
    setSpeedAndNos(spd,nosOn,scoreVal,comboVal){
      ut.invincible=!0;
      UA.heavyRam=!0;
      if(x.mode!=="running"){h.reset();x.mode="running"}
      if(spd!=null){dt=spd;x.speed=spd}
      if(nosOn!=null){x.nosActive=!!nosOn;x.nosEnergy=Math.max(55,x.nosEnergy||92)}
      if(scoreVal!=null)x.score=scoreVal;
      if(comboVal!=null){x.combo=comboVal;x.maxCombo=Math.max(x.maxCombo||0,comboVal)}
      pa=Math.max(pa,5.0);
      x.health=100;
      A(ee({},x));
    },
    setLane(laneX,steerVal){
      if(laneX!=null){Ze=laneX;UA.x=laneX}
      if(steerVal!=null){Ne.steering=steerVal}
    },
    banner(msg,dur=3.0){
      if(typeof iA==="function")iA(msg,dur);
      A(ee({},x));
    },
    setupTrafficShowcase(mode,distAhead=36){
      if(!cA||cA.length<6)return;
      if(mode==="split"){
        const c0=cA[0],c1=cA[1],c2=cA[2];
        c0.body.active=!0;c0.body.toss=void 0;c0.body.y=0;c0.body.x=-2.15;c0.target=-2.15;c0.body.z=We-distAhead;c0.speed=110;
        c1.body.active=!0;c1.body.toss=void 0;c1.body.y=0;c1.body.x=2.15;c1.target=2.15;c1.body.z=We-distAhead;c1.speed=110;
        c2.body.active=!0;c2.body.toss=void 0;c2.body.y=0;c2.body.x=-3.8;c2.target=-3.8;c2.body.z=We-distAhead-28;c2.speed=120;
        if(c0.triggerNpcBubble)c0.triggerNpcBubble("taunt",4.0);
        if(c1.triggerNpcBubble)c1.triggerNpcBubble("cheer",4.0);
      }else if(mode==="dense_overtake"){
        const lanes=[-4.0,2.2,-2.2,4.0,-3.8,3.6];
        for(let i=0;i<6;i++){
          const c=cA[i];
          c.body.active=!0;c.body.toss=void 0;c.body.y=0;
          c.body.x=lanes[i];c.target=lanes[i];
          c.body.z=We-(22+i*18);
          c.speed=115;
          if(i===1&&c.triggerNpcBubble)c.triggerNpcBubble("taunt",4.0);
        }
      }else if(mode==="ram_target"){
        const c0=cA[0],c1=cA[1];
        c0.body.active=!0;c0.body.toss=void 0;c0.body.y=0;c0.body.x=Ze+0.2;c0.target=Ze+0.2;c0.body.z=We-distAhead;c0.speed=80;
        c1.body.active=!0;c1.body.toss=void 0;c1.body.y=0;c1.body.x=-3.6;c1.target=-3.6;c1.body.z=We-distAhead-16;c1.speed=100;
        if(c0.triggerNpcBubble)c0.triggerNpcBubble("angry",3.5);
      }
    },
    tossCarNow(idx=0,dir=1){
      if(!cA||!cA[idx])return;
      const v=cA[idx];
      v.body.active=!1;
      v.body.x=Ze+(dir*0.8);
      v.body.z=We-13;
      v.body.y=0.9;
      v.body.toss={age:0,vx:dir*11.5,vz:-72,vy:14.5,direction:dir};
      if(v.triggerNpcBubble)v.triggerNpcBubble("shock",4.0);
      x.tossed=(x.tossed||0)+1;
      un=1.8;
    }
  }
}'''


class DirectorHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WORKSPACE_DIR, **kwargs)

    def log_message(self, format, *args):
        pass

    def do_GET(self):
        clean_path = self.path.split("?", 1)[0]
        if clean_path == "/assets/js/drive.js":
            file_path = os.path.join(WORKSPACE_DIR, "assets", "js", "drive.js")
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            if DIRECTOR_PATCH_TARGET in content:
                content = content.replace(DIRECTOR_PATCH_TARGET, DIRECTOR_PATCH_REPLACEMENT, 1)
            encoded = content.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/javascript; charset=utf-8")
            self.send_header("Content-Length", str(len(encoded)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(encoded)
            return
        return super().do_GET()


class ThreadedTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True


def start_local_server(port: int = 8099):
    httpd = ThreadedTCPServer(("127.0.0.1", port), DirectorHTTPRequestHandler)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    return httpd


# ============================================================================
# 二、Chrome CDP 确定性步进控制器与场景录制器
# ============================================================================
INIT_DOCUMENT_SCRIPT = r"""
(() => {
  // 1. 预置全解锁满配存档（关闭新手教学遮罩、开启光影增强、解锁全座驾与全涂装）
  const now = Date.now();
  const fields = {
    'lang': { v: 'en', t: now },
    'display.orientation': { v: window.__INIT_ORIENTATION__ || 'landscape', t: now },
    'display.camera': { v: 'third', t: now },
    'display.controls': { v: 'buttons', t: now },
    'graphics.lighting': { v: true, t: now },
    'vehicle': { v: 'sedan', t: now },
    'progress.points': { v: 88500, t: now },
    'progress.earned': { v: 148500, t: now },
    'records.bestScore': { v: 42800, t: now },
    'records.bestDistance': { v: 18600, t: now },
    'records.bestCombo': { v: 12, t: now },
    'tutorial.completed': { v: true, t: now },
    'tutorial.rewarded': { v: true, t: now },
    'owned.sedan': { v: true, t: now },
    'owned.motorcycle': { v: true, t: now },
    'owned.truck': { v: true, t: now },
    'owned.jet': { v: true, t: now },
    'paint.sedan': { v: 'stock', t: now },
    'paint.motorcycle': { v: 'stock', t: now },
    'paint.truck': { v: 'stock', t: now },
    'paint.jet': { v: 'nebula', t: now }
  };
  const paints = {
    sedan: ['stock', 'nitro', 'emerald', 'amethyst', 'gold'],
    motorcycle: ['stock', 'crimson', 'lime', 'plasma', 'aurum'],
    truck: ['stock', 'desert', 'cobalt', 'obsidian', 'gilded'],
    jet: ['stock', 'ion', 'supernova', 'nebula', 'celestial']
  };
  Object.keys(paints).forEach(v => {
    paints[v].forEach(p => {
      fields['paintOwned.' + v + '_' + p] = { v: true, t: now };
    });
  });
  const doc = JSON.stringify({ v: 1, w: 'director', c: 99, f: fields });
  try {
    localStorage.setItem('horizon-drive-settings-v1', doc);
    sessionStorage.setItem('horizon-drive-settings-v1', doc);
  } catch (_) {}

  // 2. 接管虚拟时钟与 requestAnimationFrame，支持实时自动运行或逐帧确定性步进
  let virtualNow = 1000.0;
  let steppingMode = false;
  let rafQueue = [];
  let rafIdCounter = 1;
  const origRAF = window.requestAnimationFrame.bind(window);
  const origPerfNow = performance.now.bind(performance);

  performance.now = function() {
    return steppingMode ? virtualNow : origPerfNow();
  };

  window.requestAnimationFrame = function(cb) {
    if (!steppingMode) {
      return origRAF((ts) => {
        virtualNow = ts;
        cb(ts);
      });
    }
    const id = ++rafIdCounter;
    rafQueue.push({ id, cb });
    return id;
  };

  window.cancelAnimationFrame = function(id) {
    rafQueue = rafQueue.filter(item => item.id !== id);
  };

  window.__ENABLE_STEPPER__ = function(enable) {
    if (enable && !steppingMode) {
      virtualNow = origPerfNow();
      steppingMode = true;
    } else if (!enable) {
      steppingMode = false;
    }
  };

  window.__STEP_FRAME__ = function(dtMs = 16.6667) {
    virtualNow += dtMs;
    const batch = rafQueue.slice();
    rafQueue = [];
    for (let i = 0; i < batch.length; i++) {
      try {
        batch[i].cb(virtualNow);
      } catch (e) {
        console.error(e);
      }
    }
    return virtualNow;
  };

  // 3. 锁定横竖屏视口方向，防止竖屏录制时被桌面端检测强制旋转 90 度
  const initOrient = window.__INIT_ORIENTATION__ || 'landscape';
  window.addEventListener('DOMContentLoaded', () => {
    window.dispatchEvent(new CustomEvent('horizon-viewport-container', {
      detail: { deviceType: initOrient === 'portrait' ? 'phone' : 'desktop' }
    }));
    window.HorizonDriveAutoOrientation = () => initOrient;
    document.documentElement.setAttribute('data-orientation', initOrient);
    document.documentElement.setAttribute('data-rotated', 'false');
  });

  // 4. 拦截路线洗牌器，使每次切换座驾时都能精确进入指定的黄金主题赛段
  window.__TARGET_SEGMENT_KINDS__ = ['bridge', 'coast', 'sakura', 'city', 'canyon', 'viaduct'];
  const origDefineProperty = Object.defineProperty;
  let mapsObj = null;
  Object.defineProperty(window, '__HD_MAPS__', {
    configurable: true,
    enumerable: true,
    get() { return mapsObj; },
    set(val) {
      if (val && typeof val.shuffleRoute === 'function' && Array.isArray(val.ROUTE_SEGMENTS)) {
        const origShuffle = val.shuffleRoute;
        val.shuffleRoute = function(rng) {
          const preferred = window.__TARGET_SEGMENT_KINDS__ || [];
          const byKind = {};
          val.ROUTE_SEGMENTS.forEach(s => { byKind[s.kind] = Object.assign({}, s, { length: 900, fork: false }); });
          const custom = [];
          preferred.forEach(k => { if (byKind[k]) custom.push(Object.assign({}, byKind[k])); });
          val.ROUTE_SEGMENTS.forEach(s => {
            if (!preferred.includes(s.kind)) custom.push(Object.assign({}, s, { length: 900, fork: false }));
          });
          return custom;
        };
      }
      mapsObj = val;
    }
  });
})();
"""


class CDPRecorder:
    def __init__(self, ws):
        self.ws = ws
        self.msg_id = 0

    async def call(self, method: str, params: dict = None):
        self.msg_id += 1
        mid = self.msg_id
        payload = {"id": mid, "method": method}
        if params:
            payload["params"] = params
        await self.ws.send(json.dumps(payload))
        while True:
            raw = await self.ws.recv()
            resp = json.loads(raw)
            if resp.get("id") == mid:
                if "error" in resp:
                    raise RuntimeError(f"CDP error in {method}: {resp['error']}")
                return resp.get("result", {})

    async def eval_js(self, expr: str):
        res = await self.call(
            "Runtime.evaluate",
            {"expression": expr, "returnByValue": True, "awaitPromise": True},
        )
        return res.get("result", {}).get("value")

    async def capture_pil(self) -> Image.Image:
        res = await self.call(
            "Page.captureScreenshot",
            {"format": "jpeg", "quality": 94, "optimizeForSpeed": True},
        )
        b64 = res["data"]
        raw = base64.b64decode(b64)
        return Image.open(io.BytesIO(raw)).convert("RGB")


async def setup_scene(
    cdp: CDPRecorder,
    vehicle: str,
    camera: str,
    segment_kinds: list,
    sky_time: float,
    paint_id: str = "stock",
    orientation: str = "landscape",
):
    """切换座驾、赛段、视角、车漆与天色，并在实时模式下预热直到 3D 场景稳定处于高速运行态"""
    await cdp.eval_js("window.__ENABLE_STEPPER__(false);")
    js_code = f"""
    (() => {{
      window.__TARGET_SEGMENT_KINDS__ = {json.dumps(segment_kinds)};
      const docEl = document.documentElement;
      // 1. 使用官方 Wallet API 解锁全部座驾与高定涂装
      if (window.HorizonDriveWallet) {{
        window.HorizonDriveWallet.earn(100000);
        window.HorizonDriveWallet.earn(100000);
        window.HorizonDriveWallet.earn(100000);
        ['sedan', 'motorcycle', 'truck', 'jet'].forEach(v => {{
          window.HorizonDriveWallet.purchase(v);
          (window.HorizonDriveWallet.paintsFor(v) || []).forEach(p => {{
            window.HorizonDriveWallet.purchasePaint(v, p.id);
          }});
        }});
        window.HorizonDriveWallet.selectPaint({json.dumps(vehicle)}, {json.dumps(paint_id)});
      }}
      if (window.HorizonDriveSettings) {{
        window.HorizonDriveSettings.set('lang', 'en');
        window.HorizonDriveSettings.set('display', {{
          orientation: {json.dumps(orientation)},
          camera: {json.dumps(camera)},
          controls: 'buttons'
        }});
        window.HorizonDriveSettings.set('graphics', {{ lighting: true }});
        window.HorizonDriveSettings.set('vehicle', {json.dumps(vehicle)});
        window.HorizonDriveSettings.commit({{
          'mods.on.invincible': true,
          'tutorial.completed': true
        }});
      }}
      docEl.setAttribute('data-lang', 'en');
      docEl.setAttribute('data-orientation', {json.dumps(orientation)});
      docEl.setAttribute('data-rotated', 'false');
      docEl.setAttribute('data-camera', {json.dumps(camera)});
      docEl.setAttribute('data-vehicle', {json.dumps(vehicle)});
      // 清空旧场景遥测引用，确保下方轮询等待新座驾 3D 场景完整就绪
      window.__HD_TELEMETRY__ = null;
      const gOverlay = document.querySelector('.garage-overlay');
      if (gOverlay) gOverlay.hidden = true;
      window.dispatchEvent(new CustomEvent('horizon-ad-state', {{ detail: false }}));
      window.dispatchEvent(new CustomEvent('garage-vehicle-confirmed'));
      return true;
    }})()
    """
    await cdp.eval_js(js_code)

    # 等待新场景加载就绪并进入 running 模式
    for _ in range(80):
        await asyncio.sleep(0.1)
        ready = await cdp.eval_js(f"""
        (() => {{
          const orient = {json.dumps(orientation)};
          if (window.HorizonDriveAutoOrientation) window.HorizonDriveAutoOrientation = () => orient;
          document.documentElement.setAttribute('data-orientation', orient);
          document.documentElement.setAttribute('data-rotated', 'false');
          const t = window.__HD_TELEMETRY__;
          const main = document.querySelector('main[data-mode="running"]');
          return !!(t && t.director && t.state && t.state.mode === 'running' && main);
        }})()
        """)
        if ready:
            break

    # 隐藏新手引导浮窗与顶部键位条，使试玩视频画面干净大气
    await cdp.eval_js(f"""
    (() => {{
      const styleId = 'trailer-clean-style';
      if (!document.getElementById(styleId)) {{
        const st = document.createElement('style');
        st.id = styleId;
        st.textContent = `
          .tutorial-card, .desktop-key-help, .desktop-hints-toggle, .run-ended-panel {{ display: none !important; }}
        `;
        document.head.appendChild(st);
      }}
      const d = window.__HD_TELEMETRY__ && window.__HD_TELEMETRY__.director;
      if (d) {{
        d.setEnv({sky_time}, true);
        if (d.ctrl) d.ctrl.key('w', true);
      }}
    }})()
    """)

    # 开启确定性 60FPS 步进器并预热 25 帧让光影、车流与粒子尾焰完全铺开
    await cdp.eval_js("window.__ENABLE_STEPPER__(true);")
    for _ in range(25):
        await cdp.eval_js(f"""
        (() => {{
          const d = window.__HD_TELEMETRY__ && window.__HD_TELEMETRY__.director;
          if (d) {{
            d.setEnv({sky_time}, true);
            d.setSpeedAndNos(280, true, 12500, 3);
          }}
          window.__STEP_FRAME__({DT_MS});
        }})()
        """)


async def record_all_scenes_for_mode(orientation: str, width: int, height: int) -> list:
    """
    在指定分辨率与横竖屏模式下，完整录制 6 大实机高能名场面并返回 PIL Image 列表
    """
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    tmp_dir = tempfile.mkdtemp(prefix=f"cg_rec_{orientation}_")
    port = 9244 if orientation == "landscape" else 9245

    chrome = subprocess.Popen(
        [
            CHROME_PATH,
            f"--user-data-dir={tmp_dir}",
            "--headless=new",
            f"--remote-debugging-port={port}",
            f"--window-size={width},{height}",
            "--enable-gpu",
            "--use-angle=d3d11",
            "--autoplay-policy=no-user-gesture-required",
            "--hide-scrollbars",
            "--mute-audio",
            "--no-first-run",
            "about:blank",
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    try:
        # 等待 Chrome CDP 端口就绪
        ws_url = None
        for _ in range(30):
            time.sleep(0.25)
            try:
                tabs = json.loads(opener.open(f"http://127.0.0.1:{port}/json").read().decode())
                pages = [t for t in tabs if t.get("type") == "page"]
                if pages:
                    ws_url = pages[0]["webSocketDebuggerUrl"]
                    break
            except Exception:
                pass
        if not ws_url:
            raise RuntimeError("Failed to connect to Chrome CDP")

        async with websockets.connect(ws_url, max_size=80 * 1024 * 1024) as ws:
            cdp = CDPRecorder(ws)
            await cdp.call("Page.enable")
            await cdp.call("Runtime.enable")
            await cdp.call(
                "Emulation.setDeviceMetricsOverride",
                {
                    "width": width,
                    "height": height,
                    "deviceScaleFactor": 1,
                    "mobile": orientation == "portrait",
                },
            )
            await cdp.call(
                "Page.addScriptToEvaluateOnNewDocument",
                {
                    "source": f"window.__INIT_ORIENTATION__ = {json.dumps(orientation)};\n"
                    + INIT_DOCUMENT_SCRIPT
                },
            )
            await cdp.call("Page.navigate", {"url": "http://127.0.0.1:8099/index.html"})
            await asyncio.sleep(3.2)

            scenes = {}

            # =================================================================
            # Scene 1: 疾风 GT 轿跑 (Cobalt GT) · 碧海大桥 355 km/h NOS 蓝焰冲刺 + 360° 旋转特技
            # 帧数：200 帧
            # =================================================================
            print(f"[{orientation}] Recording Scene 1: Cobalt GT NOS Boost & 360 Spin on Azure Sea Bridge...")
            await setup_scene(
                cdp,
                vehicle="sedan",
                camera="third",
                segment_kinds=["bridge", "coast"],
                sky_time=68.0,  # 绚丽晚霞+晴空海面
                paint_id="stock",
                orientation=orientation,
            )
            await cdp.eval_js("""
            (() => {
              const d = window.__HD_TELEMETRY__.director;
              d.setupTrafficShowcase('dense_overtake', 30);
              d.banner('⚡ NEAR MISS ×5!  +750 PTS & NOS +22%', 3.5);
            })()
            """)
            s1_frames = []
            for f in range(200):
                steer = 0.42 * np.sin(f * 0.085)
                lane_x = 1.6 * np.sin(f * 0.055)
                trig_spin = "true" if f == 95 else "false"
                trig_banner = "true" if f == 100 else "false"
                await cdp.eval_js(f"""
                (() => {{
                  const d = window.__HD_TELEMETRY__.director;
                  d.setEnv(68.0, true);
                  d.setSpeedAndNos(352, true, 18450 + {f}*45, 5);
                  d.setLane({lane_x:.3f}, {steer:.3f});
                  if ({trig_spin} && d.ctrl) d.ctrl.stunt('spin');
                  if ({trig_banner}) d.banner('🌀 360° DRIFT MASTER!  1.8s SHIELD & NOS +25%', 3.0);
                  window.__STEP_FRAME__({DT_MS});
                }})()
                """)
                s1_frames.append(await cdp.capture_pil())
            scenes["s1"] = s1_frames

            # =================================================================
            # Scene 2: 幻影重机 (Phantom R1 Superbike) · 樱花大道双车刀锋钻缝 + 高速翘头 + 压弯
            # 帧数：220 帧
            # =================================================================
            print(f"[{orientation}] Recording Scene 2: Phantom R1 Superbike Lane Split & Wheelie on Sakura Avenue...")
            await setup_scene(
                cdp,
                vehicle="motorcycle",
                camera="third",
                segment_kinds=["sakura", "city"],
                sky_time=22.0,  # 明媚晴空展现粉白樱花大道与青色仿赛重机
                paint_id="stock",
                orientation=orientation,
            )
            await cdp.eval_js("""
            (() => {
              const d = window.__HD_TELEMETRY__.director;
              d.setupTrafficShowcase('split', 42);
              d.banner('⚡ LANE SPLIT ×8!  +180 PTS & NOS +14%', 3.5);
            })()
            """)
            s2_frames = []
            for f in range(220):
                # 前 75 帧对准中线 x=0 极速钻过双车夹缝并翘头；后段大倾角左右压弯侧挂 (Knee-down)
                if f < 80:
                    lane_x = 0.0
                    steer = 0.0
                    wheelie = "true" if 15 <= f <= 72 else "false"
                else:
                    t_lean = (f - 80) * 0.09
                    lane_x = 2.6 * np.sin(t_lean)
                    steer = 0.85 * np.cos(t_lean)
                    wheelie = "false"
                respawn_split = "true" if f == 95 else "false"
                banner_wheelie = "true" if f == 82 else "false"
                await cdp.eval_js(f"""
                (() => {{
                  const d = window.__HD_TELEMETRY__.director;
                  d.setEnv(22.0, true);
                  d.setSpeedAndNos(396, true, 34200 + {f}*60, 8);
                  d.setLane({lane_x:.3f}, {steer:.3f});
                  if (d.ctrl) d.ctrl.setMobileInput({{ throttle: true, steering: {steer:.3f}, wheelie: {wheelie} }});
                  if ({respawn_split}) d.setupTrafficShowcase('dense_overtake', 36);
                  if ({banner_wheelie}) d.banner('🏍️ RAZOR WHEELIE COMBO!  +60 PTS/s & NOS +14%', 3.0);
                  window.__STEP_FRAME__({DT_MS});
                }})()
                """)
                s2_frames.append(await cdp.capture_pil())
            scenes["s2"] = s2_frames

            # =================================================================
            # Scene 3: 沉浸式第一人称座舱 · 向晚新城霓虹霞光双手打方向盘 + 远光闪灯路怒互动
            # 帧数：195 帧
            # =================================================================
            print(f"[{orientation}] Recording Scene 3: First-Person Cockpit Steering & Rival Interaction in Dusk Metro...")
            await setup_scene(
                cdp,
                vehicle="sedan",
                camera="first",
                segment_kinds=["city", "boulevard"],
                sky_time=73.0,  # 赛博向晚新城霓虹霞光
                paint_id="nitro",
                orientation=orientation,
            )
            await cdp.eval_js("""
            (() => {
              const d = window.__HD_TELEMETRY__.director;
              d.setupTrafficShowcase('dense_overtake', 28);
              if (d.ctrl) d.ctrl.flashLights(true);
              d.banner('💡 HIGH-BEAM CHALLENGE!  BEAT RIVAL FOR +120 PTS!', 3.2);
            })()
            """)
            s3_frames = []
            for f in range(195):
                # 幅度饱满的左右转向，驱动第一人称手绘双手握方向盘 9 帧精灵序列丝滑转动
                steer = 0.88 * np.sin(f * 0.095)
                lane_x = 2.4 * np.sin(f * 0.065)
                trig_beat = "true" if f == 95 else "false"
                await cdp.eval_js(f"""
                (() => {{
                  const d = window.__HD_TELEMETRY__.director;
                  d.setEnv(73.0, true);
                  d.setSpeedAndNos(338, true, 51800 + {f}*50, 9);
                  d.setLane({lane_x:.3f}, {steer:.3f});
                  if (d.ctrl) d.ctrl.setMobileInput({{ throttle: true, steering: {steer:.3f} }});
                  if ({trig_beat}) {{
                    if (d.ctrl) d.ctrl.horn();
                    d.banner('🔥 RIVAL OVERTAKEN!  +120 PTS BEATDOWN BONUS!', 3.0);
                  }}
                  window.__STEP_FRAME__({DT_MS});
                }})()
                """)
                s3_frames.append(await cdp.capture_pil())
            scenes["s3"] = s3_frames

            # =================================================================
            # Scene 4: 泰坦重型卡车 (Titan V12) · 层岩大峡谷开启 NOS 牛栏破障撞飞慢车
            # 帧数：195 帧
            # =================================================================
            print(f"[{orientation}] Recording Scene 4: Titan V12 Heavy Truck Bullbar Takedown in Grand Canyon...")
            await setup_scene(
                cdp,
                vehicle="truck",
                camera="third",
                segment_kinds=["canyon", "desert"],
                sky_time=35.0,  # 阳光照耀赤红大峡谷与熔岩红重卡镀铬牛栏
                paint_id="stock",
                orientation=orientation,
            )
            await cdp.eval_js("""
            (() => {
              const d = window.__HD_TELEMETRY__.director;
              d.setupTrafficShowcase('ram_target', 28);
              d.banner('🛡️ TITAN V12 NOS CHARGE!  BULLBAR ARMOR ACTIVE!', 3.0);
            })()
            """)
            s4_frames = []
            for f in range(195):
                lane_x = 0.8 * np.sin(f * 0.05)
                steer = 0.25 * np.cos(f * 0.05)
                toss_1 = "true" if f == 28 else "false"
                toss_2 = "true" if f == 105 else "false"
                await cdp.eval_js(f"""
                (() => {{
                  const d = window.__HD_TELEMETRY__.director;
                  d.setEnv(35.0, true);
                  d.setSpeedAndNos(335, true, 68400 + {f}*75, 10);
                  d.setLane({lane_x:.3f}, {steer:.3f});
                  if ({toss_1}) {{
                    d.tossCarNow(0, 1);
                    d.banner('💥 BULLBAR RAM TAKEDOWN!  +280 PTS & NOS +12%', 3.2);
                  }}
                  if ({toss_2}) {{
                    d.tossCarNow(1, -1);
                    d.banner('💥 DOUBLE HEAVY TAKEDOWN ×2!  +560 PTS!', 3.2);
                  }}
                  window.__STEP_FRAME__({DT_MS});
                }})()
                """)
                s4_frames.append(await cdp.capture_pil())
            scenes["s4"] = s4_frames

            # =================================================================
            # Scene 5: 天穹 V8 飞车 (Aether V8 Jet) · 云际高架 445 km/h 等离子机翼腾空跃障飞行
            # 帧数：175 帧
            # =================================================================
            print(f"[{orientation}] Recording Scene 5: Aether V8 Jet 445 km/h Aero Flight on Skyline Viaduct...")
            await setup_scene(
                cdp,
                vehicle="jet",
                camera="third",
                segment_kinds=["viaduct", "city"],
                sky_time=70.0,  # 晚霞云际高架摩天大楼群
                paint_id="nebula",
                orientation=orientation,
            )
            await cdp.eval_js("""
            (() => {
              const d = window.__HD_TELEMETRY__.director;
              d.setupTrafficShowcase('dense_overtake', 26);
              // 激活天穹 V8 飞车的战术跃障飞行模式
              const flyBtn = document.querySelector('.jet-flight-button');
              if (flyBtn) flyBtn.click();
              d.banner('✈️ AERO APEX FLIGHT ENGAGED!  445 KM/H SUPERSONIC!', 3.5);
            })()
            """)
            s5_frames = []
            for f in range(175):
                lane_x = 1.8 * np.sin(f * 0.06)
                steer = 0.45 * np.cos(f * 0.06)
                trig_spin = "true" if f == 80 else "false"
                await cdp.eval_js(f"""
                (() => {{
                  const d = window.__HD_TELEMETRY__.director;
                  d.setEnv(70.0, true);
                  d.setSpeedAndNos(442, true, 89600 + {f}*80, 12);
                  d.setLane({lane_x:.3f}, {steer:.3f});
                  if ({trig_spin} && d.ctrl) d.ctrl.stunt('spin');
                  window.__STEP_FRAME__({DT_MS});
                }})()
                """)
                s5_frames.append(await cdp.capture_pil())
            scenes["s5"] = s5_frames

            # =================================================================
            # Scene 6: 3D 旋转车库与定制涂装工坊快闪巡礼 (Garage & Custom Liveries)
            # 帧数：100 帧
            # =================================================================
            print(f"[{orientation}] Recording Scene 6: 3D Garage & Custom Paint Livery Showcase...")
            await cdp.eval_js("""
            (() => {
              window.__ENABLE_STEPPER__(false);
              const gBtn = document.querySelector('.hud-garage-btn, .garage-preview');
              if (gBtn) gBtn.click();
            })()
            """)
            await asyncio.sleep(0.6)
            await cdp.eval_js("window.__ENABLE_STEPPER__(true);")

            # 在 100 帧内依次快闪展示 4 辆座驾的高定车漆与五维属性条
            showcase_plan = [
                (0, "sedan", "gold"),
                (25, "motorcycle", "crimson"),
                (50, "truck", "cobalt"),
                (75, "jet", "celestial"),
            ]
            s6_frames = []
            for f in range(100):
                for trig_f, veh_id, p_id in showcase_plan:
                    if f == trig_f:
                        await cdp.eval_js(f"""
                        (() => {{
                          const opt = document.querySelector('.vehicle-option[data-vehicle="{veh_id}"]');
                          if (opt) opt.click();
                          setTimeout(() => {{
                            const sw = document.querySelector('.garage-paint-swatch[data-paint="{p_id}"]');
                            if (sw) sw.click();
                          }}, 10);
                        }})()
                        """)
                        await asyncio.sleep(0.08)
                await cdp.eval_js(f"window.__STEP_FRAME__({DT_MS});")
                s6_frames.append(await cdp.capture_pil())
            scenes["s6"] = s6_frames

            return scenes
    finally:
        chrome.terminate()
        shutil.rmtree(tmp_dir, ignore_errors=True)


# ============================================================================
# 三、1,080 帧 (18.0 秒 @ 60FPS) 快节奏蒙太奇转场合成与 FFmpeg H.264 编码
# ============================================================================
def crossfade_with_flash(img_a: Image.Image, img_b: Image.Image, alpha: float) -> Image.Image:
    """
    动感极速转场（Speed Whip Crossfade）：在切镜中心叠加轻微高光能量脉冲，使转场如街机大片般干净利落
    """
    blended = Image.blend(img_a, img_b, alpha)
    flash_strength = np.sin(alpha * np.pi) * 0.22
    if flash_strength > 0.01:
        blended = ImageEnhance.Brightness(blended).enhance(1.0 + flash_strength)
        blended = ImageEnhance.Contrast(blended).enhance(1.0 + flash_strength * 0.5)
    return blended


def assemble_1080_frames(scenes: dict, cover_img: Image.Image, width: int, height: int) -> list:
    """
    将封面图与 6 幕实机高光镜头精确组装为 1,080 帧 (18.00 秒 @ 60 FPS)
    - Frame 0..23 (24f, 0.4s)   : 封面图静态定格 -> 动态推进融合至 Scene 1
    - Scene 1..6 实机高光蒙太奇 : 段间采用 8 帧动感闪白叠化转场
    - 最后 14 帧                : 平滑回切至封面图，形成完美无缝循环 (Seamless Loop)
    """
    cover_resized = cover_img.resize((width, height), Image.Resampling.LANCZOS)

    # 1. 开场 24 帧：前 8 帧保持清晰封面首帧（满足 CrazyGames Hover 首帧零跳变要求），后 16 帧动态放大切入 Scene 1
    opening = []
    s1 = scenes["s1"]
    for i in range(24):
        if i < 8:
            opening.append(cover_resized)
        else:
            t = (i - 8) / 16.0
            # 对封面施加微距推进 zoom
            zoom = 1.0 + 0.08 * t
            zw, zh = int(width * zoom), int(height * zoom)
            z_img = cover_resized.resize((zw, zh), Image.Resampling.BILINEAR)
            left = (zw - width) // 2
            top = (zh - height) // 2
            c_zoom = z_img.crop((left, top, left + width, top + height))
            opening.append(crossfade_with_flash(c_zoom, s1[i - 8], t))

    # 2. 拼接 6 大实机场景（带 8 帧 Speed Whip 转场）
    trans_len = 8
    s1_body = scenes["s1"][16:]  # 184f
    s2_body = scenes["s2"]       # 220f
    s3_body = scenes["s3"]       # 195f
    s4_body = scenes["s4"]       # 195f
    s5_body = scenes["s5"]       # 175f
    s6_body = scenes["s6"]       # 100f

    clips = [s1_body, s2_body, s3_body, s4_body, s5_body, s6_body]
    timeline = list(opening)

    cur = clips[0]
    for nxt in clips[1:]:
        timeline.extend(cur[:-trans_len])
        for k in range(trans_len):
            a = (k + 1) / (trans_len + 1)
            timeline.append(crossfade_with_flash(cur[-trans_len + k], nxt[k], a))
        cur = nxt[trans_len:]
    timeline.extend(cur)

    # 精确校准总长度为 1,080 帧 (18.00 秒)，并在最后 14 帧平滑过渡回封面实现无限循环
    target_total = 1080
    loop_fade = 14
    if len(timeline) < target_total:
        while len(timeline) < target_total:
            timeline.append(timeline[-1])
    elif len(timeline) > target_total:
        timeline = timeline[:target_total]

    for k in range(loop_fade):
        idx = target_total - loop_fade + k
        a = (k + 1) / loop_fade
        timeline[idx] = crossfade_with_flash(timeline[idx], cover_resized, a)

    return timeline


def encode_mp4(frames: list, out_path: str, width: int, height: int, with_audio: bool = False):
    """通过 FFmpeg 管道将 1,080 帧 RGB 图像编码为高画质 60FPS H.264 MP4"""
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    cmd = [
        FFMPEG_EXE,
        "-y",
        "-f", "rawvideo",
        "-vcodec", "rawvideo",
        "-s", f"{width}x{height}",
        "-pix_fmt", "rgb24",
        "-r", str(FPS),
        "-i", "-",
    ]
    if with_audio and os.path.exists(BGM_PATH):
        # 截取原创粤语战歌《踩尽油门》00:44 副歌高潮 Drop 段，带首尾淡入淡出
        cmd.extend([
            "-ss", "44.0",
            "-t", "18.0",
            "-i", BGM_PATH,
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "19",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            "-b:a", "192k",
            "-af", "afade=t=in:st=0:d=0.4,afade=t=out:st=16.8:d=1.2",
            "-movflags", "+faststart",
            "-shortest",
            out_path,
        ])
    else:
        # CrazyGames 官方悬停预览版：严格无音轨 (-an)
        cmd.extend([
            "-an",
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "20",
            "-pix_fmt", "yuv420p",
            "-movflags", "+faststart",
            out_path,
        ])

    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for frm in frames:
        if frm.size != (width, height):
            frm = frm.resize((width, height), Image.Resampling.LANCZOS)
        proc.stdin.write(frm.tobytes())
    proc.stdin.close()
    proc.wait()
    if proc.returncode != 0:
        raise RuntimeError(f"FFmpeg failed for {out_path} with code {proc.returncode}")
    size_mb = os.path.getsize(out_path) / (1024 * 1024)
    print(f"[OK] Video encoded: {out_path} ({len(frames)} frames, {len(frames)/FPS:.1f}s @ {FPS}fps, {size_mb:.2f} MB)")


async def main():
    httpd = start_local_server(8099)
    try:
        # 1. 录制并编码 16:9 横屏试玩视频 (1920 x 1080)
        land_cover = Image.open(os.path.join(COVERS_DIR, "cover-landscape-1920x1080.png")).convert("RGB")
        land_scenes = await record_all_scenes_for_mode("landscape", 1920, 1080)
        land_frames = assemble_1080_frames(land_scenes, land_cover, 1920, 1080)

        out_land_silent = os.path.join(VIDEOS_DIR, "video-preview-landscape-1920x1080.mp4")
        out_land_bgm = os.path.join(VIDEOS_DIR, "trailer-with-bgm-1920x1080.mp4")
        encode_mp4(land_frames, out_land_silent, 1920, 1080, with_audio=False)
        encode_mp4(land_frames, out_land_bgm, 1920, 1080, with_audio=True)

        # 保存一张横版视频高光分镜九宫格预览图供快速检视
        save_contact_sheet(land_frames, os.path.join(VIDEOS_DIR, "contact-sheet-landscape.jpg"), 1920, 1080)

        # 2. 录制并编码 2:3 竖屏试玩视频 (1080 x 1620)
        port_cover = Image.open(os.path.join(COVERS_DIR, "cover-portrait-800x1200.png")).convert("RGB")
        port_scenes = await record_all_scenes_for_mode("portrait", 1080, 1620)
        port_frames = assemble_1080_frames(port_scenes, port_cover, 1080, 1620)

        out_port_silent = os.path.join(VIDEOS_DIR, "video-preview-portrait-1080x1620.mp4")
        encode_mp4(port_frames, out_port_silent, 1080, 1620, with_audio=False)
        save_contact_sheet(port_frames, os.path.join(VIDEOS_DIR, "contact-sheet-portrait.jpg"), 1080, 1620)

        # 清理临时测试单帧
        test_frame_path = os.path.join(VIDEOS_DIR, "test_frame.jpg")
        if os.path.exists(test_frame_path):
            os.remove(test_frame_path)

    finally:
        httpd.shutdown()


def save_contact_sheet(frames: list, out_jpg: str, w: int, h: int):
    """提取视频 6 个关键时间点的代表帧拼成一张高光分镜检视图"""
    indices = [0, 90, 290, 500, 690, 880, 1010]
    cols = 4
    rows = 2
    thumb_w = 480
    thumb_h = int(round(thumb_w * (h / w)))
    sheet = Image.new("RGB", (cols * thumb_w, rows * thumb_h), (10, 15, 28))
    for i, f_idx in enumerate(indices):
        if i >= cols * rows:
            break
        frm = frames[min(len(frames) - 1, f_idx)].resize((thumb_w, thumb_h), Image.Resampling.LANCZOS)
        r = i // cols
        c = i % cols
        sheet.paste(frm, (c * thumb_w, r * thumb_h))
    sheet.save(out_jpg, format="JPEG", quality=90)
    print(f"[OK] Contact sheet saved: {out_jpg}")


if __name__ == "__main__":
    asyncio.run(main())
