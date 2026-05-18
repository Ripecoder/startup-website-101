// ───────────────────────────────────────
// VERBE — CLIENT DASHBOARD (FIXED)
// ───────────────────────────────────────

// ── ELEMENTS ───────────────────────────

const leadsContainer = document.getElementById("leadsContainer");

const leadsTodayEl = document.getElementById("leadsToday");
const totalLeadsEl = document.getElementById("totalLeads");
const attendedLeadsEl = document.getElementById("attendedLeads");

const trialDaysEl = document.getElementById("trialDays");
const trialFillEl = document.getElementById("trialFill");

const upgradeBtn = document.getElementById("upgradeBtn");

// ── CLIENT DATA (SOURCE OF TRUTH) ───────

const rawClientData = sessionStorage.getItem("client_data");

if (!rawClientData) {
  window.location.href = "login.html";
}

const clientData = JSON.parse(rawClientData);
const apiKey = clientData.api_key;

// ── LOCAL STORAGE (UI ONLY) ─────────────

if (!localStorage.getItem("verbe_attended")) {
  localStorage.setItem("verbe_attended", "0");
}

// ── SUBSCRIPTION LOADER (DB TRUTH) ─────

async function loadSubscriptionTime() {
  try {

    const res = await fetch(
      `https://website-server-9b3o.onrender.com/api/client/time?api_key=${apiKey}`
    );

    const data = await res.json();

    if (!data.success) {
      console.log("Subscription fetch failed");
      return;
    }

    const days = data.subscription_time ?? 0;

    sessionStorage.setItem("subscription_time", days);

    updateTrialFromDB(days);

  } catch (err) {
    console.log("Subscription error:", err);
  }
}

// ── TRIAL UI (DB DRIVEN) ───────────────

function updateTrialFromDB(daysRemaining) {

  if (daysRemaining <= 0) {
    trialDaysEl.textContent = "Trial Expired";
    trialFillEl.style.width = "0%";
    return;
  }

  trialDaysEl.textContent = `${daysRemaining} days remaining`;

  const percentage = Math.max(0, (daysRemaining / 30) * 100);
  trialFillEl.style.width = `${percentage}%`;
}

// ── FORMAT TIME ─────────────────────────

function formatTime(timestamp) {
  if (!timestamp) return "Just now";

  const seconds = Math.floor(
    (Date.now() - new Date(timestamp)) / 1000
  );

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return `${Math.floor(hours / 24)}d ago`;
}

// ── CREATE LEAD CARD ────────────────────

function createLeadCard(lead) {

  const card = document.createElement("div");
  card.className = "lead-card";

  card.innerHTML = `
    <div class="lead-top">

      <div>
        <div class="lead-name">
          ${lead.intent || "New Lead"}
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
      <div class="lead-item">🏠 ${lead.bhk || "N/A"}</div>
      <div class="lead-item">✨ ${lead.special_preferences || "None"}</div>

    </div>
  `;

  const checkbox = card.querySelector(".attended-checkbox");

  checkbox.addEventListener("change", () => {

    let attended = parseInt(localStorage.getItem("verbe_attended"));

    if (checkbox.checked) attended++;
    else attended = Math.max(0, attended - 1);

    localStorage.setItem("verbe_attended", attended);

    updateStats();
  });

  leadsContainer.prepend(card);
}

// ── LOAD LEADS ──────────────────────────

let loading = false;

async function loadLeads() {

  if (loading) return;
  loading = true;

  try {

    const res = await fetch(
      "https://website-server-9b3o.onrender.com/api/client/leads",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey })
      }
    );

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

// ── STATS ───────────────────────────────

function updateStats() {
  const attended = parseInt(localStorage.getItem("verbe_attended"));
  attendedLeadsEl.textContent = attended;
}

// ── UPGRADE BUTTON ──────────────────────

upgradeBtn.addEventListener("click", () => {
  window.location.href = "payment.html";
});

// ── BOOTSTRAP (CRITICAL FIX) ─────────────

async function initDashboard() {

  if (!apiKey) {
    window.location.href = "login.html";
    return;
  }

  await loadSubscriptionTime();
  await loadLeads();
  updateStats();
}

document.addEventListener("DOMContentLoaded", initDashboard);

// ── WEBSITE NAME ────────────────────────

const websiteName = sessionStorage.getItem("verbe_website");

if (websiteName) {
  document.getElementById("websiteName").textContent = websiteName;
}

// ── SCRIPT VIEW ─────────────────────────

document.getElementById("viewScriptBtn")?.addEventListener("click", () => {

  const key = sessionStorage.getItem("verbe_api_key");
  const website = sessionStorage.getItem("verbe_website") || "your-site";

  if (!key) return alert("API key missing");

  const script = `
<script src="https://chatbot-connect.vercel.app/chatbot.js"
  data-key="${key}"
  data-client_name="${website}">
</script>`;

  alert(script);
});

// ── COPY API KEY ────────────────────────

document.getElementById("copyApiKeyBtn")?.addEventListener("click", async () => {

  const key = sessionStorage.getItem("verbe_api_key");

  if (!key) return;

  await navigator.clipboard.writeText(key);

  const btn = document.getElementById("copyApiKeyBtn");
  btn.textContent = "Copied";

  setTimeout(() => {
    btn.textContent = "Copy API Key";
  }, 1200);
});

// ── WHATSAPP BUTTON ─────────────────────

document.getElementById("whatsappSetupBtn")?.addEventListener("click", () => {
  alert("WhatsApp integration is under development.");
});