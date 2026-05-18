// ───────────────────────────────────────
// VERBE — CLIENT DASHBOARD
// client-dashboard.js
// ───────────────────────────────────────

// ── ELEMENTS ───────────────────────────
// UI AFFECT: YES
// These grab HTML elements from the page.
// If IDs change in HTML, dashboard breaks visually.

const leadsContainer = document.getElementById("leadsContainer");

const leadsTodayEl = document.getElementById("leadsToday");
const totalLeadsEl = document.getElementById("totalLeads");
const attendedLeadsEl = document.getElementById("attendedLeads");

const trialDaysEl = document.getElementById("trialDays");
const trialFillEl = document.getElementById("trialFill");

const upgradeBtn = document.getElementById("upgradeBtn");

// ── API KEY (CRITICAL) ──────────────────
// UI AFFECT: NO
// Pure backend/session logic.
// Used to securely fetch leads.

const apiKey = sessionStorage.getItem("verbe_api_key");

// ── LOCAL STORAGE ──────────────────────
// UI AFFECT: INDIRECT
// Stores persistent browser-side data.
// Affects stats/trial display later.

if (!localStorage.getItem("verbe_trial_start")) {
  localStorage.setItem("verbe_trial_start", Date.now());
}

if (!localStorage.getItem("verbe_attended")) {
  localStorage.setItem("verbe_attended", "0");
}

// ── TRIAL UI ───────────────────────────
// UI AFFECT: YES
// Updates trial progress bar and text.

function updateTrialUI() {
  const start = parseInt(localStorage.getItem("verbe_trial_start"));
  const now = Date.now();

  const daysPassed = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  const daysRemaining = 14 - daysPassed;

  const percentage = Math.max(0, ((14 - daysPassed) / 14) * 100);

  if (daysRemaining <= 0) {
    trialDaysEl.textContent = "Trial Expired";
    trialFillEl.style.width = "0%";

    document.getElementById("trialBadge").textContent = "Trial Expired";
    return;
  }

  trialDaysEl.textContent = `${daysRemaining} days remaining`;
  trialFillEl.style.width = `${percentage}%`;
}

updateTrialUI();

// ── FORMAT TIME ────────────────────────
// UI AFFECT: INDIRECT
// Pure formatting helper.
// Changes displayed timestamps only.

