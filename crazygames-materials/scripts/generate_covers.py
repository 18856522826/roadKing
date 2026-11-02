# -*- coding: utf-8 -*-
"""
《地平线狂飙：无尽公路》(Horizon Overdrive) - CrazyGames 官方封面缩略图生成脚本
================================================================================
严格遵循 CrazyGames Developer Portal 封面规范：
1. 三种强制尺寸：
   - Landscape Cover (16:9) : 1920 x 1080 px
   - Portrait Cover (2:3)   : 800 x 1200 px
   - Square Cover (1:1)     : 800 x 800 px
2. 视觉与合规准则：
   - 满幅无边框 (Full-bleed, NO borders)
   - 包含高辨识度艺术化游戏主标题 "HORIZON OVERDRIVE"
   - 严禁包含 "Play Now", "New", "Updated" 等违规促销字样或外部商店图标
   - 2x 超采样抗锯齿矢量级金属铬渐变、立体 3D 挤压、斜切极速动感与霓虹辉光合成
================================================================================
"""

import os
import shutil
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageEnhance

# 路径配置
WORKSPACE_DIR = r"d:\AI项目集合\赛车游戏"
COVERS_DIR = os.path.join(WORKSPACE_DIR, "crazygames-materials", "covers")
ARTIFACT_DIR = r"C:\Users\earlyrise\.gemini\antigravity\brain\7bae1c28-2fbd-4b38-9d7e-51562a9ba4c9"

SRC_LANDSCAPE = os.path.join(ARTIFACT_DIR, "raw_base_landscape_1793544913975.jpg")
SRC_PORTRAIT = os.path.join(ARTIFACT_DIR, "raw_base_portrait_1793544937545.jpg")

FONT_IMPACT = r"C:\Windows\Fonts\impact.ttf"
FONT_BAHN = r"C:\Windows\Fonts\bahnschrift.ttf"
FONT_ARIAL_BD = r"C:\Windows\Fonts\arialbd.ttf"


def get_font(path, size):
    """安全加载指定字号字体，若不存在则回退系统粗体字体"""
    for candidate in [path, FONT_IMPACT, FONT_BAHN, FONT_ARIAL_BD]:
        if os.path.exists(candidate):
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default()


def crop_and_resize(img: Image.Image, target_w: int, target_h: int, focus_y: float = 0.5, focus_x: float = 0.5) -> Image.Image:
    """按目标宽高比居中/焦点裁剪并高质量缩放（无任何黑边或拉伸变形）"""
    src_w, src_h = img.size
    target_ratio = target_w / target_h
    src_ratio = src_w / src_h

    if src_ratio > target_ratio:
        # 原图更宽，按高度对齐裁剪宽度
        new_h = src_h
        new_w = int(round(src_h * target_ratio))
        left = int(round((src_w - new_w) * focus_x))
        left = max(0, min(src_w - new_w, left))
        top = 0
    else:
        # 原图更高，按宽度对齐裁剪高度
        new_w = src_w
        new_h = int(round(src_w / target_ratio))
        top = int(round((src_h - new_h) * focus_y))
        top = max(0, min(src_h - new_h, top))
        left = 0

    cropped = img.crop((left, top, left + new_w, top + new_h))
    return cropped.resize((target_w, target_h), Image.Resampling.LANCZOS)


def create_metallic_gradient(width: int, height: int, stops: list) -> Image.Image:
    """
    创建高精度垂直金属渐变纹理图像
    stops: [(pos_0_to_1, (R, G, B)), ...]
    """
    arr = np.zeros((height, width, 3), dtype=np.uint8)
    y_norm = np.linspace(0.0, 1.0, height)

    for c in range(3):
        xp = [s[0] for s in stops]
        fp = [s[1][c] for s in stops]
        col = np.interp(y_norm, xp, fp).astype(np.uint8)
        arr[:, :, c] = col[:, None]

    return Image.fromarray(arr, mode="RGB")


