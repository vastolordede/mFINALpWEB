// ======= LocalStorage Keys =======
const LS_PRODUCTS_KEY = "admin_products";
const LS_CART_KEY = "cart";
const LS_USERS_KEY = "admin_users";
const LS_CURRENT_USER = "current_user";
const LS_ORDERS_KEY = "admin_orders";
const LS_USER_ORDERS_PF = "user_orders:"; // lịch sử mua theo user id

// === Local placeholder, không cần Internet ===
function svgPlaceholder(w, h, txt = "No Image") {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>
<rect width='100%' height='100%' fill='#f3f4f6'/>
<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
fill='#9ca3af' font-family='Inter, Arial' font-size='14'>${txt}</text>
</svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

// ======= Utilities =======
function formatVND(n) {
  return Number(n || 0).toLocaleString("vi-VN");
}
function todayVN() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1
  ).padStart(2, "0")}/${d.getFullYear()}`;
}
function isoNow() {
  return new Date().toISOString();
}

const NOTICE_KEY = "one_time_notice";
function pushNotice(msg) {
  try {
    sessionStorage.setItem(NOTICE_KEY, String(msg || ""));
  } catch (e) { }
}
function popNotice() {
  try {
    const m = sessionStorage.getItem(NOTICE_KEY);
    if (m) sessionStorage.removeItem(NOTICE_KEY);
    return m || null;
  } catch (e) {
    return null;
  }
}

// Banner nổi gọn nhẹ ở đầu trang
function showGlobalNotice(msg) {
  if (!msg) return;
  const bar = document.createElement("div");
  bar.setAttribute("role", "status");
  bar.style.cssText = `
position: fixed; inset-inline: 12px; top: 12px; z-index: 9999;
background: #FFF7ED; color: #9A3412; border: 1px solid #FED7AA;
border-radius: 10px; padding: 10px 12px; box-shadow: 0 10px 30px rgba(0,0,0,.12);
font-family: system-ui,-apple-system,Segoe UI,Roboto,Inter,sans-serif; font-size: 14px;
display: flex; align-items: center; gap: 8px;
`;
  bar.innerHTML = `⚠️ <span>${msg}</span>
<button aria-label="Đóng" style="
margin-left:auto; background:#FFEDD5; border:1px solid #FED7AA; border-radius:8px;
padding:4px 8px; cursor:pointer;">Đóng</button>`;
  bar.querySelector("button").addEventListener("click", () => bar.remove());
  document.body.appendChild(bar);
}

// --- helpers: tìm user theo id ---
function findUserById(id) {
  return (getUsers() || []).find((u) => String(u.id) === String(id));
}

// --- kiểm tra và auto-logout nếu user đang login bị khóa/xoá ---
function ensureActiveSession() {
  const cur = getCurrentUser();
  if (!cur) return;

  const fresh = findUserById(cur.id);
  if (!fresh || fresh.active === false) {
    const msg =
      "⚠️ Tài khoản của bạn đã bị khóa hoặc không còn tồn tại. Bạn đã được đăng xuất.";
    // Ghi lại lý do để hiện sau khi reload
    pushNotice(msg);

    // Đăng xuất + cập nhật UI + reload
    setCurrentUser(null);
    renderAuthUI();
    setTimeout(() => location.reload(), 200);
  }
}

// ======= Users helpers =======
function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(LS_USERS_KEY) || "[]");
  } catch (e) {
    return [];
  }
}
function saveUsers(arr) {
  localStorage.setItem(LS_USERS_KEY, JSON.stringify(arr || []));
}
function findUserByUsername(username) {
  const uname = String(username || "")
    .trim()
    .toLowerCase();
  return getUsers().find(
    (u) => String(u.username || "").toLowerCase() === uname
  );
}
function genUserId() {
  const d = new Date();
  const ds = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}${String(d.getDate()).padStart(2, "0")}`;
  const rnd = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `U-${ds}-${rnd}`;
}
function setCurrentUser(user) {
  user
    ? localStorage.setItem(LS_CURRENT_USER, JSON.stringify(user))
    : localStorage.removeItem(LS_CURRENT_USER);
}
function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(LS_CURRENT_USER) || "null");
  } catch (e) {
    return null;
  }
}

// ======= Require login before using cart =======
function requireLoginOrAlert(anchor) {
  const u = getCurrentUser();
  if (!u) {
    alert("🧑‍💻 Vui lòng đăng nhập để thêm vào giỏ hàng."); // dùng đúng “cái alert đó”
    if (typeof openAuth === "function") {
      // bám theo nút đăng nhập nếu có để panel rơi đúng vị trí
      openAuth(
        "login",
        anchor || document.getElementById("open-login") || null
      );
    }
    return false;
  }
  return true;
}

// ======= Orders helpers =======
function getOrders() {
  try {
    return JSON.parse(localStorage.getItem(LS_ORDERS_KEY) || "[]");
  } catch (e) {
    return [];
  }
}
function saveOrders(arr) {
  localStorage.setItem(LS_ORDERS_KEY, JSON.stringify(arr || []));
}
function genOrderId() {
  const d = new Date();
  const ds = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}${String(d.getDate()).padStart(2, "0")}`;
  const rnd = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `#DH-${ds}-${rnd}`;
}
function getUserOrders(userId) {
  try {
    return JSON.parse(localStorage.getItem(LS_USER_ORDERS_PF + userId) || "[]");
  } catch (e) {
    return [];
  }
}
function saveUserOrders(userId, arr) {
  localStorage.setItem(LS_USER_ORDERS_PF + userId, JSON.stringify(arr || []));
}
// === PRICING: lấy giá bán đã tính ===
const LS_PRICING_DATA = "pricing_data";
function getPricingRowsUser() {
  try {
    const raw = localStorage.getItem(LS_PRICING_DATA);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.rows)) return parsed.rows;
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === "object" && parsed.ma) return [parsed];
    return [];
  } catch (e) {
    return [];
  }
}
function getSellPriceByMaUser(ma) {
  const rows = getPricingRowsUser();
  const r = rows.find((x) => String(x.ma || "") === String(ma || ""));
  return Number(r?.sellPrice) || 0;
}

// ======= Catalog / Products =======
// ======= Catalog / Products (USER) =======
function loadProducts() {
  try {
    const arr = JSON.parse(localStorage.getItem(LS_PRODUCTS_KEY) || "[]");
    if (Array.isArray(arr) && arr.length) {
      // chỉ lấy sản phẩm KHÔNG bị ẩn
      const visible = arr.filter((p) => !p.hidden);

      // gắn displayPrice (ưu tiên sellPrice từ pricing_data, fallback p.gia)
      return visible.map((p) => {
        const sell = getSellPriceByMaUser(p.ma);
        return { ...p, displayPrice: sell > 0 ? sell : Number(p.gia || 0) };
      });
    }
  } catch (e) { }
  return [];
}

// ======= Cart helpers =======
function getCart() {
  try {
    return JSON.parse(localStorage.getItem(LS_CART_KEY) || "[]");
  } catch (e) {
    return [];
  }
}
function saveCart(cart) {
  localStorage.setItem(LS_CART_KEY, JSON.stringify(cart || []));
}
if (document.getElementById("checkoutModal")?.classList.contains("open")) {
  buildCheckoutSummary();
}

