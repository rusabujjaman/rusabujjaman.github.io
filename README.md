# Rusab Ujjaman Munim Hazra — personal website

- `index.html` — the website
- `content.js` — posts and videos (edit this file to add new ones)
- `images/` — `profile.jpg` (profile picture), `cover.jpg` (cover photo), and post photos
- `videos/` — small MP4 videos (up to 25 MB each)

## Languages (EN / বাংলা / RU)
- English page: `index.html`. Bangla: `bn/index.html`. Russian: `ru/index.html`.
- Translations live in `i18n/translations.py` (site) and `i18n/cv_extra.py` (CV).
- After changing English text, add its translation, then run `python3 i18n/build.py`
  (pages) and `python3 i18n/build_cv.py` (CV PDFs).

## Q&A (public questions, photos, videos)
- Backend: Supabase. Run `qa/setup.sql` once in the Supabase SQL Editor.
- Put the project URL and anon/publishable key in `qa/config.js`.
- Only rusabujjaman1@gmail.com (owner login in the footer) can answer, hide or delete.
