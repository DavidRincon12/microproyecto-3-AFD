import { EPSILON, type Automaton, type StateId, type Sym } from '../model';

function escapeDotString(text: string): string {
  return '"' + text.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}

/**
 * Genera la representación en lenguaje DOT de Graphviz para un autómata finito (RF-11).
 * Configura disposición horizontal (LR), estados de aceptación con doble círculo,
 * nodo invisible de inicio, agrupación de etiquetas para aristas paralelas y resaltado visual.
 */
export function toDot(automaton: Automaton, highlight?: readonly StateId[]): string {
  const lines: string[] = ['digraph automata {', '  rankdir=LR;', '  node [shape=circle];'];

  const highlightSet = new Set(highlight ?? []);

  // 1. Flecha hacia el estado inicial desde un nodo punto invisible
  lines.push('  "__inicio" [shape=point];');
  lines.push(`  "__inicio" -> ${escapeDotString(automaton.initial)};`);

  // 2. Configurar formas y estilos de los estados (ordenados para determinismo)
  const orderedStates = [...automaton.states].sort();

  for (const state of orderedStates) {
    const isFinal = automaton.finals.has(state);
    const isHighlighted = highlightSet.has(state);

    const attrs: string[] = [];

    if (isFinal) {
      attrs.push('shape=doublecircle');
    }

    if (isHighlighted) {
      attrs.push('style=filled', 'fillcolor="#bae6fd"', 'penwidth=2');
    }

    if (attrs.length > 0) {
      lines.push(`  ${escapeDotString(state)} [${attrs.join(', ')}];`);
    }
  }

  // 3. Agrupar transiciones con el mismo origen y destino
  // Origen -> Destino -> Set<Símbolos>
  const edgeGroups = new Map<StateId, Map<StateId, Set<Sym>>>();

  for (const from of orderedStates) {
    const fromMap = automaton.delta.get(from);
    if (!fromMap) continue;

    for (const [sym, dests] of fromMap) {
      for (const to of dests) {
        if (!edgeGroups.has(from)) {
          edgeGroups.set(from, new Map());
        }
        const toMap = edgeGroups.get(from)!;
        if (!toMap.has(to)) {
          toMap.set(to, new Set());
        }
        toMap.get(to)!.add(sym);
      }
    }
  }

  // 4. Escribir aristas ordenadas
  for (const from of orderedStates) {
    const toMap = edgeGroups.get(from);
    if (!toMap) continue;

    const orderedDests = [...toMap.keys()].sort();
    for (const to of orderedDests) {
      const symbols = [...toMap.get(to)!].sort((a, b) => {
        if (a === EPSILON) return 1;
        if (b === EPSILON) return -1;
        return a.localeCompare(b);
      });

      const label = symbols.join(',');
      lines.push(
        `  ${escapeDotString(from)} -> ${escapeDotString(to)} [label=${escapeDotString(label)}];`,
      );
    }
  }

  lines.push('}');
  return lines.join('\n');
}
