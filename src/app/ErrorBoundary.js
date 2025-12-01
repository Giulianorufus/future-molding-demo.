import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component } from "react";
import { error as logError } from '@/lib/log';
export class ErrorBoundary extends Component {
    constructor() {
        super(...arguments);
        this.state = { hasError: false };
        this.retry = () => { this.setState({ hasError: false }); location.reload(); };
    }
    static getDerivedStateFromError() { return { hasError: true }; }
    componentDidCatch(err) { logError("[ErrorBoundary]", err); }
    render() {
        if (this.state.hasError) {
            return (_jsxs("div", { role: "alert", className: "p-6 space-y-3", children: [_jsx("h1", { className: "text-xl font-semibold", children: "Qualcosa \u00E8 andato storto" }), _jsx("p", { children: "Prova a ricaricare. Se persiste, controlla i parametri inseriti o riprova pi\u00F9 tardi." }), _jsx("button", { onClick: this.retry, className: "px-3 py-2 border rounded", children: "Riprova" })] }));
        }
        return this.props.children;
    }
}
