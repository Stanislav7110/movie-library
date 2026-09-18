// ===============================
// SUPABASE
// ===============================

const SUPABASE_URL =
  "https://kfhlvfymyyqgtsamgcra.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_GKFUCUwNTj4m-FRGL2Pm2g_i1DI1xkk";

const { createClient } = supabase;

const supabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


// ===============================
// ЭЛЕМЕНТЫ СТРАНИЦЫ
// ===============================

const catalogTitle =
  document.getElementById("catalogTitle");

const genreButton =
  document.getElementById("genreButton");

const genreList =
  document.getElementById("genreList");

const movieGrid =
  document.getElementById("movieGrid");

const emptyMessage =
  document.getElementById("emptyMessage");

const languageSelect =
  document.getElementById("languageSelect");


// ===============================
// ОПРЕДЕЛЯЕМ КАТЕГОРИЮ
// ===============================

const urlParams =
  new URLSearchParams(window.location.search);

const catalogType =
  urlParams.get("type") || "film";


// ===============================
// НАЗВАНИЯ КАТЕГОРИЙ
// ===============================

const catalogNames = {
  film: "ФИЛЬМЫ",
  series: "СЕРИАЛЫ",
  cartoon: "МУЛЬТФИЛЬМЫ"
};


const catalogName =
  catalogNames[catalogType] || "ФИЛЬМЫ";


if (catalogTitle) {
  catalogTitle.textContent =
    catalogName;
}


// ===============================
// ЖАНРЫ
// ===============================

const genres = [

  "Все жанры",

  "Боевик",
  "Приключения",
  "Анимация",
  "Комедия",
  "Криминал",
  "Документальный",
  "Драма",
  "Семейный",
  "Фэнтези",
  "История",
  "Ужасы",
  "Музыка",
  "Детектив",
  "Мелодрама",
  "Фантастика",
  "Триллер",
  "Военный",
  "Вестерн",

  "Биография",
  "Спорт",
  "Мистика",
  "Мюзикл",
  "Приключенческий",
  "Научная фантастика"

];


// ===============================
// СОСТОЯНИЕ
// ===============================

let selectedGenre = "Все жанры";

let allMovies = [];


// ===============================
// СОЗДАЁМ СПИСОК ЖАНРОВ
// ===============================

function createGenreList() {

  if (!genreList) {
    return;
  }

  genreList.innerHTML = "";


  genres.forEach((genre) => {

    const item =
      document.createElement("div");

    item.className =
      "genre-item";


    if (genre === "Все жанры") {
      item.classList.add("active");
    }


    item.textContent =
      genre;


    item.addEventListener(
      "click",
      () => {

        selectedGenre =
          genre;


        document
          .querySelectorAll(".genre-item")
          .forEach((element) => {
            element.classList.remove(
              "active"
            );
          });


        item.classList.add(
          "active"
        );


        genreButton.textContent =
          genre === "Все жанры"
            ? "Жанр ▾"
            : `${genre} ▾`;


        genreList.classList.remove(
          "show"
        );


        renderMovies();

      }
    );


    genreList.appendChild(
      item
    );

  });

}


// ===============================
// ОТКРЫТИЕ ЖАНРОВ
// ===============================

if (genreButton && genreList) {

  genreButton.addEventListener(
    "click",
    (event) => {

      event.stopPropagation();

      genreList.classList.toggle(
        "show"
      );

    }
  );

}


// ===============================
// ЗАКРЫТИЕ ЖАНРОВ
// ===============================

document.addEventListener(
  "click",
  (event) => {

    if (
      genreList &&
      !genreList.contains(event.target) &&
      event.target !== genreButton
    ) {

      genreList.classList.remove(
        "show"
      );

    }

  }
);


// ===============================
// ОПРЕДЕЛЯЕМ ТИП
// ===============================

function isCorrectType(movie) {

  const type =
    String(movie.type || "")
      .trim()
      .toLowerCase();


  if (catalogType === "film") {

    return (
      type === "movie" ||
      type === "film" ||
      type === "фильм" ||
      type === "фильмы"
    );

  }


  if (catalogType === "series") {

    return (
      type === "series" ||
      type === "tv" ||
      type === "сериал" ||
      type === "сериалы"
    );

  }


  if (catalogType === "cartoon") {

    return (
      type === "cartoon" ||
      type === "мультфильм" ||
      type === "мультфильмы"
    );

  }


  return true;

}


// ===============================
// ПОЛУЧАЕМ ЖАНРЫ ФИЛЬМА
// ===============================

