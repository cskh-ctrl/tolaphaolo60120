"""tools/make_cover.py — render the 9:16 cover image (1080x1920) for YouTube Shorts / TikTok / Facebook Reels.

  python tools/make_cover.py --project projects/<slug> [--ids cover,cover_alt]

Needs projects/<slug>/scenes/shots/99_cover.js registering 2D shot(s) with id 'cover' (and optional extras). They are
never listed in shots.json, so the main render ignores them. Output: projects/<slug>/out/anh_bia.png (+ anh_bia_<id>.png).
"""
import argparse, json, os, shutil, subprocess

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--project", required=True); ap.add_argument("--ids", default="cover"); a = ap.parse_args()
    P = os.path.abspath(a.project); root = os.path.dirname(os.path.dirname(P)); slug = os.path.basename(P)
    if not os.path.exists(os.path.join(P, "scenes", "shots", "99_cover.js")): raise SystemExit("write scenes/shots/99_cover.js first")
    ids = [i.strip() for i in a.ids.split(",") if i.strip()]
    cfg = json.load(open(os.path.join(P, "config.json"), encoding="utf-8"))
    out = os.path.join(P, "out"); os.makedirs(out, exist_ok=True)
    T = os.path.join(os.path.dirname(P), f"{slug}-cover"); shutil.rmtree(T, ignore_errors=True)
    for d in ("story", "timeline", "build"): os.makedirs(os.path.join(T, d))
    shutil.copytree(os.path.join(P, "scenes"), os.path.join(T, "scenes"))
    c = dict(cfg); c.update(aspect="9:16", resolution="1080p", duration=len(ids) * 2, captions=False, fadeIn=0, fadeOut=0, bars="none")
    json.dump(c, open(os.path.join(T, "config.json"), "w"), ensure_ascii=False, indent=1)
    json.dump({"title": "cover", "duration": len(ids) * 2, "music": [], "shots": [{"id": i, "start": k * 2, "end": k * 2 + 2, "line": "", "scene": "cover", "bars": "none", "in": {"type": "cut"}, "sfx": []} for k, i in enumerate(ids)]},
              open(os.path.join(T, "story", "shots.json"), "w"), indent=1)
    json.dump({"words": []}, open(os.path.join(T, "timeline", "words.json"), "w"))
    subprocess.run(["node", "render.mjs", "--project", T, "--stills", ",".join(str(k * 2 + 1) for k in range(len(ids))), "--scale", "1"], cwd=root, check=True)
    for k, i in enumerate(ids):
        src = os.path.join(T, "build", "stills", f"{k * 2 + 1}s_{k * 2 + 1:.2f}.png")
        dst = os.path.join(out, "anh_bia.png" if i == "cover" else f"anh_bia_{i}.png"); shutil.copy(src, dst); print("wrote", dst)
    shutil.rmtree(T, ignore_errors=True)

if __name__ == "__main__":
    main()
