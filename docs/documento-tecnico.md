# Documento técnico

**Software educativo para la construcción, determinización y minimización de autómatas finitos**

**Materia:** Teoría de la Computación
**Proyecto:** Microproyecto #3
**Autores:** David Santiago Rincón Bautista y Ángel Jhoan Díaz Vargas

---

## Contenido

1. Introducción
2. Arquitectura y decisiones de diseño
3. Estructuras de datos
4. Algoritmos
5. Representación gráfica y biblioteca utilizada
6. Explicación paso a paso y consulta de etapas
7. Validación
8. Límites conocidos

---

## 1. Introducción

El software recibe un lenguaje regular, descrito con un alfabeto y una expresión regular (Modalidad A), o un autómata finito ingresado a mano (Modalidad B), y lo transforma hasta obtener el AFD mínimo. En el camino identifica si el autómata es determinista, lo convierte en AFD cuando hace falta y elimina los estados inaccesibles. Cada transformación se explica paso a paso con la notación vista en clase, y el resultado final es la tabla y el diagrama de transición del AFD mínimo, con un simulador de cadenas.

Este documento describe las estructuras de datos, los algoritmos y las decisiones de diseño. La tabla siguiente relaciona cada requisito funcional con la sección que lo explica.

| Requisito | Descripción                                  | Sección |
| --------- | -------------------------------------------- | ------- |
| RF-01     | Registrar y validar el alfabeto              | 4.1     |
| RF-02     | Validar la expresión regular                 | 4.2     |
| RF-03     | Construir un autómata                        | 4.3     |
| RF-04     | Registrar manualmente un autómata            | 3.2     |
| RF-05     | Identificar si es determinista y explicarlo  | 4.4     |
| RF-06     | Convertir un AFND en AFD                     | 4.5     |
| RF-07     | Eliminar estados inaccesibles                | 4.6     |
| RF-09     | Minimizar el AFD                             | 4.7     |
| RF-10     | Mostrar operaciones y resultados intermedios | 6       |
| RF-11     | Tabla y diagrama del AFD mínimo              | 5       |
| RF-12     | Simular cadenas                              | 4.8     |
| RF-13     | Consultar y comparar cada etapa              | 6       |

---

## 2. Arquitectura y decisiones de diseño

### 2.1 Plataforma

La aplicación es una página web de una sola vista, construida con Vite, React y TypeScript en modo estricto y sin servidor. No guarda datos ni se conecta con sistemas externos, porque cada cálculo depende solo de la entrada y termina en milisegundos. La lógica de los autómatas vive en `src/core/` como TypeScript puro, sin dependencias de la interfaz, y se prueba con Vitest.

Esta opción se eligió porque la aplicación corre en cualquier navegador sin instalar nada, lo que simplifica su uso en clase, y porque Graphviz, la herramienta estándar para dibujar autómatas, funciona en el navegador compilado a WebAssembly. La separación entre núcleo puro e interfaz permitió, además, que los dos integrantes trabajaran en paralelo con carpetas de un solo dueño.

| Alternativa                    | A favor                          | En contra                                                  |
| ------------------------------ | -------------------------------- | ---------------------------------------------------------- |
| Python con Tkinter o Streamlit | algoritmos sencillos de escribir | interfaz menos cuidada y Graphviz instalado en cada equipo |
| Java con Swing o JavaFX        | tipado fuerte                    | más código de interfaz y diagramas dibujados a mano        |
| Web con Cytoscape.js           | diagramas interactivos           | disposiciones no pensadas para autómatas                   |

### 2.2 Módulos

El sistema es un monolito modular en el cliente. Cada carpeta de `src/core/` contiene un algoritmo con sus pruebas y se usa solo a través de su `index.ts`; cada carpeta de `src/features/` contiene un componente de la interfaz, y `src/app/` los compone en la página.

