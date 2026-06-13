/* =========================================================
   Nexulith — script.js (landing + demo chat)
   ========================================================= */

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ── Sticky Header ───────────────────────────────────────── */
const header = document.getElementById('header');

window.addEventListener('scroll', () => {
  if (window.scrollY > 40) header.classList.add('scrolled');
  else header.classList.remove('scrolled');
}, { passive: true });

/* ── Mobile Nav Toggle ───────────────────────────────────── */
const navToggle = document.getElementById('navToggle');
const nav = document.getElementById('nav');

navToggle.addEventListener('click', () => {
  nav.classList.toggle('open');
  document.body.style.overflow = nav.classList.contains('open') ? 'hidden' : '';
});

nav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    document.body.style.overflow = '';
  });
});

/* ── Reveal on Scroll ────────────────────────────────────── */
const revealElements = document.querySelectorAll(
  '.flow-step, .stat-card, .testimonial-card, .pricing-card, .install-step, .demo-widget-wrap, .demo-text'
);

revealElements.forEach(el => el.classList.add('reveal'));

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

revealElements.forEach(el => revealObserver.observe(el));

/* ── Counter Animation ───────────────────────────────────── */
function animateCounter(el, target, duration = 1500) {
  let start = null;
  const step = (timestamp) => {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * target);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target;
  };
  requestAnimationFrame(step);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target, parseInt(entry.target.dataset.target, 10));
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-number[data-target]').forEach(el => {
  counterObserver.observe(el);
});

/* ── Chatbot (REAL) ─────────────────────────────────────── */
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');

let messages = [];
const BACKEND_URL = "https://server-vls8.onrender.com/chat";
const SESSION_ID = "demo_" + Date.now();

/* ── NEW: Client email capture ───────────────────────────── */

let clientEmail = "";

const emailInput = document.getElementById("client-email");

if (emailInput) {
  emailInput.addEventListener("input", (e) => {
    clientEmail = e.target.value.trim();
  });
}

/* ── Chat UI ────────────────────────────────────────────── */
function addMessage(text, isUser = false) {
  const msg = document.createElement('div');
  msg.className = `msg ${isUser ? 'user' : 'bot'}`;

  const now = new Date();
  const time = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');

  msg.innerHTML = `
    <div class="msg-bubble">${escapeHtml(text)}</div>
    <div class="msg-time">${time}</div>
  `;

  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

/* ── Send Message ───────────────────────────────────────── */
async function sendChatMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  chatInput.value = '';
  addMessage(text, true);

  messages.push({ role: "user", content: text });

  // typing indicator
  const typing = document.createElement('div');
  typing.className = 'msg bot';
  typing.innerHTML = '<div class="msg-bubble">typing…</div>';
  chatMessages.appendChild(typing);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  try {
    const res = await fetch(BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: messages,
        api_key: "vrb_live_n21816012_gmail.com_1780381110",
        session_id: SESSION_ID,
        client_email: clientEmail   // ✅ NEW FIELD ADDED
      })
    });

    const data = await res.json();
    chatMessages.removeChild(typing);

    addMessage(data.reply, false);
    messages.push({ role: "assistant", content: data.reply });
    parseBotReplyForLeadData(data.reply);

  } catch (err) {
    chatMessages.removeChild(typing);
    addMessage("Server error", false);
  }
}

/* ── Enter to Send ───────────────────────────────────────── */
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendChatMessage();
});

/* ── Dashboard Preview Integration ──────────────────────── */
const previewLeadsToday = document.getElementById('previewLeadsToday');
const previewTotalLeads = document.getElementById('previewTotalLeads');
const previewAttended = document.getElementById('previewAttended');
const previewLeadsList = document.getElementById('previewLeadsList');
const dashEmptyState = document.getElementById('dashEmptyState');

let previewLeadData = {
  phone: null,
  budget: null,
  location: null,
  bhk: null,
  preference: null,
};
let previewLeadCount = 0;
let previewCardEl = null;

function bumpStat(el) {
  el.classList.remove('bump');
  void el.offsetWidth; // reflow
  el.classList.add('bump');
  setTimeout(() => el.classList.remove('bump'), 400);
}

