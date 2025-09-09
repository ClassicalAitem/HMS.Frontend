import carouselImage1 from "./carouselImage1.jpg";
import carouselImage2 from "./carouselImage2.png"

// Import your carousel images here
// For now using placeholder URLs - replace with your actual imports when you add the images

// Example of how to import local images:
// import carouselImage1 from './carouselImage1.jpg';
// import carouselImage2 from './carouselImage2.jpg';
// import carouselImage3 from './carouselImage3.jpg';
// import carouselImage4 from './carouselImage4.jpg';
// import carouselImage5 from './carouselImage5.jpg';

//importing carousel Images from asset/login

// Carousel images configuration
export const carouselImages = [
  {
    id: 1,
    // src: carouselImage1, // Use this when you add local images
    src: carouselImage1,
    alt: "Medical professional with globe",
  },
  {
    id: 2,
    // src: carouselImage2,
    src: carouselImage2,
    alt: "Doctor with stethoscope",
  },
  {
    id: 3,
    // src: carouselImage3,
    src: carouselImage1,
    alt: "Medical team",
  },
  {
    id: 4,
    // src: carouselImage4,
    src: carouselImage2,
    alt: "Healthcare professional",
  },
];

export default carouselImages;
