# Carousel Images Setup

## How to Add Your Images

1. **Add your image files** to this folder with these exact names:

   - `carouselImage1.jpg` (or .png, .webp, etc.)
   - `carouselImage2.jpg`
   - `carouselImage3.jpg`
   - `carouselImage4.jpg`
   - `carouselImage5.jpg`

2. **Update the imageConfig.js file** by:
   - Uncommenting the import statements at the top
   - Commenting out the placeholder URLs
   - Uncommenting the `src: carouselImageX` lines

## Example Configuration

After adding your images, your `imageConfig.js` should look like this:

```javascript
// Import your carousel images
import carouselImage1 from "./carouselImage1.jpg";
import carouselImage2 from "./carouselImage2.jpg";
import carouselImage3 from "./carouselImage3.jpg";
import carouselImage4 from "./carouselImage4.jpg";
import carouselImage5 from "./carouselImage5.jpg";

export const carouselImages = [
  {
    id: 1,
    src: carouselImage1,
    alt: "Medical professional with globe",
  },
  // ... rest of the configuration
];
```

## Supported Image Formats

- JPG/JPEG
- PNG
- WebP
- SVG (for vector graphics)

## Recommended Image Specifications

- **Resolution**: 1200x800px or higher
- **Aspect Ratio**: 3:2 or 4:3
- **File Size**: Under 500KB each for optimal loading
- **Format**: WebP for best compression, or JPG for compatibility
