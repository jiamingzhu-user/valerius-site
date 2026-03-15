const STORAGE_KEY = "valerius-products";
const SESSION_KEY = "valerius-session";

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

const productForm = document.getElementById("productForm");
const authForm = document.getElementById("authForm");
const logoutButton = document.getElementById("logoutButton");
const specialsGrid = document.getElementById("specialsGrid");
const catalogGrid = document.getElementById("catalogGrid");
const featuredPreview = document.getElementById("featuredPreview");
const template = document.getElementById("productCardTemplate");
const resetButton = document.getElementById("resetProducts");
const syncBadge = document.getElementById("syncBadge");
const authStatus = document.getElementById("authStatus");
const formMessage = document.getElementById("formMessage");

let products = [];
let currentSession = null;

bootstrap().catch((error) => {
  console.error(error);
  setFormMessage("\u521d\u59cb\u5316\u5931\u8d25\uff0c\u5df2\u5207\u56de\u672c\u5730\u6f14\u793a\u6a21\u5f0f\u3002", true);
  startLocalMode();
});

async function bootstrap() {
  if (!supabaseClient) {
    startLocalMode();
    return;
  }

  syncBadge.textContent = "\u5df2\u8fde\u63a5\u4e91\u7aef";
  authStatus.textContent = "\u6b63\u5728\u68c0\u67e5\u7ba1\u7406\u5458\u767b\u5f55\u72b6\u6001\u3002";

  const { data, error } = await supabaseClient.auth.getSession();
  if (error) {
    console.error(error);
    authStatus.textContent = "\u4e91\u7aef\u5df2\u8fde\u63a5\uff0c\u4f46\u5f53\u524d\u8fd8\u6ca1\u6709\u7ba1\u7406\u5458\u767b\u5f55\u3002";
  } else {
    currentSession = data.session;
    persistSessionState(Boolean(currentSession));
    updateAuthUi();
  }

  await refreshProducts();
}

function startLocalMode() {
  syncBadge.textContent = "\u672c\u5730\u6f14\u793a\u6a21\u5f0f";
  authStatus.textContent = "Supabase \u8fd8\u6ca1\u6709\u914d\u7f6e\u5b8c\u6210\uff0c\u5f53\u524d\u4ecd\u662f\u672c\u5730\u6f14\u793a\u6a21\u5f0f\u3002";
  products = loadProductsFromLocal();
  renderProducts();
  setFormMessage("\u73b0\u5728\u65b0\u589e\u7684\u5546\u54c1\u53ea\u4f1a\u4fdd\u5b58\u5728\u5f53\u524d\u6d4f\u89c8\u5668\u91cc\u3002", false);
  persistSessionState(false);
  updateAuthUi();
}

async function refreshProducts() {
  if (!supabaseClient) {
    products = loadProductsFromLocal();
    renderProducts();
    return;
  }

  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    startLocalMode();
    return;
  }

  products = data.map(mapRemoteProduct);
  renderProducts();
}

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
    category: formData.get("category").toString().trim() || "\u7cbe\u9009",
    tag: formData.get("tag").toString().trim() || "\u63a8\u8350",
    description: formData.get("description").toString().trim(),
    featured: formData.get("featured") === "on",
    inStock: formData.get("inStock") === "on",
    image,
  };

  if (supabaseClient) {
    if (!currentSession) {
      setFormMessage("\u8bf7\u5148\u767b\u5f55\u7ba1\u7406\u5458\u8d26\u53f7\uff0c\u518d\u628a\u5546\u54c1\u4fdd\u5b58\u5230\u4e91\u7aef\u3002", true);
      return;
    }

    let imageUrl = product.image;
    if (imageFile && imageFile.size > 0) {
      try {
        imageUrl = await uploadImageToSupabase(imageFile);
      } catch (error) {
        console.error(error);
        setFormMessage("\u56fe\u7247\u4e0a\u4f20\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5 Supabase Storage \u6876\u6743\u9650\u662f\u5426\u6b63\u786e\u3002", true);
        return;
      }
    }

    const payload = {
      name: product.name,
      price: product.price,
      original_price: product.originalPrice,
      category: product.category,
      tag: product.tag,
      description: product.description,
      featured: product.featured,
      in_stock: product.inStock,
      image_url: imageUrl,
      created_by: currentSession.user.id,
    };

    const { error } = await supabaseClient.from("products").insert(payload);
    if (error) {
      console.error(error);
      setFormMessage("\u4e91\u7aef\u4fdd\u5b58\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5\u6570\u636e\u8868\u548c\u6743\u9650\u914d\u7f6e\u3002", true);
      return;
    }

    setFormMessage("\u5546\u54c1\u5df2\u4fdd\u5b58\u5230\u4e91\u7aef\uff0c\u8bbf\u5ba2\u73b0\u5728\u53ef\u4ee5\u770b\u5230\u6700\u65b0\u5185\u5bb9\u3002", false);
    productForm.reset();
    await refreshProducts();
    return;
  }

  products = [product, ...products];
  saveProductsToLocal(products);
  renderProducts();
  productForm.reset();
  setFormMessage("\u5546\u54c1\u5df2\u4fdd\u5b58\u5728\u5f53\u524d\u6d4f\u89c8\u5668\u4e2d\u3002", false);
});

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!supabaseClient) {
    setFormMessage("Supabase \u8fd8\u6ca1\u6709\u914d\u7f6e\u5b8c\u6210\uff0c\u6682\u65f6\u65e0\u6cd5\u767b\u5f55\u6b63\u5f0f\u540e\u53f0\u3002", true);
    return;
  }

  const formData = new FormData(authForm);
  const email = formData.get("adminEmail").toString().trim();
  const password = formData.get("adminPassword").toString();

  if (!email || !password) {
    authStatus.textContent = "\u8bf7\u8f93\u5165\u7ba1\u7406\u5458\u90ae\u7bb1\u548c\u5bc6\u7801\u3002";
    return;
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    console.error(error);
    authStatus.textContent = "\u767b\u5f55\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5 Supabase Auth \u91cc\u7684\u8d26\u53f7\u548c\u5bc6\u7801\u3002";
    return;
  }

  currentSession = data.session;
  persistSessionState(true);
  updateAuthUi();
  authForm.reset();
  await refreshProducts();
});

