const specialsGrid = document.getElementById("specialsGrid");
const catalogGrid = document.getElementById("catalogGrid");
const featuredPreview = document.getElementById("featuredPreview");
const template = document.getElementById("productCardTemplate");
const syncBadge = document.getElementById("syncBadge");
const categoryPills = document.getElementById("categoryPills");
const pricePills = document.getElementById("pricePills");
const searchInput = document.getElementById("searchInput");
const resetFiltersButton = document.getElementById("resetFilters");

let allProducts = [];
let activeCategory = "all";
let activePrice = "all";
let activeKeyword = "";

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
}

searchInput.addEventListener("input", () => {
  activeKeyword = searchInput.value.trim().toLowerCase();
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
  activeCategory = "all";
  activePrice = "all";
  activeKeyword = "";
  searchInput.value = "";
  updateActivePill(categoryPills, "data-category", activeCategory);
  updateActivePill(pricePills, "data-price", activePrice);
  renderFilteredCatalog();
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
    const categoryMatch = activeCategory === "all" || product.category === activeCategory;
    const priceMatch = matchPriceRange(parsePriceValue(product.price), activePrice);
    const keywordMatch =
      !activeKeyword ||
      product.name.toLowerCase().includes(activeKeyword) ||
      product.category.toLowerCase().includes(activeKeyword) ||
      product.tag.toLowerCase().includes(activeKeyword) ||
      product.description.toLowerCase().includes(activeKeyword);

    return categoryMatch && priceMatch && keywordMatch;
  });

  renderGrid(
    catalogGrid,
    template,
    filteredProducts,
    "\u5F53\u524D\u7B5B\u9009\u6761\u4EF6\u4E0B\u6682\u65F6\u6CA1\u6709\u5546\u54C1\u3002"
  );
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
