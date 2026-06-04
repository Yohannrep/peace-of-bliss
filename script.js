const products = [
  {
    id: "golden-hour",
    name: "Golden Hour",
    mood: "cozy",
    size: "12 oz",
    price: 24,
    color: "#f3b34c",
    notes: ["Golden Hour", "Cherry Blossom", "White Oak & Vanilla"],
    description: "Warm vanilla woods with a bright floral lift. Best for bedrooms, reading corners, and slow Sundays."
  },
  {
    id: "light-clean",
    name: "Light & Clean",
    mood: "bright",
    size: "12 oz",
    price: 22,
    color: "#9ccf65",
    notes: ["Lemon C", "Whiskey", "Paloma"],
    description: "Crisp citrus with a sparkling finish. Best for kitchens, entryways, and morning resets."
  },
  {
    id: "island-fizz",
    name: "Island Fizz",
    mood: "fresh",
    size: "12 oz",
    price: 25,
    color: "#25b6aa",
    notes: ["Cranberry P", "Coconut Lime V", "Black Cardamom & Cream"],
    description: "Tart fruit, creamy lime, and soft spice. Best for baths, parties, and vacation-at-home nights."
  },
  {
    id: "whiskey-shots",
    name: "Whiskey Shots",
    mood: "bold",
    size: "12 oz",
    price: 26,
    color: "#b8673f",
    notes: ["Whiskey", "Smoke", "Amber"],
    description: "A moody after-dark candle with warm amber and smoke. Best for lounges and dinner tables."
  },
  {
    id: "bliss-box",
    name: "Bliss Discovery Box",
    mood: "cozy",
    size: "4 mini tins",
    price: 34,
    color: "#d87b77",
    notes: ["Sampler", "Gift Set", "Seasonal"],
    description: "Four mini pours for customers who want to try the full Peace Of Bliss scent universe."
  },
  {
    id: "wick-care-kit",
    name: "Wick Care Kit",
    mood: "fresh",
    size: "Accessory",
    price: 18,
    color: "#5b3c65",
    notes: ["Trimmer", "Dipper", "Care Card"],
    description: "A polished candle-care set that keeps every burn cleaner, calmer, and longer lasting."
  }
];

const state = {
  cart: JSON.parse(localStorage.getItem("pobCustomerCart") || "[]"),
  activeMood: "all",
  promo: localStorage.getItem("pobPromo") || ""
};

const productGrid = document.getElementById("productGrid");
const searchInput = document.getElementById("searchInput");
const moodFilters = document.getElementById("moodFilters");
const cartDrawer = document.getElementById("cartDrawer");
const cartItems = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const totals = document.getElementById("totals");
const promoInput = document.getElementById("promoInput");
const toast = document.getElementById("toast");
const quizOptions = document.getElementById("quizOptions");
const quizResult = document.getElementById("quizResult");
const checkoutForm = document.getElementById("checkoutForm");
const deliverySelect = document.getElementById("deliverySelect");
const orderModal = document.getElementById("orderModal");
const orderMessage = document.getElementById("orderMessage");

function money(value) {
  return `$${value.toFixed(2)}`;
}

function saveCart() {
  localStorage.setItem("pobCustomerCart", JSON.stringify(state.cart));
  localStorage.setItem("pobPromo", state.promo);
}

function getProduct(id) {
  return products.find((product) => product.id === id);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 1800);
}

