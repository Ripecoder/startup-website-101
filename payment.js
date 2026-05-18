// ─────────────────────────────────────
// PAYMENT.JS
// ─────────────────────────────────────

const payBtn = document.getElementById("payBtn");
const trialBtn = document.getElementById("trialBtn");

// Razorpay test key
const RAZORPAY_KEY = "rzp_test_XXXXXXXXXXXXXXXX";

 async function storeSubscriptionTime(days) {
  const clientData = JSON.parse(
    sessionStorage.getItem("client_data")
   );

   if (!clientData) {
     console.log("No client data found");
    return;
   }

   const response = await fetch(
     "https://website-server-9b3o.onrender.com/api/client/time",
     {
       method: "POST",

       headers: {
        "Content-Type": "application/json"
       },

       body: JSON.stringify({
         api_key: clientData.api_key,
         subscription_time: days
       })
     }
   );

   const data = await response.json();

   if (data.success) {
    sessionStorage.setItem(

       "subscription_time",
       data.subscription_time
     );

     console.log("TIME STORED");
   }
  }

// ─────────────────────────────────────
// FREE TRIAL
// ─────────────────────────────────────

trialBtn.addEventListener("click", () => {

  await storeSubscriptionTime(14);
  // redirect to actual leads dashboard
  window.location.href = "client-dashboard.html";
});

// ─────────────────────────────────────
// PAID PLAN
// ─────────────────────────────────────

payBtn.addEventListener("click", async () => {

  payBtn.disabled = true;
  payBtn.innerText = "Opening Razorpay...";

  const options = {

    key: RAZORPAY_KEY,

    amount: 499900, // ₹4999

    currency: "INR",

    name: "Verbe AI",

    description: "Monthly Subscription",

    handler: function (response) {

      console.log("PAYMENT SUCCESS:", response);

      storeSubscriptionTime(30)
    },

    prefill: {
      name: "",
      email: ""
    },

    theme: {
      color: "#1a73e8"
    }
  };

  const rzp = new Razorpay(options);

  rzp.on("payment.failed", function (response) {

    console.error(response.error);

    alert("Payment failed.");

    payBtn.disabled = false;
    payBtn.innerText = "Upgrade Now";
  });

  rzp.open();
});