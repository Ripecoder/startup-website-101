import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL  = "https://wbwmffhegokbnfgtfufz.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indid21mZmhlZ29rYm5mZ3RmdWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMzYzNTcsImV4cCI6MjA5MzYxMjM1N30.7KNAJ_nZwqbdFMlRmEclGPoGx2ywTUmVwn3LxfdBF-w";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ─────────────────────────────────────
// BACKEND CHECK (NO DB SIDE EFFECTS EXPECTED)
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
// FORCE GOOGLE LOGIN (NO SILENT BYPASS)
// ─────────────────────────────────────
async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: window.location.origin + "/login.html"
        }
    });

    if (error) {
        console.log("Google login error:", error.message);
    }
}

// ─────────────────────────────────────
// ROUTE USER AFTER DB CHECK
// ─────────────────────────────────────
async function routeUser(user) {
    const status = await getClientStatus(user.email);

    sessionStorage.setItem(
        "client_data",
        JSON.stringify(status.client_data || {})
    );

    if (status.exists === true) {
        window.location.href = "client-dashboard.html";
    } else {
        window.location.href = "dashboard.html";
    }
}

// ─────────────────────────────────────
// AUTH FLOW (CLEAN STATE MACHINE)
// ─────────────────────────────────────
async function checkAuth() {

    // STEP 1: FORCE FRESH SESSION CHECK
    const { data: { session } } = await supabase.auth.getSession();

    // STEP 2: NO SESSION → ALWAYS FORCE GOOGLE LOGIN
    if (!session) {
        await signInWithGoogle();
        return;
    }

    // STEP 3: VALIDATE USER (NOT JUST SESSION)
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        await supabase.auth.signOut();
        await signInWithGoogle();
        return;
    }

    // STEP 4: BUSINESS LOGIC ROUTING
    await routeUser(user);
}

// ─────────────────────────────────────
// EMAIL LOGIN (OPTIONAL SECONDARY PATH)
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
        console.log("Login error:", error.message);
        return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
        await routeUser(user);
    }
}

// ─────────────────────────────────────
// EVENTS
// ─────────────────────────────────────
document
    .getElementById("emailLoginBtn")
    ?.addEventListener("click", handleEmailLogin);

// ─────────────────────────────────────
// ENTRY POINT
// ─────────────────────────────────────
window.addEventListener("load", async () => {
    await checkAuth();
});