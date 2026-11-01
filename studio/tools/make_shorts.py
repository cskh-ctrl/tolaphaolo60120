"""tools/make_shorts.py — cut vertical YouTube Shorts (1080x1920) out of the finished 16:9 video.

  python tools/make_shorts.py --project projects/<slug> [--video out/<title>.mp4] [--only short1]

Reads projects/<slug>/story/shorts.json:
{ "shorts": [ { "name": "short1_slug", "start": 0.0, "end": 49.2,
                "title": ["LINE ONE", "LINE TWO"],
                "cta": "Bạn muốn hiểu con vật nào? Bình luận nhé!",
                "cues": [[0.17, 4.07, "Caption text\\Nsecond line"], ...] } ] }
Times are GLOBAL seconds of the main video. Captions are written by hand (correct spelling, \\N = line break).
Layout: blurred full-bleed background + zoomed centre crop of the video + title on top + captions + comment CTA at the end.
Writes projects/<slug>/out/shorts/<name>.mp4 and prints duration of each.
"""
import argparse, glob, json, os, subprocess, sys

HEAD = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Title1,{font},64,&H00DCF1FF,&H000000FF,&H00140A0E,&H96000000,1,0,0,0,100,100,4,0,1,5,2,8,60,60,200,1
Style: Title2,{font},84,&H007ED4FF,&H000000FF,&H00140A0E,&H96000000,1,0,0,0,100,100,3,0,1,6,3,8,60,60,290,1
Style: Cap,{font},62,&H00FFFFFF,&H000000FF,&H00000000,&H96000000,1,0,0,0,100,100,0,0,1,6,2,2,70,70,250,1
Style: CTA,{font},56,&H007ED4FF,&H000000FF,&H00000000,&HB4000000,1,0,0,0,100,100,1,0,3,14,0,5,70,70,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

def ts(s):
    s = max(0.0, s); return f"{int(s // 3600)}:{int(s % 3600 // 60):02d}:{s % 60:05.2f}"

def pick_font():
    for fam, d in [("Inter ExtraBold", "/usr/share/fonts/opentype/inter"), ("Nunito ExtraBold", None), ("DejaVu Sans", None)]:
        try:
            if subprocess.run(["fc-list", fam], capture_output=True, text=True).stdout.strip(): return fam, d
        except Exception: pass
    return "Arial", None

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--project", required=True); ap.add_argument("--video"); ap.add_argument("--only")
    a = ap.parse_args(); P = os.path.abspath(a.project)
    spec = json.load(open(os.path.join(P, "story", "shorts.json"), encoding="utf-8"))["shorts"]
    video = a.video or max(glob.glob(os.path.join(P, "out", "*.mp4")), key=os.path.getmtime)
    outdir = os.path.join(P, "out", "shorts"); os.makedirs(outdir, exist_ok=True)
    font, fdir = pick_font()
    for S in spec:
        if a.only and a.only not in S["name"]: continue
        st, en = S["start"], S["end"]; d = en - st
        if d > 60: sys.exit(f"{S['name']}: {d:.1f}s is longer than 60 s — Shorts must be ≤ 60 s")
        ev = [f"Dialogue: 0,{ts(0)},{ts(d)},Title1,,0,0,0,,{{\\fad(400,0)}}{S['title'][0]}",
              f"Dialogue: 0,{ts(0)},{ts(d)},Title2,,0,0,0,,{{\\fad(400,0)}}{S['title'][1]}"]
        cta_t = max(0.0, d - 4.0)
        for s, e, txt in S["cues"]:
            if s - st >= cta_t: continue
            ev.append(f"Dialogue: 1,{ts(s - st)},{ts(min(min(e, en) - st + 0.15, cta_t))},Cap,,0,0,0,,{{\\fad(80,80)}}{txt}")
        ev.append(f"Dialogue: 2,{ts(cta_t)},{ts(d)},CTA,,0,0,0,,{{\\fad(250,0)\\pos(540,1640)}}{S['cta']}")
        ass = os.path.join(outdir, S["name"] + ".ass"); open(ass, "w", encoding="utf-8").write(HEAD.format(font=font) + "\n".join(ev) + "\n")
        out = os.path.join(outdir, S["name"] + ".mp4")
        assf = f"ass={ass}" + (f":fontsdir={fdir}" if fdir else "")
        fc = ("[0:v]split=2[bg][fg];[bg]scale=-2:1920,crop=1080:1920,boxblur=30:3,eq=brightness=-0.12[bgb];"
              "[fg]crop=iw:ih-120:0:60,scale=-2:1050,crop=1080:1050[fgc];"
              f"[bgb][fgc]overlay=0:470,{assf},fade=t=in:st=0:d=0.4,fade=t=out:st={d - 0.5:.2f}:d=0.5[v];"
              f"[0:a]afade=t=in:st=0:d=0.3,afade=t=out:st={d - 0.6:.2f}:d=0.6[a]")
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", f"{st}", "-t", f"{d}", "-i", video, "-filter_complex", fc, "-map", "[v]", "-map", "[a]",
                        "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", "-r", "24", "-c:a", "aac", "-b:a", "192k",
                        "-movflags", "+faststart", out], check=True)
        print(f"wrote {out}  ({d:.1f}s)")

if __name__ == "__main__":
    main()
