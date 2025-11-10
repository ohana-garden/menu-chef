# Deployment Guide - Menu Chef

Deploy Menu Chef online in minutes using one of these methods:

## Option 1: GitHub Pages (Recommended) ⭐

Since your code is already on GitHub, this is the easiest option!

### Steps:

1. **Go to your GitHub repository**:
   ```
   https://github.com/ohana-garden/menu-chef
   ```

2. **Enable GitHub Pages**:
   - Click on **Settings** tab
   - Scroll down to **Pages** section (left sidebar)
   - Under "Source", select your branch: `claude/restaurant-menu-pdf-generator-011CUzk6sKVKb4cwkbKmnUZZ`
   - Select folder: `/ (root)`
   - Click **Save**

3. **Wait 1-2 minutes** for deployment

4. **Access your app** at:
   ```
   https://ohana-garden.github.io/menu-chef/
   ```

### Alternative: Deploy from main branch

If you want a cleaner URL setup:
```bash
# Merge to main branch first
git checkout main
git merge claude/restaurant-menu-pdf-generator-011CUzk6sKVKb4cwkbKmnUZZ
git push origin main

# Then enable GitHub Pages for main branch
```

---

## Option 2: Netlify Drop (Instant) ⚡

No git required - just drag and drop!

### Steps:

1. **Visit**: https://app.netlify.com/drop

2. **Drag your project folder** (the entire `menu-chef` directory) onto the page

3. **Done!** You'll get a URL like: `https://random-name.netlify.app`

4. **Optional**: Customize the URL in Netlify settings

---

## Option 3: Vercel (Fast)

### Steps:

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   cd /home/user/menu-chef
   vercel
   ```

3. **Follow prompts** and get instant deployment

---

## Option 4: Surge.sh (Simplest CLI)

### Steps:

1. **Install Surge**:
   ```bash
   npm install -g surge
   ```

2. **Deploy**:
   ```bash
   cd /home/user/menu-chef
   surge
   ```

3. **Choose a subdomain** (e.g., `menu-chef.surge.sh`)

---

## Option 5: Test Online Immediately (CodeSandbox)

### Steps:

1. **Go to**: https://codesandbox.io/s/

2. **Click** "Import from GitHub"

3. **Enter repository URL**:
   ```
   https://github.com/ohana-garden/menu-chef
   ```

4. **Select branch**: `claude/restaurant-menu-pdf-generator-011CUzk6sKVKb4cwkbKmnUZZ`

5. **Preview instantly** in the browser

---

## Recommended Deployment: GitHub Pages

**Why GitHub Pages?**
✅ Free forever
✅ Custom domain support
✅ Automatic HTTPS
✅ Auto-deploys on push
✅ No build step needed
✅ Great for static sites

**Your URL will be**:
```
https://ohana-garden.github.io/menu-chef/
```

---

## Troubleshooting

### GitHub Pages not working?
- Make sure you selected the correct branch
- Wait 2-3 minutes for first deployment
- Check that `index.html` is in the root directory (it is!)

### CORS issues with PDFs?
- GitHub Pages and Netlify handle this correctly
- If using custom domain, ensure HTTPS is enabled

### Still not working?
- Check browser console for errors
- Make sure you're using a modern browser (Chrome, Firefox, Edge)
- Test with the local server first

---

## Next Steps After Deployment

1. **Test with a real menu PDF**
2. **Share the URL** with restaurant owners
3. **Customize** the branding if needed
4. **Monitor** browser console for any errors
5. **Collect feedback** and iterate

---

## Custom Domain (Optional)

If you want a custom domain like `menu-chef.com`:

1. Buy domain from Namecheap, Google Domains, etc.
2. In GitHub Pages settings, add custom domain
3. Add CNAME record in your domain DNS:
   ```
   CNAME → ohana-garden.github.io
   ```

---

Happy deploying! 🚀
