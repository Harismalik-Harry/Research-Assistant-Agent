import { useEffect, useRef } from 'react'
export default function LiveProgress({ events }) {
    const containerRef = useRef(null)
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight
        }
    }, [events])
    if (!events.length) return null
    return (
        <div className="progress-container">
            <div className="progress-header">
                <div className="progress-spinner" />
                <div style={{ fontSize: '15px', fontWeight: 600 }}>Research in progress...</div>
            </div>
            <div className="event-log" ref={containerRef}>
                {events.map((ev, i) => {
                    const type = ev.event
                    const data = JSON.parse(ev.data)
                    const time = new Date().toLocaleTimeString('en-US', {
                        hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'
                    })
                    if (type === 'ping') return null
                    return (
                        <div key={i} className="event-item">
                            <div className="event-time">{time}</div>
                            <div className={`event-type event-type-${type}`}>{type}</div>
                            <div className="event-message">
                                {data.message || JSON.stringify(data)}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
