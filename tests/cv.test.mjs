import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { execFile } from 'node:child_process'
import { formatDuration, formatPeriod } from '../src/lib/experience.ts'
import { validateCv } from '../src/lib/validate-cv.ts'
import { dataPath, readCv, saveCv, publishCv } from '../scripts/lib/cv-store.mjs'

const original = JSON.parse(await readFile(new URL('../src/data/cv.json', import.meta.url), 'utf8'))
const run = promisify(execFile)

test('периоды, включённые месяцы, текущая работа и склонения', () => {
  assert.equal(formatPeriod('2021-02', '2025-08'), 'Февраль 2021 — Август 2025')
  assert.equal(formatPeriod('2025-10', null), 'Октябрь 2025 — Настоящее время')
  for (const [start, end, expected] of [
    ['2021-02', '2025-08', '4 года 7 месяцев'],
    ['2025-01', '2025-01', '1 месяц'],
    ['2024-01', '2024-12', '1 год'],
    ['2020-01', '2024-12', '5 лет'],
    ['2025-01', '2025-04', '4 месяца'],
    ['2025-01', '2025-11', '11 месяцев'],
    ['2021-01', '2020-12', ''],
    ['', null, ''],
    ['2025-13', null, ''],
  ])
    assert.equal(formatDuration(start, end), expected)
  assert.equal(formatDuration('2025-10', null, new Date(2026, 10, 3)), '1 год 2 месяца')
  assert.equal(formatDuration('2027-01', null, new Date(2026, 10, 3)), '')
})

test('проверка данных блокирует перевёрнутые даты и исполняемые ссылки', () => {
  assert.deepEqual(validateCv(original), [])
  const invalid = structuredClone(original)
  invalid.experience[0].endDate = '2020-01'
  invalid.contacts[0].href = 'javascript:alert(1)'
  assert.equal(validateCv(invalid).length, 2)
  assert.ok(validateCv(null).length)
  assert.ok(validateCv({}).length)
})

test('атомарная запись и отказ при конфликте или некорректных данных', async () => {
  const root = await mkdtemp(join(tmpdir(), 'cv-store-'))
  try {
    await mkdir(join(root, 'src/data'), { recursive: true })
    await writeFile(join(root, dataPath), JSON.stringify(original))
    const first = await readCv(root)
    const next = structuredClone(original)
    next.name = 'Новое имя'
    const saved = await saveCv(root, next, first.revision)
    assert.equal((await readCv(root)).data.name, 'Новое имя')
    await assert.rejects(saveCv(root, original, first.revision), { status: 409 })
    await assert.rejects(saveCv(root, {}, saved.revision), { status: 422 })
    assert.equal((await readCv(root)).revision, saved.revision)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('публикация коммитит только данные, сохраняет чужой index и повторяет push после ошибки', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'cv-git-'))
  const root = join(temp, 'work')
  const remote = join(temp, 'remote.git')
  const git = async (...args) =>
    (await run('git', ['-c', 'commit.gpgsign=false', ...args], { cwd: root })).stdout.trim()
  try {
    await mkdir(root)
    await run('git', ['init', '--bare', remote])
    await git('init', '-b', 'main')
    await git('config', 'user.email', 'test@example.com')
    await git('config', 'user.name', 'CV test')
    await git('config', 'commit.gpgsign', 'false')
    await writeFile(join(root, 'unrelated.txt'), 'before\n')
    await git('add', '.')
    await git('commit', '-m', 'Initial')
    await git('remote', 'add', 'origin', remote)
    await git('push', '-u', 'origin', 'main')
    await mkdir(join(root, 'src/data'), { recursive: true })
    await writeFile(join(root, dataPath), JSON.stringify(original))
    await writeFile(join(root, 'unrelated.txt'), 'after\n')
    await git('add', 'unrelated.txt')
    const published = await publishCv(root)
    assert.equal(published.branch, 'main')
    assert.equal(await git('show', '--format=', '--name-only', 'HEAD'), dataPath)
    assert.equal(await git('diff', '--cached', '--name-only'), 'unrelated.txt')
    assert.equal(await git('rev-parse', 'HEAD'), await git('rev-parse', 'origin/main'))
    await writeFile(join(root, dataPath), JSON.stringify({ ...original, name: 'Updated' }))
    await git('remote', 'set-url', 'origin', join(temp, 'missing.git'))
    await assert.rejects(publishCv(root))
    const committed = await git('rev-parse', 'HEAD')
    await git('remote', 'set-url', 'origin', remote)
    await publishCv(root)
    assert.equal(await git('rev-parse', 'HEAD'), committed)
    assert.equal(await git('rev-parse', 'origin/main'), committed)
  } finally {
    await rm(temp, { recursive: true, force: true })
  }
})

test('метаданные берутся из данных и экранируют HTML', async () => {
  const { withCvMetadata } = await import('../scripts/metadata.ts')
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8')
  const data = structuredClone(original)
  data.name = 'Тест <имя> & проверка'
  data.summary[0] = 'Описание "резюме" </script>'
  const rendered = withCvMetadata(html, data)
  assert.ok(rendered.includes('<title>Тест &lt;имя&gt; &amp; проверка —'))
  assert.ok(rendered.includes('content="Описание &quot;резюме&quot; &lt;/script&gt;"'))
  const schema = JSON.parse(
    rendered.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1],
  )
  assert.equal(schema['@graph'][1].mainEntity.name, data.name)
  assert.equal(schema['@graph'][1].description, data.summary[0])
})

test('группы контактов сохраняют старую автоматическую классификацию и ручной выбор', async () => {
  const { getContactGroup } = await import('../src/lib/contacts.ts')
  assert.equal(getContactGroup({ icon: 'telegram' }), 'contact')
  assert.equal(getContactGroup({ icon: 'link' }), 'profile')
  assert.equal(getContactGroup({ icon: 'github' }), 'profile')
  assert.equal(getContactGroup({ icon: 'link', group: 'contact' }), 'contact')
  assert.equal(getContactGroup({ icon: 'phone', group: 'profile' }), 'profile')
})
