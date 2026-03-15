const specialsGrid = document.getElementById("specialsGrid");
const catalogGrid = document.getElementById("catalogGrid");
const featuredPreview = document.getElementById("featuredPreview");
const template = document.getElementById("productCardTemplate");
const syncBadge = document.getElementById("syncBadge");

initStorefront().catch((error) => {
  console.error(error);
  syncBadge.textContent = "\u52A0\u8F7D\u5931\u8D25";
});

async function initStorefront() {
  syncBadge.textContent = supabaseClient ? "\u5DF2\u8FDE\u63A5\u4E91\u7AEF" : "\u672C\u5730\u6F14\u793A\u6A21\u5F0F";

  const products = await loadProducts();
  const featuredProducts = products.filter((product) => product.featured);

  renderGrid(specialsGrid, template, featuredProducts, "\u8FD8\u6CA1\u6709\u8BBE\u7F6E\u201C\u4ECA\u65E5\u7279\u4EF7\u201D\u5546\u54C1\u3002");
  renderGrid(catalogGrid, template, products, "\u6682\u65F6\u8FD8\u6CA1\u6709\u5546\u54C1\u3002");
  renderFeaturedPreview(featuredPreview, featuredProducts[0] || products[0]);
}
