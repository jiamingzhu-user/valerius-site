const specialsGrid = document.getElementById("specialsGrid");
const catalogGrid = document.getElementById("catalogGrid");
const featuredPreview = document.getElementById("featuredPreview");
const template = document.getElementById("productCardTemplate");
const syncBadge = document.getElementById("syncBadge");
const categoryFilter = document.getElementById("categoryFilter");
const priceFilter = document.getElementById("priceFilter");
const resetFiltersButton = document.getElementById("resetFilters");

let allProducts = [];

initStorefront().catch((error) => {
  console.error(error);
  syncBadge.textContent = "\u52A0\u8F7D\u5931\u8D25";
});

async function initStorefront() {
  syncBadge.textContent = supabaseClient ? "\u5DF2\u8FDE\u63A5\u4E91\u7AEF" : "\u672C\u5730\u6F14\u793A\u6A21\u5F0F";

  allProducts = await loadProducts();
  const featuredProducts = allProducts.filter((product) => product.featured);

  renderGrid(specialsGrid, template, featuredProducts, "\u8FD8\u6CA1\u6709\u8BBE\u7F6E\u201C\u4ECA\u65E5\u7279\u4EF7\u201D\u5546\u54C1\u3002");
  renderFeaturedPreview(featuredPreview, featuredProducts[0] || allProducts[0]);
  populateCategoryFilter(allProducts);
  renderFilteredCatalog();
}

categoryFilter.addEventListener("change", renderFilteredCatalog);
priceFilter.addEventListener("change", renderFilteredCatalog);
resetFiltersButton.addEventListener("click", () => {
  categoryFilter.value = "all";
  priceFilter.value = "all";
  renderFilteredCatalog();
});

function populateCategoryFilter(products) {
  const categories = getUniqueCategories(products);
  const currentValue = categoryFilter.value;

  categoryFilter.innerHTML = '<option value="all">\u5168\u90E8\u5206\u7C7B</option>';

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });

  if (categories.includes(currentValue)) {
    categoryFilter.value = currentValue;
  }
}

function renderFilteredCatalog() {
  const selectedCategory = categoryFilter.value;
  const selectedPrice = priceFilter.value;

  const filteredProducts = allProducts.filter((product) => {
    const categoryMatch = selectedCategory === "all" || product.category === selectedCategory;
    const priceMatch = matchPriceRange(parsePriceValue(product.price), selectedPrice);
    return categoryMatch && priceMatch;
  });

  renderGrid(
    catalogGrid,
    template,
    filteredProducts,
    "\u5F53\u524D\u7B5B\u9009\u6761\u4EF6\u4E0B\u6682\u65F6\u6CA1\u6709\u5546\u54C1\u3002"
  );
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
