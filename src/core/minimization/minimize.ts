import {
  ERROR_STATE,
  mergedName,
  targets,
  type Automaton,
  type StageResult,
  type StateId,
  type Step,
  type Sym,
  type Table,
} from '../model';

/**
 * Minimiza un AFD usando el método de la tabla de pares triangular inferior (RF-09).
 */
export function minimize(dfa: Automaton): StageResult {
  const steps: Step[] = [];

  // Paso 1: Completar con el estado sumidero 'error' si faltan transiciones
  let isComplete = true;
  for (const s of dfa.states) {
    for (const a of dfa.alphabet) {
      if (targets(dfa, s, a).size === 0) {
        isComplete = false;
        break;
      }
    }
    if (!isComplete) break;
  }

  let statesList = [...dfa.states];
  const delta = new Map<StateId, Map<Sym, StateId>>();
  const alphabet = [...dfa.alphabet];
  const finals = new Set<StateId>(dfa.finals);
  let initial = dfa.initial;

  // Copiar delta existente
  for (const s of dfa.states) {
    const sMap = new Map<Sym, StateId>();
    for (const a of alphabet) {
      const dests = targets(dfa, s, a);
      if (dests.size > 0) {
        sMap.set(a, [...dests][0]);
      }
    }
    delta.set(s, sMap);
  }

  if (!isComplete) {
    if (!statesList.includes(ERROR_STATE)) {
      statesList.push(ERROR_STATE);
    }
    const errMap = new Map<Sym, StateId>();
    for (const a of alphabet) {
      errMap.set(a, ERROR_STATE);
    }
    delta.set(ERROR_STATE, errMap);

    // Redirigir transiciones faltantes hacia 'error'
    for (const s of statesList) {
      let sMap = delta.get(s);
      if (!sMap) {
        sMap = new Map<Sym, StateId>();
        delta.set(s, sMap);
      }
      for (const a of alphabet) {
        if (!sMap.has(a)) {
          sMap.set(a, ERROR_STATE);
        }
      }
    }

    steps.push({
      title: 'Completar con estado de error',
      detail: `El autómata no estaba completo. Se agregó el estado sumidero '${ERROR_STATE}' con transiciones hacia sí mismo y se redirigieron las transiciones no definidas.`,
      highlight: [ERROR_STATE],
    });
  }

  const n = statesList.length;

  // Caso especial: autómata de 0 o 1 estado
  if (n <= 1) {
    return {
      stage: 'minimization',
      title: 'Minimización de estados',
      summary: 'El autómata ya es mínimo (tiene 1 o menos estados).',
      automaton: dfa,
      steps: [
        {
          title: 'Autómata trivial',
          detail: 'El autómata tiene un único estado y no requiere minimización.',
        },
      ],
    };
  }

  // Matriz triangular inferior: marcas 'X', 'NF', 'nf', 'F', ''
  // Par (i, j) con i > j
  const matrix: string[][] = Array.from({ length: n }, () => Array(n).fill(''));

  for (let i = 0; i < n; i++) {
    matrix[i][i] = 'X';
  }

  // Paso 2: Marcado inicial por estados finales / no finales
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < i; j++) {
      const iFinal = finals.has(statesList[i]);
      const jFinal = finals.has(statesList[j]);
      if (iFinal !== jFinal) {
        matrix[i][j] = 'NF';
      }
    }
  }

  function generateTableSnapshot(): Table {
    // Columnas 0 a n-2 (encabezados de columnas son los estados de 0 a n-2)
    const headers = ['Estado', ...statesList.slice(0, n - 1)];
    const rows: string[][] = [];

    // Filas 1 a n-1
    for (let i = 1; i < n; i++) {
      const row: string[] = [statesList[i]];
      for (let j = 0; j < n - 1; j++) {
        if (j < i) {
          row.push(matrix[i][j] || '·');
        } else if (j === i) {
          row.push('X');
        } else {
          row.push('');
        }
      }
      rows.push(row);
    }
    return { headers, rows };
  }

  steps.push({
    title: 'Matriz inicial de pares distinguibles',
    detail:
      'Se marcan con NF los pares distinguibles de orden 0 (donde un estado es final y el otro no) y con X la diagonal.',
    table: generateTableSnapshot(),
  });

  // Paso 3: Pasadas iterativas sobre pares pendientes
  let passNumber = 1;
  let changed = true;

  while (changed) {
    changed = false;
    const passDetails: string[] = [];

    for (let i = 1; i < n; i++) {
      for (let j = 0; j < i; j++) {
        if (matrix[i][j] !== '') continue;

        const s1 = statesList[i];
        const s2 = statesList[j];

        for (const a of alphabet) {
          const t1 = delta.get(s1)!.get(a)!;
          const t2 = delta.get(s2)!.get(a)!;

          if (t1 === t2) {
            passDetails.push(`(${s2},${s1}),${a} → (${t2},${t1}): cae en la diagonal`);
            continue;
          }

          const idx1 = statesList.indexOf(t1);
          const idx2 = statesList.indexOf(t2);
          const maxIdx = Math.max(idx1, idx2);
          const minIdx = Math.min(idx1, idx2);

          const targetMark = matrix[maxIdx][minIdx];
          if (targetMark === 'NF' || targetMark === 'nf') {
            matrix[i][j] = 'nf';
            changed = true;
            passDetails.push(
              `(${s2},${s1}),${a} → (${statesList[minIdx]},${statesList[maxIdx]}): marcado como ${targetMark}, se marca nf`,
            );
            break;
          }
        }
      }
    }

    if (passDetails.length > 0) {
      steps.push({
        title: `Pasada ${passNumber} de la tabla de pares`,
        detail:
          passDetails.slice(0, 5).join('; ') +
          (passDetails.length > 5 ? ` (y ${passDetails.length - 5} comparaciones más)` : '.'),
        table: generateTableSnapshot(),
      });
    }

    passNumber++;
  }

  // Paso 4: Identificar pares equivalentes / fusionables ('F')
  for (let i = 1; i < n; i++) {
    for (let j = 0; j < i; j++) {
      if (matrix[i][j] === '') {
        matrix[i][j] = 'F';
      }
    }
  }

  // Union-Find para agrupar estados equivalentes de forma transitiva
  const parent = Array.from({ length: n }, (_, i) => i);
  function find(x: number): number {
    if (parent[x] !== x) parent[x] = find(parent[x]);
    return parent[x];
  }
  function union(x: number, y: number): void {
    const rx = find(x);
    const ry = find(y);
    if (rx !== ry) parent[ry] = rx;
  }

  for (let i = 1; i < n; i++) {
    for (let j = 0; j < i; j++) {
      if (matrix[i][j] === 'F') {
        union(i, j);
      }
    }
  }

  // Agrupar estados por representante
  const groups = new Map<number, StateId[]>();
  for (let i = 0; i < n; i++) {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(statesList[i]);
  }

  // Generar nombres fusionados usando mergedName
  const groupToName = new Map<number, StateId>();
  const oldStateToNewState = new Map<StateId, StateId>();
  const originMap = new Map<StateId, ReadonlySet<StateId>>();
  const minimalStatesSet = new Set<StateId>();

  for (const [root, members] of groups) {
    const name = mergedName(members, statesList);
    groupToName.set(root, name);
    minimalStatesSet.add(name);
    originMap.set(name, new Set(members));

    for (const m of members) {
      oldStateToNewState.set(m, name);
    }
  }

  const minimalInitial = oldStateToNewState.get(initial)!;
  const minimalFinals = new Set<StateId>();
  for (const [root, members] of groups) {
    if (members.some((m) => finals.has(m))) {
      minimalFinals.add(groupToName.get(root)!);
    }
  }

  // Construir delta del AFD mínimo
  const minimalDelta = new Map<StateId, Map<Sym, Set<StateId>>>();
  for (const [root, members] of groups) {
    const stateName = groupToName.get(root)!;
    const sMap = new Map<Sym, Set<StateId>>();
    const rep = members[0];

    for (const a of alphabet) {
      const dest = delta.get(rep)!.get(a)!;
      const newDest = oldStateToNewState.get(dest)!;
      sMap.set(a, new Set([newDest]));
    }
    minimalDelta.set(stateName, sMap);
  }

  const mergedGroupsDesc = [...groups.values()]
    .filter((g) => g.length > 1)
    .map((g) => `(${g.join(', ')})`)
    .join(', ');

  if (mergedGroupsDesc) {
    steps.push({
      title: 'Estados equivalentes fusionados',
      detail: `Se identificaron las siguientes clases de equivalencia para fusión: ${mergedGroupsDesc}.`,
      table: generateTableSnapshot(),
    });
  } else {
    steps.push({
      title: 'Matriz final: sin estados fusionables',
      detail: 'Todos los pares de estados son distinguibles; el autómata ya era mínimo.',
      table: generateTableSnapshot(),
    });
  }

  const minimalAutomaton: Automaton = {
    states: minimalStatesSet,
    alphabet: new Set(alphabet),
    initial: minimalInitial,
    finals: minimalFinals,
    delta: minimalDelta,
    origin: originMap,
  };

  const summary =
    minimalStatesSet.size === dfa.states.size
      ? 'El autómata ya era mínimo; no se requirió fusionar ningún estado.'
      : `El autómata se minimizó de ${dfa.states.size} a ${minimalStatesSet.size} estados mediante la tabla de pares.`;

  return {
    stage: 'minimization',
    title: 'Minimización de estados',
    summary,
    automaton: minimalAutomaton,
    steps,
  };
}
