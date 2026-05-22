import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://wbwmffhegokbnfgtfufz.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indid21mZmhlZ29rYm5mZ3RmdWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMzYzNTcsImV4cCI6MjA5MzYxMjM1N30.7KNAJ_nZwqbdFMlRmEclGPoGx2ywTUmVwn3LxfdBF-w";
const API_BASE_URL = "https://website-server-9b3o.onrender.com";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

const googleLoginBtn = document.getElementById("googleLoginBtn");
const emailLoginBtn = document.getElementById("emailLoginBtn");
const errorMsg = document.getElementById("errorMsg");
const passwordInput = document.getElementById("passwordInput");
const togglePasswordBtn = document.getElementById("togglePassword");

function showError(message) {
    if (!errorMsg) return;
    errorMsg.textContext = message;
    errorMsg.classList.toggle("visible", Boolean(message));
}

function setEmailLoading(isLoading) {
    if (!emailLoginBtn) return;

    emailLoginBtn.disabled = isLoading;

    const btnText = document.getElementById("btnText");
    const btnSpinner = document.getElementById("btnSpinner");

    if (btnText) btnText.textContent = isLoading ? "Signing in..." : "Sign in";
    btnSpinner?.classList.toggle("hidden", !isLoading);
}

async function getClientStatus(email) {
    const response = await fetch(`${API_BASE_URL}/api/client/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Unable to load client status");
    }

    return data;
}

async function signInWithGoogle() {
    showError("");

    const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: `${window.location.origin}/login.html`
        }
    });

    if (error) showError(error.message);
}

function storeClientSession(clientData) {
    sessionStorage.setItem("client_data", JSON.stringify(clientData));
}

function getDashboardUrl(status) {
    return status.onboarded ? "client-dashboard.html" : "dashboard.html";
}

async function routeUser(user) {
    if (!user?.email) {
        throw new Error("Missing authenticated user email");
    }

    const status = await getClientStatus(user.email);
    const clientData = status.client_data;
    const dashboardUrl = getDashboardUrl(status);

    if (clientData?.email) {
        storeClientSession(clientData);
    }

    if (status.onboarded && !clientData?.api_key) {
        throw new Error("Server returned incomplete client data");
    }

    window.location.href = dashboardUrl;
}

async function routeExistingSession() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) return;

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        await supabase.auth.signOut();
        return;
    }

    await routeUser(user);
}

async function handleEmailLogin() {
    const email = document.getElementById("emailInput")?.value?.trim();
    const password = document.getElementById("passwordInput")?.value;

    showError("");

    if (!email || !password) {
        showError("Enter your email and password.");
        return;
    }

    setEmailLoading(true);

    try {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            showError(error.message);
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        await routeUser(user);
    } catch (err) {
        showError(err.message || "Login failed. Try again.");
    } finally {
        setEmailLoading(false);
    }
}

googleLoginBtn?.addEventListener("click", signInWithGoogle);
emailLoginBtn?.addEventListener("click", handleEmailLogin);
togglePasswordBtn?.addEventListener("click", () => {
    if (!passwordInput) return;

    passwordInput.type = passwordInput.type === "password" ? "text" : "password";
});

window.addEventListener("load", async () => {
    try {
        await routeExistingSession();
    } catch (err) {
        showError(err.message || "Could not finish login.");
    }
});