function updateCartCount() {
  const cart = getCart();
  const count = cart.reduce((s, i) => s + (i.qty || 0), 0);
  const el = document.getElementById("cart-count");
  if (el) el.textContent = count;
}
function addToCart(ma, qty = 1) {
  if (!requireLoginOrAlert()) return; // ⬅️ thêm dòng này

  const catalog = loadProducts();
  const p = catalog.find((x) => String(x.ma) === String(ma));
  if (!p) {
    alert("Sản phẩm không tồn tại");
    return;
  }
  const cart = getCart();
  const idx = cart.findIndex((i) => String(i.ma) === String(ma));
  if (idx > -1) cart[idx].qty += qty;
  else
    cart.push({
      ma: p.ma,
      ten: p.ten,
      gia: p.displayPrice,
      imgSrc: p.imgSrc,
      qty,
    });

  saveCart(cart);
  updateCartCount();
  alert("✅ Đã thêm vào giỏ hàng!");
}
window.addToCart = addToCart; // dùng trong HTML

// ======= Page: INDEX =======
document.addEventListener("DOMContentLoaded", function () {
  // Hàm escape HTML
  function esc(s) {
    return String(s || "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  }

  if (document.title.includes("Trang chủ")) {
    const list = document.getElementById("product-list");
    const pagination = document.getElementById("pagination");
    const typeFilter = document.getElementById("type-filter");
    const searchBox = document.querySelector('.searchbox');
    const searchButton = document.querySelector('.searchbutton');
    const minInput = document.getElementById('min-price');
    const maxInput = document.getElementById('max-price');
    const popup = document.getElementById('filter-popup');
    const btnAdvance = document.querySelector('.advancefilter');
    const btnApply = document.getElementById('apply-filter');
    const btnReset = document.getElementById('reset-filter');

    const itemsPerPage = 4;
    let current_page = 1;
    let allProducts = loadProducts() || [];
    let filteredProducts = [...allProducts];

    // === GỌP TẤT CẢ LỌC VÀO 1 HÀM ===
    function applyFilters() {
      let result = [...allProducts];

      // 1. Lọc theo tên (tìm kiếm)
      const keyword = searchBox?.value.trim().toLowerCase() || '';
      if (keyword) {
        result = result.filter(p => p.ten && p.ten.toLowerCase().includes(keyword));
      }

      // 2. Lọc theo thể loại
      const selectedType = typeFilter?.value.trim() || '';
      if (selectedType) {
        result = result.filter(p => p.loai && p.loai.toLowerCase() === selectedType.toLowerCase());
      }

      // 3. Lọc theo giá
      const min = parseInt(minInput?.value) || 0;
      const max = parseInt(maxInput?.value) || 999999999999999;
      if (min > 0 || max < 999999999999999) {
        result = result.filter(p => Number(p.displayPrice) >= min && Number(p.displayPrice) <= max);
      }

      filteredProducts = result;
      current_page = 1;
      renderPage(current_page);
      renderPagination();
    }

    // === Render dropdown thể loại ===
    const categories = JSON.parse(localStorage.getItem("categories") || "[]");
    if (categories.length > 0 && typeFilter) {
      categories.forEach(cat => {
        const opt = document.createElement("option");
        opt.value = cat.tenLoai;
        opt.textContent = cat.tenLoai;
        typeFilter.appendChild(opt);
      });
    }

    // === LỌC THEO THỂ LOẠI ===
    if (typeFilter) {
      typeFilter.addEventListener("change", applyFilters);
    }

    // === TÌM KIẾM THEO TÊN ===
    if (searchButton && searchBox) {
      searchButton.addEventListener('click', applyFilters);
      searchBox.addEventListener('keypress', e => {
        if (e.key === 'Enter') applyFilters();
      });
    }

    // === LỌC GIÁ (POPUP) ===
    if (btnAdvance && popup) {
      btnAdvance.onclick = () => {
        popup.style.display = popup.style.display === 'block' ? 'none' : 'block';
      };

      // Chỉ cho nhập số
      [minInput, maxInput].forEach(input => {
        if (!input) return;
        input.addEventListener('input', () => {
          input.value = input.value.replace(/[^0-9]/g, '');
        });
      });

      // Áp dụng
      if (btnApply) {
        btnApply.onclick = () => {
          applyFilters(); // DÙNG HÀM CHUNG
          popup.style.display = 'none';
        };
      }

      // Reset
      if (btnReset) {
        btnReset.onclick = () => {
          minInput.value = '';
          maxInput.value = '';
          if (searchBox) searchBox.value = '';
          if (typeFilter) typeFilter.value = '';
          applyFilters(); // DÙNG HÀM CHUNG
          popup.style.display = 'none';
        };
      }

      // Đóng khi click ngoài
      document.addEventListener('click', e => {
        if (!popup.contains(e.target) && e.target !== btnAdvance) {
          popup.style.display = 'none';
        }
      });
    }

    // === Render sản phẩm ===
    function renderPage(page) {
      if (!list) return;
      list.innerHTML = "";

      const start = (page - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      const products = filteredProducts.slice(start, end);

      products.forEach(p => {
        const img = p.imgSrc || svgPlaceholder(200, 150);
        const hasDetails = Array.isArray(p.chitiet) && p.chitiet.length > 0;
        const chipsHtml = hasDetails
          ? `<div class="chips">${p.chitiet
            .slice(0, 4)
            .map(v => `<span class="chip">${esc(v)}</span>`)
            .join("")}</div>`
          : "";

        const showPrice = Number(p.displayPrice) > 0
          ? `${formatVND(p.displayPrice)}₫`
          : "Liên hệ";

        list.innerHTML += `
        <div class="product-card">
          <img src="${img}" alt="${esc(p.ten)}">
          <div class="card-body">
            <div class="title">${esc(p.ten)}</div>
            <div class="price text-blue">${showPrice}</div>
            ${chipsHtml}
            <div class="actions">
              <button class="btn" onclick="addToCart('${p.ma}')">Thêm vào giỏ</button>
              <a class="btn primary" href="product.html?ma=${encodeURIComponent(p.ma)}">Xem chi tiết</a>
            </div>
          </div>
        </div>`;
      });

      renderPagination();
      updateCartCount();
    }

    // === Render phân trang ===
    function renderPagination() {
      if (!pagination) return;
      pagination.innerHTML = "";

      const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
      if (totalPages <= 1) {
        pagination.style.display = "none";
        return;
      }
      pagination.style.display = "flex";

      for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement("button");
        btn.textContent = i;
        btn.className = i === current_page ? "active" : "";
        btn.addEventListener("click", () => {
          current_page = i;
          renderPage(current_page);
        });
        pagination.appendChild(btn);
      }
    }

    // === Khởi tạo lần đầu ===
    applyFilters();

    // === Tự động cập nhật khi admin sửa ===
    window.addEventListener("storage", e => {
      if (e.key === LS_PRODUCTS_KEY || e.key === LS_PRICING_DATA || e.key === "categories") {
        allProducts = loadProducts() || [];
        applyFilters(); // DÙNG LẠI HÀM CHUNG
      }
    });
  }
});

// ======= Page: PRODUCT DETAIL =======
if (document.title.includes("Chi tiết sản phẩm")) {
  const params = new URLSearchParams(location.search);
  const ma = params.get("ma");
  const detail = document.getElementById("product-detail");

  function renderDetail() {
    const catalog = loadProducts();
    const p = catalog.find((x) => String(x.ma) === String(ma));

    if (p && detail) {
      const img = p.imgSrc || svgPlaceholder(600, 400);

      // Xử lý giá & giảm giá (dựa theo ảnh)
      let priceHtml = "";
      // p.gia là giá gốc (list price), p.displayPrice là giá đã áp dụng quy tắc (sell price)
      const originalPrice = Number(p.gia || 0);
      const sellPrice = Number(p.displayPrice || 0);
      let discountPercent = 0;

      if (sellPrice > 0 && sellPrice < originalPrice) {
        // Có giảm giá
        discountPercent = Math.round(
          ((originalPrice - sellPrice) / originalPrice) * 100
        );
        priceHtml = `
          <div class="price-container">
            <span class="sell-price">${formatVND(sellPrice)}₫</span>
            <span class="original-price">${formatVND(originalPrice)}₫</span>
            ${discountPercent > 0
            ? `<span class="discount-badge">-${discountPercent}%</span>`
            : ""
          }
          </div>
        `;
      } else {
        // Chỉ có giá bán (hoặc không có giá)
        priceHtml = `
          <div class="price-container">
            <span class="sell-price">${sellPrice > 0 ? formatVND(sellPrice) + "₫" : "Liên hệ"
          }</span>
          </div>
        `;
      }

      // Placeholder cho thumbnails (dựa theo ảnh)
      // Lấy 4 ảnh, nếu có p.imgSrc thì dùng, còn lại placeholder
      const thumbnailsHtml = `
        <div class="thumbnail-gallery">
          <button class="thumb-item active"><img src="${img}" alt="thumb 1"></button>
          <button class="thumb-item"><img src="${svgPlaceholder(
        80,
        80,
        "Thumb 2"
      )}" alt="thumb 2"></button>
          <button class="thumb-item"><img src="${svgPlaceholder(
        80,
        80,
        "Thumb 3"
      )}" alt="thumb 3"></button>
          <button class="thumb-item"><img src="${svgPlaceholder(
        80,
        80,
        "Thumb 4"
      )}" alt="thumb 4"></button>
        </div>
      `;

      // Cập nhật breadcrumb (nếu có thể)
      const breadcrumbEl = document.querySelector(
        '.breadcrumb-nav li[aria-current="page"]'
      );
      if (breadcrumbEl) breadcrumbEl.textContent = p.ten; // Cập nhật tên SP vào breadcrumb

      detail.innerHTML = `
        <div class="product-images">
          <img src="${img}" alt="${p.ten}" class="main-image">
          ${thumbnailsHtml}
        </div>

        <div class="product-info-column">
          <h1 class="product-title">${p.ten}</h1>
          
          <p class="price-detail">${priceHtml}</p>

          <div class="action-buttons">
              <button onclick="addToCart('${p.ma}')" class="btn-buy-now">
               <strong>MUA NGAY</strong>
               <span>Giao tận nơi hoặc nhận tại cửa hàng</span>
            </button>

             

             <button class="btn-consult" onclick="location.href='tel:19000508'">
              <strong>Hotline Bảo Hành</strong>
            <span>(Gọi 1900.0525)</span>
            </button>
</div>

          <ul class="product-perks">
            <li>✔️ Bảo hành chính hãng 24 tháng.</li>
            <li>✔️ Hỗ trợ đổi mới trong 7 ngày.</li>
            <li>✔️ Miễn phí giao hàng toàn quốc.</li>
          </ul>

          <div class="info-box gifts">
            <div class="box-header">🎁 Quà tặng</div>
            <ul>
              <li>Đổi trả trong 3 ngày đầu tiên</li>
            </ul>
          </div>

          <div class="info-box support">
            <div class="box-header">🏦 Hỗ trợ</div>
            <ul>
              <li>Hỗ trợ trả góp 0% lãi xuất</li>
            </ul>
          </div>
          
          <div class="info-box promo">
            <div class="box-header">🎉 Khuyến mãi</div>
            <ul>
              <li>Giảm ngay 100.000đ khi mua tại store cho HS/SV</li>
            </ul>
          </div>
        </div>
      `;
    } else if (detail) {
      detail.innerHTML = `<p>❌ Sản phẩm không tồn tại hoặc đã ẩn.</p>`;
    }
    updateCartCount();
  }

  renderDetail();
  window.addEventListener("storage", (e) => {
    if (e.key === LS_PRODUCTS_KEY || e.key === LS_PRICING_DATA) renderDetail();
  });
}

// ======= Page: CART =======
if (document.title.includes("Giỏ hàng")) {
  if (!getCurrentUser()) {
    alert("🧑‍💻 Vui lòng đăng nhập để thêm vào giỏ hàng.");
    if (typeof openAuth === "function") {
      openAuth("login", document.getElementById("open-login") || null);
    }
  } else {
    const container = document.getElementById("cart-container");

    function renderCart() {
      const cart = getCart();
      if (!cart.length) {
        container.innerHTML = "<p>Giỏ hàng trống.</p>";
        return;
      }
      let total = 0;
      container.innerHTML =
        cart
          .map((item) => {
            total += (item.gia || 0) * (item.qty || 0);
            const img = item.imgSrc || svgPlaceholder(120, 90);
            return `
<div class="cart-row">
<img src="${img}" alt="${item.ten}">
<div class="cart-info">
<h4>${item.ten}</h4>
<p>${formatVND(item.gia)}₫</p>
<p>Số lượng:
<input type="number" min="1" value="${item.qty}" data-ma="${item.ma
              }" class="qty-input">
</p>
<button class="btn danger" onclick="removeFromCart('${item.ma}')">Xóa</button>
</div>
</div>`;
          })
          .join("") +
        `<div class="cart-summary">Tổng cộng: ${formatVND(total)}₫</div>`;

      document.querySelectorAll(".qty-input").forEach((input) => {
        input.addEventListener("change", (e) => {
          const ma = e.target.dataset.ma;
          const qty = Math.max(1, parseInt(e.target.value, 10) || 1);
          const cart = getCart();
          const idx = cart.findIndex((i) => String(i.ma) === String(ma));
          if (idx > -1) cart[idx].qty = qty;
          saveCart(cart);
          renderCart();
          updateCartCount();
        });
      });
    }

    window.removeFromCart = function (ma) {
      const cart = getCart().filter((i) => String(i.ma) !== String(ma));
      saveCart(cart);
      renderCart();
      updateCartCount();
    };

    renderCart();
    updateCartCount();
  }
}

// ======= Address book (per-user) =======
const LS_USER_ADDR_PF = "user_addresses:"; // key: user_addresses:<userId> => { list:[], def:null|string }

function _addrNorm(s) {
  return String(s || "").trim();
}

function loadUserAddrObj(uid) {
  try {
    return JSON.parse(
      localStorage.getItem(LS_USER_ADDR_PF + uid) || '{"list":[],"def":null}'
    );
  } catch (e) {
    return { list: [], def: null };
  }
}
function saveUserAddrObj(uid, obj) {
  localStorage.setItem(
    LS_USER_ADDR_PF + uid,
    JSON.stringify({ list: obj.list || [], def: obj.def || null })
  );
}
function addAddressForUser(uid, addr) {
  const a = _addrNorm(addr);
  if (!a) return loadUserAddrObj(uid);
  const o = loadUserAddrObj(uid);
  if (!o.list.some((x) => _addrNorm(x) === a)) o.list.unshift(a);
  if (!o.def) o.def = a; // auto set mặc định lần đầu
  saveUserAddrObj(uid, o);
  return o;
}
function setDefaultAddressForUser(uid, addr) {
  const a = _addrNorm(addr);
  if (!a) return loadUserAddrObj(uid);
  const o = loadUserAddrObj(uid);
  if (!o.list.some((x) => _addrNorm(x) === a)) o.list.unshift(a);
  o.def = a;
  saveUserAddrObj(uid, o);
  return o;
}
function renderSavedAddressesSelect(selectEl, uid) {
  const o = loadUserAddrObj(uid);
  if (!selectEl) return o;
  selectEl.innerHTML = [
    `<option value="">— Chọn địa chỉ đã lưu —</option>`,
    ...o.list.map((x) => {
      const selected = o.def && o.def === x ? " selected" : "";
      const txt = o.def === x ? `${x} (mặc định)` : x;
      return `<option value="${x.replace(
        /"/g,
        "&quot;"
      )}"${selected}>${txt}</option>`;
    }),
  ].join("");
  return o;
}

// ======= Checkout modal open/close + summary =======
function buildCheckoutSummary() {
  const summary = document.getElementById("checkout-summary");
  if (!summary) return;
  const cart = getCart();
  if (!cart.length) {
    summary.innerHTML = "<p>Giỏ hàng của bạn đang trống.</p>";
    return;
  }
  let total = 0;
  summary.innerHTML = `
<h3 style="font-weight:600;margin-bottom:6px">Tóm tắt đơn hàng</h3>
<ul style="margin:0 0 6px 16px;padding:0;list-style:disc">
${cart
      .map((i) => {
        total += (i.gia || 0) * (i.qty || 0);
        return `<li>${i.ten} ×${i.qty} — ${formatVND(i.gia)}₫</li>`;
      })
      .join("")}
</ul>
<p><strong>Tổng cộng: ${formatVND(total)}₫</strong></p>
`;
}

function openCheckoutModal() {
  const modal = document.getElementById("checkoutModal");
  if (!modal) return;

  const user = getCurrentUser();
  if (!user) {
    alert("🧑‍💻 Vui lòng đăng nhập để thêm vào giỏ hàng.");
    if (typeof openAuth === "function")
      openAuth("login", document.getElementById("open-login") || null);
    return;
  }

  // Tóm tắt giỏ
  buildCheckoutSummary();

  // Prefill tên
  const nameInp = document.querySelector('#checkout-form input[name="name"]');
  if (nameInp && !nameInp.value)
    nameInp.value = user.name || user.username || "";

  // Địa chỉ đã lưu
  const sel = document.getElementById("address-saved");
  const addrInp = document.querySelector(
    '#checkout-form input[name="address"]'
  );
  const defBtn = document.getElementById("btn-set-default");

  // Render danh sách + set mặc định
  const o = renderSavedAddressesSelect(sel, user.id);
  if (addrInp) addrInp.value = o.def || "";

  // Reset listener bằng clone để tránh bind chồng
  if (sel) {
    const cloneSel = sel.cloneNode(true);
    sel.parentNode.replaceChild(cloneSel, sel);
    cloneSel.addEventListener("change", () => {
      if (addrInp) addrInp.value = cloneSel.value || "";
    });
  }

  if (defBtn) {
    const cloneBtn = defBtn.cloneNode(true);
    defBtn.parentNode.replaceChild(cloneBtn, defBtn);
    cloneBtn.addEventListener("click", () => {
      const chosen = _addrNorm(addrInp?.value);
      if (!chosen) {
        alert("Nhập địa chỉ trước đã.");
        return;
      }
      setDefaultAddressForUser(user.id, chosen);
      renderSavedAddressesSelect(
        document.getElementById("address-saved"),
        user.id
      );
      alert("✅ Đã đặt làm địa chỉ mặc định.");
    });
  }

  modal.classList.add("open");
}

function closeCheckoutModal() {
  document.getElementById("checkoutModal")?.classList.remove("open");
}

// Mở popup khi bấm "Thanh toán" trên cart
document.getElementById("go-checkout")?.addEventListener("click", (e) => {
  e.preventDefault();
  openCheckoutModal();
});

// Đóng popup
document
  .querySelectorAll("[data-checkout-close]")
  .forEach((el) => el.addEventListener("click", closeCheckoutModal));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeCheckoutModal();
});

