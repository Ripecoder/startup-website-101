import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL  = "https://wbwmffhegokbnfgtfufz.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indid21mZmhlZ29rYm5mZ3RmdWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMzYzNTcsImV4cCI6MjA5MzYxMjM1N30.7KNAJ_nZwqbdFMlRmEclGPoGx2ywTUmVwn3LxfdBF-w";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ─────────────────────────────────────
// GET CLIENT STATUS FROM BACKEND
// ─────────────────────────────────────

// ─────────────────────────────────────
// GET CLIENT STATUS FROM BACKEND
// ─────────────────────────────────────

async function getClientStatus(email) {

    const response = await fetch(
        "https://website-server-9b3o.onrender.com/api/client/auth",
        {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email: email
            })
        }
    );

    return await response.json();
}

// ─────────────────────────────────────
// CHECK AUTH + ROUTING
// ─────────────────────────────────────

async function checkAuth() {

    // 1. GET SESSION (local)
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;

    console.log("SESSION:", session);

    if (!session) {
        console.log("NO SESSION FOUND");
        return;
    }

    // 2. FORCE REAL USER VALIDATION (IMPORTANT FIX)
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    // if token is stale or user deleted → kill session
    if (!user) {
        console.log("INVALID SESSION → SIGNING OUT");
        await supabase.auth.signOut();
        return;
    }

    // 3. GET EMAIL FROM VERIFIED USER (NOT SESSION)
    const email = user.email;

    // 4. BACKEND CHECK
    const status = await getClientStatus(email);

    // 5. STORE CLIENT DATA
    sessionStorage.setItem(
        "client_data",
        JSON.stringify(status.client_data)
    );

    // 6. ROUTING LOGIC
    if (status.exists) {
        window.location.href = "client-dashboard.html";
    } else {
        window.location.href = "dashboard.html";
    }
}

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
checkAuth();