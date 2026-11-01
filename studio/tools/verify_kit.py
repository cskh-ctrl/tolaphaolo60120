"""tools/verify_kit.py — confirm every studio file was written exactly (run right after installing).

  python tools/verify_kit.py
Prints MISMATCH/MISSING for any file that differs from the tested version; copy those files again from the plugin kit folder.
(Line endings and leading/trailing blank lines are ignored. Files you customise later, e.g. engine/styles.js, will of course differ.)
"""
import hashlib, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXPECTED = {
    "audio/dsp.py": "589d305d94d8acc3",
    "audio/mix.py": "a48273c523b68c3b",
    "audio/music.py": "1fef83a13bb9e794",
    "audio/sfx.py": "a5401778d1a5e2a7",
    "engine/bean.js": "c55990f51614c9c3",
    "engine/cg-cast.js": "4932c400c4a3256a",
    "engine/cg-sets.js": "4e447784e82773de",
    "engine/cg-ui.js": "2f08ba4b2a07ad21",
    "engine/chibi.js": "95e8da317bcaaaf2",
    "engine/core.js": "ca16334ec9be60e8",
    "engine/fx2d.js": "d09f93f6d44366fa",
    "engine/player.js": "379db6e8a3cb34e5",
    "engine/rig2d.js": "5a0c17d66cd4319c",
    "engine/stick.js": "4b2b7d5382fbccb2",
    "engine/styles.js": "58f515e191c4feeb",
    "engine/three-kit.js": "02e249e302b95420",
    "engine/ui2d.js": "741229f1565c4582",
    "examples/di-le-chua-nhat/config.json": "4b67005723a50267",
    "examples/di-le-chua-nhat/scenes/shots/01_phong_ngu.js": "3ae4bb2e25664054",
    "examples/di-le-chua-nhat/scenes/shots/02_nha_tho.js": "d8925eb073831549",
    "examples/di-le-chua-nhat/scenes/shots/99_cover.js": "a96c563f8ac150d9",
    "examples/di-le-chua-nhat/story/shots.json": "ef62ab6f330a143d",
    "examples/di-le-chua-nhat/timeline/words.json": "5f86954354ce46d7",
    "examples/reaction-time/config.json": "9ee341c65b3cfe9a",
    "examples/reaction-time/scenes/cast.js": "e4faad3c508a5cf5",
    "examples/reaction-time/scenes/sets/cafe.js": "fb9adaa553e87b74",
    "examples/reaction-time/scenes/sets/lab.js": "a2da3ca0fff2d8c4",
    "examples/reaction-time/scenes/shots/01_cafe.js": "931e9c360ba052b3",
    "examples/reaction-time/scenes/shots/02_orbit3d.js": "77897bcae80a501e",
    "examples/reaction-time/scenes/shots/03_explain.js": "c22f0e7a8f505c78",
    "examples/reaction-time/story/bible.md": "e22b689a54461b41",
    "examples/reaction-time/story/shots.json": "9b1921e8e42c2498",
    "package.json": "1a2a23cd3a65849d",
    "player.html": "5ffdd7da4a48cd4b",
    "render.mjs": "ba9779c796616616",
    "tools/beats.py": "eb42a8aef4d87584",
    "tools/common.py": "5cb9e123f452b790",
    "tools/doctor.py": "564b8fd497317f63",
    "tools/make_cover.py": "aa1a8834b4be4749",
    "tools/make_shorts.py": "1f93728bebd6426d",
    "tools/make_thumbs.py": "5be0a33fb5af0f68",
    "tools/new_project.py": "735e8abec49ff150",
    "tools/parse_script.py": "5163cf3162b2579b",
    "tools/transcribe.py": "9811589c92da827e",
}
bad = 0
for rel, want in EXPECTED.items():
    p = os.path.join(ROOT, *rel.split("/"))
    if not os.path.exists(p):
        print(f"MISSING   {rel}"); bad += 1; continue
    got = hashlib.sha256(open(p, "rb").read().replace(b"\r\n", b"\n").strip()).hexdigest()[:16]
    if got != want:
        print(f"MISMATCH  {rel}"); bad += 1
print(f"{len(EXPECTED) - bad}/{len(EXPECTED)} files verified." + ("" if not bad else "  Copy the files listed above again from the plugin's kit folder, then run this again."))
sys.exit(1 if bad else 0)
