import { NotImplementedError, type Sym } from '../model';
import type { RegexNode } from './ast';

/** Lanza ValidationError(field 'regex', position). */
export function parseRegex(_text: string, _alphabet: ReadonlySet<Sym>): RegexNode {
  throw new NotImplementedError('parseRegex');
}
