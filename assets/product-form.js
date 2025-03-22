if (!customElements.get('product-form')) {
  customElements.define(
    'product-form',
    class ProductForm extends HTMLElement {
      constructor() {
        super();

        this.form = this.querySelector('form');
        // Only add submit listener if the form exists (it won't on the product card)
        if (this.form) {
          this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
        }
        this.cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
        this.submitButton = this.querySelector('[type="submit"]');
        if (this.submitButton) this.submitButtonText = this.submitButton.querySelector('span'); //Dawn

        if (document.querySelector('cart-drawer') && this.submitButton)
          this.submitButton.setAttribute('aria-haspopup', 'dialog'); //Dawn

        this.hideErrors = this.dataset.hideErrors === 'true'; //Dawn

        // Variant Selection Logic
        this.productId = this.dataset.productId;
        this.variantSelects = this.querySelector('.product-form__variants');
        if (this.variantSelects) {
          this.variantSelects.addEventListener('change', this.onVariantChange.bind(this));
          this.onVariantChange(); // Initialize with the default variant
        }

        // Quantity Logic
        this.quantityInput = this.querySelector('.tw-quantity-input');
        this.quantityButtons = this.querySelectorAll('.tw-quantity-btn');
        if (this.quantityButtons.length) {
          // Check if quantity buttons exist (they won't on the product card)
          this.setupQuantityButtons();
        }

        // Quick Add Button Setup -- No longer in a separate function.
        this.setupQuickAddButtons();
      }
      setupQuickAddButtons() {
        document.querySelectorAll('.quick-add-button').forEach((button) => {
          button.addEventListener('click', this.onQuickAddClick.bind(this));
        });
      }

      onVariantChange() {
        this.updateOptions();
        this.updateMasterId();
        this.updatePrice();
        this.updateAvailability();
        if (this.quantityInput) this.updateQuantityRules(); // Update quantity rules if on product page

        if (!this.currentVariant) {
          this.updateMedia(null);
          return;
        }

        this.updateMedia(this.currentVariant);
        this.updateURL();
      }

      updateOptions() {
        this.options = this.variantSelects
          ? Array.from(this.variantSelects.querySelectorAll('select'), (select) => select.value)
          : []; // Handle no variant selects
      }

      updateMasterId() {
        this.currentVariant = this.getVariantData().find((variant) => {
          return !variant.options
            .map((option, index) => {
              return this.options[index] === option;
            })
            .includes(false);
        });

        // Update the hidden input field with the current variant ID, *only* if on the product page
        if (this.variantIdInput) {
          this.variantIdInput.value = this.currentVariant ? this.currentVariant.id : ''; // Prevent errors if no variant
        }
      }

      updatePrice() {
        if (!this.currentVariant) return;

        const price = this.currentVariant.price;
        const compareAtPrice = this.currentVariant.compare_at_price;
        const priceContainer = this.querySelector('.tw-product-information .tw-text-xl');
        const salePriceContainer = this.querySelector('.tw-product-information .tw-text-red-500');
        const regularPriceContainer = this.querySelector('.tw-product-information .tw-line-through');
        if (compareAtPrice > price) {
          if (salePriceContainer) salePriceContainer.textContent = this.formatMoney(compareAtPrice);
          if (regularPriceContainer) regularPriceContainer.textContent = this.formatMoney(price);
          if (priceContainer) priceContainer.classList.add('tw-hidden');
        } else {
          if (priceContainer) priceContainer.textContent = this.formatMoney(price);
          if (salePriceContainer) salePriceContainer.classList.add('tw-hidden');
          if (regularPriceContainer) regularPriceContainer.classList.add('tw-hidden');
          if (priceContainer) priceContainer.classList.remove('tw-hidden');
        }
      }

      updateMedia(currentVariant) {
        if (!currentVariant || !currentVariant.featured_media) {
          return; // No media to update.
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
        // Thumbnail update
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
        const submitButton = this.querySelector('[type="submit"]'); // Local variable within this method
        if (!this.currentVariant) {
          if (this.submitButton) {
            //Check if exists
            this.submitButton.setAttribute('aria-disabled', true);
            this.submitButtonText.textContent = window.variantStrings.unavailable;
          }
          return;
        }

        if (this.currentVariant.available) {
          if (this.submitButton) {
            //Check if exists
            this.submitButton.removeAttribute('aria-disabled');
            this.submitButtonText.textContent = window.variantStrings.addToCart;
          }
        } else {
          if (this.submitButton) {
            //Check if exists
            this.submitButton.setAttribute('aria-disabled', true);
            this.submitButtonText.textContent = window.variantStrings.soldOut;
          }
        }
      }

      updateURL() {
        if (!this.currentVariant || this.dataset.updateUrl === 'false') return;
        window.history.replaceState(
          {},
          '',
          `<span class="math-inline">\{this\.dataset\.url\}?variant\=</span>{this.currentVariant.id}`
        );
      }

      setupQuantityButtons() {
        if (!this.quantityButtons) return; //Skip if doesn't exist
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
        if (!this.currentVariant || !this.quantityInput) return; // Ensure elements exist

        const maxQuantity = this.currentVariant.inventory_quantity;

        // If inventory management is not by Shopify, or if the product is available, remove max attribute.
        if (this.currentVariant.inventory_management !== 'shopify' || this.currentVariant.available) {
          this.quantityInput.removeAttribute('max');
          return; // Exit the function early
        }

        // If maxQuantity is defined (and we know inventory IS managed by Shopify), set the max.
        if (maxQuantity !== null) {
          this.quantityInput.setAttribute('max', maxQuantity);
          this.quantityInput.value = Math.min(parseInt(this.quantityInput.value, 10), maxQuantity);
        }
        // Make sure the quantity is not less than 1
        this.quantityInput.value = Math.max(1, parseInt(this.quantityInput.value, 10));
      }

      onQuickAddClick(event) {
        event.preventDefault();
        const button = event.currentTarget;
        const productId = button.dataset.productId;
        const variantId = button.dataset.variantId; // Get variant ID from data attribute

        // Disable the button and show loading state
        button.setAttribute('aria-disabled', true);
        //button.classList.add('loading');
        //button.textContent = 'Adding...'; // Or show a spinner, as before
        button.textContent = window.variantStrings.addingToCart || 'Adding...';

        const config = fetchConfig('javascript');
        config.headers['X-Requested-With'] = 'XMLHttpRequest';
        delete config.headers['Content-Type'];

        // Construct FormData for the Quick Add.  Quantity is 1.
        const formData = new FormData();
        formData.append('id', variantId); // Use the variant ID from the data attribute
        formData.append('quantity', 1); // Hardcode quantity to 1 for Quick Add
        formData.append(
          'sections',
          this.cart.getSectionsToRender().map((section) => section.id)
        );
        formData.append('sections_url', window.location.pathname);

        window.theme
          .fetch(`${routes.cart_add_url}`, config)
          .then((response) => response.json())
          .then((response) => {
            // if (response.status) {
            //   // Handle errors (e.g., product out of stock, invalid variant)
            //   console.error('Error adding to cart:', response.description);
            //   alert(response.description); // Basic error display - improve this!
            //   button.textContent = 'Error'; // Or your default "Add to Cart" text
            //   return;
            // }

            // Success! Update the cart
            publish(PUB_SUB_EVENTS.cartUpdate, {
              source: 'quick-add',
              cartData: response,
              productVariantId: variantId,
            });
            if (this.cart) {
              this.cart.renderContents(response); // Update cart drawer/notification
            }
            if (
              typeof theme !== 'undefined' &&
              typeof theme.cart !== 'undefined' &&
              typeof theme.cart.openDrawer === 'function'
            ) {
              //Check for theme
              theme.cart.openDrawer();
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
        if (this.submitButton && this.submitButton.getAttribute('aria-disabled') === 'true') return; // Check for submit button

        this.handleErrorMessage(); // Dawn's error handling

        if (this.submitButton) {
          // Check for submit button
          this.submitButton.setAttribute('aria-disabled', true);
          // this.submitButton.classList.add('loading');
          // if (this.submitButtonText) {
          //   // Use Dawn's element if available
          //   this.submitButtonText.textContent = window.variantStrings.addingToCart || 'Adding...'; // Use translation
          // }
        }
        //this.querySelector('.loading__spinner')?.classList.remove('hidden'); // Use optional chaining

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

        window.theme
          .fetch(`${routes.cart_add_url}`, config)
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
                    this.cart.renderContents(response);
                  });
                },
                { once: true }
              );
              quickAddModal.hide(true);
            } else {
              this.cart.renderContents(response);
              if (
                typeof theme !== 'undefined' &&
                typeof theme.cart !== 'undefined' &&
                typeof theme.cart.openDrawer === 'function'
              ) {
                //Check for theme
                theme.cart.openDrawer(); //Open theme drawer
              }
            }
          })
          .catch((e) => {
            console.error(e);
          })
          .finally(() => {
            //if (this.submitButton) this.submitButton.classList.remove('loading'); // Check for submit button
            if (this.cart && this.cart.classList.contains('is-empty')) this.cart.classList.remove('is-empty');
            if (!this.error && this.submitButton) this.submitButton.removeAttribute('aria-disabled'); // Check for submit button
            //this.querySelector('.loading__spinner')?.classList.add('hidden'); // Use optional chaining
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
          if (this.submitButton) this.submitButton.setAttribute('disabled', 'disabled'); //Check
          if (text && this.submitButtonText) this.submitButtonText.textContent = text; //Check
        } else {
          if (this.submitButton) this.submitButton.removeAttribute('disabled'); //Check
          if (this.submitButtonText) this.submitButtonText.textContent = window.variantStrings.addToCart; //Check
        }
      }

      get variantIdInput() {
        //KEEP
        return this.form ? this.form.querySelector('[name=id]') : null; //Check for form
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
