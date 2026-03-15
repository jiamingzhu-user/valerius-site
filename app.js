const STORAGE_KEY = "valerius-products";
const SESSION_KEY = "valerius-session";

const sampleProducts = [
  {
    id: crypto.randomUUID(),
    name: "Prada Re-Edition Mini Bag",
    price: "USD 899",
    originalPrice: "USD 1,050",
    category: "Bags",
    tag: "Bestseller",
    description: "Black nylon mini bag with leather trim. One ready-to-ship unit available today.",
    featured: true,
    inStock: true,
    image: createPlaceholderImage("Valerius", "Prada Re-Edition"),
  },
  {
    id: crypto.randomUUID(),
    name: "Golden Goose Super-Star",
    price: "USD 336",
    originalPrice: "USD 410",
    category: "Shoes",
    tag: "Flash",
    description: "Classic distressed sneaker. Good fit for a daily special push and VIP group highlight.",
    featured: true,
    inStock: true,
    image: createPlaceholderImage("Valerius", "Golden Goose"),
  },
  {
    id: crypto.randomUUID(),
    name: "Cartier Love Bracelet",
    price: "USD 4,120",
    originalPrice: "",
    category: "Jewelry",
    tag: "New",
    description: "Rose gold classic bracelet. Ideal for higher-ticket VIP clients and sourcing-on-request.",
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
  setFormMessage("Initialization failed. Switched back to local demo mode.", true);
  startLocalMode();
});

async function bootstrap() {
  if (!supabaseClient) {
    startLocalMode();
    return;
  }

  syncBadge.textContent = "Cloud mode configured";
  authStatus.textContent = "Checking admin session.";

  const { data, error } = await supabaseClient.auth.getSession();
  if (error) {
    console.error(error);
    authStatus.textContent = "Cloud mode is connected, but no admin is signed in.";
  } else {
    currentSession = data.session;
    persistSessionState(Boolean(currentSession));
    updateAuthUi();
  }

  await refreshProducts();
}

function startLocalMode() {
  syncBadge.textContent = "Local demo mode";
  authStatus.textContent = "Supabase is not configured yet. The site is still running in local demo mode.";
  products = loadProductsFromLocal();
  renderProducts();
  setFormMessage("Products currently save only inside this browser.", false);
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
    category: formData.get("category").toString().trim() || "Featured",
    tag: formData.get("tag").toString().trim() || "Recommended",
    description: formData.get("description").toString().trim(),
    featured: formData.get("featured") === "on",
    inStock: formData.get("inStock") === "on",
    image,
  };

  if (supabaseClient) {
    if (!currentSession) {
      setFormMessage("Please sign in first before saving products to the live cloud database.", true);
      return;
    }

    let imageUrl = product.image;
    if (imageFile && imageFile.size > 0) {
      try {
        imageUrl = await uploadImageToSupabase(imageFile);
      } catch (error) {
        console.error(error);
        setFormMessage("Image upload failed. Check Supabase storage bucket permissions.", true);
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
      setFormMessage("Cloud save failed. Check your table and policy setup.", true);
      return;
    }

    setFormMessage("Product saved to the live cloud catalog.", false);
    productForm.reset();
    await refreshProducts();
    return;
  }

  products = [product, ...products];
  saveProductsToLocal(products);
  renderProducts();
  productForm.reset();
  setFormMessage("Product saved inside this browser only.", false);
});

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!supabaseClient) {
    setFormMessage("Supabase is not configured yet, so live admin login is unavailable.", true);
    return;
  }

  const formData = new FormData(authForm);
  const email = formData.get("adminEmail").toString().trim();
  const password = formData.get("adminPassword").toString();

  if (!email || !password) {
    authStatus.textContent = "Enter both admin email and password.";
    return;
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    console.error(error);
    authStatus.textContent = "Sign-in failed. Check the admin account inside Supabase Auth.";
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
    authStatus.textContent = "Local demo mode does not need sign-out.";
    return;
  }

  await supabaseClient.auth.signOut();
  currentSession = null;
  persistSessionState(false);
  updateAuthUi();
});

resetButton.addEventListener("click", async () => {
  if (supabaseClient) {
    setFormMessage("Reset is limited to demo mode. Do not bulk-reset a live cloud catalog from the storefront.", true);
    return;
  }

  products = [...sampleProducts];
  saveProductsToLocal(products);
  renderProducts();
  setFormMessage("Demo products restored.", false);
});

function updateAuthUi() {
  if (!supabaseClient) {
    logoutButton.disabled = true;
    return;
  }

  logoutButton.disabled = !currentSession;
  authStatus.textContent = currentSession
    ? `Signed in as ${currentSession.user.email}`
    : "Cloud mode is ready. Sign in with your merchant account.";
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
  renderGrid(specialsGrid, featuredProducts, "No featured products yet. Add one from the admin form below.");
  renderGrid(catalogGrid, products, "No products are available yet.");
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

    card.querySelector(".status-pill").textContent = product.inStock ? "In stock" : "Source on request";
    container.appendChild(card);
  });
}

function renderFeaturedPreview(product) {
  if (!product) {
    featuredPreview.innerHTML = '<div class="empty-state">Add one product and your main featured item will appear here.</div>';
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
    category: row.category || "Featured",
    tag: row.tag || "Recommended",
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
