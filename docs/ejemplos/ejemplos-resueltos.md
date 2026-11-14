# Ejemplos de Clase Resueltos y Validación de Fixtures

**Materia:** Teoría de la Computación  
**Equipo:** David Santiago Rincón Bautista (Desarrollador 1) & Ángel Jhoan Díaz Vargas (Desarrollador 2)  
**Entregable:** Fase de Diseño — Ejemplos Desarrollados

---

## 1. Introducción

Este documento presenta la resolución formal y analítica a mano de los ejemplos extraídos de las diapositivas de clase (conversión AFND $\to$ AFD y minimización de AFD), así como los casos sintéticos diseñados para probar casos borde (inaccesibilidad, estados trampa y fusiones transitivas). Cada ejemplo cuenta con su correspondiente fixture JSON en `src/core/__fixtures__/`.

---

## 2. Ejemplo de Minimización de Clase (6 Estados)

- **Fixture:** `min-clase-6-estados.json`
- **Fuente:** Presentación de minimización de AFD, diapositiva «Ejercicio».

### 2.1 Definición Formal

- $\Sigma = \{0, 1\}$
- $Q = \{A, B, C, D, E, F\}$
- $q_0 = A$
- $F = \{D\}$
- Tabla de transiciones original:

|   Estado    |  0  |  1  | Final  |
| :---------: | :-: | :-: | :----: |
| **$\to$ A** |  B  |  C  |   No   |
|    **B**    |  D  |  E  |   No   |
|    **C**    |  F  |  B  |   No   |
|   ***D**    |  E  |  C  | **Sí** |
|    **E**    |  D  |  E  |   No   |
|    **F**    |  F  |  B  |   No   |

### 2.2 Paso 1: Eliminar Inaccesibles

Se aplica BFS desde $q_0 = A$:

- Nivel 0: $\{A\}$
- Nivel 1: $\delta(A, 0) = B$, $\delta(A, 1) = C \implies \{A, B, C\}$
- Nivel 2: $\delta(B, 0) = D$, $\delta(B, 1) = E$, $\delta(C, 0) = F \implies \{A, B, C, D, E, F\}$
- Todos los 6 estados son accesibles. No se elimina ninguno.

### 2.3 Paso 2: Tabla Triangular Inferior (Algoritmo de Marcado de Pares)

Pares posibles: $\frac{6 \times 5}{2} = 15$ pares.

#### Fase 1: Marcado Inicial de Finales vs No Finales ($F \times (Q \setminus F)$)

Dado que $F = \{D\}$ y los no finales son $\{A, B, C, E, F\}$, se marcan inmediatamente con **NF**:

- $(A, D)$, $(B, D)$, $(C, D)$, $(D, E)$, $(D, F)$ quedan marcados.

#### Fase 2: Pasadas Iterativas sobre Pares No Marcados

Pares candidatos restantes:

- $(A, B)$, $(A, C)$, $(A, E)$, $(A, F)$
- $(B, C)$, $(B, E)$, $(B, F)$
- $(C, E)$, $(C, F)$
- $(E, F)$

**Iteración 1:**

1. Par $(A, B)$:
   - Con $0 \to (\delta(A,0), \delta(B,0)) = (B, D)$. Como $(B, D)$ está marcado $\implies$ **se marca $(A, B)$** con $0 \to (B,D)$.
2. Par $(A, C)$:
   - Con $0 \to (B, F)$. No marcado.
   - Con $1 \to (C, B)$. No marcado.
3. Par $(A, E)$:
   - Con $0 \to (B, D)$. Como $(B, D)$ está marcado $\implies$ **se marca $(A, E)$** con $0 \to (B,D)$.
4. Par $(A, F)$:
   - Con $0 \to (B, F)$. Con $1 \to (C, B)$. No se marca aún.
5. Par $(B, C)$:
   - Con $0 \to (D, F)$. Como $(D, F)$ está marcado $\implies$ **se marca $(B, C)$** con $0 \to (D,F)$.
6. Par $(B, E)$:
   - Con $0 \to (D, D)$ (mismo estado).
   - Con $1 \to (E, E)$ (mismo estado).
   - Ninguno produce distinción. Permanece no marcado.
7. Par $(B, F)$:
   - Con $0 \to (D, F)$. Marcado $\implies$ **se marca $(B, F)$** con $0 \to (D,F)$.
8. Par $(C, E)$:
   - Con $0 \to (F, D)$. Marcado $\implies$ **se marca $(C, E)$** con $0 \to (D,F)$.
9. Par $(C, F)$:
   - Con $0 \to (F, F)$. Con $1 \to (B, B)$.
   - Ninguno produce distinción. Permanece no marcado.
10. Par $(E, F)$:
    - Con $0 \to (D, F)$. Marcado $\implies$ **se marca $(E, F)$** con $0 \to (D,F)$.

**Iteración 2:**

1. Par $(A, C)$:
   - Con $1 \to (C, B) = (B, C)$, el cual fue marcado en la iteración 1.
   - $\implies$ **se marca $(A, C)$** con $1 \to (B,C)$.
2. Par $(A, F)$:
   - Con $1 \to (C, B) = (B, C)$, marcado en iteración 1.
   - $\implies$ **se marca $(A, F)$** con $1 \to (B,C)$.