function updatePreviewCard() {
  if (!previewLeadsList) return;

  if (dashEmptyState && dashEmptyState.parentNode) {
    dashEmptyState.remove();
  }

  if (!previewCardEl) {
    previewLeadCount++;
    previewCardEl = document.createElement('div');
    previewCardEl.className = 'udash-lead-card';
    previewLeadsList.prepend(previewCardEl);

    if (previewLeadsToday) { previewLeadsToday.textContent = previewLeadCount; bumpStat(previewLeadsToday); }
    if (previewTotalLeads) { previewTotalLeads.textContent = previewLeadCount; bumpStat(previewTotalLeads); }
  }

  const now = new Date();
  const timeStr = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');
  const d = previewLeadData;

  previewCardEl.innerHTML = `
    <div class="udash-lead-top">
      <div>
        <div class="udash-lead-name">New Lead</div>
        <div class="udash-lead-time">Lead arrived just now · ${timeStr}</div>
      </div>
      <label class="udash-attended-wrap">
        <input type="checkbox" class="udash-attended-checkbox">
        <span>Attended</span>
      </label>
    </div>
    <div class="udash-lead-details">
      <div class="udash-lead-item">Phone: ${d.phone ? escapeHtml(d.phone) : '<span style="opacity:0.4">collecting…</span>'}</div>
      <div class="udash-lead-item">Budget: ${d.budget ? escapeHtml(d.budget) : '<span style="opacity:0.4">collecting…</span>'}</div>
      <div class="udash-lead-item">Location: ${d.location ? escapeHtml(d.location) : '<span style="opacity:0.4">collecting…</span>'}</div>
      <div class="udash-lead-item">BHK: ${d.bhk ? escapeHtml(d.bhk) : '<span style="opacity:0.4">collecting…</span>'}</div>
      <div class="udash-lead-item">Preference: ${d.preference ? escapeHtml(d.preference) : '<span style="opacity:0.4">collecting…</span>'}</div>
    </div>
  `;
}

// Parse bot replies for lead data
function parseBotReplyForLeadData(botText) {
  const lower = botText.toLowerCase();
  let updated = false;

  // Phone number detection
  const phoneMatch = botText.match(/\b(\+91[\s-]?)?[6-9]\d{9}\b/);
  if (phoneMatch && !previewLeadData.phone) {
    previewLeadData.phone = phoneMatch[0];
    updated = true;
  }

  // Budget detection (from user messages too, but we check bot confirmations)
  const budgetMatch = botText.match(/(?:budget|rs\.?|₹)\s*([\d,]+(?:\s*(?:lakh|lac|cr|crore|k|l))?)/i)
    || botText.match(/([\d,]+)\s*(lakh|lac|cr|crore|k)/i);
  if (budgetMatch && !previewLeadData.budget) {
    previewLeadData.budget = budgetMatch[0].replace(/budget[:\s]*/i, '').trim();
    updated = true;
  }

  return updated;
}

// Parse user messages for lead data
function parseUserMessageForLeadData(userText) {
  let updated = false;
  const lower = userText.toLowerCase();

  // Phone
  const phoneMatch = userText.match(/\b(\+91[\s-]?)?[6-9]\d{9}\b/);
  if (phoneMatch && !previewLeadData.phone) {
    previewLeadData.phone = phoneMatch[0];
    updated = true;
  }

  // Budget — flexible
  const budgetPatterns = [
    /(?:rs\.?|₹)\s*([\d,]+(?:\s*(?:lakh|lac|cr|crore|k))?)/i,
    /([\d,]+)\s*(lakh|lac|cr|crore|k)/i,
    /budget\s*(?:is|around|of)?\s*([\d,]+\s*(?:lakh|lac|cr|crore|k)?)/i,
  ];
  for (const pat of budgetPatterns) {
    const m = userText.match(pat);
    if (m && !previewLeadData.budget) {
      previewLeadData.budget = m[0];
      updated = true;
      break;
    }
  }

  // BHK
  const bhkMatch = userText.match(/\b([1-6])\s*bhk\b/i);
  if (bhkMatch && !previewLeadData.bhk) {
    previewLeadData.bhk = bhkMatch[0].toUpperCase();
    updated = true;
  }

  // Location — look for city names / "in <place>"
  const locationMatch = userText.match(/(?:in|at|near|around)\s+([A-Za-z\s]{3,25}?)(?:\s|,|$)/i)
    || userText.match(/\b(mumbai|pune|bangalore|bengaluru|delhi|hyderabad|chennai|kolkata|ahmedabad|surat|thane|navi mumbai|andheri|bandra|powai|malad|goregaon)\b/i);
  if (locationMatch && !previewLeadData.location) {
    previewLeadData.location = (locationMatch[1] || locationMatch[0]).trim();
    updated = true;
  }

  if (updated) updatePreviewCard();
}

// Monkey-patch sendChatMessage to intercept messages
const _origSend = sendChatMessage;
window.sendChatMessage = async function() {
  const text = chatInput.value.trim();
  if (text) parseUserMessageForLeadData(text);

  await _origSend();
};
/* ── Copy API Key ───────────────────── */
function copyApiKey() {

  const key = document.getElementById("apiKeyDisplay").innerText;

  navigator.clipboard.writeText(key)
    .then(() => {
      console.log("API key copied");
    })
    .catch(err => {
      console.error("Copy failed:", err);
    });
}


/* ── Copy Install Snippet ───────────── */
function copySnippet() {

  const snippet = document.getElementById("codeSnippet").innerText;

  navigator.clipboard.writeText(snippet)
    .then(() => {

      const btnText = document.getElementById("copyBtnText");

      btnText.textContent = "Copied!";

      setTimeout(() => {
        btnText.textContent = "Copy";
      }, 2000);

    })
    .catch(err => {
      console.error("Copy failed:", err);
    });
}