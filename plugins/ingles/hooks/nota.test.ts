import { expect, test } from 'claude-code/testing'

import { leerNota, MAX_ENTRADA, textoACorregir } from './nota'

test('leerNota acepta el JSON solo, envuelto en ```json o con texto alrededor', async () => {
  const nota = { english: 'Yes, you can push them now.', tip: '"Subirlos" here is "push them".' }
  expect(leerNota(JSON.stringify(nota))).toEqual(nota)
  expect(leerNota('```json\n' + JSON.stringify(nota) + '\n```')).toEqual(nota)
  expect(leerNota('Here it is: ' + JSON.stringify(nota))).toEqual(nota)
})

test('leerNota descarta lo que no trae las dos partes', async () => {
  expect(leerNota('no es json')).toBeNull()
  expect(leerNota('{"english": "Hi"}')).toBeNull()
  expect(leerNota('{"english": "", "tip": "x"}')).toBeNull()
})

test('textoACorregir quita las imágenes pegadas, ignora lo vacío y recorta lo largo', async () => {
  expect(textoACorregir('mira como sale [Image #1] y [Image #12]')).toBe('mira como sale y')
  expect(textoACorregir('[Image #3]')).toBeNull()
  expect(textoACorregir('   ')).toBeNull()
  expect(textoACorregir('a'.repeat(MAX_ENTRADA + 50))?.length).toBe(MAX_ENTRADA + 1)
})
