/** Lo que muestra la banda: la versión en inglés del mensaje y un tip sobre lo que se escribió. */
export type Nota = { english: string; tip: string }

/** En qué va la nota del último mensaje. */
export type Estado =
  | { tipo: 'vacio' }
  | { tipo: 'pensando' }
  | { tipo: 'lista'; nota: Nota }
  | { tipo: 'error'; motivo: string }

declare module 'claude-code' {
  interface PluginState {
    ingles: {
      estado: Estado
    }
  }
}
