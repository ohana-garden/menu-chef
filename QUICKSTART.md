# Quick Start Guide - Menu Chef

Get started with Menu Chef in 3 minutes!

## Step 1: Open the Application

### Option A: Direct File Access (Simplest)
```bash
# Just open index.html in your browser
open index.html  # macOS
start index.html # Windows
xdg-open index.html # Linux
```

### Option B: Local Server (Recommended)
```bash
# Using Python (if installed)
python -m http.server 8000

# Or using Python 3
python3 -m http.server 8000

# Or using Node.js
npx http-server

# Then open: http://localhost:8000
```

## Step 2: Get a Test Menu PDF

### Quick Options:
1. **Create your own**:
   - Open Google Docs or Word
   - Type a simple menu (see example below)
   - Save as PDF

2. **Use an existing menu**:
   - Download a menu PDF from any restaurant website
   - Or search "sample restaurant menu PDF" online

### Simple Test Menu Template:
```
My Restaurant

Appetizers

Caesar Salad                    $8.99
Fresh romaine with parmesan

Bruschetta                      $6.99
Toasted bread with tomatoes

Main Courses

Grilled Chicken                 $18.99
With roasted vegetables

Beef Burger                     $14.99
With fries and coleslaw

Desserts

Chocolate Cake                  $6.99
Rich chocolate layer cake

Ice Cream                       $4.99
Vanilla, chocolate, or strawberry
```

## Step 3: Upload and Edit

1. **Upload**: Drag your PDF to the upload zone or click "Select File"
2. **Wait**: The app analyzes the PDF (takes 5-10 seconds)
3. **Edit**: Modify menu items, add/remove items, change prices
4. **Preview**: Click "Refresh Preview" to see changes
5. **Generate**: Click "Generate PDF" to create new menu
6. **Download**: Download your updated menu PDF

## Tips for Best Results

✅ **DO**:
- Use simple, single-column layouts
- Include clear prices with $ symbol
- Use distinct section headers
- Keep descriptions concise

❌ **AVOID**:
- Scanned PDFs (images of menus)
- Complex multi-column layouts
- Menus without clear prices
- PDFs with lots of graphics

## Troubleshooting

### "Error parsing PDF"
- Make sure it's a real PDF (not a scanned image)
- Try a simpler menu first

### "No menu items detected"
- Check that your menu has prices with $ symbols
- Try adding section headers like "Appetizers"

### "Preview looks wrong"
- The app uses simplified rendering for preview
- The generated PDF will be more accurate

### "Storage quota exceeded"
- Clear old templates from localStorage
- Delete browser data for this site

## Next Steps

Once you've successfully processed your first menu:
- Try editing different sections
- Add new menu items
- Reorder sections
- Save templates for reuse

## Need Help?

Check the main README.md for:
- Detailed technical documentation
- Architecture overview
- Known limitations
- Future enhancements

---

Happy menu editing! 🍽️
