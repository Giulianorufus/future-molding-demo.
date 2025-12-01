import React from "react";
import { error as logError } from "@/lib/log";

type Props = { name?: string; children: React.ReactNode };
type State = { error: Error | null; info?: React.ErrorInfo | null };

export default class DevErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): State {
    return { error, info: null };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log dettagliato
    logError(`[ErrorBoundary] ${this.props.name ?? "Component"}`, error, info);
    this.setState({ info });
  }

  handleReset = () => this.setState({ error: null, info: null });

  render() {
    const { error, info } = this.state;
    if (!error) return this.props.children;

    // In dev mostra messaggio e stack, così capiamo DOVE rompe
    return (
      <div style={{ padding: 16 }}>
        <h2>⚠️ Errore in {this.props.name ?? "Component"}</h2>
        <p><strong>{error.message}</strong></p>
        <pre style={{ whiteSpace: "pre-wrap" }}>{error.stack}</pre>
        {info?.componentStack ? (
          <>
            <h4>Component stack</h4>
            <pre style={{ whiteSpace: "pre-wrap" }}>{info.componentStack}</pre>
          </>
        ) : null}
        <button onClick={this.handleReset} style={{ marginTop: 8, padding: "6px 10px" }}>
          Ripristina
        </button>
      </div>
    );
  }
}
