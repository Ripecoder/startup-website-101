const API_BASE_URL = "https://website-server-9b3o.onrender.com";

const payBtn = document.getElementById("payBtn");
const trialBtn = document.getElementById("trialBtn");
const trialCard = document.getElementById("trialCard");
let usedFreeTrial = false;

function getClientData() {
  try {
    return JSON.parse(sessionStorage.getItem("client_data") || "null");
  } catch {
    sessionStorage.removeItem("client_data");
    return null;
  }
}

function requireClientData() {
  const clientData = getClientData();

  if (!clientData?.api_key) {
    window.location.href = "login.html";
    return null;
  }

  return clientData;
}

async function checkTrialStatus() {
  const clientData = getClientData();
  if (!clientData) return;

  try {
    const res = await fetch(
      `${API_BASE_URL}/api/client/trialStatus?api_key=${encodeURIComponent(clientData.api_key)}`
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

async function activateFreeTrial() {
  const clientData = getClientData();

  if (!clientData) {
    return false;
  }

  const response = await fetch(`${API_BASE_URL}/api/client/time/set`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: clientData.api_key,
      subscription_time: 14
    })
  });

  const data = await response.json();

  if (!data.success) {
    return false;
  }

  sessionStorage.setItem("subscription_time", data.subscription_time);
  sessionStorage.setItem("used_free_trial", "true");
  return true;
}

async function createPaymentOrder(apiKey) {
  const response = await fetch(`${API_BASE_URL}/api/payment/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: apiKey })
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data?.message || "Could not start checkout");
  }

  return data;
}

async function verifyPaymentOnServer(apiKey, paymentResponse) {
  const response = await fetch(`${API_BASE_URL}/api/payment/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      razorpay_order_id: paymentResponse.razorpay_order_id,
      razorpay_payment_id: paymentResponse.razorpay_payment_id,
      razorpay_signature: paymentResponse.razorpay_signature
    })
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data?.message || "Payment verification failed");
  }

  sessionStorage.setItem("subscription_time", data.subscription_time);
  return true;
}

trialBtn?.addEventListener("click", async () => {
  trialBtn.disabled = true;
  trialBtn.innerText = "Activating...";

  const ok = await activateFreeTrial();

  if (!ok) {
    trialBtn.disabled = false;
    trialBtn.innerText = "Start Free Trial";
    return;
  }

  window.location.href = "client-dashboard.html";
});

payBtn?.addEventListener("click", async () => {
  const clientData = requireClientData();
  if (!clientData) return;

  if (!window.Razorpay) {
    alert("Payment checkout could not load. Refresh and try again.");
    return;
  }

  payBtn.disabled = true;
  payBtn.innerText = "Opening Razorpay...";

  try {
    const order = await createPaymentOrder(clientData.api_key);

    const options = {
      key: order.key_id,
      amount: order.amount,
      currency: order.currency,
      name: "FunnelOS",
      description: "Monthly Subscription",
      order_id: order.order_id,

      handler: async function (response) {
        try {
          await verifyPaymentOnServer(clientData.api_key, response);
          window.location.href = "client-dashboard.html";
        } catch (err) {
          alert(err.message || "Payment verification failed");
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
  } catch (err) {
    alert(err.message || "Payment checkout is not configured yet.");
    payBtn.disabled = false;
    payBtn.innerText = "Upgrade Now";
  }
});

checkTrialStatus();
