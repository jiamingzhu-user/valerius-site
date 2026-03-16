const specialsGrid = document.getElementById("specialsGrid");
const catalogGrid = document.getElementById("catalogGrid");
const featuredPreview = document.getElementById("featuredPreview");
const template = document.getElementById("productCardTemplate");
const syncBadge = document.getElementById("syncBadge");
const cartButton = document.getElementById("cartButton");
const cartCount = document.getElementById("cartCount");
const quickPills = document.getElementById("quickPills");
const categoryPills = document.getElementById("categoryPills");
const pricePills = document.getElementById("pricePills");
const searchInput = document.getElementById("searchInput");
const resetFiltersButton = document.getElementById("resetFilters");
const productModal = document.getElementById("productModal");
const closeModalButton = document.getElementById("closeModal");
const modalCloseGhost = document.getElementById("modalCloseGhost");
const modalAddCart = document.getElementById("modalAddCart");
const cartDrawer = document.getElementById("cartDrawer");
const closeCartButton = document.getElementById("closeCart");
const cartItems = document.getElementById("cartItems");
const cartSummaryCount = document.getElementById("cartSummaryCount");
const cartSummaryTotal = document.getElementById("cartSummaryTotal");
const clearCartButton = document.getElementById("clearCart");

const CART_STORAGE_KEY = "valerius-cart";

let allProducts = [];
let activeQuick = "all";
let activeCategory = "all";
let activePrice = "all";
let activeKeyword = "";
let currentModalProductId = null;
let cart = loadCart();

initStorefront().catch((error) => {
  console.error(error);
  syncBadge.textContent = "\u52A0\u8F7D\u5931\u8D25";
});

async function initStorefront() {
  syncBadge.textContent = "\u6BCF\u65E5\u7CBE\u9009\u66F4\u65B0";

  allProducts = await loadProducts();
  const featuredProducts = allProducts.filter((product) => product.featured);

  renderGrid(specialsGrid, template, featuredProducts, "\u8FD8\u6CA1\u6709\u8BBE\u7F6E\u201C\u4ECA\u65E5\u7279\u4EF7\u201D\u5546\u54C1\u3002");
  renderFeaturedPreview(featuredPreview, featuredProducts[0] || allProducts[0]);
  populateCategoryPills(allProducts);
  renderFilteredCatalog();
  renderCart();
}

searchInput.addEventListener("input", () => {
  activeKeyword = searchInput.value.trim().toLowerCase();
  renderFilteredCatalog();
});

quickPills.addEventListener("click", (event) => {
  const button = event.target.closest("[data-quick]");
  if (!button) {
    return;
  }

  activeQuick = button.dataset.quick;
  updateActivePill(quickPills, "data-quick", activeQuick);
  renderFilteredCatalog();
});

categoryPills.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) {
    return;
  }

  activeCategory = button.dataset.category;
  updateActivePill(categoryPills, "data-category", activeCategory);
  renderFilteredCatalog();
});

pricePills.addEventListener("click", (event) => {
  const button = event.target.closest("[data-price]");
  if (!button) {
    return;
  }

  activePrice = button.dataset.price;
  updateActivePill(pricePills, "data-price", activePrice);
  renderFilteredCatalog();
});

resetFiltersButton.addEventListener("click", () => {
  activeQuick = "all";
  activeCategory = "all";
  activePrice = "all";
  activeKeyword = "";
  searchInput.value = "";
  updateActivePill(quickPills, "data-quick", activeQuick);
  updateActivePill(categoryPills, "data-category", activeCategory);
  updateActivePill(pricePills, "data-price", activePrice);
  renderFilteredCatalog();
});

catalogGrid.addEventListener("click", handleCardOpen);
specialsGrid.addEventListener("click", handleCardOpen);
catalogGrid.addEventListener("keydown", handleCardOpenWithKeyboard);
specialsGrid.addEventListener("keydown", handleCardOpenWithKeyboard);
cartButton.addEventListener("click", openCartDrawer);

productModal.addEventListener("click", (event) => {
  if (event.target.dataset.close === "modal") {
    closeProductModal();
  }
});

