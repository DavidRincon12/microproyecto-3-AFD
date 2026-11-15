# Autómatas finitos: construcción, determinización y minimización

Software educativo del Microproyecto #3 de Teoría de la Computación. A partir de un alfabeto y una expresión regular (Modalidad A), o de un autómata finito ingresado a mano (Modalidad B), la aplicación identifica si el autómata es determinista, lo convierte en AFD cuando hace falta, elimina los estados inaccesibles y lo minimiza. Cada etapa se explica paso a paso con la notación vista en clase, y el resultado final es la tabla y el diagrama de transición del AFD mínimo, junto con un simulador de cadenas.

La aplicación corre completa en el navegador, sin servidor ni base de datos.

## Requisitos

- Node.js 22 LTS (incluye npm 10).
- Un navegador actualizado (Chrome, Edge, Firefox o Safari).

## Instalación y ejecución

```bash
git clone https://github.com/DavidRincon12/microproyecto-3-AFD.git
cd microproyecto-3-AFD
npm install
npm run dev
```

Después se abre `http://localhost:5173` en el navegador. Para probar la versión de producción se ejecuta `npm run build` y luego `npm run preview`, que la sirve en `http://localhost:4173`.

## Pruebas y calidad

| Comando             | Qué hace                                        |
| ------------------- | ----------------------------------------------- |
| `npm test`          | Corre todas las pruebas automáticas (Vitest)    |
| `npm run lint`      | Revisa estilo, formato y reglas de arquitectura |
| `npm run typecheck` | Revisa los tipos de TypeScript                  |
| `npm run build`     | Genera la versión de producción en `dist/`      |

El CI de GitHub Actions ejecuta los cuatro comandos en cada pull request.

## Uso rápido

En la **Modalidad A** se escribe el alfabeto separado por comas (`a,b`) y una expresión regular (`(a|b)*abb`), o se carga uno de los ejemplos, y se pulsa «Construir». En la **Modalidad B** se registran los estados, el alfabeto, el estado inicial, los finales y la tabla de transiciones, y se pulsa «Procesar Autómata». En ambos casos aparecen cinco pestañas, una por etapa, con su tabla, su diagrama y sus pasos, y debajo el simulador de cadenas sobre el AFD mínimo. Los manuales de `docs/manual/` explican cada modalidad con ejemplos.

## Estructura del proyecto

| Carpeta                  | Contenido                                                                              |
| ------------------------ | -------------------------------------------------------------------------------------- |
| `src/core/`              | Lógica pura de los autómatas: modelo, algoritmos y explicación de cada etapa           |
| `src/core/__fixtures__/` | Ejemplos de clase resueltos a mano, usados como pruebas y como ejemplos de la interfaz |
| `src/features/`          | Componentes de la interfaz, uno por funcionalidad                                      |
| `src/app/`               | Página principal y estilos globales                                                    |
| `docs/`                  | Análisis, documento técnico, manuales, matriz de pruebas y guion de sustentación       |

## Documentación

- Análisis: `docs/analisis/alcance-y-casos-de-uso.md` y `docs/ejemplos/ejemplos-resueltos.md`.
- Documento técnico: `docs/tecnico/`, que empieza por `arquitectura.md` y `estructuras-de-datos.md`.
- Manuales: `docs/manual/modalidad-a.md` y `docs/manual/modalidad-b.md`.
- Matriz de pruebas: `docs/pruebas/modalidad-a.md` y `docs/pruebas/modalidad-b.md`, con capturas en `docs/pruebas/evidencias/`.
- Sustentación: `docs/sustentacion.md`.

## Bibliotecas

La interfaz usa React y se construye con Vite. Los diagramas los dibuja Graphviz, compilado a WebAssembly mediante `@viz-js/viz`, a partir del texto DOT que genera el propio código; la biblioteca solo dibuja y no participa en la construcción, la determinización ni la minimización (`docs/tecnico/bibliotecas-graficas.md`).

## Autores

- David Santiago Rincón Bautista
- Ángel Jhoan Díaz Vargas
