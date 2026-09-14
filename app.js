const SUPABASE_URL = "https://kfhlvfymyyqgtsamgcra.supabase.co";

// ВСТАВЬ СЮДА свой Publishable key из Supabase
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

let authMode = "register";

document.getElementById("registerBtn").addEventListener("click", (event) => {
  event.preventDefault();

  authMode = "register";
  authTitle.textContent = "Регистрация";
  authSubmit.textContent = "Зарегистрироваться";
  authMessage.textContent = "";

  authModal.style.display = "flex";
});

document.getElementById("loginBtn").addEventListener("click", (event) => {
  event.preventDefault();

  authMode = "login";
  authTitle.textContent = "Вход";
  authSubmit.textContent = "Войти";
  authMessage.textContent = "";

  authModal.style.display = "flex";
});

closeAuth.addEventListener("click", () => {
  authModal.style.display = "none";
});

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

  } else {
    const { error } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      authMessage.textContent = "Ошибка: " + error.message;
      return;
    }

    authMessage.textContent = "Вы успешно вошли!";
  }
});
async function updateAuthUI() {
  const {
    data: { session }
  } = await supabaseClient.auth.getSession();

  const loginBtn = document.getElementById("loginBtn");
  const registerBtn = document.getElementById("registerBtn");

  if (session) {
    loginBtn.textContent = "Вы вошли";
    registerBtn.textContent = "Выйти";

    registerBtn.onclick = async (event) => {
      event.preventDefault();

      await supabaseClient.auth.signOut();

      location.reload();
    };
  } else {
    loginBtn.textContent = "Войти";
    registerBtn.textContent = "Регистрация";
  }
}

updateAuthUI();

supabaseClient.auth.onAuthStateChange(() => {
  updateAuthUI();
});
