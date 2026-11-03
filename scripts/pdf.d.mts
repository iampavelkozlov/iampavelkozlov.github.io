import type { Plugin } from 'vite'
export function devPdfPlugin(): Plugin
export function renderPdf(html: string, baseUrl: string): Promise<Buffer>