// ======= Page: CHECKOUT (popup trên cart) =======
// ======= Page: CHECKOUT (popup trên cart) =======
(function initCheckout() {
  const form = document.getElementById("checkout-form");
  const summary = document.getElementById("checkout-summary");
  if (!form || !summary) return;

  buildCheckoutSummary();

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // 1) Bảo đảm còn đăng nhập ở thời điểm bấm Lưu
    const cur = getCurrentUser();
    if (!cur) {
      alert("Phiên đăng nhập đã hết. Vui lòng đăng nhập lại để thanh toán.");
      closeCheckoutModal?.();
      openAuth?.("login", document.getElementById("open-login") || null);
      return;
    }

    // 2) Form data
    const fd = new FormData(form);
    const receiverName = (fd.get("name") || "").trim();
    const phone = (fd.get("phone") || "").trim();
    const address = (fd.get("address") || "").trim();
    const paymentMethod = fd.get("payment_method") || "COD";
    const isPaid = paymentMethod === "ONLINE";

    // 3) Giỏ hiện tại
    const cartNow = getCart();
    if (!cartNow.length) {
      alert("Giỏ hàng của bạn đang trống.");
      return;
    }
    const total = cartNow.reduce(
      (s, i) => s + Number(i.gia || 0) * Number(i.qty || 0),
      0
    );

    // 4) Lưu địa chỉ mới vào sổ địa chỉ (nếu có)
    if (address.trim()) addAddressForUser(cur.id, address);

    // 5) Tạo đơn
    const order = {
      id: genOrderId(),
      status: "Mới đặt",
      createdAt: isoNow(),
      items: cartNow,
      total,
      customerRef: {
        id: cur.id,
        name: cur.name,
        username: cur.username,
        email: cur.email,
      },
      shipping: {
        receiverName: receiverName || cur.name || cur.username,
        phone,
        address,
      },
      payment: { method: paymentMethod, paid: isPaid },
    };

    // 6) Ghi vào admin_orders + user_orders:<id>
    const orders = getOrders();
    orders.unshift(order);
    saveOrders(orders);
    const uos = getUserOrders(cur.id);
    uos.unshift({
      id: order.id,
      createdAt: order.createdAt,
      total: order.total,
      status: order.status,
      items: order.items,
      shipping: order.shipping,
    });
    saveUserOrders(cur.id, uos);

    // 7) Dọn giỏ + UI
    localStorage.removeItem(LS_CART_KEY);
    updateCartCount();
    buildCheckoutSummary();
    form.reset();
    closeCheckoutModal();

    openOrderSuccessModal(order);
  });
})();

