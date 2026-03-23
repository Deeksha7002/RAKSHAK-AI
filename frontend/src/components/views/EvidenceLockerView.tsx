import { EvidenceLocker } from '../EvidenceLocker';
import type { CaseFile } from '../../lib/types';

interface EvidenceLockerViewProps {
    cases: CaseFile[];
    onClose: () => void;
}

export function EvidenceLockerView({ cases, onClose }: EvidenceLockerViewProps) {
    return (
        <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, overflow: 'hidden' }}>
                <EvidenceLocker cases={cases} onClose={onClose} />
            </div>
        </div>
    );
}
