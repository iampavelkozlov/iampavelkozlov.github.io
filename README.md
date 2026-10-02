# pekozlov-cv

Адаптивная веб-версия резюме Павла Козлова на Vue 3, Vite и TypeScript.

## Локальный запуск

```bash
pnpm install
pnpm dev
```

## Production-сборка

```bash
pnpm build
pnpm preview
```

Vite настроен с относительным `base`, поэтому содержимое каталога `dist` можно публиковать на GitHub Pages без привязки к имени репозитория.

## Структура

- `src/data/cv.ts` — весь текст и данные резюме;
- `src/components/` — поддерживаемые презентационные компоненты;
- `public/CV.pdf` — десктопная PDF-версия для скачивания;
- `public/profile.png` — фотография, извлечённая из исходного PDF.
