# Arquitectura del software

**Materia:** Teoría de la Computación
**Autor:** David Santiago Rincón Bautista (Desarrollador 1)
**Alcance:** decisiones de diseño, módulos, reglas de dependencias y flujo de etapas

---

## 1. Contexto

La aplicación es un software educativo para el curso de Teoría de la Computación. Recibe un lenguaje regular (alfabeto y expresión regular) o un autómata finito, lo transforma hasta el AFD mínimo y explica cada transformación paso a paso, para que estudiantes y docentes comparen el proceso con el método visto en clase. No tiene usuarios registrados, no guarda datos y no se conecta con sistemas externos, porque cada cálculo depende solo de la entrada y termina en milisegundos.

## 2. Decisión de plataforma

La aplicación es una página web de una sola vista, construida con Vite, React y TypeScript en modo estricto y sin servidor. La lógica de los autómatas vive en `src/core/` como TypeScript puro, sin dependencias de la interfaz, y se prueba con Vitest. Los diagramas los dibuja Graphviz compilado a WebAssembly (`@viz-js/viz`) a partir del texto DOT que genera el código del equipo.

Esta opción se eligió porque la aplicación corre en cualquier navegador sin instalar nada, lo que simplifica la sustentación, y porque Graphviz es la herramienta estándar para dibujar autómatas: dispone los estados automáticamente, dibuja los finales con doble círculo y marca el inicial con una flecha. La separación entre núcleo puro e interfaz permitió, además, que dos personas trabajaran en paralelo con carpetas de un solo dueño.

| Alternativa                    | A favor                          | En contra                                                  |
| ------------------------------ | -------------------------------- | ---------------------------------------------------------- |
| Python con Tkinter o Streamlit | algoritmos sencillos de escribir | interfaz menos cuidada y Graphviz instalado en cada equipo |
| Java con Swing o JavaFX        | tipado fuerte                    | más código de interfaz y diagramas dibujados a mano        |
| Web con Cytoscape.js           | diagramas interactivos           | disposiciones no pensadas para autómatas                   |

Si el curso exigiera otro lenguaje, la parte que habría que traducir es el núcleo puro, y sus pruebas con ejemplos JSON servirían para validar la traducción.

## 3. Módulos

El sistema es un monolito modular en el cliente. Cada carpeta de `src/core/` contiene un algoritmo con sus pruebas y se usa solo a través de su `index.ts`; cada carpeta de `src/features/` contiene un componente de la interfaz.

| Módulo                     | Responsabilidad                                                              | Requisitos   |
| -------------------------- | ---------------------------------------------------------------------------- | ------------ |
| `core/model`               | Tipos del autómata, formato JSON, nombres de estados y errores de validación | todos        |
| `core/alphabet`            | Validar el alfabeto                                                          | RF-01        |
| `core/regex`               | Analizar la expresión regular                                                | RF-02        |
| `core/thompson`            | Construir el AFND-ε                                                          | RF-03        |
| `core/classification`      | Decidir si el autómata es AFD o AFND                                         | RF-05        |
| `core/determinization`     | Clausura-ε y construcción por subconjuntos                                   | RF-06        |
| `core/reachability`        | Eliminar estados inaccesibles                                                | RF-07        |
| `core/minimization`        | Minimizar con la tabla de pares                                              | RF-09        |
| `core/simulation`          | Recorrer una cadena sobre el AFD                                             | RF-12        |
| `core/dot`                 | Generar el texto DOT del diagrama                                            | RF-11        |
| `core/pipeline`            | Encadenar las etapas                                                         | RF-10, RF-13 |
| `features/language-input`  | Formulario de la Modalidad A                                                 | RF-01, RF-02 |
| `features/automaton-input` | Formulario de la Modalidad B                                                 | RF-04        |
| `features/pipeline-view`   | Pestañas de etapas, pasos y comparación                                      | RF-10, RF-13 |
| `features/automaton-view`  | Tabla y diagrama de transición                                               | RF-11        |
| `features/simulation`      | Simulador de cadenas                                                         | RF-12        |

## 4. Reglas de dependencias

Las reglas se comprueban con dependency-cruiser en `npm run lint` y en el CI, de modo que un import prohibido hace fallar la verificación.

| Regla                                                              | Nombre en `.dependency-cruiser.cjs` |
| ------------------------------------------------------------------ | ----------------------------------- |
| El núcleo no importa React, Graphviz, `features` ni `app`          | `core-sin-interfaz`                 |
| Entre carpetas del núcleo solo se importa el `index.ts` de la otra | `core-solo-por-index`               |
| La interfaz solo importa el `index.ts` de cada carpeta del núcleo  | `interfaz-usa-core-por-index`       |
| Una funcionalidad solo importa el `index.ts` de otra               | `feature-solo-por-index`            |
| No hay dependencias circulares                                     | `no-circular`                       |
| Todo import resuelve                                               | `not-to-unresolvable`               |

## 5. Flujo de etapas

`runPipeline` produce siempre cinco etapas, y cada una entrega su autómata, un resumen y la lista de pasos que la interfaz muestra en una pestaña:

1. En la Modalidad A, la **construcción** valida el alfabeto y la expresión y arma el AFND-ε de Thompson; en la Modalidad B, la etapa de **entrada** muestra el autómata registrado.
2. La **clasificación** decide si el autómata es determinista y explica cada motivo.
3. La **conversión AFND → AFD** aplica la construcción por subconjuntos. Si el autómata ya es determinista, la etapa lo indica y no lo modifica, como pide el enunciado.
4. La **eliminación de inaccesibles** recorre el autómata desde el estado inicial y quita lo que no se alcanza.
5. La **minimización** completa el AFD con el estado `error` si le faltan transiciones y aplica la tabla de pares.

El simulador trabaja sobre el autómata de la última etapa.

## 6. Atributos de calidad

| Atributo       | Cómo se cumple                                                                                  |
| -------------- | ----------------------------------------------------------------------------------------------- |
| Corrección     | Los ejemplos de clase resueltos a mano pasan por el proceso completo en las pruebas automáticas |
| Explicabilidad | Cada etapa genera pasos con la notación de clase y conserva la correspondencia entre estados    |
| Usabilidad     | Todo error dice qué está mal, dónde y cómo corregirlo, junto al campo afectado                  |
| Rendimiento    | Cada transformación tarda milisegundos con autómatas de hasta 200 estados                       |
| Mantenibilidad | Las reglas de dependencias se prueban en cada cambio                                            |

## 7. Límites conocidos

- La expresión regular admite hasta 200 caracteres, para que el análisis y la construcción no agoten la pila del navegador.
- La conversión AFND → AFD se detiene si el AFD tendría más de 200 estados, porque la construcción por subconjuntos puede crecer de forma exponencial.
- Los estados que provienen de Thompson concatenan muchos nombres (`q0q1q2q4q5q7q8q9q10`), lo que alarga los diagramas; se aceptó así porque esa convención conserva la correspondencia con los estados originales que pide el enunciado.
- El módulo WebAssembly de Graphviz pesa varios megabytes, lo que hace más lenta la primera carga del diagrama.
