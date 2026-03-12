import { DeepfakeAnalyzer } from '../DeepfakeAnalyzer';

export function ForensicsView() {
    return (
        <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--background-secondary)' }}>
                <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>FORENSICS LAB</h2>
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
                <DeepfakeAnalyzer />
            </div>
        </div>
    );
}
