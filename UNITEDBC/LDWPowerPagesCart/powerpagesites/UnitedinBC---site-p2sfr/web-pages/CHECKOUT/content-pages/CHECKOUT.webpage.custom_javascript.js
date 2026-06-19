(function () {
  const CART_STATUS_ACTIVE = 100000000;
  const CART_STATUS_CONVERTED = 100000001;

  const CHECKOUTREQUEST_STATUS_PENDING = 100000000;

  let resolvedCartId = null;

  function dvApi(path, method = "GET", body = null) {
    return shell.getTokenDeferred().then(function (token) {
      return $.ajax({
        type: method,
        url: "/_api/" + path,
        contentType: "application/json",
        headers: {
          "Accept": "application/json",
          "__RequestVerificationToken": token
        },
        data: body ? JSON.stringify(body) : null
      });
    });
  }

  function getCartIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("cartId");
  }

  async function getCartById(cartId) {
    if (!cartId) return null;

    const result = await dvApi(
      "ldw_carts?$select=ldw_cartid,ldw_name,ldw_status" +
      "&$filter=ldw_cartid eq " + cartId
    );

    if (result.value && result.value.length) {
      return result.value[0];
    }

    return null;
  }

  async function getActiveCart() {
    const result = await dvApi(
      "ldw_carts?$select=ldw_cartid,ldw_name,ldw_status" +
      "&$filter=ldw_status eq " + CART_STATUS_ACTIVE +
      "&$orderby=createdon desc"
    );

    if (result.value && result.value.length) {
      return result.value[0];
    }

    return null;
  }

  async function getCartLines(cartId) {
    const result = await dvApi(
      "ldw_cartline2s?$select=ldw_cartline2id,ldw_line,ldw_quantity,ldw_unitprice,ldw_lineamount,ldw_bcitemid" +
      "&$filter=_ldw_cart_value eq " + cartId
    );

    return result.value || [];
  }

  function money(v) {
    return Number(v || 0).toLocaleString(undefined, {
      style: "currency",
      currency: "AUD"
    });
  }

  function showEmpty() {
    document.getElementById("checkoutLoading").style.display = "none";
    document.getElementById("checkoutContent").style.display = "none";
    document.getElementById("checkoutEmpty").style.display = "block";
    resolvedCartId = null;
  }

  function showMessage(message) {
    alert(message);
  }








function createCheckoutRequest(cartId) {
  return shell.getTokenDeferred().then(function (token) {
    return new Promise(function (resolve, reject) {
      $.ajax({
        type: "POST",
        url: "/_api/ldw_checkoutrequests",
        contentType: "application/json",
        headers: {
          "Accept": "application/json",
          "__RequestVerificationToken": token
        },
        data: JSON.stringify({
          ldw_name: "Checkout " + new Date().toISOString(),
          "ldw_Cart@odata.bind": "/ldw_carts(" + cartId + ")",
          ldw_cartidtext: cartId,
          ldw_status: CHECKOUTREQUEST_STATUS_PENDING
        }),
        success: function (data, textStatus, xhr) {
          resolve({
            entityId: xhr.getResponseHeader("entityid"),
            xhr: xhr
          });
        },
        error: function (xhr) {
          reject(xhr);
        }
      });
    });
  });
}





















  function render(cart, lines) {
    const tbody = document.getElementById("checkoutTableBody");
    const subtotalEl = document.getElementById("checkoutSubtotal");

    document.getElementById("checkoutLoading").style.display = "none";
    document.getElementById("checkoutEmpty").style.display = "none";
    document.getElementById("checkoutContent").style.display = "block";
    document.getElementById("cartIdText").textContent = cart.ldw_cartid;

    let subtotal = 0;

    tbody.innerHTML = lines.map(function (l) {
      const qty = Number(l.ldw_quantity || 0);
      const unitPrice = Number(l.ldw_unitprice || 0);
      const total = Number(l.ldw_lineamount || 0);
      subtotal += total;

      return `
        <tr>
          <td>${l.ldw_line || ""}</td>
          <td>${l.ldw_bcitemid || ""}</td>
          <td>${qty}</td>
          <td>${money(unitPrice)}</td>
          <td>${money(total)}</td>
        </tr>
      `;
    }).join("");

    subtotalEl.textContent = money(subtotal);
    resolvedCartId = cart.ldw_cartid;
  }

  async function resolveCheckoutCart() {
    const urlCartId = getCartIdFromUrl();

    if (urlCartId) {
      const urlCart = await getCartById(urlCartId);
      if (urlCart && Number(urlCart.ldw_status) === CART_STATUS_ACTIVE) {
        return urlCart;
      }
    }

    return await getActiveCart();
  }




















  
  async function loadCheckout() {
    const cart = await resolveCheckoutCart();

    if (!cart) {
      showEmpty();
      return;
    }

    if (Number(cart.ldw_status) === CART_STATUS_CONVERTED) {
      showMessage("This cart has already been converted.");
      showEmpty();
      return;
    }

    const lines = await getCartLines(cart.ldw_cartid);

    if (!lines.length) {
      showEmpty();
      return;
    }

    render(cart, lines);
  }

  document.getElementById("placeOrderBtn").addEventListener("click", async function () {
    const btn = document.getElementById("placeOrderBtn");

    if (!resolvedCartId) {
      alert("No valid cart found.");
      return;
    }

    if (btn.dataset.submitted === "true") {
      return;
    }

    const originalText = btn.textContent;

    try {
      btn.dataset.submitted = "true";
      btn.disabled = true;
      btn.textContent = "Submitting...";

const created = await createCheckoutRequest(resolvedCartId);
const resultId = created.entityId;

if (!resultId) {
  throw new Error("No checkoutRequestId returned.");
}
      window.location.href = "/Order-Confirmation/?checkoutRequestId=" + encodeURIComponent(resultId);
      return;
    } catch (err) {
      console.error(err);
      btn.disabled = false;
      btn.dataset.submitted = "false";
      btn.textContent = originalText;
      alert("Could not submit checkout.");
    }
  });

  $(document).ready(function () {
    const btn = document.getElementById("placeOrderBtn");
    btn.dataset.submitted = "false";

    loadCheckout().catch(function (err) {
      console.error(err);
      showEmpty();
    });
  });
})();