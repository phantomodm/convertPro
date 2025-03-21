// assets/product-gallery.js
import Swiper from 'swiper';
import Zooming from 'zooming';
import 'swiper/css'; // Import Swiper's core CSS -- VERY IMPORTANT

if (!customElements.get('product-gallery')) {
  class ProductGallery extends HTMLElement {
    constructor() {
      super();
      this.initSwiper(); // Call initSwiper when the component is connected
    }

    initSwiper() {
      //Main Image
      this.mainSwiper = new Swiper('.tw-product-media__main', {
        // Note: Use class, not ID
        loop: true, // Optional: Enable looping
        spaceBetween: 10,
        navigation: {
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        },
        // Add Zooming
        zoom: true, // Enable zooming
        on: {
          //Zooming Config, and Functions
          zoomChange: function (swiper, scale, imageEl) {
            // Do something when zoom changes
            // scale is the current zoom level
            //Disable swipe while zoomed
            if (scale > 1) {
              swiper.allowTouchMove = false;
              imageEl.parentElement.parentElement.style.overflow = 'hidden'; //Hide scroll bars
            } else {
              swiper.allowTouchMove = true; //Enable when no zoom
              imageEl.parentElement.parentElement.style.overflow = 'visible';
            }
          },
          doubleTap: function (swiper, event) {
            const imageEl = event.target; //Needs to check if click is image
            // Check if the clicked element is an image
            if (imageEl.tagName.toLowerCase() === 'img') {
              const zoom = this.zoom; //Short hand
              if (zoom.scale > 1) {
                zoom.out();
              } else {
                zoom.in(event); //Zoom to pointer
              }
            }
          },
        },
      });
      // Thumbnails

      this.thumbnailSwiper = new Swiper('.tw-product-media__thumbs', {
        // Note: Use class
        spaceBetween: 10,
        slidesPerView: 4, // Or whatever number fits nicely
        freeMode: true,
        watchSlidesProgress: true, // Needed for linking with mainSwiper
      });

      this.mainSwiper.controller.control = this.thumbnailSwiper;
      this.thumbnailSwiper.controller.control = this.mainSwiper;

      // Initialize Zooming
      this.zooming = new Zooming({
        // Options (see Zooming documentation)
        enableGrab: true,
        preloadImage: true,
        scaleBase: 0.9, // Adjust as needed
        onBeforeOpen: (img) => {
          img.style.cursor = 'zoom-out';
        },
        onBeforeClose: (img) => {
          img.style.cursor = 'zoom-in';
        },
      });

      // Initialize Zooming on main images
      this.querySelectorAll('.tw-product-media__main img').forEach((img) => {
        this.zooming.listen(img);
        // Add a data attribute so we can select it easily
        img.setAttribute('data-action', 'zoom');
      });

      //Add event listener for clicking Thumbnails
      this.addThumbnailEventListeners();
    }
    // Add event listeners to thumbnails
    addThumbnailEventListeners() {
      this.thumbnailSwiper.slides.forEach((slide, index) => {
        //Loop through slides
        const button = slide.querySelector('button'); //Find the button
        if (button) {
          button.addEventListener('click', () => {
            this.mainSwiper.slideTo(index); // Go to the corresponding main slide
          });
        }
      });
    }
  }

  customElements.define('product-gallery', ProductGallery);
}
