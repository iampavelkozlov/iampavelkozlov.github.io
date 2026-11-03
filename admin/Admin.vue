<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import type { CvData } from '../src/types/cv'
import { formatDuration } from '../src/lib/experience'
import { validateCv } from '../src/lib/validate-cv'
import TextList from './TextList.vue'

const draft = ref<CvData>()
const ready = ref(false)
const status = ref('Загрузка…')
const error = ref('')
const publishing = ref(false)
const generatingPdf = ref(false)
const pdfUrl = ref('')
const preview = ref<HTMLIFrameElement>()
const narrow = ref(false)
const version = ref(0)
const savedVersion = ref(0)
let revision = ''
let token = ''
let timer: ReturnType<typeof setTimeout>
let pending: Promise<void> | undefined
let applyingLogos = false
const errors = computed(() => draft.value ? validateCv(draft.value) : [])
const dirty = computed(() => savedVersion.value !== version.value)
const icons = { phone: 'Телефон', email: 'Почта', telegram: 'Telegram', link: 'Ссылка', location: 'Город' }

function sendPreview() {
  if (draft.value) preview.value?.contentWindow?.postMessage({ type: 'cv-preview', data: JSON.parse(JSON.stringify(draft.value)) }, location.origin)
}
function resetPdf() { if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value); pdfUrl.value = '' }
watch(draft, () => {
  if (!ready.value || applyingLogos) return
  version.value++
  error.value = ''
  resetPdf()
  sendPreview()
  clearTimeout(timer)
  status.value = errors.value.length ? 'Заполните поля — файл пока не изменён' : 'Есть изменения…'
  if (!errors.value.length) timer = setTimeout(() => { void save().catch(() => {}) }, 600)
}, { deep: true, flush: 'sync' })

async function request(path: string, method: string, data: unknown) {
  const response = await fetch(path, { method, headers: { 'Content-Type': 'application/json', 'X-CV-Admin': token }, body: JSON.stringify(data) })
  const result = await response.json()
  if (result.revision) revision = result.revision
  if (!response.ok) throw new Error(result.error || 'Ошибка сервера')
  return result
}
function applyLogos(data: CvData) {
  applyingLogos = true
  try {
    for (const job of draft.value!.experience) {
      const saved = data.experience.find(item => item.companyUrl === job.companyUrl)
      if (saved?.companyLogo && job.companyUrl) job.companyLogo = saved.companyLogo
      else if (saved || !job.companyUrl) delete job.companyLogo
    }
  } finally { applyingLogos = false }
  sendPreview()
}
function save(): Promise<void> {
  clearTimeout(timer)
  if (pending) return pending
  pending = (async () => {
    try {
      let warnings: string[] = []
      while (dirty.value) {
        if (errors.value.length) throw new Error('Исправьте незаполненные поля перед сохранением')
        const current = version.value
        const snapshot = JSON.parse(JSON.stringify(draft.value))
        status.value = 'Сохраняю файл и логотипы…'
        const result = await request('/api/cv', 'PUT', { data: snapshot, revision })
        applyLogos(result.data)
        warnings = result.warnings || []
        savedVersion.value = current
      }
      status.value = warnings.length ? `Файл сохранён. Иконка не найдена: ${warnings.join(', ')} — оставлен портфельчик` : 'Файл сохранён локально'
      error.value = ''
    } catch (cause) { error.value = (cause as Error).message; status.value = 'Не удалось сохранить'; throw cause }
  })().finally(() => { pending = undefined })
  return pending
}
async function publish() {
  if (errors.value.length || publishing.value) return
  publishing.value = true
  error.value = ''
  try {
    await save()
    status.value = 'Коммит и push…'
    const result = await request('/api/publish', 'POST', { data: draft.value, revision })
    applyLogos(result.data)
    status.value = `Отправлено в Git: ${result.branch} · ${result.commit}`
  } catch (cause) { error.value = (cause as Error).message; status.value = 'Отправка не завершена' }
  finally { publishing.value = false }
}
async function showPdf() {
  generatingPdf.value = true
  const current = version.value
  try {
    await save()
    const response = await fetch('/CV.pdf')
    if (!response.ok) throw new Error(await response.text())
    const blob = await response.blob()
    if (current !== version.value) throw new Error('Резюме изменилось. Откройте PDF ещё раз.')
    resetPdf()
    pdfUrl.value = URL.createObjectURL(blob)
  } catch (cause) { error.value = (cause as Error).message }
  finally { generatingPdf.value = false }
}
function moveJob(index: number, offset: number) {
  const jobs = draft.value!.experience
  const job = jobs.splice(index, 1)[0]!
  jobs.splice(index + offset, 0, job)
}
function addJob() {
  draft.value!.experience.unshift({ company: '', role: '', startDate: '', endDate: null, description: '', groups: [{ title: '', highlights: [''] }] })
}
const beforeUnload = (event: BeforeUnloadEvent) => { if (dirty.value || publishing.value) event.preventDefault() }
const receive = (event: MessageEvent) => {
  if (event.origin === location.origin && event.source === preview.value?.contentWindow && event.data?.type === 'cv-preview-ready') sendPreview()
}
onMounted(async () => {
  window.addEventListener('beforeunload', beforeUnload)
  window.addEventListener('message', receive)
  try {
    const response = await fetch('/api/cv')
    if (!response.ok) throw new Error('Не удалось загрузить данные')
    const result = await response.json()
    draft.value = result.data; revision = result.revision; token = result.token
    ready.value = true
    status.value = 'Файл сохранён локально'
    sendPreview()
  } catch (cause) { error.value = (cause as Error).message }
})
onUnmounted(() => { clearTimeout(timer); resetPdf(); window.removeEventListener('beforeunload', beforeUnload); window.removeEventListener('message', receive) })
</script>

