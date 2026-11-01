"""tools/make_thumbs.py — render the YouTube thumbnail (1280x720) and 3 Shorts covers (1080x1920).

  python tools/make_thumbs.py --project projects/<slug>

Needs projects/<slug>/scenes/shots/99_thumbs.js registering four 2D shots: thumb_main (designed for 16:9),
thumb_s1, thumb_s2, thumb_s3 (designed for 9:16, use V()/E.W/E.H). They are never listed in shots.json, so the
main render ignores them. This script builds two throw-away sub-projects (<slug>-thumb, <slug>-thumb-v) that
reuse the same scenes, renders one still per id and copies the PNGs to projects/<slug>/out/thumbs/.
"""
import argparse, json, os, shutil, subprocess

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--project", required=True); a = ap.parse_args()
    P = os.path.abspath(a.project); root = os.path.dirname(os.path.dirname(P)); slug = os.path.basename(P)
    if not os.path.exists(os.path.join(P, "scenes", "shots", "99_thumbs.js")): raise SystemExit("write scenes/shots/99_thumbs.js first")
    cfg = json.load(open(os.path.join(P, "config.json"), encoding="utf-8"))
    out = os.path.join(P, "out", "thumbs"); os.makedirs(out, exist_ok=True)
    jobs = [("thumb", "16:9", ["thumb_main"], "0.6667", {"thumb_main": "anh_bia_video_chinh.png"}),
            ("thumb-v", "9:16", ["thumb_s1", "thumb_s2", "thumb_s3"], "1", {f"thumb_s{i}": f"anh_bia_short{i}.png" for i in (1, 2, 3)})]
    for suf, aspect, ids, scale, names in jobs:
        T = os.path.join(os.path.dirname(P), f"{slug}-{suf}")
        shutil.rmtree(T, ignore_errors=True)
        for d in ("story", "timeline", "build"): os.makedirs(os.path.join(T, d))
        shutil.copytree(os.path.join(P, "scenes"), os.path.join(T, "scenes"))
        c = dict(cfg); c.update(aspect=aspect, resolution="1080p", duration=len(ids) * 2, captions=False, fadeIn=0, fadeOut=0, bars="none")
        json.dump(c, open(os.path.join(T, "config.json"), "w"), ensure_ascii=False, indent=1)
        json.dump({"title": "thumbs", "duration": len(ids) * 2, "music": [],
                   "shots": [{"id": i, "start": k * 2, "end": k * 2 + 2, "line": "", "scene": "thumbnail", "bars": "none", "in": {"type": "cut"}, "sfx": []} for k, i in enumerate(ids)]},
                  open(os.path.join(T, "story", "shots.json"), "w"), indent=1)
        json.dump({"words": []}, open(os.path.join(T, "timeline", "words.json"), "w"))
        at = ",".join(str(k * 2 + 1) for k in range(len(ids)))
        subprocess.run(["node", "render.mjs", "--project", T, "--stills", at, "--scale", scale], cwd=root, check=True)
        for k, i in enumerate(ids):
            src = os.path.join(T, "build", "stills", f"{k * 2 + 1}s_{k * 2 + 1:.2f}.png")
            shutil.copy(src, os.path.join(out, names[i])); print("wrote", os.path.join(out, names[i]))

if __name__ == "__main__":
    main()
