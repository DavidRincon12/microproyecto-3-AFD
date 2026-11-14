# Alcance y Casos de Uso — Microproyecto #3

**Materia:** Teoría de la Computación  
**Equipo:** David Santiago Rincón Bautista (Desarrollador 1) & Ángel Jhoan Díaz Vargas (Desarrollador 2)  
**Entregable:** Fase de Análisis

---

## 1. Alcance del Software

### 1.1 Qué hace la aplicación

El sistema es una aplicación web interactiva desarrollada para la enseñanza y experimentación de conceptos de la Teoría de la Computación. Su objetivo es recibir la definición de un lenguaje regular o un autómata finito y transformarlo paso a paso hasta obtener su Autómata Finito Determinista (AFD) Mínimo equivalente, justificando didácticamente cada etapa intermedia.

El software cuenta con dos modalidades de entrada:

1. **Modalidad A (Lenguaje Regular):** Entrada mediante un alfabeto formal y una expresión regular bien formada. Construye el AFND mediante el algoritmo de Thompson, lo determiniza mediante el método de subconjuntos (cerradura-ε), elimina estados inaccesibles y minimiza con la tabla de pares.
2. **Modalidad B (Autómata Manual):** Entrada manual mediante una cuadrícula/matriz editable o un formato JSON estandarizado. Permite definir el alfabeto $\Sigma$, el conjunto de estados $Q$, el estado inicial $q_0$, el conjunto de estados de aceptación $F$, y la función de transición $\delta$. Clasifica automáticamente si es AFD o AFND, determiniza en caso de ser no determinista, completa transiciones faltantes con un estado sumidero `error` si es necesario, elimina estados inalcanzables y minimiza mediante la tabla de pares (partición de Myhill-Nerode).

Posterior al proceso de minimización, la aplicación ofrece:

- **Visualización interactiva:** Tabla de transiciones formal y diagrama de estados vectorial renderizado mediante Graphviz (usando `@viz-js/viz`).
- **Trazabilidad pedagógica:** Detalle paso a paso de cada transformación (análisis de cerraduras, tabla de pares iterativa marcando pares no equivalentes, grupos de estados equivalentes fusionados mediante unión y renombrado canónico).
- **Simulador de cadenas:** Validador paso a paso de cadenas sobre el autómata mínimo, indicando la secuencia de transiciones ejecutadas, aceptación/rechazo y manejo explícito de la cadena vacía ($\varepsilon$).
- **Comparación entre etapas:** Capacidad de comparar el autómata de cualquier etapa previa con el AFD mínimo resultante (conteo de estados, transiciones y equivalencia).

### 1.2 Qué NO hace la aplicación (Delimitación y Restricciones)

- No procesa gramáticas libres de contexto ni autómatas de pila o máquinas de Turing.
- No procesa expresiones regulares con operadores extendidos de regex moderno (lookahead, lookbehind, backreferences `\1`, conteo `{n,m}`, clases de caracteres POSIX como `\d`).
- No permite el uso del identificador reservado `error` como nombre de estado ingresado por el usuario en Modalidad B, ya que está reservado para el estado trampa/sumidero del sistema.
- No ejecuta código en el servidor: todo el cómputo algorítmico y de renderizado se ejecuta 100% en el cliente (navegador web) de forma determinista y sin dependencias de red.

---

## 2. Restricciones de Entrada

### 2.1 Alfabeto ($\Sigma$)

- Los símbolos deben ser caracteres alfanuméricos individuales no repetidos.
- Símbolos reservados que no pueden formar parte del alfabeto: `(`, `)`, `*`, `+`, `?`, `|`, `,`, espacios en blanco y el símbolo de cadena vacía `ε` o `E`.

### 2.2 Expresión Regular (Modalidad A)

- Soporta los operadores formales:
  - Unión / Disyunción: `|` o `+`
  - Concatenación: implícita (ej. `ab`) o explícita.
  - Clausura de Kleene: `*`
  - Clausura positiva: `+` (como operador unario postfijo)
  - Opcionalidad: `?`
  - Agrupamiento: paréntesis `(` y `)`
- Validación sintáctica estricta: balance de paréntesis, operadores sin operandos y detección de símbolos ajenos al alfabeto declarado.

### 2.3 Autómata Manual (Modalidad B)

- Los identificadores de estados son cadenas alfanuméricas no vacías (ej. `q0`, `q1`, `A`, `B`).
- El estado inicial debe pertenecer al conjunto $Q$.
- Los estados finales deben ser un subconjunto de $Q$ ($F \subseteq Q$).
- En modo matriz: el usuario añade estados y llena cada celda $(q, a)$. Para AFND se permiten múltiples destinos separados por comas o transiciones vacías mediante `ε`.
- En modo JSON: estructura validada bajo el esquema `{ states, alphabet, initial, finals, transitions }`.

---

## 3. Casos de Uso

### CU-01: Construir el AFD mínimo desde una expresión regular

