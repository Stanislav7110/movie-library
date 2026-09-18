const SUPABASE_URL = "https://kfhlvfymyyqgtsamgcra.supabase.co";
const SUPABASE_KEY = "sb_publishable_GKFUCUwNTj4m-FRGL2Pm2g_i1DI1xkk";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


// --------------------------------------------------
// НАСТРОЙКИ
// --------------------------------------------------

const params = new URLSearchParams(window.location.search);
const currentType = params.get("type") || "film";

const typeSettings = {
  film: {
    title: "ФИЛЬМЫ",
    tmdbType: "movie"
  },
  series: {
    title: "СЕРИАЛЫ",
    tmdbType: "tv"
  },
  cartoon: {
    title: "МУЛЬТФИЛЬМЫ",
    tmdbType: "cartoon"
  }
};

const settings = typeSettings[currentType] || typeSettings.film;


// --------------------------------------------------
// ЭЛЕМЕНТЫ
// --------------------------------------------------

const catalogTitle = document.getElementById("catalogTitle");
const movieGrid = document.getElementById("movieGrid");
const emptyMessage = document.getElementById("emptyMessage");

const catalogSearch = document.getElementById("catalogSearch");

const genreButton = document.getElementById("genreButton");
const genreList = document.getElementById("genreList");


// --------------------------------------------------
// СОСТОЯНИЕ
// --------------------------------------------------

let allMovies = [];
let displayedMovies = [];

let currentPage = 1;
let isLoading = false;
let hasMore = true;

let searchTimeout = null;
let currentSearch = "";

let selectedGenre = "all";


// --------------------------------------------------
// ЖАНРЫ TMDB
// --------------------------------------------------

const genres = [
  { id: "all", name: "Все жанры" },

  { id: 28, name: "Боевик" },
  { id: 12, name: "Приключения" },
  { id: 16, name: "Мультфильм" },
  { id: 35, name: "Комедия" },
  { id: 80, name: "Криминал" },
  { id: 99, name: "Документальный" },
  { id: 18, name: "Драма" },
  { id: 10751, name: "Семейный" },
  { id: 14, name: "Фэнтези" },
  { id: 36, name: "История" },
  { id: 27, name: "Ужасы" },
  { id: 10402, name: "Музыка" },
  { id: 9648, name: "Детектив" },
  { id: 10749, name: "Мелодрама" },
  { id: 878, name: "Фантастика" },
  { id: 53, name: "Триллер" },
  { id: 10752, name: "Военный" },
  { id: 37, name: "Вестерн" },

  { id: 10759, name: "Боевик и приключения" },
  { id: 10762, name: "Детский" },
  { id: 10763, name: "Новости" },
  { id: 10764, name: "Реалити-шоу" },
  { id: 10765, name: "Фантастика и фэнтези" },
  { id: 10766, name: "Мыльная опера" },
  { id: 10767, name: "Ток-шоу" },
  { id: 10768, name: "Военное и политическое" }
];


// --------------------------------------------------
// НАЗВАНИЕ СТРАНИЦЫ
// --------------------------------------------------

catalogTitle.textContent = settings.title;


// --------------------------------------------------
// СОЗДАНИЕ СПИСКА ЖАНРОВ
// --------------------------------------------------

function renderGenres() {
  genreList.innerHTML = "";

  genres.forEach(genre => {
    const item = document.createElement("div");

    item.className = "genre-item";

    if (String(genre.id) === String(selectedGenre)) {
      item.classList.add("active");
    }

    item.textContent = genre.name;

    item.addEventListener("click", () => {
      selectedGenre = String(genre.id);

      renderGenres();

      genreList.classList.remove("show");

      currentPage = 1;
      hasMore = true;

      loadCatalog(true);
    });

    genreList.appendChild(item);
  });
}

renderGenres();


// --------------------------------------------------
// КНОПКА ЖАНРА
// --------------------------------------------------

genreButton.addEventListener("click", event => {
  event.stopPropagation();

  genreList.classList.toggle("show");
});


// Закрываем список при клике вне него
document.addEventListener("click", event => {
  if (
    !genreList.contains(event.target) &&
    event.target !== genreButton
  ) {
    genreList.classList.remove("show");
  }
});


// --------------------------------------------------
// ПОИСК
// --------------------------------------------------

