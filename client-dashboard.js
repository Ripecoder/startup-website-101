/* =========================================================
   Nexulith - client-dashboard.js
   Client dashboard view backed by the server as source of truth.
   ========================================================= */

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const SUPABASE_URL = "https://wbwmffhegokbnfgtfufz.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indid21mZmhlZ29rYm5mZ3RmdWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMzYzNTcsImV4cCI6MjA5MzYxMjM1N30.7KNAJ_nZwqbdFMlRmEclGPoGx2ywTUmVwn3LxfdBF-w";
const API_BASE_URL = "https://website-server-9b3o.onrender.com";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

let clientData = null;
let leads = [];
let subscriptionDays = 0;
let loadingLeads = false;

const leadsContainer = document.getElementById("leadsContainer");
const leadsTodayEl = document.getElementById("leadsToday");
const totalLeadsEl = document.getElementById("totalLeads");
const attendedLeadsEl = document.getElementById("attendedLeads");
const trialDaysEl = document.getElementById("trialDays");
const trialFillEl = document.getElementById("trialFill");
const upgradeBtn = document.getElementById("upgradeBtn");
const clientNameDisplay = document.getElementById("clientNameDisplay");
const subscriptionBadge = document.getElementById("subscriptionBadge");
const websiteNameEl = document.getElementById("websiteName");

const modalOverlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const modalClose = document.getElementById("modalClose");
const apiKeyView = document.getElementById("apiKeyView");
const scriptView = document.getElementById("scriptView");
const apiKeyCode = document.getElementById("apiKeyCode");
const scriptCode = document.getElementById("scriptCode");

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

async function postJson(path, payload) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return readJson(response);
}

async function getJson(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);
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

function setClientData(data) {
  clientData = data;
  sessionStorage.setItem("client_data", JSON.stringify(data));
}

async function loadClientFromAuth() {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    redirectToLogin();
    return false;
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user?.email) {
    await supabase.auth.signOut();
    redirectToLogin();
    return false;
  }

  const storedClient = getStoredClientData();

  if (storedClient?.email === user.email && storedClient?.api_key) {
    setClientData(storedClient);
  }

  let status;
  try {
    status = await postJson("/api/client/auth", { email: user.email });
  } catch {
    if (leadsContainer) {
      leadsContainer.innerHTML = emptyLeadCard(
        "Server waking up...",
        "This usually takes 30 seconds. Retrying automatically..."
      );
    }
    setTimeout(() => window.location.reload(), 12000);
    return false;
  }

  if (!status.exists || !status.onboarded) {
    window.location.href = "dashboard.html";
    return false;
  }

  if (!status.client_data?.api_key) {
    if (leadsContainer) {
      leadsContainer.innerHTML = emptyLeadCard(
        "Session Error",
        "Could not load your account. Please log in again."
      );
    }
    setTimeout(() => redirectToLogin(), 3000);
    return false;
  }

  setClientData(status.client_data);
  return true;
}

function buildScriptTag() {
  const clientName = clientData?.client_name || "Client";

  return `<!-- Nexulith Chatbot -->
<script src="https://chatbot-connect.vercel.app/chatbot.js" data-key="${clientData.api_key}" data-client_name="${clientName}"><\/script>`;
}

function renderClientHeader() {
  const clientName = clientData?.client_name || "Client";
  const website = clientData?.website || "Connected";

  if (clientNameDisplay) clientNameDisplay.textContent = clientName;
  if (websiteNameEl) websiteNameEl.textContent = website;
  if (apiKeyCode) apiKeyCode.textContent = clientData?.api_key || "";
  if (scriptCode) scriptCode.textContent = buildScriptTag();
}

function updateSubscriptionBadge(days) {
  if (!subscriptionBadge) return;

  subscriptionBadge.classList.toggle("paid", days > 14);
  subscriptionBadge.textContent = days > 14 ? "Active Plan" : "Free Trial";
}

