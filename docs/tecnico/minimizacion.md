# Minimización de Autómatas Finitos Deterministas por Tabla de Pares

**Materia:** Teoría de la Computación  
**Autor:** Ángel Jhoan Díaz Vargas (Desarrollador 2)  
**Módulo:** `src/core/minimization`  
**Requisito cubierto:** RF-09

---

## 1. Fundamento Teórico

### 1.1 Teorema de Myhill-Nerode y Equivalencia de Estados

El proceso de minimización de un Autómata Finito Determinista (AFD) consiste en encontrar el autómata con el menor número posible de estados que reconozca exactamente el mismo lenguaje regular $L$.

Dos estados $p, q \in Q$ se dicen **equivalentes** o **indistinguibles** ($p \sim q$) si para cualquier cadena posible $w \in \Sigma^*$, ambas trayectorias terminan simultáneamente en estados de aceptación o ambas terminan en estados de no aceptación:
$$p \sim q \iff \forall w \in \Sigma^* : (\hat{\delta}(p, w) \in F \iff \hat{\delta}(q, w) \in F)$$

Si existe al menos una cadena $w \in \Sigma^*$ que distinga a $p$ de $q$ (llevando a uno a un estado final y al otro a un estado no final), entonces el par $\{p, q\}$ es **distinguible**.

### 1.2 Estructura de la Matriz Triangular Inferior

Para evaluar todos los pares de estados no ordenados $\{p, q\}$ con $p \neq q$, se utiliza una tabla triangular inferior indexada por los estados en un orden canónico:
$$\text{Número de pares} = \binom{|Q|}{2} = \frac{|Q|(|Q|-1)}{2}$$

---

## 2. Algoritmo de la Tabla de Pares (`minimize.ts`)

El algoritmo implementado consta de cuatro etapas principales:

### Etapa 1: Completitud del AFD

Antes de minimizar, el AFD debe tener una función de transición total $\delta : Q \times \Sigma \to Q$. Si faltan transiciones en algún estado para algún símbolo del alfabeto, se introduce un estado trampa sumidero denominado `error` con bucles sobre todo $\Sigma$: $\delta(\text{error}, a) = \text{error}, \forall a \in \Sigma$.

### Etapa 2: Marcado Base (Final vs. No Final)

Todo par $\{p, q\}$ tal que uno es final y el otro no ($p \in F \land q \notin F$ o viceversa) es distinguible trivialmente por la cadena vacía $\varepsilon$ ($w = \varepsilon$).
Se marcan estos pares con la razón pedagógica:
$$\text{reason} = \text{"NF: uno es final y el otro no"}$$

### Etapa 3: Pasadas Iterativas de Propagación

Mientras en una pasada completa se marque al menos un par nuevo:
Para cada par $\{p, q\}$ aún no marcado:

1. Para cada símbolo $a \in \Sigma$:
   - Se calculan los estados sucesores $p' = \delta(p, a)$ y $q' = \delta(q, a)$.
   - Si $p' \neq q'$ y el par $\{p', q'\}$ ya se encuentra marcado en la tabla:
     - El par $\{p, q\}$ queda marcado como distinguible.
     - Se registra la razón: `"Con símbolo 'a' transitan a (p', q') ya marcado"`.
     - Se interrumpe la evaluación de símbolos para este par y se continúa con el siguiente.

El algoritmo termina cuando una pasada completa no produce ningún marcado nuevo (punto fijo alcanzado).

### Etapa 4: Agrupación con Conjuntos Disjuntos (Union-Find)

Los pares que permanecen **sin marcar** al finalizar las iteraciones corresponden a pares de estados equivalentes ($p \sim q$).
Para agruparlos en clases de equivalencia de manera robusta y transitiva (por ejemplo, si $A \sim B$ y $B \sim C \implies A \sim B \sim C$), se implementó la estructura de datos **Union-Find con compresión de caminos**:

- Cada estado $q \in Q$ inicia en su propio conjunto unitario.
- Para cada par no marcado $\{p, q\}$, se ejecuta `union(p, q)`.
- Se obtienen las particiones disjuntas $P_1, P_2, \dots, P_k$.

