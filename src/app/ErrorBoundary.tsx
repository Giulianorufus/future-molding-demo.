import { Component, type ReactNode } from "react";
import { log } from "@/lib/log";

type State = { hasError: boolean };
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err: unknown) { log.error("[ErrorBoundary]", err); }
  private retry = () => { this.setState({ hasError: false }); location.reload(); };
  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" className="p-6 space-y-3">
          <h1 className="text-xl font-semibold">Qualcosa è andato storto</h1>
          <p>Prova a ricaricare. Se persiste, controlla i parametri inseriti o riprova più tardi.</p>
          <button onClick={this.retry} className="px-3 py-2 border rounded">Riprova</button>
        </div>
      );
    }
    return this.props.children;
  }
}