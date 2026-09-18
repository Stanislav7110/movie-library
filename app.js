const SUPABASE_URL = "https://kfhlvfymyyqgtsamgcra.supabase.co";

// Твой Publishable key из Supabase
const SUPABASE_KEY = "sb_publishable_GKFUCUwNTj4m-FRGL2Pm2g_i1DI1xkk";

const { createClient } = supabase;

console.log("APP.JS ЗАПУЩЕН");

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
  const name = document.getElementById("authName").value.trim();
  const username = document.getElementById("authUsername").value.trim();
  const email = authEmail.value.trim();
  const password = authPassword.value;

  if (authMode === "register") {
    if (!name || !username || !email || !password) {
      authMessage.textContent = "Заполни все поля.";
      return;
    }

    if (username.length < 3) {
      authMessage.textContent = "Никнейм должен содержать минимум 3 символа.";
      return;
    }

    authMessage.textContent = "Проверяем никнейм...";

    const { data: existingUser, error: usernameError } =
      await supabaseClient
        .from("profiles")
        .select("id")
        .eq("username", username)
        .maybeSingle();

    if (usernameError) {
      authMessage.textContent =
        "Ошибка проверки никнейма: " + usernameError.message;
      return;
    }

    if (existingUser) {
      authMessage.textContent = "Такой никнейм уже занят.";
      return;
    }

    authMessage.textContent = "Регистрация...";

    const { data, error } = await supabaseClient.auth.signUp({
      email: email,
      password: password
    });

    if (error) {
      authMessage.textContent = "Ошибка: " + error.message;
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabaseClient
        .from("profiles")
        .insert({
          id: data.user.id,
          name: name,
          username: username
        });

      if (profileError) {
        authMessage.textContent =
          "Аккаунт создан, но профиль не сохранился: " +
          profileError.message;
        return;
      }
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
    search: "Поиск",
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
    search: "Пошук",
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
    search: "Search",
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

navLinks[0].textContent = t.search;
navLinks[1].textContent = t.home;
navLinks[2].textContent = t.movies;
navLinks[3].textContent = t.series;
navLinks[4].textContent = t.cartoons;
navLinks[5].textContent = t.favorites;

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
const collectionTitle =
  document.querySelector(".content h2");

if (collectionTitle) {
  collectionTitle.textContent =
    t.collection;
}

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

    const userId = data.session.user.id;

    const { error } = await supabaseClient
      .from("support_messages")
      .insert({
        user_id: userId,
        message: text,
        is_admin: false,
        is_read: false
      });

    if (error) {
      console.error("Ошибка отправки сообщения:", error);
      alert("Не удалось отправить сообщение.");
      return;
    }

    const telegramMessage =
      `📩 Новое сообщение в поддержке\n\n` +
      `Пользователь: ${userId.slice(0, 8)}\n\n` +
      text;

    const { error: telegramError } =
      await supabaseClient.functions.invoke(
        "telegram-support",
        {
          body: {
            message: telegramMessage
          }
        }
      );

    if (telegramError) {
      console.error(
        "Ошибка отправки уведомления в Telegram:",
        telegramError
      );
    }

    supportInput.value = "";

    await loadSupportMessages();
  });
}

const adminSupportBtn =
  document.getElementById("adminSupportBtn");

const adminSupportModal =
  document.getElementById("adminSupportModal");

const closeAdminSupport =
  document.getElementById("closeAdminSupport");

