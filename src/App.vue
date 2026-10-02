<script setup lang="ts">
import CvHeader from './components/CvHeader.vue'
import DownloadButton from './components/DownloadButton.vue'
import ExperienceEntry from './components/ExperienceEntry.vue'
import SectionTitle from './components/SectionTitle.vue'
import { cv } from './data/cv'

const assetUrl = (fileName: string) => `${import.meta.env.BASE_URL}${fileName}`
</script>

<template>
  <div class="page-shell">
    <header class="page-actions" aria-label="Действия с резюме">
      <DownloadButton :href="assetUrl('CV.pdf')" />
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
          <p>{{ cv.technologyStack.join(', ') }}</p>
        </div>
      </section>

      <section class="resume-section experience-section">
        <SectionTitle>Опыт работы</SectionTitle>
        <ExperienceEntry
          v-for="experience in cv.experience"
          :key="`${experience.company}-${experience.period}`"
          :experience="experience"
        />
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
  </div>
</template>
