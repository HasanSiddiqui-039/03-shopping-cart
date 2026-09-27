// =======================================================
// FRESH MART - SHOPPING CART
// Concepts: rendering from data, find / filter / reduce,
// quantity logic, calculations, localStorage,
// event delegation, setTimeout (toast), classList
// =======================================================


// ===== STEP 1: PRODUCT DATA (array of objects) =====
// In a real shop this would come from a server/API.
const products = [
  { id: 1, name: "Apples", unit: "1 kg", price: 350, emoji: "🍎", category: "fruits" },
  { id: 2, name: "Bananas", unit: "1 dozen", price: 180, emoji: "🍌", category: "fruits" },
  { id: 3, name: "Mangoes", unit: "1 kg", price: 400, emoji: "🥭", category: "fruits" },
  { id: 4, name: "Grapes", unit: "500 g", price: 500, emoji: "🍇", category: "fruits" },
  { id: 5, name: "Tomatoes", unit: "1 kg", price: 160, emoji: "🍅", category: "vegetables" },
  { id: 6, name: "Carrots", unit: "1 kg", price: 120, emoji: "🥕", category: "vegetables" },
  { id: 7, name: "Potatoes", unit: "1 kg", price: 100, emoji: "🥔", category: "vegetables" },
  { id: 8, name: "Broccoli", unit: "1 piece", price: 450, emoji: "🥦", category: "vegetables" },
  { id: 9, name: "Milk", unit: "1 litre", price: 230, emoji: "🥛", category: "dairy" },
  { id: 10, name: "Bread", unit: "1 loaf", price: 170, emoji: "🍞", category: "dairy" },
  { id: 11, name: "Eggs", unit: "1 dozen", price: 380, emoji: "🥚", category: "dairy" },
  { id: 12, name: "Cheese", unit: "200 g", price: 900, emoji: "🧀", category: "dairy" },
];

const MAX_QTY = 10;              // max of one item per order
const DELIVERY_FEE = 150;        // normal delivery charge
const FREE_DELIVERY_FROM = 2000; // free delivery above this subtotal
const STORAGE_KEY = "fresh-mart-cart";


// ===== STEP 2: SELECT ELEMENTS =====
const productGrid = document.getElementById("product-grid");
const categoryButtons = document.querySelectorAll(".category-btn");

const cartItemsEl = document.getElementById("cart-items");
const cartEmpty = document.getElementById("cart-empty");
const cartSummary = document.getElementById("cart-summary");
const cartCount = document.getElementById("cart-count");
const subtotalEl = document.getElementById("subtotal");
const deliveryEl = document.getElementById("delivery");
const deliveryNote = document.getElementById("delivery-note");
const totalEl = document.getElementById("total");
const checkoutBtn = document.getElementById("checkout-btn");
const clearCartBtn = document.getElementById("clear-cart-btn");
const toast = document.getElementById("toast");


// ===== STEP 3: STATE =====
// The cart only stores id + quantity: [{ id: 1, qty: 2 }, { id: 5, qty: 1 }]
// Name, price and emoji are looked up from the products array.
let cart = loadCart();
let currentCategory = "all";
let toastTimer = null;


// ===== STEP 4: LOCALSTORAGE =====
function loadCart() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
}

function saveCart() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}


// ===== STEP 5: HELPERS =====
function formatMoney(amount) {
  return "Rs " + amount.toLocaleString("en-PK");
}

function getProduct(id) {
  return products.find((p) => p.id === id);
}

// Show a small message at the bottom for 2.5 seconds
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer); // if a toast is already showing, restart the timer
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}


// ===== STEP 6: SHOW PRODUCTS =====
function renderProducts() {
  const visible =
    currentCategory === "all"
      ? products
      : products.filter((p) => p.category === currentCategory);

  // map() turns each product into an HTML string, join("") glues them together
  productGrid.innerHTML = visible
    .map(
      (p) => `
      <article class="product-card">
        <div class="product-emoji" aria-hidden="true">${p.emoji}</div>
        <h3>${p.name}</h3>
        <p class="product-unit">${p.unit}</p>
        <div class="product-bottom">
          <span class="product-price">${formatMoney(p.price)}</span>
          <button class="add-btn" data-id="${p.id}">Add</button>
        </div>
      </article>
    `
    )
    .join("");
}


// ===== STEP 7: CART ACTIONS =====
function addToCart(id) {
  const product = getProduct(id);
  const existing = cart.find((item) => item.id === id);

  if (existing) {
    if (existing.qty >= MAX_QTY) {
      showToast(`You can order up to ${MAX_QTY} of ${product.name}.`);
      return;
    }
    existing.qty++; // already in cart: increase quantity
  } else {
    cart.push({ id, qty: 1 }); // new item
  }

  saveCart();
  renderCart();
  bumpCartCount();
  showToast(`${product.emoji} ${product.name} added to cart`);
}

