// ─── WCA Hub — Data Hooks ─────────────────────────────────────────
// useData(fetchFn, deps?) → { data, loading, error, refetch }
// Skeleton-safe: data is always an array/object, never null mid-load.

import { useState, useEffect, useCallback, useRef } from 'react';

export function useData(fetchFn, deps = [], fallback = []) {
  const [data,    setData]    = useState(fallback);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      if (mountedRef.current) setData(result ?? fallback);
    } catch (e) {
      if (mountedRef.current) setError(e.message || 'Error cargando datos');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => { mountedRef.current = false; };
  }, [load]);

  return { data, loading, error, refetch: load };
}

// Skeleton rows for tables while loading
export function SkeletonRows({ rows = 5, cols = 4 }) {
  return Array.from({ length: rows }).map((_, i) => (
    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
      {Array.from({ length: cols }).map((_, j) => (
        <td key={j} style={{ padding: '12px 14px' }}>
          <div className="skeleton" style={{
            height: 13,
            width: j === 0 ? '60%' : j === cols - 1 ? '40%' : '80%',
            borderRadius: 4,
          }} />
        </td>
      ))}
    </tr>
  ));
}

// Empty state component
export function EmptyState({ icon = '📭', title, subtitle, action }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '48px 24px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 40, marginBottom: 14 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 320, lineHeight: 1.6 }}>
          {subtitle}
        </div>
      )}
      {action && (
        <div style={{ marginTop: 20 }}>{action}</div>
      )}
    </div>
  );
}

// Toast hook
export function useToast() {
  const [toast, setToast] = useState(null);

  const show = useCallback((msg, color = '#059669') => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const ToastEl = toast ? (
    <div style={{
      position: 'fixed', top: 20, right: 90, zIndex:"var(--z-modal)",
      background: toast.color, color: '#fff',
      padding: '11px 18px', borderRadius: 11,
      fontSize: 13, fontWeight: 600,
      boxShadow: `0 6px 20px ${toast.color}40`,
      display: 'flex', gap: 8, alignItems: 'center',
      animation: 'slideIn .3s ease',
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    }}>
      ✓ {toast.msg}
    </div>
  ) : null;

  return { show, ToastEl };
}
