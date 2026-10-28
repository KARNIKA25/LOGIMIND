import { useState, useRef, useEffect } from 'react'
import { X, Send, Brain, Sparkles, RefreshCw, Copy, Check, Zap } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useUIStore } from '../../store'
import { aiApi } from '../../services/api.service'
import type { AIMessage } from '../../types'
import toast from 'react-hot-toast'

const SUGGESTED_PROMPTS = [
  '🌐 What is quantum computing and how does it work?',
  '💻 Write an optimized binary search function in Python',
  '🌤️ What is the live weather in Tokyo?',
  '📦 Which products have critical low stock right now?',
  '🧮 Calculate 450 * 18 and convert 100 miles to km',
  '🚚 Route & checkpoints from Tamil Nadu to Nepal',
]

const INITIAL_MESSAGE: AIMessage = {
  role: 'assistant',
  model: 'LogiMind Universal Real-Time AI',
  content: `👋 Hello! I am **LogiMind AI** — your universal real-time intelligent co-pilot.\n\nI can answer **any question on any topic** in real-time:\n- 🌐 **Science, History & Facts:** Quantum physics, biology, geography, culture\n- 💻 **Programming & Code:** Python, JS, TypeScript, React, SQL, Docker, algorithms\n- 🧮 **Math & Conversions:** Equations, percentages, metric/imperial conversions\n- 🚚 **Logistics & Telematics:** Real-time stock alerts, active shipments, warehouses\n- 🌤️ **Live Weather Telematics:** Real-time atmospheric conditions worldwide\n\nWhat would you like to ask today?`,
  timestamp: new Date().toISOString(),
  suggested_actions: [
    'What is quantum computing?',
    'Write binary search in Python',
    'Show low stock products',
    'Weather in Tokyo',
  ]
}

interface AIPanelProps { open: boolean }

