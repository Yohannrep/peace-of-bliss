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
const giftWrapSelect = document.getElementById("giftWrapSelect");
const addressStatus = document.getElementById("addressStatus");
const orderModal = document.getElementById("orderModal");
const orderMessage = document.getElementById("orderMessage");
const kitModal = document.getElementById("kitModal");
const kitForm = document.getElementById("kitForm");

const giftWrapPrices = {
  none: 0,
  classic: 4,
  blush: 5.5,
  holiday: 6,
  luxury: 9
};

const giftWrapNames = {
  none: "No gift wrap",
  classic: "Classic kraft wrap",
  blush: "Blush ribbon wrap",
  holiday: "Holiday wrap",
  luxury: "Luxury keepsake box"
};

const stateNames = {
  AL: "ALABAMA", AK: "ALASKA", AZ: "ARIZONA", AR: "ARKANSAS", CA: "CALIFORNIA",
  CO: "COLORADO", CT: "CONNECTICUT", DE: "DELAWARE", FL: "FLORIDA", GA: "GEORGIA",
  HI: "HAWAII", ID: "IDAHO", IL: "ILLINOIS", IN: "INDIANA", IA: "IOWA", KS: "KANSAS",
  KY: "KENTUCKY", LA: "LOUISIANA", ME: "MAINE", MD: "MARYLAND", MA: "MASSACHUSETTS",
  MI: "MICHIGAN", MN: "MINNESOTA", MS: "MISSISSIPPI", MO: "MISSOURI", MT: "MONTANA",
  NE: "NEBRASKA", NV: "NEVADA", NH: "NEW HAMPSHIRE", NJ: "NEW JERSEY", NM: "NEW MEXICO",
  NY: "NEW YORK", NC: "NORTH CAROLINA", ND: "NORTH DAKOTA", OH: "OHIO", OK: "OKLAHOMA",
  OR: "OREGON", PA: "PENNSYLVANIA", RI: "RHODE ISLAND", SC: "SOUTH CAROLINA",
  SD: "SOUTH DAKOTA", TN: "TENNESSEE", TX: "TEXAS", UT: "UTAH", VT: "VERMONT",
  VA: "VIRGINIA", WA: "WASHINGTON", WV: "WEST VIRGINIA", WI: "WISCONSIN", WY: "WYOMING",
  DC: "DISTRICT OF COLUMBIA"
};

const zipCache = new Map();

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

function onlyDigits(value, limit) {
  return value.replace(/\D/g, "").slice(0, limit);
}

function normalizePlace(value) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9 ]/g, "").replace(/\s+/g, " ");
}

function normalizeState(value) {
  const cleaned = normalizePlace(value);
  if (cleaned.length === 2 && stateNames[cleaned]) return cleaned;
  const match = Object.entries(stateNames).find(([, name]) => name === cleaned);
  return match ? match[0] : cleaned;
}

function setAddressStatus(message, type = "") {
  addressStatus.textContent = message;
  addressStatus.className = `address-status wide${type ? ` ${type}` : ""}`;
}

function addressHasStreetShape(address) {
  return /\d/.test(address) && /[a-z]/i.test(address) && address.trim().length >= 6;
}

async function getZipInfo(zip) {
  if (zipCache.has(zip)) return zipCache.get(zip);
  const response = await fetch(`https://api.zippopotam.us/us/${zip}`);
  if (!response.ok) return null;
  const data = await response.json();
  zipCache.set(zip, data);
  return data;
}

