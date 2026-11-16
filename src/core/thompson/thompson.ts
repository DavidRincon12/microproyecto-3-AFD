import {
  fromJson,
  indexToLetterState,
  type Automaton,
  type StageResult,
  type StateId,
  type Step,
  type Sym,
} from '../model';
import type { RegexNode } from '../regex';

interface PositionInfo {
  id: number;
  symbol: Sym;
  state: StateId;
}

interface NodeAnalysis {
  nullable: boolean;
  firstpos: Set<number>;
  lastpos: Set<number>;
}

/**
 * Construcción del AFND mediante el método del Autómata de Posiciones (Glushkov / Berry-Sethi).
 * Produce un autómata finito sin transiciones vacías (sin ε / λ), donde cada símbolo
 * de la expresión regular corresponde a una posición y un estado (RF-03).
 */
export function thompson(ast: RegexNode, alphabet: ReadonlySet<Sym>): StageResult {
  const positions: PositionInfo[] = [];
  const followpos = new Map<number, Set<number>>();

  function analyze(node: RegexNode): NodeAnalysis {
    switch (node.kind) {
      case 'epsilon':
        return { nullable: true, firstpos: new Set(), lastpos: new Set() };
      case 'symbol': {
        const id = positions.length + 1;
        const state = indexToLetterState(id); // 1 -> 'B', 2 -> 'C', etc. 'A' es el inicial.
        positions.push({ id, symbol: node.value, state });
        followpos.set(id, new Set());
        return { nullable: false, firstpos: new Set([id]), lastpos: new Set([id]) };
      }
      case 'union': {
        const left = analyze(node.left);
        const right = analyze(node.right);
        return {
          nullable: left.nullable || right.nullable,
          firstpos: new Set([...left.firstpos, ...right.firstpos]),
          lastpos: new Set([...left.lastpos, ...right.lastpos]),
        };
      }
      case 'concat': {
        const left = analyze(node.left);
        const right = analyze(node.right);
        for (const p of left.lastpos) {
          const followSet = followpos.get(p)!;
          for (const q of right.firstpos) {
            followSet.add(q);
          }
        }
        return {
          nullable: left.nullable && right.nullable,
          firstpos: new Set([...left.firstpos, ...(left.nullable ? right.firstpos : [])]),
          lastpos: new Set([...right.lastpos, ...(right.nullable ? left.lastpos : [])]),
        };
      }
      case 'star': {
        const child = analyze(node.child);
        for (const p of child.lastpos) {
          const followSet = followpos.get(p)!;
          for (const q of child.firstpos) {
            followSet.add(q);
          }
        }
        return { nullable: true, firstpos: child.firstpos, lastpos: child.lastpos };
      }
      case 'plus': {
        const child = analyze(node.child);
        for (const p of child.lastpos) {
          const followSet = followpos.get(p)!;
          for (const q of child.firstpos) {
            followSet.add(q);
          }
        }
        return { nullable: child.nullable, firstpos: child.firstpos, lastpos: child.lastpos };
      }
      case 'optional': {
        const child = analyze(node.child);
        return { nullable: true, firstpos: child.firstpos, lastpos: child.lastpos };
      }
    }
  }

  const root = analyze(ast);

  const posMap = new Map<number, PositionInfo>();
  for (const p of positions) {
    posMap.set(p.id, p);
  }

  const initialState: StateId = 'A';
  const states: StateId[] = [initialState, ...positions.map((p) => p.state)];

  // Transiciones: estrictamente con símbolos de entrada, sin transiciones vacías
  const transitions: [StateId, Sym, StateId][] = [];
  const seenTransitions = new Set<string>();
  const addTransition = (from: StateId, symbol: Sym, to: StateId) => {
    const key = `${from}\u0000${symbol}\u0000${to}`;
    if (!seenTransitions.has(key)) {
      seenTransitions.add(key);
      transitions.push([from, symbol, to]);
    }
  };

  // 1. Desde el estado inicial A hacia cada posición en firstpos(raíz)
  for (const p of root.firstpos) {
    const info = posMap.get(p)!;
    addTransition(initialState, info.symbol, info.state);
  }

  // 2. Desde cada estado-posición hacia sus posiciones siguientes (followpos)
  for (const p of positions) {
    const targets = followpos.get(p.id) ?? new Set();
    for (const q of targets) {
      const destInfo = posMap.get(q)!;
      addTransition(p.state, destInfo.symbol, destInfo.state);
    }
  }

  // 3. Estados terminales: los que están en lastpos(raíz) + 'A' si la expresión acepta cadena vacía
  const finals: StateId[] = [];
  if (root.nullable) {
    finals.push(initialState);
  }
  for (const p of root.lastpos) {
    const s = posMap.get(p)!.state;
    if (!finals.includes(s)) {
      finals.push(s);
    }
  }

  const automaton: Automaton = fromJson({
    states,
    alphabet: [...alphabet],
    initial: initialState,
    finals,
    transitions,
  });

  const steps: Step[] = [];

  // Paso 1: Numeración de posiciones
  if (positions.length > 0) {
    steps.push({
      title: 'Identificación de posiciones de la expresión',
      detail:
        'Cada aparición de un símbolo en la expresión recibe una posición numerada de izquierda a derecha. ' +
        'El estado inicial es A y las posiciones corresponden a los estados B, C, D…',
      table: {
        headers: ['Posición', 'Símbolo', 'Estado asignado'],
        rows: positions.map((p) => [String(p.id), p.symbol, p.state]),
      },
    });

    // Paso 2: Posiciones que pueden seguir (followpos)
    steps.push({
      title: 'Tabla de posiciones siguientes (followpos)',
      detail:
        'Para cada posición, se determinan las posiciones que pueden seguir inmediatamente según la concatenación y repeticiones.',
      table: {
        headers: ['Posición', 'Símbolo', 'Estado', 'Posiciones siguientes'],
        rows: positions.map((p) => {
          const targets = [...(followpos.get(p.id) ?? [])];
          const dests = targets.map((q) => `${posMap.get(q)!.state} (pos ${q})`).join(', ');
          return [String(p.id), p.symbol, p.state, dests || '—'];
        }),
      },
    });
  }

  // Paso 3: Iniciales y terminales
  const firstsStr =
    [...root.firstpos].map((p) => `${posMap.get(p)!.state} (pos ${p})`).join(', ') || 'ninguna';
  const lastsStr =
    [...root.lastpos].map((p) => `${posMap.get(p)!.state} (pos ${p})`).join(', ') || 'ninguna';
  steps.push({
    title: 'Posiciones iniciales y terminales',
    detail:
      `Posiciones iniciales con las que puede iniciar una palabra: { ${firstsStr} }. ` +
      `Posiciones terminales con las que puede finalizar: { ${lastsStr} }.` +
      (root.nullable
        ? ' La expresión acepta la palabra vacía, por lo que el estado inicial A también es terminal.'
        : ''),
  });

  // Paso 4: Transiciones construidas
  steps.push({
    title: 'Construcción de transiciones del autómata finito',
    detail:
      `Se generan transiciones desde el estado inicial A con cada símbolo hacia sus posiciones iniciales, ` +
      `y desde cada estado-posición hacia sus posiciones siguientes. ` +
      `El autómata resultante tiene ${states.length} estados y no contiene transiciones vacías (todas las transiciones consumen símbolos de entrada).`,
  });

  return {
    stage: 'construction',
    title: 'Construcción del AFND (Autómata de Posiciones)',
    summary: `AFND con ${states.length} estados sin transiciones vacías: inicial ${initialState} y terminales ${finals.join(', ')}.`,
    automaton,
    steps,
  };
}