function updateTrialUi(days) {
  subscriptionDays = Number(days || 0);
  updateSubscriptionBadge(subscriptionDays);

  if (!trialDaysEl || !trialFillEl) return;

  if (subscriptionDays <= 0) {
    trialDaysEl.textContent = "Trial Expired";
    trialFillEl.style.width = "0%";
    return;
  }

  trialDaysEl.textContent = `${subscriptionDays} days remaining`;
  trialFillEl.style.width = `${Math.min(100, (subscriptionDays / 30) * 100)}%`;
}

async function loadSubscriptionTime() {
  const data = await getJson(`/api/client/time?api_key=${encodeURIComponent(clientData.api_key)}`);
  updateTrialUi(data.subscription_time ?? 0);
}

function formatTime(timestamp) {
  if (!timestamp) return "Just now";

  const created = new Date(timestamp);
  if (Number.isNaN(created.getTime())) return "Just now";

  const seconds = Math.max(0, Math.floor((Date.now() - created.getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return `${Math.floor(hours / 24)}d ago`;
}

function isToday(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  return date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate();
}

function formatMoney(value) {
  if (value === null || value === undefined || value === "") return "N/A";
  const number = Number(value);
  if (Number.isNaN(number)) return String(value);
  return `Rs ${number.toLocaleString("en-IN")}`;
}

function emptyLeadCard(title, subtitle) {
  return `
    <div class="lead-card">
      <div class="lead-name">${escapeHtml(title)}</div>
      <div class="lead-time">${escapeHtml(subtitle)}</div>
    </div>
  `;
}

function renderStats() {
  const today = leads.filter(lead => isToday(lead.created_at)).length;
  const attended = leads.filter(lead => lead.attended).length;

  if (leadsTodayEl) leadsTodayEl.textContent = today;
  if (totalLeadsEl) totalLeadsEl.textContent = leads.length;
  if (attendedLeadsEl) attendedLeadsEl.textContent = attended;
}

function createLeadCard(lead) {
  const card = document.createElement("div");
  card.className = "lead-card";
  card.dataset.leadId = lead.id;

  const phone = lead.phone || lead.phoneno || "N/A";
  const intent = escapeHtml(lead.intent || "New Lead");
  const phoneSafe = escapeHtml(phone);
  const budgetSafe = escapeHtml(formatMoney(lead.budget));
  const locationSafe = escapeHtml(lead.location || "N/A");
  const bhkSafe = escapeHtml(lead.bhk || "N/A");
  const prefsSafe = escapeHtml(lead.special_preferences || "None");
  const arrivedSafe = escapeHtml(formatTime(lead.created_at));

  card.innerHTML = `
    <div class="lead-top">
      <div>
        <div class="lead-name">${intent}</div>
        <div class="lead-time">Lead arrived ${arrivedSafe}</div>
      </div>

      <label class="attended-wrap">
        <input type="checkbox" class="attended-checkbox" ${lead.attended ? "checked" : ""}>
        <span>Attended</span>
      </label>
    </div>

    <div class="lead-details">
      <div class="lead-item">Phone: ${phoneSafe}</div>
      <div class="lead-item">Budget: ${budgetSafe}</div>
      <div class="lead-item">Location: ${locationSafe}</div>
      <div class="lead-item">BHK: ${bhkSafe}</div>
      <div class="lead-item">Preference: ${prefsSafe}</div>
    </div>
  `;

  const checkbox = card.querySelector(".attended-checkbox");

  checkbox?.addEventListener("change", async () => {
    const previousValue = Boolean(lead.attended);
    lead.attended = checkbox.checked;
    renderStats();

    try {
      await updateLeadStatus(lead.id, checkbox.checked);
    } catch {
      lead.attended = previousValue;
      checkbox.checked = previousValue;
      renderStats();
    }
  });

  if (subscriptionDays <= 0) {
    card.classList.add("lead-card--locked");

    const overlay = document.createElement("div");
    overlay.className = "lead-lock-overlay";
    overlay.innerHTML = "<span>Lead access locked - upgrade to continue</span>";
    card.appendChild(overlay);
  }

  return card;
}

function renderLeads() {
  if (!leadsContainer) return;

  leadsContainer.innerHTML = "";

  if (!leads.length) {
    leadsContainer.innerHTML = emptyLeadCard(
      "No leads yet",
      "New chatbot leads will appear here automatically."
    );
    renderStats();
    return;
  }

  leads.forEach(lead => {
    leadsContainer.appendChild(createLeadCard(lead));
  });

  renderStats();
}

async function loadLeads({ quiet = false } = {}) {
  if (loadingLeads || !clientData?.api_key) return;
  loadingLeads = true;

  if (!quiet && leadsContainer && !leads.length) {
    leadsContainer.innerHTML = emptyLeadCard("Loading leads", "Checking your latest chatbot captures...");
  }

  try {
    const data = await postJson("/api/client/leads", {
      api_key: clientData.api_key
    });

    leads = Array.isArray(data.leads) ? data.leads : [];
    renderLeads();
  } catch {
    if (leadsContainer && !quiet) {
      leadsContainer.innerHTML = emptyLeadCard("Server Error", "Could not load leads.");
    }
  } finally {
    loadingLeads = false;
  }
}

async function updateLeadStatus(leadId, attended) {
  await postJson("/api/client/updateLeadStatus", {
    api_key: clientData.api_key,
    lead_id: leadId,
    attended
  });
}

async function copyText(text, button) {
  if (!text) return;

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
  } else {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }

  if (button) {
    const original = button.textContent;
    button.textContent = "Copied";
    button.classList.add("copied");
    setTimeout(() => {
      button.textContent = original;
      button.classList.remove("copied");
    }, 1500);
  }
}

function showModal(view) {
  if (!modalOverlay || !modalTitle) return;

  apiKeyView?.classList.toggle("active", view === "apiKey");
  scriptView?.classList.toggle("active", view === "script");
  modalTitle.textContent = view === "apiKey" ? "API Key" : "Install Script";

  if (apiKeyCode) apiKeyCode.textContent = clientData?.api_key || "";
  if (scriptCode) scriptCode.textContent = buildScriptTag();

  modalOverlay.classList.add("open");
}

function closeModal() {
  modalOverlay?.classList.remove("open");
}

function wireActions() {
  upgradeBtn?.addEventListener("click", () => {
    window.location.href = "payment.html";
  });

  document.getElementById("viewScriptBtn")?.addEventListener("click", () => {
    showModal("script");
  });

  document.getElementById("copyApiKeyBtn")?.addEventListener("click", async (event) => {
    await copyText(clientData?.api_key || "", event.currentTarget);
  });

  document.getElementById("whatsappSetupBtn")?.addEventListener("click", (event) => {
    event.currentTarget.textContent = "Coming Soon";
  });

  document.getElementById("apiKeyCopyBtn")?.addEventListener("click", async (event) => {
    await copyText(clientData?.api_key || "", event.currentTarget);
  });

  document.getElementById("scriptCopyBtn")?.addEventListener("click", async (event) => {
    await copyText(buildScriptTag(), event.currentTarget);
  });

  modalClose?.addEventListener("click", closeModal);
  modalOverlay?.addEventListener("click", (event) => {
    if (event.target === modalOverlay) closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
  });
}

async function initDashboard() {
  try {
    const hasClient = await loadClientFromAuth();
    if (!hasClient) return;

    renderClientHeader();
    wireActions();
    await loadSubscriptionTime();
    await loadLeads();

    setInterval(() => {
      loadLeads({ quiet: true });
    }, 15000);
  } catch {
    if (leadsContainer) {
      leadsContainer.innerHTML = emptyLeadCard("Dashboard Error", "Could not load your client dashboard.");
    }
  }
}

await initDashboard();
