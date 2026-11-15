# Estructuras de datos

**Materia:** Teoría de la Computación
**Autor:** David Santiago Rincón Bautista (Desarrollador 1)
**Módulo:** `src/core/model`
**Requisitos cubiertos:** lineamientos técnicos sobre conjuntos de estados y nombres consistentes

---

## 1. Representación del autómata

Un autómata finito se define como la quíntupla $AF = (Q, \Sigma, \delta, q_0, F)$, y el tipo `Automaton` la representa con conjuntos, como pide el lineamiento técnico:

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

## 2. Formato JSON

Los ejemplos de prueba y la carga de ejemplos usan un formato JSON con listas, más cómodo de escribir a mano:

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

Cada transición es `[origen, símbolo, destino]`. Un AFND repite el mismo origen y símbolo con varios destinos, y las transiciones vacías usan `ε`. La función `fromJson` convierte este formato en un `Automaton` y rechaza con un `ValidationError` los autómatas inconsistentes: sin estados o con estados repetidos, con un alfabeto inválido, con un estado inicial o final que no existe, o con transiciones que usan estados o símbolos fuera del autómata. `toJson` hace la conversión inversa.

## 3. Alfabeto

Cada símbolo es exactamente un carácter, contado por punto de código para que `ñ` o `á` valgan por uno. Los nueve caracteres que usa la sintaxis de las expresiones o del formulario quedan reservados y no pueden pertenecer al alfabeto: `ε`, `|`, `*`, `+`, `?`, `(`, `)`, `,` y el espacio. La regla vive en el modelo (`symbolProblem`), así que la aplican igual `fromJson` y el validador del alfabeto de la Modalidad A.

## 4. Nombres de los estados nuevos

El lineamiento técnico pide nombres consistentes que conserven su correspondencia con los estados originales. La aplicación sigue la notación de clase:

| Situación                                 | Regla                                           | Ejemplo                   |
| ----------------------------------------- | ----------------------------------------------- | ------------------------- |
| Construcción de Thompson                  | `q` y un consecutivo desde 0                    | `q0`, `q1`, `q2`          |
| Subconjunto en la determinización         | concatenación en el orden del autómata original | `{q2, q0}` → `q0q2`       |
| Subconjunto vacío                         | estado sumidero                                 | `error`                   |
| La concatenación coincide con otro estado | llaves y comas                                  | `{A,B}` si ya existe `AB` |
| Grupo fusionado en la minimización        | paréntesis y comas                              | `(B,E)`                   |

Además del nombre, cada autómata generado guarda en `origin` el conjunto de estados de la etapa anterior del que proviene cada estado nuevo, y la interfaz lo muestra como «AC proviene de {A, C}».

## 5. Resultados de cada etapa

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

## 6. Errores de entrada

Los errores que el usuario puede corregir se lanzan como `ValidationError`, con tres datos: el mensaje en español, el campo afectado (`alphabet`, `regex`, `states`, `initial`, `finals`, `transitions`, `word` o `general`) y, cuando aplica, la posición del carácter contada desde 1. Con el campo, la interfaz muestra el mensaje junto al dato que hay que corregir; con la posición, señala el carácter exacto. Cualquier otro error se muestra como «Ocurrió un error inesperado», sin interrumpir la página.
