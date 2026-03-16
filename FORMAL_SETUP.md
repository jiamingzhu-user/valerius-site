# Valerius Production Setup

This site now has a production-ready split structure:

- `index.html` is the public storefront
- `admin.html` is the private merchant admin page
- Supabase stores shared product data
- Supabase Storage stores product images
- Supabase Auth handles merchant login

## 1. Create a Supabase project

1. Open [Supabase](https://supabase.com/)
2. Create a new project
3. Open `SQL Editor`
4. Run the SQL from [supabase-schema.sql](C:\Users\jiami\Documents\Playground\supabase-schema.sql)

## 2. Create your merchant login

1. Open `Authentication`
2. Open `Users`
3. Create your merchant email and password

## 3. Fill in site config

Edit [config.js](C:\Users\jiami\Documents\Playground\config.js) and replace the placeholders:

```js
window.VALERIUS_CONFIG = {
  supabaseUrl: "YOUR_SUPABASE_URL",
  supabaseAnonKey: "YOUR_SUPABASE_ANON_KEY",
  storageBucket: "product-images",
};
```

Use the public `anon` key only.
Do not put the `service_role` key in a public website.

## 4. Upload updated files to GitHub

Upload these files again to your repository:

- [index.html](C:\Users\jiami\Documents\Playground\index.html)
- [admin.html](C:\Users\jiami\Documents\Playground\admin.html)
- [styles.css](C:\Users\jiami\Documents\Playground\styles.css)
- [shared.js](C:\Users\jiami\Documents\Playground\shared.js)
- [shop.js](C:\Users\jiami\Documents\Playground\shop.js)
- [admin.js](C:\Users\jiami\Documents\Playground\admin.js)
- [config.js](C:\Users\jiami\Documents\Playground\config.js)
- [supabase-schema.sql](C:\Users\jiami\Documents\Playground\supabase-schema.sql)

GitHub Pages will redeploy automatically.

## 5. What happens after setup

- You sign in from `admin.html`
- You add products and upload images
- Products are stored in Supabase
- Everyone visiting `zjm.us.ci` sees the same live catalog on `index.html`

## 6. Strong next steps

Recommended next improvements:

- edit existing products
- remove products
- category filters
- WeChat contact button
- VIP-only page
- product availability notes
