# Guía y Libreto de Sustentación

**Software educativo para la construcción, determinización y minimización de autómatas finitos**

- **Materia:** Teoría de la Computación (Universidad Francisco de Paula Santander - UFPS)
- **Proyecto:** Microproyecto #3
- **Autores:** David Santiago Rincón Bautista y Ángel Jhoan Díaz Vanegas
- **Aplicativo web en producción:** [https://davidrincon12.github.io/microproyecto-3-AFD/](https://davidrincon12.github.io/microproyecto-3-AFD/)
- **Repositorio de código:** [https://github.com/DavidRincon12/microproyecto-3-AFD](https://github.com/DavidRincon12/microproyecto-3-AFD)

---

## 1. Estructura y Plan de la Sustentación

La sustentación está diseñada para abordar con rigor teórico y demostración práctica en vivo los tres requerimientos fundamentales solicitados por la docente en los lineamientos (Sección 10, numeral 5):

1. **Construcción de un autómata finito desde una expresión regular** (Modalidad A).
2. **Determinización de un autómata finito no determinista (AFN) a AFD** (Modalidad B).
3. **Minimización de un autómata finito determinista (AFD) mediante el método formal de clase**.
4. **Simulación de cadenas y visualización interactiva**.

---

## 2. Demostración 1: Construcción desde una Expresión Regular (Modalidad A)

### 2.1 Enunciado del Ejemplo

- **Alfabeto ($\Sigma$):** `0, 1`
- **Expresión Regular:** `(0|1)*011`
- **Lenguaje que describe:** Todas las cadenas sobre $\{0, 1\}$ que terminan exactamente en la subcadena `011`.
- **Cadenas de prueba:**
  - Aceptadas: `011`, `0011`, `1011`, `01011`, `111011`.
  - Rechazadas: `λ` (cadena vacía), `0`, `1`, `01`, `0110`, `1010`.

### 2.2 Algoritmo Implementado: Autómata de Posiciones (Glushkov / Berry-Sethi)

A diferencia de Thompson clásico que genera múltiples estados auxiliares y transiciones vacías ($\varepsilon$/$\lambda$), se implementó el **Autómata de Posiciones**, alineado con la metodología de clase donde un autómata finito no posee transiciones vacías, sino que opera directamente con los símbolos de entrada:

1. **Numeración de posiciones:** Cada aparición de un símbolo en la expresión recibe una posición $1 \dots n$.
2. **Cálculo de funciones sintácticas:**
   - $\text{nullable}(E)$: Determina si la subexpresión reconoce la palabra vacía $\lambda$.
   - $\text{firstpos}(E)$: Posiciones con las que puede iniciar una cadena.
   - $\text{lastpos}(E)$: Posiciones con las que puede finalizar una cadena.
   - $\text{followpos}(p)$: Para cada posición $p$, conjunto de posiciones que pueden sucederle inmediatamente.
3. **Mapeo a Estados Mayúsculas de Clase:**
   - Estado inicial: `A`.
   - Posiciones $1 \dots n$: Estados `B`, `C`, `D`, `E`, `F`...
4. **Construcción directa de $\delta$:**
   - Desde `A`, se transita con el símbolo correspondiente a cada estado en $\text{firstpos}$.
   - Desde cada posición $p$, se transita con el símbolo de $q$ hacia cada estado $q \in \text{followpos}(p)$.
   - Estados terminales ($Q_T$): Aquellos correspondientes a $\text{lastpos}(\text{raíz})$ (y `A` si es anidable).

### 2.3 Qué mostrarle a la profesora en la aplicación:

1. En **«Modalidad A: lenguaje»**, desplegar el botón **«Cargar ejemplo»** y seleccionar `(0|1)*011`.
2. Mostrar cómo el acordeón interactivo **«💡 ¿Cómo escribir tu lenguaje?»** explica las reglas de sintaxis.
3. Pulsar **«Construir»**.
4. Ir a la **Etapa 1: Construcción del autómata**:
   - Observar la definición formal: $AF = \{\{A, B, C, D, E, F\}, A, \{F\}, \{0, 1\}, \delta\}$.
   - Resaltar que **no existe columna de transiciones vacías**, todas las transiciones van estrictamente sobre `0` o `1`.
   - En el diagrama SVG, mostrar el estado inicial `A` con flecha de entrada y el estado de aceptación `F` con doble círculo.

---

## 3. Demostración 2: Determinización de un AFN (Modalidad B)

### 3.1 Enunciado del Ejemplo

- **Estados ($Q$):** `A, B, C`
- **Alfabeto ($\Sigma$):** `0, 1`
- **Estado Inicial ($q_0$):** `A`
- **Estados Terminales ($Q_T$):** `C`
- **Transiciones:**
  - $\delta(A, 0) = \{B\}$
  - $\delta(A, 1) = \{A, C\}$ _(causa del no determinismo)_
  - $\delta(B, 0) = \{C\}$
  - $\delta(C, 1) = \{B\}$

### 3.2 Algoritmo Implementado: Construcción por Subconjuntos (Partes de $Q$)

1. **Clasificación (Etapa 2):** El sistema examina la tabla de transiciones. Detecta que para el estado $A$ y el símbolo $1$ existen dos destinos posibles: $\{A, C\}$. Por ende, clasifica formalmente como **AFND**.
2. **Determinización paso a paso (Etapa 3):**
   - Inicial: Se parte del conjunto $\{A\}$, nombrado `A`.
   - Con símbolo `0`: va a $\{B\}$, nombrado `B`.
   - Con símbolo `1`: va a $\{A, C\}$, nombrado `AC`.
   - Exploración de `AC`:
     - Con `0`: $\delta(A,0) \cup \delta(C,0) = \{B\} \cup \emptyset = \{B\}$, va a `B`.
     - Con `1`: $\delta(A,1) \cup \delta(C,1) = \{A, C\} \cup \{B\} = \{A, B, C\}$, nombrado `ABC`.
   - La aplicación genera la traza exacta de cada subconjunto con la notación de clase (`AC,1 → A,1→AC · C,1→B`).
   - Aquellas transiciones sin destino definido conducen al estado sumidero `error`.

### 3.3 Qué mostrarle a la profesora:

1. En **«Modalidad B: autómata»**, seleccionar el ejemplo predefinido `AFND con estados A, B, C`.
2. Mostrar la cuadrícula editable de transiciones.
3. Pulsar **«Procesar Autómata»**.
4. Ir a la **Etapa 2 (Clasificación)**: Mostrar la explicación automática de por qué es no determinista.
5. Ir a la **Etapa 3 (Conversión AFND → AFD)**: Mostrar la lista de pasos detallados donde cada subconjunto se explica con sus transiciones individuales agrupadas.

---

## 4. Demostración 3: Minimización de un AFD (Método de Clase por Matriz Triangular)

### 4.1 Enunciado del Ejemplo 1 (Ejercicio del Cuaderno - 4 estados)

- **Estados:** `A, B, C, D`
- **Alfabeto:** `0, 1`
- **Inicial:** `A`
- **Terminales:** `D`
- **Transiciones:**
  - $A \xrightarrow{0} B$, $A \xrightarrow{1} C$
  - $B \xrightarrow{0} D$, $B \xrightarrow{1} D$
  - $C \xrightarrow{0} D$, $C \xrightarrow{1} D$
  - $D \xrightarrow{0} D$, $D \xrightarrow{1} D$
- **Resultado esperado en clase:** Los estados $B$ y $C$ van exactamente a los mismos destinos ($D$) con todos los símbolos. Son equivalentes y se fusionan en el macroestado `BC`. El AFDM resultante tiene 3 estados: `A`, `BC`, `D`.

### 4.2 Enunciado del Ejemplo 2 (Ejercicio del Cuaderno - 6 estados)

- **Estados:** `A, B, C, D, E, F`
- **Inicial:** `A`
- **Terminales:** `D`
- **Transiciones:**
  - $A$ va a $B, C$; $B$ va a $D, E$; $C$ va a $F, B$; $D$ va a $E, C$; $E$ va a $D, E$; $F$ va a $F, B$.
- **Pares equivalentes identificados:** $(B, E)$ y $(C, F)$.
- **Resultado de minimización:** 4 estados mínimos: `A`, `(B,E)`, `(C,F)` y `D`.

### 4.3 Algoritmo Implementado: Matriz Triangular Inferior de Pares Distinguibles

El algoritmo reproduce exactamente la técnica manual del cuaderno de clase:

1. **Completitud previa:** Si existen transiciones indefinidas, se incorpora formalmente el estado sumidero `error` para garantizar que el autómata sea total.
2. **Matriz Triangular Inferior:**
   - La diagonal principal se llena con la marca de identidad $\equiv$.
   - **Marcado inicial (orden 0):** Se marcan con $X$ todos los pares formados por un estado terminal ($Q_T$) y uno no terminal, ya que la cadena vacía $\lambda$ los distingue inmediatamente.
   - **Pares terminal-terminal:** Si existiesen dos o más terminales, NO se marcan de entrada, permitiendo que se fusionen si sus transiciones futuras coinciden.
3. **Iteraciones y tabla de pasadas $[m, f, p]$:**
   - Para cada par pendiente $(p, q)$ y para cada símbolo $a \in \Sigma$, se calculan sus transiciones $(\delta(p, a), \delta(q, a))$.
   - Se genera una tabla de análisis de iteración con columnas `Par`, `Análisis` y `Resultado`:
     - $m(p, q)$: El par de destinos ya está marcado con $X$ en la matriz $\implies$ se marca $(p, q)$ con $X$.
     - $f(p, q)$: El par de destinos es el mismo estado (cae en la diagonal $\equiv$) $\implies$ se registra como compatible.
     - $p(p, q)$: El par de destinos aún no está resuelto $\implies$ queda pendiente para la siguiente pasada.
   - El proceso itera hasta que una pasada completa no produzca ninguna nueva distinción (punto fijo).
4. **Matriz final y agrupación transitiva:**
   - Las celdas que quedan sin marcar corresponden a estados equivalentes y se señalan con la marca $O$.
   - Se agrupan usando conjuntos disjuntos (_Union-Find_) con compresión de caminos, garantizando transitividad: si $p \sim q$ y $q \sim r$, el estado resultante es $(p, q, r)$.
5. **Autómata Mínimo (AFDM):**
   - Cada clase de equivalencia forma un estado en el AFDM.
   - Se conservan las etiquetas de origen en la tabla y diagrama.

### 4.4 Qué mostrarle a la profesora:

1. En la **Etapa 5: Minimización de estados**:
   - Mostrar la **Matriz Triangular Inferior** con las marcas $\equiv$, $X$ y $O$.
   - Abrir la **Tabla de Pasadas e Iteraciones**, explicando las columnas de evaluación $[m, f, p]$.
   - Mostrar la tabla de equivalencias y la lista final de estados fusionados.
   - Activar la casilla interactiva **«Comparar con el AFD mínimo»** para ver en pantalla dividida el autómata antes y después de minimizar.

---

## 5. Demostración 4: Simulación de Cadenas

### 5.1 En qué consiste

El simulador integrado evalúa cadenas sobre el AFDM en tiempo real con animación interactiva:

1. **Validación léxica previa:** Si la cadena contiene un símbolo fuera del alfabeto $\Sigma$, señala el error indicando el carácter y su posición exacta.
2. **Aceptación o rechazo explícito:**
   - La cadena se **Acepta** si el recorrido finaliza en un estado terminal ($q \in Q_T$).
   - La cadena se **Rechaza** si termina en un estado no terminal o si en algún punto una transición no existe.
3. **Evaluación de palabra vacía ($\lambda$):** Al dejar el campo de texto en blanco, el simulador evalúa si el estado inicial es terminal o no.
4. **Paso a paso interactivo:** Con los botones **«Paso anterior»** y **«Paso siguiente»**, el usuario avanza símbolo a símbolo, observando en la tabla de transiciones la fila actual y viendo cómo el estado activo se ilumina dinámicamente en el diagrama SVG.

---

## 6. Checklist de Cumplimiento de Lineamientos

| Requerimiento del Documento de la Profesora                       | Dónde se verifica                                          | Estado              |
| :---------------------------------------------------------------- | :--------------------------------------------------------- | :------------------ |
| **RF-01: Validar alfabeto (sin duplicados, símbolos reservados)** | `parseAlphabet.ts` y pruebas unitarias                     | ✅ Cumplido al 100% |
| **RF-02: Validar lenguaje regular y pertenencia a $\Sigma$**      | `parseRegex.ts` y validadores de formulario                | ✅ Cumplido al 100% |
| **RF-03: Construir autómata desde ER**                            | Algoritmo de posiciones Glushkov en `thompson.ts`          | ✅ Cumplido al 100% |
| **RF-04: Registrar manualmente autómata (cuadrícula y JSON)**     | `AutomatonForm.tsx` (matriz interactiva y modo JSON)       | ✅ Cumplido al 100% |
| **RF-05: Identificar AFD o AFND y justificarlo**                  | `classify.ts` y Etapa 2 de la interfaz                     | ✅ Cumplido al 100% |
| **RF-06: Convertir AFN a AFD (subconjuntos)**                     | `determinize.ts` y Etapa 3 paso a paso                     | ✅ Cumplido al 100% |
| **RF-07: Identificar y eliminar inaccesibles**                    | `removeUnreachable.ts` y Etapa 4                           | ✅ Cumplido al 100% |
| **RF-09: Minimizar AFD por algoritmo formal**                     | `minimize.ts` (matriz triangular, $[m, f, p]$, union-find) | ✅ Cumplido al 100% |
| **RF-10: Operaciones y resultados intermedios paso a paso**       | `PipelineView.tsx` (5 pestañas, tablas intermedias)        | ✅ Cumplido al 100% |
| **RF-11: Tabla y diagrama de transición del AFDM**                | `TransitionTable.tsx` y `AutomatonDiagram.tsx` (WASM)      | ✅ Cumplido al 100% |
| **RF-12: Simular cadenas con recorrido y veredicto**              | `Simulator.tsx` interactivo y paso a paso                  | ✅ Cumplido al 100% |
| **RF-13: Comparar cada etapa con el resultado final**             | Checkbox «Comparar con el AFD mínimo» en UI                | ✅ Cumplido al 100% |
| **Lineamiento Técnico: Mismo lenguaje (TypeScript/React)**        | Stack moderno React 19, TypeScript 5.8, Vite 6             | ✅ Cumplido al 100% |
| **Lineamiento Técnico: Nombres consistentes de estados**          | Convención de clase: Mayúsculas y subconjuntos unidos      | ✅ Cumplido al 100% |
| **Lineamiento Técnico: Documentación de librerías gráficas**      | Sección 5 del Documento Técnico (@viz-js/viz)              | ✅ Cumplido al 100% |
| **Validación y Pruebas Automáticas**                              | **267 pruebas automáticas en verde con Vitest**            | ✅ Cumplido al 100% |
