import globalData from '@csstools/postcss-global-data'
import customMedia from 'postcss-custom-media'

// A single source for the responsive breakpoint: `@custom-media --desktop` is defined
// once in src/styles/media.css and made available to every CSS module via global-data.
// Author styles mobile-first, then add the desktop layer inside `@media (--desktop)`.
export default {
  plugins: [
    globalData({ files: ['src/styles/media.css'] }),
    customMedia(),
  ],
}