def render_stylized_word(
    text: str,
    font_size: int,
    gradient_stops: list,
    extrude_color: tuple,
    outline_color: tuple,
    glow_color: tuple,
    shear: float = 0.18,
    tracking: int = 6,
    extrude_depth: int = 12,
) -> Image.Image:
    """
    渲染单个超采样 3D 街机金属霓虹艺术词组（含字间距控制、斜切变换、立体挤压、高光金属渐变与双层辉光）
    """
    font = get_font(FONT_IMPACT, font_size)

    # 计算逐字符尺寸与总宽
    char_boxes = []
    total_w = 0
    max_h = 0
    for ch in text:
        bbox = font.getbbox(ch)
        cw = bbox[2] - bbox[0]
        ch_h = bbox[3]
        char_boxes.append((ch, cw, bbox))
        total_w += cw + tracking
        max_h = max(max_h, ch_h)
    total_w = max(1, total_w - tracking)

    pad_x = int(font_size * 0.85)
    pad_y = int(font_size * 0.65)
    canvas_w = total_w + pad_x * 2
    canvas_h = max_h + pad_y * 2

    # 1. 绘制原始文字蒙版
    mask = Image.new("L", (canvas_w, canvas_h), 0)
    draw_m = ImageDraw.Draw(mask)
    cur_x = pad_x
    min_top = canvas_h
    max_bot = 0
    for ch, cw, bbox in char_boxes:
        draw_m.text((cur_x - bbox[0], pad_y), ch, font=font, fill=255)
        min_top = min(min_top, pad_y + bbox[1])
        max_bot = max(max_bot, pad_y + bbox[3])
        cur_x += cw + tracking

    # 2. 对蒙版施加动感斜切（向右倾斜的竞速斜体）
    mask = mask.transform(
        (canvas_w, canvas_h),
        Image.Transform.AFFINE,
        (1.0, shear, -shear * (canvas_h * 0.5), 0.0, 1.0, 0.0),
        resample=Image.Resampling.BICUBIC,
    )

    # 重新测量非零边界以精确对齐渐变
    bbox_nz = mask.getbbox() or (0, 0, canvas_w, canvas_h)
    text_top, text_bot = bbox_nz[1], bbox_nz[3]
    text_h = max(1, text_bot - text_top)

    out = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))

    # 3. 外层大范围环境霓虹辉光 (Outer Neon Bloom)
    glow_mask = mask.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(font_size * 0.16))
    glow_layer = Image.new("RGBA", (canvas_w, canvas_h), (*glow_color, 0))
    glow_alpha = glow_mask.point(lambda p: min(255, int(p * 0.85)))
    glow_layer.putalpha(glow_alpha)
    out = Image.alpha_composite(out, glow_layer)

    # 4. 3D 远景暗色投影与立体斜向挤压层 (3D Extrusion + Drop Shadow)
    shadow_mask = mask.filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.GaussianBlur(font_size * 0.09))
    shadow_layer = Image.new("RGBA", (canvas_w, canvas_h), (2, 6, 18, 0))
    shadow_layer.putalpha(shadow_mask.point(lambda p: min(255, int(p * 0.92))))
    out.alpha_composite(shadow_layer, dest=(extrude_depth + 4, extrude_depth + 6))

    # 逐层绘制 3D 立体挤压底座
    stroke_mask = mask.filter(ImageFilter.MaxFilter(5))
    for d in range(extrude_depth, 0, -1):
        ratio = d / max(1, extrude_depth)
        # 由深暗色过渡到金属边缘色
        r = int(extrude_color[0] * (1 - ratio * 0.65))
        g = int(extrude_color[1] * (1 - ratio * 0.65))
        b = int(extrude_color[2] * (1 - ratio * 0.65))
        ext_layer = Image.new("RGBA", (canvas_w, canvas_h), (r, g, b, 255))
        ext_layer.putalpha(stroke_mask)
        out.alpha_composite(ext_layer, dest=(d, int(d * 1.15)))

    # 5. 外轮廓高亮描边层 (Crisp Rim Stroke)
    rim_mask = mask.filter(ImageFilter.MaxFilter(5))
    rim_layer = Image.new("RGBA", (canvas_w, canvas_h), (*outline_color, 255))
    rim_layer.putalpha(rim_mask)
    out = Image.alpha_composite(out, rim_layer)

    # 内层深色切割线（让金属字面与外发光描边层次分明）
    inner_border_mask = mask.filter(ImageFilter.MaxFilter(3))
    inner_dark = Image.new("RGBA", (canvas_w, canvas_h), (8, 15, 28, 255))
    inner_dark.putalpha(inner_border_mask)
    out = Image.alpha_composite(out, inner_dark)

    # 6. 金属铬渐变字面填充 (Metallic Horizon Fill)
    grad_full = Image.new("RGB", (canvas_w, canvas_h), (255, 255, 255))
    grad_strip = create_metallic_gradient(canvas_w, text_h, gradient_stops)
    grad_full.paste(grad_strip, (0, text_top))

    # 叠加一道斜向高光扫光带 (Specular Slash)
    spec_draw = ImageDraw.Draw(grad_full, "RGBA")
    slash_w = int(canvas_w * 0.12)
    for sx in range(0, canvas_w + text_h, int(canvas_w * 0.38)):
        poly = [
            (sx, text_top),
            (sx + slash_w, text_top),
            (sx + slash_w - int(text_h * 0.45), text_bot),
            (sx - int(text_h * 0.45), text_bot),
        ]
        spec_draw.polygon(poly, fill=(255, 255, 255, 48))

    face_layer = grad_full.convert("RGBA")
    face_layer.putalpha(mask)
    out = Image.alpha_composite(out, face_layer)

    # 7. 顶部边缘受光内高光 (Top Bevel Highlight)
    eroded = mask.filter(ImageFilter.MinFilter(3))
    arr_m = np.array(mask, dtype=np.int16)
    arr_e = np.zeros_like(arr_m)
    arr_e[2:, 1:] = np.array(eroded, dtype=np.int16)[:-2, :-1]
    bevel_arr = np.clip(arr_m - arr_e, 0, 255).astype(np.uint8)
    bevel_mask = Image.fromarray(bevel_arr, mode="L")
    bevel_layer = Image.new("RGBA", (canvas_w, canvas_h), (255, 255, 255, 210))
    bevel_layer.putalpha(bevel_mask)
    out = Image.alpha_composite(out, bevel_layer)

    # 裁剪多余透明留白
    final_bbox = out.getbbox()
    if final_bbox:
        out = out.crop(final_bbox)
    return out