export default function AIPanel({ open }: AIPanelProps) {
  const { setAIPanelOpen } = useUIStore()
  const [messages, setMessages] = useState<AIMessage[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [streamingIndex, setStreamingIndex] = useState<number | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const streamTimerRef = useRef<any>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingIndex])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    return () => {
      if (streamTimerRef.current) clearInterval(streamTimerRef.current)
    }
  }, [])

  function startStreamingEffect(fullText: string, assistantMsg: AIMessage) {
    if (streamTimerRef.current) clearInterval(streamTimerRef.current)

    setMessages(prev => {
      const newIdx = prev.length
      setStreamingIndex(newIdx)
      return [...prev, { ...assistantMsg, content: '' }]
    })

    let currentLength = 0
    const step = Math.max(3, Math.floor(fullText.length / 65))

    streamTimerRef.current = setInterval(() => {
      currentLength += step
      if (currentLength >= fullText.length) {
        clearInterval(streamTimerRef.current)
        streamTimerRef.current = null
        setStreamingIndex(null)
        setMessages(prev => {
          const updated = [...prev]
          const last = updated[updated.length - 1]
          if (last && last.role === 'assistant') {
            updated[updated.length - 1] = { ...last, content: fullText }
          }
          return updated
        })
      } else {
        const slice = fullText.slice(0, currentLength)
        setMessages(prev => {
          const updated = [...prev]
          const last = updated[updated.length - 1]
          if (last && last.role === 'assistant') {
            updated[updated.length - 1] = { ...last, content: slice }
          }
          return updated
        })
      }
    }, 16)
  }

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim()
    if (!content || loading) return

    if (streamTimerRef.current) {
      clearInterval(streamTimerRef.current)
      streamTimerRef.current = null
      setStreamingIndex(null)
    }

    const userMsg: AIMessage = { role: 'user', content, timestamp: new Date().toISOString() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const history = [...messages, userMsg].slice(-10)
      const res = await aiApi.chat(history)
      const reply = res.data.response || (res.data as any).reply || 'Response received from LogiMind Real-Time Engine.'
      const model = res.data.model || 'LogiMind Universal Real-Time AI'
      const actions = res.data.suggested_actions || []

      const assistantMsg: AIMessage = {
        role: 'assistant',
        content: reply,
        model,
        suggested_actions: actions,
        timestamp: new Date().toISOString(),
      }

      startStreamingEffect(reply, assistantMsg)
    } catch (err: any) {
      toast.error('AI engine unavailable. Please check backend connection.')
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: '⚠️ I\'m having trouble connecting to the AI engine right now. Please ensure the backend is running.',
        model: 'System Alert',
        timestamp: new Date().toISOString(),
      }])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function handleCopy(text: string, index: number) {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <aside className={`ai-panel${open ? ' open' : ''}`} role="complementary" aria-label="AI Co-Pilot Panel">
      <div className="ai-panel-header">
        <div className="ai-icon">🧠</div>
        <div className="flex-1">
          <h4>LogiMind AI Co-Pilot</h4>
          <div className="ai-status">
            <span className="badge-dot success animate-pulse" style={{ display: 'inline-block', marginRight: '5px' }} />
            Real-Time AI Active · Answers Anything
          </div>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          style={{ padding: '4px 8px', height: 28 }}
          onClick={() => {
            if (streamTimerRef.current) clearInterval(streamTimerRef.current)
            setMessages([INITIAL_MESSAGE])
          }}
          title="Reset chat"
        >
          <RefreshCw size={13} />
        </button>
        <button className="modal-close" onClick={() => setAIPanelOpen(false)} aria-label="Close AI panel">
          <X size={16} />
        </button>
      </div>

      {/* Suggested prompts on initial screen */}
      {messages.length <= 1 && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <div className="text-xs text-muted mb-2" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Suggested Queries</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {SUGGESTED_PROMPTS.map((p) => (
              <button
                key={p}
                className="btn btn-ghost btn-sm"
                style={{ textAlign: 'left', justifyContent: 'flex-start', fontSize: '0.78rem', height: 'auto', padding: '6px 10px', whiteSpace: 'normal' }}
                onClick={() => sendMessage(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="ai-messages">
        {messages.map((msg, i) => {
          const isAssistant = msg.role === 'assistant'
          const isStreamingThis = streamingIndex === i
          return (
            <div key={i} className={`ai-message ${msg.role}`}>
              {isAssistant && (
                <div style={{ width: 28, height: 28, background: 'var(--color-gradient-primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>🧠</div>
              )}
              <div className="ai-message-bubble" style={{ position: 'relative' }}>
                {isAssistant && msg.model && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-accent-1)', fontWeight: 600, marginBottom: 4 }}>
                    {msg.model}
                  </div>
                )}
                {isAssistant ? (
                  <div>
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p style={{ margin: '0 0 5px 0' }}>{children}</p>,
                        ul: ({ children }) => <ul style={{ margin: '3px 0', paddingLeft: 16 }}>{children}</ul>,
                        ol: ({ children }) => <ol style={{ margin: '3px 0', paddingLeft: 16 }}>{children}</ol>,
                        li: ({ children }) => <li style={{ marginBottom: 2 }}>{children}</li>,
                        code: ({ children }) => <code style={{ background: 'rgba(99,102,241,0.15)', borderRadius: 4, padding: '1px 4px', fontSize: '0.8em', fontFamily: 'monospace' }}>{children}</code>,
                        pre: ({ children }) => <pre style={{ background: '#090d16', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 5, padding: '6px 10px', overflowX: 'auto', fontSize: '0.78em', margin: '5px 0' }}>{children}</pre>,
                        strong: ({ children }) => <strong style={{ color: 'var(--color-accent-1)' }}>{children}</strong>,
                        h1: ({ children }) => <h4 style={{ margin: '4px 0 3px', fontSize: '0.95rem' }}>{children}</h4>,
                        h2: ({ children }) => <h5 style={{ margin: '4px 0 3px', fontSize: '0.88rem' }}>{children}</h5>,
                        h3: ({ children }) => <h6 style={{ margin: '3px 0 2px', fontSize: '0.83rem' }}>{children}</h6>,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>

                    {/* Blinking streaming cursor */}
                    {isStreamingThis && (
                      <span
                        style={{
                          display: 'inline-block',
                          width: 6,
                          height: 14,
                          background: 'var(--color-accent-1)',
                          marginLeft: 3,
                          verticalAlign: 'middle',
                          animation: 'pulse 0.8s infinite',
                        }}
                      />
                    )}

                    {/* Copy button & suggested actions */}
                    {!isStreamingThis && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ height: 20, padding: '1px 6px', fontSize: '0.7rem', gap: 3, opacity: 0.7 }}
                          onClick={() => handleCopy(msg.content, i)}
                        >
                          {copiedIndex === i ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
                          {copiedIndex === i ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    )}

                    {!isStreamingThis && msg.suggested_actions && msg.suggested_actions.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                        {msg.suggested_actions.map((act, idx) => (
                          <button
                            key={idx}
                            className="btn btn-ghost btn-sm"
                            style={{
                              fontSize: '0.7rem',
                              padding: '2px 8px',
                              height: 'auto',
                              borderRadius: 12,
                              background: 'rgba(99,102,241,0.1)',
                              border: '1px solid rgba(99,102,241,0.25)',
                              color: 'var(--color-accent-1)'
                            }}
                            onClick={() => sendMessage(act)}
                          >
                            <Sparkles size={10} style={{ marginRight: 3 }} />
                            {act}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          )
        })}
        {loading && streamingIndex === null && (
          <div className="ai-message assistant">
            <div style={{ width: 28, height: 28, background: 'var(--color-gradient-primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>🧠</div>
            <div className="ai-message-bubble">
              <span className="animate-pulse" style={{ fontSize: '0.8rem' }}>Thinking in real-time<span>...</span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="ai-input-area">
        <textarea
          ref={inputRef}
          className="ai-input"
          placeholder="Ask anything (science, code, math, weather, shipments)..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          aria-label="Universal AI query input"
        />
        <button
          className="ai-send-btn"
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          aria-label="Send message"
        >
          <Send size={16} />
        </button>
      </div>
    </aside>
  )
}

