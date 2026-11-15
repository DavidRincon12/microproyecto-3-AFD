# Guion de la sustentación

**Materia:** Teoría de la Computación
**Autores:** David Santiago Rincón Bautista y Ángel Jhoan Díaz Vargas
**Duración estimada:** [COMPLETAR: tiempo asignado por el curso]

---

## 1. Preparación

Antes de empezar, se abre la aplicación ya compilada (`npm run build` y `npm run preview`) para que el diagrama no tarde en la primera carga, y se dejan a mano este guion y la matriz de pruebas. Los tres casos que exige el enunciado se demuestran con ejemplos que ya están cargados en la aplicación, así que no hace falta escribir nada en vivo, aunque conviene tener lista una expresión distinta por si se pide.

| Caso del enunciado                       | Modalidad | Ejemplo                               | Presenta                            |
| ---------------------------------------- | --------- | ------------------------------------- | ----------------------------------- |
| Construcción desde una expresión regular | A         | `(a\|b)*abb` sobre `a,b`              | David                               |
| Determinización de un AFN                | B         | AFND de clase con estados A, B, C     | David opera y explica la conversión |
| Minimización de un AFD                   | B         | AFD de clase con seis estados (A a F) | Ángel                               |
| Simulación de cadenas                    | A o B     | `abb` y `ab`; `00` y `01`             | Ángel                               |

## 2. Caso 1: construcción desde una expresión regular

1. En la Modalidad A se carga el ejemplo «Cadenas sobre {a, b} que terminan en abb» y se explica la sintaxis: la estrella se aplica antes que la concatenación, y esta antes que la unión.
2. En la pestaña de construcción se recorren los pasos de Thompson: los fragmentos de `a` y de `b`, la unión con su nuevo inicial `q4`, la estrella con `q6` y `q7`, y las concatenaciones con transiciones ε. El AFND-ε tiene 14 estados, con inicial `q6` y final `q13`.
3. La clasificación muestra que es no determinista por sus transiciones ε.
4. La conversión AFND → AFD empieza por la clausura-ε de `q6` y produce un AFD de 5 estados; al pulsar un paso, el diagrama resalta el estado que se procesa.
5. La minimización lo reduce a 4 estados, y la casilla de comparación muestra cualquier etapa al lado del AFD mínimo.

## 3. Caso 2: determinización de un AFN

1. En la Modalidad B se carga el AFND de clase con estados A, B y C y se procesa.
2. La clasificación señala por qué no es determinista: δ(A, 1) = {A, C}.
3. En la conversión se recorren los pasos con la notación de clase. Por ejemplo, AC con 1 va a A,1→AC y C,1→B, cuya unión es {A, B, C} y da el estado nuevo ABC; B con 1 no tiene destino, así que aparece el estado `error`.
4. Se muestra la correspondencia («ABC proviene de {A, B, C}») y que son finales los estados que contienen a C.

## 4. Caso 3: minimización de un AFD

1. En la Modalidad B se carga el AFD de clase con seis estados (A a F, final D) y se procesa. La conversión indica que el autómata ya es determinista y se continúa con la minimización, como pide el enunciado.
2. En la tabla de pares se explica la marca inicial `NF` de los pares que incluyen a D y cada pasada con su análisis; por ejemplo, (A,B) con 0 va a (B,D), que ya está marcado, así que (A,B) se marca.
3. Los pares que nunca se marcan se fusionan: (B,E) y (C,F). El AFD mínimo tiene los estados A, (B,E), (C,F) y D.

## 5. Simulación y errores

En el simulador se prueba una cadena aceptada y otra rechazada, recorriendo los pasos para que el diagrama resalte cada estado. Para mostrar la validación se escribe una entrada errónea, como el alfabeto `a,b,a` o la expresión `(ab`, y se señala que el mensaje dice qué está mal, dónde y cómo corregirlo.

## 6. Preguntas probables

**¿Por qué Thompson y no otro método?** Porque construye el AFND-ε fragmento por fragmento, uno por cada parte de la expresión, lo que permite explicar la construcción paso a paso; después se aplica la conversión y la minimización que exige el enunciado.

**¿Qué pasa si el autómata ingresado ya es determinista?** La clasificación lo indica, la conversión no lo modifica y se continúa con la minimización.

**¿Para qué sirve el estado `error`?** Representa el conjunto vacío de la construcción por subconjuntos y deja el AFD completo, condición que necesita la tabla de pares.

**¿Por qué termina la tabla de pares?** Cada pasada marca al menos un par o el proceso se detiene, y hay un número finito de pares, $\binom{|Q|}{2}$.

**¿Qué hace la biblioteca gráfica?** Solo dibuja el diagrama a partir del texto DOT que genera nuestro código; la construcción, la conversión y la minimización están implementadas por el equipo.

**¿Por qué hay límites de 200 caracteres y 200 estados?** Porque la construcción por subconjuntos puede crecer de forma exponencial; los límites evitan que la página se congele y avisan al usuario con un mensaje claro.
