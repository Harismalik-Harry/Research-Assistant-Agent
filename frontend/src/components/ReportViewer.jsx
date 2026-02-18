import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Download, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
export default function ReportViewer({ report }) {
    const [copied, setCopied] = useState(false)
    if (!report) return null
    const handleCopy = () => {
        navigator.clipboard.writeText(report.final_report)
        setCopied(true)
        toast.success('Report copied to clipboard')
        setTimeout(() => setCopied(false), 2000)
    }
    const handleDownload = () => {
        const blob = new Blob([report.final_report], { type: 'text/markdown' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `report-${report.session_id}.md`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        toast.success('Report downloaded')
    }
    return (
        <div className="report-container">
            <div className="report-actions">
                <button className="btn btn-secondary" onClick={handleCopy}>
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Copied' : 'Copy Markdown'}
                </button>
                <button className="btn btn-secondary" onClick={handleDownload}>
                    <Download size={16} />
                    Download
                </button>
            </div>
            <div className="report-markdown">
                <Markdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        code({ node, inline, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '')
                            return !inline && match ? (
                                <SyntaxHighlighter
                                    style={atomDark}
                                    language={match[1]}
                                    PreTag="div"
                                    {...props}
                                >
                                    {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                            ) : (
                                <code className={className} {...props}>
                                    {children}
                                </code>
                            )
                        }
                    }}
                >
                    {report.final_report}
                </Markdown>
            </div>
        </div>
    )
}
