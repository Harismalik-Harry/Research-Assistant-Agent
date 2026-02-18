import { useState, useEffect } from 'react'
import { FlaskConical } from 'lucide-react'
import ResearchList from './components/ResearchList'
import NewResearch from './components/NewResearch'
import AnalystCard from './components/AnalystCard'
import LiveProgress from './components/LiveProgress'
import ReportViewer from './components/ReportViewer'
import toast from 'react-hot-toast'
function App() {
  const [sessions, setSessions] = useState([])
  const [activeSessionId, setActiveSessionId] = useState(null)
  const [activeSession, setActiveSession] = useState(null)
  const [report, setReport] = useState(null)
  const [events, setEvents] = useState([])
  const [feedback, setFeedback] = useState('')
  useEffect(() => {
    fetch('/sessions')
      .then(res => res.json())
      .then(data => setSessions(data))
      .catch((err) => toast.error('Failed to load sessions'))
  }, [])
  useEffect(() => {
    if (!activeSessionId) {
      setActiveSession(null)
      setReport(null)
      setEvents([])
      return
    }
    fetch(`/sessions/${activeSessionId}`)
      .then(res => res.json())
      .then(data => {
        setActiveSession(data)
        if (data.status === 'completed') {
          fetch(`/sessions/${activeSessionId}/report`)
            .then(res => res.ok ? res.json() : null)
            .then(setReport)
            .catch(() => { })
        } else {
          setReport(null)
        }
      })
      .catch((err) => toast.error('Failed to load session details'))
    const eventSource = new EventSource(`/sessions/${activeSessionId}/stream`)
    eventSource.onmessage = (event) => {
      const parsedData = JSON.parse(event.data)
      setEvents(prev => [...prev, { event: 'message', data: parsedData }])
    }
    eventSource.addEventListener('status', (e) => {
      setEvents(prev => [...prev, { event: 'status', data: e.data }])
    })
    eventSource.addEventListener('analysts_ready', (e) => {
      setEvents(prev => [...prev, { event: 'analysts_ready', data: e.data }])
      fetch(`/sessions/${activeSessionId}`)
        .then(res => res.json())
        .then(data => setActiveSession(data))
    })
    eventSource.addEventListener('feedback_received', (e) => {
      setEvents(prev => [...prev, { event: 'feedback_received', data: e.data }])
    })
    eventSource.addEventListener('interview_progress', (e) => {
      setEvents(prev => [...prev, { event: 'interview_progress', data: e.data }])
    })
    eventSource.addEventListener('report_ready', (e) => {
      setEvents(prev => [...prev, { event: 'report_ready', data: e.data }])
      fetch(`/sessions/${activeSessionId}/report`)
        .then(res => res.json())
        .then(data => setReport(data))
      fetch(`/sessions/${activeSessionId}`)
        .then(res => res.json())
        .then(data => {
          setActiveSession(data)
          setSessions(prev => prev.map(s => s.id === data.id ? data : s))
        })
    })
    eventSource.addEventListener('error', (e) => {
      setEvents(prev => [...prev, { event: 'error', data: e.data }])
      eventSource.close()
    })
    return () => {
      eventSource.close()
    }
  }, [activeSessionId])
  const handleCreateSession = (newSession) => {
    setSessions([newSession, ...sessions])
    setActiveSessionId(newSession.id)
  }
  const handleDeleteSession = (id) => {
    setSessions(sessions.filter(s => s.id !== id))
    if (activeSessionId === id) setActiveSessionId(null)
  }
  const submitFeedback = async (text) => {
    try {
      const res = await fetch(`/sessions/${activeSessionId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: text })
      })
      if (!res.ok) throw new Error('Failed to submit feedback')
      toast.success('Feedback submitted')
      setActiveSession(prev => ({
        ...prev,
        status: 'running',
        human_analyst_feedback: text
      }))
    } catch (err) {
      toast.error(err.message)
    }
  }
  return (
    <div className="app-layout">
      {}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <FlaskConical size={20} color="white" />
            </div>
            <div>
              <div className="sidebar-logo-text">Research Agent</div>
              <div className="sidebar-logo-sub">Multi-Analyst AI</div>
            </div>
          </div>
          <button className="btn-new" onClick={() => setActiveSessionId(null)}>
            <span>+</span> New Research
          </button>
        </div>
        <ResearchList
          sessions={sessions}
          activeId={activeSessionId}
          onSelect={setActiveSessionId}
          onDelete={handleDeleteSession}
        />
      </div>
      {}
      <div className="main-content">
        {!activeSessionId ? (
          <NewResearch onCreated={handleCreateSession} />
        ) : (
          <div>
            {}
            <div className="page-header">
              <div className="page-title">{activeSession?.topic || 'Loading...'}</div>
              <div className="page-subtitle">
                Status: <span style={{ textTransform: 'uppercase', fontWeight: 600, color: 'var(--accent)' }}>{activeSession?.status?.replace('_', ' ')}</span>
              </div>
            </div>
            {}
            <div style={{ padding: '0 40px 40px' }}>
              {}
              {activeSession?.analysts?.length > 0 && (
                <div style={{ marginBottom: 40 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Team of Analysts</div>
                  <div className="analysts-grid">
                    {activeSession.analysts.map((a, i) => (
                      <AnalystCard key={a.id} analyst={a} index={i} />
                    ))}
                  </div>
                  {}
                  {activeSession.status === 'awaiting_feedback' && !activeSession.human_analyst_feedback && (
                    <div className="feedback-section">
                      <div className="feedback-title">Analyst Plan Review</div>
                      <div className="feedback-subtitle">
                        Review the generated analyst personas above. You can approve them to start interviews immediately, or provide feedback to refine the plan.
                      </div>
                      <div className="form-group">
                        <textarea
                          className="form-textarea"
                          placeholder="e.g. Add an analyst focusing on economic impact..."
                          value={feedback}
                          onChange={e => setFeedback(e.target.value)}
                        />
                      </div>
                      <div className="feedback-actions">
                        <button
                          className="btn btn-primary"
                          onClick={() => submitFeedback('approve')}
                        >
                          Looks Good, Start Research
                        </button>
                        <button
                          className="btn btn-secondary"
                          disabled={!feedback.trim()}
                          onClick={() => submitFeedback(feedback)}
                        >
                          Submit Feedback
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {}
              {(activeSession?.status === 'running' || events.length > 0) && activeSession?.status !== 'completed' && (
                <div style={{ marginBottom: 40 }}>
                  <LiveProgress events={events} />
                </div>
              )}
              {}
              {report && (
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Final Research Report</div>
                  <ReportViewer report={report} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
export default App
