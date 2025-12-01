import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import React from "react";
import { error as logError } from '@/lib/log';
export default class DevErrorBoundary extends React.Component {
    constructor() {
        super(...arguments);
        this.state = { error: null, info: null };
        this.handleReset = () => this.setState({ error: null, info: null });
    }
    static getDerivedStateFromError(error) {
        return { error, info: null };
    }
    componentDidCatch(error, info) {
        // Log dettagliato
        logError(`[ErrorBoundary] ${this.props.name ?? "Component"}`, error, info);
        this.setState({ info });
    }
    render() {
        const { error, info } = this.state;
        if (!error)
            return this.props.children;
        // In dev mostra messaggio e stack, così capiamo DOVE rompe
        return (_jsxs("div", { style: { padding: 16 }, children: [_jsxs("h2", { children: ["\u26A0\uFE0F Errore in ", this.props.name ?? "Component"] }), _jsx("p", { children: _jsx("strong", { children: error.message }) }), _jsx("pre", { style: { whiteSpace: "pre-wrap" }, children: error.stack }), info?.componentStack ? (_jsxs(_Fragment, { children: [_jsx("h4", { children: "Component stack" }), _jsx("pre", { style: { whiteSpace: "pre-wrap" }, children: info.componentStack })] })) : null, _jsx("button", { onClick: this.handleReset, style: { marginTop: 8, padding: "6px 10px" }, children: "Ripristina" })] }));
    }
}