async function validateAddress() {
  const address = checkoutForm.address.value.trim();
  const city = normalizePlace(checkoutForm.city.value);
  const state = normalizeState(checkoutForm.state.value);
  const zip = onlyDigits(checkoutForm.zip.value, 5);
  const phone = onlyDigits(checkoutForm.phone.value, 10);

  checkoutForm.phone.value = phone;
  checkoutForm.zip.value = zip;
  checkoutForm.state.value = state;

  if (phone.length !== 10) {
    setAddressStatus("Phone must be exactly 10 numbers.", "invalid");
    checkoutForm.phone.focus();
    return false;
  }
  if (!addressHasStreetShape(address)) {
    setAddressStatus("Address must include a street number and street name.", "invalid");
    checkoutForm.address.focus();
    return false;
  }
  if (zip.length !== 5) {
    setAddressStatus("ZIP must be exactly 5 numbers.", "invalid");
    checkoutForm.zip.focus();
    return false;
  }

  setAddressStatus("Checking ZIP, city, and state...", "checking");
  let zipInfo;
  try {
    zipInfo = await getZipInfo(zip);
  } catch (error) {
    setAddressStatus("Could not verify the address right now. Check your connection and try again.", "invalid");
    checkoutForm.zip.focus();
    return false;
  }

  if (!zipInfo || !Array.isArray(zipInfo.places)) {
    setAddressStatus("That ZIP code does not look real. Please edit it before checkout.", "invalid");
    checkoutForm.zip.focus();
    return false;
  }

  const validPlace = zipInfo.places.find((place) => {
    const apiCity = normalizePlace(place["place name"]);
    const apiState = normalizeState(place["state abbreviation"] || place.state);
    return apiCity === city && apiState === state;
  });

  if (!validPlace) {
    const suggestion = zipInfo.places[0];
    const suggestedCity = suggestion["place name"];
    const suggestedState = suggestion["state abbreviation"];
    setAddressStatus(`ZIP ${zip} matches ${suggestedCity}, ${suggestedState}. Please fix city/state before checkout.`, "invalid");
    checkoutForm.city.focus();
    return false;
  }

  setAddressStatus(`Address area verified: ${validPlace["place name"]}, ${validPlace["state abbreviation"]} ${zip}.`, "valid");
  return true;
}

