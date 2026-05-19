import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL  = "https://wbwmffhegokbnfgtfufz.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indid21mZmhlZ29rYm5mZ3RmdWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMzYzNTcsImV4cCI6MjA5MzYxMjM1N30.7KNAJ_nZwqbdFMlRmEclGPoGx2ywTUmVwn3LxfdBF-w";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ─────────────────────────────────────
// BACKEND CHECK
// ─────────────────────────────────────
async function getClientStatus(email) {
    const response = await fetch(
        "https://website-server-9b3o.onrender.com/api/client/auth",
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        }
    );

    return await response.json();
}

// ─────────────────────────────────────
// GOOGLE AUTH TRIGGER (NEW FIX)
// ─────────────────────────────────────
async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: window.location.origin + "/login.html"
        }
    });

    if (error) {
        console.log("Google Auth Error:", error.message);
    }
}

// ─────────────────────────────────────
// ROUTING AFTER AUTH
// ─────────────────────────────────────
async function handleRouting(user) {
    const email = user.email;

    const status = await getClientStatus(email);

    sessionStorage.setItem(
        "client_data",
        JSON.stringify(status.client_data || {})
    );

    if (status.exists) {
        window.location.href = "client-dashboard.html";
    } else {
        window.location.href = "dashboard.html";
    }
}

// ─────────────────────────────────────
// AUTH CHECK (CORE FIXED LOGIC)
// ─────────────────────────────────────
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        // NO SESSION → FORCE GOOGLE LOGIN
        await signInWithGoogle();
        return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        await supabase.auth.signOut();
        await signInWithGoogle();
        return;
    }

    await handleRouting(user);
}

// ─────────────────────────────────────
// EMAIL LOGIN (kept, but secondary)
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
        return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) await handleRouting(user);
}

// ─────────────────────────────────────
// EVENTS
// ─────────────────────────────────────
document
    .getElementById("emailLoginBtn")
    ?.addEventListener("click", handleEmailLogin);

window.addEventListener("load", async () => {
    await checkAuth();
});