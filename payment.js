const API_BASE_URL = "https://website-server-9b3o.onrender.com";

const payBtn = document.getElementById("payBtn");
const trialBtn = document.getElementById("trialBtn");
const trialCard = document.getElementById("trialCard");
let usedFreeTrial = false;
let paymentInProgress = false;
async function activateFreeTrial() {

  const response = await fetch(`${API_BASE_URL}/api/client/time/free_trial`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: clientData.api_key
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
  if (paymentInProgress) return;
  paymentInProgress = true;

  try {
    payBtn.disabled = true;
    payBtn.innerText = "Initializing...";

    const res = await fetch(`${API_BASE_URL}/api/payment/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: clientData.api_key
      })
    });

    const data = await res.json();

    if (!data.success) {
      alert("Failed to create order");
      return;
    }

    const options = {
      key: data.key_id,
      amount: data.amount,
      currency: "INR",
      order_id: data.order_id,

      handler: async function (response) {
        try {
          const verify = await fetch(`${API_BASE_URL}/api/payment/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...response,
              api_key: clientData.api_key
            })
          });

          const result = await verify.json();

          if (result.success) {
            alert("Payment successful");
            window.location.reload();
          } else {
            alert("Payment verification failed");
          }
        } catch (err) {
          console.error(err);
          alert("Verification error");
        }
      },

      modal: {
        ondismiss: function () {
          paymentInProgress = false;
          payBtn.disabled = false;
          payBtn.innerText = "Pay Now";
        }
      }
    };

    const rzp = new Razorpay(options);

    rzp.on("payment.failed", function () {
      paymentInProgress = false;
      payBtn.disabled = false;
      payBtn.innerText = "Pay Now";
    });

    rzp.open();

  } catch (err) {
    console.error(err);
    alert("Payment error");
  } finally {
    payBtn.disabled = false;
    payBtn.innerText = "Pay Now";
    paymentInProgress = false;
  }
});
window.addEventListener("beforeunload", () => {
  paymentInProgress = false;
});