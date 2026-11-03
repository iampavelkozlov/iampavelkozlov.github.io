import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { test } from 'node:test'
import { compileTemplate, parse } from 'vue/compiler-sfc'

test('шаблоны сайта и локальной админки компилируются', async () => {
  for (const directory of ['src', 'admin']) {
    const root = new URL(`../${directory}/`, import.meta.url)
    for (const file of await readdir(root, { recursive: true })) {
      if (!file.endsWith('.vue')) continue
      const filename = `${directory}/${file}`
      const { descriptor, errors } = parse(await readFile(new URL(file, root), 'utf8'), {
        filename,
      })
      assert.deepEqual(errors, [], filename)
      if (!descriptor.template) continue
      const template = compileTemplate({
        filename,
        id: filename,
        source: descriptor.template.content,
        compilerOptions: { expressionPlugins: ['typescript'] },
      })
      assert.deepEqual(template.errors, [], filename)
    }
  }
})
