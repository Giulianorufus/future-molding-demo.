export function newRunId() {
    const t = new Date().toISOString();
    const r = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `${t}-${r}`;
}
export function createAudit(inputs) {
    const audit = {
        runId: newRunId(),
        startedAt: Date.now(),
        inputs,
        steps: [],
    };
    function step(label, data, level = "info") {
        audit.steps.push({ at: Date.now(), label, data, level });
    }
    function setDerived(data) {
        audit.derived = { ...(audit.derived ?? {}), ...data };
    }
    function setOutputs(outputs) {
        audit.outputs = outputs;
    }
    function setValidations(list) {
        audit.validations = list;
        audit.ok = list.every(v => v.severity !== "high");
    }
    function finish() {
        audit.finishedAt = Date.now();
        audit.durationMs = (audit.finishedAt ?? 0) - audit.startedAt;
        return audit;
    }
    return { audit, step, setDerived, setOutputs, setValidations, finish };
}
const KEY = "fm_audit_runs_v1";
export function saveAudit(a) {
    try {
        const arr = loadAudits();
        arr.unshift(a);
        while (arr.length > 200)
            arr.pop();
        localStorage.setItem(KEY, JSON.stringify(arr));
    }
    catch { }
}
export function loadAudits() {
    try {
        const raw = localStorage.getItem(KEY);
        return raw ? JSON.parse(raw) : [];
    }
    catch {
        return [];
    }
}