// Check khi load & khi admin_users thay đổi ở tab khác
document.addEventListener("DOMContentLoaded", () => {
  const n = popNotice();
  if (n) showGlobalNotice(n);
  ensureActiveSession(); // vẫn check khóa lúc load
});
window.addEventListener("storage", (e) => {
  if (e.key === LS_USERS_KEY) ensureActiveSession();
});

// ======= Auth dropdown (open under header buttons) =======
const authModal = document.getElementById("authModal");
const authPanel = authModal?.querySelector(".auth-panel");
const openLoginBtn = document.getElementById("open-login");
const openRegisterBtn = document.getElementById("open-register");
const loginFormEl = document.getElementById("loginForm");
const registerFormEl = document.getElementById("registerForm");
const authTitle = document.getElementById("authTitle");
const switchToReg = document.getElementById("switchToRegister");
const switchToLogin = document.getElementById("switchToLogin");
const authMsg = document.getElementById("authMsg");

function showAuthMsg(text, ok = true, autoHideMs = ok ? 2500 : 0) {
  if (!authMsg) return;
  authMsg.textContent = text;
  // màu xanh khi ok, màu đỏ khi lỗi
  authMsg.style.background = ok ? "#ecfdf5" : "#fef2f2";
  authMsg.style.borderColor = ok ? "#bbf7d0" : "#fecaca";
  authMsg.style.color = ok ? "#065f46" : "#991b1b";
  authMsg.hidden = false;

  // tự ẩn nếu là thông báo thành công
  if (autoHideMs > 0) {
    clearTimeout(showAuthMsg._t);
    showAuthMsg._t = setTimeout(clearAuthMsg, autoHideMs);
  }
}

