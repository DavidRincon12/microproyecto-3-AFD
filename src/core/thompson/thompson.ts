import { NotImplementedError, type StageResult, type Sym } from '../model';
import type { RegexNode } from '../regex';

/** AFND-ε con un solo estado final. Etapa 'construction'. */
export function thompson(_ast: RegexNode, _alphabet: ReadonlySet<Sym>): StageResult {
  throw new NotImplementedError('thompson');
}
