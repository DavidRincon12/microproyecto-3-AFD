/** Reglas de dependencias entre carpetas del proyecto. */
module.exports = {
  forbidden: [
    { name: 'no-circular', severity: 'error', from: {}, to: { circular: true } },
    // Si un import no resuelve, las demás reglas no lo ven: por eso falla.
    { name: 'not-to-unresolvable', severity: 'error', from: {}, to: { couldNotResolve: true } },
    {
      name: 'core-sin-interfaz',
      comment: 'El núcleo es lógica pura: no importa React, Graphviz, features ni app.',
      severity: 'error',
      from: { path: '^src/core/' },
      to: { path: ['^src/(features|app)/', '^node_modules/(react|react-dom|@viz-js)/'] },
    },
    {
      name: 'core-solo-por-index',
      comment: 'Entre carpetas del núcleo solo se importa el index.ts de la otra carpeta.',
      severity: 'error',
      from: { path: '^src/core/([^/]+)/' },
      to: {
        path: '^src/core/[^/]+/',
        pathNot: ['^src/core/$1/', '^src/core/[^/]+/index\\.ts$', '^src/core/__fixtures__/'],
      },
    },
    {
      name: 'interfaz-usa-core-por-index',
      severity: 'error',
      from: { path: '^src/(features|app)/' },
      to: {
        path: '^src/core/[^/]+/',
        pathNot: ['^src/core/[^/]+/index\\.ts$', '^src/core/__fixtures__/'],
      },
    },
    {
      name: 'feature-solo-por-index',
      severity: 'error',
      from: { path: '^src/features/([^/]+)/' },
      to: {
        path: '^src/features/[^/]+/',
        pathNot: ['^src/features/$1/', '^src/features/[^/]+/index\\.tsx?$'],
      },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.app.json' },
  },
};