function clearAuthMsg() {
  if (!authMsg) return;
  authMsg.hidden = true;
  authMsg.textContent = "";
}

function placePanel(anchor) {
  if (!authPanel || !anchor) return;
  const r = anchor.getBoundingClientRect();
  const panelW = Math.min(380, window.innerWidth - 24);
  let left = r.right - panelW; // canh phải với nút
  left = Math.max(12, Math.min(left, window.innerWidth - panelW - 12));
  const top = r.bottom + 8; // rơi xuống dưới 8px
  authPanel.style.setProperty("--auth-left", left + "px");
  authPanel.style.setProperty("--auth-top", top + "px");
}

function openAuth(mode, anchor) {
  if (!authModal) return;
  clearAuthMsg();
  authModal.classList.add("open", "dropdown");
  placePanel(anchor);
  if (mode === "login") {
    loginFormEl.style.display = "";
    registerFormEl.style.display = "none";
    authTitle.textContent = "Đăng nhập";
    setTimeout(() => document.getElementById("luser")?.focus(), 0);
  } else {
    loginFormEl.style.display = "none";
    registerFormEl.style.display = "";
    authTitle.textContent = "Tạo tài khoản";
    setTimeout(() => document.getElementById("rname")?.focus(), 0);
  }
}
function closeAuth() {
  authModal.classList.remove("open", "dropdown");
}

openLoginBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  openAuth("login", e.currentTarget);
});
openRegisterBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  openAuth("register", e.currentTarget);
});

switchToReg?.addEventListener("click", (e) => {
  e.preventDefault();
  openAuth("register", openRegisterBtn || openLoginBtn);
});
switchToLogin?.addEventListener("click", (e) => {
  e.preventDefault();
  openAuth("login", openLoginBtn || openRegisterBtn);
});

authModal
  ?.querySelectorAll("[data-close]")
  ?.forEach((btn) => btn.addEventListener("click", closeAuth));

document.addEventListener("click", (e) => {
  if (!authModal?.classList.contains("open")) return;
  const clickedInside = authPanel?.contains(e.target);
  const clickedBtn = e.target === openLoginBtn || e.target === openRegisterBtn;
  if (!clickedInside && !clickedBtn) closeAuth();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeAuth();
});
window.addEventListener("resize", () => {
  if (authModal?.classList.contains("open")) {
    const anchor =
      registerFormEl.style.display !== "none" ? openRegisterBtn : openLoginBtn;
    placePanel(anchor || openLoginBtn || openRegisterBtn);
  }
});

// ======= Auth: Register & Login (NEW) =======
registerFormEl?.addEventListener("submit", (e) => {
  e.preventDefault();
  const fd = new FormData(registerFormEl);
  const fullname = (fd.get("fullname") || "").trim();
  const username = (fd.get("username") || "").trim();
  const email = (fd.get("email") || "").trim();
  const password = String(fd.get("password") || "");
  const confirm = String(fd.get("confirm") || "");

  if (password !== confirm) {
    showAuthMsg("❌ Mật khẩu nhập lại không khớp.", false);
    return;
  }
  const users = getUsers();
  if (
    users.some(
      (u) => String(u.username || "").toLowerCase() === username.toLowerCase()
    )
  ) {
    showAuthMsg("❌ Tên đăng nhập đã tồn tại.", false);
    return;
  }
  if (
    users.some(
      (u) => String(u.email || "").toLowerCase() === email.toLowerCase()
    )
  ) {
    showAuthMsg("❌ Email đã tồn tại.", false);
    return;
  }

  const user = {
    id: genUserId(),
    name: fullname,
    username,
    email,
    password, // Demo: lưu plain-text (thực tế cần hash)
    active: true,
    date: todayVN(), // dùng để hiển thị trên admin_users
    createdAt: isoNow(),
    role: "customer",
  };
  users.unshift(user);
  saveUsers(users);

  // Chuyển sang form đăng nhập + prefill username
  openAuth("login", openLoginBtn || openRegisterBtn);
  document.getElementById("luser").value = username;
  showAuthMsg("✅ Tạo tài khoản thành công. Vui lòng đăng nhập.");
});

loginFormEl?.addEventListener("submit", (e) => {
  e.preventDefault();
  const fd = new FormData(loginFormEl);
  const username = (fd.get("username") || "").trim();
  const password = String(fd.get("password") || "");

  const user = findUserByUsername(username);
  if (!user) {
    showAuthMsg("❌ Tài khoản không tồn tại.", false);
    return;
  }
  if (!user.active) {
    showAuthMsg("❌ Tài khoản đã bị khóa. Liên hệ hỗ trợ.", false);
    return;
  }
  if (user.password !== password) {
    showAuthMsg("❌ Mật khẩu không đúng.", false);
    return;
  }

  setCurrentUser({
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
  });

  showAuthMsg("✅ Đăng nhập thành công!");
  setTimeout(() => {
    closeAuth();
    renderAuthUI();
  }, 500);
});

