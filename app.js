const SUPABASE_URL = "https://kfhlvfymyyqgtsamgcra.supabase.co";

// Твой Publishable key из Supabase
const SUPABASE_KEY = "sb_publishable_GKFUCUwNTj4m-FRGL2Pm2g_i1DI1xkk";

const { createClient } = supabase;

const supabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

console.log("Supabase подключён");


// ===============================
// ЭЛЕМЕНТЫ АВТОРИЗАЦИИ
// ===============================

const authModal = document.getElementById("authModal");
const authTitle = document.getElementById("authTitle");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authSubmit = document.getElementById("authSubmit");
const authMessage = document.getElementById("authMessage");
const closeAuth = document.getElementById("closeAuth");

const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");

let authMode = "register";


// ===============================
// ОКНО РЕГИСТРАЦИИ
// ===============================

function openRegister() {
  authMode = "register";

  authTitle.textContent = "Регистрация";
  authSubmit.textContent = "Зарегистрироваться";
  authMessage.textContent = "";

  authEmail.value = "";
  authPassword.value = "";

  authModal.style.display = "flex";
}


// ===============================
// ОКНО ВХОДА
// ===============================

function openLogin() {
  authMode = "login";

  authTitle.textContent = "Вход";
  authSubmit.textContent = "Войти";
  authMessage.textContent = "";

  authEmail.value = "";
  authPassword.value = "";

  authModal.style.display = "flex";
}


// ===============================
// ЗАКРЫТИЕ АВТОРИЗАЦИИ
// ===============================

closeAuth.addEventListener("click", () => {
  authModal.style.display = "none";
});


// ===============================
// ВХОД / РЕГИСТРАЦИЯ
// ===============================

authSubmit.addEventListener("click", async () => {
  const email = authEmail.value.trim();
  const password = authPassword.value;

  if (!email || !password) {
    authMessage.textContent = "Заполни email и пароль.";
    return;
  }

  authMessage.textContent = "Подождите...";

  if (authMode === "register") {
    const { data, error } = await supabaseClient.auth.signUp({
      email: email,
      password: password
    });

    if (error) {
      authMessage.textContent = "Ошибка: " + error.message;
      return;
    }

    if (data.session) {
      authMessage.textContent = "Регистрация прошла успешно!";
    } else {
      authMessage.textContent =
        "Регистрация создана. Проверь почту для подтверждения.";
    }

    return;
  }

  const { error } = await supabaseClient.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) {
    authMessage.textContent = "Ошибка: " + error.message;
    return;
  }

  authMessage.textContent = "Вы успешно вошли!";

  setTimeout(() => {
    authModal.style.display = "none";
  }, 1000);
});


// ===============================
// ЭЛЕМЕНТЫ ПРОФИЛЯ
// ===============================

const profileBtn = document.getElementById("profileBtn");
const profileModal = document.getElementById("profileModal");
const profileEmail = document.getElementById("profileEmail");
const profileUsername = document.getElementById("profileUsername");
const saveProfile = document.getElementById("saveProfile");
const profileMessage = document.getElementById("profileMessage");
const closeProfile = document.getElementById("closeProfile");

const profileAvatar = document.getElementById("profileAvatar");
const profileAvatarPlaceholder = document.getElementById("profileAvatarPlaceholder");
const profileAvatarInput = document.getElementById("profileAvatarInput");
const changeProfileAvatar = document.getElementById("changeProfileAvatar");


// ===============================
// ИЗМЕНЕНИЕ ФОТО
// ===============================

if (changeProfileAvatar && profileAvatarInput) {
  changeProfileAvatar.addEventListener("click", () => {
    profileAvatarInput.click();
  });
}


// ===============================
// ЗАГРУЗКА ФОТО
// ===============================

