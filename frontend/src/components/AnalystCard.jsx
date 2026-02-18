export default function AnalystCard({ analyst, index }) {
    const colors = [
        ['#6c63ff', '#00d4aa'],
        ['#00d4aa', '#6c63ff'],
        ['#f59e0b', '#6c63ff'],
        ['#ef4444', '#f59e0b'],
        ['#22c55e', '#00d4aa'],
    ]
    const [from, to] = colors[index % colors.length]
    return (
        <div className="analyst-card">
            <div
                className="analyst-avatar"
                style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
            >
                {analyst.name.charAt(0).toUpperCase()}
            </div>
            <div className="analyst-name">{analyst.name}</div>
            <div className="analyst-role">{analyst.role}</div>
            <div className="analyst-affiliation">🏛 {analyst.affiliation}</div>
            <div className="analyst-description">{analyst.description}</div>
        </div>
    )
}
