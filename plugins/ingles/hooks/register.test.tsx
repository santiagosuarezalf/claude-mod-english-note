// Pruebas de la banda, contra el engine: `claude plugin test plugins/ingles`
import { expect, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On } from 'claude-code'

const NOTA = { english: 'Yes, you can push them now.', tip: '"Subirlos" here is "push them", not "upload them".' }

/** Lo que está debajo del mod: el modelo (con la respuesta que se le dé) y lo que dibuja el engine. */
function mundo (on: On, responder: (prompt: string) => string | null = () => JSON.stringify(NOTA)) {
  const pedidos: { model: string; prompt: string }[] = []
  on('model.complete', ($, e) => {
    pedidos.push({ model: e.model, prompt: e.prompt })
    const texto = responder(e.prompt)
    return (texto === null
      ? { value: { isAnswered: false, reason: 'api-error', usage: {} } }
      : { value: { isAnswered: true, text: texto, usage: {} } }) as never
  })
  on('prompt.submit', ($, e) => ({ text: e.text }) as never)
  on('ui.render', ($, e) => {
    const { Box } = $.ui.resolve(e)
    return <Box key="engine" />
  })
  return { pedidos }
}

const enviar = ($: Engine, text: string) => $.prompt.submit({ text } as never)
const banda = ($: Engine) =>
  $.ui.mount({
    plugin: 'ingles',
    surface: 'terminal',
    component: 'AbovePrompt',
    props: { hasSurvey: false, bodyColumns: 150 } as never,
    viewport: { columns: 160, rows: 40 },
  })

/** El texto de cada renglón que dibujó la banda, en orden; lo del engine sale como «[engine]». */
async function renglones (ui: Awaited<ReturnType<typeof banda>>) {
  type Nodo = string | { type?: string; children?: Nodo[] }
  const plano = (n: Nodo): string => (typeof n === 'string' ? n : (n.children ?? []).map(plano).join(''))
  const raiz = await ui.find({ type: 'Box' })
  return ((raiz?.children ?? []) as Nodo[]).map(h => (typeof h !== 'string' && h.type === 'Box' ? '[engine]' : plano(h)))
}

test('sin mensajes todavía, la banda es la del engine', async ($, on) => {
  mundo(on)
  const ui = await banda($)
  expect(await ui.find({ key: 'engine' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /English/ })).toBeUndefined()
})

test('cada mensaje deja English y Tip en dos renglones, encima de lo que ya había', async ($, on) => {
  const m = mundo(on)
  await enviar($, 'si ya puedes subirlos [Image #18]')
  await new Promise(r => setTimeout(r, 20))
  const ui = await banda($)
  const r = await renglones(ui)
  expect(r[0]).toBe(`📝 English: ${NOTA.english}`)
  expect(r[1]).toBe(`💡 Tip: ${NOTA.tip}`)
  expect(r[r.length - 1]).toBe('[engine]')
  // Va con el modelo de la opción y sin el marcador de la imagen
  expect(m.pedidos).toEqual([{ model: 'haiku', prompt: 'si ya puedes subirlos' }])
})

test('los dos renglones van del color de la opción (cian por defecto)', async ($, on) => {
  mundo(on)
  await enviar($, 'me gusta ahora si')
  await new Promise(r => setTimeout(r, 20))
  const ui = await banda($)
  const textos = await ui.findAll({ type: 'Text' })
  expect(textos.length).toBeGreaterThan(0)
  for (const t of textos) expect(t.props.color).toBe('cyan')
})

test('un mensaje nuevo reemplaza la nota anterior', async ($, on) => {
  mundo(on, p => JSON.stringify({ english: `EN: ${p}`, tip: `TIP: ${p}` }))
  await enviar($, 'primero')
  await new Promise(r => setTimeout(r, 20))
  await enviar($, 'segundo')
  await new Promise(r => setTimeout(r, 20))
  const r = await renglones(await banda($))
  expect(r[0]).toBe('📝 English: EN: segundo')
  expect(r.join('\n')).not.toContain('primero')
})

test('los comandos no se corrigen', async ($, on) => {
  const m = mundo(on)
  await $.prompt.submit({ text: '/cierre', command: { name: 'cierre', args: '' } } as never)
  await new Promise(r => setTimeout(r, 20))
  expect(m.pedidos).toEqual([])
})

test('si el modelo falla, lo dice en un renglón y no rompe la banda', async ($, on) => {
  mundo(on, () => null)
  await enviar($, 'hola')
  await new Promise(r => setTimeout(r, 20))
  const r = await renglones(await banda($))
  expect(r[0]).toContain('no se pudo generar')
  expect(r[r.length - 1]).toBe('[engine]')
})