if (profileAvatarInput) {
  profileAvatarInput.addEventListener("change", async () => {

    const file = profileAvatarInput.files[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      profileMessage.textContent = "Выберите изображение.";
      profileAvatarInput.value = "";
      return;
    }

    const {
      data: { session }
    } = await supabaseClient.auth.getSession();

    if (!session) {
      profileMessage.textContent = "Сначала войдите в аккаунт.";
      return;
    }

    profileMessage.textContent = "Загружаем фото...";

    /*
      Используем всегда один и тот же путь.
      Поэтому новое фото заменяет старое.
    */
    const filePath = `${session.user.id}.jpg`;

    const { error: uploadError } = await supabaseClient
      .storage
      .from("avatars")
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
        cacheControl: "3600"
      });

    if (uploadError) {
      console.error("Ошибка загрузки фото:", uploadError);
      profileMessage.textContent =
        "Ошибка загрузки: " + uploadError.message;
      return;
    }

    const { data: publicUrlData } = supabaseClient
      .storage
      .from("avatars")
      .getPublicUrl(filePath);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      profileMessage.textContent = "Не удалось получить ссылку на фото.";
      return;
    }

    /*
      Добавляем время к ссылке, чтобы браузер
      не показывал старую фотографию из кэша.
    */
    const photoUrl =
      publicUrlData.publicUrl + "?t=" + Date.now();

    profileAvatar.src = photoUrl;
    profileAvatar.style.display = "block";

    profileAvatarPlaceholder.style.display = "none";

    profileMessage.textContent = "Фото загружено!";

    profileAvatarInput.value = "";
  });
}


// ===============================
// ПОКАЗ ФОТО ПРОФИЛЯ
// ===============================

function loadProfileAvatar(userId) {

  if (!profileAvatar || !profileAvatarPlaceholder) {
    return;
  }

  const filePath = `${userId}.jpg`;

  const { data } = supabaseClient
    .storage
    .from("avatars")
    .getPublicUrl(filePath);

  if (!data || !data.publicUrl) {
    profileAvatar.style.display = "none";
    profileAvatarPlaceholder.style.display = "block";
    return;
  }

  const photoUrl =
    data.publicUrl + "?t=" + Date.now();

  profileAvatar.onload = () => {
    profileAvatar.style.display = "block";
    profileAvatarPlaceholder.style.display = "none";
  };

  profileAvatar.onerror = () => {
    profileAvatar.style.display = "none";
    profileAvatarPlaceholder.style.display = "block";
  };

  profileAvatar.src = photoUrl;
}


// ===============================
// ОТКРЫТИЕ ПРОФИЛЯ
// ===============================

async function openProfile() {

  const {
    data: { session }
  } = await supabaseClient.auth.getSession();

  if (!session) {
    return;
  }

  profileEmail.textContent = session.user.email;

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("username")
    .eq("id", session.user.id)
    .maybeSingle();

  if (error) {
    profileMessage.textContent = "Ошибка загрузки профиля.";
    console.error(error);
    return;
  }

  profileUsername.value = data?.username || "";

  profileMessage.textContent = "";

  // Загружаем фотографию
  loadProfileAvatar(session.user.id);

  profileModal.style.display = "flex";
}


// ===============================
// ЗАКРЫТИЕ ПРОФИЛЯ
// ===============================

closeProfile.addEventListener("click", () => {
  profileModal.style.display = "none";
});


// ===============================
// СОХРАНЕНИЕ ПРОФИЛЯ
// ===============================

saveProfile.addEventListener("click", async () => {

  const {
    data: { session }
  } = await supabaseClient.auth.getSession();

  if (!session) {
    return;
  }

  const username = profileUsername.value.trim();

  if (!username) {
    profileMessage.textContent =
      "Введите имя пользователя.";
    return;
  }

  profileMessage.textContent = "Сохраняем...";

  const { error } = await supabaseClient
    .from("profiles")
    .upsert({
      id: session.user.id,
      username: username
    });

  if (error) {
    profileMessage.textContent =
      "Ошибка: " + error.message;

    console.error(error);
    return;
  }

  profileMessage.textContent =
    "Профиль сохранён!";
});


