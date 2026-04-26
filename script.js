/* =========================================================
   VERBE — script.js
   Scroll effects · Chatbot demo · Copy logic · Animations
   ========================================================= */

/* ── Sticky Header ───────────────────────────────────────── */
const header = document.getElementById('header');

window.addEventListener('scroll', () => {
  if (window.scrollY > 40) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
}, { passive: true });

/* ── Mobile Nav Toggle ───────────────────────────────────── */
const navToggle = document.getElementById('navToggle');
const nav       = document.getElementById('nav');

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
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      // Stagger children in the same parent
      const siblings = [...entry.target.parentElement.querySelectorAll('.reveal')];
      const idx = siblings.indexOf(entry.target);
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, idx * 80);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

revealElements.forEach(el => revealObserver.observe(el));

/* ── Counter Animation ───────────────────────────────────── */
function animateCounter(el, target, duration = 1500) {
  let start = null;
  const step = (timestamp) => {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    el.textContent = Math.floor(eased * target);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target;
  };
  requestAnimationFrame(step);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseInt(el.dataset.target, 10);
      animateCounter(el, target);
      counterObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-number[data-target]').forEach(el => {
  counterObserver.observe(el);
});

/* ── Copy Snippet ────────────────────────────────────────── */
const rawSnippet = `<!-- Paste before </body> -->
<script
  src="https://cdn.verbe.ai/chatbot.js"
  data-key="vrb_live_a8f3k92mxp1q7z4n"
><\/script>`;

function copySnippet() {
  navigator.clipboard.writeText(rawSnippet).then(() => {
    const btn  = document.getElementById('copySnippetBtn');
    const text = document.getElementById('copyBtnText');
    text.textContent = 'Copied!';
    btn.style.background = 'rgba(34,197,94,0.15)';
    btn.style.borderColor = 'rgba(34,197,94,0.4)';
    btn.style.color = '#22c55e';
    setTimeout(() => {
      text.textContent = 'Copy';
      btn.style.background = '';
      btn.style.borderColor = '';
      btn.style.color = '';
    }, 2000);
  });
}

function copyApiKey() {
  const key = document.getElementById('apiKeyDisplay').textContent;
  navigator.clipboard.writeText(key).then(() => {
    const btn = document.querySelector('.copy-key-btn');
    btn.style.color = '#22c55e';
    setTimeout(() => { btn.style.color = ''; }, 1500);
  });
}

/* ── Chatbot Demo ────────────────────────────────────────── */
const chatMessages   = document.getElementById('chatMessages');
const chatInput      = document.getElementById('chatInput');
const quickReplies   = document.getElementById('quickReplies');

// Conversation flow state
let chatStep = 0;

const botReplies = [
  {
    trigger: null,
    message: null,
    quickReplies: null
  },
  {
    message: 'Great! And which area are you looking in?',
    quickReplies: ['Andheri', 'Thane', 'Navi Mumbai', 'Powai']
  },
  {
    message: 'Nice. How many bedrooms are you looking for?',
    quickReplies: ['1 BHK', '2 BHK', '3 BHK', '3+ BHK']
  },
  {
    message: 'Perfect! Can I get your phone number to send you matching properties? 📱',
    quickReplies: null,
    isPhone: true
  },
  {
    message: 'Thank you! ✅ One of our advisors will reach out within the hour. Would you like to book a site visit?',
    quickReplies: ['Yes, book a visit!', 'Maybe later']
  },
  {
    message: "🎉 You're all set! We'll call you to confirm the site visit. See you soon!",
    quickReplies: null,
    isEnd: true
  }
];

function addMessage(text, isUser = false, delay = 0) {
  return new Promise(resolve => {
    setTimeout(() => {
      const msg = document.createElement('div');
      msg.className = `msg ${isUser ? 'user' : 'bot'}`;

      const now = new Date();
      const time = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');

      if (!isUser) {
        // Typing indicator
        const typing = document.createElement('div');
        typing.className = 'msg bot';
        typing.innerHTML = '<div class="msg-bubble" style="color:var(--text-dim);font-style:italic;font-size:0.8rem">typing…</div>';
        chatMessages.appendChild(typing);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        setTimeout(() => {
          chatMessages.removeChild(typing);
          msg.innerHTML = `<div class="msg-bubble">${text}</div><div class="msg-time">${time}</div>`;
          chatMessages.appendChild(msg);
          chatMessages.scrollTop = chatMessages.scrollHeight;
          resolve();
        }, 900);
      } else {
        msg.innerHTML = `<div class="msg-bubble">${text}</div><div class="msg-time">${time}</div>`;
        chatMessages.appendChild(msg);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        resolve();
      }
    }, delay);
  });
}

function setQuickReplies(replies) {
  quickReplies.innerHTML = '';
  if (!replies) return;
  replies.forEach(reply => {
    const btn = document.createElement('button');
    btn.className = 'quick-reply';
    btn.textContent = reply;
    btn.onclick = () => handleQuickReply(btn, reply);
    quickReplies.appendChild(btn);
  });
}

async function handleQuickReply(btn, text) {
  // Disable all quick replies
  quickReplies.querySelectorAll('.quick-reply').forEach(b => {
    b.disabled = true;
    b.style.opacity = '0.5';
    b.style.cursor = 'default';
  });

  await addMessage(text, true);
  quickReplies.innerHTML = '';
  chatStep++;
  advanceChatFlow();
}

async function sendChatMessage() {
  const text = chatInput.value.trim();
  if (!text) return;
  chatInput.value = '';

  await addMessage(text, true);
  quickReplies.innerHTML = '';
  chatStep++;
  advanceChatFlow();
}

async function advanceChatFlow() {
  const next = botReplies[chatStep];
  if (!next || !next.message) return;

  await addMessage(next.message, false, 200);

  if (next.isEnd) {
    chatInput.disabled = true;
    chatInput.placeholder = 'Chat complete — lead captured! ✓';
    document.querySelector('.chatbot-send').disabled = true;
    return;
  }

  setQuickReplies(next.quickReplies || null);

  if (next.isPhone) {
    chatInput.placeholder = 'Enter your phone number…';
    chatInput.type = 'tel';
  }
}

// Enter key send
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendChatMessage();
});

/* ── Smooth scroll for nav links ─────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const id = link.getAttribute('href');
    if (id === '#') return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const offset = 80; // header height
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

/* ── Active nav highlight ────────────────────────────────── */
const sections = document.querySelectorAll('section[id]');

const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    const id = entry.target.getAttribute('id');
    const navLink = document.querySelector(`.nav a[href="#${id}"]`);
    if (!navLink) return;
    if (entry.isIntersecting) {
      document.querySelectorAll('.nav a').forEach(a => a.style.color = '');
      navLink.style.color = 'var(--white)';
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });

sections.forEach(s => navObserver.observe(s));

/* ── Flow step hover highlight ───────────────────────────── */
document.querySelectorAll('.flow-step').forEach(step => {
  step.addEventListener('mouseenter', () => {
    step.querySelector('.step-icon').classList.add('active');
  });
  step.addEventListener('mouseleave', () => {
    if (!step.querySelector('.step-icon').classList.contains('native-active')) {
      step.querySelector('.step-icon').classList.remove('active');
    }
  });
});
