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
const BACKEND_URL = "https://server-6scd.onrender.com/chat";
const SESSION_ID = crypto.randomUUID();
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

  messages.push({
    role: "user",
    content: text
  });

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
        client_email: clientEmail
      })
    });

    const data = await res.json();

    console.log("SERVER RESPONSE:", data);

    chatMessages.removeChild(typing);

    addMessage(data.reply, false);

    messages.push({
      role: "assistant",
      content: data.reply
    });

    // Wait 3s then check if lead reached DB
    setTimeout(() => {
      pollLeads();
    }, 3000);

  } catch (err) {

    console.error(err);

    if (typing.parentNode) {
      chatMessages.removeChild(typing);
    }

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

let previewLeadCount = 0;

function renderLeadFromServer(lead) {

  if (!previewLeadsList) return;

  const existing = document.getElementById("demoLeadCard");

  if (existing) {
    existing.remove();
  }

  if (dashEmptyState) {
    dashEmptyState.remove();
  }

  previewLeadCount = 1;

  if (previewLeadsToday)
    previewLeadsToday.textContent = "1";

  if (previewTotalLeads)
    previewTotalLeads.textContent = "1";

  const card = document.createElement("div");

  card.id = "demoLeadCard";
  card.className = "udash-lead-card";

  card.innerHTML = `
    <div class="udash-lead-top">
      <div>
        <div class="udash-lead-name">
          ${escapeHtml(lead.intent || "New Lead")}
        </div>

        <div class="udash-lead-time">
          Lead arrived just now
        </div>
      </div>
    </div>

    <div class="udash-lead-details">
      <div class="udash-lead-item">
        Phone: ${escapeHtml(lead.phone || "N/A")}
      </div>

      <div class="udash-lead-item">
        Budget: ${escapeHtml(String(lead.budget || "N/A"))}
      </div>

      <div class="udash-lead-item">
        Location: ${escapeHtml(lead.location || "N/A")}
      </div>

      <div class="udash-lead-item">
        BHK: ${escapeHtml(lead.bhk || "N/A")}
      </div>

      <div class="udash-lead-item">
        Preference: ${escapeHtml(lead.special_preferences || "None")}
      </div>
    </div>
  `;

  previewLeadsList.prepend(card);
}

async function pollLeads() {

  try {

    const res = await fetch(
      "https://website-server-b5i0.onrender.com/api/client/leads",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          api_key: "vrb_live_n21816012_gmail.com_1780381110"
        })
      }
    );

    const data = await res.json();

    console.log("LEADS RESPONSE:", data);

    if (
      data.success &&
      data.leads &&
      data.leads.length > 0
    ) {

      console.log(
        "LATEST LEAD:",
        data.leads[0]
      );

      renderLeadFromServer(
        data.leads[0]
      );
    } else {

      console.log(
        "NO LEADS FOUND"
      );

    }

  } catch (err) {

    console.error(
      "POLL LEADS ERROR:",
      err
    );

  }
}
// Parse user messages for lead data


// Monkey-patch sendChatMessage to intercept messages

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
