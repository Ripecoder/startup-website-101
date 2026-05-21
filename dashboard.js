/* =========================================================
   Nexulith - dashboard.js
   This page is the client signup/onboarding flow.
   ========================================================= */

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://wbwmffhegokbnfgtfufz.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indid21mZmhlZ29rYm5mZ3RmdWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMzYzNTcsImV4cCI6MjA5MzYxMjM1N30.7KNAJ_nZwqbdFMlRmEclGPoGx2ywTUmVwn3LxfdBF-w";
const API_BASE_URL = "https://website-server-9b3o.onrender.com";
const MASKED_KEY = "vrb_live_................";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

let currentUser = null;
let clientData = null;
let keyVisible = false;

const emailEl = document.getElementById("userEmail");
const avatarEl = document.getElementById("userAvatar");
const emailInput = document.getElementById("userEmailInput");
const apikeyDisplay = document.getElementById("apikeyDisplay");
const formErrorEl = document.getElementById("formError");
const nextBtn = document.getElementById("nextBtn");
const copyScriptText = document.getElementById("copyScriptText");

function redirectToLogin() {
  window.location.href = "login.html";
}

async function readJson(response) {
  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.success) {
    throw new Error(data?.message || "Server error");
  }

  return data;
}

function storeClientData(data) {
  clientData = data;
  sessionStorage.setItem("client_data", JSON.stringify(data));
}

