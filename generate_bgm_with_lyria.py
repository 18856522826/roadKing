# -*- coding: utf-8 -*-
"""
《地平线狂飙：无尽公路》(Horizon Overdrive) —— Google Lyria 3.5 官方 API 一键战歌生成脚本
功能：调用 Google Gemini API 旗下的旗舰音乐生成模型 `lyria-3.5`，
      按原曲《黑街》(DJ Melbourne Bounce 混音版) 的 141 BPM 速度、D# 小调、段落时间戳、
      粤语沧桑摇滚男声唱腔、群像呐喊助威、反拍弹跳重低音以及英文电音 Drop 采样感，
      生成 100% 原创词曲、版权完全归属你本人的可商用背景音乐，并自动替换 assets/audio/bgm.mp3。

使用方法：
  1. 在终端设置环境变量：
     $env:GEMINI_API_KEY="你的_Google_AI_Studio_API_Key"
  2. 运行本脚本：
     python generate_bgm_with_lyria.py
"""

import os
import sys
import base64
import shutil
from google import genai

# 严格按照 Google Lyria 3.5 官方 Prompt Guide 编写的分段时间戳 + 原创同韵粤语歌词提示词
LYRIA_PROMPT = """Create a high-energy 141 BPM Cantonese street rock and Melbourne Bounce EDM club remix in D# minor (Eb minor).
Genre: Modern Electronic Dance Music (EDM), Melbourne Bounce, Big Room Electro House fused with 1990s Hong Kong Cantonese Rock vocals.
Instruments & Textures: Heavy punchy TR-909 club kick drum, boomy off-beat bouncy donk synth bass, aggressive dirty brass synth lead, 303 acid bass arpeggios, crisp open hi-hats, and explosive snare roll risers.
Vocal Profile: Weathered Rocker and Male Baritone in Cantonese — gritty, raw, passionate Hong Kong street rock vocal delivery with heavy reverb in the intro, energetic gang vocal shouts ("睇我吧!", "听我话!") in the chorus, and hyped English MC vocal chops in the EDM drop.

Timeline & Structure:
[0:00 - 0:26] Intro & Verse 1: Starts with atmospheric dark synth pads and sparse beat, featuring a gritty, dramatic Cantonese male vocal singing with raw emotion. Builds tension with a snare roll and white-noise riser at 0:23, pausing for a split-second before shouting into the chorus.
[0:26 - 0:46] Chorus: Explodes into a massive 141 BPM four-on-the-floor club kick and bouncy off-beat bassline. Anthemic Cantonese rock vocals with loud gang vocal call-and-response shouts at the start of each line.
[0:46 - 1:16] Beat Drop (EDM Bounce Drop): High-octane instrumental and vocal chop drop! Dirty brass synthesizer lead playing an addictive bouncy riff over heavy sidechained off-beat bass, layered with rhythmic English hype vocal chants.
[1:16 - 1:42] Verse 2: Driving club beat continues underneath gritty Cantonese male vocals, building back up with a massive turbo snare roll.
[1:42 - 2:20] Final Climax Chorus & Outro Drop: Maximum energy double chorus with gang shouts and blazing brass synth lead.

Lyrics:

[Intro - Gritty Cantonese Male Vocal, Reverb, Atmospheric Dark Synth]
狂飙的健儿 夜夜决战在此
双涡轮轰百次 尾火烧去旧事
巅峰的零时 造就痛快日子
高架中超百次 去写极速定义
不管暴雨 不管弯道 挡住着任何事
(永不踩下停止!)
不肯退缩 不肯制止
最痛快冲破 夜幕到此!

[Chorus - Explosive 141 BPM Melbourne Bounce Beat, Gang Shouts & Heavy Off-beat Bass]
(睇我吧!) 氮气猛踩 狂飙绝未怕!
(睇我吧!) 慢车拦路 全当是笑话!
(听我话!) 热血太多 燃烧到尽头作罢!
(每晚夜!) 贴弯超车 让狂风暂借!
(每晚夜!) 穿过隧道 被霓虹探射!
(不悔恨!) 极速满泻
从不往后看昨夜!

[Drop - Aggressive Dirty Brass Synth Lead, Off-Beat Bounce Bass & Hype English Vocal Chops]
We want you ride to the beat!
We want you feel the speed!
We want you ride to the beat!
And burn the midnight street! (Go! Go!)
We want you ride to the beat!
We want you feel the speed!
We want you ride to the beat!
And burn the midnight street!

[Verse 2 - Driving Electronic Beat & Gritty Cantonese Male Vocal]
车灯的锋芒 划破冷冷夜光
知不知这赛道 接管午夜远方
疾风中轰鸣 若路过这地方
尾流中不作声 决不可以乱望
不想捆绑 不想退让
理想夜夜游荡
(晚风伴着狂浪!)
不死引擎 不死眼光
最痛快撞碎 命运处方!

[Chorus - Maximum Energy Full Club Mix, Gang Shouts & Brass Synth]
(睇我吧!) 氮气猛踩 狂飙绝未怕!
(睇我吧!) 慢车拦路 全当是笑话!
(听我话!) 热血太多 燃烧到尽头作罢!
(每晚夜!) 贴弯超车 让狂风暂借!
(每晚夜!) 穿过隧道 被霓虹探射!
(不悔恨!) 极速满泻
从不往后看昨夜!
"""


