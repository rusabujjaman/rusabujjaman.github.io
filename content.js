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

  Protita block-er sheshe koma (,) dite bhulo na.
*/

window.POSTS = [
  {
    title: "Hello from Nizhny Novgorod!",
    date: "2026-11-20",
    text: "This is my new personal website. Here I will share what I learn about programming, cybersecurity and AI, and about my student life in Russia.",
    image: ""
  },
];

window.VIDEOS = [
  // Udahoron (shamne theke // muche dile cholbe):
  // { title: "My first C++ program", caption: "Day 1 of my 60-day C++ challenge", youtube: "abc123XYZ" },
  // { title: "Campus tour", caption: "", file: "videos/campus.mp4" },
];
