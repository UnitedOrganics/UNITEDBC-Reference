(function () {
  const CART_STATUS_ACTIVE = 100000000;
  let currentCartId = null;

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

  async function getActiveCart() {
    const result = await dvApi(
      "ldw_carts?$select=ldw_cartid,ldw_name&$filter=ldw_status eq " +
        CART_STATUS_ACTIVE +
        "&$orderby=createdon desc"
    );

    if (result.value.length) return result.value[0];
    return null;
  }

  async function getCartLines(cartId) {
    const result = await dvApi(
      "ldw_cartline2s?$select=ldw_cartline2id,ldw_line,ldw_quantity,ldw_unitprice,ldw_lineamount,ldw_bcitemid" +
        "&$filter=_ldw_cart_value eq " +
        cartId
    );

    return result.value || [];
  }

  async function updateCartLine(lineId, qty, unitPrice) {
    const safeQty = Math.max(1, Number(qty || 1));
    const safePrice = Number(unitPrice || 0);

    await dvApi("ldw_cartline2s(" + lineId + ")", "PATCH", {
      ldw_quantity: safeQty,
      ldw_lineamount: safeQty * safePrice
    });
  }

  async function deleteCartLine(lineId) {
    await dvApi("ldw_cartline2s(" + lineId + ")", "DELETE");
  }

  function money(v) {
    return Number(v || 0).toLocaleString(undefined, {
      style: "currency",
      currency: "AUD"
    });
  }

  function render(lines) {
    const tbody = document.getElementById("cartTableBody");
    const subtotalEl = document.getElementById("cartSubtotal");
    const loading = document.getElementById("cartLoading");
    const empty = document.getElementById("cartEmpty");
    const content = document.getElementById("cartContent");

    loading.style.display = "none";

    if (!lines.length) {
      empty.style.display = "block";
      content.style.display = "none";
      tbody.innerHTML = "";
      subtotalEl.textContent = money(0);
      return;
    }

    empty.style.display = "none";
    content.style.display = "block";

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
          <td>
            <div style="display:flex;gap:6px;align-items:center;">
              <button
                class="btn btn-sm btn-outline-secondary qty-minus-btn"
                data-lineid="${l.ldw_cartline2id}"
                data-qty="${qty}"
                data-price="${unitPrice}"
                type="button"
              >-</button>

              <input
                type="number"
                min="1"
                value="${qty}"
                class="form-control form-control-sm qty-input"
                style="width:70px;text-align:center;"
                data-lineid="${l.ldw_cartline2id}"
                data-price="${unitPrice}"
              />

              <button
                class="btn btn-sm btn-outline-secondary qty-plus-btn"
                data-lineid="${l.ldw_cartline2id}"
                data-qty="${qty}"
                data-price="${unitPrice}"
                type="button"
              >+</button>
            </div>
          </td>
          <td>${money(unitPrice)}</td>
          <td>${money(total)}</td>
          <td>
            <button
              class="btn btn-sm btn-danger remove-line-btn"
              data-lineid="${l.ldw_cartline2id}"
              type="button"
            >
              Remove
            </button>
          </td>
        </tr>
      `;
    }).join("");

    subtotalEl.textContent = money(subtotal);
  }

  async function loadCart() {
    const cart = await getActiveCart();

    if (!cart) {
      currentCartId = null;
      document.getElementById("cartLoading").style.display = "none";
      document.getElementById("cartEmpty").style.display = "block";
      return;
    }

    currentCartId = cart.ldw_cartid;
    const lines = await getCartLines(currentCartId);
    render(lines);
  }

  $(document).on("click", ".qty-plus-btn", async function () {
    const lineId = $(this).data("lineid");
    const qty = Number($(this).data("qty") || 0);
    const price = Number($(this).data("price") || 0);

    try {
      await updateCartLine(lineId, qty + 1, price);
      await loadCart();
    } catch (err) {
      console.error(err);
      alert("Could not increase quantity.");
    }
  });

  $(document).on("click", ".qty-minus-btn", async function () {
    const lineId = $(this).data("lineid");
    const qty = Number($(this).data("qty") || 0);
    const price = Number($(this).data("price") || 0);

    try {
      if (qty <= 1) {
        await deleteCartLine(lineId);
      } else {
        await updateCartLine(lineId, qty - 1, price);
      }
      await loadCart();
    } catch (err) {
      console.error(err);
      alert("Could not decrease quantity.");
    }
  });

  $(document).on("click", ".remove-line-btn", async function () {
    const lineId = $(this).data("lineid");

    try {
      await deleteCartLine(lineId);
      await loadCart();
    } catch (err) {
      console.error(err);
      alert("Could not remove line.");
    }
  });

  $(document).on("change", ".qty-input", async function () {
    const lineId = $(this).data("lineid");
    const qty = Number($(this).val() || 1);
    const price = Number($(this).data("price") || 0);

    try {
      if (qty < 1) {
        await updateCartLine(lineId, 1, price);
      } else {
        await updateCartLine(lineId, qty, price);
      }
      await loadCart();
    } catch (err) {
      console.error(err);
      alert("Could not update quantity.");
    }
  });

  
  $(document).ready(function () {
    loadCart().catch(function (err) {
      console.error(err);
    });
  });


  document.getElementById("checkoutBtn").addEventListener("click", function () {
  if (!currentCartId) {
    alert("No cart found.");
    return;
  }

  window.location.href = "/checkout?cartId=" + currentCartId;
});


})();