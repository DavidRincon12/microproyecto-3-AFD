# Simulación de Cadenas en Autómatas Finitos Deterministas

**Materia:** Teoría de la Computación  
**Autor:** Ángel Jhoan Díaz Vargas (Desarrollador 2)  
**Módulos:** `src/core/simulation`, `src/features/simulation`  
**Requisito cubierto:** RF-12

---

## 1. Fundamento Teórico

La simulación de una cadena $w = a_1 a_2 \dots a_n \in \Sigma^*$ en un Autómata Finito Determinista $M = (Q, \Sigma, \delta, q_0, F)$ modela formalmente la computación de la máquina de estados.

La trayectoria de computación se define mediante la función de transición extendida $\hat{\delta}: Q \times \Sigma^* \to Q$:
$$\hat{\delta}(q, \varepsilon) = q$$
$$\hat{\delta}(q, wa) = \delta(\hat{\delta}(q, w), a) \quad \text{donde } w \in \Sigma^*, a \in \Sigma$$

### 1.1 Criterio de Aceptación

Una cadena $w$ es **aceptada** por el autómata si y solo si la computación partiendo del estado inicial $q_0$ termina en algún estado perteneciente al conjunto de estados finales:
$$\hat{\delta}(q_0, w) \in F$$
En caso contrario ($\hat{\delta}(q_0, w) \notin F$ o si la computación cae en un estado trampa `error`), la cadena es **rechazada**.

---

## 2. Implementación del Simulador (`simulate.ts`)

La función `simulate(automaton: Automaton, input: string): SimulationResult` realiza el procesamiento con las siguientes características:

### 2.1 Validación Previa del Alfabeto

Antes de iniciar la ejecución, se escanea cada carácter de la cadena de entrada `input`. Si se detecta un símbolo $s \notin \Sigma$, se aborta la simulación y se genera un resultado de rechazo con mensaje descriptivo:
$$\text{reason} = \text{"La cadena contiene el símbolo 's' que no pertenece al alfabeto."}$$

### 2.2 Tratamiento Riguroso de la Cadena Vacía ($\varepsilon$)

Si el usuario envía una cadena vacía (longitud 0):

- No se realiza ninguna transición (0 pasos).
- La traza indica que el autómata se mantiene en el estado inicial $q_0$.
- El veredicto es **Aceptada** si $q_0 \in F$, o **Rechazada** si $q_0 \notin F$.

### 2.3 Generación de la Traza de Computación

Para cadenas no vacías, se realiza un recorrido paso a paso:

1. Se inicia en `currentState = automaton.initial`.
2. Para cada símbolo $a_i$ en la posición $i$:
   - Se consulta la transición $(currentState, a_i) \to nextState$.
   - Si no existe transición explícita o se alcanza el estado `error`, se registra la interrupción y se marca como rechazada.
   - Si existe, se añade un paso a la traza:
     ```typescript
     steps.push({
       from: currentState,
       symbol: a_i,
       to: nextState,
       stepIndex: i + 1,
     });
     ```
   - Se actualiza `currentState = nextState`.
3. Al finalizar todos los símbolos de la cadena, se evalúa si `currentState` pertenece a `automaton.finals`.

---

## 3. Componente de Interfaz (`Simulator.tsx`)

El simulador visual proporciona:

- **Campo de texto interactivo:** Permite ingresar cadenas y cuenta con un botón para insertar rápidamente la cadena vacía $\varepsilon$.
- **Botones de prueba rápida:** Carga directa de cadenas de prueba aceptadas y rechazadas basadas en los fixtures.
- **Badge de Veredicto:** Indicador en color verde (**Aceptada**) o rojo (**Rechazada**) de alta visibilidad.
- **Línea de tiempo de pasos:** Representación visual de cada transición ejecutada, indicando el estado origen, el símbolo consumido y el estado destino.
- **Explicación textual formal:** Mensaje pedagógico que resume por qué la cadena fue aceptada o rechazada y en qué estado concluyó la evaluación.
