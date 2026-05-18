import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL  = "https://wbwmffhegokbnfgtfufz.supabase.co";
const SUPABASE_ANON = "YOUR_ANON_KEY";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ─────────────────────────────────────
// GET CLIENT STATUS FROM BACKEND
// ─────────────────────────────────────

// ─────────────────────────────────────
// GET CLIENT STATUS FROM BACKEND
// ─────────────────────────────────────

async function getClientStatus(email) {

    const response = await fetch(
        "https://website-server-9b3o.onrender.com/api/client/status",
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

    const { data } = await supabase.auth.getSession();

    const session = data.session;

    // USER NOT LOGGED IN
    if (!session) return;

    // GET EMAIL
    const email = session.user.email;

    // ASK FLASK SERVER
    const status = await getClientStatus(email);

    // STORE CLIENT DATA FOR BOTH CASES
    sessionStorage.setItem(
        "client_data",
        JSON.stringify(status.client_data)
    );

    // EXISTING CLIENT
    if (status.exists) {

        window.location.href = "client-dashboard.html";

        return;
    }

    // NEW USER
    window.location.href = "dashboard.html";
}
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