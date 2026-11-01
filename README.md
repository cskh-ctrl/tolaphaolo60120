# Tớ là Phaolo — 60 video Shorts (P061–P120)

Hoạt hình người que phong cách What If, bảng màu pastel, khổ 9:16 1080×1920, giọng đọc **Nam Minh** (vi-VN-NamMinhNeural).

## Tải video
Vào **Releases** của repo này. Mỗi lần render có 6 file zip, mỗi zip là một thư mục lớn chứa 10 tập:
`Phan_01_P061-P070.zip` … `Phan_06_P111-P120.zip`.
Mỗi tập là một thư mục `NN_Pxxx_<tieu_de>/` gồm: video MP4, `anh_bia.png`, `thong_tin_dang_bai.txt` (tiêu đề, mô tả, hashtag cho YouTube Shorts / TikTok / Facebook Reels, bình luận ghim, nguồn) và ảnh phân cảnh.

## Cấu trúc
- `pipeline/episodes.json` — 60 kịch bản lấy từ `To_La_Phaolo_Shorts_2.xlsx`.
- `episodes/Pxxx/voice.mp3` + `words.json` — giọng Nam Minh và mốc thời gian từng chữ (`pipeline/tts.py`).
- `pipeline/plan.py` — tự phân cảnh theo lời đọc (hook, hai người, qua vai, cận mặt, insert, thẻ giáo lý có nguồn, đóng băng, bài học, câu hỏi cuối).
- `pipeline/scenes/shots/auto.js` — các mẫu shot vẽ bằng canvas.
- `studio/` — bộ dựng Công Giáo 2D Studio (render Chromium + ffmpeg, nhạc và hiệu ứng tự tạo).
- `.github/workflows/render.yml` — render song song trên GitHub Actions rồi tạo Release.

## Chạy lại
- Cả 60 tập: Actions → *Render 60 video* → Run workflow (để trống ô ids).
- Một vài tập: điền `P061,P075` vào ô ids.