// ===============================
// ОБНОВЛЕНИЕ МЕНЮ
// ===============================

async function updateAuthUI() {

  const {
    data: { session }
  } = await supabaseClient.auth.getSession();

  if (session) {

    loginBtn.textContent = "Мой профиль";
    registerBtn.textContent = "Выйти";

    loginBtn.onclick = (event) => {
      event.preventDefault();
      openProfile();
    };

    registerBtn.onclick = async (event) => {
      event.preventDefault();

      await supabaseClient.auth.signOut();

      location.reload();
    };

    profileBtn.style.display = "none";

  } else {

    loginBtn.textContent = "Войти";
    registerBtn.textContent = "Регистрация";

    loginBtn.onclick = (event) => {
      event.preventDefault();
      openLogin();
    };

    registerBtn.onclick = (event) => {
      event.preventDefault();
      openRegister();
    };

    profileBtn.style.display = "none";
  }
}


// ===============================
// СЛЕДИМ ЗА АВТОРИЗАЦИЕЙ
// ===============================

supabaseClient.auth.onAuthStateChange(() => {
  setTimeout(() => {
    updateAuthUI();
  }, 0);
});


// ===============================
// ЗАПУСК
// ===============================

updateAuthUI();
// ===============================
// ЯЗЫК САЙТА
// ===============================

const languageSelect = document.getElementById("languageSelect");

const translations = {
  ru: {
    logo: "🎬 Моя Кинотека",
    home: "Главная",
    movies: "Фильмы",
    series: "Сериалы",
    cartoons: "Мультфильмы",
    favorites: "Избранное",
    login: "Войти",
    register: "Регистрация",
    profile: "Профиль",
    logout: "Выйти",

    welcome: "Добро пожаловать в мою кинотеку",
    subtitle: "Фильмы, сериалы и мультфильмы в одном месте",

    categoryMovies: "🎬 Фильмы",
    categorySeries: "📺 Сериалы",
    categoryCartoons: "🎨 Мультфильмы",
    categoryFavorites: "❤️ Избранное",
    watchLater: "⏰ Посмотреть позже",

    collection: "Моя коллекция",
    poster: "Постер",
    exampleMovie: "Пример фильма",
    exampleSeries: "Пример сериала",
    exampleCartoon: "Пример мультфильма",

    profileTitle: "Мой профиль",
    changePhoto: "Изменить фото",
    saveProfile: "Сохранить профиль",
    close: "Закрыть",

    authRegister: "Регистрация",
    authLogin: "Вход",
    email: "Email",
    password: "Пароль",
    registerButton: "Зарегистрироваться",
    loginButton: "Войти",

    footer: "Моя Кинотека © 2026"
  },

  uk: {
    logo: "🎬 Моя Кінотека",
    home: "Головна",
    movies: "Фільми",
    series: "Серіали",
    cartoons: "Мультфільми",
    favorites: "Обране",
    login: "Увійти",
    register: "Реєстрація",
    profile: "Профіль",
    logout: "Вийти",

    welcome: "Ласкаво просимо до моєї кінотеки",
    subtitle: "Фільми, серіали та мультфільми в одному місці",

    categoryMovies: "🎬 Фільми",
    categorySeries: "📺 Серіали",
    categoryCartoons: "🎨 Мультфільми",
    categoryFavorites: "❤️ Обране",
    watchLater: "⏰ Переглянути пізніше",

    collection: "Моя колекція",
    poster: "Постер",
    exampleMovie: "Приклад фільму",
    exampleSeries: "Приклад серіалу",
    exampleCartoon: "Приклад мультфільму",

    profileTitle: "Мій профіль",
    changePhoto: "Змінити фото",
    saveProfile: "Зберегти профіль",
    close: "Закрити",

    authRegister: "Реєстрація",
    authLogin: "Вхід",
    email: "Email",
    password: "Пароль",
    registerButton: "Зареєструватися",
    loginButton: "Увійти",

    footer: "Моя Кінотека © 2026"
  },

  en: {
    logo: "🎬 My Movie Library",
    home: "Home",
    movies: "Movies",
    series: "Series",
    cartoons: "Cartoons",
    favorites: "Favorites",
    login: "Log in",
    register: "Sign up",
    profile: "Profile",
    logout: "Log out",

    welcome: "Welcome to my movie library",
    subtitle: "Movies, series and cartoons in one place",

    categoryMovies: "🎬 Movies",
    categorySeries: "📺 Series",
    categoryCartoons: "🎨 Cartoons",
    categoryFavorites: "❤️ Favorites",
    watchLater: "⏰ Watch later",

    collection: "My collection",
    poster: "Poster",
    exampleMovie: "Example movie",
    exampleSeries: "Example series",
    exampleCartoon: "Example cartoon",

    profileTitle: "My profile",
    changePhoto: "Change photo",
    saveProfile: "Save profile",
    close: "Close",

    authRegister: "Sign up",
    authLogin: "Log in",
    email: "Email",
    password: "Password",
    registerButton: "Sign up",
    loginButton: "Log in",

    footer: "My Movie Library © 2026"
  }
};


