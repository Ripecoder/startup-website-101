import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL  = "https://wbwmffhegokbnfgtfufz.supabase.co";
const SUPABASE_ANON = "YOUR_ANON_KEY";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ─────────────────────────────────────
// GET CLIENT STATUS FROM BACKEND
// ─────────────────────────────────────
async function getClientStatus(email) {
  const res = await fetch(
    `https://website-server-9b3o.onrender.com/api/client/status?email=${email}`
  );

  return await res.json();
}

// ─────────────────────────────────────
// AUTH ROUTING CORE
// ─────────────────────────────────────
async function checkAuth() {
  const { data } = await supabase.auth.getSession();

  const session = data.session;

  const path = window.location.pathname;
  const isLoginPage = path.includes("login.html");

  if (!session) {
    if (!isLoginPage) window.location.href = "login.html";
    return;
  }

  const email = session.user.email;
  const status = await getClientStatus(email);

  // CLIENT EXISTS → go to client dashboard
  if (status.exists) {
    sessionStorage.setItem("verbe_api_key", status.api_key);

    if (path !== "/client-dashboard.html") {
      window.location.href = "client-dashboard.html";
    }
    return;
  }

  // NO CLIENT → onboarding dashboard
  if (path !== "/dashboard.html") {
    window.location.href = "dashboard.html";
  }
}

checkAuth();

// ─────────────────────────────────────
// GOOGLE LOGIN
// ─────────────────────────────────────
document.getElementById("googleLoginBtn")?.addEventListener("click", async () => {
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/login.html`
    }
  });
});

// ─────────────────────────────────────
// EMAIL LOGIN
// ─────────────────────────────────────
async function handleEmailLogin() {
  const email = document.getElementById("emailInput")?.value?.trim();
  const password = document.getElementById("passwordInput")?.value;

  if (!email || !password) return;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.log(error.message);
  }
}

document
  .getElementById("emailLoginBtn")
  ?.addEventListener("click", handleEmailLogin);