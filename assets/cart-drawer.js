class CartDrawer extends HTMLElement {
  constructor() {
    super();
    this.drawer = this; // The cart drawer element itself.
    this.cartItemsContainer = this.querySelector('#CartDrawer-CartItems'); // Container for cart items
    this.subtotalElement = this.querySelector('.tw-cart-drawer__subtotal-amount'); // Subtotal display
    this.checkoutButton = document.querySelector('[data-cart-checkout]');

    // Event listeners for opening the drawer - MIGHT ALREADY BE HANDLED
    this.setupOpenCloseHandlers();

    // Event listener for updating quantities
    this.cartItemsContainer.addEventListener('click', this.handleQuantityChange.bind(this));
    // Event listener for remove items
    this.cartItemsContainer.addEventListener('click', this.handleRemoveItem.bind(this));
    //Prevent Checkout
    if (this.checkoutButton) this.addCheckoutListener(); //Prevent default if needed.
  }

  setupOpenCloseHandlers() {
    // Get all elements that should trigger opening the drawer
    const openButtons = document.querySelectorAll('[data-drawer-toggle]');

    //Add event listener to the cart and open drawer
    const cartButton = document.querySelector('.header__icon--cart');
    if (cartButton)
      cartButton.addEventListener('click', (event) => {
        event.preventDefault();
        this.openDrawer();
      });

    openButtons.forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent default link behavior
        this.openDrawer();
      });
    });

    // Close drawer when clicking the overlay
    const overlay = this.querySelector('.tw-drawer__overlay');
    if (overlay) {
      overlay.addEventListener('click', this.closeDrawer.bind(this));
    }
    // Close on close button
    const closeButton = this.querySelector('[data-drawer-close]');
    if (closeButton) {
      closeButton.addEventListener('click', this.closeDrawer.bind(this));
    }
  }

  openDrawer() {
    this.drawer.classList.remove('tw-hidden'); // Make sure drawer is visible
    document.body.classList.add('tw-overflow-hidden'); // Prevent body scrolling
    this.drawer.classList.remove('-tw-translate-x-full');
    this.drawer.classList.add('tw-translate-x-0');
    this.drawer.setAttribute('aria-hidden', 'false'); // Update aria-hidden attribute

    //Focus
    const closeButton = this.querySelector('[data-drawer-close]');
    if (closeButton) closeButton.focus();

    // Trap focus within the drawer (accessibility)
    this.trapFocus(this.drawer);
  }

  closeDrawer() {
    this.drawer.classList.add('-tw-translate-x-full');
    this.drawer.classList.remove('tw-translate-x-0');
    this.body.classList.remove('tw-overflow-hidden');
    // Update aria-hidden status
    this.drawer.setAttribute('aria-hidden', 'true');
    // Remove focus trap
    this.removeTrapFocus();
  }

  addCheckoutListener() {
    this.checkoutButton.addEventListener('click', (e) => {
      e.preventDefault(); //Prevent going to checkout.
      window.location.href = this.checkoutButton.href; //Go to checkout.
    });
  }
  handleQuantityChange(event) {
    if (!event.target.classList.contains('tw-cart-drawer__quantity-btn')) {
      return; // Ignore clicks on elements that aren't the quantity buttons
    }

    event.preventDefault();
    const button = event.target;
    const action = button.dataset.action;
    const lineItemContainer = button.closest('.tw-cart-drawer__item');
    const line = parseInt(lineItemContainer.querySelector('.tw-cart-drawer__quantity-input').dataset.index, 10);
    const quantityInput = lineItemContainer.querySelector('.tw-cart-drawer__quantity-input');
    let currentQuantity = parseInt(quantityInput.value, 10);

    if (action === 'increment') {
      currentQuantity += 1;
    } else if (action === 'decrement') {
      currentQuantity = Math.max(0, currentQuantity - 1); // Allow going to 0 to remove item
    }

    // Update the quantity input field
    quantityInput.value = currentQuantity;
    // Call updateCart with correct line and quantity
    this.updateCart(line, currentQuantity);
  }

  handleRemoveItem(event) {
    if (!event.target.classList.contains('tw-cart-drawer__remove')) {
      return;
    }

    event.preventDefault();
    const removeButton = event.target;
    const line = parseInt(removeButton.dataset.index, 10);
    this.updateCart(line, 0); // Set quantity to 0 to remove
  }
  updateCart(line, quantity) {
    // Show loading state (optional, but good UX)
    this.drawer.classList.add('tw-loading');

    const body = JSON.stringify({
      line: line,
      quantity: quantity,
      sections: this.getSectionsToRender().map((section) => section.id), //Dawn
      sections_url: window.location.pathname, //Dawn
    });

    window.theme
      .fetch(
        `${routes.cart_change_url}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, body },
        'text'
      )
      .then((responseText) => {
        const html = new DOMParser().parseFromString(responseText, 'text/html'); // Parse the HTML response
        const cartDrawerItemsHTML = html.querySelector('#CartDrawer-CartItems').innerHTML; // Select the innerHTML.

        // Update the cart items container with new HTML
        this.cartItemsContainer.innerHTML = cartDrawerItemsHTML;
        return window.theme.fetch(`${routes.cart_url}.js`); //Get updated cart
      })
      .then((cartData) => {
        this.updateCartCount(cartData.item_count); // Update Cart Count in header
        this.updateSubtotal(cartData.total_price); // Update Cart Subtotal
      })
      .catch((error) => {
        console.error('Error updating cart:', error);
        // Display an error message to the user.
      })
      .finally(() => {
        this.drawer.classList.remove('tw-loading'); // Remove loading state
      });
  }

  getSectionsToRender() {
    //Dawn method
    return [
      {
        id: 'cart-drawer',
        selector: '.tw-drawer__container',
      },
      {
        id: 'cart-icon-bubble', //Dawn id
        selector: '.cart-count-bubble', //Selecting
      },
    ];
  }

  updateCartCount(count) {
    const countElement = document.querySelector('.tw-cart-count');
    if (countElement) {
      countElement.textContent = count;
      // Show/hide the bubble based on the count
      const bubble = document.querySelector('.cart-count-bubble');
      if (bubble) {
        if (count > 0) {
          bubble.classList.remove('tw-hidden');
        } else {
          bubble.classList.add('tw-hidden');
        }
      }
    }
  }

  updateSubtotal(totalPrice) {
    if (this.subtotalElement) this.subtotalElement.textContent = this.formatMoney(totalPrice);
  }

  formatMoney(cents) {
    //Helper Function
    if (typeof cents === 'string') {
      cents = cents.replace('.', '');
    }
    let value = '';
    const placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
    const formatString = window.moneyFormat || '${{amount}}'; // Fallback

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

  trapFocus(container) {
    //Dawn's trap focus
    var focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    var focusableContent = container.querySelectorAll(focusableElements);
    var firstFocusableElement = focusableContent[0];
    var lastFocusableElement = focusableContent[focusableContent.length - 1];
    var KEYCODE_TAB = 9;

    document.addEventListener('keydown', function (e) {
      var isTabPressed = e.key === 'Tab' || e.keyCode === KEYCODE_TAB;

      if (!isTabPressed) {
        return;
      }

      if (e.shiftKey) {
        /* shift + tab */ if (document.activeElement === firstFocusableElement) {
          lastFocusableElement.focus();
          e.preventDefault();
        }
      } /* tab */ else {
        if (document.activeElement === lastFocusableElement) {
          firstFocusableElement.focus();
          e.preventDefault();
        }
      }
    });
  }
  removeTrapFocus = () => {
    //Dawn's remove trap focus
    document.removeEventListener('keydown', {});
  };
}

if (!customElements.get('cart-drawer')) {
  customElements.define('cart-drawer', CartDrawer);
}
