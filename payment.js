const payBtn = document.getElementById("payBtn");
const trialBtn = document.getElementById("trialBtn");

const RAZORPAY_KEY = "rzp_test_XXXXXXXXXXXXXXXX";

async function storeSubscriptionTime(days) {

  const clientData = JSON.parse(sessionStorage.getItem("client_data"));

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
  return true;
}
trialBtn.addEventListener("click", async () => {

  const ok = await storeSubscriptionTime(14);

  if (!ok) return;

  window.location.href = "client-dashboard.html";
});
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