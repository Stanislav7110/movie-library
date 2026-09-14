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

if (profileAvatarInput) {
  profileAvatarInput.addEventListener("change", async () => {
    const file = profileAvatarInput.files[0];

    if (!file) {
      return;
    }

    const {
      data: { session }
    } = await supabaseClient.auth.getSession();

    if (!session) {
      return;
    }

    profileMessage.textContent = "Загружаем фото...";

    const fileExt = file.name.split(".").pop();
    const filePath = `${session.user.id}.${fileExt}`;

    const { error: uploadError } = await supabaseClient
      .storage
      .from("avatars")
      .upload(filePath, file, {
        upsert: true
      });

    if (uploadError) {
      profileMessage.textContent = "Ошибка загрузки фото.";
      console.error(uploadError);
      return;
    }

    const { data } = supabaseClient
      .storage
      .from("avatars")
      .getPublicUrl(filePath);

    profileAvatar.src = data.publicUrl;
    profileAvatar.style.display = "block";
    profileAvatarPlaceholder.style.display = "none";

    profileMessage.textContent = "Фото загружено!";
  });
}
if (changeProfileAvatar && profileAvatarInput) {
  changeProfileAvatar.onclick = () => {
    profileAvatarInput.click();
  };
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
    profileMessage.textContent = "Введите имя пользователя.";
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
    profileMessage.textContent = "Ошибка: " + error.message;
    console.error(error);
    return;
  }

  profileMessage.textContent = "Профиль сохранён!";
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