| Módulo                     | Responsabilidad                                                | Requisitos   |
| -------------------------- | -------------------------------------------------------------- | ------------ |
| `core/model`               | Tipos del autómata, formato JSON, nombres de estados y errores | todos        |
| `core/alphabet`            | Validar el alfabeto                                            | RF-01        |
| `core/regex`               | Analizar la expresión regular                                  | RF-02        |
| `core/thompson`            | Construir el AFND-ε                                            | RF-03        |
| `core/classification`      | Decidir si el autómata es AFD o AFND                           | RF-05        |
| `core/determinization`     | Clausura-ε y construcción por subconjuntos                     | RF-06        |
| `core/reachability`        | Eliminar estados inaccesibles                                  | RF-07        |
| `core/minimization`        | Minimizar con la tabla de pares                                | RF-09        |
| `core/simulation`          | Recorrer una cadena sobre el AFD                               | RF-12        |
| `core/dot`                 | Generar el texto DOT del diagrama                              | RF-11        |
| `core/pipeline`            | Encadenar las etapas                                           | RF-10, RF-13 |
| `features/language-input`  | Formulario de la Modalidad A                                   | RF-01, RF-02 |
| `features/automaton-input` | Formulario de la Modalidad B                                   | RF-04        |
| `features/pipeline-view`   | Pestañas de etapas, pasos y comparación                        | RF-10, RF-13 |
| `features/automaton-view`  | Tabla y diagrama de transición                                 | RF-11        |
| `features/simulation`      | Simulador de cadenas                                           | RF-12        |

### 2.3 Reglas de dependencias

Las reglas se comprueban con dependency-cruiser en `npm run lint` y en el CI, de modo que un import prohibido hace fallar la verificación.

| Regla                                                              | Nombre en `.dependency-cruiser.cjs` |
| ------------------------------------------------------------------ | ----------------------------------- |
| El núcleo no importa React, Graphviz, `features` ni `app`          | `core-sin-interfaz`                 |
| Entre carpetas del núcleo solo se importa el `index.ts` de la otra | `core-solo-por-index`               |
| La interfaz solo importa el `index.ts` de cada carpeta del núcleo  | `interfaz-usa-core-por-index`       |
| Una funcionalidad solo importa el `index.ts` de otra               | `feature-solo-por-index`            |
| No hay dependencias circulares                                     | `no-circular`                       |
| Todo import resuelve                                               | `not-to-unresolvable`               |

### 2.4 Flujo de etapas

`runPipeline` produce siempre cinco etapas, y cada una entrega su autómata, un resumen y la lista de pasos que la interfaz muestra en una pestaña:

1. En la Modalidad A, la **construcción** valida el alfabeto y la expresión y arma el AFND-ε de Thompson; en la Modalidad B, la etapa de **entrada** muestra el autómata registrado.
2. La **clasificación** decide si el autómata es determinista y explica cada motivo.
3. La **conversión AFND → AFD** aplica la construcción por subconjuntos. Si el autómata ya es determinista, la etapa lo indica y no lo modifica, como pide el enunciado.
4. La **eliminación de inaccesibles** recorre el autómata desde el estado inicial y quita lo que no se alcanza.
5. La **minimización** completa el AFD con el estado `error` si le faltan transiciones y aplica la tabla de pares.

El simulador trabaja sobre el autómata de la última etapa.

### 2.5 Atributos de calidad

| Atributo       | Cómo se cumple                                                                                  |
| -------------- | ----------------------------------------------------------------------------------------------- |
| Corrección     | Los ejemplos de clase resueltos a mano pasan por el proceso completo en las pruebas automáticas |
| Explicabilidad | Cada etapa genera pasos con la notación de clase y conserva la correspondencia entre estados    |
| Usabilidad     | Todo error dice qué está mal, dónde y cómo corregirlo, junto al campo afectado                  |
| Rendimiento    | Cada transformación tarda milisegundos con autómatas de hasta 200 estados                       |
| Mantenibilidad | Las reglas de dependencias se prueban en cada cambio                                            |

---

## 3. Estructuras de datos

### 3.1 Representación del autómata

Un autómata finito se define como la quíntupla $M = (Q, \Sigma, \delta, q_0, F)$, y el tipo `Automaton` la representa con conjuntos, como pide el lineamiento técnico:

```ts
interface Automaton {
  states: ReadonlySet<StateId>; // Q
  alphabet: ReadonlySet<Sym>; // Σ
  initial: StateId; // q0
  finals: ReadonlySet<StateId>; // F
  delta: ReadonlyMap<StateId, ReadonlyMap<Sym, ReadonlySet<StateId>>>; // δ
  origin?: ReadonlyMap<StateId, ReadonlySet<StateId>>;
}
```

