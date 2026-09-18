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

const settings =
  typeSettings[currentType] ||
  typeSettings.film;


// --------------------------------------------------
// ЭЛЕМЕНТЫ
// --------------------------------------------------

const catalogTitle =
  document.getElementById("catalogTitle");

const movieGrid =
  document.getElementById("movieGrid");

const emptyMessage =
  document.getElementById("emptyMessage");

const catalogSearch =
  document.getElementById("catalogSearch");

const genreButton =
  document.getElementById("genreButton");

const genreList =
  document.getElementById("genreList");


// --------------------------------------------------
// СОСТОЯНИЕ
// --------------------------------------------------

let allMovies = [];

let currentPage = 1;

let isLoading = false;

let hasMore = true;

let searchTimeout = null;

let currentSearch = "";

let selectedGenre = "all";


// --------------------------------------------------
// ЖАНРЫ
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

catalogTitle.textContent =
  settings.title;


// --------------------------------------------------
// СПИСОК ЖАНРОВ
// --------------------------------------------------

function renderGenres() {

  genreList.innerHTML = "";

  genres.forEach(genre => {

    const item =
      document.createElement("div");

    item.className =
      "genre-item";

    if (
      String(genre.id) ===
      String(selectedGenre)
    ) {
      item.classList.add("active");
    }

    item.textContent =
      genre.name;

    item.addEventListener(
      "click",
      () => {

        selectedGenre =
          String(genre.id);

        renderGenres();

        genreList.classList.remove(
          "show"
        );

        loadCatalog(true);

      }
    );

    genreList.appendChild(item);

  });
}

renderGenres();


// --------------------------------------------------
// КНОПКА ЖАНРА
// --------------------------------------------------

genreButton.addEventListener(
  "click",
  event => {

    event.stopPropagation();

    genreList.classList.toggle(
      "show"
    );

  }
);


// --------------------------------------------------
// ЗАКРЫТИЕ ЖАНРОВ
// --------------------------------------------------

document.addEventListener(
  "click",
  event => {

    if (
      !genreList.contains(event.target) &&
      event.target !== genreButton
    ) {

      genreList.classList.remove(
        "show"
      );

    }

  }
);


// --------------------------------------------------
// ПОИСК
// --------------------------------------------------

catalogSearch.addEventListener(
  "input",
  () => {

    clearTimeout(searchTimeout);

    searchTimeout =
      setTimeout(
        () => {

          currentSearch =
            catalogSearch.value.trim();

          loadCatalog(true);

        },
        500
      );

  }
);


// --------------------------------------------------
// ТИП ЛОКАЛЬНОГО ФИЛЬМА
// --------------------------------------------------

function isCorrectType(movie) {

  const type =
    String(
      movie.type || ""
    )
      .toLowerCase()
      .trim();


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

  const wantedGenre =
    String(selectedGenre);


  if (
    Array.isArray(movie.genre_ids)
  ) {

    return movie.genre_ids.some(
      id =>
        String(id) === wantedGenre
    );

  }


  if (
    Array.isArray(movie.genres)
  ) {

    return movie.genres.some(
      genre => {

        if (
          typeof genre === "object"
        ) {

          return (
            String(genre.id) ===
            wantedGenre
          );

        }

        return (
          String(genre) ===
          wantedGenre
        );

      }
    );

  }


  if (
    movie.genre_id !== undefined &&
    movie.genre_id !== null
  ) {

    return (
      String(movie.genre_id) ===
      wantedGenre
    );

  }


  if (
    typeof movie.genre === "string"
  ) {

    const genreName =
      genres.find(
        g =>
          String(g.id) ===
          wantedGenre
      );

    if (genreName) {

      return movie.genre
        .toLowerCase()
        .includes(
          genreName.name.toLowerCase()
        );

    }

  }


  return false;

}


