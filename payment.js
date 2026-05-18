const payBtn   = document.getElementById("payBtn");
const trialBtn = document.getElementById("trialBtn");
const trialCard = document.getElementById("trialCard");
let usedFreeTrial = false;
const RAZORPAY_KEY = "rzp_test_XXXXXXXXXXXXXXXX";

// ── HELPERS ─────────────────────────────

function getClientData() {
  return JSON.parse(sessionStorage.getItem("client_data"));
}

// ── CHECK FREE TRIAL STATUS ON LOAD ─────
// If client has already used their free trial, remove the trial card entirely

async function checkTrialStatus() {
  const clientData = getClientData();
  if (!clientData) return;

  try {
    const res = await fetch(
      `https://website-server-9b3o.onrender.com/api/client/trialStatus?api_key=${clientData.api_key}`
    );

    const data = await res.json();

    if (data.success) {
      usedFreeTrial = data.used_free_trial === true;

      if (usedFreeTrial && trialCard) {
        trialCard.remove();
      }
    }

  } catch (err) {
    console.log("Trial status check error:", err);
  }
}

// ── STORE SUBSCRIPTION TIME ──────────────
// When days = 14, backend also sets used_free_trial = true automatically

async function storeSubscriptionTime(days) {
  const clientData = getClientData();

  if (!clientData) {
    console.log("No client data found");
    return false;
  }

  const response = await fetch(
    "https://website-server-9b3o.onrender.com/api/client/time/set",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: clientData.api_key,
        subscription_time: days
      })
    }
  );

  const data = await response.json();

  if (!data.success) {
    console.log("FAILED TO STORE TIME");
    return false;
  }

  sessionStorage.setItem("subscription_time", data.subscription_time);
  if (days === 14) {
    sessionStorage.setItem("used_free_trial","true")
  }
  return true;
}

// ── TRIAL BUTTON ─────────────────────────

trialBtn?.addEventListener("click", async () => {
  trialBtn.disabled = true;
  trialBtn.innerText = "Activating...";

  const ok = await storeSubscriptionTime(14);

  if (!ok) {
    trialBtn.disabled = false;
    trialBtn.innerText = "Start Free Trial";
    return;
  }

  window.location.href = "client-dashboard.html";
});

// ── PAY BUTTON ───────────────────────────

payBtn.addEventListener("click", async () => {
  payBtn.disabled = true;
  payBtn.innerText = "Opening Razorpay...";

  const options = {
    key: RAZORPAY_KEY,
    amount: 499900,
    currency: "INR",
    name: "FunnelOS",
    description: "Monthly Subscription",

    handler: async function (response) {
      try {
        console.log("PAYMENT SUCCESS:", response);

        const ok = await storeSubscriptionTime(30);

        if (!ok) {
          alert("Failed to activate subscription");
          payBtn.disabled = false;
          payBtn.innerText = "Upgrade Now";
          return;
        }

        window.location.href = "client-dashboard.html";

      } catch (e) {
        console.log("Razorpay handler error:", e);
        payBtn.disabled = false;
        payBtn.innerText = "Upgrade Now";
      }
    },

    theme: {
      color: "#1a73e8"
    }
  };

  const rzp = new Razorpay(options);

  rzp.on("payment.failed", function () {
    alert("Payment failed.");
    payBtn.disabled = false;
    payBtn.innerText = "Upgrade Now";
  });

  rzp.open();
});

// ── INIT ─────────────────────────────────

checkTrialStatus();