/* ======= Header Auth UI: ẩn 2 nút khi đã login, hiện icon user + hover Logout ======= */
function renderAuthUI() {
  const nav =
    document.querySelector(".site-header nav") || document.querySelector("nav");
  const loginBtn = document.getElementById("open-login");
  const registerBtn = document.getElementById("open-register");
  const existed = document.getElementById("userMenu");
  if (existed) existed.remove();

  const user = getCurrentUser();

  if (user) {
    // Ẩn 2 nút
    if (loginBtn) loginBtn.style.display = "none";
    if (registerBtn) registerBtn.style.display = "none";

    // Tạo icon user + dropdown Logout (hover)
    const wrap = document.createElement("span");
    wrap.id = "userMenu";
    wrap.style.position = "relative";
    wrap.style.display = "inline-block";
    wrap.style.marginLeft = "12px";

    const btn = document.createElement("button");
    btn.id = "userBtn";
    btn.className = "nav-btn";
    btn.title = user.name || user.username || "Tài khoản";
    btn.style.display = "inline-flex";
    btn.style.alignItems = "center";
    btn.style.gap = "8px";
    btn.innerHTML = `👤 <span>${user.name || user.username}</span>`;

    const menu = document.createElement("div");
    menu.id = "userDropdown";
    Object.assign(menu.style, {
      position: "absolute",
      right: "0",
      top: "100%",
      minWidth: "160px",
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      padding: "8px",
      boxShadow: "0 10px 30px rgba(0,0,0,.12)",
      display: "none",
      zIndex: "1001",
    });

    const logout = document.createElement("button");
    logout.id = "logoutBtn";
    logout.className = "nav-btn";
    logout.style.margin = "0";
    logout.style.width = "100%";
    logout.textContent = "Đăng xuất";

    menu.appendChild(logout);
    wrap.appendChild(btn);
    wrap.appendChild(menu);
    if (nav) nav.appendChild(wrap);

    // Hover để hiện/ẩn dropdown
    wrap.addEventListener("mouseenter", () => {
      menu.style.display = "block";
    });
    wrap.addEventListener("mouseleave", () => {
      menu.style.display = "none";
    });

    // Đăng xuất
    logout.addEventListener("click", (e) => {
      e.preventDefault();
      setCurrentUser(null);
      // Hiện lại 2 nút
      if (loginBtn) loginBtn.style.display = "";
      if (registerBtn) registerBtn.style.display = "";
      renderAuthUI();
    });
  } else {
    // Chưa đăng nhập => đảm bảo 2 nút hiện lại, gỡ user menu nếu có
    if (loginBtn) loginBtn.style.display = "";
    if (registerBtn) registerBtn.style.display = "";
    const old = document.getElementById("userMenu");
    if (old) old.remove();
  }
}

// Block vào trang giỏ hàng nếu chưa đăng nhập (event delegation an toàn)
document.addEventListener("click", (e) => {
  // Nếu click vào text node thì bỏ qua (không gọi closest trên text node)
  if (!(e.target instanceof Element)) return;

  const a = e.target.closest("a[href]");
  if (!a) return;

  const href = (a.getAttribute("href") || "").trim().toLowerCase();

  // Bỏ qua các link điều khiển để không chặn nút đăng nhập/đăng ký
  if (href === "" || href === "#" || href.startsWith("javascript:")) return;

  // Chỉ chặn khi đi tới giỏ hàng
  if (
    /cart(\.html)?(?:[?#]|$)/i.test(href) ||
    a.id === "nav-cart" ||
    a.dataset.goto === "cart"
  ) {
    if (!requireLoginOrAlert(a)) {
      e.preventDefault();
      e.stopPropagation();
    }
  }
});

function openProfileModal() {
  const cur = getCurrentUser();
  if (!cur) {
    openAuth?.("login", document.getElementById("open-login") || null);
    return;
  }

  // Lấy full user từ admin_users để có 'date'
  const full = findUserById(cur.id) || cur;
  const orders = getUserOrders(cur.id) || [];

  // Fill UI
  document.getElementById("pName").textContent =
    full.name || cur.name || cur.username || "—";
  document.getElementById("pUsername").textContent =
    "@" + (full.username || cur.username || "—");
  document.getElementById("pEmail").textContent =
    full.email || cur.email || "—";
  document.getElementById("pDate").textContent =
    full.date ||
    (full.createdAt
      ? new Date(full.createdAt).toLocaleDateString("vi-VN")
      : "—");
  document.getElementById("pOrders").textContent = String(orders.length);

  document.getElementById("profileModal").classList.add("open");
}
function closeProfileModal() {
  document.getElementById("profileModal")?.classList.remove("open");
}

// đóng popup
document
  .querySelectorAll("[data-profile-close]")
  .forEach((el) => el.addEventListener("click", closeProfileModal));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeProfileModal();
});

// nút Đăng xuất trong popup
document.getElementById("profileLogout")?.addEventListener("click", () => {
  setCurrentUser(null);
  closeProfileModal();
  renderAuthUI();
});
function renderAuthUI() {
  const nav =
    document.querySelector(".site-header nav") || document.querySelector("nav");
  const loginBtn = document.getElementById("open-login");
  const registerBtn = document.getElementById("open-register");
  const existed = document.getElementById("userMenu");
  if (existed) existed.remove();

  const user = getCurrentUser();

  if (user) {
    if (loginBtn) loginBtn.style.display = "none";
    if (registerBtn) registerBtn.style.display = "none";

    const wrap = document.createElement("span");
    wrap.id = "userMenu";
    wrap.style.position = "relative";
    wrap.style.display = "inline-block";
    wrap.style.marginLeft = "12px";

    const btn = document.createElement("button");
    btn.id = "userBtn";
    btn.className = "nav-btn";
    btn.title = user.name || user.username || "Tài khoản";
    btn.style.display = "inline-flex";
    btn.style.alignItems = "center";
    btn.style.gap = "8px";
    btn.innerHTML = `👤 <span>${user.name || user.username}</span>`;

    // Click avatar -> mở popup hồ sơ
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openProfileModal();
    });

    wrap.appendChild(btn);
    if (nav) nav.appendChild(wrap);
  } else {
    if (loginBtn) loginBtn.style.display = "";
    if (registerBtn) registerBtn.style.display = "";
    const old = document.getElementById("userMenu");
    if (old) old.remove();
  }
}

function showProfileMsg(txt, ok = true) {
  const el = document.getElementById("profileMsg");
  if (!el) return;
  el.hidden = false;
  el.textContent = txt;
  el.style.color = ok ? "#065f46" : "#991b1b";
}

function hideProfileMsg() {
  const el = document.getElementById("profileMsg");
  if (!el) return;
  el.hidden = true;
  el.textContent = "";
}

// Điền dữ liệu cho view & edit
function fillProfileView(full, ordersLen) {
  document.getElementById("pName").textContent =
    full.name || full.username || "—";
  document.getElementById("pUsername").textContent =
    "@" + (full.username || "—");
  document.getElementById("pEmail").textContent = full.email || "—";
  document.getElementById("pDate").textContent =
    full.date ||
    (full.createdAt
      ? new Date(full.createdAt).toLocaleDateString("vi-VN")
      : "—");
  document.getElementById("pOrders").textContent = String(ordersLen || 0);
}

