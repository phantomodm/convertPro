// tailwind.config.js
module.exports = {
  content: [
    './templates/**/*.liquid',
    './sections/**/*.liquid',
    './snippets/**/*.liquid',
    './layout/**/*.liquid',
    './assets/**/*.js',
  ],
  theme: {
    screens: {
      sm: '750px', // Dawn's small breakpoint
      md: '990px', // Dawn's medium breakpoint
      // No need for larger breakpoints; Tailwind handles them automatically
    },
    extend: {
      colors: {
        background: 'var(--tw-color-background)',
        'background-gradient': 'var(--tw-color-background-gradient)',
        text: 'var(--tw-color-text)',
        button: 'var(--tw-color-button)',
        'button-label': 'var(--tw-color-button-label)',
        'secondary-button-label': 'var(--tw-color-secondary-button-label)',
        shadow: 'var(--tw-color-shadow)',
        'footer-background': 'var(--tw-footer-background-color)', // Added
        'footer-text': 'var(--tw-footer-text-color)', // Added
        'sale-badge-background': 'var(--tw-sale-badge-background-color)', // Added
        'sale-badge-text': 'var(--tw-sale-badge-text-color)', // Added
        'error-message': 'var(--tw-error-message-color)', // Added
      },
      fontFamily: {
        header: 'var(--tw-font-family-header)',
        body: 'var(--tw-font-family-body)',
      },
      fontWeight: {
        header: 'var(--tw-font-weight-header)',
        body: 'var(--tw-font-weight-body)',
      },
      fontStyle: {
        header: 'var(--tw-font-style-header)',
        body: 'var(--tw-font-style-body)',
      },
      spacing: {
        'section-desktop': 'var(--tw-spacing-sections-desktop)',
        'section-mobile': 'var(--tw-spacing-sections-mobile)',
        'grid-horizontal-desktop': 'var(--tw-spacing-grid-horizontal-desktop)',
        'grid-vertical-desktop': 'var(--tw-spacing-grid-vertical-desktop)',
        'grid-horizontal-mobile': 'var(--tw-spacing-grid-horizontal-mobile)',
        'grid-vertical-mobile': 'var(--tw-spacing-grid-vertical-mobile)',
      },
      maxWidth: {
        page: 'var(--tw-page-width)',
      },
      borderRadius: {
        button: 'var(--tw-button-radius)',
        'variant-pill': 'var(--tw-variant-pill-radius)',
        input: 'var(--tw-input-radius)',
        card: 'var(--tw-card-radius)',
        media: 'var(--tw-media-radius)',
        popup: 'var(--tw-popup-radius)',
        badge: 'var(--tw-badge-radius)',
      },
      borderWidth: {
        button: 'var(--tw-button-border-thickness)',
        'variant-pill': 'var(--tw-variant-pill-border-thickness)',
        input: 'var(--tw-input-border-thickness)',
        card: 'var(--tw-card-border-thickness)',
        media: 'var(--tw-media-border-thickness)',
        popup: 'var(--tw-popup-border-thickness)',
        drawer: 'var(--tw-drawer-border-thickness)',
      },
      boxShadow: {
        button: `var(--tw-button-shadow-horizontal-offset) var(--tw-button-shadow-vertical-offset) var(--tw-button-shadow-blur) hsl(var(--tw-color-shadow) / var(--tw-button-shadow-opacity))`,
        'variant-pill': `var(--tw-variant-pill-shadow-horizontal-offset) var(--tw-variant-pill-shadow-vertical-offset) var(--tw-variant-pill-shadow-blur) hsl(var(--tw-color-shadow) / var(--tw-variant-pill-shadow-opacity))`,
        input: `var(--tw-input-shadow-horizontal-offset) var(--tw-input-shadow-vertical-offset) var(--tw-input-shadow-blur) hsl(var(--tw-color-shadow) / var(--tw-input-shadow-opacity))`,
        card: `var(--tw-card-shadow-horizontal-offset) var(--tw-card-shadow-vertical-offset) var(--tw-card-shadow-blur) hsl(var(--tw-color-shadow) / var(--tw-card-shadow-opacity))`,
        media: `var(--tw-media-shadow-horizontal-offset) var(--tw-media-shadow-vertical-offset) var(--tw-media-shadow-blur) hsl(var(--tw-color-shadow) / var(--tw-media-shadow-opacity))`,
        popup: `var(--tw-popup-shadow-horizontal-offset) var(--tw-popup-shadow-vertical-offset) var(--tw-popup-shadow-blur) hsl(var(--tw-color-shadow) / var(--tw-popup-shadow-opacity))`,
        drawer: `var(--tw-drawer-shadow-horizontal-offset) var(--tw-drawer-shadow-vertical-offset) var(--tw-drawer-shadow-blur) hsl(var(--tw-color-shadow) / var(--tw-drawer-shadow-opacity))`,
      },
      opacity: {
        'button-border': 'var(--tw-button-border-opacity)',
        'variant-pill-border': 'var(--tw-variant-pill-border-opacity)',
        'input-border': 'var(--tw-input-border-opacity)',
        'card-border': 'var(--tw-card-border-opacity)',
        'media-border': 'var(--tw-media-border-opacity)',
        'popup-border': 'var(--tw-popup-border-opacity)',
        'drawer-border': 'var(--tw-drawer-border-opacity)',
      },
      fontSize: {
        heading: 'calc(var(--font-size-base) * var(--tw-heading-scale))',
        body: 'calc(var(--font-size-base) * var(--tw-body-scale))',
      },
    },
  },
  prefix: 'tw-',
  plugins: [require('@tailwindcss/typography')],
};
