if (!customElements.get('product-form')) {
  customElements.define(
    'product-form',
    class ProductForm extends HTMLElement {
      constructor() {
        super();

        this.form = this.querySelector('form');
        this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
        this.cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
        this.submitButton = this.querySelector('[type="submit"]');
        this.submitButtonText = this.submitButton.querySelector('span'); // Keep Dawn's text handling

        if (document.querySelector('cart-drawer')) this.submitButton.setAttribute('aria-haspopup', 'dialog');

        this.hideErrors = this.dataset.hideErrors === 'true'; // Keep Dawn's error handling option.

        // --- ADDED: Variant Selection Logic ---
        this.productId = this.dataset.productId; // Get the product ID (for potential future use)
        this.variantSelects = this.querySelector('.product-form__variants'); // Selects parent element
        if (this.variantSelects) {
          this.variantSelects.addEventListener('change', this.onVariantChange.bind(this));
          this.onVariantChange(); // Call onVariantChange to initialize with the default variant
        }

        // --- ADDED: Quantity Logic ---
        this.quantityInput = this.querySelector('.tw-quantity-input');
        this.quantityButtons = this.querySelectorAll('.tw-quantity-btn');
        this.setupQuantityButtons();

        // --- Quick ADD ---
        this.setupQuickAddButtons();
      }

      onVariantChange() {
        this.updateOptions();
        this.updateMasterId();
        this.updatePrice();
        this.updateAvailability();
        this.updateQuantityRules();

        if (!this.currentVariant) {
          this.updateMedia(null); //In case the variant doesn't exist
          return;
        }

        this.updateMedia(this.currentVariant);
        this.updateURL(); // Optional: Update the URL
      }
      updateOptions() {
        this.options = Array.from(this.variantSelects.querySelectorAll('select'), (select) => select.value); //Corrected Selector
      }

      updateMasterId() {
        this.currentVariant = this.getVariantData().find((variant) => {
          return !variant.options
            .map((option, index) => {
              return this.options[index] === option;
            })
            .includes(false);
        });
        // Update the hidden input field with the current variant ID
        if (this.currentVariant) {
          this.variantIdInput.value = this.currentVariant.id; //Update Input
        }
      }

      updatePrice() {
        if (!this.currentVariant) return;

        const price = this.currentVariant.price;
        const compareAtPrice = this.currentVariant.compare_at_price;

        // Update the displayed price.  Adjust these selectors to match your HTML structure.
        const priceContainer = this.querySelector('.tw-product-information .tw-text-xl');
        const salePriceContainer = this.querySelector('.tw-product-information .tw-text-red-500');
        const regularPriceContainer = this.querySelector('.tw-product-information .tw-line-through');

        if (compareAtPrice > price) {
          // On sale
          if (salePriceContainer) salePriceContainer.textContent = this.formatMoney(compareAtPrice);
          if (regularPriceContainer) regularPriceContainer.textContent = this.formatMoney(price);
          if (priceContainer) priceContainer.classList.add('tw-hidden'); //Added
        } else {
          // Regular price
          if (priceContainer) priceContainer.textContent = this.formatMoney(price);
          if (salePriceContainer) salePriceContainer.classList.add('tw-hidden'); //Added
          if (regularPriceContainer) regularPriceContainer.classList.add('tw-hidden'); //Added
          if (priceContainer) priceContainer.classList.remove('tw-hidden'); //Added
        }
      }
      updateMedia(currentVariant) {
        if (!currentVariant || !currentVariant.featured_media) {
          return; // No media to update
        }
        const newMediaID = currentVariant.featured_media.id;
        const currentMedia = this.querySelector(`.tw-product-media__main img[data-media-id="${newMediaID}"]`);

        const parentOfCurrentMedia = currentMedia.parentElement;

        // Hide all media
        const allMedia = this.querySelectorAll('.tw-product-media__main > *'); // Selects immediate children
        allMedia.forEach((media) => media.classList.add('tw-hidden'));

        // Show current media
        if (currentMedia) {
          currentMedia.classList.remove('tw-hidden');
          parentOfCurrentMedia.classList.remove('tw-hidden');
        }

        // To set ALL images to a product variant image.
        //this.querySelectorAll('.tw-product-media__main img').forEach(img => {
        //  img.src = currentVariant.featured_media.src;
        //  img.alt = currentVariant.featured_media.alt;
        //  });

        // Thumbnail update - More advanced, requires data attributes on thumbnails
        this.querySelectorAll('.tw-product-media__thumbs button').forEach((button) => {
          button.classList.remove('tw-ring-2'); // Example: Remove an "active" class
        });

        const currentThumb = this.querySelector(`.tw-product-media__thumbs button[data-media-id="${newMediaID}"]`);

        if (currentThumb) {
          currentThumb.classList.add('tw-ring-2'); // Add focus
          currentThumb.focus(); // Set focus for accessibility
        }
      }
      updateAvailability() {
        if (!this.currentVariant) {
          this.submitButton.setAttribute('aria-disabled', true);
          this.submitButtonText.textContent = window.variantStrings.unavailable;
          return;
        }

        if (this.currentVariant.available) {
          this.submitButton.removeAttribute('aria-disabled');
          this.submitButtonText.textContent = window.variantStrings.addToCart;
        } else {
          this.submitButton.setAttribute('aria-disabled', true);
          this.submitButtonText.textContent = window.variantStrings.soldOut;
        }
      }
      updateURL() {
        if (!this.currentVariant || this.dataset.updateUrl === 'false') return;
        window.history.replaceState({}, '', `${this.dataset.url}?variant=${this.currentVariant.id}`);
      }

      // Added Methods for quantity
      setupQuantityButtons() {
        this.quantityButtons.forEach((button) => {
          button.addEventListener('click', this.onQuantityButtonClick.bind(this));
        });
      }

      onQuantityButtonClick(event) {
        event.preventDefault();
        const button = event.currentTarget;
        const action = button.dataset.action;
        const currentQuantity = parseInt(this.quantityInput.value, 10);

        if (action === 'increment') {
          this.quantityInput.value = currentQuantity + 1;
        } else if (action === 'decrement') {
          this.quantityInput.value = Math.max(1, currentQuantity - 1); // Ensure quantity doesn't go below 1
        }
        this.updateQuantityRules(); //After updating quantity, run the rules
      }

      updateQuantityRules() {
        if (!this.currentVariant) return;
        const maxQuantity = this.currentVariant.inventory_quantity;

        if (this.currentVariant.inventory_management != 'shopify' || this.currentVariant.available) {
          this.quantityInput.removeAttribute('max'); //Unlimited if not available or not tracked.
          return;
        }
        if (maxQuantity !== null) {
          this.quantityInput.setAttribute('max', maxQuantity); // Set the maximum quantity
          // Ensure the current value is not greater than the max
          if (parseInt(this.quantityInput.value, 10) > maxQuantity) {
            this.quantityInput.value = maxQuantity;
          }
        }

        if (parseInt(this.quantityInput.value, 10) < 1) {
          this.quantityInput.value = 1;
        }
      }

      setupQuickAddButtons() {
        document.querySelectorAll('.quick-add-button').forEach((button) => {
          //Find all quick add buttons
          button.addEventListener('click', this.onQuickAddClick.bind(this));
        });
      }

      onQuickAddClick(event) {
        event.preventDefault();
        const button = event.currentTarget;
        const productId = button.dataset.productId;
        const variantId = button.dataset.variantId;

        // Disable the button and show loading state
        button.setAttribute('aria-disabled', true);
        button.classList.add('loading');
        button.textContent = 'Adding...'; // Or show a spinner

        const config = fetchConfig('javascript');
        config.headers['X-Requested-With'] = 'XMLHttpRequest';
        delete config.headers['Content-Type'];

        // Construct FormData manually for the Quick Add
        const formData = new FormData();
        formData.append('id', variantId);
        formData.append('quantity', 1); // Default quantity to 1 for Quick Add
        formData.append(
          'sections',
          this.cart.getSectionsToRender().map((section) => section.id)
        ); //Dawn specific
        formData.append('sections_url', window.location.pathname); //Dawn specific

        fetch(`${routes.cart_add_url}`, config)
          .then((response) => response.json())
          .then((response) => {
            if (response.status) {
              // Handle errors (e.g., product out of stock, invalid variant)
              console.error('Error adding to cart:', response.description);
              alert(response.description); // Basic error display - improve this!
              button.textContent = 'Error'; // Or your default "Add to Cart" text

              return;
            }

            // Success! Update the cart
            publish(PUB_SUB_EVENTS.cartUpdate, {
              source: 'quick-add',
              cartData: response,
              productVariantId: variantId,
            }); //Keep Dawn's event
            this.error = false;
            if (this.cart) {
              this.cart.renderContents(response); // Update cart drawer/notification
            }
          })
          .catch((error) => {
            console.error('Error adding to cart:', error);
            alert('Error adding to cart. Please try again.'); // Basic error display
          })
          .finally(() => {
            // Re-enable the button
            button.removeAttribute('aria-disabled');
            button.classList.remove('loading');
            button.textContent = 'Add to Cart'; // Or use translated text if you have it stored.
          });
      }

      onSubmitHandler(evt) {
        evt.preventDefault();
        if (this.submitButton.getAttribute('aria-disabled') === 'true') return;

        this.handleErrorMessage();

        this.submitButton.setAttribute('aria-disabled', true);
        this.submitButton.classList.add('loading');
        this.querySelector('.loading__spinner')?.classList.remove('hidden'); // Use optional chaining

        const config = fetchConfig('javascript');
        config.headers['X-Requested-With'] = 'XMLHttpRequest';
        delete config.headers['Content-Type']; // Let FormData set the Content-Type

        const formData = new FormData(this.form);
        if (this.cart) {
          formData.append(
            'sections',
            this.cart.getSectionsToRender().map((section) => section.id)
          );
          formData.append('sections_url', window.location.pathname);
          this.cart.setActiveElement(document.activeElement);
        }
        config.body = formData;

        fetch(`${routes.cart_add_url}`, config)
          .then((response) => response.json())
          .then((response) => {
            if (response.status) {
              publish(PUB_SUB_EVENTS.cartError, {
                //Keep Dawn's event
                source: 'product-form',
                productVariantId: formData.get('id'),
                errors: response.errors || response.description,
                message: response.message,
              });
              this.handleErrorMessage(response.description);

              const soldOutMessage = this.submitButton.querySelector('.sold-out-message'); // Keep dawns message
              if (!soldOutMessage) return;
              this.submitButton.setAttribute('aria-disabled', true);
              this.submitButtonText.classList.add('hidden');
              soldOutMessage.classList.remove('hidden');
              this.error = true;
              return;
            } else if (!this.cart) {
              window.location = window.routes.cart_url;
              return;
            }

            const startMarker = CartPerformance.createStartingMarker('add:wait-for-subscribers');
            if (!this.error)
              publish(PUB_SUB_EVENTS.cartUpdate, {
                source: 'product-form',
                cartData: response,
                productVariantId: formData.get('id'),
              }); // Keep Dawn's event
            this.error = false;
            const quickAddModal = this.closest('quick-add-modal'); //Keep for quick add
            if (quickAddModal) {
              document.body.addEventListener(
                'modalClosed',
                () => {
                  setTimeout(() => {
                    CartPerformance.measure('add:paint-updated-sections', () => {
                      this.cart.renderContents(response);
                    });
                  });
                },
                { once: true }
              );
              quickAddModal.hide(true);
            } else {
              CartPerformance.measure('add:paint-updated-sections', () => {
                this.cart.renderContents(response);
              });
            }
          })
          .catch((e) => {
            console.error(e);
          })
          .finally(() => {
            this.submitButton.classList.remove('loading');
            if (this.cart && this.cart.classList.contains('is-empty')) this.cart.classList.remove('is-empty');
            if (!this.error) this.submitButton.removeAttribute('aria-disabled');
            this.querySelector('.loading__spinner')?.classList.add('hidden'); // Use optional chaining
            CartPerformance.measureFromEvent('add:user-action', evt);
          });
      }

      handleErrorMessage(errorMessage = false) {
        if (this.hideErrors) return;

        this.errorMessageWrapper =
          this.errorMessageWrapper || this.querySelector('.product-form__error-message-wrapper');
        if (!this.errorMessageWrapper) return;
        this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector('.product-form__error-message');

        this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);

        if (errorMessage) {
          this.errorMessage.textContent = errorMessage;
        }
      }

      toggleSubmitButton(disable = true, text) {
        //KEEP
        if (disable) {
          this.submitButton.setAttribute('disabled', 'disabled');
          if (text) this.submitButtonText.textContent = text;
        } else {
          this.submitButton.removeAttribute('disabled');
          this.submitButtonText.textContent = window.variantStrings.addToCart;
        }
      }

      get variantIdInput() {
        //KEEP
        return this.form.querySelector('[name=id]');
      }

      getVariantData() {
        this.variantData = this.variantData || JSON.parse(this.querySelector('[type="application/json"]').textContent);
        return this.variantData;
      }
      formatMoney(cents) {
        // Shopify's money filter does *not* work in JS. We need our own.
        if (typeof cents === 'string') {
          cents = cents.replace('.', '');
        }
        let value = '';
        const placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
        const formatString = window.moneyFormat; // Defined by Shopify in theme.liquid

        function formatWithDelimiters(number, precision = 2, thousands = ',', decimal = '.') {
          if (isNaN(number) || number == null) {
            return 0;
          }

          number = (number / 100.0).toFixed(precision);

          let parts = number.split('.');
          const dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands);
          const cents = parts[1] ? decimal + parts[1] : '';

          return dollars + cents;
        }

        switch (formatString.match(placeholderRegex)[1]) {
          case 'amount':
            value = formatWithDelimiters(cents, 2);
            break;
          case 'amount_no_decimals':
            value = formatWithDelimiters(cents, 0);
            break;
          case 'amount_with_comma_separator':
            value = formatWithDelimiters(cents, 2, '.', ',');
            break;
          case 'amount_no_decimals_with_comma_separator':
            value = formatWithDelimiters(cents, 0, '.', ',');
            break;
        }

        return formatString.replace(placeholderRegex, value);
      }
    }
  );
}
