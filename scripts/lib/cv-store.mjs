import { createHash, randomUUID } from 'node:crypto'
import { readFile, rename, unlink, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { validateCv } from '../../src/lib/validate-cv.ts'
import { syncCompanyLogos } from './company-logos.mjs'

const run = promisify(execFile)
export const dataPath = 'src/data/cv.json'
const hash = text => createHash('sha256').update(text).digest('hex')
export async function readCv(root) {
  const raw = await readFile(resolve(root, dataPath), 'utf8')
  return { data: JSON.parse(raw), revision: hash(raw) }
}
export async function saveCv(root, data, revision) {
  const errors = validateCv(data)
  if (errors.length) throw Object.assign(new Error(errors.join('\n')), { status: 422 })
  const current = await readCv(root)
  if (current.revision !== revision) throw Object.assign(new Error('Файл изменился вне этой вкладки. Перезагрузите админку, прежде чем продолжить.'), { status: 409 })
  data = structuredClone(data)
  const warnings = await syncCompanyLogos(data, current.data)
  if ((await readCv(root)).revision !== revision) throw Object.assign(new Error('Файл изменился во время загрузки иконок. Перезагрузите админку.'), { status: 409 })
  const raw = JSON.stringify(data, null, 2) + '\n'
  const target = resolve(root, dataPath)
  const temporary = `${target}.${randomUUID()}.tmp`
  try {
    await writeFile(temporary, raw, { flag: 'wx' })
    await rename(temporary, target)
  } finally { await unlink(temporary).catch(() => {}) }
  return { revision: hash(raw), data, warnings }
}
export async function publishCv(root) {
  const git = async (...args) => (await run('git', args, { cwd: root, timeout: 60_000, maxBuffer: 1024 * 1024, env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_SSH_COMMAND: 'ssh -o BatchMode=yes -o ConnectTimeout=15' } })).stdout.trim()
  const branch = await git('symbolic-ref', '--quiet', '--short', 'HEAD')
  if (!branch) throw new Error('Выберите ветку Git перед публикацией')
  await git('rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}')
  if (await git('status', '--porcelain', '--', dataPath)) {
    // --only сохраняет чужие staged-изменения и коммитит только файл резюме.
    await git('add', '--', dataPath)
    await git('commit', '--only', '-m', 'Update CV data', '--', dataPath)
  }
  // Без force и pull: при ошибке push локальный коммит остаётся для повторной попытки.
  await git('push')
  return { commit: await git('rev-parse', '--short', 'HEAD'), branch }
}
