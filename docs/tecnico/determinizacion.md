# Conversión de AFND a AFD

**Materia:** Teoría de la Computación
**Autor:** David Santiago Rincón Bautista (Desarrollador 1)
**Módulo:** `src/core/determinization`
**Requisito cubierto:** RF-06

---

## 1. Fundamento

Todo autómata finito no determinista tiene un AFD equivalente, es decir, uno que reconoce el mismo lenguaje. La construcción por subconjuntos lo obtiene haciendo que cada estado del AFD represente el **conjunto** de estados en los que podría estar el AFND después de leer la misma cadena.

Cuando el AFND tiene transiciones vacías se usa la clausura-ε: la clausura-ε de un conjunto $S$ es el conjunto de estados alcanzables desde $S$ usando solo transiciones ε, incluidos los de $S$. `epsilonClosure` la calcula con una pila y un conjunto de visitados, así que termina aunque haya ciclos de ε.

## 2. Algoritmo

1. El estado inicial del AFD es la clausura-ε del estado inicial del AFND.
2. Para cada estado nuevo pendiente $S$ y cada símbolo $a$, en el orden del alfabeto, se unen los destinos de cada estado de $S$ con $a$ y se calcula la clausura-ε de esa unión. El conjunto resultante es el destino de $S$ con $a$; si no se había visto, queda pendiente.
3. El conjunto vacío se convierte en el estado `error`, que vuelve a sí mismo con cualquier símbolo.
4. Son finales los estados del AFD que contienen algún estado final del AFND.
5. Si el AFD llega a 200 estados, el proceso se detiene con el mensaje «La conversión generaría más de 200 estados. Simplifica la expresión o el autómata.», porque la cantidad de subconjuntos puede crecer de forma exponencial y la página se congelaría.

## 3. Nombres de los estados

Cada estado del AFD se nombra concatenando los estados de su subconjunto en el orden del autómata original, como en clase: `{q2, q0}` se llama `q0q2` y `{F, C}` se llama `CF`. El conjunto vacío se llama `error`. Un subconjunto de un solo estado conserva su nombre, así que un autómata que ya es determinista sale con los mismos nombres. Si la concatenación de un subconjunto de varios estados coincide con el nombre de un estado original o con un nombre ya asignado (con los estados `A`, `B` y `AB`, el subconjunto `{A, B}` daría `AB`), se usa el formato con llaves, `{A,B}`. Además, el AFD guarda en `origin` el subconjunto de cada estado.

## 4. Ejemplo de clase

El AFND del ejemplo de clase con estados A, B y C, cuyo único final es C, tiene esta tabla:

| Q   | 0   | 1    |
| --- | --- | ---- |
| →A  | B   | A, C |
| B   | C   | —    |
| *C  | —   | B    |

Como no tiene transiciones ε, el estado inicial del AFD es `A`. Cada fila siguiente es un paso de la explicación, escrito con la misma notación de la presentación de clase:

| Estado | Símbolo | Desde cada estado      | Unión     | Resultado     |
| ------ | ------- | ---------------------- | --------- | ------------- |
| A      | 0       | A,0→B                  | {B}       | B (nuevo)     |
| A      | 1       | A,1→AC                 | {A, C}    | AC (nuevo)    |
| B      | 0       | B,0→C                  | {C}       | C (nuevo)     |
| B      | 1       | B,1→∅                  | ∅         | error (nuevo) |
| AC     | 0       | A,0→B · C,0→∅          | {B}       | B             |
| AC     | 1       | A,1→AC · C,1→B         | {A, B, C} | ABC (nuevo)   |
| C      | 0       | C,0→∅                  | ∅         | error         |
| C      | 1       | C,1→B                  | {B}       | B             |
| error  | 0 y 1   | —                      | ∅         | error         |
| ABC    | 0       | A,0→B · B,0→C · C,0→∅  | {B, C}    | BC (nuevo)    |
| ABC    | 1       | A,1→AC · B,1→∅ · C,1→B | {A, B, C} | ABC           |
| BC     | 0       | B,0→C · C,0→∅          | {C}       | C             |
| BC     | 1       | B,1→∅ · C,1→B          | {B}       | B             |

El AFD resultante tiene siete estados, y son finales los cuatro que contienen a C:

| Q     | 0     | 1     |
| ----- | ----- | ----- |
| →A    | B     | AC    |
| B     | C     | error |
| *AC   | B     | ABC   |
| *C    | error | B     |
| error | error | error |
| *ABC  | BC    | ABC   |
| *BC   | C     | B     |

## 5. Explicación en la interfaz

La etapa «Conversión AFND → AFD» genera, en orden, un paso con la clausura-ε del estado inicial (solo si hay transiciones ε), un paso por cada estado procesado con la tabla de la sección anterior (que añade la columna «Clausura-ε» cuando corresponde) y un paso final con la tabla de transición completa y los estados finales. Al elegir un paso, el diagrama resalta el estado que se está procesando, y la sección «Correspondencia con la etapa anterior» muestra el subconjunto de cada estado.

Si la clasificación determina que el autómata ya es determinista, la etapa no lo convierte e informa «El autómata ya es determinista, así que no requiere conversión y se continúa con la minimización», como pide el enunciado.

## 6. Pruebas

Las pruebas de `epsilonClosure.test.ts` y `determinize.test.ts` cubren las cadenas y los ciclos de ε, los dos ejemplos de clase (A, B, C y q0, q1, q2) con su estado `error`, un autómata ya determinista, el choque de nombres con llaves, la equivalencia del AFD con el AFND-ε de `(a|b)*abb`, el corte en 200 estados y el formato de los pasos.