function getMovieGenres(movie) {

  if (!movie) {
    return [];
  }


  // Если в базе уже есть genres
  if (Array.isArray(movie.genres)) {

    return movie.genres.map(
      (genre) =>
        String(genre)
          .trim()
          .toLowerCase()
    );

  }


  // Если genres хранится строкой
  if (typeof movie.genres === "string") {

    return movie.genres
      .split(",")
      .map(
        (genre) =>
          genre.trim().toLowerCase()
      )
      .filter(Boolean);

  }


  // Если жанр хранится в поле genre
  if (typeof movie.genre === "string") {

    return movie.genre
      .split(",")
      .map(
        (genre) =>
          genre.trim().toLowerCase()
      )
      .filter(Boolean);

  }


  return [];

}


// ===============================
// ФИЛЬТР ПО ЖАНРУ
// ===============================

function matchesGenre(movie) {

  if (
    selectedGenre === "Все жанры"
  ) {

    return true;

  }


  const movieGenres =
    getMovieGenres(movie);


  return movieGenres.includes(
    selectedGenre.toLowerCase()
  );

}


// ===============================
// СОЗДАНИЕ КАРТОЧКИ
// ===============================

function createMovieCard(movie) {

  const card =
    document.createElement("div");


  card.style.background =
    "#242832";

  card.style.borderRadius =
    "10px";

  card.style.overflow =
    "hidden";

  card.style.cursor =
    "pointer";

  card.style.transition =
    "0.2s";


  const title =
    movie.title ||
    movie.name ||
    "Без названия";


  const year =
    movie.year ||
    (
      movie.release_date
        ? movie.release_date.substring(0, 4)
        : ""
    ) ||
    (
      movie.first_air_date
        ? movie.first_air_date.substring(0, 4)
        : ""
    );


  const poster =
    movie.poster_url ||
    (
      movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : ""
    );


  let typeText =
    "Фильм";


  if (catalogType === "series") {
    typeText = "Сериал";
  }


  if (catalogType === "cartoon") {
    typeText = "Мультфильм";
  }


  card.innerHTML = `

    <img
      src="${poster}"
      alt="${title}"
      style="
        width:100%;
        height:270px;
        object-fit:cover;
        display:block;
      "
    >

    <div
      style="
        padding:12px;
      "
    >

      <h3
        style="
          margin:0 0 6px 0;
          font-size:18px;
        "
      >
        ${title}
      </h3>

      <div
        style="
          color:#aaa;
          font-size:14px;
        "
      >
        ${year} · ${typeText}
      </div>

    </div>

  `;


  card.addEventListener(
    "mouseenter",
    () => {
      card.style.transform =
        "translateY(-5px)";
    }
  );


  card.addEventListener(
    "mouseleave",
    () => {
      card.style.transform =
        "translateY(0)";
    }
  );


  return card;

}


// ===============================
// ЗАГРУЗКА НАШЕЙ БИБЛИОТЕКИ
// ===============================

async function loadLocalMovies() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("movies")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(
      "Ошибка загрузки библиотеки:",
      error
    );

    return [];

  }


  return data || [];

}


// ===============================
// ЗАГРУЗКА TMDB
// ===============================

async function loadTMDB() {

  let tmdbType =
    "movie";


  if (catalogType === "series") {
    tmdbType = "tv";
  }


  if (catalogType === "cartoon") {
    tmdbType = "cartoon";
  }


  const {
    data,
    error
  } =
    await supabaseClient.functions.invoke(
      "tmdb-search",
      {
        body: {
          mode: "catalog",
          type: tmdbType,
          page: 1
        }
      }
    );


  if (error) {

    console.error(
      "Ошибка загрузки TMDB:",
      error
    );

    return [];

  }


  if (
    !data ||
    !Array.isArray(data.results)
  ) {

    return [];

  }


  return data.results;

}


// ===============================
// ПЕРЕХОД НА СТРАНИЦУ ФИЛЬМА
// ===============================

function openLocalMovie(movie) {

  window.location.href =
    `movie.html?id=${movie.id}`;

}


function openTMDBMovie(movie) {

  const type =
    catalogType === "series"
      ? "Сериал"
      : catalogType === "cartoon"
      ? "Мультфильм"
      : "Фильм";


  const movieData = {

    id:
      movie.id,

    title:
      movie.title ||
      movie.name ||
      "",

    year:
      movie.release_date
        ? movie.release_date.substring(0, 4)
        : movie.first_air_date
        ? movie.first_air_date.substring(0, 4)
        : "",

    description:
      movie.overview ||
      "",

    poster_url:
      movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : "",

    type:
      type

  };


  const encoded =
    encodeURIComponent(
      JSON.stringify(movieData)
    );


  window.location.href =
    `movie.html?tmdb=${encoded}`;

}


// ===============================
// ОТОБРАЖЕНИЕ ФИЛЬМОВ
// ===============================