function changeQty(id, change) {
  const item = cart.find((i) => i.id === id);
  if (!item) return;

  item.qty += change; // change is +1 or -1

  if (item.qty <= 0) {
    removeFromCart(id);
    return;
  }
  if (item.qty > MAX_QTY) item.qty = MAX_QTY;

  saveCart();
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter((item) => item.id !== id);
  saveCart();
  renderCart();
}

function clearCart() {
  if (!confirm("Remove all items from your cart?")) return;
  cart = [];
  saveCart();
  renderCart();
}

function checkout() {
  const { total } = calculateTotals(); // destructuring
  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);

  showToast(`Order placed: ${itemCount} items, ${formatMoney(total)}. Thank you!`);
  cart = [];
  saveCart();
  renderCart();
}

// Little animation on the header counter
function bumpCartCount() {
  cartCount.classList.remove("bump");
  void cartCount.offsetWidth; // trick to restart a CSS animation
  cartCount.classList.add("bump");
}


// ===== STEP 8: CALCULATIONS =====
function calculateTotals() {
  const subtotal = cart.reduce((sum, item) => {
    const product = getProduct(item.id);
    return sum + product.price * item.qty;
  }, 0);

  const delivery = subtotal === 0 || subtotal >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;
  const total = subtotal + delivery;

  return { subtotal, delivery, total }; // return several values as an object
}


// ===== STEP 9: SHOW THE CART =====
function renderCart() {
  cartItemsEl.innerHTML = "";

  cart.forEach((item) => {
    const product = getProduct(item.id);
    const li = document.createElement("li");
    li.className = "cart-item";

    li.innerHTML = `
      <span class="cart-item-emoji" aria-hidden="true">${product.emoji}</span>
      <div>
        <p class="cart-item-name">${product.name}</p>
        <p class="cart-item-price">${formatMoney(product.price)} each</p>
        <div class="qty-controls">
          <button class="qty-btn" data-action="decrease" data-id="${item.id}" aria-label="Decrease ${product.name}">−</button>
          <span class="qty-value">${item.qty}</span>
          <button class="qty-btn" data-action="increase" data-id="${item.id}" aria-label="Increase ${product.name}"
            ${item.qty >= MAX_QTY ? "disabled" : ""}>+</button>
        </div>
      </div>
      <div class="cart-item-right">
        <span class="cart-item-total">${formatMoney(product.price * item.qty)}</span>
        <button class="remove-btn" data-action="remove" data-id="${item.id}">Remove</button>
      </div>
    `;

    cartItemsEl.appendChild(li);
  });

  // Totals
  const { subtotal, delivery, total } = calculateTotals();
  subtotalEl.textContent = formatMoney(subtotal);
  deliveryEl.textContent = delivery === 0 ? "Free" : formatMoney(delivery);
  totalEl.textContent = formatMoney(total);

  // "Add Rs X more for free delivery"
  if (subtotal > 0 && subtotal < FREE_DELIVERY_FROM) {
    deliveryNote.textContent = `Add ${formatMoney(FREE_DELIVERY_FROM - subtotal)} more for free delivery.`;
  } else if (subtotal >= FREE_DELIVERY_FROM) {
    deliveryNote.textContent = "You get free delivery!";
  } else {
    deliveryNote.textContent = "";
  }

  // Header counter = total number of items
  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);
  cartCount.textContent = itemCount;

  // Show / hide empty message and summary
  const isEmpty = cart.length === 0;
  cartEmpty.style.display = isEmpty ? "block" : "none";
  cartSummary.style.display = isEmpty ? "none" : "block";
}


// ===== STEP 10: EVENTS =====

// Add buttons (delegation on the grid)
productGrid.addEventListener("click", (event) => {
  if (event.target.classList.contains("add-btn")) {
    addToCart(Number(event.target.dataset.id));
  }
});

// + / − / Remove buttons (delegation on the cart list)
cartItemsEl.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const id = Number(button.dataset.id);

  switch (button.dataset.action) {
    case "increase":
      changeQty(id, 1);
      break;
    case "decrease":
      changeQty(id, -1);
      break;
    case "remove":
      removeFromCart(id);
      break;
  }
});

// Category filter
categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    categoryButtons.forEach((b) => b.classList.remove("active"));
    button.classList.add("active");
    currentCategory = button.dataset.category;
    renderProducts();
  });
});

checkoutBtn.addEventListener("click", checkout);
clearCartBtn.addEventListener("click", clearCart);


// ===== STEP 11: START =====
renderProducts();
renderCart();