def generate_music(api_key=None, model_id="lyria-3.5"):
    """调用 Google Lyria 3.5 模型生成完整 MP3 并替换游戏背景音乐"""
    key = api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not key:
        print("❌ 未检测到 GEMINI_API_KEY！请先设置环境变量或传入 API Key。")
        sys.exit(1)

    print(f"🚀 正在连接 Google Gemini API 调用 [{model_id}] 生成粤语车载 DJ 战歌...")
    client = genai.Client(api_key=key)

    interaction = client.interactions.create(
        model=model_id,
        input=LYRIA_PROMPT,
    )

    # 提取生成的音频数据
    audio_bytes = None
    if getattr(interaction, "output_audio", None) and getattr(interaction.output_audio, "data", None):
        audio_bytes = base64.b64decode(interaction.output_audio.data)
    elif getattr(interaction, "steps", None):
        for step in interaction.steps:
            if getattr(step, "type", None) == "model_output":
                for block in getattr(step, "content", []) or []:
                    if getattr(block, "type", None) == "audio" and getattr(block, "data", None):
                        audio_bytes = base64.b64decode(block.data)
                        break

    if not audio_bytes:
        print("❌ 未能从响应中提取到音频数据，请检查模型配额或输出日志。")
        sys.exit(1)

    root_dir = os.path.dirname(os.path.abspath(__file__))
    bgm_path = os.path.join(root_dir, "assets", "audio", "bgm.mp3")
    backup_path = os.path.join(root_dir, "assets", "audio", "bgm-original-backup.mp3")
    lyria_archive_path = os.path.join(root_dir, "assets", "audio", "bgm-lyria-generated.mp3")

    # 确保原版已备份
    if os.path.exists(bgm_path) and not os.path.exists(backup_path):
        shutil.copy2(bgm_path, backup_path)

    with open(lyria_archive_path, "wb") as f:
        f.write(audio_bytes)
    with open(bgm_path, "wb") as f:
        f.write(audio_bytes)

    print(f"✅ 生成成功！已写入: {bgm_path} ({len(audio_bytes)} 字节)")
    if getattr(interaction, "output_text", None):
        print("\n--- Lyria 3.5 生成结构与歌词回执 ---")
        print(interaction.output_text)


if __name__ == "__main__":
    key_arg = sys.argv[1] if len(sys.argv) > 1 else None
    generate_music(key_arg)