def build_logo_emblem(scale: float = 1.0) -> Image.Image:
    """
    构建完整的《HORIZON OVERDRIVE》双行错落街机竞速主视觉徽标（带速度流光翼线与地平线霓虹光刃）
    """
    # HORIZON: 冰川铬白 + 赛博电光青 (#00e5ff) + 深海蓝铬金属切面
    horizon_stops = [
        (0.00, (255, 255, 255)),
        (0.18, (215, 250, 255)),
        (0.46, (0, 229, 255)),
        (0.50, (8, 35, 68)),     # 金属地平线折线
        (0.55, (255, 255, 255)),
        (0.78, (0, 210, 255)),
        (1.00, (0, 118, 190)),
    ]
    img_horizon = render_stylized_word(
        text="HORIZON",
        font_size=int(156 * scale),
        gradient_stops=horizon_stops,
        extrude_color=(0, 88, 130),
        outline_color=(210, 252, 255),
        glow_color=(0, 229, 255),
        shear=0.18,
        tracking=int(8 * scale),
        extrude_depth=max(3, int(11 * scale)),
    )

    # OVERDRIVE: 炽白 + 氮气烈焰金橙 (#ffab00 -> #ff3d00)
    overdrive_stops = [
        (0.00, (255, 252, 235)),
        (0.22, (255, 214, 64)),
        (0.48, (255, 125, 0)),
        (0.53, (95, 18, 0)),     # 金属折线
        (0.58, (255, 235, 160)),
        (0.82, (255, 82, 0)),
        (1.00, (215, 25, 0)),
    ]
    img_overdrive = render_stylized_word(
        text="OVERDRIVE",
        font_size=int(118 * scale),
        gradient_stops=overdrive_stops,
        extrude_color=(125, 28, 0),
        outline_color=(255, 225, 130),
        glow_color=(255, 95, 0),
        shear=0.18,
        tracking=int(6 * scale),
        extrude_depth=max(3, int(9 * scale)),
    )

    w = max(img_horizon.width, img_overdrive.width) + int(100 * scale)
    overlap_y = int(84 * scale)
    h = img_horizon.height + img_overdrive.height - overlap_y + int(8 * scale)
    emblem = Image.new("RGBA", (w, h), (0, 0, 0, 0))

    # 居中偏动感错位紧凑排布
    hx = (w - img_horizon.width) // 2 - int(8 * scale)
    hy = 0
    ox = (w - img_overdrive.width) // 2 + int(12 * scale)
    oy = img_horizon.height - overlap_y

    # 绘制中间穿插的赛博电光青+氮气橙激光地平线光刃 (Laser Horizon Streak)
    streak_layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(streak_layer)
    mid_y = img_horizon.height - int(42 * scale)
    s_draw.polygon(
        [
            (int(w * 0.03), mid_y),
            (int(w * 0.50), mid_y - int(4 * scale)),
            (int(w * 0.97), mid_y),
            (int(w * 0.50), mid_y + int(4 * scale)),
        ],
        fill=(0, 229, 255, 245),
    )
    streak_glow = streak_layer.filter(ImageFilter.GaussianBlur(max(2, int(7 * scale))))
    emblem.alpha_composite(img_horizon, dest=(hx, hy))
    emblem = Image.alpha_composite(emblem, streak_glow)
    emblem = Image.alpha_composite(emblem, streak_layer)
    emblem.alpha_composite(img_overdrive, dest=(ox, oy))

    bbox = emblem.getbbox()
    if bbox:
        emblem = emblem.crop(bbox)
    return emblem


