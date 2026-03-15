const STORAGE_KEY = "valerius-products";

const sampleProducts = [
  {
    id: crypto.randomUUID(),
    name: "Prada Re-Edition Mini Bag",
    price: "¥6,899",
    originalPrice: "¥8,300",
    category: "手袋",
    tag: "爆款",
    description: "黑色尼龙配皮饰边，适合日常搭配。现货一只，可当天确认。",
    featured: true,
    inStock: true,
    image: createPlaceholderImage("Valerius", "Prada Re-Edition"),
  },
  {
    id: crypto.randomUUID(),
    name: "Golden Goose Super-Star",
    price: "¥2,580",
    originalPrice: "¥3,150",
    category: "鞋履",
    tag: "限时",
    description: "经典做旧小脏鞋，36-39 可预订，适合做今日特价推荐。",
    featured: true,
    inStock: true,
    image: createPlaceholderImage("Valerius", "Golden Goose"),
  },
  {
    id: crypto.randomUUID(),
    name: "Cartier Love Bracelet",
    price: "¥31,200",
    originalPrice: "",
    category: "首饰",
    tag: "新到",
    description: "玫瑰金经典款，支持代找尺码，适合高客单 VIP 展示。",
    featured: false,
    inStock: false,
    image: createPlaceholderImage("Valerius", "Cartier Love"),
  },
];

const productForm = document.getElementById("productForm");
const specialsGrid = document.getElementById("specialsGrid");
const catalogGrid = document.getElementById("catalogGrid");
const featuredPreview = document.getElementById("featuredPreview");
const template = document.getElementById("productCardTemplate");
const resetButton = document.getElementById("resetProducts");

let products = loadProducts();

renderProducts();

productForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(productForm);
  const imageFile = formData.get("image");
  const image = imageFile && imageFile.size > 0 ? await fileToDataUrl(imageFile) : fallbackImage();

  const product = {
    id: crypto.randomUUID(),
    name: formData.get("name").toString().trim(),
    price: formData.get("price").toString().trim(),
    originalPrice: formData.get("originalPrice").toString().trim(),
    category: formData.get("category").toString().trim() || "精选",
    tag: formData.get("tag").toString().trim() || "推荐",
    description: formData.get("description").toString().trim(),
    featured: formData.get("featured") === "on",
    inStock: formData.get("inStock") === "on",
    image,
  };

  products = [product, ...products];
  saveProducts(products);
  renderProducts();
  productForm.reset();
});

resetButton.addEventListener("click", () => {
  products = [...sampleProducts];
  saveProducts(products);
  renderProducts();
});

function loadProducts() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleProducts));
    return [...sampleProducts];
  }

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...sampleProducts];
  } catch {
    return [...sampleProducts];
  }
}

function saveProducts(nextProducts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProducts));
}

function renderProducts() {
  const featuredProducts = products.filter((product) => product.featured);
  renderGrid(specialsGrid, featuredProducts, "你还没有设置今日特价，先在下方录入一件商品试试看。");
  renderGrid(catalogGrid, products, "暂时还没有商品。");
  renderFeaturedPreview(featuredProducts[0] || products[0]);
}

function renderGrid(container, items, emptyText) {
  container.innerHTML = "";

  if (items.length === 0) {
    container.innerHTML = `<div class="empty-state">${emptyText}</div>`;
    return;
  }

  items.forEach((product) => {
    const card = template.content.firstElementChild.cloneNode(true);
    const image = card.querySelector("img");

    image.src = product.image;
    image.alt = product.name;
    card.querySelector(".category-pill").textContent = product.category;
    card.querySelector(".tag-pill").textContent = product.tag;
    card.querySelector(".product-name").textContent = product.name;
    card.querySelector(".product-description").textContent = product.description;
    card.querySelector(".price-current").textContent = product.price;

    const originalPriceEl = card.querySelector(".price-original");
    originalPriceEl.textContent = product.originalPrice;
    originalPriceEl.style.display = product.originalPrice ? "inline" : "none";

    card.querySelector(".status-pill").textContent = product.inStock ? "在售中" : "可代找 / 需确认";
    container.appendChild(card);
  });
}

function renderFeaturedPreview(product) {
  if (!product) {
    featuredPreview.innerHTML = `<div class="empty-state">先录入一件商品，这里会显示你的主推商品。</div>`;
    return;
  }

  featuredPreview.innerHTML = `
    <div class="featured-preview-card">
      <img src="${product.image}" alt="${product.name}">
      <div>
        <p class="eyebrow">${product.category}</p>
        <h3>${product.name}</h3>
        <p class="hero-text">${product.description}</p>
        <div class="price-row">
          <span class="price-current">${product.price}</span>
          ${product.originalPrice ? `<span class="price-original">${product.originalPrice}</span>` : ""}
        </div>
      </div>
    </div>
  `;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function fallbackImage() {
  return createPlaceholderImage("Valerius", "New Product");
}

function createPlaceholderImage(brand, title) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1125">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f3e1cf" />
          <stop offset="100%" stop-color="#d7b799" />
        </linearGradient>
      </defs>
      <rect width="900" height="1125" fill="url(#g)" />
      <circle cx="715" cy="215" r="120" fill="rgba(255,255,255,0.28)" />
      <circle cx="175" cy="930" r="170" fill="rgba(84,51,30,0.08)" />
      <text x="90" y="170" fill="#6b4d36" font-size="46" font-family="Segoe UI, Arial, sans-serif" letter-spacing="10">${brand}</text>
      <text x="90" y="870" fill="#2d241e" font-size="72" font-family="Georgia, serif">${title}</text>
      <text x="90" y="940" fill="#6e6258" font-size="28" font-family="Segoe UI, Arial, sans-serif">VIP Daily Special</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
