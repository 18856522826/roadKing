#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
============================================================================
《地平线狂飙：无尽公路》(Horizon Overdrive) - 本地静态资源与局域网信令服务器 (server.py)
============================================================================
功能说明：
1. 静态文件服务：提供高性能本地 HTTP 服务，支持 UTF-8 编码与免缓存实时加载。
2. 内置局域网房间与 WebRTC 信令引擎 (/api/mp/*)：
   - 支持单机多开浏览器窗口或局域网（0.0.0.0）好友建房、6 位房间号加入与公开房间匹配。
============================================================================
"""

import http.server
import json
import os
import random
import secrets
import socket
import socketserver
import sys
import threading
import time
import urllib.parse
import webbrowser

# ==================== 内置局域网房间与 WebRTC 信令状态机 ====================
ROOM_LOCK = threading.Lock()
ROOMS = {}       # code -> Room dict
TOKENS = {}      # token -> (room_code, member_id)


def _generate_room_code() -> str:
    """生成唯一的 6 位数字房间号"""
    for _ in range(100):
        code = f"{random.randint(100000, 999999)}"
        if code not in ROOMS:
            return code
    return f"{int(time.time()) % 900000 + 100000}"


def _serialize_room(room: dict, self_id: str) -> dict:
    """将房间内部状态序列化为客户端所需的标准响应格式"""
    members_out = []
    host_id = room["hostId"]
    for m in room["members"]:
        mid = m["id"]
        links = m.get("links", set())
        if mid == host_id:
            others = [x["id"] for x in room["members"] if x["id"] != host_id]
            is_ready = all(oid in links for oid in others)
        else:
            is_ready = host_id in links
        members_out.append({
            "id": mid,
            "host": mid == host_id,
            "ready": is_ready
        })

    return {
        "code": room["code"],
        "mode": room["mode"],
        "visibility": room["visibility"],
        "started": room["started"],
        "matchingPaused": False,
        "selfId": self_id,
        "iceServers": [{"urls": "stun:stun.l.google.com:19302"}],
        "members": members_out
    }


def _cleanup_expired_rooms():
    """清理超过 10 分钟未活动的过期房间"""
    now = time.time()
    expired = [code for code, r in ROOMS.items() if now - r.get("updatedAt", now) > 600]
    for code in expired:
        room = ROOMS.pop(code, None)
        if room:
            for m in room.get("members", []):
                TOKENS.pop(m.get("token"), None)


class HorizonDriveHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """自定义 HTTP 请求处理器：支持静态资源服务与 /api/mp/* 局域网联机信令接口"""

    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.js': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.html': 'text/html; charset=utf-8',
        '.svg': 'image/svg+xml',
        '.png': 'image/png',
        '.mp3': 'audio/mpeg',
        '.json': 'application/json; charset=utf-8',
    }

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        if self.path.startswith('/api/mp/'):
            self._handle_multiplayer('GET')
            return
        super().do_GET()

    def do_POST(self):
        if self.path.startswith('/api/mp/'):
            self._handle_multiplayer('POST')
            return
        self.send_error(405, "Method Not Allowed")

    def _send_json(self, status: int, payload: dict):
        body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_json_body(self) -> dict:
        length = int(self.headers.get('Content-Length') or 0)
        if length <= 0:
            return {}
        raw = self.rfile.read(length)
        try:
            return json.loads(raw.decode('utf-8'))
        except Exception:
            return {}

    def _auth_member(self):
        """从 Authorization: Bearer <token> 解析当前房间与成员"""
        auth = self.headers.get('Authorization') or ''
        token = auth[7:].strip() if auth.startswith('Bearer ') else ''
        if not token or token not in TOKENS:
            return None, None, None
        code, member_id = TOKENS[token]
        room = ROOMS.get(code)
        if not room:
            return None, None, None
        member = next((m for m in room["members"] if m["id"] == member_id), None)
        if not member:
            return None, None, None
        room["updatedAt"] = time.time()
        return room, member, token

    def _handle_multiplayer(self, method: str):
        """处理 /api/mp/* 局域网联机请求"""
        subpath = self.path[len('/api/mp'):]
        parsed = urllib.parse.urlparse(subpath)
        route = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        with ROOM_LOCK:
            _cleanup_expired_rooms()

            # 1. 健康检查
            if method == 'GET' and route == '/health':
                self._send_json(200, {"ok": True, "service": "horizon-drive-rooms-local", "version": 5})
                return

            # 2. 创建房间
            if method == 'POST' and route == '/rooms':
                data = self._read_json_body()
                mode = data.get("mode") if data.get("mode") in ("normal", "simulation") else "normal"
                visibility = data.get("visibility") if data.get("visibility") in ("public", "private") else "private"
                code = _generate_room_code()
                member_id = secrets.token_hex(6)
                token = secrets.token_urlsafe(18)
                room = {
                    "code": code,
                    "mode": mode,
                    "visibility": visibility,
                    "started": False,
                    "hostId": member_id,
                    "updatedAt": time.time(),
                    "seq": 0,
                    "members": [{
                        "id": member_id,
                        "token": token,
                        "links": set(),
                        "signals": []
                    }]
                }
                ROOMS[code] = room
                TOKENS[token] = (code, member_id)
                self._send_json(200, {"token": token, "room": _serialize_room(room, member_id)})
                return

            # 3. 通过 6 位房间号加入房间
            if method == 'POST' and route == '/join':
                data = self._read_json_body()
                code = str(data.get("code") or "").strip()
                room = ROOMS.get(code)
                if not room:
                    self._send_json(404, {"error": "房间不存在或已解散，请确认6位房间号。"})
                    return
                if room["started"]:
                    self._send_json(409, {"error": "该房间游戏已经开始，无法中途加入。"})
                    return
                if len(room["members"]) >= 3:
                    self._send_json(409, {"error": "该房间已满员（最多 3 人）。"})
                    return
                member_id = secrets.token_hex(6)
                token = secrets.token_urlsafe(18)
                room["members"].append({
                    "id": member_id,
                    "token": token,
                    "links": set(),
                    "signals": []
                })
                room["updatedAt"] = time.time()
                TOKENS[token] = (code, member_id)
                self._send_json(200, {"token": token, "room": _serialize_room(room, member_id)})
                return

            # 4. 随机匹配公开房间
            if method == 'POST' and route == '/match':
                data = self._read_json_body()
                exclude = set(data.get("exclude") or [])
                candidates = [
                    r for r in ROOMS.values()
                    if r["visibility"] == "public" and not r["started"] and len(r["members"]) < 3 and r["code"] not in exclude
                ]
                if not candidates:
                    self._send_json(404, {"error": "当前暂无公开房间"})
                    return
                room = candidates[0]
                member_id = secrets.token_hex(6)
                token = secrets.token_urlsafe(18)
                room["members"].append({
                    "id": member_id,
                    "token": token,
                    "links": set(),
                    "signals": []
                })
                room["updatedAt"] = time.time()
                TOKENS[token] = (room["code"], member_id)
                self._send_json(200, {"token": token, "room": _serialize_room(room, member_id)})
                return

            # 5. 轮询房间状态与 WebRTC 信令队列
            if method == 'GET' and route == '/room':
                room, member, _ = self._auth_member()
                if not room:
                    self._send_json(404, {"error": "房间已结束或连接已失效。"})
                    return
                ack = 0
                try:
                    ack = int((query.get("ack") or ["0"])[0])
                except ValueError:
                    ack = 0
                if ack > 0:
                    member["signals"] = [s for s in member["signals"] if s["seq"] > ack]
                self._send_json(200, {
                    "room": _serialize_room(room, member["id"]),
                    "signals": member["signals"]
                })
                return

            # 6. 转发 WebRTC SDP Offer / Answer 信令
            if method == 'POST' and route == '/signal':
                room, member, _ = self._auth_member()
                if not room:
                    self._send_json(404, {"error": "房间不存在"})
                    return
                data = self._read_json_body()
                to_id = data.get("to")
                sig_type = data.get("type")
                sdp = data.get("sdp")
                target = next((m for m in room["members"] if m["id"] == to_id), None)
                if not target or sig_type not in ("offer", "answer") or not isinstance(sdp, str):
                    self._send_json(400, {"error": "无效的信令参数"})
                    return
                room["seq"] += 1
                target["signals"].append({
                    "seq": room["seq"],
                    "from": member["id"],
                    "type": sig_type,
                    "sdp": sdp
                })
                self._send_json(200, {"ok": True})
                return

            # 7. 上报已连通的 P2P 节点列表
            if method == 'POST' and route == '/ready':
                room, member, _ = self._auth_member()
                if not room:
                    self._send_json(404, {"error": "房间不存在"})
                    return
                data = self._read_json_body()
                links = data.get("links")
                if isinstance(links, list):
                    member["links"] = set(str(x) for x in links)
                self._send_json(200, {"room": _serialize_room(room, member["id"])})
                return

            # 8. 房主开始游戏
            if method == 'POST' and route == '/start':
                room, member, _ = self._auth_member()
                if not room:
                    self._send_json(404, {"error": "房间不存在"})
                    return
                if member["id"] != room["hostId"]:
                    self._send_json(403, {"error": "只有房主可以开始游戏"})
                    return
                room["started"] = True
                self._send_json(200, {"room": _serialize_room(room, member["id"])})
                return

            # 9. 踢出未就绪成员
            if method == 'POST' and route == '/kick':
                room, member, _ = self._auth_member()
                if not room or member["id"] != room["hostId"]:
                    self._send_json(403, {"error": "无权限操作"})
                    return
                data = self._read_json_body()
                kick_ids = set(data.get("members") or [])
                kick_ids.discard(room["hostId"])
                removed = [m for m in room["members"] if m["id"] in kick_ids]
                for m in removed:
                    TOKENS.pop(m.get("token"), None)
                room["members"] = [m for m in room["members"] if m["id"] not in kick_ids]
                self._send_json(200, {"room": _serialize_room(room, member["id"])})
                return

            # 10. 离开或解散房间
            if method == 'POST' and route == '/leave':
                room, member, token = self._auth_member()
                if not room:
                    self._send_json(200, {"ok": True})
                    return
                if member["id"] == room["hostId"]:
                    ROOMS.pop(room["code"], None)
                    for m in room["members"]:
                        TOKENS.pop(m.get("token"), None)
                else:
                    TOKENS.pop(token, None)
                    room["members"] = [m for m in room["members"] if m["id"] != member["id"]]
                self._send_json(200, {"ok": True})
                return

            # 11. 暂停/恢复公开房间随机匹配状态
            if method == 'POST' and route == '/presence':
                room, member, _ = self._auth_member()
                if not room:
                    self._send_json(404, {"error": "房间不存在"})
                    return
                self._send_json(200, {"ok": True})
                return

        self._send_json(404, {"error": f"未知接口: {route}"})

    def log_message(self, fmt, *args):
        sys.stdout.write(f"[HorizonDrive Server] {self.address_string()} - {fmt % args}\n")


def find_free_port(default_port=8080):
    """查找本地可用端口，优先使用 8080"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        if s.connect_ex(('127.0.0.1', default_port)) != 0:
            return default_port
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]


def get_lan_ip():
    """获取本机局域网 IP，方便同局域网设备访问"""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
    except Exception:
        return "127.0.0.1"


def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(root_dir)
    port = find_free_port(8080)
    url = f"http://127.0.0.1:{port}/index.html"
    lan_ip = get_lan_ip()
    lan_url = f"http://{lan_ip}:{port}/index.html"

    socketserver.ThreadingTCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(("0.0.0.0", port), HorizonDriveHTTPRequestHandler) as httpd:
        print("=" * 68)
        print("  《地平线狂飙：无尽公路》(Horizon Overdrive) 本地服务器已启动！")
        print(f"  本机游玩地址 : {url}")
        print(f"  局域网地址   : {lan_url}")
        print("  按 Ctrl+C 可停止服务")
        print("=" * 68)
        if "--no-browser" not in sys.argv:
            threading.Timer(0.6, lambda: webbrowser.open(url)).start()
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[HorizonDrive Server] 正在关闭本地服务，感谢游玩！")


if __name__ == "__main__":
    main()
