// ===== Helper: current contact & token ======================================
function getContactId() {
  // Comes from the portal shell
  const raw = (window.Microsoft?.Dynamic365?.Portal?.User?.contactId || "")
    .replace(/[{}]/g, "");
  if (raw) return raw;

  throw new Error("Not signed in — no contactId available.");
}

function getAntiForgery() {
  const tok =
    window.__pp?.antiForgery ||
    document.querySelector('input[name="__RequestVerificationToken"]')?.value ||
    "";
  if (!tok) throw new Error("Anti-forgery token not found on page.");
  return tok;
}

// ===== Generic Dataverse Web API wrapper for Power Pages =====================
async function dvApi(path, method = "GET", body = null) {
  const opts = {
    method,
    credentials: "include", // send portal auth cookies
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json; charset=utf-8",
    },
  };

  // Non-GET needs anti-forgery header
  if (method !== "GET") {
    opts.headers["RequestVerificationToken"] = getAntiForgery();
  }
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`/_api/${path}`, opts);
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`API ${method} ${path} failed: ${res.status} ${res.statusText}\n${t}`);
  }
  return res.status === 204 ? null : res.json();
}

// ===== Constants =============================================================
const CART_STATUS = { Active: 100000000, Converted: 100000001 };

// ===== Cart helpers ==========================================================
async function getOrCreateActiveCart() {
  const contactId = getContactId();

  // Try to find an existing active cart
  const q = new URLSearchParams({
    "$select": "ldw_cartid",
    "$filter": `_ldw_contact_value eq ${contactId} and ldw_status eq ${CART_STATUS.Active}`,
    "$top": "1",
  });
  const r = await dvApi(`ldw_carts?${q.toString()}`);
  if (r.value?.length) return r.value[0];

  // Create one (IMPORTANT: use your lookup column logical name)
  // Your Cart -> Contact lookup column was created as schema "ldw_contact"
  return dvApi("ldw_carts", "POST", {
    ldw_name: "Active Cart",
    ldw_status: CART_STATUS.Active,
    "ldw_contact@odata.bind": `/contacts(${contactId})`,
  });
}

async function addToCart(productId, unitPrice, qty = 1) {
  if (!productId) return;

  const cart = await getOrCreateActiveCart();

  // Is there already a line for this product in this cart?
  const find = new URLSearchParams({
    "$select": "ldw_cartlineid,ldw_quantity,ldw_unitprice",
    "$filter": `_ldw_cart_value eq ${cart.ldw_cartid} and _ldw_product_value eq ${productId}`,
    "$top": "1",
  });
  const existing = await dvApi(`ldw_cartlines?${find.toString()}`);

  const price = Number(unitPrice) || 0;
  const addQty = Number(qty) || 1;

  if (existing.value?.length) {
    const line = existing.value[0];
    const newQty = (Number(line.ldw_quantity) || 0) + addQty;

    await dvApi(`ldw_cartlines(${line.ldw_cartlineid})`, "PATCH", {
      ldw_quantity: newQty,
      ldw_unitprice: price,
      ldw_lineamount: Number((newQty * price).toFixed(2)),
    });
  } else {
    // IMPORTANT: use your Cart Line lookup logical names:
    //   - cart lookup column:  ldw_cart
    //   - product lookup col:  ldw_product  (to VT dyn365bc_item_v2_0)
    await dvApi("ldw_cartlines", "POST", {
      "ldw_cart@odata.bind": `/ldw_carts(${cart.ldw_cartid})`,
      "ldw_product@odata.bind": `/dyn365bc_item_v2_0s(${productId})`,
      ldw_quantity: addQty,
      ldw_unitprice: price,
      ldw_lineamount: Number((addQty * price).toFixed(2)),
    });
  }

  showToast("Added to cart");
}

// ===== Catalog UI ============================================================
async function loadCatalog() {
  // Adjust the query to your Catalog Item table & field names
  const params = new URLSearchParams({
    "$select": "ldw_catalogitemid,ldw_name,ldw_sku,ldw_price,ldw_bcitemid",
    "$filter": "ldw_isvisible eq true",
    "$top": "100",
  });

  const data = await dvApi(`ldw_catalogitems?${params.toString()}`);

  const html = (data.value || [])
    .map(
      (p) => `
    <div class="product" style="border:1px solid #eee;padding:12px;margin:8px;border-radius:8px;">
      <div class="name"><strong>${p.ldw_name || ""}</strong></div>
      <div class="sku">${p.ldw_sku || ""}</div>
      <div class="price">$${(Number(p.ldw_price) || 0).toFixed(2)}</div>
      <button class="add" data-id="${p.ldw_bcitemid}" data-price="${p.ldw_price || 0}">Add</button>
    </div>`
    )
    .join("");

  const root = document.getElementById("catalog");
  root.innerHTML = html;

  // wire up buttons
  root.querySelectorAll(".add").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.currentTarget.dataset.id;
      const price = Number(e.currentTarget.dataset.price) || 0;
      addToCart(id, price, 1).catch((err) => {
        console.error(err);
        alert("Could not add to cart. See console for details.");
      });
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadCatalog().catch((e) => console.error(e));
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
  t._h = setTimeout(() => (t.style.display = "none"), 1500);
}
