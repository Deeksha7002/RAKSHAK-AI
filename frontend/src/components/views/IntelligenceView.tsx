import { IntelligenceReport } from '../IntelligenceReport';

export function IntelligenceView() {
    return (
        <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
                <IntelligenceReport />
            </div>
        </div>
    );
}
