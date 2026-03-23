import { DeepfakeAnalyzer } from '../DeepfakeAnalyzer';

export function ForensicsView() {
    return (
        <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, overflow: 'auto' }}>
                <DeepfakeAnalyzer />
            </div>
        </div>
    );
}
