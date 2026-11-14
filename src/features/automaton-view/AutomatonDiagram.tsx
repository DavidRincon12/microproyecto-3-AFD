import { useEffect, useRef, useState } from 'react';
import { toDot } from '../../core/dot';
import type { Automaton, StateId } from '../../core/model';

export function AutomatonDiagram(props: { automaton: Automaton; highlight?: readonly StateId[] }) {
  const { automaton, highlight } = props;
  const ref = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let cancelled = false;

    import('@viz-js/viz')
      .then(({ instance }) => instance())
      .then((viz) => {
        if (!cancelled && ref.current) {
          const dot = toDot(automaton, highlight);
          const svgElement = viz.renderSVGElement(dot);
          svgElement.style.maxWidth = '100%';
          svgElement.style.height = 'auto';
          svgElement.style.display = 'block';
          svgElement.style.margin = '0 auto';
          ref.current.replaceChildren(svgElement);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(`No se pudo cargar el motor de renderizado gráfico: ${String(err)}`);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [automaton, highlight]);

  return (
    <div
      ref={ref}
      role="img"
      aria-label={`Diagrama de transición con ${automaton.states.size} estados`}
      style={{
        margin: '1rem 0',
        padding: '1rem',
        background: '#ffffff',
        border: '1px solid var(--color-border, #e2e8f0)',
        borderRadius: '0.5rem',
        overflowX: 'auto',
        minHeight: '120px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {loading && (
        <p style={{ color: 'var(--color-text-muted, #64748b)' }}>
          Generando diagrama con Graphviz...
        </p>
      )}
      {error && (
        <p role="alert" style={{ color: '#ef4444' }}>
          {error}
        </p>
      )}
    </div>
  );
}
