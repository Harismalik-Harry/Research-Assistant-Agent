import { Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
function StatusBadge({ status }) {
    const map = {
        pending: { cls: 'badge-pending', label: 'Pending' },
        running: { cls: 'badge-running', label: 'Running' },
        awaiting_feedback: { cls: 'badge-awaiting', label: 'Feedback' },
        completed: { cls: 'badge-completed', label: 'Done' },
        failed: { cls: 'badge-failed', label: 'Failed' },
    }
    const { cls, label } = map[status] || { cls: 'badge-pending', label: status }
    return (
        <span className={`badge ${cls}`}>
            <span className="badge-dot" />
            {label}
        </span>
    )
}
function formatDate(iso) {
    if (!iso) return ''
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
export default function ResearchList({ sessions, activeId, onSelect, onDelete }) {
    async function handleDelete(e, id) {
        e.stopPropagation()
        if (!confirm('Delete this session?')) return
        try {
            const res = await fetch(`/sessions/${id}`, { method: 'DELETE' })
            if (res.ok || res.status === 204) {
                onDelete(id)
                toast.success('Session deleted')
            } else {
                toast.error('Failed to delete session')
            }
        } catch {
            toast.error('Network error')
        }
    }
    if (!sessions.length) {
        return (
            <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>
                No sessions yet.<br />Start a new research!
            </div>
        )
    }
    return (
        <div className="sidebar-sessions">
            <div className="sidebar-section-title">Recent Sessions</div>
            {sessions.map(s => (
                <div
                    key={s.id}
                    className={`session-item ${s.id === activeId ? 'active' : ''}`}
                    onClick={() => onSelect(s.id)}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div className="session-item-topic" style={{ flex: 1 }}>{s.topic}</div>
                        <button
                            onClick={(e) => handleDelete(e, s.id)}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: 'var(--text-muted)', padding: '0 0 0 6px', flexShrink: 0,
                                display: 'flex', alignItems: 'center',
                            }}
                            title="Delete session"
                        >
                            <Trash2 size={13} />
                        </button>
                    </div>
                    <div className="session-item-meta">
                        <StatusBadge status={s.status} />
                        <span className="session-item-date">{formatDate(s.created_at)}</span>
                    </div>
                </div>
            ))}
        </div>
    )
}
