# Alfabeto, expresiones regulares y construcción de Thompson

**Materia:** Teoría de la Computación
**Autor:** David Santiago Rincón Bautista (Desarrollador 1)
**Módulos:** `src/core/alphabet`, `src/core/regex`, `src/core/thompson`
**Requisitos cubiertos:** RF-01, RF-02, RF-03

---

## 1. Validación del alfabeto (RF-01)

El alfabeto se escribe como una lista de símbolos separados por comas (`a, b, 0`), y `parseAlphabet` lo convierte en una lista de símbolos. Los espacios alrededor de cada símbolo se ignoran. El alfabeto es inválido si está vacío, si tiene un símbolo vacío entre dos comas, si un símbolo se repite, si un símbolo tiene más de un carácter o si usa uno de los nueve caracteres reservados (`ε`, `|`, `*`, `+`, `?`, `(`, `)`, `,` y el espacio). Cada error indica la posición del símbolo en el texto, contada en caracteres, para que la interfaz lo señale.

## 2. Sintaxis de las expresiones regulares (RF-02)

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

## 3. Analizador sintáctico

`parseRegex` es un analizador descendente recursivo con una función por regla de la gramática. Recorre el texto por caracteres, salta los espacios y conserva la posición original de cada uno. Como la concatenación no tiene operador, `concat` sigue leyendo mientras el siguiente carácter pueda iniciar un átomo, es decir, mientras no sea `|`, `)`, `*`, `+` ni `?`. El resultado es un árbol sintáctico (`RegexNode`) con siete tipos de nodo: símbolo, ε, concatenación, unión, estrella, cierre positivo y opcional. Para `(a|b)*abb`, el árbol concatena de izquierda a derecha la estrella de la unión de `a` y `b` con los símbolos `a`, `b` y `b`.

Cada error de sintaxis se informa con su posición:

| Entrada              | Mensaje                                                                         |
| -------------------- | ------------------------------------------------------------------------------- |
| (vacía)              | La expresión regular está vacía. Escribe una expresión, por ejemplo (a\|b)*abb. |
| `(ab`                | Falta cerrar el paréntesis abierto en la posición 1.                            |
| `ab)`                | El paréntesis de la posición 3 no tiene uno que lo abra.                        |
| `()`                 | Los paréntesis de la posición 1 están vacíos.                                   |
| `*a`                 | "*" no tiene una expresión a la que aplicarse (posición 1).                     |
| `a\|`                | Falta una expresión después de "\|" (posición 2).                               |
| `abc` con Σ = {a, b} | "c" (posición 3) no pertenece al alfabeto {a, b}.                               |

## 4. Construcción de Thompson (RF-03)

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

## 5. Ejemplo: `(a|b)*abb`

Con el alfabeto `a,b`, la construcción genera 14 estados y diez pasos, uno por nodo del árbol:

1. Fragmento de `a`: se crean `q0` y `q1`.
2. Fragmento de `b`: se crean `q2` y `q3`.
3. Unión de `a` y `b`: nuevo inicial `q4` con ε hacia `q0` y `q2`; `q1` y `q3` van con ε al nuevo final `q5`.
4. Estrella de `a|b`: nuevo inicial `q6` y nuevo final `q7` alrededor de `q4…q5`, para recorrer la unión cero o más veces.
5. a 10. Los fragmentos de `a`, `b` y `b` (`q8` a `q13`) se concatenan con transiciones ε, en orden.

El AFND-ε resultante tiene como inicial a `q6` y como único final a `q13`. La conversión a AFD lo reduce a 5 estados y la minimización a 4.

## 6. Pruebas

Las pruebas están en `parseAlphabet.test.ts`, `parseRegex.test.ts` y `thompson.test.ts`. Cubren la precedencia de los operadores, los espacios, los símbolos con tilde, cada mensaje de error con su posición, el límite de 200 caracteres, el número de estados y transiciones de cada fragmento y el lenguaje que acepta el AFND-ε construido.
