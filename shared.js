const STORAGE_KEY = "valerius-products";

const sampleProducts = [
  {
    id: crypto.randomUUID(),
    name: "Prada Re-Edition Mini Bag",
    price: "USD 899",
    originalPrice: "USD 1,050",
    category: "\u624b\u888b",
    tag: "\u7206\u6b3e",
    description: "\u9ed1\u8272\u5c3c\u9f99\u914d\u76ae\u8fb9\u8ff7\u4f60\u624b\u888b\uff0c\u5f53\u5929\u53ef\u786e\u8ba4\u73b0\u8d27\u3002",
    featured: true,
    inStock: true,
    image: createPlaceholderImage("Valerius", "Prada Re-Edition"),
  },
  {
    id: crypto.randomUUID(),
    name: "Golden Goose Super-Star",
    price: "USD 336",
    originalPrice: "USD 410",
    category: "\u978b\u5c65",
    tag: "\u9650\u65f6",
    description: "\u7ecf\u5178\u505a\u65e7\u5c0f\u810f\u978b\uff0c\u5f88\u9002\u5408\u505a\u4eca\u65e5\u7279\u4ef7\u4e3b\u63a8\u3002",
    featured: true,
    inStock: true,
    image: createPlaceholderImage("Valerius", "Golden Goose"),
  },
  {
    id: crypto.randomUUID(),
    name: "Cartier Love Bracelet",
    price: "USD 4,120",
    originalPrice: "",
    category: "\u9996\u9970",
    tag: "\u65b0\u5230",
    description: "\u7c89\u91d1\u8272\u7ecf\u5178\u624b\u73af\uff0c\u9002\u5408\u9ad8\u5ba2\u5355 VIP \u5ba2\u6237\u3002",
    featured: false,
    inStock: false,
    image: createPlaceholderImage("Valerius", "Cartier Love"),
  },
];

const config = window.VALERIUS_CONFIG || {};
const hasSupabaseConfig = Boolean(config.supabaseUrl && config.supabaseAnonKey);
const supabaseClient = hasSupabaseConfig && window.supabase
  ? window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey)
  : null;

function mapRemoteProduct(row) {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    originalPrice: row.original_price || "",
    category: row.category || "\u7CBE\u9009",
    tag: row.tag || "\u63A8\u8350",
    description: row.description,
    featured: Boolean(row.featured),
    inStock: Boolean(row.in_stock),
    image: row.image_url || fallbackImage(),
  };
}

async function loadProducts() {
  if (!supabaseClient) {
    return loadProductsFromLocal();
  }

  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return loadProductsFromLocal();
  }

  return data.map(mapRemoteProduct);
}

function loadProductsFromLocal() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    saveProductsToLocal(sampleProducts);
    return [...sampleProducts];
  }

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...sampleProducts];
  } catch {
    return [...sampleProducts];
  }
}

function saveProductsToLocal(nextProducts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProducts));
}

function renderGrid(container, template, items, emptyText, options = {}) {
  const includeOrderLink = options.includeOrderLink !== false;
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

    card.querySelector(".status-pill").textContent = product.inStock ? "\u5728\u552E\u4E2D" : "\u53EF\u4EE3\u627E / \u9700\u786E\u8BA4";

    const contactLink = card.querySelector(".contact-link");
    if (contactLink && !includeOrderLink) {
      contactLink.remove();
    }

    container.appendChild(card);
  });
}

function renderFeaturedPreview(container, product) {
  if (!product) {
    container.innerHTML = '<div class="empty-state">\u5148\u65B0\u589E\u4E00\u4EF6\u5546\u54C1\uFF0C\u8FD9\u91CC\u4F1A\u81EA\u52A8\u663E\u793A\u4F60\u7684\u4E3B\u63A8\u5546\u54C1\u3002</div>';
    return;
  }

  container.innerHTML = `
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

async function uploadImageToSupabase(file) {
  const extension = file.name.split(".").pop() || "jpg";
  const fileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const bucket = config.storageBucket || "product-images";

  const { error } = await supabaseClient.storage.from(bucket).upload(fileName, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    throw error;
  }

  const { data } = supabaseClient.storage.from(bucket).getPublicUrl(fileName);
  return data.publicUrl;
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
