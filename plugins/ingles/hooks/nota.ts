import type { Nota } from '../types'

/** Tope de lo que se le manda al modelo: un mensaje muy largo se corta (y gasta menos). */
export const MAX_ENTRADA = 2000

/** Las instrucciones del modelo: las mismas reglas que tenía la English note al final de cada respuesta. */
export const SISTEMA = [
  'You help a Spanish-speaking student (Colombian, English level B1) improve their English.',
  'You receive one message they typed to a coding assistant. Reply ONLY with a JSON object:',
  '{"english": "...", "tip": "..."}',
  '',
  '- "english": if the message is mainly in Spanish, a natural English translation of the whole message.',
  '  If it is mainly in English, the corrected version, or exactly "✓ Looks good!" if it has no errors.',
  '  Keep it under 600 characters: translate the whole message when it fits; only a very long one is condensed',
  '  without losing the meaning.',
  '- "tip": one specific grammar or vocabulary tip based on what they wrote, in English, under 200',
  '  characters. Quote the Spanish (or wrong English) expression and give the natural English one.',
  '',
  'Ignore file paths, code, URLs and placeholders like [Image #3]. No markdown, no text outside the JSON.',
].join('\n')

/**
 * El texto que vale la pena corregir, o null si no hay nada: sin los marcadores de imágenes pegadas
 * y recortado a MAX_ENTRADA.
 */
export function textoACorregir (texto: string): string | null {
  const limpio = texto.replace(/\[Image #\d+\]/g, ' ').replace(/\s+/g, ' ').trim()
  if (limpio.length < 2) return null
  return limpio.length > MAX_ENTRADA ? `${limpio.slice(0, MAX_ENTRADA)}…` : limpio
}

/** Saca la nota de la respuesta del modelo; tolera que venga envuelta en ```json … ``` o con texto alrededor. */
export function leerNota (respuesta: string): Nota | null {
  const inicio = respuesta.indexOf('{')
  const fin = respuesta.lastIndexOf('}')
  if (inicio < 0 || fin <= inicio) return null
  try {
    const datos = JSON.parse(respuesta.slice(inicio, fin + 1)) as { english?: unknown; tip?: unknown }
    const english = typeof datos.english === 'string' ? datos.english.trim() : ''
    const tip = typeof datos.tip === 'string' ? datos.tip.trim() : ''
    return english && tip ? { english, tip } : null
  } catch {
    return null
  }
}
