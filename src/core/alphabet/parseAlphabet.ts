import { NotImplementedError, type Sym } from '../model';

/** 'a, b,0' → ['a', 'b', '0']. Lanza ValidationError(field 'alphabet'). */
export function parseAlphabet(_text: string): Sym[] {
  throw new NotImplementedError('parseAlphabet');
}
