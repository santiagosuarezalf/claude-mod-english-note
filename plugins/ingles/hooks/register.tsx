import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Estado } from '../types'
import { leerNota, SISTEMA, textoACorregir } from './nota'

const estado = atom({ plugin: 'ingles', key: 'estado' } as const, { tipo: 'vacio' } as Estado)

// English (≤600 caracteres) + Tip (≤200) + el JSON, con holgura
const MAX_SALIDA = 600
const ESPERA_MAX_MS = 30_000

/** Cuenta los mensajes: una respuesta que llega tarde, de un mensaje anterior, no pisa la nota nueva. */
let ultimo = 0

/** Pide la nota al modelo y la deja en la banda (si sigue siendo la del último mensaje). */
async function generar ($: EngineInterface, texto: string, id: number, modelo: string) {
  const r = await $.model.complete({
    model: modelo,
    system: SISTEMA,
    prompt: texto,
    maxTokens: MAX_SALIDA,
    timeoutMs: ESPERA_MAX_MS,
  })
  if (id !== ultimo) return
  if (!r.isAnswered) {
    await update($, estado, () => ({ tipo: 'error', motivo: r.reason }))
    return
  }
  const nota = leerNota(r.text)
  await update($, estado, () => (nota ? { tipo: 'lista', nota } : { tipo: 'error', motivo: 'respuesta sin formato' }))
}

export const register: Register = (on, options) => {
  // Una opción sin configurar puede llegar vacía: entonces vale el valor por defecto.
  const modelo = String(options.modelo || 'haiku')
  const color = String(options.color || 'cyan')

  // Cada mensaje que se envía cambia la nota. Se lanza aparte para no demorar el mensaje.
  on('prompt.submit', async ($, e, next) => {
    // Los comandos (/algo) y los mensajes que no escribió la persona no se corrigen.
    const texto = e.command || e.isMeta ? null : textoACorregir(e.text)
    if (texto !== null) {
      ultimo += 1
      const id = ultimo
      await update($, estado, () => ({ tipo: 'pensando' }))
      void generar($, texto, id, modelo).catch(async (err: unknown) => {
        if (id === ultimo) await update($, estado, () => ({ tipo: 'error', motivo: String(err) }))
      })
    }
    return next(e)
  })

  // Encima de todo lo que haya sobre el prompt (el renglón ✍️ de carrera, por ejemplo), que sigue debajo intacto.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const s = await read($, estado)
    if (s.tipo === 'vacio') return next(e)

    const otros = await next(e)
    const { Box, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="column">
        {s.tipo === 'pensando' ? <Text color={color} dimColor>📝 English note: preparando…</Text> : null}
        {s.tipo === 'error'
          ? <Text color={color} dimColor>📝 English note: no se pudo generar ({s.motivo})</Text>
          : null}
        {s.tipo === 'lista'
          ? (
            <Text color={color}>
              <Text color={color} bold>📝 English: </Text>
              {s.nota.english}
            </Text>
            )
          : null}
        {s.tipo === 'lista'
          ? (
            <Text color={color}>
              <Text color={color} bold>💡 Tip: </Text>
              {s.nota.tip}
            </Text>
            )
          : null}
        {otros}
      </Box>
    )
  })
}
