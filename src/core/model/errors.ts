export type InputField =
  'alphabet' | 'regex' | 'states' | 'initial' | 'finals' | 'transitions' | 'word' | 'general';

/** Error de entrada que el usuario puede corregir. El mensaje dice qué está mal y cómo arreglarlo. */
export class ValidationError extends Error {
  readonly field: InputField;
  /** Posición del carácter, desde 1, cuando aplica. */
  readonly position?: number;

  constructor(message: string, field: InputField, position?: number) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.position = position;
  }
}

/** Solo para los stubs de la fase 0. Al final del proyecto no debe quedar ningún uso. */
export class NotImplementedError extends Error {
  constructor(what: string) {
    super(`${what}: pendiente de implementar`);
    this.name = 'NotImplementedError';
  }
}
