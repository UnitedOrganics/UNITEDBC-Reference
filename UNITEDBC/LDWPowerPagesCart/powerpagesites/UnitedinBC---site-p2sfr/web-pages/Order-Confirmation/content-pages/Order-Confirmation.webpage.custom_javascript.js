(function () {
  const CHECKOUTREQUEST_STATUS_PENDING = 100000000;
  const CHECKOUTREQUEST_STATUS_PROCESSING = 100000001;
  const CHECKOUTREQUEST_STATUS_COMPLETED = 100000002;
  const CHECKOUTREQUEST_STATUS_FAILED = 100000003;

  const STATUS_FLOW_URL = "https://b08b058f4af2e6e3aebffa2b3be6a1.ca.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/d5190547330f4bd0ba19bbdda91ef972/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=1gut8kp7siB87jqIPHFlD0yEd9EqXddR6ChaisazMYA";

  let pollTimer = null;

  function getRequestIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("checkoutRequestId");
  }

  function hideAllStates() {
    document.getElementById("orderStatusLoading").style.display = "none";
    document.getElementById("orderStatusProcessing").style.display = "none";
    document.getElementById("orderStatusCompleted").style.display = "none";
    document.getElementById("orderStatusFailed").style.display = "none";
    document.getElementById("orderStatusMissing").style.display = "none";
  }

  function showProcessing() {
    hideAllStates();
    document.getElementById("orderStatusProcessing").style.display = "block";
  }

  function showCompleted(orderNo) {
    hideAllStates();
    document.getElementById("orderNoText").textContent = orderNo || "";
    document.getElementById("orderStatusCompleted").style.display = "block";
  }

  function showFailed(errorText) {
    hideAllStates();
    document.getElementById("orderErrorText").textContent = errorText || "Unknown error.";
    document.getElementById("orderStatusFailed").style.display = "block";
  }

  function showMissing() {
    hideAllStates();
    document.getElementById("orderStatusMissing").style.display = "block";
  }

  async function getCheckoutRequestById(checkoutRequestId) {
    const res = await fetch(STATUS_FLOW_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        checkoutRequestId: checkoutRequestId
      })
    });

    if (!res.ok) {
      throw new Error("Status API failed");
    }

    return await res.json();
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  async function checkStatus(checkoutRequestId) {
    const row = await getCheckoutRequestById(checkoutRequestId);

    if (!row) {
      showMissing();
      return;
    }

    const status = Number(row.status);

    if (status === CHECKOUTREQUEST_STATUS_COMPLETED) {
      stopPolling();
      showCompleted(row.orderNo);
      return;
    }

    if (status === CHECKOUTREQUEST_STATUS_FAILED) {
      stopPolling();
      showFailed(row.error);
      return;
    }

    showProcessing();
  }

  function startPolling(checkoutRequestId) {
    stopPolling();

    checkStatus(checkoutRequestId).catch(function (err) {
      console.error("Polling error:", err);
      showFailed("Could not read order status.");
    });

    pollTimer = setInterval(function () {
      checkStatus(checkoutRequestId).catch(function (err) {
        console.error("Polling error:", err);
      });
    }, 3000);
  }

  $(document).ready(function () {
    const checkoutRequestId = getRequestIdFromUrl();

    if (!checkoutRequestId) {
      showMissing();
      return;
    }

    startPolling(checkoutRequestId);
  });
})();