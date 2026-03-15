const SESSION_KEY = "valerius-session";

const productForm = document.getElementById("productForm");
const authForm = document.getElementById("authForm");
const logoutButton = document.getElementById("logoutButton");
const catalogGrid = document.getElementById("catalogGrid");
const template = document.getElementById("productCardTemplate");
const resetButton = document.getElementById("resetProducts");
const syncBadge = document.getElementById("syncBadge");
const authStatus = document.getElementById("authStatus");
const backendHint = document.getElementById("backendHint");
const formMessage = document.getElementById("formMessage");
const productCount = document.getElementById("productCount");

let products = [];
let currentSession = null;

bootstrap().catch((error) => {
  console.error(error);
  setFormMessage("\u521D\u59CB\u5316\u5931\u8D25\uFF0C\u5DF2\u5207\u56DE\u672C\u5730\u6F14\u793A\u6A21\u5F0F\u3002", true);
  startLocalMode();
});

async function bootstrap() {
  if (!supabaseClient) {
    startLocalMode();
    return;
  }

  syncBadge.textContent = "\u5DF2\u8FDE\u63A5\u4E91\u7AEF";
  backendHint.textContent = "\u5F53\u524D\u5DF2\u914D\u7F6E Supabase\uFF0C\u767B\u5F55\u540E\u53EF\u4EE5\u76F4\u63A5\u7BA1\u7406\u7EBF\u4E0A\u5546\u54C1\u3002";

  const { data, error } = await supabaseClient.auth.getSession();
  if (error) {
    console.error(error);
    authStatus.textContent = "\u4E91\u7AEF\u5DF2\u8FDE\u63A5\uFF0C\u4F46\u5F53\u524D\u8FD8\u6CA1\u6709\u767B\u5F55\u3002";
  } else {
    currentSession = data.session;
    persistSessionState(Boolean(currentSession));
    updateAuthUi();
  }

  await refreshProducts();
}

function startLocalMode() {
  syncBadge.textContent = "\u672C\u5730\u6F14\u793A\u6A21\u5F0F";
  authStatus.textContent = "\u5C1A\u672A\u767B\u5F55";
  backendHint.textContent = "Supabase \u8FD8\u6CA1\u6709\u914D\u7F6E\u5B8C\u6210\uFF0C\u5F53\u524D\u4F1A\u5C06\u5546\u54C1\u4FDD\u5B58\u5728\u672C\u5730\u6D4F\u89C8\u5668\u3002";
  products = loadProductsFromLocal();
  renderAdminProducts();
  setFormMessage("\u73B0\u5728\u65B0\u589E\u7684\u5546\u54C1\u53EA\u4F1A\u4FDD\u5B58\u5728\u5F53\u524D\u6D4F\u89C8\u5668\u91CC\u3002", false);
  persistSessionState(false);
  updateAuthUi();
}

async function refreshProducts() {
  products = await loadProducts();
  renderAdminProducts();
}

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!supabaseClient) {
    setFormMessage("Supabase \u8FD8\u6CA1\u6709\u914D\u7F6E\u5B8C\u6210\uFF0C\u6682\u65F6\u65E0\u6CD5\u767B\u5F55\u6B63\u5F0F\u540E\u53F0\u3002", true);
    return;
  }

  const formData = new FormData(authForm);
  const email = formData.get("adminEmail").toString().trim();
  const password = formData.get("adminPassword").toString();

  if (!email || !password) {
    authStatus.textContent = "\u8BF7\u8F93\u5165\u7BA1\u7406\u5458\u90AE\u7BB1\u548C\u5BC6\u7801\u3002";
    return;
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    console.error(error);
    authStatus.textContent = "\u767B\u5F55\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5 Supabase Auth \u91CC\u7684\u8D26\u53F7\u548C\u5BC6\u7801\u3002";
    return;
  }

  currentSession = data.session;
  persistSessionState(true);
  updateAuthUi();
  authForm.reset();
});

logoutButton.addEventListener("click", async () => {
  if (!supabaseClient) {
    authStatus.textContent = "\u672C\u5730\u6F14\u793A\u6A21\u5F0F\u4E0D\u9700\u8981\u9000\u51FA\u767B\u5F55\u3002";
    return;
  }

  await supabaseClient.auth.signOut();
  currentSession = null;
  persistSessionState(false);
  updateAuthUi();
});

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
    category: formData.get("category").toString().trim() || "\u7CBE\u9009",
    tag: formData.get("tag").toString().trim() || "\u63A8\u8350",
    description: formData.get("description").toString().trim(),
    featured: formData.get("featured") === "on",
    inStock: formData.get("inStock") === "on",
    image,
  };

  if (supabaseClient) {
    if (!currentSession) {
      setFormMessage("\u8BF7\u5148\u767B\u5F55\u7BA1\u7406\u5458\u8D26\u53F7\uFF0C\u518D\u628A\u5546\u54C1\u4FDD\u5B58\u5230\u4E91\u7AEF\u3002", true);
      return;
    }

    let imageUrl = product.image;
    if (imageFile && imageFile.size > 0) {
      try {
        imageUrl = await uploadImageToSupabase(imageFile);
      } catch (error) {
        console.error(error);
        setFormMessage("\u56FE\u7247\u4E0A\u4F20\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5 Supabase Storage \u6876\u6743\u9650\u662F\u5426\u6B63\u786E\u3002", true);
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
      setFormMessage("\u4E91\u7AEF\u4FDD\u5B58\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u6570\u636E\u8868\u548C\u6743\u9650\u914D\u7F6E\u3002", true);
      return;
    }

    setFormMessage("\u5546\u54C1\u5DF2\u4FDD\u5B58\u5230\u4E91\u7AEF\uFF0C\u524D\u53F0\u4F1A\u7ACB\u5373\u540C\u6B65\u663E\u793A\u3002", false);
    productForm.reset();
    await refreshProducts();
    return;
  }

  products = [product, ...products];
  saveProductsToLocal(products);
  renderAdminProducts();
  productForm.reset();
  setFormMessage("\u5546\u54C1\u5DF2\u4FDD\u5B58\u5728\u5F53\u524D\u6D4F\u89C8\u5668\u4E2D\u3002", false);
});

resetButton.addEventListener("click", () => {
  if (supabaseClient) {
    setFormMessage("\u6062\u590D\u793A\u4F8B\u5546\u54C1\u53EA\u9002\u7528\u4E8E\u672C\u5730\u6F14\u793A\u6A21\u5F0F\u3002", true);
    return;
  }

  products = [...sampleProducts];
  saveProductsToLocal(products);
  renderAdminProducts();
  setFormMessage("\u793A\u4F8B\u5546\u54C1\u5DF2\u6062\u590D\u3002", false);
});

function renderAdminProducts() {
  renderGrid(catalogGrid, template, products, "\u6682\u65F6\u8FD8\u6CA1\u6709\u5546\u54C1\u3002", { includeOrderLink: false });
  productCount.textContent = String(products.length);
}

function updateAuthUi() {
  if (!supabaseClient) {
    logoutButton.disabled = true;
    return;
  }

  logoutButton.disabled = !currentSession;
  authStatus.textContent = currentSession
    ? `\u5DF2\u767B\u5F55\uFF1A${currentSession.user.email}`
    : "\u5C1A\u672A\u767B\u5F55";
}

function setFormMessage(message, isError) {
  formMessage.textContent = message;
  formMessage.classList.toggle("error-text", isError);
}

function persistSessionState(isLoggedIn) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ isLoggedIn }));
}
