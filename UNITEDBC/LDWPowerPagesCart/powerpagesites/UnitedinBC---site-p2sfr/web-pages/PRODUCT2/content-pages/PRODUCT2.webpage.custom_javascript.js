// ------- llVersioning
console.log("tex266");

// ------- helpers
async function getAntiForgery() {
  if (window.shell?.getTokenDeferred) {
    return new Promise((resolve, reject) => {
      window.shell.getTokenDeferred()
        .done(function (token) {
          if (token) {
            resolve(token);
          } else {
            reject(new Error("shell.getTokenDeferred returned empty token."));
          }
        })
        .fail(function () {
          reject(new Error("shell.getTokenDeferred failed."));
        });
    });
  }

  const fromHidden = document.getElementById("pp-af")?.value || "";
  if (fromHidden.trim()) return fromHidden.trim();

  const fromInput =
    document.querySelector('input[name="__RequestVerificationToken"]')?.value || "";
  if (fromInput.trim()) return fromInput.trim();

  const fromWindow = window.__pp?.token || "";
  if (String(fromWindow).trim()) return String(fromWindow).trim();

  console.error("Anti-forgery token sources:", {
    hidden: fromHidden,
    input: fromInput,
    windowToken: fromWindow,
    shellAvailable: !!window.shell?.getTokenDeferred
  });

  throw new Error("Anti-forgery token not found on page.");
}

function getContactId() {
  const raw = (
    window.__pp?.contactId ||
    window.Microsoft?.Dynamic365?.Portal?.User?.contactId ||
    ""
  ).replace(/[{}]/g, "");

  if (raw) return raw;
  throw new Error("Not signed in — no contactId available.");
}

// ===== Generic Dataverse Web API wrapper for Power Pages =====================
function dvApi(path, method = "GET", body = null) {
  return new Promise((resolve, reject) => {
    const ajaxOptions = {
      type: method,
      url: "/_api/" + path,
      contentType: "application/json",
      headers: {
        Accept: "application/json"
      },
      success: function (data, textStatus, xhr) {
        if (xhr.status === 204) {
          resolve(null);
        } else {
          resolve(data);
        }
      },
      error: function (xhr) {
        reject(
          new Error(
            `API ${method} ${path} failed: ${xhr.status} ${xhr.statusText}\n${xhr.responseText || ""}`
          )
        );
      }
    };

    if (body) {
      ajaxOptions.data = JSON.stringify(body);
    }

    if (method === "GET") {
      $.ajax(ajaxOptions);
      return;
    }

    shell.getTokenDeferred().done(function (token) {
      ajaxOptions.headers["__RequestVerificationToken"] = token;
      $.ajax(ajaxOptions);
    }).fail(function () {
      reject(new Error("Could not obtain anti-forgery token from shell.getTokenDeferred()."));
    });
  });
}

// ===== Constants =============================================================
const CART_STATUS = {
  Active: 100000000,
  Converted: 100000001,
};

// ===== Cart helpers ==========================================================
// ===== Cart helpers ==========================================================
async function getActiveCart() {
  const contactId = getContactId();

  const params = new URLSearchParams({
    "$select": "ldw_cartid,ldw_name,ldw_status,_ldw_contact_value",
    "$filter": `ldw_status eq ${CART_STATUS.Active} and _ldw_contact_value eq ${contactId}`,
    "$orderby": "createdon desc",
    "$top": "1"
  });

  const result = await dvApi(`ldw_carts?${params.toString()}`);

  if (result.value && result.value.length) {
    return result.value[0];
  }

  return null;
}

async function createActiveCart() {
  const token = await getAntiForgery();
  const contactId = getContactId();

  return new Promise((resolve, reject) => {
    $.ajax({
      type: "POST",
      url: "/_api/ldw_carts",
      contentType: "application/json",
      headers: {
        Accept: "application/json",
        "__RequestVerificationToken": token
      },
      data: JSON.stringify({
        ldw_name: "Active Cart",
        ldw_status: CART_STATUS.Active,
        "ldw_contact@odata.bind": "/contacts(" + contactId + ")"
      }),
      success: function (data, textStatus, xhr) {
        const cartId = xhr.getResponseHeader("entityid");

        if (!cartId) {
          reject(new Error("Cart created but no entityid returned."));
          return;
        }

        resolve({
          ldw_cartid: cartId,
          ldw_name: "Active Cart",
          ldw_status: CART_STATUS.Active,
          _ldw_contact_value: contactId
        });
      },
      error: function (xhr) {
        reject(
          new Error(
            `Create cart failed: ${xhr.status} ${xhr.statusText}\n${xhr.responseText || ""}`
          )
        );
      }
    });
  });
}

async function getOrCreateActiveCart() {
  const existingCart = await getActiveCart();

  if (existingCart && existingCart.ldw_cartid) {
    return existingCart;
  }

  return await createActiveCart();
}


