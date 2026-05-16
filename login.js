import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL  = "https://wbwmffhegokbnfgtfufz.supabase.co";
const SUPABASE_ANON = "YOUR_ANON_KEY";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ─────────────────────────────────────
// AUTH STATE (SINGLE SOURCE OF TRUTH)
// ─────────────────────────────────────
let authReady = false;

// wait for Supabase to hydrate session properly
supabase.auth.getSession().then(({ data }) => {
  authReady = true;

  if (data.session && window.location.pathname.includes("login.html")) {
    window.location.href = "dashboard.html";
  }
});

// react to auth changes
supabase.auth.onAuthStateChange((_event, session) => {
  if (!authReady) return;

  if (session) {
    window.location.href = "dashboard.html";
  } else {
    if (!window.location.pathname.includes("login.html")) {
      window.location.href = "login.html";
    }
  }
});


// ─────────────────────────────────────
// GOOGLE LOGIN
// ─────────────────────────────────────
document.getElementById("googleLoginBtn")?.addEventListener("click", async () => {
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/dashboard.html`
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

document.getElementById("emailLoginBtn")
  ?.addEventListener("click", handleEmailLogin);


// ─────────────────────────────────────
// GUARD (PREVENT RANDOM INDEX REDIRECTS)
// ─────────────────────────────────────
if (window.location.pathname.includes("login.html")) {
  supabase.auth.getSession().then(({ data }) => {
    if (data.session) {
      window.location.href = "dashboard.html";
    }
  });
}