<template>
  <div class="admin-shell">
    <header class="admin-toolbar">
      <div><p class="eyebrow">ЛОКАЛЬНО · CV.JSON</p><h1>Редактор резюме</h1><p role="status" aria-live="polite">{{ status }}</p></div>
      <button class="primary" :disabled="!ready || !!errors.length || publishing || generatingPdf" @click="publish">{{ publishing ? 'Отправляю…' : 'Сохранить и отправить в Git' }}</button>
    </header>
    <div v-if="error" class="error-banner" role="alert">{{ error }} <button v-if="dirty && !errors.length" @click="save().catch(() => {})">Повторить запись</button></div>
    <div class="admin-layout">
      <form v-if="draft" class="editor" @submit.prevent="publish">
        <p class="editor-hint">Изменения автоматически записываются в файл через 0,6 секунды. Кнопка сверху создаёт коммит и делает push в текущую ветку.</p>
        <div v-if="errors.length" class="validation" role="alert"><p v-for="message in errors" :key="message">{{ message }}</p></div>
        <fieldset :disabled="publishing || generatingPdf">
          <details open class="editor-section"><summary>Основное</summary><div class="section-fields">
            <label>Имя<input v-model="draft.name" /></label>
            <label>Должность<input v-model="draft.role" /></label>
            <label>Фотография (путь в public)<input v-model="draft.photo" /></label>
          </div></details>
          <details class="editor-section"><summary>Контакты</summary><div class="section-fields">
            <div v-for="(contact, index) in draft.contacts" :key="index" class="nested-card">
              <label>Иконка<select v-model="contact.icon"><option v-for="(label, value) in icons" :key="value" :value="value">{{ label }}</option></select></label>
              <label>Подпись<input v-model="contact.label" /></label>
              <label>Ссылка<input v-model="contact.href" placeholder="https://, mailto: или tel:" /></label>
              <button type="button" class="danger" @click="draft.contacts.splice(index, 1)">Удалить контакт</button>
            </div>
            <button type="button" class="add-button" @click="draft.contacts.push({ icon: 'link', label: '', href: '' })">+ Контакт</button>
          </div></details>
          <details class="editor-section"><summary>Мои достижения</summary><div class="section-fields"><TextList v-model="draft.summary" label="Абзац" /></div></details>
          <details class="editor-section"><summary>Стек технологий</summary><div class="section-fields"><TextList v-model="draft.technologyStack" label="Технология" /></div></details>
          <section class="jobs-section"><div class="section-heading"><h2>Опыт работы</h2><button type="button" @click="addJob">+ Работа</button></div>
            <details v-for="(job, index) in draft.experience" :key="index" class="editor-section job-card" open>
              <summary><span class="job-number">{{ String(index + 1).padStart(2, '0') }}</span> {{ job.company || 'Новая работа' }}</summary>
              <div class="section-fields">
                <div class="row-actions"><button type="button" :disabled="index === 0" @click="moveJob(index, -1)">↑ Выше</button><button type="button" :disabled="index === draft.experience.length - 1" @click="moveJob(index, 1)">↓ Ниже</button><button type="button" class="danger" @click="draft.experience.splice(index, 1)">Удалить работу</button></div>
                <label>Компания<input v-model="job.company" /></label>
                <label>Сайт компании (необязательно)<input v-model="job.companyUrl" type="url" placeholder="https://company.com" @input="delete job.companyLogo" /></label>
                <p class="duration-hint">Favicon загрузится при сохранении. Без сайта или доступной иконки останется портфельчик.</p>
                <label>Должность<input v-model="job.role" /></label>
                <div class="date-fields"><label>Начало<input v-model="job.startDate" type="month" /></label><label v-if="job.endDate !== null">Окончание<input v-model="job.endDate" type="month" :min="job.startDate" /></label></div>
                <label class="checkbox"><input type="checkbox" :checked="job.endDate === null" @change="job.endDate = ($event.target as HTMLInputElement).checked ? null : job.startDate" />Работаю сейчас</label>
                <p class="duration-hint">{{ formatDuration(job.startDate, job.endDate) }}</p>
                <label>Описание компании<textarea v-model="job.description" rows="3" /></label>
                <div v-for="(group, groupIndex) in job.groups" :key="groupIndex" class="nested-card">
                  <label>Команда / проект (необязательно)<input v-model="group.title" /></label>
                  <TextList v-model="group.highlights" label="Достижение" />
                  <button type="button" class="danger" @click="job.groups.splice(groupIndex, 1)">Удалить команду / проект</button>
                </div>
                <button type="button" class="add-button" @click="job.groups.push({ title: '', highlights: [''] })">+ Команда / проект</button>
              </div>
            </details>
          </section>
          <details class="editor-section"><summary>Образование</summary><div class="section-fields"><TextList v-model="draft.education" label="Строка образования" /></div></details>
          <details class="editor-section"><summary>Языки</summary><div class="section-fields"><TextList v-model="draft.languages" label="Язык" /></div></details>
        </fieldset>
      </form>
      <aside class="preview-panel">
        <div class="preview-toolbar"><h2>Предпросмотр</h2><div class="row-actions"><button :aria-pressed="!pdfUrl && !narrow" @click="resetPdf(); narrow = false">Веб</button><button :aria-pressed="!pdfUrl && narrow" @click="resetPdf(); narrow = true">Мобильный</button><button :disabled="!ready || !!errors.length || generatingPdf || publishing" @click="showPdf">{{ generatingPdf ? 'Генерация…' : 'PDF' }}</button></div></div>
        <iframe v-show="!pdfUrl" ref="preview" class="preview-frame" :class="{ narrow }" src="/admin/preview.html" title="Предпросмотр сайта" @load="sendPreview" />
        <iframe v-if="pdfUrl" class="preview-frame" :src="pdfUrl" title="Предпросмотр PDF" />
      </aside>
    </div>
  </div>
</template>