async function addToCart(productId, unitPrice, qty = 1, productCode = "") {
  console.log("ADDTOCART TEX240", { productId, unitPrice, qty, productCode });

  if (!productId) {
    throw new Error("Missing BC item Dataverse GUID (ldw_bcitemdvid).");
  }

  const cart = await getOrCreateActiveCart();

  const find = new URLSearchParams({
"$select": "ldw_cartline2id,ldw_quantity,ldw_unitprice,ldw_bcitemdvid,ldw_bcitemid,ldw_bcitemsystemid",
    "$filter": `_ldw_cart_value eq ${cart.ldw_cartid}`,
    "$top": "50",
  });

  const existing = await dvApi(`ldw_cartline2s?${find.toString()}`);

 const matchedLine = (existing.value || []).find(function (x) {
  return String(x.ldw_bcitemsystemid || "").toLowerCase() === String(productId || "").toLowerCase();
});

  const price = Number(unitPrice) || 0;
  const addQty = Number(qty) || 1;

  if (matchedLine) {
    const newQty = (Number(matchedLine.ldw_quantity) || 0) + addQty;

    await dvApi(`ldw_cartline2s(${matchedLine.ldw_cartline2id})`, "PATCH", {
      ldw_quantity: newQty,
      ldw_bcitemdvid: productId,
      ldw_bcitemid: productCode,
      ldw_bcitemsystemid: productId,
      ldw_unitprice: price,
      ldw_lineamount: Number((newQty * price).toFixed(2))
    });
  } else {
    await dvApi("ldw_cartline2s", "POST", {
      ldw_line: `${productCode || "Item"} ${new Date().toISOString()}`,
      "ldw_Cart@odata.bind": `/ldw_carts(${cart.ldw_cartid})`,
      ldw_quantity: addQty,
      ldw_bcitemdvid: productId,
      ldw_bcitemid: productCode,
      ldw_bcitemsystemid: productId,
      ldw_unitprice: price,
      ldw_lineamount: Number((addQty * price).toFixed(2))
    });
  }

  showToast("Added to cart");
}

// ===== Catalog UI ============================================================
async function loadCatalog() {
  const params = new URLSearchParams({
"$select": "ldw_catalogitemid,ldw_name,ldw_sku,ldw_price,ldw_bcitem_dvid,ldw_bcitemid,ldw_bcitemsystemid",
    "$filter": "ldw_isvisible eq true",
    "$top": "100",
  });

  const data = await dvApi(`ldw_catalogitems?${params.toString()}`);

  const html = (data.value || [])
    .map(
      (p) => `
    <div class="product" style="border:1px solid #eee;padding:12px;margin:8px;border-radius:8px;">
      <div class="name"><strong>${p.ldw_name || ""}</strong></div>
      <div class="sku">${p.ldw_sku || p.ldw_bcitemid || ""}</div>
      <div class="price">$${(Number(p.ldw_price) || 0).toFixed(2)}</div>
<button class="add"
        data-id="${p.ldw_bcitemsystemid || ""}"
        data-code="${p.ldw_bcitemid || ""}"
        data-price="${p.ldw_price || 0}"
        ${p.ldw_bcitemsystemid ? "" : "disabled"}>
  ${p.ldw_bcitemsystemid ? "Add" : "Missing BC System Id"}
</button>
    </div>`
    )
    .join("");

  const root = document.getElementById("catalog");
  if (!root) throw new Error('Element with id "catalog" not found.');
  root.innerHTML = html;

  root.querySelectorAll(".add").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      try {
        const id = e.currentTarget.dataset.id;
        const code = e.currentTarget.dataset.code || "";
        const price = Number(e.currentTarget.dataset.price) || 0;
        await addToCart(id, price, 1, code);
      } catch (err) {
        console.error(err);
        alert("Could not add to cart. See console for details.");
      }
    });
  });
}




document.addEventListener("DOMContentLoaded", () => {
  console.log("contactId:", window.__pp?.contactId);
  console.log("token:", window.__pp?.token);
  console.log("hidden token:", document.getElementById("pp-af")?.value);
console.log("contactId:", window.__pp?.contactId);
console.log("token:", window.__pp?.token);
console.log("hidden token:", document.getElementById("pp-af")?.value);
console.log("shell available:", !!window.shell?.getTokenDeferred);
  loadCatalog().catch((e) => {
    console.error(e);
    alert("Could not load catalog. See console for details.");
  });
});

// ===== Tiny toast ============================================================
function showToast(msg) {
  let t = document.getElementById("pp-toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "pp-toast";
    t.style.cssText =
      "position:fixed;right:16px;bottom:16px;background:#222;color:#fff;padding:10px 14px;border-radius:8px;opacity:.95;z-index:99999;";
    document.body.appendChild(t);
  }

  t.textContent = msg;
  clearTimeout(t._h);
  t.style.display = "block";
  t._h = setTimeout(() => {
    t.style.display = "none";
  }, 1500);
}