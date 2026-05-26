import { Component } from "react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("[WCA ErrorBoundary]", error, info?.componentStack);
  }
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center",
        justifyContent:"center", gap:16, fontFamily:"'DM Sans','Segoe UI',sans-serif",
        background:"var(--bg-page,#f8fafc)", padding:24 }}>
        <div style={{ width:56, height:56, borderRadius:"50%", background:"#fef2f2",
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:28 }}>⚠️</div>
        <div style={{ fontSize:16, fontWeight:700, color:"var(--text-primary,#0f172a)" }}>
          Algo salió mal
        </div>
        <div style={{ fontSize:13, color:"var(--text-secondary,#64748b)", textAlign:"center", maxWidth:360, lineHeight:1.6 }}>
          Ocurrió un error inesperado. Tus datos están seguros.
          Intentá recargar la página.
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={() => { window.location.href = "/"; }}
            style={{ padding:"10px 20px", background:"transparent", color:"#155266",
              border:"1px solid #155266", borderRadius:10, fontSize:13, fontWeight:600,
              cursor:"pointer", fontFamily:"inherit" }}>
            Ir al inicio
          </button>
          <button onClick={() => window.location.reload()}
            style={{ padding:"10px 24px", background:"#155266", color:"#fff", border:"none",
              borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer",
              fontFamily:"inherit" }}>
            Recargar página
          </button>
        </div>
        {this.state.error && import.meta.env.DEV && (
          <pre style={{ fontSize:10, color:"#94a3b8", maxWidth:500, overflow:"auto",
            background:"var(--bg-surface-subtle,#f1f5f9)", padding:12, borderRadius:8,
            marginTop:8 }}>
            {this.state.error.toString()}
          </pre>
        )}
        <button onClick={() => { this.setState({ hasError: false, error: null }); }}
          style={{ padding:"8px 20px", background:"transparent", color:"#64748b",
            border:"1px solid #e2e8f0", borderRadius:8, fontSize:12, cursor:"pointer",
            fontFamily:"inherit" }}>
          Volver al inicio
        </button>
      </div>
    );
  }
}