closeModalButton.addEventListener("click", closeProductModal);
modalCloseGhost.addEventListener("click", closeProductModal);
modalAddCart.addEventListener("click", () => {
  if (currentModalProductId) {
    addToCart(currentModalProductId);
  }
});

cartDrawer.addEventListener("click", (event) => {
  if (event.target.dataset.close === "cart") {
    closeCartDrawer();
  }
});

closeCartButton.addEventListener("click", closeCartDrawer);
clearCartButton.addEventListener("click", clearCart);
cartItems.addEventListener("click", handleCartActions);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !productModal.hidden) {
    closeProductModal();
  }
  if (event.key === "Escape" && !cartDrawer.hidden) {
    closeCartDrawer();
  }
});

function populateCategoryPills(products) {
  const categories = getUniqueCategories(products);
  categoryPills.innerHTML = '<button type="button" class="pill-btn is-active" data-category="all">\u5168\u90E8</button>';

  categories.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "pill-btn";
    button.dataset.category = category;
    button.textContent = category;
    categoryPills.appendChild(button);
  });
}

function renderFilteredCatalog() {
  const filteredProducts = allProducts.filter((product) => {
    const quickMatch = matchQuickFilter(product, activeQuick);
    const categoryMatch = activeCategory === "all" || product.category === activeCategory;
    const priceMatch = matchPriceRange(parsePriceValue(product.price), activePrice);
    const keywordMatch =
      !activeKeyword ||
      product.name.toLowerCase().includes(activeKeyword) ||
      product.category.toLowerCase().includes(activeKeyword) ||
      product.tag.toLowerCase().includes(activeKeyword) ||
      product.description.toLowerCase().includes(activeKeyword);

    return quickMatch && categoryMatch && priceMatch && keywordMatch;
  });

  renderGrid(
    catalogGrid,
    template,
    filteredProducts,
    "\u5F53\u524D\u7B5B\u9009\u6761\u4EF6\u4E0B\u6682\u65F6\u6CA1\u6709\u5546\u54C1\u3002"
  );
}

function handleCardOpen(event) {
  const addCartButton = event.target.closest(".add-cart-btn");
  if (addCartButton) {
    event.stopPropagation();
    addToCart(addCartButton.dataset.productId);
    return;
  }

  const card = event.target.closest(".product-card");
  if (!card) {
    return;
  }

  openProductModal(card.dataset.productId);
}

function handleCardOpenWithKeyboard(event) {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  const card = event.target.closest(".product-card");
  if (!card) {
    return;
  }

  event.preventDefault();
  openProductModal(card.dataset.productId);
}

function openProductModal(productId) {
  const product = allProducts.find((item) => item.id === productId);
  if (!product) {
    return;
  }

  currentModalProductId = product.id;

  document.getElementById("modalImage").src = product.image;
  document.getElementById("modalImage").alt = product.name;
  document.getElementById("modalCategory").textContent = product.category;
  document.getElementById("modalTag").textContent = product.tag;
  document.getElementById("modalTitle").textContent = product.name;
  document.getElementById("modalDescription").textContent = product.description;
  document.getElementById("modalPrice").textContent = product.price;
  document.getElementById("modalStock").textContent = product.inStock ? "\u5728\u552E\u4E2D" : "\u53EF\u4EE3\u627E / \u9700\u786E\u8BA4";

  const originalPrice = document.getElementById("modalOriginalPrice");
  originalPrice.textContent = product.originalPrice;
  originalPrice.style.display = product.originalPrice ? "inline" : "none";

  productModal.hidden = false;
  document.body.classList.add("modal-open");
}

function closeProductModal() {
  productModal.hidden = true;
  document.body.classList.remove("modal-open");
}

function openCartDrawer() {
  cartDrawer.hidden = false;
  document.body.classList.add("modal-open");
}

function closeCartDrawer() {
  cartDrawer.hidden = true;
  if (productModal.hidden) {
    document.body.classList.remove("modal-open");
  }
}

function addToCart(productId) {
  const existing = cart.find((item) => item.productId === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ productId, quantity: 1 });
  }

  saveCart();
  renderCart();
  openCartDrawer();
}

