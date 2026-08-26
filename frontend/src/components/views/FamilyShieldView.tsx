import React, { useState } from 'react';
import { Users, UserPlus, ShieldCheck, Bell, Lock, CheckCircle2 } from 'lucide-react';
import { LanguageCode, getTranslation } from '../../lib/i18n';

interface FamilyShieldViewProps {
  currentLang: LanguageCode;
}

export const FamilyShieldView: React.FC<FamilyShieldViewProps> = ({ currentLang }) => {
  const [members, setMembers] = useState([
    { name: 'Ramesh Sharma (Father)', role: 'Senior', status: 'Protected', alerts: 0 },
    { name: 'Sunita Sharma (Mother)', role: 'Senior', status: 'Protected', alerts: 1 }
  ]);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Parent');

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setMembers([...members, { name: `${newName} (${newRole})`, role: newRole, status: 'Protected', alerts: 0 }]);
    setNewName('');
  };

  return (
    <div className="card animate-fade-in" style={{ marginBottom: '1.5rem' }}>
      <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Users size={22} color="#d97706" />
        {getTranslation(currentLang, 'familyShieldTitle')}
      </h2>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1.25rem 0' }}>
        {getTranslation(currentLang, 'familySubtitle')}
      </p>

      {/* MEMBER LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {members.map((m, idx) => (
          <div key={idx} style={{
            padding: '0.85rem 1rem',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1px solid var(--border-color)'
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{m.name}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <ShieldCheck size={14} color="var(--status-success)" /> Privacy Shield Active • {m.alerts > 0 ? `${m.alerts} High-Risk Alert Resolved` : 'No Recent Threats'}
              </div>
            </div>
            <span className="badge badge-success">Protected</span>
          </div>
        ))}
      </div>

      {/* ADD MEMBER FORM */}
      <form onSubmit={handleAddMember} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Enter family member name..."
          style={{
            flex: 2,
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--border-color)',
            background: 'var(--bg-subtle)',
            fontSize: '0.9rem',
            outline: 'none'
          }}
        />
        <select
          value={newRole}
          onChange={(e) => setNewRole(e.target.value)}
          style={{
            flex: 1,
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--border-color)',
            background: 'var(--bg-subtle)',
            fontSize: '0.9rem'
          }}
        >
          <option value="Parent">Parent</option>
          <option value="Senior">Senior Citizen</option>
          <option value="Child">Dependent</option>
        </select>
        <button type="submit" className="btn btn-primary">
          <UserPlus size={18} />
        </button>
      </form>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        <Lock size={13} color="var(--status-success)" /> Consent & Privacy First: Family members only receive alert warnings without reading private chat content.
      </div>
    </div>
  );
};
