# claude-mod-english-note

Un mod de [Claude Code](https://claude.com/claude-code) para practicar inglés mientras trabajas.

Cada mensaje que le envías a Claude aparece, en dos renglones de color encima del prompt, traducido al
inglés (si lo escribiste en español) o corregido (si lo escribiste en inglés; si no tiene errores,
«✓ Looks good!»), con un tip de gramática o vocabulario sacado de lo que escribiste:

```
📝 English: Yes, you can push them now.
💡 Tip: "Subirlos" here is "push them", not "upload them".
```

- La nota la escribe un modelo aparte (Haiku por defecto) con `$.model.complete`, sin demorar tu
  mensaje: mientras llega dice «preparando…».
- Cada mensaje nuevo reemplaza la nota anterior. Los comandos `/algo` no se corrigen y los marcadores
  de imágenes pegadas (`[Image #3]`) se ignoran.
- El English llega hasta ~600 caracteres: los mensajes normales se traducen completos y solo los muy
  largos se resumen. Los renglones crecen hacia abajo lo que haga falta.
- Va encima de lo que otros mods dibujen sobre el prompt, sin reemplazarlo.
- Gasta un poco de cuota en cada mensaje (con Haiku, unos cientos de tokens).

## Instalar

```sh
claude plugin marketplace add santiagosuarezalf/claude-mod-english-note
claude plugin install ingles@english-note
```

Y reiniciar Claude Code.

| Opción | Por defecto | Qué es |
|---|---|---|
| `modelo` | `haiku` | Modelo que escribe la nota (alias o id completo) |
| `color` | `cyan` | Color de los dos renglones (nombre de color de terminal o hex) |

## Pruebas

```sh
claude plugin test plugins/ingles
```
