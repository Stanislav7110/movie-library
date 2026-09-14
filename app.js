const SUPABASE_URL = "https://kfhlvfymyyqgtsamgcra.supabase.co";

// ВСТАВЬ СЮДА свой Publishable key из Supabase
const SUPABASE_KEY = "sb_publishable_GKFUCUwNTj4m-FRGL2Pm2g_i1DI1xkk";

const { createClient } = supabase;

const supabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

console.log("Supabase подключён");
