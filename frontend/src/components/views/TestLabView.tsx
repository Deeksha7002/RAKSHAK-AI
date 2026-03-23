import { DemoConsole } from '../DemoConsole';

export function TestLabView() {
    return (
        <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, overflow: 'auto' }}>
                <DemoConsole />
            </div>
        </div>
    );
}