function renderProducts() {
  const term = searchInput.value.trim().toLowerCase();
  productGrid.innerHTML = products.map((product) => {
    const haystack = [product.name, product.mood, product.description, ...product.notes].join(" ").toLowerCase();
    const moodMatch = state.activeMood === "all" || product.mood === state.activeMood;
    const searchMatch = !term || haystack.includes(term);
    const isKit = product.id === "bliss-box";
    return `
      <article class="product-card${moodMatch && searchMatch ? "" : " hidden"}" data-id="${product.id}">
        <div class="product-art" style="--accent:${product.color}">
          <div class="product-jar"><span>${product.name}</span></div>
        </div>
        <div class="product-body">
          <div class="product-meta"><span>${product.size}</span><span>${product.mood}</span></div>
          <h3>${product.name}</h3>
          <p>${product.description}</p>
          ${isKit ? `<p class="custom-note">Opens a preference form for likes, dislikes, allergies, and basket notes before adding to cart.</p>` : ""}
          <ul class="scent-list">${product.notes.map((note) => `<li>${note}</li>`).join("")}</ul>
          <div class="product-footer">
            <strong class="price">${money(product.price)}</strong>
            <button class="product-button" type="button" data-add="${product.id}">${isKit ? "Customize kit" : "Add to cart"}</button>
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
  return giftWrapPrices[giftWrapSelect.value] || 0;
}

function describeKit(config) {
  if (!config) return "";
  const lines = [];
  if (config.likes.length) lines.push(`Likes: ${config.likes.join(", ")}`);
  if (config.avoid.length) lines.push(`Avoid: ${config.avoid.join(", ")}`);
  if (config.allergies) lines.push(`Allergies: ${config.allergies}`);
  if (config.notes) lines.push(`Notes: ${config.notes}`);
  return lines.join(" | ");
}

function renderCart() {
  cartCount.textContent = cartQuantity();
  cartItems.innerHTML = state.cart.length ? "" : "<p>Your cart is empty. Add a candle and the magic starts.</p>";
  state.cart.forEach((item, index) => {
    const product = getProduct(item.id);
    const row = document.createElement("div");
    row.className = "cart-item";
    const kitDetails = describeKit(item.config);
    row.innerHTML = `
      <div><strong>${product.name}</strong><span>${money(product.price)} each</span>${kitDetails ? `<em>${kitDetails}</em>` : ""}</div>
      <div class="qty">
        <button type="button" data-dec="${index}" aria-label="Decrease ${product.name}">-</button>
        <strong>${item.qty}</strong>
        <button type="button" data-inc="${index}" aria-label="Increase ${product.name}">+</button>
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
    <div><span>${giftWrapNames[giftWrapSelect.value] || "Gift wrap"}</span><span>${money(giftWrap)}</span></div>
    <div><span>Estimated tax</span><span>${money(tax)}</span></div>
    <div><strong>Total</strong><strong>${money(total)}</strong></div>
  `;
  saveCart();
}

function addToCart(id) {
  if (id === "bliss-box") {
    openKitModal();
    return;
  }
  const existing = state.cart.find((item) => item.id === id);
  if (existing) existing.qty += 1;
  else state.cart.push({ id, qty: 1 });
  renderCart();
  showToast(`${getProduct(id).name} added to cart`);
}

function addCustomKit(config) {
  state.cart.push({ id: "bliss-box", qty: 1, config });
  renderCart();
  closeKitModal();
  showToast("Customized Discovery Box added");
}

function changeQuantity(index, delta) {
  const item = state.cart[index];
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) state.cart.splice(index, 1);
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

function openKitModal() {
  kitModal.classList.add("open");
  kitModal.setAttribute("aria-hidden", "false");
}

function closeKitModal() {
  kitModal.classList.remove("open");
  kitModal.setAttribute("aria-hidden", "true");
  kitForm.reset();
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

async function placeOrder(event) {
  event.preventDefault();
  if (!state.cart.length) {
    showToast("Add at least one item before checkout");
    openCart();
    return;
  }
  const addressOk = await validateAddress();
  if (!addressOk) return;
  const data = new FormData(checkoutForm);
  const orderId = `POB-${Math.floor(100000 + Math.random() * 900000)}`;
  const name = data.get("firstName");
  const wrap = giftWrapNames[giftWrapSelect.value] || "No gift wrap";
  const basketPrefs = data.get("basketPrefs") ? ` Basket preferences saved: ${data.get("basketPrefs")}` : "";
  orderMessage.textContent = `${name}, your demo order ${orderId} is confirmed with ${wrap}.${basketPrefs} A real shop would send payment and fulfillment details here.`;
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
giftWrapSelect.addEventListener("change", renderCart);
checkoutForm.phone.addEventListener("input", () => {
  checkoutForm.phone.value = onlyDigits(checkoutForm.phone.value, 10);
});
checkoutForm.zip.addEventListener("input", () => {
  checkoutForm.zip.value = onlyDigits(checkoutForm.zip.value, 5);
});
checkoutForm.state.addEventListener("input", () => {
  checkoutForm.state.value = checkoutForm.state.value.replace(/[^a-z]/gi, "").slice(0, 2).toUpperCase();
});
checkoutForm.zip.addEventListener("blur", async () => {
  const zip = onlyDigits(checkoutForm.zip.value, 5);
  if (zip.length !== 5) return;
  try {
    const zipInfo = await getZipInfo(zip);
    if (zipInfo?.places?.length) {
      const place = zipInfo.places[0];
      const typedCity = normalizePlace(checkoutForm.city.value);
      const typedState = normalizeState(checkoutForm.state.value);
      const foundCity = normalizePlace(place["place name"]);
      const foundState = normalizeState(place["state abbreviation"]);
      if (!checkoutForm.city.value.trim()) checkoutForm.city.value = place["place name"];
      if (!checkoutForm.state.value.trim()) checkoutForm.state.value = place["state abbreviation"];
      if ((typedCity && typedCity !== foundCity) || (typedState && typedState !== foundState)) {
        setAddressStatus(`ZIP ${zip} belongs to ${place["place name"]}, ${place["state abbreviation"]}. Please fix city/state before checkout.`, "invalid");
      } else {
        setAddressStatus(`ZIP ${zip} found: ${place["place name"]}, ${place["state abbreviation"]}.`, "valid");
      }
    } else {
      setAddressStatus("That ZIP code does not look real.", "invalid");
    }
  } catch (error) {
    setAddressStatus("ZIP lookup is unavailable right now.", "invalid");
  }
});
checkoutForm.addEventListener("submit", placeOrder);
kitForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(kitForm);
  addCustomKit({
    likes: data.getAll("likes"),
    avoid: data.getAll("avoid"),
    allergies: data.get("allergies").trim(),
    notes: data.get("notes").trim()
  });
});
document.getElementById("closeKitModal").addEventListener("click", closeKitModal);
kitModal.addEventListener("click", (event) => {
  if (event.target === kitModal) closeKitModal();
});
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