function handleCartActions(event) {
  const actionButton = event.target.closest("[data-cart-action]");
  if (!actionButton) {
    return;
  }

  const productId = actionButton.dataset.productId;
  const item = cart.find((entry) => entry.productId === productId);
  if (!item) {
    return;
  }

  const action = actionButton.dataset.cartAction;
  if (action === "increase") {
    item.quantity += 1;
  }
  if (action === "decrease") {
    item.quantity -= 1;
    if (item.quantity <= 0) {
      cart = cart.filter((entry) => entry.productId !== productId);
    }
  }
  if (action === "remove") {
    cart = cart.filter((entry) => entry.productId !== productId);
  }

  saveCart();
  renderCart();
}

function clearCart() {
  cart = [];
  saveCart();
  renderCart();
}

function renderCart() {
  const detailedItems = cart
    .map((entry) => {
      const product = allProducts.find((item) => item.id === entry.productId);
      return product ? { ...product, quantity: entry.quantity } : null;
    })
    .filter(Boolean);

  const totalCount = detailedItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = detailedItems.reduce((sum, item) => {
    const price = parsePriceValue(item.price);
    return price === null ? sum : sum + price * item.quantity;
  }, 0);

  cartCount.textContent = String(totalCount);
  cartSummaryCount.textContent = String(totalCount);
  cartSummaryTotal.textContent = totalPrice > 0 ? `USD ${totalPrice.toLocaleString()}` : "--";

  if (detailedItems.length === 0) {
    cartItems.innerHTML = '<div class="empty-state">\u8D2D\u7269\u8F66\u8FD8\u662F\u7A7A\u7684\uFF0C\u53EF\u4EE5\u5148\u628A\u611F\u5174\u8DA3\u7684\u5546\u54C1\u52A0\u8FDB\u6765\u3002</div>';
    return;
  }

  cartItems.innerHTML = detailedItems.map((item) => `
    <article class="cart-item">
      <img src="${item.image}" alt="${item.name}">
      <div class="cart-item-body">
        <div class="cart-item-top">
          <strong>${item.name}</strong>
          <button type="button" class="cart-link-btn" data-cart-action="remove" data-product-id="${item.id}">\u79FB\u9664</button>
        </div>
        <p class="helper-text">${item.category} / ${item.tag}</p>
        <div class="cart-item-bottom">
          <span class="price-current">${item.price}</span>
          <div class="cart-stepper">
            <button type="button" class="stepper-btn" data-cart-action="decrease" data-product-id="${item.id}">-</button>
            <span>${item.quantity}</span>
            <button type="button" class="stepper-btn" data-cart-action="increase" data-product-id="${item.id}">+</button>
          </div>
        </div>
      </div>
    </article>
  `).join("");
}

function loadCart() {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCart() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function matchQuickFilter(product, quick) {
  const normalizedTag = (product.tag || "").toLowerCase();

  if (quick === "all") {
    return true;
  }
  if (quick === "in-stock") {
    return Boolean(product.inStock);
  }
  if (quick === "featured") {
    return Boolean(product.featured);
  }
  if (quick === "new") {
    return normalizedTag.includes("\u65b0") || normalizedTag.includes("new");
  }
  if (quick === "hot") {
    return normalizedTag.includes("\u7206") || normalizedTag.includes("hot") || normalizedTag.includes("best");
  }

  return true;
}

function updateActivePill(container, attributeName, activeValue) {
  container.querySelectorAll(".pill-btn").forEach((button) => {
    button.classList.toggle("is-active", button.getAttribute(attributeName) === activeValue);
  });
}

function matchPriceRange(priceValue, range) {
  if (range === "all" || priceValue === null) {
    return true;
  }

  if (range === "0-500") {
    return priceValue >= 0 && priceValue < 500;
  }

  if (range === "500-1000") {
    return priceValue >= 500 && priceValue < 1000;
  }

  if (range === "1000-3000") {
    return priceValue >= 1000 && priceValue < 3000;
  }

  if (range === "3000+") {
    return priceValue >= 3000;
  }

  return true;
}