function fillProfileEdit(full) {
  document.getElementById("pf_name").value = full.name || "";
  document.getElementById("pf_user").value = full.username || "";
  document.getElementById("pf_email").value = full.email || "";
}

function toggleProfileMode(editing) {
  document.getElementById("profileView").style.display = editing ? "none" : "";
  document.getElementById("profileForm").style.display = editing ? "" : "none";
  if (!editing) hideProfileMsg();
}

function openProfileModal() {
  const cur = getCurrentUser();
  if (!cur) {
    openAuth?.("login", document.getElementById("open-login") || null);
    return;
  }

  const full = findUserById(cur.id) || cur;
  const orders = getUserOrders(cur.id) || [];

  fillProfileView(full, orders.length);
  fillProfileEdit(full);
  toggleProfileMode(false);

  document.getElementById("profileModal").classList.add("open");
}

function closeProfileModal() {
  document.getElementById("profileModal")?.classList.remove("open");
  toggleProfileMode(false);
  hideProfileMsg();
}

// nút Đóng modal
document
  .querySelectorAll("[data-profile-close]")
  .forEach((el) => el.addEventListener("click", closeProfileModal));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeProfileModal();
});

// nút Đăng xuất
document.getElementById("profileLogout")?.addEventListener("click", () => {
  setCurrentUser(null);
  closeProfileModal();
  renderAuthUI();
});

// nút Sửa
document.getElementById("profileEditBtn")?.addEventListener("click", () => {
  toggleProfileMode(true);
});

// nút Hủy
document.getElementById("profileCancel")?.addEventListener("click", () => {
  toggleProfileMode(false);
});

// submit Lưu sửa
document.getElementById("profileForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  hideProfileMsg();

  const cur = getCurrentUser();
  if (!cur) {
    showProfileMsg("Bạn cần đăng nhập lại.", false);
    return;
  }

  const name = String(document.getElementById("pf_name").value || "").trim();
  const username = String(
    document.getElementById("pf_user").value || ""
  ).trim();
  const email = String(document.getElementById("pf_email").value || "").trim();

  if (!name || !username || !email) {
    showProfileMsg("Vui lòng nhập đầy đủ thông tin.", false);
    return;
  }
  const mailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!mailOk) {
    showProfileMsg("Email không hợp lệ.", false);
    return;
  }

  // Validate trùng username/email với user khác
  const users = getUsers();
  const lowerUser = username.toLowerCase();
  const lowerMail = email.toLowerCase();
  if (
    users.some(
      (u) =>
        u.id !== cur.id && String(u.username || "").toLowerCase() === lowerUser
    )
  ) {
    showProfileMsg("Username đã tồn tại.", false);
    return;
  }
  if (
    users.some(
      (u) =>
        u.id !== cur.id && String(u.email || "").toLowerCase() === lowerMail
    )
  ) {
    showProfileMsg("Email đã tồn tại.", false);
    return;
  }

  // Cập nhật trong admin_users
  const idx = users.findIndex((u) => u.id === cur.id);
  if (idx > -1) {
    users[idx].name = name;
    users[idx].username = username;
    users[idx].email = email;
    saveUsers(users);
  }

  // Cập nhật current_user để UI phản ánh ngay
  setCurrentUser({ id: cur.id, name, username, email });

  // Refresh UI trong header + view
  renderAuthUI();

  const full = findUserById(cur.id) || { id: cur.id, name, username, email };
  const orders = getUserOrders(cur.id) || [];
  fillProfileView(full, orders.length);
  toggleProfileMode(false);
  showProfileMsg("✅ Đã cập nhật thông tin.", true);
});