- **Requisitos cubiertos:** RF-01, RF-02, RF-03, RF-06, RF-07, RF-09, RF-10, RF-11, RF-13.
- **Actor:** Estudiante / Docente.
- **Precondición:** La aplicación está cargada en el navegador en la pestaña "Modalidad A".
- **Flujo Principal:**
  1. El usuario ingresa el alfabeto $\Sigma$ separado por comas (ej. `0, 1` o `a, b`).
  2. El usuario ingresa la expresión regular (ej. `(a|b)*abb`).
  3. El usuario pulsa el botón "Procesar".
  4. El sistema valida el alfabeto y la expresión regular sintácticamente.
  5. El sistema ejecuta el algoritmo de Thompson generando el AFND con transiciones $\varepsilon$.
  6. El sistema convierte el AFND a AFD mediante determinización por subconjuntos.
  7. El sistema elimina estados inalcanzables si existen.
  8. El sistema minimiza el AFD aplicando el método de la tabla de pares.
  9. El sistema despliega el pipeline con todas las etapas, la tabla de transición y el diagrama del AFD mínimo resultante.
- **Flujos Alternos:**
  - _4a. Alfabeto inválido:_ El sistema resalta el campo con un mensaje en español explicando el error (ej. caracteres reservados o duplicados) y detiene el proceso.
  - _4b. Expresión regular inválida:_ El sistema señala la posición o tipo de error sintáctico (ej. paréntesis desbalanceados, operador sin operando) y detiene el proceso.

---

### CU-02: Registrar un autómata a mano y minimizarlo

- **Requisitos cubiertos:** RF-04, RF-05, RF-06, RF-07, RF-09, RF-10, RF-11.
- **Actor:** Estudiante / Docente.
- **Precondición:** El usuario selecciona la pestaña "Modalidad B".
- **Flujo Principal:**
  1. El usuario define el alfabeto y la lista de estados en la interfaz (o selecciona un ejemplo precargado de clase).
  2. El usuario marca el estado inicial y los estados de aceptación.
  3. El usuario completa las transiciones en la cuadrícula editable o importa un archivo JSON.
  4. El usuario pulsa "Procesar Autómata".
  5. El sistema clasifica el autómata (AFD o AFND) explicando las razones (ausencia/presencia de transiciones múltiples o transiciones $\varepsilon$).
  6. Si es AFND, ejecuta la determinización hacia AFD.
  7. Si es AFD pero faltan transiciones para ser total, completa con el estado trampa `error`.
  8. El sistema detecta y remueve estados inaccesibles mediante búsqueda en anchura (BFS).
  9. El sistema construye la tabla triangular de pares no distinguidos y minimiza fusionando estados equivalentes.
  10. El sistema presenta la tabla de transiciones, el diagrama vectorial y la explicación de los pares descartados.
- **Flujos Alternos:**
  - _3a. Uso del nombre reservado `error`:_ El sistema bloquea el envío e indica que el nombre `error` está reservado para el estado sumidero.
  - _3b. JSON malformado:_ Si se usa el modo JSON y la sintaxis es inválida o referencia estados no definidos, se muestra el mensaje de error correspondiente.

---

### CU-03: Consultar las etapas y sus pasos intermedios

- **Requisitos cubiertos:** RF-10, RF-13.
- **Actor:** Estudiante / Docente.
- **Precondición:** Se ha procesado con éxito un autómata o expresión regular.
- **Flujo Principal:**
  1. El usuario observa la barra de etapas del pipeline (Thompson, Determinización, Inaccesibles, Minimización, AFD Mínimo).
  2. El usuario hace clic sobre una etapa específica.
  3. El sistema muestra la descripción teórica de la etapa, la tabla de transiciones del autómata en ese punto, el diagrama gráfico correspondiente y el desglose paso a paso de las operaciones realizadas (ej. cálculo de cerraduras $\varepsilon$, marcas en la tabla triangular).
- **Flujos Alternos:**
  - El usuario puede alternar libremente entre etapas sin perder el estado de la simulación o el resultado final.

---

### CU-04: Simular una cadena

- **Requisitos cubiertos:** RF-12.
- **Actor:** Estudiante / Docente.
- **Precondición:** El autómata mínimo ha sido generado y el panel del simulador está disponible.
- **Flujo Principal:**
  1. El usuario ingresa una cadena en el campo de texto (o la deja vacía para evaluar $\varepsilon$).
  2. El usuario pulsa el botón "Simular".
  3. El sistema valida que todos los símbolos pertenezcan al alfabeto $\Sigma$.
  4. El sistema computa la secuencia de transiciones estado por estado partiendo desde el estado inicial.
  5. El sistema muestra el veredicto en texto destacado: **Aceptada** (si el estado final pertenece a $F$) o **Rechazada** (si termina en un estado no final o cae en `error`).
  6. El sistema detalla la traza completa paso a paso: `q0 --(a)--> q1 --(b)--> q2`.
- **Flujos Alternos:**
  - _1a. Cadena vacía:_ El usuario no escribe nada; el sistema evalúa si el estado inicial es de aceptación y muestra el veredicto para $\varepsilon$.
  - _3a. Símbolo desconocido:_ El sistema muestra una alerta indicando que el símbolo ingresado no pertenece al alfabeto del autómata.

---

### CU-05: Comparar una etapa con el resultado final

- **Requisitos cubiertos:** RF-11, RF-13.
- **Actor:** Estudiante / Docente.
- **Precondición:** El pipeline se completó y se visualiza una etapa intermedia.
- **Flujo Principal:**
  1. El usuario activa la opción de comparación entre la etapa actual y el AFD mínimo final.
  2. El sistema muestra un panel comparativo en paralelo:
     - Número de estados de la etapa vs. número de estados del AFD mínimo.
     - Número de transiciones de la etapa vs. transiciones del mínimo.
     - Reducción porcentual de complejidad alcanzada por la minimización.
  3. El usuario puede contrastar visualmente la simplificación estructural lograda en el grafo.