async function updateAdminButton() {
  const { data } =
    await supabaseClient.auth.getSession();

  if (!data.session) {
    return;
  }

  const userId =
    data.session.user.id;

  if (
    userId ===
    "0346597c-f4a1-42ce-9e50-b87b202ae90a"
  ) {
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
  adminSupportBtn.addEventListener(
    "click",
    (event) => {
      event.preventDefault();

      adminSupportModal.style.display = "flex";

      loadAdminSupportUsers();
    }
  );
}

if (closeAdminSupport && adminSupportModal) {
  closeAdminSupport.addEventListener(
    "click",
    () => {
      adminSupportModal.style.display = "none";
    }
  );
}

async function loadAdminSupportUsers() {
  const adminSupportUsers =
    document.getElementById("adminSupportUsers");

  if (!adminSupportUsers) {
    return;
  }

  const { data, error } =
    await supabaseClient
      .from("support_messages")
      .select("user_id, created_at")
      .eq("is_admin", false)
      .order("created_at", {
        ascending: false
      });

  if (error) {
    console.error(
      "Ошибка загрузки пользователей:",
      error
    );

    adminSupportUsers.innerHTML =
      "Не удалось загрузить обращения.";

    return;
  }

  const uniqueUsers = [];

  data.forEach((message) => {
    if (!uniqueUsers.includes(message.user_id)) {
      uniqueUsers.push(message.user_id);
    }
  });

  adminSupportUsers.innerHTML = "";

  if (uniqueUsers.length === 0) {
    adminSupportUsers.textContent =
      "Пока никто не писал в поддержку.";

    return;
  }

  uniqueUsers.forEach((userId) => {
    const button =
      document.createElement("button");

    button.textContent =
      "Пользователь " +
      userId.slice(0, 8);

    button.style.display = "block";
    button.style.width = "100%";
    button.style.padding = "10px";
    button.style.marginBottom = "8px";
    button.style.cursor = "pointer";
    button.style.textAlign = "left";

    button.addEventListener(
      "click",
      () => {
        loadAdminSupportChat(userId);
      }
    );

    adminSupportUsers.appendChild(button);
  });
}

let selectedSupportUserId = null;

async function loadAdminSupportChat(userId) {
  selectedSupportUserId = userId;

  const adminSupportChat =
    document.getElementById(
      "adminSupportChat"
    );

  if (!adminSupportChat) {
    return;
  }

  const { data, error } =
    await supabaseClient
      .from("support_messages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", {
        ascending: true
      });

  if (error) {
    console.error(
      "Ошибка загрузки переписки:",
      error
    );

    adminSupportChat.innerHTML =
      "Не удалось загрузить переписку.";

    return;
  }

  adminSupportChat.innerHTML = "";

  data.forEach((msg) => {
    const message =
      document.createElement("div");

    message.style.marginBottom = "10px";
    message.style.padding = "8px 10px";
    message.style.borderRadius = "8px";
    message.style.maxWidth = "80%";
    message.style.wordBreak = "break-word";

    if (msg.is_admin) {
      message.style.background =
        "#3a3f4a";

      message.style.marginRight =
        "auto";

      message.innerHTML =
        `<b>Моя Кинотека:</b><br>${msg.message}`;
    } else {
      message.style.background =
        "#4a6cf7";

      message.style.marginLeft =
        "auto";

      message.innerHTML =
        `<b>Пользователь:</b><br>${msg.message}`;
    }

    adminSupportChat.appendChild(
      message
    );
  });

  adminSupportChat.scrollTop =
    adminSupportChat.scrollHeight;
}

const adminSendSupport =
  document.getElementById(
    "adminSendSupport"
  );

const adminSupportInput =
  document.getElementById(
    "adminSupportInput"
  );

if (
  adminSendSupport &&
  adminSupportInput
) {
  adminSendSupport.addEventListener(
    "click",
    async () => {
      const text =
        adminSupportInput.value.trim();

      if (!text) {
        return;
      }

      if (!selectedSupportUserId) {
        alert(
          "Сначала выберите пользователя."
        );

        return;
      }

      const { data: sessionData } =
        await supabaseClient.auth.getSession();

      if (!sessionData.session) {
        alert(
          "Сначала войдите в аккаунт."
        );

        return;
      }

      const { error } =
        await supabaseClient
          .from("support_messages")
          .insert({
            user_id:
              selectedSupportUserId,
            message: text,
            is_admin: true,
            is_read: false
          });

      if (error) {
        console.error(
          "Ошибка отправки ответа:",
          error
        );

        alert(
          "Не удалось отправить ответ."
        );

        return;
      }

      adminSupportInput.value = "";

      await loadAdminSupportChat(
        selectedSupportUserId
      );
    }
  );
}
// Переключение вкладок админ-панели

const adminSupportTab =
  document.getElementById("adminSupportTab");

const adminMoviesTab =
  document.getElementById("adminMoviesTab");

const adminSupportSection =
  document.getElementById("adminSupportSection");

const adminMoviesSection =
  document.getElementById("adminMoviesSection");

if (
  adminSupportTab &&
  adminMoviesTab &&
  adminSupportSection &&
  adminMoviesSection
) {
  adminSupportTab.addEventListener("click", () => {
    adminSupportSection.style.display = "block";
    adminMoviesSection.style.display = "none";

    adminSupportTab.style.background = "#4a6cf7";
    adminMoviesTab.style.background = "#3a3f4a";
  });

  adminMoviesTab.addEventListener("click", () => {
    adminSupportSection.style.display = "none";
    adminMoviesSection.style.display = "block";

    adminSupportTab.style.background = "#3a3f4a";
    adminMoviesTab.style.background = "#4a6cf7";
  });
}
// Добавление фильма администратором

const addMovieBtn =
  document.getElementById("addMovieBtn");

const movieTitle =
  document.getElementById("movieTitle");

const movieYear =
  document.getElementById("movieYear");

const movieType =
  document.getElementById("movieType");

const movieDescription =
  document.getElementById("movieDescription");

const moviePoster =
  document.getElementById("moviePoster");

const movieTrailer =
  document.getElementById("movieTrailer");

const movieAddStatus =
  document.getElementById("movieAddStatus");

if (
  addMovieBtn &&
  movieTitle &&
  movieYear &&
  movieType &&
  movieDescription &&
  moviePoster &&
  movieTrailer &&
  movieAddStatus
) {
  addMovieBtn.addEventListener("click", async () => {

    const title = movieTitle.value.trim();
    const year = movieYear.value.trim();
    const type = movieType.value;
    const description =
      movieDescription.value.trim();
    const trailer =
      movieTrailer.value.trim();
    const posterFile =
      moviePoster.files[0];

    if (!title) {
      movieAddStatus.textContent =
        "Введите название фильма.";
      return;
    }

    if (!year) {
      movieAddStatus.textContent =
        "Введите год.";
      return;
    }

    if (!posterFile) {
      movieAddStatus.textContent =
        "Выберите постер.";
      return;
    }

    movieAddStatus.textContent =
      "Загрузка...";

    const {
      data: sessionData
    } = await supabaseClient.auth.getSession();

    if (!sessionData.session) {
      movieAddStatus.textContent =
        "Сначала войдите в аккаунт.";
      return;
    }

    const userId =
      sessionData.session.user.id;

    if (
      userId !==
      "0346597c-f4a1-42ce-9e50-b87b202ae90a"
    ) {
      movieAddStatus.textContent =
        "Недостаточно прав.";
      return;
    }

    const fileExtension =
      posterFile.name.split(".").pop();

    const fileName =
      `${crypto.randomUUID()}.${fileExtension}`;

    const {
      error: uploadError
    } = await supabaseClient.storage
      .from("movie-posters")
      .upload(fileName, posterFile, {
        cacheControl: "3600",
        upsert: false
      });

    if (uploadError) {
      console.error(
        "Ошибка загрузки постера:",
        uploadError
      );

      movieAddStatus.textContent =
        "Не удалось загрузить постер.";

      return;
    }

    const {
      data: posterData
    } = supabaseClient.storage
      .from("movie-posters")
      .getPublicUrl(fileName);

    const posterUrl =
      posterData.publicUrl;

    const {
      error: movieError
    } = await supabaseClient
      .from("movies")
      .insert({
        title: title,
        year: Number(year),
        type: type,
        description: description,
        trailer_url: trailer || null,
        poster_url: posterUrl,
        created_by: userId
      });

    if (movieError) {
      console.error(
        "Ошибка добавления фильма:",
        movieError
      );

      movieAddStatus.textContent =
        "Постер загрузился, но фильм сохранить не удалось.";

      return;
    }

    movieAddStatus.textContent =
      "Фильм успешно добавлен!";

    movieTitle.value = "";
    movieYear.value = "";
    movieDescription.value = "";
    movieTrailer.value = "";
    moviePoster.value = "";
  });
}
// ===============================
// ЗАГРУЗКА КАТАЛОГА
// ===============================

const movieGrid =
  document.getElementById("movieGrid");

const movieModal =
  document.getElementById("movieModal");

const movieModalPoster =
  document.getElementById("movieModalPoster");

const movieModalTitle =
  document.getElementById("movieModalTitle");

const movieModalInfo =
  document.getElementById("movieModalInfo");

const movieModalDescription =
  document.getElementById("movieModalDescription");

const movieModalTrailer =
  document.getElementById("movieModalTrailer");

const closeMovieModal =
  document.getElementById("closeMovieModal");

const addToLibraryBtn =
  document.getElementById("addToLibraryBtn");

const libraryAddStatus =
  document.getElementById("libraryAddStatus");

let selectedMovieId = null;


// ===============================
// СОЗДАНИЕ КАРТОЧКИ
// ===============================

function createMovieCard(movie, isTMDB = false, tmdbType = "movie") {

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


  let title = "";
  let year = "";
  let poster = "";
  let type = "";


  // ===============================
  // НАША БАЗА
  // ===============================

  if (!isTMDB) {

    title =
      movie.title || "Без названия";

    year =
      movie.year || "";

    poster =
      movie.poster_url || "";

    type =
      movie.type || "";

  }


  // ===============================
  // TMDB
  // ===============================

  else {

    title =
      movie.title ||
      movie.name ||
      "Без названия";

    year =
      movie.release_date
        ? movie.release_date.substring(0, 4)
        : movie.first_air_date
        ? movie.first_air_date.substring(0, 4)
        : "";

    poster =
      movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : "";


    if (tmdbType === "tv") {

      type = "Сериал";

    } else if (tmdbType === "cartoon") {

      type = "Мультфильм";

    } else {

      type = "Фильм";

    }

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

    <div style="
      padding:12px;
    ">

      <h3 style="
        margin:0 0 6px 0;
        font-size:18px;
      ">
        ${title}
      </h3>

      <div style="
        color:#aaa;
        font-size:14px;
      ">
        ${year} · ${type}
      </div>

    </div>
  `;


  // ===============================
  // НАШ ФИЛЬМ
  // ===============================

  if (!isTMDB) {

    card.addEventListener(
      "click",
      () => {

        window.location.href =
          `movie.html?id=${movie.id}`;

      }
    );

  }


  // ===============================
  // TMDB ФИЛЬМ
  // ===============================

  else {

    card.addEventListener(
      "click",
      () => {

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
                movie.release_date
                  ? movie.release_date.substring(0, 4)
                  : movie.first_air_date
                  ? movie.first_air_date.substring(0, 4)
                  : "",

              description:
                movie.overview || "",

              poster_url:
                movie.poster_path
                  ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                  : "",

              type:
                type

            })
          );


        window.location.href =
          `movie.html?tmdb=${tmdbMovie}`;

      }
    );

  }


  return card;
}


// ===============================
// ЗАГРУЗКА TMDB КАТАЛОГА
// ===============================

async function loadTMDBCatalog(type) {

  const {
    data,
    error
  } =
    await supabaseClient.functions.invoke(
      "tmdb-search",
      {
        body: {
          mode: "catalog",
          type: type,
          page: 1
        }
      }
    );


  if (error) {

    console.error(
      "Ошибка загрузки каталога TMDB:",
      error
    );

    return [];

  }


  if (
    !data ||
    !data.results
  ) {

    return [];

  }


  return data.results;
}


// ===============================
// ЗАГРУЗКА КАТАЛОГА
// ===============================

async function loadMovies(filterType = null) {

  if (!movieGrid) {
    return;
  }


  movieGrid.innerHTML =
    "Загрузка фильмов...";


  // ===============================
  // НАША КИНОТЕКА
  // ===============================

  const {
    data: localMovies,
    error: localError
  } =
    await supabaseClient
      .from("movies")
      .select("*")
      .order("created_at", {
        ascending: false
      });


  if (localError) {

    console.error(
      "Ошибка загрузки фильмов:",
      localError
    );

  }


  let localFiltered =
    localMovies || [];


  // ===============================
  // ФИЛЬТРАЦИЯ НАШЕЙ КИНОТЕКИ
  // ===============================

  if (filterType) {

    localFiltered =
      localFiltered.filter(
        (movie) => {

          const movieType =
            String(
              movie.type || ""
            )
              .trim()
              .toLowerCase();


          if (
            filterType === "film"
          ) {

            return (
              movieType === "фильм" ||
              movieType === "фильмы"
            );

          }


          if (
            filterType === "series"
          ) {

            return (
              movieType === "сериал" ||
              movieType === "сериалы"
            );

          }


          if (
            filterType === "cartoon"
          ) {

            return (
              movieType === "мультфильм" ||
              movieType === "мультфильмы"
            );

          }


          return true;

        }
      );

  }


  movieGrid.innerHTML = "";


  // ===============================
  // СНАЧАЛА НАША КИНОТЕКА
  // ===============================

  localFiltered.forEach(
    (movie) => {

      movieGrid.appendChild(
        createMovieCard(
          movie,
          false
        )
      );

    }
  );


  // ===============================
  // ОПРЕДЕЛЯЕМ ТИП TMDB
  // ===============================

  let tmdbType = "movie";


  if (
    filterType === "series"
  ) {

    tmdbType = "tv";

  }


  if (
    filterType === "cartoon"
  ) {

    tmdbType = "cartoon";

  }


  // ===============================
  // ЗАГРУЖАЕМ TMDB
  // ===============================

  const tmdbMovies =
    await loadTMDBCatalog(
      tmdbType
    );


  // ===============================
  // ПОТОМ TMDB
  // ===============================

  tmdbMovies.forEach(
    (movie) => {

      movieGrid.appendChild(
        createMovieCard(
          movie,
          true,
          tmdbType
        )
      );

    }
  );


  // ===============================
  // НИЧЕГО НЕ НАЙДЕНО
  // ===============================

  if (
    localFiltered.length === 0 &&
    tmdbMovies.length === 0
  ) {

    movieGrid.innerHTML =
      "В этой категории пока ничего нет.";

  }

}


// ===============================
// ОКНО ФИЛЬМА
// ===============================

function openMovieModal(movie) {

  selectedMovieId =
    movie.id;


  movieModalPoster.src =
    movie.poster_url || "";


  movieModalPoster.alt =
    movie.title;


  movieModalTitle.textContent =
    movie.title;


  movieModalInfo.textContent =
    `${movie.year} · ${movie.type}`;


  movieModalDescription.textContent =
    movie.description ||
    "Описание отсутствует.";


  libraryAddStatus.textContent =
    "";


  if (movie.trailer_url) {

    movieModalTrailer.href =
      movie.trailer_url;

    movieModalTrailer.style.display =
      "inline-block";

  } else {

    movieModalTrailer.style.display =
      "none";

  }


  movieModal.style.display =
    "flex";

}


// ===============================
// ЗАКРЫТИЕ ОКНА ФИЛЬМА
// ===============================

if (closeMovieModal) {

  closeMovieModal.addEventListener(
    "click",
    () => {

      movieModal.style.display =
        "none";

    }
  );

}


if (movieModal) {

  movieModal.addEventListener(
    "click",
    (event) => {

      if (
        event.target === movieModal
      ) {

        movieModal.style.display =
          "none";

      }

    }
  );

}


// ===============================
// КАТЕГОРИИ
// ===============================

const categoryButtons =
  document.querySelectorAll(
    ".category"
  );


categoryButtons.forEach(
  (category) => {

    category.addEventListener(
      "click",
      () => {

        const type =
          category.dataset.type;


        if (
          type === "Фильм"
        ) {

          loadMovies("film");

        }


        if (
          type === "Сериал"
        ) {

          loadMovies("series");

        }


        if (
          type === "Мультфильм"
        ) {

          loadMovies("cartoon");

        }

      }
    );

  }
);


// ===============================
// ЗАПУСК КАТАЛОГА
// ===============================

loadMovies();


// ===============================
// ПОИСК ФИЛЬМОВ
// ===============================

const searchBtn =
  document.getElementById("searchBtn");

const searchModal =
  document.getElementById("searchModal");

const searchInput =
  document.getElementById("searchInput");

const searchSubmit =
  document.getElementById("searchSubmit");

const searchResults =
  document.getElementById("searchResults");

const closeSearchModal =
  document.getElementById("closeSearchModal");


// ===============================
// ОТКРЫТИЕ ПОИСКА
// ===============================

if (searchBtn && searchModal) {

  searchBtn.addEventListener(
    "click",
    (event) => {

      event.preventDefault();

      searchModal.style.display =
        "flex";


      if (searchInput) {

        searchInput.focus();

      }

    }
  );

}


// ===============================
// ЗАКРЫТИЕ ПОИСКА
// ===============================

if (
  closeSearchModal &&
  searchModal
) {

  closeSearchModal.addEventListener(
    "click",
    () => {

      searchModal.style.display =
        "none";

    }
  );

}


// ===============================
// ЗАКРЫТИЕ ПО ФОНУ
// ===============================

if (searchModal) {

  searchModal.addEventListener(
    "click",
    (event) => {

      if (
        event.target === searchModal
      ) {

        searchModal.style.display =
          "none";

      }

    }
  );

}


// ===============================
// ПОИСК
// ===============================

async function searchMovies() {

  const query =
    searchInput.value.trim();


  if (!query) {

    searchResults.innerHTML =
      "Введите название.";

    return;

  }


  searchResults.innerHTML =
    "Поиск...";


  // ===============================
  // ПОИСК В НАШЕЙ КИНОТЕКЕ
  // ===============================

  const {
    data: localMovies,
    error: localError
  } =
    await supabaseClient
      .from("movies")
      .select("*")
      .ilike(
        "title",
        `%${query}%`
      )
      .order(
        "year",
        {
          ascending: false
        }
      );


  if (localError) {

    console.error(
      "Ошибка поиска в кинотеке:",
      localError
    );

  }


  // ===============================
  // ПОИСК В TMDB
  // ===============================

  let tmdbData = null;


  const {
    data: tmdbResult,
    error: tmdbError
  } =
    await supabaseClient.functions.invoke(
      "tmdb-search",
      {
        body: {
          query: query
        }
      }
    );


  if (tmdbError) {

    console.error(
      "Ошибка поиска TMDB:",
      tmdbError
    );

  } else {

    tmdbData =
      tmdbResult;

  }


  // ===============================
  // ПОЛУЧАЕМ РЕЗУЛЬТАТЫ TMDB
  // ===============================

  let tmdbMovies = [];


  if (
    Array.isArray(tmdbData)
  ) {

    tmdbMovies =
      tmdbData;

  }

  else if (
    Array.isArray(
      tmdbData?.results
    )
  ) {

    tmdbMovies =
      tmdbData.results;

  }

  else if (
    Array.isArray(
      tmdbData?.data
    )
  ) {

    tmdbMovies =
      tmdbData.data;

  }


  // ===============================
  // ОЧИЩАЕМ РЕЗУЛЬТАТЫ
  // ===============================

  searchResults.innerHTML = "";


  // ===============================
  // НАША КИНОТЕКА
  // ===============================

  if (
    localMovies &&
    localMovies.length > 0
  ) {

    const localTitle =
      document.createElement("h3");

    localTitle.textContent =
      "В моей Кинотеке";

    localTitle.style.margin =
      "0 0 15px 0";

    searchResults.appendChild(
      localTitle
    );


    localMovies.forEach(
      (movie) => {

        const result =
          document.createElement("div");


        result.style.display =
          "flex";

        result.style.gap =
          "15px";

        result.style.padding =
          "10px";

        result.style.marginBottom =
          "10px";

        result.style.background =
          "#1d2027";

        result.style.borderRadius =
          "8px";

        result.style.cursor =
          "pointer";


        result.innerHTML = `
          <img
            src="${movie.poster_url || ""}"
            alt="${movie.title || ""}"
            style="
              width:70px;
              height:100px;
              object-fit:cover;
              border-radius:6px;
            "
          >

          <div>

            <h3 style="
              margin:0 0 8px 0;
            ">
              ${movie.title || "Без названия"}
            </h3>

            <div style="
              color:#aaa;
              font-size:14px;
            ">
              ${movie.year || ""} · ${movie.type || ""}
            </div>

          </div>
        `;


        result.addEventListener(
          "click",
          () => {

            window.location.href =
              `movie.html?id=${movie.id}`;

          }
        );


        searchResults.appendChild(
          result
        );

      }
    );

  }


  // ===============================
  // TMDB
  // ===============================

  if (
    tmdbMovies.length > 0
  ) {

    const tmdbTitle =
      document.createElement("h3");

    tmdbTitle.textContent =
      "Найдено в мировой базе";

    tmdbTitle.style.margin =
      "20px 0 15px 0";

    searchResults.appendChild(
      tmdbTitle
    );


    tmdbMovies
      .slice(0, 20)
      .forEach(
        (movie) => {

          const result =
            document.createElement("div");


          result.style.display =
            "flex";

          result.style.gap =
            "15px";

          result.style.padding =
            "10px";

          result.style.marginBottom =
            "10px";

          result.style.background =
            "#1d2027";

          result.style.borderRadius =
            "8px";

          result.style.cursor =
            "pointer";


          const poster =
            movie.poster_url
              ? movie.poster_url
              : movie.poster_path
              ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
              : "";


          const title =
            movie.title ||
            movie.name ||
            "Без названия";


          const date =
            movie.release_date ||
            movie.first_air_date ||
            "";


          const year =
            date
              ? date.substring(0, 4)
              : "";


          let type = "Фильм";


          if (
            movie.media_type === "tv" ||
            movie.first_air_date
          ) {

            type = "Сериал";

          }


          result.innerHTML = `
            <img
              src="${poster}"
              alt="${title}"
              style="
                width:70px;
                height:100px;
                object-fit:cover;
                border-radius:6px;
              "
            >

            <div>

              <h3 style="
                margin:0 0 8px 0;
              ">
                ${title}
              </h3>

              <div style="
                color:#aaa;
                font-size:14px;
              ">
                ${year} · ${type}
              </div>

            </div>
          `;


          result.addEventListener(
            "click",
            () => {

              const tmdbMovie =
                encodeURIComponent(
                  JSON.stringify({

                    id:
                      movie.id,

                    title:
                      title,

                    year:
                      year,

                    description:
                      movie.overview || "",

                    poster_url:
                      poster,

                    type:
                      type

                  })
                );


              window.location.href =
                `movie.html?tmdb=${tmdbMovie}`;

            }
          );


          searchResults.appendChild(
            result
          );

        }
      );

  }


  // ===============================
  // НИЧЕГО НЕ НАЙДЕНО
  // ===============================

  if (
    (!localMovies ||
      localMovies.length === 0) &&
    tmdbMovies.length === 0
  ) {

    searchResults.innerHTML =
      "Ничего не найдено.";

  }

}


// ===============================
// КНОПКА «НАЙТИ»
// ===============================

if (searchSubmit) {

  searchSubmit.addEventListener(
    "click",
    searchMovies
  );

}


// ===============================
// ПОИСК ПО ENTER
// ===============================

if (searchInput) {

  searchInput.addEventListener(
    "keydown",
    (event) => {

      if (event.key === "Enter") {

        searchMovies();

      }

    }
  );

}
// ===============================
// НАДЁЖНЫЙ ЗАПУСК ПОИСКА НА ГЛАВНОЙ
// ===============================

document.addEventListener("DOMContentLoaded", () => {

  const searchButton = document.getElementById("searchBtn");
  const searchWindow = document.getElementById("searchModal");
  const searchField = document.getElementById("searchInput");
  const findButton = document.getElementById("searchSubmit");
  const closeButton = document.getElementById("closeSearchModal");

  if (!searchButton || !searchWindow) {
    console.error("Элементы поиска не найдены.");
    return;
  }

  // Открыть поиск
  searchButton.onclick = (event) => {
    event.preventDefault();

    searchWindow.style.display = "flex";

    if (searchField) {
      searchField.focus();
    }
  };

  // Закрыть поиск
  if (closeButton) {
    closeButton.onclick = () => {
      searchWindow.style.display = "none";
    };
  }

  // Закрытие по клику на затемнение
  searchWindow.onclick = (event) => {
    if (event.target === searchWindow) {
      searchWindow.style.display = "none";
    }
  };

  // Кнопка "Найти"
  if (findButton) {
    findButton.onclick = () => {
      searchMovies();
    };
  }

  // Enter
  if (searchField) {
    searchField.onkeydown = (event) => {

      if (event.key === "Enter") {
        event.preventDefault();
        searchMovies();
      }

    };
  }

});
