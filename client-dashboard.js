// ───────────────────────────────────────
// VERBE — CLIENT DASHBOARD (FIXED CLEAN)
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

let clientData;

try {
  clientData = JSON.parse(rawClientData);
} catch (e) {
  sessionStorage.clear();
  window.location.href = "login.html";
}

if (!clientData?.api_key) {
  sessionStorage.clear();
  window.location.href = "login.html";
}

const apiKey = clientData.api_key;

// ── SUBSCRIPTION STATE ──────────────────

let timeLeftMs = Infinity;

// ── SUBSCRIPTION LOADER ─────────────────

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
    const usedFreeTrial = data.used_free_trial ?? false;

    sessionStorage.setItem("subscription_time", String(days));
    sessionStorage.setItem("used_free_trial", String(usedFreeTrial));

    updateTrialFromDB(days);

    // TRUE STATE FLAG (fixed scope issue)
    window.__SUB_ACTIVE__ = days > 0;

  } catch (err) {
    console.log("Subscription error:", err);
  }
}

// ── TRIAL UI ────────────────────────────

function updateTrialFromDB(daysRemaining) {
  timeLeftMs = (daysRemaining ?? 0) * 24 * 60 * 60 * 1000;

  updateSubscriptionBadge(daysRemaining);

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

  const seconds = Math.floor((Date.now() - new Date(timestamp)) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return `${Math.floor(hours / 24)}d ago`;
}

// ── UPDATE LEAD STATUS ──────────────────

async function updateLeadStatus(leadId, attended) {
  try {
    const res = await fetch(
      "https://website-server-9b3o.onrender.com/api/client/updateLeadStatus",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          lead_id: leadId,
          attended: attended
        })
      }
    );

    const data = await res.json();

    if (!data.success) {
      console.log("Failed to update lead status:", data);
    }
  } catch (err) {
    console.log("updateLeadStatus error:", err);
  }
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
        <input type="checkbox" class="attended-checkbox" ${lead.attended ? "checked" : ""}>
        <span>Attended</span>
      </label>
    </div>

    <div class="lead-details">
      <div class="lead-item">📞 ${lead.phoneno || "N/A"}</div>
      <div class="lead-item">💰 ${lead.budget || "N/A"}</div>
      <div class="lead-item">📍 ${lead.location || "N/A"}</div>
      <div class="lead-item">🏠 ${lead.bhk || "N/A"}</div>
      <div class="lead-item">✨ ${lead.special_preferences || "None"}</div>
    </div>
  `;

  const checkbox = card.querySelector(".attended-checkbox");

  checkbox.addEventListener("change", () => {
    updateLeadStatus(lead.id, checkbox.checked);
    updateStats();
  });

  // LOCK LOGIC (fixed)
  if (timeLeftMs <= 0) {
    card.classList.add("lead-card--locked");

    const overlay = document.createElement("div");
    overlay.className = "lead-lock-overlay";
    overlay.innerHTML = `<span>🔒 Lead access locked — upgrade to continue</span>`;

    card.appendChild(overlay);
  }

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

    if (!data.success || !data.leads) {
      leadsContainer.innerHTML = `
        <div class="lead-card">
          <div class="lead-name">Server Error</div>
          <div class="lead-time">Could not load leads</div>
        </div>
      `;
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
  const checked = document.querySelectorAll(".attended-checkbox:checked").length;
  attendedLeadsEl.textContent = checked;
}

// ── UPGRADE BUTTON ──────────────────────

upgradeBtn?.addEventListener("click", () => {
  window.location.href = "payment.html";
});

// ── INIT ────────────────────────────────

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

// ── BADGE + NAME ────────────────────────

const clientNameDisplay = document.getElementById("clientNameDisplay");
const subscriptionBadge = document.getElementById("subscriptionBadge");

if (clientNameDisplay) {
  clientNameDisplay.textContent =
    clientData.client_name ||
    sessionStorage.getItem("verbe_website") ||
    "Client";
}

function updateSubscriptionBadge(days) {
  if (!subscriptionBadge) return;

  if (days > 14) {
    subscriptionBadge.textContent = "Active Plan";
    subscriptionBadge.classList.add("paid");
  } else {
    subscriptionBadge.textContent = "Free Trial";
    subscriptionBadge.classList.remove("paid");
  }
}

const websiteName = sessionStorage.getItem("verbe_website");

if (websiteName) {
  const el = document.getElementById("websiteName");
  if (el) el.textContent = websiteName;
}