catalogSearch.addEventListener("input", () => {
  clearTimeout(searchTimeout);

  searchTimeout = setTimeout(() => {
    currentSearch = catalogSearch.value.trim();

    currentPage = 1;
    hasMore = true;

    loadCatalog(true);
  }, 500);
});


// --------------------------------------------------
// ОПРЕДЕЛЕНИЕ ТИПА ЛОКАЛЬНОГО ФИЛЬМА
// --------------------------------------------------

function isCorrectType(movie) {
  const type = String(movie.type || "").toLowerCase().trim();

  if (currentType === "film") {
    return (
      type === "movie" ||
      type === "film" ||
      type === "фильм" ||
      type === "фильмы"
    );
  }

  if (currentType === "series") {
    return (
      type === "series" ||
      type === "tv" ||
      type === "сериал" ||
      type === "сериалы"
    );
  }

  if (currentType === "cartoon") {
    return (
      type === "cartoon" ||
      type === "мультфильм" ||
      type === "мультфильмы"
    );
  }

  return false;
}


// --------------------------------------------------
// ПРОВЕРКА ЖАНРА
// --------------------------------------------------

function movieHasGenre(movie) {
  if (selectedGenre === "all") {
    return true;
  }

  const wantedGenre = String(selectedGenre);

  // TMDB
  if (Array.isArray(movie.genre_ids)) {
    return movie.genre_ids.some(
      id => String(id) === wantedGenre
    );
  }

  // Если TMDB вернул genres
  if (Array.isArray(movie.genres)) {
    return movie.genres.some(genre => {
      if (typeof genre === "object") {
        return String(genre.id) === wantedGenre;
      }

      return String(genre) === wantedGenre;
    });
  }

  // Локальная база
  if (Array.isArray(movie.genre_ids)) {
    return movie.genre_ids.some(
      id => String(id) === wantedGenre
    );
  }

  if (movie.genre_id !== undefined && movie.genre_id !== null) {
    return String(movie.genre_id) === wantedGenre;
  }

  if (typeof movie.genre === "string") {
    const genreName = genres.find(
      g => String(g.id) === wantedGenre
    );

    if (genreName) {
      return movie.genre
        .toLowerCase()
        .includes(genreName.name.toLowerCase());
    }
  }

  return false;
}


// --------------------------------------------------
// ПОЛУЧЕНИЕ ЛОКАЛЬНЫХ ФИЛЬМОВ
// --------------------------------------------------

async function loadLocalMovies() {
  const { data, error } = await supabaseClient
    .from("movies")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Ошибка загрузки библиотеки:", error);
    return [];
  }

  return (data || []).filter(movie => {
    if (!isCorrectType(movie)) {
      return false;
    }

    if (currentSearch) {
      const title = String(movie.title || "").toLowerCase();

      if (!title.includes(currentSearch.toLowerCase())) {
        return false;
      }
    }

    return movieHasGenre(movie);
  });
}


// --------------------------------------------------
// ЗАПРОС К TMDB
// --------------------------------------------------

