// postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    ...(process.env.NODE_ENV === 'production'
      ? {
          '@fullhuman/postcss-purgecss': {
            content: [
              './templates/**/*.liquid',
              './sections/**/*.liquid',
              './snippets/**/*.liquid',
              './layout/**/*.liquid',
              './node_modules/swiper/**/*.js',
              './node_modules/zooming/**/*.js',
            ],
            defaultExtractor: (content) => content.match(/[\w-/:]+(?<!:)/g) || [], //Important for tailwind
          },
          cssnano: {},
        }
      : {}),
  },
};