function formatTime(timestamp) {
  if (!timestamp) return "Just now";

  const seconds = Math.floor(
    (Date.now() - new Date(timestamp)) / 1000
  );

  if (seconds < 60) {
    return `${seconds}s ago`;
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  return `${days}d ago`;
}

// ── CREATE LEAD CARD ───────────────────
// UI AFFECT: MASSIVE
// Dynamically builds lead cards shown on dashboard.

function createLeadCard(lead) {
  const card = document.createElement("div");
  card.className = "lead-card";

  card.innerHTML = `
    <div class="lead-top">

      <div>
        <div class="lead-name">
          ${lead.intent || lead.name || "New Lead"}
        </div>

        <div class="lead-time">
          Lead arrived ${formatTime(lead.created_at)}
        </div>
      </div>

      <label class="attended-wrap">
        <input type="checkbox" class="attended-checkbox">
        <span>Attended</span>
      </label>

    </div>

    <div class="lead-details">

      <div class="lead-item">📞 ${lead.phone || "N/A"}</div>
      <div class="lead-item">💰 ${lead.budget || "N/A"}</div>
      <div class="lead-item">📍 ${lead.location || "N/A"}</div>
      <div class="lead-item">🏠 ${lead.bhk || "N/A"} BHK</div>
      <div class="lead-item">✨ ${lead.special_preferences || "None"}</div>

    </div>
  `;

  const checkbox = card.querySelector(".attended-checkbox");

  checkbox.addEventListener("change", () => {
    let attended = parseInt(localStorage.getItem("verbe_attended"));

    if (checkbox.checked) {
      attended++;
    } else {
      attended = Math.max(0, attended - 1);
    }

    localStorage.setItem("verbe_attended", attended);
    updateStats();
  });

  leadsContainer.prepend(card);
}

// ── LOAD LEADS (TENANT-SAFE) ───────────
// UI AFFECT: MASSIVE
// Fetches leads from Flask backend and renders dashboard.

let loading = false;

async function loadLeads() {
  if (loading) return;
  loading = true;

  try {
    if (!apiKey) {
      throw new Error("Missing API key");
    }

    const res = await fetch(
      `https://website-server-9b3o.onrender.com/api/client?api_key=${apiKey}`
    );

    if (!res.ok) {
      throw new Error("HTTP " + res.status);
    }

    const data = await res.json();

    leadsContainer.innerHTML = "";

    if (!data.leads || data.leads.length === 0) {
      leadsContainer.innerHTML = `
        <div class="lead-card">
          <div class="lead-name">No leads yet</div>
          <div class="lead-time">Waiting for visitors...</div>
        </div>
      `;

      leadsTodayEl.textContent = "0";
      totalLeadsEl.textContent = "0";
      updateStats();
      return;
    }

    data.leads.reverse().forEach(createLeadCard);

    leadsTodayEl.textContent = data.leads.length;
    totalLeadsEl.textContent = data.leads.length;

    updateStats();

  } catch (err) {
    console.log("FAILED TO LOAD LEADS", err);

    leadsContainer.innerHTML = `
      <div class="lead-card">
        <div class="lead-name">Server Error</div>
        <div class="lead-time">Could not load leads</div>
      </div>
    `;
  } finally {
    loading = false;
  }
}

loadLeads();

// ── AUTO REFRESH ───────────────────────
// UI AFFECT: YES
// Refreshes dashboard every minute.

setInterval(loadLeads, 60000);

// ── STATS ──────────────────────────────
// UI AFFECT: YES
// Updates attended leads counter.

function updateStats() {
  const attended = parseInt(localStorage.getItem("verbe_attended"));
  attendedLeadsEl.textContent = attended;
}

// ── UPGRADE BUTTON ─────────────────────
// UI AFFECT: YES
// Button click routing only.

upgradeBtn.addEventListener("click", () => {
  window.location.href = "payment.html";
});

// ── WEBSITE NAME ───────────────────────
// UI AFFECT: YES
// Shows website/business name on dashboard.

const websiteName = sessionStorage.getItem("verbe_website");

if (websiteName) {
  document.getElementById("websiteName").textContent = websiteName;
}

console.log("CLIENT DASHBOARD LOADED");

// ── SCRIPT VIEW BUTTON ─────────────────
// UI AFFECT: YES
// Shows install script popup.

const viewScriptBtn = document.getElementById("viewScriptBtn");

if (viewScriptBtn) {
  viewScriptBtn.addEventListener("click", () => {
    const key = sessionStorage.getItem("verbe_api_key");

    if (!key) return alert("API key missing");

    const website = sessionStorage.getItem("verbe_website") || "your-site";

    const script = `
<script src="https://chatbot-connect.vercel.app/chatbot.js"
  data-key="${key}"
  data-client_name="${website}">
</script>`;

    alert("Copy this script:\n\n" + script);
  });
}

// ── COPY API KEY BUTTON ────────────────
// UI AFFECT: YES
// Clipboard + temporary button text.

const copyApiKeyBtn = document.getElementById("copyApiKeyBtn");

if (copyApiKeyBtn) {
  copyApiKeyBtn.addEventListener("click", async () => {
    const key = sessionStorage.getItem("verbe_api_key");

    if (!key) return;

    await navigator.clipboard.writeText(key);

    copyApiKeyBtn.textContent = "Copied";

    setTimeout(() => {
      copyApiKeyBtn.textContent = "Copy API Key";
    }, 1200);
  });
}

// ── WHATSAPP BUTTON ────────────────────
// UI AFFECT: YES
// Placeholder feature popup only.

const whatsappBtn = document.getElementById("whatsappSetupBtn");

if (whatsappBtn) {
  whatsappBtn.addEventListener("click", () => {
    alert("WhatsApp integration is under development.");
  });
}