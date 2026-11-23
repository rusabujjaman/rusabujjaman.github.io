/*
  ================================================================
  EI FILE-TA EDIT KORE NOTUN POST AR VIDEO ADD KORBE.
  ================================================================

  NOTUN POST add korte: niche POSTS-er bhitore ekdom upore ekta
  notun { ... }, block copy kore bosao, tarpor lekha bodlao.

    title  = post-er shironam
    date   = tarikh, ei format-e: "2026-11-20"
    text   = post-er lekha (notun line-er jonno \n likho)
    image  = chhobi (optional). Chhobi-ta "images" folder-e upload
             kore ekhane naam likho, jemon "images/post1.jpg".
             Chhobi na thakle "" rekhe dao.

  NOTUN VIDEO add korte (2 bhabe):
    1) YouTube-e video upload koro. Link-ta jodi hoy
       https://www.youtube.com/watch?v=abc123XYZ
       tahole youtube: "abc123XYZ" likho (= er porer ongsho).
    2) Ba choto MP4 video "videos" folder-e upload kore
       file: "videos/myclip.mp4" likho (GitHub-e 25 MB porjonto).

  BANGLA AR RUSSIAN: website-er 3 ta version ache (EN, বাংলা, RU).
  Post ba video-r onno bhasha dite chaile _bn ar _ru jog koro:
    title_bn, text_bn, title_ru, text_ru  (video-te caption_bn, caption_ru)
  Na dile oi bhasha-r page-e English lekha-i dekhabe.

  Protita block-er sheshe koma (,) dite bhulo na.
*/

window.POSTS = [
  {
    title: "Hello from Nizhny Novgorod!",
    date: "2026-11-20",
    text: "This is my new personal website. Here I will share what I learn about programming, cybersecurity and AI, and about my student life in Russia.",
    title_bn: "নিঝনি নভগোরোদ থেকে হ্যালো!",
    text_bn: "এটা আমার নতুন ব্যক্তিগত ওয়েবসাইট। এখানে প্রোগ্রামিং, সাইবার সিকিউরিটি আর এআই নিয়ে যা শিখছি, আর রাশিয়ায় আমার ছাত্রজীবনের কথা শেয়ার করব।",
    title_ru: "Привет из Нижнего Новгорода!",
    text_ru: "Это мой новый личный сайт. Здесь я буду делиться тем, что узнаю о программировании, кибербезопасности и ИИ, и рассказывать о студенческой жизни в России.",
    image: ""
  },
];

window.VIDEOS = [
  // Udahoron (shamne theke // muche dile cholbe):
  // { title: "My first C++ program", caption: "Day 1 of my 60-day C++ challenge", youtube: "abc123XYZ" },
  // { title: "Campus tour", caption: "", file: "videos/campus.mp4" },
];