function applyLanguage(language) {

  const t = translations[language];

  if (!t) {
    return;
  }

  // Логотип
  document.querySelector(".logo").textContent = t.logo;

  // Меню
  const navLinks = document.querySelectorAll("nav a");

  navLinks[0].textContent = t.home;
  navLinks[1].textContent = t.movies;
  navLinks[2].textContent = t.series;
  navLinks[3].textContent = t.cartoons;
  navLinks[4].textContent = t.favorites;

  // Авторизация
  if (supabaseClient) {
    supabaseClient.auth.getSession().then(({ data }) => {

      if (data.session) {
        loginBtn.textContent = t.profile;
        registerBtn.textContent = t.logout;
      } else {
        loginBtn.textContent = t.login;
        registerBtn.textContent = t.register;
      }

    });
  }

  // Главный экран
  document.querySelector(".hero h1").textContent = t.welcome;
  document.querySelector(".hero p").textContent = t.subtitle;

  // Категории
  const categories = document.querySelectorAll(".category");

  categories[0].textContent = t.categoryMovies;
  categories[1].textContent = t.categorySeries;
  categories[2].textContent = t.categoryCartoons;
  categories[3].textContent = t.categoryFavorites;
  categories[4].textContent = t.watchLater;

  // Коллекция
  document.querySelector(".content h2").textContent = t.collection;

  // Карточки
  const movies = document.querySelectorAll(".movie");

  if (movies[0]) {
    movies[0].querySelector(".poster").textContent = t.poster;
    movies[0].querySelector(".movie-title").textContent = t.exampleMovie;
  }

  if (movies[1]) {
    movies[1].querySelector(".poster").textContent = t.poster;
    movies[1].querySelector(".movie-title").textContent = t.exampleSeries;
  }

  if (movies[2]) {
    movies[2].querySelector(".poster").textContent = t.poster;
    movies[2].querySelector(".movie-title").textContent = t.exampleCartoon;
  }

  // Профиль
  document.querySelector("#profileModal h2").textContent = t.profileTitle;
  changeProfileAvatar.textContent = t.changePhoto;
  saveProfile.textContent = t.saveProfile;
  closeProfile.textContent = t.close;

  // Авторизация
  authEmail.placeholder = t.email;
  authPassword.placeholder = t.password;

  if (authMode === "register") {
    authTitle.textContent = t.authRegister;
    authSubmit.textContent = t.registerButton;
  } else {
    authTitle.textContent = t.authLogin;
    authSubmit.textContent = t.loginButton;
  }

  // Футер
  document.querySelector("footer").textContent = t.footer;

  // Запоминаем язык
  localStorage.setItem("siteLanguage", language);
}


// Смена языка
if (languageSelect) {

  languageSelect.addEventListener("change", () => {
    applyLanguage(languageSelect.value);
  });

}


