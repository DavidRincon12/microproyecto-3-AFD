import type { Sym } from '../model';

export type RegexNode =
  | { kind: 'symbol'; value: Sym }
  | { kind: 'epsilon' }
  | { kind: 'concat'; left: RegexNode; right: RegexNode }
  | { kind: 'union'; left: RegexNode; right: RegexNode }
  | { kind: 'star'; child: RegexNode }
  | { kind: 'plus'; child: RegexNode }
  | { kind: 'optional'; child: RegexNode };