// --------------------------------------------------
// ЛОКАЛЬНАЯ КИНОТЕКА
// --------------------------------------------------

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


  return (data || [])
    .filter(movie => {

      // Сначала проверяем вкладку
      if (!isCorrectType(movie)) {
        return false;
      }


      // Потом поиск
      if (currentSearch) {

        const search =
          currentSearch
            .toLowerCase();

        const title =
          String(
            movie.title || ""
          )
            .toLowerCase();

        if (
          !title.includes(search)
        ) {

          return false;

        }

      }


      // И только потом жанр
      return movieHasGenre(movie);

    });

}


// --------------------------------------------------
// ЗАПРОС К TMDB
// --------------------------------------------------

async function loadTMDBPage(page) {

  try {

    let tmdbData;
    let tmdbError;


    // ==========================================
    // ПОИСК
    // ==========================================

    if (currentSearch) {

      const response =
        await supabaseClient.functions.invoke(
          "tmdb-search",
          {
            body: {
              query: currentSearch
            }
          }
        );

      tmdbData =
        response.data;

      tmdbError =
        response.error;


      if (tmdbError) {

        console.error(
          "Ошибка поиска TMDB:",
          tmdbError
        );

        return {
          results: [],
          total_pages: 1
        };

      }


      let results = [];


      if (
        Array.isArray(tmdbData)
      ) {

        results =
          tmdbData;

      }

      else if (
        Array.isArray(
          tmdbData?.results
        )
      ) {

        results =
          tmdbData.results;

      }

      else if (
        Array.isArray(
          tmdbData?.data
        )
      ) {

        results =
          tmdbData.data;

      }


      // ==========================================
      // ФИЛЬТРУЕМ ПО РАЗДЕЛУ
      // ==========================================

      results =
        results.filter(movie => {

          const mediaType =
            String(
              movie.media_type ||
              movie.type ||
              ""
            ).toLowerCase();


          // ФИЛЬМЫ
          if (
            currentType === "film"
          ) {

            return (
              mediaType === "movie" ||
              (
                !mediaType &&
                !movie.first_air_date
              )
            );

          }


          // СЕРИАЛЫ
          if (
            currentType === "series"
          ) {

            return (
              mediaType === "tv" ||
              mediaType === "series" ||
              Boolean(
                movie.first_air_date
              )
            );

          }


          // МУЛЬТФИЛЬМЫ
          if (
            currentType === "cartoon"
          ) {

            return (
              mediaType === "cartoon" ||
              (
                Array.isArray(
                  movie.genre_ids
                ) &&
                movie.genre_ids.includes(16)
              )
            );

          }


          return false;

        });


      return {
        results: results,
        total_pages: 1
      };

    }


    // ==========================================
    // ОБЫЧНЫЙ КАТАЛОГ
    // ==========================================

    const response =
      await supabaseClient.functions.invoke(
        "tmdb-search",
        {
          body: {
            mode: "catalog",
            type: settings.tmdbType,
            page: page
          }
        }
      );


    tmdbData =
      response.data;

    tmdbError =
      response.error;


    if (tmdbError) {

      console.error(
        "Ошибка каталога TMDB:",
        tmdbError
      );

      return {
        results: [],
        total_pages: 1
      };

    }


    let results = [];


    if (
      Array.isArray(tmdbData)
    ) {

      results =
        tmdbData;

    }

    else if (
      Array.isArray(
        tmdbData?.results
      )
    ) {

      results =
        tmdbData.results;

    }

    else if (
      Array.isArray(
        tmdbData?.data
      )
    ) {

      results =
        tmdbData.data;

    }


    return {
      results: results,
      total_pages:
        Number(
          tmdbData?.total_pages || 1
        )
    };


  } catch (error) {

    console.error(
      "Ошибка TMDB:",
      error
    );

    return {
      results: [],
      total_pages: 1
    };

  }

}


// --------------------------------------------------
// ФИЛЬТР TMDB ПО ЖАНРУ
// --------------------------------------------------

