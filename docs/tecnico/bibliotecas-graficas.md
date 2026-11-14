# Justificación y Documentación de Bibliotecas Gráficas

**Materia:** Teoría de la Computación  
**Autor:** Ángel Jhoan Díaz Vargas (Desarrollador 2)  
**Módulos:** `src/core/dot`, `src/features/automaton-view`  
**Requisitos cubiertos:** RF-11 (Lineamiento Técnico de Bibliotecas Gráficas)

---

## 1. Declaración de Cumplimiento de Lineamientos

El enunciado del microproyecto estipula que cualquier biblioteca gráfica o de terceros debe estar estrictamente justificada, documentando su función específica, versión y licencia, y garantizando que no reemplace los algoritmos nucleares objeto de evaluación en la materia.

El equipo declara que:

1. **Ningún algoritmo de Teoría de la Computación ha sido delegado a bibliotecas externas.**
   - La validación léxica/sintáctica del alfabeto y la expresión regular (`parseAlphabet`, `parseRegex`).
   - El árbol sintáctico y la construcción de Thompson (`thompson`).
   - La cerradura-$\varepsilon$ y la determinización por subconjuntos (`epsilonClosure`, `determinize`).
   - La clasificación de autómatas (`classify`).
   - La eliminación de estados inaccesibles (`removeUnreachable`).
   - La minimización por tabla de pares y unión de clases (`minimize`).
   - La simulación y trazabilidad de cadenas (`simulate`).
   - La generación del formato formal DOT (`toDot`).
     **Todos fueron implementados desde cero por los integrantes del equipo.**
2. La biblioteca gráfica utilizada se limita **exclusivamente a la rasterización y renderizado vectorial (SVG) en el navegador del texto DOT** generado por nuestro propio compilador `toDot.ts`.

---

## 2. Detalle de la Biblioteca Utilizada

| Propiedad                 | Detalle                                 |
| :------------------------ | :-------------------------------------- |
| **Nombre del Paquete**    | `@viz-js/viz`                           |
| **Versión Instalada**     | `3.31.0`                                |
| **Licencia del Paquete**  | MIT License                             |
| **Tecnología Subyacente** | Graphviz compilado a WebAssembly (WASM) |
| **Licencia de Graphviz**  | Eclipse Public License (EPL-1.0)        |
| **Repositorio / Fuente**  | `https://github.com/viz-js/viz`         |

---

## 3. Arquitectura del Flujo de Renderizado Gráfico

El renderizado del autómata sigue un desacoplamiento estricto entre el modelo matemático y la presentación visual:

```
+------------------------------------+
|  Modelo Automaton (TypeScript)    |
|  - states, alphabet, initial, ...  |
+------------------------------------+
                  |
                  | (1) Transforma a formato estándar Graphviz
                  v
+------------------------------------+
|  toDot.ts (Implementación Propia)  |
|  - Define rankdir=LR, nodos dobles |
|  - Flecha invisible de inicio      |
|  - Agrupación de aristas paralelas |
+------------------------------------+
                  |
                  | (2) String de texto DOT puro
                  v
+------------------------------------+
|  AutomatonDiagram.tsx (React)      |
|  - Invoca @viz-js/viz WASM engine  |
+------------------------------------+
                  |
                  | (3) Genera SVG nativo
                  v
+------------------------------------+
|  Contenedor DOM (<svg>)            |
|  - Renderizado vectorial interactivo|
+------------------------------------+
```

### 3.1 Estructura del Código DOT Generado (`toDot.ts`)

La función `toDot` genera especificaciones limpias conformes a la gramática de Graphviz:

- Estados de aceptación: configurados con `shape=doublecircle`.
- Estados no de aceptación: configurados con `shape=circle`.
- Estado inicial: identificado con un nodo auxiliar invisible `__inicio [shape=point, style=invis]` que dirige una flecha hacia el nodo de inicio real.
- Aristas paralelas: si entre dos estados $u$ y $v$ existen transiciones con múltiples símbolos (ej. `0` y `1`), se consolidan en una sola arista con etiqueta `0, 1` para maximizar la legibilidad visual del grafo.

---

## 4. Ventajas de la Elección de `@viz-js/viz`

1. **Ejecución 100% Client-Side:** No requiere instalar binarios de Graphviz en el sistema operativo del usuario ni llamadas a servidores remotos. Funciona directamente en cualquier navegador moderno mediante WebAssembly.
2. **Cero Dependencias de Red en Ejecución:** Todo el paquete se empaqueta en el bundle estático de la aplicación Vite, permitiendo su funcionamiento totalmente offline.
3. **Calidad Tipográfica y Vectorial:** La salida en SVG escala a cualquier resolución sin pérdida de nitidez y permite aplicar estilos CSS para temas claros y oscuros.
