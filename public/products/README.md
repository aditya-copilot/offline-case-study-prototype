# Product Images

Place your product images in this folder.

## Naming Convention

Name your files to match the product IDs:

- `ELEC001.jpg` - Apple iPhone 15
- `ELEC002.jpg` - Samsung Galaxy S23
- `ELEC003.jpg` - OnePlus 11 5G
- etc.

## Supported Formats

- .jpg
- .jpeg
- .png
- .webp

## Image Guidelines

- Recommended size: 600x600 pixels
- Use square aspect ratio for best display
- Keep file size under 500KB for faster loading

## How to Update Products

After adding your images, update the `src/data/products.js` file:

Change from:
```javascript
image: "https://example.com/image.jpg"
```

To:
```javascript
image: "/products/ELEC001.jpg"
```

The `/products/` path automatically maps to this folder.