function filterTMDBByGenre(
  movies
) {

  if (
    selectedGenre === "all"
  ) {

    return movies;

  }


  return movies.filter(
    movie => {

      if (
        Array.isArray(
          movie.genre_ids
        )
      ) {

        return movie.genre_ids.some(
          id =>
            String(id) ===
            String(selectedGenre)
        );

      }


      if (
        Array.isArray(
          movie.genres
        )
      ) {

        return movie.genres.some(
          genre => {

            if (
              typeof genre ===
              "object"
            ) {

              return (
                String(genre.id) ===
                String(selectedGenre)
              );

            }

            return (
              String(genre) ===
              String(selectedGenre)
            );

          }
        );

      }


      return false;

    }
  );

}


// --------------------------------------------------
// ЗАГРУЗКА КАТАЛОГА
// --------------------------------------------------

async function loadCatalog(
  reset = false
) {

  if (isLoading) {
    return;
  }


  if (
    !hasMore &&
    !reset
  ) {

    return;

  }


  isLoading = true;


  if (reset) {

    currentPage = 1;

    hasMore = true;

    allMovies = [];

    movieGrid.innerHTML = "";

    emptyMessage.style.display =
      "none";

  }


  // ==========================================
  // НАША КИНОТЕКА
  // ==========================================

  if (
    currentPage === 1
  ) {

    const localMovies =
      await loadLocalMovies();


    localMovies.forEach(
      movie => {

        allMovies.push({
          ...movie,
          _local: true
        });

      }
    );

  }


  // ==========================================
  // TMDB
  // ==========================================

  const tmdbData =
    await loadTMDBPage(
      currentPage
    );


  let tmdbMovies =
    tmdbData.results || [];


  // Жанр применяется отдельно
  tmdbMovies =
    filterTMDBByGenre(
      tmdbMovies
    );


  tmdbMovies =
    tmdbMovies.map(
      movie => ({
        ...movie,
        _local: false
      })
    );


  allMovies.push(
    ...tmdbMovies
  );


  renderMovies();


  // При поиске pagination не используем,
  // потому что поиск TMDB вызывается
  // обычным запросом { query }
  if (currentSearch) {

    hasMore = false;

  }

  else if (
    currentPage >=
    Number(
      tmdbData.total_pages || 1
    ) ||
    (
      tmdbData.results || []
    ).length === 0
  ) {

    hasMore = false;

  }

  else {

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


  if (
    allMovies.length === 0
  ) {

    emptyMessage.style.display =
      "block";

    return;

  }


  emptyMessage.style.display =
    "none";


  allMovies.forEach(
    movie => {

      movieGrid.appendChild(
        createMovieCard(movie)
      );

    }
  );

}


// --------------------------------------------------
// КАРТОЧКА
// --------------------------------------------------

function createMovieCard(
  movie
) {

  const card =
    document.createElement("div");


  card.style.background =
    "#1a1d24";

  card.style.borderRadius =
    "10px";

  card.style.overflow =
    "hidden";

  card.style.cursor =
    "pointer";

  card.style.transition =
    "transform 0.2s";


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


  let title = "";
  let year = "";
  let poster = "";


  // ==========================================
  // ЛОКАЛЬНЫЙ ФИЛЬМ
  // ==========================================

  if (movie._local) {

    title =
      movie.title ||
      "Без названия";

    year =
      movie.year ||
      "";

    poster =
      movie.poster_url ||
      "";

  }


  // ==========================================
  // TMDB
  // ==========================================

  else {

    title =
      movie.title ||
      movie.name ||
      "Без названия";


    const date =
      movie.release_date ||
      movie.first_air_date ||
      "";


    year =
      date
        ? date.substring(0, 4)
        : "";


    if (movie.poster_url) {

      poster =
        movie.poster_url;

    }

    else if (
      movie.poster_path
    ) {

      poster =
        `https://image.tmdb.org/t/p/w500${movie.poster_path}`;

    }

  }


  // ==========================================
  // ПОСТЕР
  // ==========================================

  const posterWrapper =
    document.createElement("div");


  posterWrapper.style.width =
    "100%";

  posterWrapper.style.aspectRatio =
    "2 / 3";

  posterWrapper.style.background =
    "#242832";


  if (poster) {

    const img =
      document.createElement("img");


    img.src =
      poster;

    img.alt =
      title;

    img.style.width =
      "100%";

    img.style.height =
      "100%";

    img.style.objectFit =
      "cover";

    img.loading =
      "lazy";


    posterWrapper.appendChild(
      img
    );

  }

  else {

    const noPoster =
      document.createElement("div");


    noPoster.textContent =
      "Нет постера";


    noPoster.style.height =
      "100%";

    noPoster.style.display =
      "flex";

    noPoster.style.alignItems =
      "center";

    noPoster.style.justifyContent =
      "center";

    noPoster.style.color =
      "#777";


    posterWrapper.appendChild(
      noPoster
    );

  }


  // ==========================================
  // ИНФОРМАЦИЯ
  // ==========================================

  const info =
    document.createElement("div");


  info.style.padding =
    "12px";


  const titleElement =
    document.createElement("div");


  titleElement.textContent =
    title;


  titleElement.style.fontWeight =
    "bold";

  titleElement.style.fontSize =
    "16px";

  titleElement.style.marginBottom =
    "6px";

  titleElement.style.whiteSpace =
    "nowrap";

  titleElement.style.overflow =
    "hidden";

  titleElement.style.textOverflow =
    "ellipsis";


  const yearElement =
    document.createElement("div");


  yearElement.textContent =
    year;


  yearElement.style.color =
    "#888";

  yearElement.style.fontSize =
    "14px";


  info.appendChild(
    titleElement
  );

  info.appendChild(
    yearElement
  );


  card.appendChild(
    posterWrapper
  );

  card.appendChild(
    info
  );


  // ==========================================
  // ПЕРЕХОД НА СТРАНИЦУ ФИЛЬМА
  // ==========================================

  card.addEventListener(
    "click",
    () => {

      if (movie._local) {

        window.location.href =
          `movie.html?id=${movie.id}`;

        return;

      }


      const tmdbMovie =
        encodeURIComponent(
          JSON.stringify({

            id:
              movie.id,

            title:
              movie.title ||
              movie.name ||
              "",

            year:
              year,

            description:
              movie.overview ||
              "",

            poster_url:
              poster

          })
        );


      window.location.href =
        `movie.html?tmdb=${tmdbMovie}`;

    }
  );


  return card;

}


// --------------------------------------------------
// КНОПКА «ЗАГРУЗИТЬ ЕЩЁ»
// --------------------------------------------------

function updateLoadMoreButton() {

  let button =
    document.getElementById(
      "loadMoreButton"
    );


  if (!button) {

    button =
      document.createElement(
        "button"
      );

    button.id =
      "loadMoreButton";

    button.textContent =
      "Загрузить ещё";


    button.style.display =
      "block";

    button.style.margin =
      "30px auto";

    button.style.padding =
      "12px 25px";

    button.style.background =
      "#1d2027";

    button.style.color =
      "#fff";

    button.style.border =
      "1px solid #3a3f4b";

    button.style.borderRadius =
      "8px";

    button.style.cursor =
      "pointer";

    button.addEventListener(
      "click",
      () => {

        loadCatalog(false);

      }
    );


    movieGrid.parentElement.appendChild(
      button
    );

  }


  if (
    hasMore &&
    !currentSearch &&
    allMovies.length > 0
  ) {

    button.style.display =
      "block";

  }

  else {

    button.style.display =
      "none";

  }

}


// --------------------------------------------------
// СКРЫТЬ КНОПКУ
// --------------------------------------------------

function hideLoadMoreButton() {

  const button =
    document.getElementById(
      "loadMoreButton"
    );


  if (button) {

    button.style.display =
      "none";

  }

}


// --------------------------------------------------
// ПЕРВАЯ ЗАГРУЗКА
// --------------------------------------------------

loadCatalog(true);
