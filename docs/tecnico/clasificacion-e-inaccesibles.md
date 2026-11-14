# Clasificación de Autómatas y Eliminación de Estados Inaccesibles

**Materia:** Teoría de la Computación  
**Autor:** Ángel Jhoan Díaz Vargas (Desarrollador 2)  
**Módulos:** `src/core/classification`, `src/core/reachability`  
**Requisitos cubiertos:** RF-05, RF-07

---

## 1. Clasificación de Autómatas (RF-05)

### 1.1 Fundamento Teórico

Un autómata finito formal se define como una 5-tupla $M = (Q, \Sigma, \delta, q_0, F)$.
La clasificación entre determinista (AFD) y no determinista (AFND) depende exclusivamente de las propiedades de su función de transición $\delta$:

1. **Determinista (AFD):** Para cada estado $q \in Q$ y cada símbolo $a \in \Sigma$, existe a lo sumo un estado destino $p \in Q$ tal que $(q, a, p) \in \delta$. Además, no existen transiciones espontáneas sin consumo de símbolo ($\varepsilon$-transiciones).
2. **No Determinista (AFND):** Si existe al menos un par $(q, a)$ que posea dos o más estados destino diferentes, o si existe al menos una transición etiquetada con el símbolo vacío ($\varepsilon$ o `E`), el autómata es no determinista.

> **Nota sobre completitud:** Un autómata con transiciones deterministas pero no totales (con huecos donde falta definir algún $(q,a)$) sigue siendo determinista en su comportamiento paso a paso; la aplicación lo clasifica como AFD y posteriormente completa dichas transiciones ausentes dirigiéndolas a un estado sumidero `error`.

### 1.2 Implementación del Algoritmo (`classify.ts`)

La función `classify(automaton: Automaton): ClassificationResult` opera de la siguiente manera:

1. Inicializa un arreglo de razones pedagógicas en español.
2. Itera sobre cada transición $(from, symbol, to) \in \delta$:
   - Verifica si $symbol$ coincide con el símbolo de cadena vacía `ε` o `E`. De ser así, registra: `"Contiene transiciones vacías (ε)"` y marca `deterministic = false`.
   - Utiliza una tabla hash con clave compuesta `${from}:${symbol}` para contar los destinos. Si el contador excede 1, registra la no determinismo: `"Desde el estado 'X' con el símbolo 's' hay múltiples destinos..."` y marca `deterministic = false`.
3. Si al finalizar el recorrido no se hallaron violaciones, se concluye que el autómata es determinista y se añade la explicación: `"Para cada estado y símbolo del alfabeto hay a lo sumo una transición, y no existen transiciones ε."`

### 1.3 Complejidad Algorítmica

- **Tiempo:** $\mathcal{O}(|\delta|)$, donde $|\delta|$ es el número total de transiciones. Se realiza un único pase lineal registrando en un `Map` indexado con acceso promedio $\mathcal{O}(1)$.
- **Espacio:** $\mathcal{O}(|Q| \cdot |\Sigma|)$ para almacenar el mapa de dispersión de transiciones evaluadas.

---

## 2. Eliminación de Estados Inaccesibles (RF-07)

### 2.1 Fundamento Teórico

Un estado $q \in Q$ se define como **accesible** (o alcanzable) si existe alguna cadena $w \in \Sigma^*$ tal que la función de transición extendida lleva del estado inicial a dicho estado:
$$\hat{\delta}(q_0, w) = q$$

Cualquier estado $q \in Q$ para el cual no exista dicho camino es un estado **inaccesible**. Los estados inaccesibles son redundantes: no afectan el lenguaje aceptado por el autómata ($L(M)$ permanece invariante), pero incrementan innecesariamente el espacio de estados y el costo de la minimización.

### 2.2 Implementación del Algoritmo (`removeUnreachable.ts`)

La eliminación de inaccesibles se implementa mediante una búsqueda en anchura (**BFS - Breadth First Search**):

1. **Grafo de Adyacencia:** Se construye una lista de adyacencia mapeando cada estado $u \in Q$ hacia sus estados vecinos directos $\{v \mid \exists a \in \Sigma, (u, a, v) \in \delta\}$.
2. **Recorrido BFS:**
   - Se encola el estado inicial $q_0$ y se inserta en un conjunto de visitados `visited = new Set([q0])`.
   - Mientras la cola no esté vacía, se desencola el estado actual $u$ y se exploran todos sus destinos adyacentes $v$. Si $v \notin visited$, se agrega a `visited` y se encola.
3. **Poda e Invariantes:**
   - **Estados:** $Q_{accesibles} = Q \cap visited$.
   - **Inaccesibles:** $Q_{removidos} = Q \setminus visited$.
   - **Finales:** $F_{nuevo} = F \cap visited$.
   - **Transiciones:** $\delta_{nuevo} = \{(u, a, v) \in \delta \mid u \in visited \land v \in visited\}$.
4. **Trazabilidad:** Se registra en el log de operaciones el listado explícito de los estados eliminados para retroalimentación al usuario en la vista de etapas (RF-10).

### 2.3 Complejidad Algorítmica

- **Tiempo:** $\mathcal{O}(|Q| + |\delta|)$. La construcción de la lista de adyacencia toma $\mathcal{O}(|\delta|)$ y el recorrido BFS visita cada estado y cada arco a lo sumo una vez.
- **Espacio:** $\mathcal{O}(|Q| + |\delta|)$ para la lista de adyacencia, el conjunto `visited` y la cola de exploración.