def apply_top_backdrop_glow(base_img: Image.Image, region_box: tuple, intensity: float = 0.62) -> Image.Image:
    """
    在放置 Logo 的区域背后增加自然柔和的暗色调谐与霓虹背光，确保 Logo 在任何缩略图尺寸下 100% 瞬间清晰可读，
    同时绝不生硬遮挡主视觉车辆。
    """
    w, h = base_img.size
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    x1, y1, x2, y2 = region_box
    cx = (x1 + x2) // 2
    cy = (y1 + y2) // 2
    rx = max(1, (x2 - x1) // 2)
    ry = max(1, (y2 - y1) // 2)

    # 绘制椭圆软暗角底衬
    draw.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=(5, 10, 24, int(255 * intensity)))
    overlay = overlay.filter(ImageFilter.GaussianBlur(radius=int(min(w, h) * 0.075)))

    out = base_img.convert("RGBA")
    return Image.alpha_composite(out, overlay)


def enhance_key_art(img: Image.Image) -> Image.Image:
    """适度提升原画对比度、饱和度与锐度，使其在小尺寸商店卡片中依然鲜亮夺目"""
    img = ImageEnhance.Contrast(img).enhance(1.08)
    img = ImageEnhance.Color(img).enhance(1.12)
    img = ImageEnhance.Sharpness(img).enhance(1.15)
    return img


def generate_all_covers():
    os.makedirs(COVERS_DIR, exist_ok=True)

    # 备份原始无字底图到 covers 目录
    raw_land_dst = os.path.join(COVERS_DIR, "raw_base_landscape.jpg")
    raw_port_dst = os.path.join(COVERS_DIR, "raw_base_portrait.jpg")
    if os.path.exists(SRC_LANDSCAPE):
        shutil.copy2(SRC_LANDSCAPE, raw_land_dst)
    if os.path.exists(SRC_PORTRAIT):
        shutil.copy2(SRC_PORTRAIT, raw_port_dst)

    src_land = enhance_key_art(Image.open(raw_land_dst).convert("RGB"))
    src_port = enhance_key_art(Image.open(raw_port_dst).convert("RGB"))

    # 预先生成超采样高清 Logo 徽标
    master_logo = build_logo_emblem(scale=1.6)

    # =========================================================================
    # 1. Landscape Cover (1920 x 1080, 16:9)
    # 构图策略：左下是重机、右下是 GT 跑车、中间是重卡、右上是飞车，左上角天空与远景高架恰好构成黄金视觉落点！
    # =========================================================================
    land_w, land_h = 1920, 1080
    land_img = crop_and_resize(src_land, land_w, land_h, focus_y=0.5, focus_x=0.5)
    land_rgba = apply_top_backdrop_glow(land_img, (-80, -60, 960, 360), intensity=0.55)

    logo_land_w = 760
    logo_land_h = int(round(master_logo.height * (logo_land_w / master_logo.width)))
    logo_land = master_logo.resize((logo_land_w, logo_land_h), Image.Resampling.LANCZOS)
    land_rgba.alpha_composite(logo_land, dest=(44, 24))

    land_final = land_rgba.convert("RGB")
    land_png = os.path.join(COVERS_DIR, "cover-landscape-1920x1080.png")
    land_jpg = os.path.join(COVERS_DIR, "cover-landscape-1920x1080.jpg")
    land_final.save(land_png, format="PNG", optimize=True)
    land_final.save(land_jpg, format="JPEG", quality=95, subsampling=0)
    print(f"[OK] Landscape Cover saved: {land_png} ({land_final.size})")

    # =========================================================================
    # 2. Portrait Cover (800 x 1200, 2:3)
    # 构图策略：竖版画幅顶部 25% 天空云层留白，将 Logo 居中置于顶部天空区，下方完整展现跑车+重机+重卡+飞车！
    # =========================================================================
    port_w, port_h = 800, 1200
    port_img = crop_and_resize(src_port, port_w, port_h, focus_y=0.50, focus_x=0.5)
    port_rgba = apply_top_backdrop_glow(port_img, (20, -40, 780, 250), intensity=0.52)

    logo_port_w = 710
    logo_port_h = int(round(master_logo.height * (logo_port_w / master_logo.width)))
    logo_port = master_logo.resize((logo_port_w, logo_port_h), Image.Resampling.LANCZOS)
    port_rgba.alpha_composite(logo_port, dest=((port_w - logo_port_w) // 2, 16))

    port_final = port_rgba.convert("RGB")
    port_png = os.path.join(COVERS_DIR, "cover-portrait-800x1200.png")
    port_jpg = os.path.join(COVERS_DIR, "cover-portrait-800x1200.jpg")
    port_final.save(port_png, format="PNG", optimize=True)
    port_final.save(port_jpg, format="JPEG", quality=95, subsampling=0)
    print(f"[OK] Portrait Cover saved: {port_png} ({port_final.size})")

    # =========================================================================
    # 3. Square Cover (800 x 800, 1:1)
    # 构图策略：取竖版主视觉的核心车身与底部流光公路（focus_y=0.60），底部公路区居中放置醒目 Logo，不挡车头大灯！
    # =========================================================================
    sq_w, sq_h = 800, 800
    sq_img = crop_and_resize(src_port, sq_w, sq_h, focus_y=0.60, focus_x=0.5)
    sq_rgba = apply_top_backdrop_glow(sq_img, (30, 560, 770, 830), intensity=0.65)

    logo_sq_w = 650
    logo_sq_h = int(round(master_logo.height * (logo_sq_w / master_logo.width)))
    logo_sq = master_logo.resize((logo_sq_w, logo_sq_h), Image.Resampling.LANCZOS)
    sq_rgba.alpha_composite(logo_sq, dest=((sq_w - logo_sq_w) // 2, sq_h - logo_sq_h - 14))

    sq_final = sq_rgba.convert("RGB")
    sq_png = os.path.join(COVERS_DIR, "cover-square-800x800.png")
    sq_jpg = os.path.join(COVERS_DIR, "cover-square-800x800.jpg")
    sq_final.save(sq_png, format="PNG", optimize=True)
    sq_final.save(sq_jpg, format="JPEG", quality=95, subsampling=0)
    print(f"[OK] Square Cover saved: {sq_png} ({sq_final.size})")


if __name__ == "__main__":
    generate_all_covers()