// Загружаем сохранённый язык
const savedLanguage =
  localStorage.getItem("siteLanguage") || "ru";

if (languageSelect) {
  languageSelect.value = savedLanguage;
}

applyLanguage(savedLanguage);

const supportBtn = document.getElementById("supportBtn");
const supportModal = document.getElementById("supportModal");
const closeSupport = document.getElementById("closeSupport");
const sendSupportMessage = document.getElementById("sendSupportMessage");
const supportInput = document.getElementById("supportInput");
const supportMessages = document.getElementById("supportMessages");

async function loadSupportMessages() {
  const { data: sessionData } = await supabaseClient.auth.getSession();

  if (!sessionData.session) {
    return;
  }

  const userId = sessionData.session.user.id;

  const { data, error } = await supabaseClient
    .from("support_messages")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Ошибка загрузки сообщений:", error);
    return;
  }

  if (!supportMessages) {
    return;
  }

  supportMessages.innerHTML = "";

  data.forEach((msg) => {
    const message = document.createElement("div");

    message.style.marginBottom = "10px";
    message.style.padding = "8px 10px";
    message.style.borderRadius = "8px";
    message.style.maxWidth = "80%";
    message.style.wordBreak = "break-word";

    if (msg.is_admin) {
      message.style.background = "#3a3f4a";
      message.style.marginRight = "auto";
      message.innerHTML = `<b>Моя Кинотека:</b><br>${msg.message}`;
    } else {
      message.style.background = "#4a6cf7";
      message.style.marginLeft = "auto";
      message.innerHTML = `<b>Вы:</b><br>${msg.message}`;
    }

    supportMessages.appendChild(message);
  });

  supportMessages.scrollTop = supportMessages.scrollHeight;
}

if (supportBtn && supportModal) {
  supportBtn.addEventListener("click", async (event) => {
    event.preventDefault();

    const { data } = await supabaseClient.auth.getSession();

    if (!data.session) {
      alert("Сначала войдите в аккаунт.");
      return;
    }

    supportModal.style.display = "flex";

    await loadSupportMessages();
  });
}

if (closeSupport && supportModal) {
  closeSupport.addEventListener("click", () => {
    supportModal.style.display = "none";
  });
}

if (sendSupportMessage && supportInput) {
  sendSupportMessage.addEventListener("click", async () => {
    const text = supportInput.value.trim();

    if (!text) {
      return;
    }

    const { data } = await supabaseClient.auth.getSession();

    if (!data.session) {
      alert("Сначала войдите в аккаунт.");
      return;
    }

    const { error } = await supabaseClient
      .from("support_messages")
      .insert({
        user_id: data.session.user.id,
        message: text,
        is_admin: false,
        is_read: false
      });

    if (error) {
      console.error("Ошибка отправки сообщения:", error);
      alert("Не удалось отправить сообщение.");
      return;
    }

    supportInput.value = "";

    await loadSupportMessages();
  });
}
const adminSupportBtn = document.getElementById("adminSupportBtn");
const adminSupportModal = document.getElementById("adminSupportModal");
const closeAdminSupport = document.getElementById("closeAdminSupport");

async function updateAdminButton() {
  const { data } = await supabaseClient.auth.getSession();

  if (!data.session) {
    return;
  }

  const userId = data.session.user.id;

 if (userId === "0346597c-f4a1-42ce-9e50-b87b202ae90a") {
    if (adminSupportBtn) {
      adminSupportBtn.style.display = "inline";
    }
  }
}

updateAdminButton();

supabaseClient.auth.onAuthStateChange(() => {
  updateAdminButton();
});

if (adminSupportBtn && adminSupportModal) {
  adminSupportBtn.addEventListener("click", (event) => {
    event.preventDefault();
    adminSupportModal.style.display = "flex";
  });
}

if (closeAdminSupport && adminSupportModal) {
  closeAdminSupport.addEventListener("click", () => {
    adminSupportModal.style.display = "none";
  });
}
