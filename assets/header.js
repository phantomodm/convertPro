class MobileNav {
  constructor() {
    this.drawerToggle = document.querySelector('[data-drawer-toggle]');
    this.drawer = document.querySelector('[data-drawer]');
    this.drawerClose = document.querySelector('[data-drawer-close]');
    this.body = document.body; // Get the body element

    if (this.drawerToggle && this.drawer) {
      // Check if elements exist
      this.drawerToggle.addEventListener('click', this.toggleDrawer.bind(this));
      if (this.drawerClose) this.drawerClose.addEventListener('click', this.closeDrawer.bind(this)); // Check if close button exists
    }
  }
  toggleDrawer() {
    this.drawer.classList.toggle('-tw-translate-x-full');
    this.drawer.classList.toggle('tw-translate-x-0'); // Add this class for showing
    this.body.classList.toggle('tw-overflow-hidden'); // Prevent scrolling of the body

    // ARIA attributes for accessibility
    const isExpanded = this.drawerToggle.getAttribute('aria-expanded') === 'true';
    this.drawerToggle.setAttribute('aria-expanded', !isExpanded);
    this.drawer.setAttribute('aria-hidden', isExpanded);
  }
  closeDrawer() {
    this.drawer.classList.add('-tw-translate-x-full'); //Hide
    this.drawer.classList.remove('tw-translate-x-0');
    this.body.classList.remove('tw-overflow-hidden');

    // Restore ARIA attributes
    this.drawerToggle.setAttribute('aria-expanded', false);
    this.drawer.setAttribute('aria-hidden', true);
  }
}

if (!customElements.get('mobile-nav')) {
  customElements.define('mobile-nav', MobileNav);
}