function orderSummaryHtml(order) {
  const esc = (s) =>
    String(s || "").replace(
      /[&<>"']/g,
      (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[c])
    );
  const created = new Date(order.createdAt).toLocaleString("vi-VN");
  const paidText = order.payment?.paid ? "ĐÃ THANH TOÁN" : "CHƯA THANH TOÁN";
  const methodText = order.payment?.method === "ONLINE" ? "Online" : "COD";
  const itemsHtml = (order.items || [])
    .map((i) => `<li>${esc(i.ten)} ×${i.qty} — ${formatVND(i.gia)}₫</li>`)
    .join("");
  const ship = order.shipping || {};
  return `
<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
<span class="s-badge">Mã đơn: <strong>${esc(order.id)}</strong></span>
<span class="s-badge">Thời gian: ${esc(created)}</span>
</div>

<p><strong>Người nhận:</strong> ${esc(ship.receiverName || "—")} — ${esc(
    ship.phone || "—"
  )}</p>
<p><strong>Địa chỉ:</strong> ${esc(ship.address || "—")}</p>

<h4 style="margin:10px 0 6px 0">Sản phẩm</h4>
<ul style="margin:0 0 8px 18px;padding:0;list-style:disc">${itemsHtml}</ul>

<p style="margin:8px 0"><strong>Tổng cộng:</strong> ${formatVND(
    order.total
  )}₫</p>
<p style="margin:8px 0"><strong>Phương thức:</strong> ${methodText}</p>
<p style="margin:8px 0">
<strong>Trạng thái thanh toán:</strong>
<span style="padding:2px 8px;border-radius:9999px;border:1px solid #e5e7eb;
${order.payment?.paid
      ? "background:#ecfdf5;color:#065f46;border-color:#bbf7d0"
      : "background:#fef2f2;color:#991b1b;border-color:#fecaca"
    }">
${paidText}
</span>
</p>
`;
}

function openOrderSuccessModal(order) {
  const modal = document.getElementById("orderSuccessModal");
  const body = document.getElementById("orderSuccessBody");
  if (!modal || !body) {
    // Fallback nếu thiếu HTML
    alert(
      `Đặt hàng thành công!\nMã đơn: ${order.id}\nTổng: ${formatVND(
        order.total
      )}₫`
    );
    location.href = "index.html";
    return;
  }
  body.innerHTML = orderSummaryHtml(order);
  modal.classList.add("open");
}

function closeOrderSuccessModal() {
  document.getElementById("orderSuccessModal")?.classList.remove("open");
  // chuyển về trang chủ
  location.href = "index.html";
}

// close bằng click overlay/btn hoặc ESC
document
  .querySelectorAll("[data-success-close]")
  .forEach((el) => el.addEventListener("click", closeOrderSuccessModal));
document.addEventListener("keydown", (e) => {
  if (
    e.key === "Escape" &&
    document.getElementById("orderSuccessModal")?.classList.contains("open")
  ) {
    closeOrderSuccessModal();
  }
});

/* ==================== STACKED MODALS ==================== */
let __modalZ = 2000; // cao hơn mọi thứ khác
function openStacked(modalEl) {
  if (!modalEl) return;
  __modalZ += 2;
  modalEl.style.position = "fixed";
  modalEl.style.inset = "0";
  modalEl.style.display = "block";
  modalEl.style.zIndex = String(__modalZ);
  modalEl.classList.add("open");
}
function closeModalById(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove("open");
  el.style.display = "none";
}

/* ==================== ORDERS: LIST + DETAIL ==================== */
function _esc(s) {
  return String(s || "").replace(
    /[&<>"']/g,
    (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
      c
    ])
  );
}
function openOrdersListModal() {
  const cur = getCurrentUser();
  if (!cur) {
    openAuth?.("login", document.getElementById("open-login") || null);
    return;
  }

  const listModal = document.getElementById("ordersListModal");
  const body = document.getElementById("ordersListBody");

  // Lấy dữ liệu từ user và admin
  const userOrders = getUserOrders(cur.id) || [];
  const adminOrders = JSON.parse(localStorage.getItem(LS_ORDERS_KEY) || "[]");

  // Đồng bộ trạng thái mới nhất từ admin_orders
  const orders = userOrders.map((uOrder) => {
    const adminMatch = adminOrders.find((a) => a.id === uOrder.id);
    if (adminMatch && adminMatch.status) {
      return { ...uOrder, status: adminMatch.status };
    }
    return uOrder;
  });

  if (!orders.length) {
    body.innerHTML = '<p class="muted">Bạn chưa có đơn hàng nào.</p>';
  } else {
    const rows = orders
      .map((o) => {
        const buyer = o.shipping?.receiverName || cur.name || cur.username || "—";
        const time = o.createdAt ? new Date(o.createdAt) : null;
        const timeStr = time ? time.toLocaleString("vi-VN") : "—";

        // ✅ Tính ngày dự kiến = ngày mua + 5 ngày
        let duKien = "—";
        if (time) {
          const duKienDate = new Date(time);
          duKienDate.setDate(duKienDate.getDate() + 5);
          duKien = duKienDate.toLocaleDateString("vi-VN");
        }

        const status = o.status || "Đang xử lý";

        return `
<tr>
  <td style="white-space:nowrap">${_esc(o.id)}</td>
  <td>${_esc(buyer)}</td>
  <td style="white-space:nowrap">${_esc(timeStr)}</td>
  <td style="white-space:nowrap">${_esc(duKien)}</td>
  <td style="text-align:right;white-space:nowrap"><strong>${formatVND(o.total)}₫</strong></td>
  <td style="white-space:nowrap">${_esc(status)}</td>
  <td style="text-align:right">
    <button class="btn primary" data-oid="${_esc(o.id)}">Chi tiết</button>
  </td>
</tr>`;
      })
      .join("");

    body.innerHTML = `
<table class="orders-table">
  <thead>
    <tr>
      <th>Mã đơn</th>
      <th>Người mua</th>
      <th>Ngày mua</th>
      <th>Dự kiến giao</th>
      <th>Tổng tiền</th>
      <th>Trạng thái</th>
      <th></th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>`;
  }

  // Bắt sự kiện xem chi tiết
  body.onclick = (e) => {
    const btn = e.target.closest("[data-oid]");
    if (!btn) return;
    openOrderDetailModal(btn.getAttribute("data-oid"));
  };

  openStacked(listModal);
}



// Tìm đơn đầy đủ (ưu tiên admin_orders để có payment/method)
function findOrderByIdAll(orderId, uid) {
  const a = (getOrders() || []).find((o) => String(o.id) === String(orderId));
  if (a) return a;
  const u = (getUserOrders(uid) || []).find(
    (o) => String(o.id) === String(orderId)
  );
  // Bổ sung field payment mặc định nếu thiếu (để hợp với orderSummaryHtml)
  return u
    ? Object.assign({ payment: { method: "COD", paid: false } }, u)
    : null;
}

function openOrderDetailModal(orderId) {
  const cur = getCurrentUser();
  if (!cur) {
    openAuth?.("login", document.getElementById("open-login") || null);
    return;
  }

  const order = findOrderByIdAll(orderId, cur.id);
  if (!order) {
    alert("Không tìm thấy đơn hàng này.");
    return;
  }

  const modal = document.getElementById("orderDetailModal");
  const body = document.getElementById("orderDetailBody");
  body.innerHTML = orderSummaryHtml(order); // tận dụng renderer đã có
  openStacked(modal);
}


/** Regex đơn giản – đúng nhu cầu abc@domain.tld */
function isValidEmail(email) {
  const v = String(email || '').trim();
  // tránh space, có 1 '@', có dấu chấm sau domain
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/** Hiện lỗi thân thiện ngay trên input */
function validateEmailInput(inputEl) {
  const val = inputEl.value.trim();
  if (!val) {
    inputEl.setCustomValidity('Vui lòng nhập email.');
  } else if (!isValidEmail(val)) {
    inputEl.setCustomValidity('Email không hợp lệ. Vui lòng nhập theo dạng abc@example.com');
  } else {
    inputEl.setCustomValidity(''); // xoá lỗi
  }
  // Gọi để trình duyệt hiển thị/ẩn tooltip lỗi ngay
  inputEl.reportValidity();
}

/** —— 1) Hồ sơ: nút Lưu ——
 *  Giữ nguyên showProfileMsg(...) của bạn
 *  Gọi khi bấm Lưu hồ sơ
 */
function onSaveProfile() {
  const name = document.getElementById('pf_name')?.value?.trim();
  const username = document.getElementById('pf_username')?.value?.trim();
  const emailEl = document.getElementById('pf_email');
  const email = String(emailEl?.value || '').trim();

  if (!name || !username || !email) {
    showProfileMsg('Vui lòng nhập đầy đủ thông tin.', false);
    if (!email) emailEl?.focus();
    return;
  }
  if (!isValidEmail(email)) {
    // hiện lỗi HTML5 ngay trên input + message tổng quát của bạn
    validateEmailInput(emailEl);
    showProfileMsg('Email không hợp lệ.', false);
    emailEl?.focus();
    return;
  }

  // ... tiếp tục xử lý lưu hồ sơ
  showProfileMsg('Đã lưu hồ sơ.', true);
}

/** —— 2) Đăng ký: submit form đăng ký —— */
document.addEventListener('DOMContentLoaded', function () {
  const registerForm = document.getElementById('registerForm');
  const rEmail = document.getElementById('remail');

  if (rEmail) {
    // validate realtime khi gõ
    rEmail.addEventListener('input', () => validateEmailInput(rEmail));
    rEmail.addEventListener('blur', () => validateEmailInput(rEmail));
  }

  if (registerForm) {
    registerForm.addEventListener('submit', function (e) {
      // chặn submit nếu email không hợp lệ
      if (rEmail) validateEmailInput(rEmail);
      if (!rEmail || !isValidEmail(rEmail.value)) {
        e.preventDefault();
        rEmail?.focus();
      }
    });
  }
});



/* ==================== BIND NÚT & CLOSE ==================== */
document
  .getElementById("profileOrdersBtn")
  ?.addEventListener("click", openOrdersListModal);

// Chỉ đóng khi bấm nút Đóng (không đóng bằng overlay/ESC)
document
  .querySelectorAll("[data-orders-close]")
  .forEach((el) =>
    el.addEventListener("click", () => closeModalById("ordersListModal"))
  );
document
  .querySelectorAll("[data-odetail-close]")
  .forEach((el) =>
    el.addEventListener("click", () => closeModalById("orderDetailModal"))
  );




// Khởi tạo UI theo trạng thái lưu trong localStorage
renderAuthUI();
setInterval(ensureActiveSession, 2000); // 2s/lần, đủ nhẹ cho localStorage