async function loadTMDBPage(page) {
  try {
    let body;

    if (currentSearch) {
      body = {
        mode: "search",
        query: currentSearch,
        type: settings.tmdbType,
        page: page
      };
    } else {
      body = {
        mode: "catalog",
        type: settings.tmdbType,
        page: page
      };
    }

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/tmdb-search`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify(body)
      }
    );

    if (!response.ok) {
      console.error(
        "TMDB ошибка:",
        response.status,
        await response.text()
      );

      return {
        results: [],
        total_pages: 1
      };
    }

    const result = await response.json();

    let results = [];

    if (Array.isArray(result)) {
      results = result;
    } else if (Array.isArray(result.results)) {
      results = result.results;
    } else if (Array.isArray(result.data)) {
      results = result.data;
    }

    return {
      results: results,
      total_pages: Number(result.total_pages || 1)
    };

  } catch (error) {
    console.error("Ошибка TMDB:", error);

    return {
      results: [],
      total_pages: 1
    };
  }
}


// --------------------------------------------------
// ФИЛЬТР TMDB ПО ЖАНРУ
// --------------------------------------------------

function filterTMDBByGenre(movies) {
  if (selectedGenre === "all") {
    return movies;
  }

  return movies.filter(movie => {
    if (Array.isArray(movie.genre_ids)) {
      return movie.genre_ids.some(
        id => String(id) === String(selectedGenre)
      );
    }

    if (Array.isArray(movie.genres)) {
      return movie.genres.some(genre => {
        if (typeof genre === "object") {
          return String(genre.id) === String(selectedGenre);
        }

        return String(genre) === String(selectedGenre);
      });
    }

    return false;
  });
}


// --------------------------------------------------
// ЗАГРУЗКА КАТАЛОГА
// --------------------------------------------------

async function loadCatalog(reset = false) {

  if (isLoading) {
    return;
  }

  if (!hasMore && !reset) {
    return;
  }

  isLoading = true;

  if (reset) {
    currentPage = 1;
    hasMore = true;
    allMovies = [];
    displayedMovies = [];
    movieGrid.innerHTML = "";
    hideLoadMoreButton();
  }

  // Локальная библиотека показывается только на первой странице
  if (currentPage === 1) {
    const localMovies = await loadLocalMovies();

    localMovies.forEach(movie => {
      allMovies.push({
        ...movie,
        _local: true
      });
    });
  }

  // Загружаем TMDB
  const tmdbData = await loadTMDBPage(currentPage);

  let tmdbMovies = filterTMDBByGenre(
    tmdbData.results || []
  );

  tmdbMovies = tmdbMovies.map(movie => ({
    ...movie,
    _local: false
  }));

  allMovies.push(...tmdbMovies);

  renderMovies();

  if (
    currentPage >= Number(tmdbData.total_pages || 1) ||
    (tmdbData.results || []).length === 0
  ) {
    hasMore = false;
  } else {
    currentPage++;
  }

  updateLoadMoreButton();

  isLoading = false;
}


// --------------------------------------------------
// ОТРИСОВКА
// --------------------------------------------------

function renderMovies() {
  movieGrid.innerHTML = "";

  if (allMovies.length === 0) {
    emptyMessage.style.display = "block";
    return;
  }

  emptyMessage.style.display = "none";

  allMovies.forEach(movie => {
    movieGrid.appendChild(createMovieCard(movie));
  });
}


// --------------------------------------------------
// КАРТОЧКА ФИЛЬМА
// --------------------------------------------------

function createMovieCard(movie) {

  const card = document.createElement("div");

  card.style.background = "#1a1d24";
  card.style.borderRadius = "10px";
  card.style.overflow = "hidden";
  card.style.cursor = "pointer";
  card.style.transition = "transform 0.2s";

  card.addEventListener("mouseenter", () => {
    card.style.transform = "translateY(-5px)";
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = "translateY(0)";
  });


  let title = "";
  let year = "";
  let poster = "";


  // Локальный фильм
  if (movie._local) {

    title = movie.title || "Без названия";

    year = movie.year || "";

    poster = movie.poster_url || "";

  }

  // TMDB
  else {

    title =
      movie.title ||
      movie.name ||
      "Без названия";

    const date =
      movie.release_date ||
      movie.first_air_date ||
      "";

    year = date
      ? date.substring(0, 4)
      : "";

    if (movie.poster_url) {
      poster = movie.poster_url;
    } else if (movie.poster_path) {
      poster =
        `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
    }
  }


  const posterWrapper = document.createElement("div");

  posterWrapper.style.width = "100%";
  posterWrapper.style.aspectRatio = "2 / 3";
  posterWrapper.style.background = "#242832";


  if (poster) {

    const img = document.createElement("img");

    img.src = poster;
    img.alt = title;

    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
    img.loading = "lazy";

    posterWrapper.appendChild(img);

  } else {

    const noPoster = document.createElement("div");

    noPoster.textContent = "Нет постера";

    noPoster.style.height = "100%";
    noPoster.style.display = "flex";
    noPoster.style.alignItems = "center";
    noPoster.style.justifyContent = "center";
    noPoster.style.color = "#777";

    posterWrapper.appendChild(noPoster);
  }


  const info = document.createElement("div");

  info.style.padding = "12px";


  const titleElement = document.createElement("div");

  titleElement.textContent = title;

  titleElement.style.fontWeight = "bold";
  titleElement.style.fontSize = "16px";
  titleElement.style.marginBottom = "6px";
  titleElement.style.whiteSpace = "nowrap";
  titleElement.style.overflow = "hidden";
  titleElement.style.textOverflow = "ellipsis";


  const yearElement = document.createElement("div");

  yearElement.textContent = year;

  yearElement.style.color = "#888";
  yearElement.style.fontSize =
