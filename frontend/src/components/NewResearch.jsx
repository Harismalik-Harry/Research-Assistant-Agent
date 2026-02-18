import { useState } from 'react'
import { FlaskConical } from 'lucide-react'
import toast from 'react-hot-toast'
export default function NewResearch({ onCreated }) {
    const [topic, setTopic] = useState('')
    const [maxAnalysts, setMaxAnalysts] = useState(3)
    const [loading, setLoading] = useState(false)
    async function handleSubmit(e) {
        e.preventDefault()
        if (!topic.trim()) { toast.error('Please enter a research topic'); return }
        setLoading(true)
        try {
            const res = await fetch('/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: topic.trim(), max_analysts: maxAnalysts }),
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.detail || 'Failed to create session')
            }
            const session = await res.json()
            toast.success('Research started!')
            setTopic('')
            setMaxAnalysts(3)
            onCreated(session)
        } catch (err) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }
    return (
        <div className="new-research-container">
            <div className="page-header" style={{ padding: '0 0 32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div style={{
                        width: 44, height: 44,
                        background: 'linear-gradient(135deg, var(--accent), var(--teal))',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <FlaskConical size={22} color="white" />
                    </div>
                    <div>
                        <div className="page-title" style={{ fontSize: '22px', marginBottom: 0 }}>New Research</div>
                        <div className="page-subtitle" style={{ fontSize: '13px' }}>
                            AI analysts will research your topic in parallel
                        </div>
                    </div>
                </div>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="card">
                    <div className="form-group">
                        <label className="form-label" htmlFor="topic">Research Topic</label>
                        <textarea
                            id="topic"
                            className="form-textarea"
                            placeholder="e.g. The impact of large language models on scientific research..."
                            value={topic}
                            onChange={e => setTopic(e.target.value)}
                            rows={4}
                            disabled={loading}
                        />
                        <div className="form-hint">Be specific — a focused topic produces better reports.</div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" htmlFor="analysts">
                            Number of Analysts
                        </label>
                        <div className="range-row">
                            <input
                                id="analysts"
                                type="range"
                                min={1}
                                max={5}
                                value={maxAnalysts}
                                onChange={e => setMaxAnalysts(Number(e.target.value))}
                                disabled={loading}
                            />
                            <div className="range-value">{maxAnalysts}</div>
                        </div>
                        <div className="form-hint">
                            Each analyst covers a different angle. More analysts = richer report but longer runtime.
                        </div>
                    </div>
                </div>
                <div style={{ marginTop: '20px' }}>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading || !topic.trim()}
                        style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
                    >
                        {loading ? (
                            <>
                                <span className="progress-spinner" style={{ width: 16, height: 16 }} />
                                Starting Research...
                            </>
                        ) : (
                            <>🚀 Start Research</>
                        )}
                    </button>
                </div>
            </form>
            {}
            <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                    { icon: '🤖', title: 'AI Analysts', desc: 'Multiple personas research your topic from different angles' },
                    { icon: '🌐', title: 'Web + Wikipedia', desc: 'Real-time search across the web and Wikipedia' },
                    { icon: '✍️', title: 'Full Report', desc: 'Intro, insights, and conclusion in markdown' },
                    { icon: '🔄', title: 'Human Feedback', desc: 'Review and guide analyst personas before interviews start' },
                ].map(({ icon, title, desc }) => (
                    <div key={title} className="card" style={{ padding: '16px' }}>
                        <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</div>
                    </div>
                ))}
            </div>
        </div>
    )
}
