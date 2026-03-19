import React from 'react';
import { Cpu, ShieldCheck, MessageSquare, Zap, Activity } from 'lucide-react';
import type { ConsensusResult, AgentVote } from '../lib/ConsensusEngine';

interface IntelligenceGridProps {
    result: ConsensusResult;
    isCalculating?: boolean;
}

export const IntelligenceGrid: React.FC<IntelligenceGridProps> = ({ result, isCalculating }) => {
    return (
        <div className="intelligence-grid-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
                <Activity size={18} className="text-primary animate-pulse" />
                <h4 style={{ fontSize: '0.9rem', margin: 0, fontWeight: 'bold', letterSpacing: '1px' }}>GLOBAL INTELLIGENCE GRID (Deliberation)</h4>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {result.votes.map((vote) => (
                    <AgentCard key={vote.agentId} vote={vote} isCalculating={isCalculating} />
                ))}
            </div>

            <div style={{
                marginTop: '1rem',
                padding: '1rem',
                background: 'rgba(59, 130, 246, 0.05)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>WEIGHTED CONSENSUS SCORE</span>
                    <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--primary)', fontFamily: 'monospace' }}>
                        {Math.round(result.finalScore * 100)}%
                    </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>VERDICT STATUS</span>
                    <span style={{ 
                        fontSize: '1rem', 
                        fontWeight: 'bold', 
                        color: result.finalVerdict === 'SAFE' ? '#10b981' : result.finalVerdict === 'SCAM' ? '#ef4444' : '#f59e0b'
                    }}>
                        {result.finalVerdict}
                    </span>
                </div>
            </div>
        </div>
    );
};

const AgentCard: React.FC<{ vote: AgentVote; isCalculating?: boolean }> = ({ vote, isCalculating }) => {
    const getIcon = (id: string) => {
        if (id.includes('neural')) return <Cpu size={16} />;
        if (id.includes('linguistics')) return <MessageSquare size={16} />;
        return <ShieldCheck size={16} />;
    };

    return (
        <div className="sys-card" style={{ 
            padding: '1.2rem', 
            border: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(0,0,0,0.2)',
            transform: isCalculating ? 'scale(0.98)' : 'scale(1)',
            transition: 'all 0.4s ease'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <div style={{ color: 'var(--primary)', opacity: 0.8 }}>{getIcon(vote.agentId)}</div>
                    <div>
                        <h5 style={{ fontSize: '0.8rem', margin: 0, fontWeight: 'bold' }}>{vote.agentName.toUpperCase()}</h5>
                        <span style={{ fontSize: '0.6rem', color: '#64748b' }}>{vote.specialty}</span>
                    </div>
                </div>
                {isCalculating && <Zap size={14} className="animate-spin text-primary" />}
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '4px' }}>
                    <span>CONFIDENCE</span>
                    <span>{Math.round(vote.confidence * 100)}%</span>
                </div>
                <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                    <div style={{ 
                        height: '100%', 
                        width: `${vote.confidence * 100}%`, 
                        background: 'var(--primary)',
                        transition: 'width 1s ease-out'
                    }} />
                </div>
            </div>

            <p style={{ fontSize: '0.7rem', color: '#94a3b8', lineHeight: '1.4', fontStyle: 'italic', margin: 0 }}>
                "{vote.reasoning}"
            </p>
        </div>
    );
};
