const SUPABASE_URL = "https://kfhlvfymyyqgtsamgcra.supabase.co";

// Твой Publishable key из Supabase
const SUPABASE_KEY = "sb_publishable_GKFUCUwNTj4m-FRGL2Pm2g_i1DI1xkk";

const { createClient } = supabase;

const supabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

console.log("Supabase подключён");

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

// Открытие окна регистрации
function openRegister() {
  authMode = "register";

  authTitle.textContent = "Регистрация";
  authSubmit.textContent = "Зарегистрироваться";
  authMessage.textContent = "";

  authEmail.value = "";
  authPassword.value = "";

  authModal.style.display = "flex";
}

// Открытие окна входа
function openLogin() {
  authMode = "login";

  authTitle.textContent = "Вход";
  authSubmit.textContent = "Войти";
  authMessage.textContent = "";

  authEmail.value = "";
  authPassword.value = "";

  authModal.style.display = "flex";
}

loginBtn.addEventListener("click", async (event) => {
  event.preventDefault();

  const {
    data: { session }
  } = await supabaseClient.auth.getSession();

  if (session) {
    loginBtn.onclick = (event) => {
  event.preventDefault();

  profileBtn.style.display = "inline";
  profileBtn.click();
};
  } else {
    openLogin();
  }
});

registerBtn.addEventListener("click", async (event) => {
  event.preventDefault();

  const {
    data: { session }
  } = await supabaseClient.auth.getSession();

  if (session) {
    await supabaseClient.auth.signOut();
    location.reload();
  } else {
    openRegister();
  }
});
// Закрытие окна
closeAuth.addEventListener("click", () => {
  authModal.style.display = "none";
});

// Регистрация / вход
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

// Обновляем меню сайта
async function updateAuthUI() {
  const {
    data: { session }
  } = await supabaseClient.auth.getSession();

  if (session) {
    loginBtn.textContent = "Мой профиль";
    registerBtn.textContent = "Выйти";

    loginBtn.onclick = (event) => {
      event.preventDefault();
      alert("Вы вошли в аккаунт: " + session.user.email);
    };

    registerBtn.onclick = async (event) => {
      event.preventDefault();

      await supabaseClient.auth.signOut();

      location.reload();
    };

  } else {
    loginBtn.textContent = "Войти";
    registerBtn.textContent = "Регистрация";

    loginBtn.onclick = null;
    registerBtn.onclick = null;
  }
}

// Следим за состоянием авторизации
supabaseClient.auth.onAuthStateChange(() => {
  setTimeout(() => {
    updateAuthUI();
  }, 0);
});

// Проверяем состояние при загрузке сайта
updateAuthUI();
// Профиль пользователя

const profileBtn = document.getElementById("profileBtn");
const profileModal = document.getElementById("profileModal");
const profileEmail = document.getElementById("profileEmail");
const profileUsername = document.getElementById("profileUsername");
const saveProfile = document.getElementById("saveProfile");
const profileMessage = document.getElementById("profileMessage");
const closeProfile = document.getElementById("closeProfile");

profileBtn.addEventListener("click", async (event) => {
  event.preventDefault();

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
});

closeProfile.addEventListener("click", () => {
  profileModal.style.display = "none";
});

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

  setTimeout(() => {
    profileModal.style.display = "none";
  }, 1000);
});