### Etapa 5: Renombrado Canónico y Construcción del AFD Mínimo

- Para cada clase de equivalencia con más de un elemento $\{s_1, s_2, \dots, s_m\}$, se ordenan sus elementos alfabéticamente y se genera el identificador canónico compuesto:
  $$\text{mergedName} = (s_1,s_2,\dots,s_m)$$
- Se reconstruyen las transiciones redirigiendo los orígenes y destinos a sus respectivos representantes de clase.
- El estado inicial mínimo es la clase que contiene al $q_0$ original.
- Los estados finales mínimos son aquellas clases que contienen al menos un estado de $F$.

---

## 3. Demostración Paso a Paso con el Ejemplo de Clase

A continuación se detalla la traza que genera la aplicación para el ejemplo de 6 estados:

- **Estados:** $A, B, C, D, E, F$
- **Inicial:** $A$, **Finales:** $\{D\}$
- **Transiciones:**
  - $A: (0 \to B, 1 \to C)$
  - $B: (0 \to D, 1 \to E)$
  - $C: (0 \to F, 1 \to B)$
  - $D: (0 \to E, 1 \to C)$
  - $E: (0 \to D, 1 \to E)$
  - $F: (0 \to F, 1 \to B)$

### Traza de Ejecución:

1. **Pares iniciales marcados por ser Final vs No Final (NF):**
   - $(A, D)$, $(B, D)$, $(C, D)$, $(D, E)$, $(D, F)$
2. **Pasada 1:**
   - $(A, B)$ transita con `0` a $(B, D)$ (marcado) $\to$ Marcado.
   - $(A, E)$ transita con `0` a $(B, D)$ (marcado) $\to$ Marcado.
   - $(B, C)$ transita con `0` a $(D, F)$ (marcado) $\to$ Marcado.
   - $(B, F)$ transita con `0` a $(D, F)$ (marcado) $\to$ Marcado.
   - $(C, E)$ transita con `0` a $(F, D)$ (marcado) $\to$ Marcado.
   - $(E, F)$ transita con `0` a $(D, F)$ (marcado) $\to$ Marcado.
3. **Pasada 2:**
   - $(A, C)$ transita con `1` a $(C, B)$ (marcado en pasada 1) $\to$ Marcado.
   - $(A, F)$ transita con `1` a $(C, B)$ (marcado en pasada 1) $\to$ Marcado.
4. **Pasada 3:**
   - No se marcan nuevos pares. Fin de iteraciones.
5. **Pares no marcados resultantes:**
   - $(B, E)$ con $\delta(B,0)=D=\delta(E,0)$ y $\delta(B,1)=E=\delta(E,1)$.
   - $(C, F)$ con $\delta(C,0)=F=\delta(F,0)$ y $\delta(C,1)=B=\delta(F,1)$.
6. **Clases de equivalencia:**
   - $\{A\}$
   - $\{B, E\} \implies \mathbf{(B,E)}$
   - $\{C, F\} \implies \mathbf{(C,F)}$
   - $\{D\}$

El AFD mínimo resultante cuenta con **4 estados**, reduciendo en un 33.3% el tamaño del autómata original sin alterar el lenguaje reconocido.

---

## 4. Análisis de Complejidad Temporal y Espacial

- **Número de pares a evaluar:** $\binom{|Q|}{2} = \frac{|Q|(|Q|-1)}{2} = \mathcal{O}(|Q|^2)$.
- **Iteraciones máximas:** En el peor de los casos, cada pasada marca al menos un par nuevo, lo que da a lo sumo $\mathcal{O}(|Q|^2)$ pasadas. Sin embargo, en cada pasada se evalúan los $|\Sigma|$ símbolos.
- **Complejidad Temporal:** $\mathcal{O}(|\Sigma| \cdot |Q|^2)$ en la implementación optimizada con detección de punto fijo.
- **Complejidad Espacial:** $\mathcal{O}(|Q|^2)$ para almacenar la matriz de pares con sus explicaciones paso a paso.