logoutButton.addEventListener("click", async () => {
  if (!supabaseClient) {
    authStatus.textContent = "\u672c\u5730\u6f14\u793a\u6a21\u5f0f\u4e0d\u9700\u8981\u9000\u51fa\u767b\u5f55\u3002";
    return;
  }

  await supabaseClient.auth.signOut();
  currentSession = null;
  persistSessionState(false);
  updateAuthUi();
});

resetButton.addEventListener("click", async () => {
  if (supabaseClient) {
    setFormMessage("\u6062\u590d\u793a\u4f8b\u5546\u54c1\u53ea\u9002\u7528\u4e8e\u672c\u5730\u6f14\u793a\u6a21\u5f0f\u3002", true);
    return;
  }

  products = [...sampleProducts];
  saveProductsToLocal(products);
  renderProducts();
  setFormMessage("\u793a\u4f8b\u5546\u54c1\u5df2\u6062\u590d\u3002", false);
});

function updateAuthUi() {
  if (!supabaseClient) {
    logoutButton.disabled = true;
    return;
  }

  logoutButton.disabled = !currentSession;
  authStatus.textContent = currentSession
    ? `\u5df2\u767b\u5f55\uff1a${currentSession.user.email}`
    : "\u4e91\u7aef\u5df2\u51c6\u5907\u597d\uff0c\u8bf7\u4f7f\u7528\u5546\u5bb6\u8d26\u53f7\u767b\u5f55\u3002";
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

function persistSessionState(isLoggedIn) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ isLoggedIn }));
}

function renderProducts() {
  const featuredProducts = products.filter((product) => product.featured);
  renderGrid(specialsGrid, featuredProducts, "\u8FD8\u6CA1\u6709\u8BBE\u7F6E\u201C\u4ECA\u65E5\u7279\u4EF7\u201D\u5546\u54C1\u3002");
  renderGrid(catalogGrid, products, "\u6682\u65F6\u8FD8\u6CA1\u6709\u5546\u54C1\u3002");
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

    card.querySelector(".status-pill").textContent = product.inStock ? "\u5728\u552E\u4E2D" : "\u53EF\u4EE3\u627E / \u9700\u786E\u8BA4";
    container.appendChild(card);
  });
}

function renderFeaturedPreview(product) {
  if (!product) {
    featuredPreview.innerHTML = '<div class="empty-state">\u5148\u65B0\u589E\u4E00\u4EF6\u5546\u54C1\uFF0C\u8FD9\u91CC\u4F1A\u81EA\u52A8\u663E\u793A\u4F60\u7684\u4E3B\u63A8\u5546\u54C1\u3002</div>';
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

function setFormMessage(message, isError) {
  formMessage.textContent = message;
  formMessage.classList.toggle("error-text", isError);
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
