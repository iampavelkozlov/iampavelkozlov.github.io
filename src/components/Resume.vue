<script setup lang="ts">
import CvHeader from './CvHeader.vue'
import DownloadButton from './DownloadButton.vue'
import ExperienceEntry from './ExperienceEntry.vue'
import SectionTitle from './SectionTitle.vue'
import ThemeToggle from './ThemeToggle.vue'
import type { CvData } from '../types/cv'

defineProps<{ cv: CvData; now: Date }>()

const assetUrl = (fileName: string) => `${import.meta.env.BASE_URL}${fileName}`
</script>

<template>
  <div class="page-shell">
    <header class="page-actions" aria-label="Действия с резюме">
      <DownloadButton :href="assetUrl('CV.pdf')" />
      <ThemeToggle />
    </header>

    <main class="resume" aria-labelledby="resume-name">
      <CvHeader
        :name="cv.name"
        :role="cv.role"
        :photo-src="assetUrl(cv.photo)"
        :contacts="cv.contacts"
      />

      <section class="resume-section">
        <SectionTitle>Мои достижения</SectionTitle>
        <div class="profile-copy">
          <p v-for="paragraph in cv.summary" :key="paragraph">{{ paragraph }}</p>
        </div>

        <div class="stack-block">
          <h3>Стек технологий</h3>
          <ul class="technology-tags" aria-label="Стек технологий">
            <li v-for="technology in cv.technologyStack" :key="technology">{{ technology }}</li>
          </ul>
        </div>
      </section>

      <section class="resume-section experience-section">
        <SectionTitle>Опыт работы</SectionTitle>
        <div class="experience-timeline">
          <ExperienceEntry
            v-for="experience in cv.experience"
            :key="`${experience.company}-${experience.startDate}`"
            :experience="experience"
            :now="now"
          />
        </div>
      </section>

      <section class="resume-section additional-section">
        <SectionTitle>Дополнительная информация</SectionTitle>

        <div class="additional-grid">
          <article>
            <h3>Образование</h3>
            <p v-for="line in cv.education" :key="line">{{ line }}</p>
          </article>

          <article>
            <h3>Языки</h3>
            <p v-for="language in cv.languages" :key="language">{{ language }}</p>
          </article>
        </div>
      </section>
    </main>
    <footer class="site-footer">
      Сделано через мой
      <a href="https://github.com/iampavelkozlov/iampavelkozlov.github.io" target="_blank" rel="noopener noreferrer">конструктор резюме</a>
    </footer>
  </div>
</template>
