import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { devPdfPlugin } from './scripts/pdf.mjs'
import { readFile } from 'node:fs/promises'
import { withCvMetadata } from './scripts/metadata.ts'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    vue(),
    devPdfPlugin(),
    {
      name: 'cv-metadata',
      transformIndexHtml: {
        order: 'pre',
        async handler(html) {
          if (!html.includes('<div id="app"></div>')) return html
          const data = JSON.parse(
            await readFile(new URL('./src/data/cv.json', import.meta.url), 'utf8'),
          )
          return withCvMetadata(html, data)
        },
      },
    },
  ],
})