3. Pares $(B, E)$ y $(C, F)$:
   - Siguen transitando a parejas idénticas.

**Iteración 3:**

- Ningún par nuevo se marca. El algoritmo converge y termina.

### 2.4 Paso 3: Agrupación y Unión de Clases Equivalentes

Los pares no marcados representan estados indistinguibles:

- $B \sim E$
- $C \sim F$

Aplicando conjuntos disjuntos (Union-Find), las particiones son:

- $\{A\}$
- $\{B, E\} \implies \text{Nombre canónico: } \mathbf{(B,E)}$
- $\{C, F\} \implies \text{Nombre canónico: } \mathbf{(C,F)}$
- $\{D\}$

### 2.5 Autómata Finito Determinista Mínimo Resultante

- Estados: $\{A, (B,E), (C,F), D\}$
- Estado Inicial: $A$
- Estados Finales: $\{D\}$
- Tabla de transiciones mínimas:

|   Estado    |   0   |   1   |
| :---------: | :---: | :---: |
| **$\to$ A** | (B,E) | (C,F) |
|  **(B,E)**  |   D   | (B,E) |
|  **(C,F)**  | (C,F) | (B,E) |
|   ***D**    | (B,E) | (C,F) |

_Total de estados reducido de 6 a 4._

---

## 3. Ejemplo de Determinización AFND $\to$ AFD (Clase A, B, C)

- **Fixture:** `afnd-clase-abc.json`
- **Fuente:** Presentación de conversión AFND-AFD, ejemplo con $A, B, C$.

### 3.1 Definición del AFND

- $\Sigma = \{0, 1\}$
- $Q = \{A, B, C\}$, $q_0 = A$, $F = \{C\}$
- Transiciones:
  - $\delta(A, 0) = \{B\}$
  - $\delta(A, 1) = \{A, C\}$ (no determinista: bifurcación en 1)
  - $\delta(B, 0) = \{C\}$
  - $\delta(B, 1) = \emptyset$ (incompleta)
  - $\delta(C, 0) = \emptyset$ (incompleta)
  - $\delta(C, 1) = \{B\}$

### 3.2 Construcción de Subconjuntos

1. Estado inicial AFD: $S_0 = \{A\}$
2. Transiciones desde $\{A\}$:
   - $\delta(\{A\}, 0) = \{B\} \implies S_1 = \{B\}$
   - $\delta(\{A\}, 1) = \{A, C\} \implies S_2 = \{A, C\}$
3. Transiciones desde $\{B\}$:
   - $\delta(\{B\}, 0) = \{C\} \implies S_3 = \{C\}$
   - $\delta(\{B\}, 1) = \emptyset \implies \text{Estado sumidero } \mathbf{error}$
4. Transiciones desde $\{A, C\}$:
   - $\delta(\{A, C\}, 0) = \delta(A,0) \cup \delta(C,0) = \{B\} = S_1$
   - $\delta(\{A, C\}, 1) = \delta(A,1) \cup \delta(C,1) = \{A, C\} \cup \{B\} = \{A, B, C\} \implies S_4$
5. Transiciones desde $\{C\}$:
   - $\delta(\{C\}, 0) = \emptyset \implies \mathbf{error}$
   - $\delta(\{C\}, 1) = \{B\} = S_1$
6. Transiciones desde $\{A, B, C\}$:
   - $\delta(\{A, B, C\}, 0) = \{B, C\}$
   - $\delta(\{A, B, C\}, 1) = \{A, B, C\}$

Se añade el estado `error` para todas las transiciones no definidas, garantizando que la función de transición sea total sobre $\Sigma$ antes de la minimización.

---

## 4. Ejemplo con Inaccesibles Diseñado por el Equipo

- **Fixture:** `afd-con-inaccesibles.json`

### 4.1 Definición Original

- $\Sigma = \{a, b\}$
- $Q = \{q0, q1, q2, D, E\}$
- $q_0 = q0$, $F = \{q2\}$
- Transiciones:
  - $(q0, a) \to q1$, $(q0, b) \to q0$
  - $(q1, a) \to q2$, $(q1, b) \to q0$
  - $(q2, a) \to q2$, $(q2, b) \to q2$
  - $(D, a) \to E$, $(D, b) \to q0$ (Inaccesible: ningún arco entra a D)
  - $(E, a) \to D$, $(E, b) \to E$ (Inaccesible)

### 4.2 Proceso de Poda

- Al ejecutar BFS desde $q0$, el conjunto accesible es exactamente $\{q0, q1, q2\}$.
- Los estados $D$ y $E$ se descartan junto con todas sus transiciones incidentes y salientes.
- Resultado: AFD con 3 estados listo para minimización.

---

## 5. Ejemplo de Fusión Transitiva Diseñado por el Equipo

- **Fixture:** `afd-fusion-transitiva.json`

### 5.1 Propósito

Verificar que la estructura Union-Find implementada en `minimize.ts` agrupe correctamente cadenas de equivalencia transitivas: si $B \sim E$ y $E \sim G$, el grupo resultante debe ser $\{B, E, G\}$, renombrado como `(B,E,G)` sin duplicar estados ni fragmentar particiones.

El algoritmo genera el bloque canónico `(B,E,G)` y redirige todas las transiciones hacia y desde estos estados hacia el nuevo estado fusionado.