async function getClientStatus(email) {
  const response = await fetch(`${API_BASE_URL}/api/client/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });

  return readJson(response);
}

async function storeOnboarding(payload) {
  const response = await fetch(`${API_BASE_URL}/api/client/store`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return readJson(response);
}

function getStoredClientData() {
  try {
    return JSON.parse(sessionStorage.getItem("client_data") || "null");
  } catch {
    sessionStorage.removeItem("client_data");
    return null;
  }
}

async function loadAuthenticatedClient() {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    redirectToLogin();
    return;
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user?.email) {
    await supabase.auth.signOut();
    redirectToLogin();
    return;
  }

  currentUser = user;

  const storedClient = getStoredClientData();

  if (storedClient?.email === user.email && storedClient?.api_key) {
    storeClientData(storedClient);
    return;
  }

  const status = await getClientStatus(user.email);

  if (!status.client_data?.email || !status.client_data?.api_key) {
    throw new Error("Server returned incomplete client data");
  }

  storeClientData(status.client_data);
}

function renderUser() {
  const email = clientData?.email || currentUser?.email || "";

  if (emailEl) emailEl.textContent = email;
  if (avatarEl) avatarEl.textContent = email ? email.charAt(0).toUpperCase() : "?";
  if (emailInput) {
    emailInput.value = email;
    emailInput.readOnly = true;
  }

  if (apikeyDisplay) {
    apikeyDisplay.dataset.key = clientData?.api_key || "";
    apikeyDisplay.textContent = MASKED_KEY;
  }
}

function prefillOnboardingForm() {
  const userName = document.getElementById("userName");
  const userPhone = document.getElementById("userPhone");
  const userWebsite = document.getElementById("userWebsite");
  const userWebsiteName = document.getElementById("userWebsiteName");

  if (userName && clientData?.user_name) userName.value = clientData.user_name;
  if (userPhone && clientData?.phone) userPhone.value = clientData.phone;
  if (userWebsite && clientData?.website) userWebsite.value = clientData.website;
  if (userWebsiteName && clientData?.client_name) userWebsiteName.value = clientData.client_name;
}

function setFormLoading(isLoading) {
  if (!nextBtn) return;

  nextBtn.disabled = isLoading;
  nextBtn.textContent = isLoading ? "Saving..." : "Continue -> Get your script";
}

function showFieldError(message, inputId) {
  if (formErrorEl) formErrorEl.textContent = message;
  document.getElementById(inputId)?.classList.add("error");
}

function clearFormError() {
  if (formErrorEl) formErrorEl.textContent = "";
  document.querySelectorAll(".field-input").forEach(input => {
    input.classList.remove("error");
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buildScriptTag(apiKey, clientName) {
  return `<!-- Nexulith Chatbot -->
<script src="https://chatbot-connect.vercel.app/chatbot.js" data-key="${apiKey}" data-client_name="${clientName}"><\/script>`;
}

function showStep(stepNumber) {
  document.querySelectorAll(".step-content").forEach(step => {
    step.classList.add("hidden");
  });

  document.getElementById(`step${stepNumber}`)?.classList.remove("hidden");

  document.querySelectorAll(".steps-bar .step").forEach((step, index) => {
    step.classList.toggle("active", index + 1 <= stepNumber);
  });
}

window.switchSection = function(section) {
  document.querySelectorAll(".nav-item").forEach(item => {
    item.classList.toggle("active", item.dataset.section === section);
  });

  document.querySelectorAll(".section-panel").forEach(panel => {
    panel.classList.remove("active");
  });

  document.getElementById(`section-${section}`)?.classList.add("active");
};

window.goToStep2 = async function() {
  clearFormError();

  const name = document.getElementById("userName")?.value?.trim() || "";
  const email = currentUser?.email || clientData?.email || "";
  const phone = document.getElementById("userPhone")?.value?.trim() || "";
  const website = document.getElementById("userWebsite")?.value?.trim() || "";
  const websiteName = document.getElementById("userWebsiteName")?.value?.trim() || "";
  const apiKey = clientData?.api_key;

  if (!name) return showFieldError("Enter name", "userName");
  if (!email || !isValidEmail(email)) return showFieldError("Invalid email", "userEmailInput");
  if (!phone || phone.length < 8) return showFieldError("Invalid phone", "userPhone");
  if (!website) return showFieldError("Enter website", "userWebsite");
  if (!websiteName) return showFieldError("Enter business name", "userWebsiteName");
  if (!apiKey) return showFieldError("Missing API key. Please sign in again.", "userEmailInput");

  setFormLoading(true);

  try {
    const result = await storeOnboarding({
      name,
      email,
      phone,
      website,
      website_name: websiteName,
      client_api_key: apiKey
    });

    if (result.client_data) storeClientData(result.client_data);

    sessionStorage.setItem("Nexulith_website", websiteName);

    const scriptTag = buildScriptTag(clientData.api_key, websiteName);
    const scriptCode = document.getElementById("scriptCode");
    if (scriptCode) scriptCode.textContent = scriptTag;

    renderUser();
    showStep(2);
  } catch (err) {
    if (formErrorEl) formErrorEl.textContent = err.message || "Server unreachable";
  } finally {
    setFormLoading(false);
  }
};

window.goToStep1 = function() {
  showStep(1);
};

window.goToStep3 = function() {
  showStep(3);

  let width = 0;
  const fill = document.getElementById("loadingFill");

  const interval = setInterval(() => {
    width += 2;
    if (fill) fill.style.width = `${width}%`;

    if (width >= 100) {
      clearInterval(interval);
      window.location.href = "payment.html";
    }
  }, 30);
};

async function copyText(text) {
  if (!text) return false;

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  return copied;
}

window.copyScript = async function() {
  const text = document.getElementById("scriptCode")?.textContent || "";

  try {
    const copied = await copyText(text);
    if (!copyScriptText) return;

    copyScriptText.textContent = copied ? "Copied" : "Copy failed";
    setTimeout(() => {
      copyScriptText.textContent = "Copy";
    }, 1600);
  } catch {
    if (copyScriptText) copyScriptText.textContent = "Copy failed";
  }
};

window.toggleKeyVisibility = function() {
  if (!apikeyDisplay) return;

  keyVisible = !keyVisible;
  apikeyDisplay.textContent = keyVisible
    ? apikeyDisplay.dataset.key
    : MASKED_KEY;
};

window.copyApiKey = async function() {
  const text = apikeyDisplay?.dataset.key || "";
  await copyText(text);
};

document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  sessionStorage.clear();
  await supabase.auth.signOut();
  redirectToLogin();
});

document.querySelectorAll(".nav-item").forEach(item => {
  item.addEventListener("click", (event) => {
    event.preventDefault();
    window.switchSection(item.dataset.section);
  });
});

document.querySelectorAll(".field-input").forEach(input => {
  input.addEventListener("input", () => {
    input.classList.remove("error");
    if (formErrorEl) formErrorEl.textContent = "";
  });
});

try {
  await loadAuthenticatedClient();
  renderUser();
  prefillOnboardingForm();
} catch (err) {
  if (formErrorEl) formErrorEl.textContent = err.message || "Could not load signup data";
}