function renderProducts() {
  const term = searchInput.value.trim().toLowerCase();
  productGrid.innerHTML = products.map((product) => {
    const haystack = [product.name, product.mood, product.description, ...product.notes].join(" ").toLowerCase();
    const moodMatch = state.activeMood === "all" || product.mood === state.activeMood;
    const searchMatch = !term || haystack.includes(term);
    return `
      <article class="product-card${moodMatch && searchMatch ? "" : " hidden"}" data-id="${product.id}">
        <div class="product-art" style="--accent:${product.color}">
          <div class="product-jar"><span>${product.name}</span></div>
        </div>
        <div class="product-body">
          <div class="product-meta"><span>${product.size}</span><span>${product.mood}</span></div>
          <h3>${product.name}</h3>
          <p>${product.description}</p>
          <ul class="scent-list">${product.notes.map((note) => `<li>${note}</li>`).join("")}</ul>
          <div class="product-footer">
            <strong class="price">${money(product.price)}</strong>
            <button class="product-button" type="button" data-add="${product.id}">Add to cart</button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function cartQuantity() {
  return state.cart.reduce((sum, item) => sum + item.qty, 0);
}

function subtotal() {
  return state.cart.reduce((sum, item) => sum + getProduct(item.id).price * item.qty, 0);
}

function discountAmount(base) {
  return state.promo.toUpperCase() === "BLISS10" ? base * 0.1 : 0;
}

function shippingAmount() {
  if (deliverySelect.value === "pickup" || subtotal() === 0) return 0;
  return subtotal() >= 65 ? 0 : 7.95;
}

function giftWrapAmount() {
  return checkoutForm.giftWrap.checked ? 4 : 0;
}

function renderCart() {
  cartCount.textContent = cartQuantity();
  cartItems.innerHTML = state.cart.length ? "" : "<p>Your cart is empty. Add a candle and the magic starts.</p>";
  state.cart.forEach((item) => {
    const product = getProduct(item.id);
    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `
      <div><strong>${product.name}</strong><span>${money(product.price)} each</span></div>
      <div class="qty">
        <button type="button" data-dec="${product.id}" aria-label="Decrease ${product.name}">-</button>
        <strong>${item.qty}</strong>
        <button type="button" data-inc="${product.id}" aria-label="Increase ${product.name}">+</button>
      </div>
    `;
    cartItems.append(row);
  });

  const base = subtotal();
  const discount = discountAmount(base);
  const shipping = shippingAmount();
  const giftWrap = giftWrapAmount();
  const tax = (base - discount + shipping + giftWrap) * 0.082;
  const total = base - discount + shipping + giftWrap + tax;
  totals.innerHTML = `
    <div><span>Subtotal</span><span>${money(base)}</span></div>
    <div><span>Discount</span><span>-${money(discount)}</span></div>
    <div><span>Shipping</span><span>${shipping === 0 ? "Free" : money(shipping)}</span></div>
    <div><span>Gift wrap</span><span>${money(giftWrap)}</span></div>
    <div><span>Estimated tax</span><span>${money(tax)}</span></div>
    <div><strong>Total</strong><strong>${money(total)}</strong></div>
  `;
  saveCart();
}

function addToCart(id) {
  const existing = state.cart.find((item) => item.id === id);
  if (existing) existing.qty += 1;
  else state.cart.push({ id, qty: 1 });
  renderCart();
  showToast(`${getProduct(id).name} added to cart`);
}

function changeQuantity(id, delta) {
  const item = state.cart.find((entry) => entry.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) state.cart = state.cart.filter((entry) => entry.id !== id);
  renderCart();
}

function openCart() {
  cartDrawer.classList.add("open");
  cartDrawer.setAttribute("aria-hidden", "false");
}

function closeCart() {
  cartDrawer.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden", "true");
}

function applyPromo() {
  state.promo = promoInput.value.trim().toUpperCase();
  if (state.promo === "BLISS10") showToast("Promo applied: 10% off");
  else if (state.promo) showToast("That code is not active yet");
  renderCart();
}

function recommend(mood) {
  const product = products.find((item) => item.mood === mood) || products[0];
  quizResult.innerHTML = `<span>Your match</span><strong>${product.name}</strong><p>${product.description}</p><button class="button primary" type="button" data-add="${product.id}">Add match to cart</button>`;
  quizOptions.querySelectorAll("button").forEach((button) => button.classList.toggle("active", button.dataset.quiz === mood));
}

function placeOrder(event) {
  event.preventDefault();
  if (!state.cart.length) {
    showToast("Add at least one item before checkout");
    openCart();
    return;
  }
  const data = new FormData(checkoutForm);
  const orderId = `POB-${Math.floor(100000 + Math.random() * 900000)}`;
  const name = data.get("firstName");
  orderMessage.textContent = `${name}, your demo order ${orderId} is confirmed. A real shop would send payment and fulfillment details here.`;
  state.cart = [];
  saveCart();
  renderCart();
  orderModal.classList.add("open");
  orderModal.setAttribute("aria-hidden", "false");
  checkoutForm.reset();
}

productGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add]");
  if (button) addToCart(button.dataset.add);
});
quizResult.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add]");
  if (button) addToCart(button.dataset.add);
});
searchInput.addEventListener("input", renderProducts);
moodFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-mood]");
  if (!button) return;
  state.activeMood = button.dataset.mood;
  moodFilters.querySelectorAll(".chip").forEach((chip) => chip.classList.remove("active"));
  button.classList.add("active");
  renderProducts();
});
document.getElementById("openCart").addEventListener("click", openCart);
document.getElementById("closeCart").addEventListener("click", closeCart);
cartDrawer.addEventListener("click", (event) => {
  if (event.target === cartDrawer) closeCart();
  const inc = event.target.closest("[data-inc]");
  const dec = event.target.closest("[data-dec]");
  if (inc) changeQuantity(inc.dataset.inc, 1);
  if (dec) changeQuantity(dec.dataset.dec, -1);
});
document.getElementById("applyPromo").addEventListener("click", applyPromo);
document.getElementById("checkoutLink").addEventListener("click", closeCart);
quizOptions.addEventListener("click", (event) => {
  const button = event.target.closest("[data-quiz]");
  if (button) recommend(button.dataset.quiz);
});
deliverySelect.addEventListener("change", renderCart);
checkoutForm.giftWrap.addEventListener("change", renderCart);
checkoutForm.addEventListener("submit", placeOrder);
document.getElementById("closeModal").addEventListener("click", () => {
  orderModal.classList.remove("open");
  orderModal.setAttribute("aria-hidden", "true");
});
document.getElementById("keepShopping").addEventListener("click", () => {
  orderModal.classList.remove("open");
  orderModal.setAttribute("aria-hidden", "true");
  document.getElementById("shop").scrollIntoView({ behavior: "smooth" });
});
promoInput.value = state.promo;
renderProducts();
renderCart();
