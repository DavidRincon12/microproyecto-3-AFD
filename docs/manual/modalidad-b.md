# Manual de Usuario — Modalidad B (Ingreso Manual de Autómatas)

**Materia:** Teoría de la Computación  
**Autor:** Ángel Jhoan Díaz Vargas (Desarrollador 2)  
**Módulo:** `src/features/automaton-input`  
**Requisitos cubiertos:** RF-04, RF-05, RF-07, RF-09, RF-11, RF-12

---

## 1. Introducción a la Modalidad B

La **Modalidad B** permite al usuario definir un autómata finito arbitrario (determinista o no determinista) directamente mediante una cuadrícula interactiva o importando su especificación en formato JSON.

El sistema clasifica el autómata automáticamente, aplica las transformaciones necesarias (determinización, eliminación de inaccesibles, minimización por tabla de pares) y presenta la tabla de transiciones, el diagrama gráfico de estados y el simulador de cadenas.

---

## 2. Cómo Utilizar el Formulario

### 2.1 Pestaña «Matriz interactiva»

1. **Definir el Alfabeto:**
   - Ingrese los símbolos separados por comas en el campo "Alfabeto (separado por comas)".
   - _Ejemplo:_ `0, 1` o `a, b`.
2. **Definir los Estados:**
   - Ingrese los nombres de los estados separados por comas.
   - _Ejemplo:_ `q0, q1, q2` o `A, B, C, D`.
   - _Restricción:_ No use el nombre `error`, pues está reservado para el estado trampa del sistema.
3. **Seleccionar Estado Inicial:**
   - Elija el estado de partida en el selector desplegable "Estado Inicial".
4. **Marcar Estados de Aceptación (Finales):**
   - Marque las casillas correspondientes a los estados que forman parte del conjunto $F$.
5. **Completar la Cuadrícula de Transiciones:**
   - Cada fila representa un estado y cada columna un símbolo del alfabeto.
   - Si un estado transita a otro, escriba el nombre del estado destino.
   - **Para autómatas no deterministas (AFND):** puede escribir varios estados destino separados por comas (ej. `q0, q1`). Si hay transiciones espontáneas sin consumir símbolo, use la columna de transiciones vacías ($\varepsilon$).
   - Deje la celda vacía o con un guion si no existe transición para esa combinación.
6. **Procesar:**
   - Haga clic en el botón **«Procesar Autómata»**.

### 2.2 Pestaña «Editor JSON»

Permite pegar o cargar directamente un archivo `.json` con la siguiente estructura formal:

```json
{
  "states": ["A", "B", "C"],
  "alphabet": ["0", "1"],
  "initial": "A",
  "finals": ["C"],
  "transitions": [
    ["A", "0", "B"],
    ["A", "1", "A"],
    ["A", "1", "C"],
    ["B", "0", "C"],
    ["C", "1", "B"]
  ]
}
```

---

## 3. Ejemplos Completos de Uso

### Ejemplo 1: Autómata Finito Determinista (AFD) — Minimización de 6 Estados

- **Alfabeto:** `0, 1`
- **Estados:** `A, B, C, D, E, F`
- **Inicial:** `A`
- **Finales:** `D`
- **Transiciones:**
  - $A$ con $0 \to B$, con $1 \to C$
  - $B$ con $0 \to D$, con $1 \to E$
  - $C$ con $0 \to F$, con $1 \to B$
  - $D$ con $0 \to E$, con $1 \to C$
  - $E$ con $0 \to D$, con $1 \to E$
  - $F$ con $0 \to F$, con $1 \to B$

#### Qué hace la aplicación:

1. **Clasificación:** Detecta que es un **AFD** (cada par estado-símbolo tiene a lo sumo un destino y no hay $\varepsilon$).
2. **Inaccesibles:** Comprueba que todos los estados son alcanzables desde $A$ mediante BFS.
3. **Minimización:** Evalúa la tabla de pares triangulares. Descubre que $B \sim E$ y $C \sim F$.
4. **AFD Mínimo Resultante:** 4 estados canónicos: `A`, `(B,E)`, `(C,F)` y `D`.
5. **Simulación:**
   - Probar cadena `00` $\to$ **Aceptada** (recorrido $A \to (B,E) \to D$).
   - Probar cadena `01` $\to$ **Rechazada** (recorrido $A \to (B,E) \to (B,E) \notin F$).

---

### Ejemplo 2: Autómata Finito No Determinista (AFND) — Conversión y Minimización

- **Alfabeto:** `0, 1`
- **Estados:** `A, B, C`
- **Inicial:** `A`
- **Finales:** `C`
- **Transiciones:**
  - $A$ con $0 \to B$, con $1 \to A, C$ (Bifurcación con 1)
  - $B$ con $0 \to C$
  - $C$ con $1 \to B$

#### Qué hace la aplicación:

1. **Clasificación:** Detecta que es un **AFND** debido a la múltiple transición desde $A$ con el símbolo $1$.
2. **Determinización:** Aplica el algoritmo de subconjuntos generando los estados compuestos equivalentes y agregando el estado sumidero `error` para las transiciones no definidas.
3. **Inaccesibles y Minimización:** Reduce el autómata determinizado a su forma canónica mínima.
4. **Diagrama y Tabla:** Muestra el grafo del AFD mínimo con su respectiva tabla formal.

---

## 4. Errores Más Comunes y Cómo Corregirlos

| Error en Pantalla                                                          | Causa                                                                                | Solución                                                                                             |
| :------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------- |
| **"No se puede usar el nombre reservado 'error' para un estado"**          | Se intentó nombrar un estado como `error`.                                           | Renombre el estado (ej. `q_err`, `E`, `trap`). El identificador `error` es exclusivo del sistema.    |
| **"El estado inicial no pertenece a la lista de estados"**                 | El estado inicial seleccionado fue borrado o no coincide con los estados ingresados. | Verifique que el estado inicial esté incluido en la lista de estados declarados.                     |
| **"Símbolo inválido en el alfabeto"**                                      | Se ingresaron caracteres reservados como `*`, `+`, `                                 | `, `(`, `)` o espacios.                                                                              | Use únicamente letras y dígitos alfanuméricos separados por comas (ej. `0, 1` o `a, b`). |
| **"JSON no válido: falta la propiedad transitions"**                       | El texto pegado en el editor JSON no cumple con la estructura requerida.             | Verifique que el JSON contenga las llaves `states`, `alphabet`, `initial`, `finals` y `transitions`. |
| **"El símbolo 'x' no pertenece al alfabeto del autómata" (en Simulación)** | Se ingresó un carácter desconocido durante la prueba de cadenas.                     | Ingrese únicamente cadenas formadas por los símbolos declarados en el alfabeto $\Sigma$.             |