La función de transición se guarda como $\delta: Q \times (\Sigma \cup \{\varepsilon\}) \to \mathcal{P}(Q)$, es decir, un mapa de cada estado a un mapa de cada símbolo al **conjunto** de destinos. Con esa forma, un AFND y un AFD usan el mismo tipo: el AFD es el caso en que ningún conjunto tiene más de un elemento y no hay transiciones con ε. La construcción por subconjuntos opera directamente sobre esos conjuntos, y una transición que no existe simplemente no tiene clave, de modo que `targets(automaton, q, a)` devuelve el conjunto vacío.

Los conjuntos de JavaScript conservan el orden de inserción, y ese orden se usa para mostrar las tablas y para formar los nombres de los estados nuevos. Ninguna función del núcleo modifica el autómata que recibe; cada etapa construye uno nuevo.

### 3.2 Formato JSON y registro manual

Los ejemplos de prueba, la carga de ejemplos y el formulario de la Modalidad B (RF-04) usan un formato JSON con listas, más cómodo de escribir a mano:

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
    ["B", "ε", "C"]
  ]
}
```

Cada transición es `[origen, símbolo, destino]`. Un AFND repite el mismo origen y símbolo con varios destinos, y las transiciones vacías usan `ε`. La función `fromJson` convierte este formato en un `Automaton` y rechaza con un `ValidationError` los autómatas inconsistentes: sin estados o con estados repetidos, con un alfabeto inválido, con un estado inicial o final que no existe, o con transiciones que usan estados o símbolos fuera del autómata. En el formulario de la Modalidad B, los nombres de los estados además solo pueden usar letras, dígitos y guion bajo, y no pueden llamarse `error`, porque ese nombre queda reservado para el estado sumidero.

### 3.3 Alfabeto

Cada símbolo es exactamente un carácter, contado por punto de código para que `ñ` o `á` valgan por uno. Los nueve caracteres que usa la sintaxis de las expresiones o del formulario quedan reservados y no pueden pertenecer al alfabeto: `ε`, `|`, `*`, `+`, `?`, `(`, `)`, `,` y el espacio. La regla vive en el modelo, así que la aplican igual `fromJson` y el validador de la Modalidad A.

### 3.4 Nombres de los estados nuevos

El lineamiento técnico pide nombres consistentes que conserven su correspondencia con los estados originales. La aplicación sigue la notación de clase:

| Situación                                 | Regla                                           | Ejemplo                   |
| ----------------------------------------- | ----------------------------------------------- | ------------------------- |
| Construcción de Thompson                  | `q` y un consecutivo desde 0                    | `q0`, `q1`, `q2`          |
| Subconjunto en la determinización         | concatenación en el orden del autómata original | `{q2, q0}` → `q0q2`       |
| Subconjunto vacío                         | estado sumidero                                 | `error`                   |
| La concatenación coincide con otro estado | llaves y comas                                  | `{A,B}` si ya existe `AB` |
| Grupo fusionado en la minimización        | paréntesis y comas, en el orden del autómata    | `(B,E)`                   |

Además del nombre, cada autómata generado guarda en `origin` el conjunto de estados de la etapa anterior del que proviene cada estado nuevo, y la interfaz lo muestra como «AC proviene de {A, C}».

### 3.5 Resultados de cada etapa

Cada algoritmo devuelve un `StageResult` con el identificador de la etapa, su título, un resumen de una oración, el autómata resultante y la lista de pasos de la explicación:

```ts
interface Step {
  title: string; // 'Estado AC'
  detail: string; // qué se hizo y por qué
  table?: { headers: string[]; rows: string[][] }; // tabla intermedia
  highlight?: StateId[]; // estados que el diagrama resalta en este paso
}
```

`runPipeline` reúne los cinco resultados en un `PipelineResult`, cuyo campo `minimal` es el autómata de la última etapa. La interfaz no recalcula nada: solo muestra lo que el núcleo ya explicó.

### 3.6 Errores de entrada

Los errores que el usuario puede corregir se lanzan como `ValidationError`, con tres datos: el mensaje en español, el campo afectado (`alphabet`, `regex`, `states`, `initial`, `finals`, `transitions`, `word` o `general`) y, cuando aplica, la posición del carácter contada desde 1. Con el campo, la interfaz muestra el mensaje junto al dato que hay que corregir; con la posición, señala el carácter exacto. Cualquier otro error se muestra como «Ocurrió un error inesperado», sin interrumpir la página.

---

## 4. Algoritmos

### 4.1 Validación del alfabeto (RF-01)

El alfabeto se escribe como una lista de símbolos separados por comas (`a, b, 0`), y `parseAlphabet` lo convierte en una lista de símbolos. Los espacios alrededor de cada símbolo se ignoran. El alfabeto es inválido si está vacío, si tiene un símbolo vacío entre dos comas, si un símbolo se repite, si un símbolo tiene más de un carácter o si usa un carácter reservado (sección 3.3). Cada error indica la posición del símbolo en el texto, contada en caracteres, para que la interfaz lo señale.

### 4.2 Expresiones regulares: sintaxis y análisis (RF-02)

La Modalidad A recibe una expresión regular con esta sintaxis documentada:

| Operador | Significado             | Ejemplo   | Cadenas que describe |
| -------- | ----------------------- | --------- | -------------------- |
| `ab`     | concatenación           | `ab`      | `ab`                 |
| `\|`     | unión                   | `a\|b`    | `a`, `b`             |
| `*`      | cero o más repeticiones | `a*`      | ε, `a`, `aa`…        |
| `+`      | una o más repeticiones  | `a+`      | `a`, `aa`…           |
| `?`      | cero o una vez          | `a?`      | ε, `a`               |
| `( )`    | agrupación              | `(ab)*`   | ε, `ab`, `abab`…     |
| `ε`      | cadena vacía            | `a(b\|ε)` | `a`, `ab`            |

Los operadores `*`, `+` y `?` tienen la mayor precedencia, les sigue la concatenación y por último la unión, de modo que `ab*|c` se lee $(a(b^*))\,|\,c$. Los espacios se ignoran y la expresión admite hasta 200 caracteres. La gramática es la siguiente:

```text
union  = concat { "|" concat } ;
concat = repeat { repeat } ;
repeat = atom { "*" | "+" | "?" } ;
atom   = símbolo-del-alfabeto | "ε" | "(" union ")" ;
```

`parseRegex` es un analizador descendente recursivo con una función por regla de la gramática. Recorre el texto por caracteres, salta los espacios y conserva la posición original de cada uno. Como la concatenación no tiene operador, `concat` sigue leyendo mientras el siguiente carácter pueda iniciar un átomo, es decir, mientras no sea `|`, `)`, `*`, `+` ni `?`. El resultado es un árbol sintáctico (`RegexNode`) con siete tipos de nodo: símbolo, ε, concatenación, unión, estrella, cierre positivo y opcional.

Cada error de sintaxis se informa con su posición:

| Entrada              | Mensaje                                                                         |
| -------------------- | ------------------------------------------------------------------------------- |
| (vacía)              | La expresión regular está vacía. Escribe una expresión, por ejemplo (a\|b)*abb. |
| `(ab`                | Falta cerrar el paréntesis abierto en la posición 1.                            |
| `ab)`                | El paréntesis de la posición 3 no tiene uno que lo abra.                        |
| `()`                 | Los paréntesis de la posición 1 están vacíos.                                   |
| `*a`                 | "\*" no tiene una expresión a la que aplicarse (posición 1).                    |
| `a\|`                | Falta una expresión después de "\|" (posición 2).                               |
| `abc` con Σ = {a, b} | "c" (posición 3) no pertenece al alfabeto {a, b}.                               |

### 4.3 Construcción de Thompson (RF-03)

`thompson` recorre el árbol en postorden y construye un fragmento de AFND-ε por nodo, siempre con un solo estado inicial y un solo estado final. Los estados se llaman `q0`, `q1`… en el orden en que se crean.

| Nodo               | Fragmento                                                                             |
| ------------------ | ------------------------------------------------------------------------------------- |
| símbolo `a`        | nuevo $i$ —a→ nuevo $f$                                                               |
| `ε`                | nuevo $i$ —ε→ nuevo $f$                                                               |
| concatenación $st$ | final de $s$ —ε→ inicial de $t$                                                       |
| unión $s\|t$       | nuevo $i$ —ε→ iniciales de $s$ y de $t$; finales de $s$ y de $t$ —ε→ nuevo $f$        |
| $s^*$              | nuevo $i$ —ε→ inicial de $s$ y nuevo $f$; final de $s$ —ε→ inicial de $s$ y nuevo $f$ |
| $s^+$              | igual que $s^*$, sin la transición de $i$ a $f$                                       |
| $s?$               | nuevo $i$ —ε→ inicial de $s$ y nuevo $f$; final de $s$ —ε→ nuevo $f$                  |

La concatenación une los fragmentos con una transición ε en lugar de fusionar estados, porque así cada paso de la explicación muestra un fragmento completo y fácil de reconocer.

Con el alfabeto `a,b` y la expresión `(a|b)*abb`, la construcción genera 14 estados en diez pasos, uno por nodo del árbol: los fragmentos de `a` (`q0`, `q1`) y de `b` (`q2`, `q3`); la unión, con nuevo inicial `q4` y nuevo final `q5`; la estrella, con `q6` y `q7` alrededor de `q4…q5`; y los fragmentos de `a`, `b` y `b` (`q8` a `q13`), concatenados en orden con transiciones ε. El AFND-ε resultante tiene como inicial a `q6` y como único final a `q13`; la conversión a AFD lo reduce a 5 estados y la minimización a 4.

### 4.4 Clasificación AFD o AFND (RF-05)

Un autómata es **determinista** si para cada estado $q \in Q$ y cada símbolo $a \in \Sigma$ existe a lo sumo un estado destino, y no tiene transiciones vacías. Es **no determinista** si algún par $(q, a)$ tiene dos o más destinos o si existe al menos una transición con ε. Un autómata con transiciones deterministas pero no totales, es decir, con pares $(q, a)$ sin destino, sigue siendo determinista; la aplicación lo clasifica como AFD y la minimización completa después esas transiciones hacia el estado sumidero `error`.

`classify` recorre cada estado del autómata. Si el estado tiene transiciones con ε, registra un paso «Transición ε desde q»; después, para cada símbolo del alfabeto, consulta $\delta(q, a)$: si tiene más de un destino registra un paso «No determinismo en (q, a)», y si no tiene ninguno anota la transición faltante. Todos los motivos se informan, sin detenerse en el primero. El autómata es determinista si no hubo motivos y completo si no faltó ninguna transición; si es determinista pero incompleto, un paso lista hasta cinco de las transiciones faltantes y anuncia que la minimización lo completará con `error`. El resultado conserva el autómata sin cambios y añade los campos `deterministic` y `complete`.

El recorrido hace una consulta por cada par $(q, a)$, más una por estado para ε, así que su complejidad es $\mathcal{O}(|Q| \cdot |\Sigma|)$.

### 4.5 Conversión de AFND a AFD (RF-06)

Todo AFND tiene un AFD equivalente, es decir, uno que reconoce el mismo lenguaje. La construcción por subconjuntos lo obtiene haciendo que cada estado del AFD represente el **conjunto** de estados en los que podría estar el AFND después de leer la misma cadena. Cuando hay transiciones vacías se usa la clausura-ε: la clausura-ε de un conjunto $S$ es el conjunto de estados alcanzables desde $S$ usando solo transiciones ε, incluidos los de $S$. `epsilonClosure` la calcula con una pila y un conjunto de visitados, así que termina aunque haya ciclos de ε.

El algoritmo de `determinize` es el siguiente:

1. El estado inicial del AFD es la clausura-ε del estado inicial del AFND.
2. Para cada estado nuevo pendiente $S$ y cada símbolo $a$, en el orden del alfabeto, se unen los destinos de cada estado de $S$ con $a$ y se calcula la clausura-ε de esa unión. El conjunto resultante es el destino de $S$ con $a$; si no se había visto, queda pendiente.
3. El conjunto vacío se convierte en el estado `error`, que vuelve a sí mismo con cualquier símbolo.
4. Son finales los estados del AFD que contienen algún estado final del AFND.
5. Si el AFD llega a 200 estados, el proceso se detiene con el mensaje «La conversión generaría más de 200 estados. Simplifica la expresión o el autómata.», porque la cantidad de subconjuntos puede crecer de forma exponencial y la página se congelaría.

Los estados se nombran con la convención de la sección 3.4, así que un autómata que ya es determinista conservaría sus nombres. En la práctica no llega a esta etapa: si la clasificación lo identifica como determinista, la etapa informa «El autómata ya es determinista, así que no requiere conversión y se continúa con la minimización», como pide el enunciado.

**Ejemplo de clase.** El AFND con estados A, B y C, cuyo único final es C, tiene esta tabla:

| Q   | 0   | 1    |
| --- | --- | ---- |
| →A  | B   | A, C |
| B   | C   | —    |
| \*C | —   | B    |

Como no tiene transiciones ε, el estado inicial del AFD es `A`. Cada fila siguiente es un paso de la explicación, con la misma notación de la presentación de clase:

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
| \*AC  | B     | ABC   |
| \*C   | error | B     |
| error | error | error |
| \*ABC | BC    | ABC   |
| \*BC  | C     | B     |

### 4.6 Eliminación de estados inaccesibles (RF-07)

Un estado $q$ es **accesible** si existe alguna cadena $w \in \Sigma^*$ que lleva del estado inicial a él, $\hat{\delta}(q_0, w) = q$. Los estados inaccesibles no afectan el lenguaje aceptado, $L(M)$ no cambia al quitarlos, pero aumentan el tamaño del autómata y el costo de la minimización.

`removeUnreachable` hace una búsqueda en anchura desde el estado inicial:

1. Encola $q_0$ y lo marca como visitado.
2. Mientras la cola no esté vacía, desencola un estado $u$ y recorre sus destinos con cada símbolo de $\Sigma \cup \{\varepsilon\}$; cada destino no visitado se marca y se encola.
3. Conserva los estados visitados, en su orden original, y las transiciones entre ellos. Los finales que no se alcanzan también desaparecen: $F' = F \cap \text{visitados}$.
4. Registra en la explicación los estados alcanzados y la lista de los eliminados, o indica que todos son accesibles.

El recorrido visita cada estado y cada transición a lo sumo una vez, así que su complejidad es $\mathcal{O}(|Q| + |\delta|)$ en tiempo y en espacio.

### 4.7 Minimización por tabla de pares (RF-09)

Dos estados $p$ y $q$ son **equivalentes** ($p \sim q$) si para toda cadena $w \in \Sigma^*$ ambos recorridos terminan a la vez en un estado final o a la vez en uno no final:

$$p \sim q \iff \forall w \in \Sigma^* : (\hat{\delta}(p, w) \in F \iff \hat{\delta}(q, w) \in F)$$

Si alguna cadena los distingue, el par es **distinguible**. El AFD mínimo resulta de fusionar cada clase de estados equivalentes en un solo estado. Para evaluar todos los pares no ordenados se usa una tabla triangular inferior con $\binom{|Q|}{2} = \frac{|Q|(|Q|-1)}{2}$ casillas, con los estados en el orden del autómata. `minimize` sigue el método visto en clase:

1. **Completitud.** La tabla necesita una función de transición total, así que si falta alguna transición se agrega el estado sumidero `error`, con $\delta(\text{error}, a) = \text{error}$ para todo $a \in \Sigma$, y las transiciones faltantes se dirigen a él.
2. **Marcado inicial.** La diagonal principal se marca con `≡`, y todo par con un estado terminal y otro no terminal se marca con `X` (distinguibles de orden 0). Los pares de dos estados terminales no se marcan al inicio para permitir fusiones si son equivalentes.
3. **Pasadas e iteraciones con [m, f, p].** Para cada par pendiente $(p, q)$ y cada símbolo $a$ se calcula el par de destinos $(\delta(p, a), \delta(q, a))$. Se genera una tabla de análisis de cada pasada con las columnas `Par`, `Análisis` y `Resultado`:
   - Si el par de destinos ya está marcado con `X`, el par se marca: **`m(p,q)`**.
   - Si para todos los símbolos los destinos son iguales (caen sobre la diagonal `≡`), se fusionan de inmediato: **`f(p,q)`**.
   - En otro caso queda pendiente para la siguiente iteración: **`p(p,q)`**.
     Las pasadas se repiten sobre los pares pendientes hasta que una no marque ningún par nuevo (punto fijo).
4. **Fusión y matriz final.** Los pares equivalentes finales se identifican en la matriz con la marca **`O`**. Se agrupan mediante conjuntos disjuntos (_union-find_) con compresión de caminos, para que las fusiones sean transitivas: si $B \sim E$ y $E \sim G$, el grupo resultante es $(B,E,G)$.
5. **AFDM (Autómata Mínimo).** Cada grupo resultante es un estado en el AFDM, nombrado con sus miembros en el orden del autómata, como `(B,E)`. El estado inicial es el grupo que contiene a $q_0$, son terminales ($Q_T$) los grupos que contienen algún estado terminal original, y las transiciones se toman del representante del grupo.

**Ejemplo de clase.** El AFD tiene los estados A a F, inicial A y único terminal D ($Q_T = \{D\}$), con estas transiciones:

| Q   | 0   | 1   |
| --- | --- | --- |
| →A  | B   | C   |
| B   | D   | E   |
| C   | F   | B   |
| \*D | E   | C   |
| E   | D   | E   |
| F   | F   | B   |

1. **Marcado inicial (`X`):** (A,D), (B,D), (C,D), (D,E) y (D,F), porque D es terminal y los demás no. Diagonal con `≡`.
2. **Pasada 1:** Se evalúan los pares pendientes. (A,B), (A,E), (B,C), (B,F), (C,E) y (E,F) se marcan con `m(p,q)` porque con `0` llegan a un par que contiene a D y ya está marcado.
3. **Pasada 2:** (A,C) y (A,F) se marcan con `m(p,q)` porque con `1` llegan a (B,C), marcado en la pasada anterior.
4. **Pasada 3:** No se marca ningún par nuevo; los pares pendientes restantes caen sobre la diagonal `≡` y se identifican con `f(B,E)` y `f(C,F)`.
5. **Pares fusionados (`O` en la matriz final):** (B,E), porque $\delta(B,0) = \delta(E,0) = D$ y $\delta(B,1) = \delta(E,1) = E$; y (C,F), porque $\delta(C,0) = \delta(F,0) = F$ y $\delta(C,1) = \delta(F,1) = B$.

El AFDM tiene cuatro estados, A, (B,E), (C,F) y D, dos menos que el original, y reconoce el mismo lenguaje.

**Complejidad.** La tabla tiene $\mathcal{O}(|Q|^2)$ pares y cada pasada los revisa con los $|\Sigma|$ símbolos, es decir, $\mathcal{O}(|\Sigma| \cdot |Q|^2)$ operaciones por pasada. Como cada pasada útil distingue pares con cadenas un símbolo más largas, hay a lo sumo $|Q|$ pasadas, de modo que el peor caso es $\mathcal{O}(|\Sigma| \cdot |Q|^3)$ en tiempo y $\mathcal{O}(|Q|^2)$ en espacio para la tabla.

### 4.8 Simulación de cadenas (RF-12)

La simulación de una cadena $w = a_1 a_2 \dots a_n$ sobre un AFD sigue la función de transición extendida:

$$\hat{\delta}(q, \varepsilon) = q \qquad \hat{\delta}(q, wa) = \delta(\hat{\delta}(q, w), a)$$

La cadena se **acepta** si $\hat{\delta}(q_0, w) \in F$ y se **rechaza** en caso contrario. `simulate` trabaja así:

1. Revisa la cadena antes de recorrerla. Si contiene un símbolo que no está en el alfabeto, lanza un `ValidationError` del campo `word` con su posición, y el simulador muestra el mensaje junto al campo de la cadena.
2. La cadena vacía no hace ninguna transición: se acepta si el estado inicial es final y se rechaza si no lo es.
3. En otro caso, recorre la cadena símbolo por símbolo desde el estado inicial y guarda cada transición tomada (estado de origen, símbolo y estado de destino). Si un símbolo no tiene transición desde el estado actual, la simulación se detiene y rechaza, indicando en qué estado y con qué carácter se detuvo.
4. Al terminar, acepta si el último estado es final y explica la razón del veredicto.

El recorrido hace una consulta por símbolo, así que su complejidad es $\mathcal{O}(|w|)$.

En la interfaz, el simulador tiene un campo para la cadena (en blanco para probar ε) y el botón «Simular». Muestra el veredicto en texto, «Aceptada» o «Rechazada», con su explicación y un color de apoyo, y una tabla con cada transición del recorrido. Los botones «Paso anterior» y «Paso siguiente» avanzan por el recorrido mientras el diagrama resalta el estado actual.

---

## 5. Representación gráfica y biblioteca utilizada

### 5.1 Tabla y diagrama de transición (RF-11)

La tabla de transición marca el estado inicial con `→` y los finales con `*`, con una leyenda que lo explica. Una celda sin transición muestra `—`, una celda de AFND con varios destinos los separa con coma, y la columna `ε` solo aparece si el autómata tiene transiciones vacías.

El diagrama se genera en dos pasos. Primero, `toDot`, implementado por el equipo, convierte el autómata en texto DOT, el lenguaje de descripción de grafos de Graphviz, con estas reglas:

- disposición de izquierda a derecha (`rankdir=LR`);
- estados finales con `shape=doublecircle` y los demás con `shape=circle`;
- un nodo auxiliar `__inicio` de forma `point` con una flecha hacia el estado inicial;
- los símbolos que van del mismo origen al mismo destino comparten una sola arista con la etiqueta agrupada (`0,1`), como en los diagramas de clase;
- los nombres van entre comillas, porque los estados generados contienen paréntesis y comas, y los estados resaltados llevan un relleno de color.

Después, el componente `AutomatonDiagram` pasa ese texto a Graphviz, que calcula la disposición y devuelve un SVG que se inserta en la página. El módulo de Graphviz se carga solo cuando hace falta dibujar, porque pesa varios megabytes.

### 5.2 Biblioteca gráfica

El lineamiento técnico pide documentar la función de cualquier biblioteca gráfica y que la construcción, la determinización y la minimización las implemente el equipo. Ningún algoritmo de la materia se delegó a bibliotecas externas: la validación del alfabeto y de la expresión, la construcción de Thompson, la clausura-ε, la determinización, la clasificación, la eliminación de inaccesibles, la minimización, la simulación y la generación del texto DOT están implementadas por los integrantes. La biblioteca se limita a dibujar en el navegador el texto DOT que genera `toDot`.

| Propiedad             | Detalle                          |
| --------------------- | -------------------------------- |
| Paquete               | `@viz-js/viz`                    |
| Versión instalada     | 3.31.0                           |
| Licencia del paquete  | MIT                              |
| Tecnología subyacente | Graphviz compilado a WebAssembly |
| Licencia de Graphviz  | Eclipse Public License (EPL-1.0) |
| Fuente                | https://github.com/viz-js/viz    |

La biblioteca se eligió porque funciona por completo en el navegador, sin instalar Graphviz en el sistema ni depender de un servidor, y porque el SVG que produce se ve nítido a cualquier tamaño.

---

## 6. Explicación paso a paso y consulta de etapas (RF-10, RF-13)

Cada algoritmo genera su propia explicación como una lista de pasos (sección 3.5), y la vista de etapas la muestra sin recalcular nada. La interfaz presenta una pestaña por etapa con su resumen, la tabla y el diagrama del autómata de esa etapa, la correspondencia de cada estado con los de la etapa anterior y la lista numerada de pasos, con sus tablas intermedias. Al elegir un paso, el diagrama resalta los estados que ese paso usa. La casilla «Comparar con el AFD mínimo» muestra al lado la tabla y el diagrama del resultado final, para comparar cualquier etapa con él, como pide el RF-13.

---

## 7. Validación

El proyecto tiene 229 pruebas automáticas con Vitest, que se ejecutan con `npm test` y en el CI de cada pull request junto con el lint, la revisión de tipos y el build. Las pruebas unitarias cubren cada algoritmo con sus casos borde, y las de interfaz usan Testing Library. Además, `src/core/pipeline/fixtures.test.ts` pasa todos los ejemplos de clase resueltos a mano (`src/core/__fixtures__/`) por el proceso completo y el simulador, y comprueba su clasificación, el tamaño del AFD mínimo y las cadenas que deben aceptarse y rechazarse.

La validación funcional está en la matriz de pruebas (`docs/matriz-de-pruebas.md`), con 31 casos de las dos modalidades y capturas de la aplicación como evidencia en `docs/evidencias/`.

---

## 8. Límites conocidos

- La expresión regular admite hasta 200 caracteres, para que el análisis y la construcción no agoten la pila del navegador.
- La conversión AFND → AFD se detiene si el AFD tendría más de 200 estados, porque la construcción por subconjuntos puede crecer de forma exponencial.
- Los estados que provienen de Thompson concatenan muchos nombres (`q0q1q2q4q5q7q8q9q10`), lo que alarga los diagramas; se aceptó así porque esa convención conserva la correspondencia con los estados originales que pide el enunciado.
- El módulo WebAssembly de Graphviz pesa varios megabytes, lo que hace más lenta la primera carga del diagrama.
