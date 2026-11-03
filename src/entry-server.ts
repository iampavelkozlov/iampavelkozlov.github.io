import { renderToString } from '@vue/server-renderer'
import { createSSRApp } from 'vue'
import Resume from './components/Resume.vue'
import { cv } from './data/cv'
import type { CvData } from './types/cv'

export const render = (data: CvData = cv) => renderToString(createSSRApp(Resume, { cv: data, now: new Date() }))