function renderMovies() {

  if (!movieGrid) {
    return;
  }


  movieGrid.innerHTML = "";


  let filtered =
    allMovies.filter(
      (movie) =>
        isCorrectType(movie) &&
        matchesGenre(movie)
    );


  if (
    filtered.length === 0
  ) {

    if (emptyMessage) {
      emptyMessage.style.display =
        "block";
    }

  } else {

    if (emptyMessage) {
      emptyMessage.style.display =
        "none";
    }


    filtered.forEach(
      (movie) => {

        const card =
          createMovieCard(movie);


        card.addEventListener(
          "click",
          () => {
            openLocalMovie(movie);
          }
        );


        movieGrid.appendChild(
          card
        );

      }
    );

  }

}


// ===============================
// ЗАПУСК
// ===============================

async function loadCatalog() {

  if (!movieGrid) {
    return;
  }


  movieGrid.innerHTML =
    "Загрузка...";


  if (emptyMessage) {
    emptyMessage.style.display =
      "none";
  }


  const localMovies =
    await loadLocalMovies();


  const tmdbMovies =
    await loadTMDB();


  /*
    Сохраняем в общий массив
    фильмы из нашей базы.
  */

  allMovies =
    localMovies;


  renderMovies();


  /*
    TMDB добавляем отдельно,
    чтобы они отображались после
    нашей библиотеки.
  */

  tmdbMovies.forEach(
    (movie) => {

      const card =
        createMovieCard(movie);


      card.addEventListener(
        "click",
        () => {
          openTMDBMovie(movie);
        }
      );


      movieGrid.appendChild(
        card
      );

    }
  );


  /*
    Если вообще ничего нет.
  */

  if (
    localMovies.length === 0 &&
    tmdbMovies.length === 0
  ) {

    movieGrid.innerHTML = "";


    if (emptyMessage) {

      emptyMessage.textContent =
        "В этой категории пока ничего нет.";

      emptyMessage.style.display =
        "block";

    }

  }

}


// ===============================
// ЯЗЫК
// ===============================

const catalogTranslations = {

  ru: {
    home: "Главная",
    movies: "Фильмы",
    series: "Сериалы",
    cartoons: "Мультфильмы",
    favorites: "Избранное",
    genre: "Жанр ▾",
    allGenres: "Все жанры",
    library: "Библиотека",
    empty: "Ничего не найдено.",
    footer: "Моя Кинотека © 2026"
  },

  uk: {
    home: "Головна",
    movies: "Фільми",
    series: "Серіали",
    cartoons: "Мультфільми",
    favorites: "Обране",
    genre: "Жанр ▾",
    allGenres: "Усі жанри",
    library: "Бібліотека",
    empty: "Нічого не знайдено.",
    footer: "Моя Кінотека © 2026"
  },

  en: {
    home: "Home",
    movies: "Movies",
    series: "Series",
    cartoons: "Cartoons",
    favorites: "Favorites",
    genre: "Genre ▾",
    allGenres: "All genres",
    library: "Library",
    empty: "Nothing found.",
    footer: "My Movie Library © 2026"
  }

};


// ===============================
// ПРИМЕНЕНИЕ ЯЗЫКА
// ===============================

function applyCatalogLanguage(
  language
) {

  const t =
    catalogTranslations[language];


  if (!t) {
    return;
  }


  const navLinks =
    document.querySelectorAll(
      "nav a"
    );


  if (navLinks[0]) {
    navLinks[0].textContent =
      t.home;
  }


  if (navLinks[1]) {
    navLinks[1].textContent =
      t.movies;
  }


  if (navLinks[2]) {
    navLinks[2].textContent =
      t.series;
  }


  if (navLinks[3]) {
    navLinks[3].textContent =
      t.cartoons;
  }


  if (navLinks[4]) {
    navLinks[4].textContent =
      t.favorites;
  }


  if (genreButton) {

    genreButton.textContent =
      selectedGenre === "Все жанры"
        ? t.genre
        : `${selectedGenre} ▾`;

  }


  const allGenreItem =
    document.querySelector(
      '.genre-item[data-genre="all"]'
    );


  if (allGenreItem) {

    allGenreItem.textContent =
      t.allGenres;

  }


  const libraryTitle =
    document.querySelector(
      ".content h2"
    );


  if (libraryTitle) {
    libraryTitle.textContent =
      t.library;
  }


  if (emptyMessage) {
    emptyMessage.textContent =
      t.empty;
  }


  const footer =
    document.querySelector(
      "footer"
    );


  if (footer) {
    footer.textContent =
      t.footer;
  }


  localStorage.setItem(
    "siteLanguage",
    language
  );

}


// ===============================
// СМЕНА ЯЗЫКА
// ===============================

if (languageSelect) {

  languageSelect.addEventListener(
    "change",
    () => {

      applyCatalogLanguage(
        languageSelect.value
      );

    }
  );

}


const savedLanguage =
  localStorage.getItem(
    "siteLanguage"
  ) || "ru";


if (languageSelect) {

  languageSelect.value =
    savedLanguage;

}


// ===============================
// ИНИЦИАЛИЗАЦИЯ
// ===============================

createGenreList();

applyCatalogLanguage(
  savedLanguage
);

loadCatalog();

