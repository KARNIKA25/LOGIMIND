import { useState, useRef, useEffect } from 'react'
import { Send, Brain, Sparkles, RefreshCw, Copy, Check, Zap, Globe, Code2, Calculator, Truck, CloudSun, CornerDownLeft } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { aiApi } from '../../services/api.service'
import type { AIMessage } from '../../types'
import toast from 'react-hot-toast'

interface PromptCategory {
  id: string
  label: string
  icon: any
  prompts: string[]
}

const CATEGORIES: PromptCategory[] = [
  {
    id: 'all',
    label: 'All Topics',
    icon: Sparkles,
    prompts: [
      'What is quantum computing and how does it work?',
      'Write an optimized binary search function in Python',
      'What is the live weather in Tokyo?',
      'Which products have critical low stock right now?',
      'Calculate 450 * 18 and convert 100 miles to km',
      'Optimal route and checkpoints from Tamil Nadu to Nepal',
      'Why do leaves change color in autumn?',
      'Show active shipments and delay probabilities',
    ]
  },
  {
    id: 'general',
    label: 'Science & World',
    icon: Globe,
    prompts: [
      'What is quantum entanglement?',
      'Explain how the immune system fights viruses',
      'How do airplanes generate lift?',
      'Who was Nikola Tesla and what did he invent?',
      'What causes earthquakes and tsunamis?',
      'Explain the difference between nuclear fission and fusion',
    ]
  },
  {
    id: 'coding',
    label: 'Code & Tech',
    icon: Code2,
    prompts: [
      'Write an optimized binary search function in Python',
      'Show how to use useState and useEffect in React with TypeScript',
      'Write an analytical SQL query with window functions',
      'Create a multi-stage production Dockerfile for FastAPI',
      'Explain the difference between REST and GraphQL APIs',
      'Explain time complexity and Big-O notation with examples',
    ]
  },
  {
    id: 'math',
    label: 'Math & Formulas',
    icon: Calculator,
    prompts: [
      'Calculate 450 * 184',
      'What is 18.5% of 95,000?',
      'Convert 75 miles to km',
      'Convert 32 celsius to fahrenheit',
      'What is sqrt(144) + pow(5, 3)?',
      'How to calculate compound interest with formula?',
    ]
  },
  {
    id: 'logistics',
    label: 'Logistics & Fleet',
    icon: Truck,
    prompts: [
      'Which products have critical low stock right now?',
      'Show active shipments and delay probabilities',
      'Compare warehouse utilization across all regional facilities',
      'Optimal corridor and checkpoints from Tamil Nadu to Nepal',
      'Recommend reorder point and safety stock strategy',
      'How does cold-chain telemetry prevent spoilage?',
    ]
  },
  {
    id: 'weather',
    label: 'Live Weather',
    icon: CloudSun,
    prompts: [
      'What is the live weather in Tokyo?',
      'How is the weather in London right now?',
      'What is the temperature and humidity in New York?',
      'Current weather in Paris, France',
      'Atmospheric conditions in Chennai, India',
      'Weather report for Singapore freight hub',
    ]
  }
]

const INITIAL_MESSAGES: AIMessage[] = [
  {
    role: 'assistant',
    model: 'LogiMind Universal Real-Time AI',
    content: `## 🧠 LogiMind Real-Time AI Co-Pilot

Hello! I am your **universal real-time AI assistant**. I am connected to live web knowledge, real-time weather telematics, and your company's live supply chain database.

### 🌟 I Can Answer Anything in Real Time:
- 🌐 **Science, History & World Knowledge:** Physics, biology, geography, astronomy, trivia, biographies
- 💻 **Software & Programming:** Python, JavaScript, TypeScript, React, SQL, Docker, algorithms, debugging
- 🧮 **Math & Unit Conversions:** Arithmetic, algebra, percentages, currency, metric/imperial conversions
- 🚚 **Enterprise Logistics & Telematics:** Real-time stock alerts, active shipments, warehouse utilization, route corridors
- 🌤️ **Live Atmospheric Radar:** Live temperatures, wind speed, and precipitation for any city worldwide
- ✍️ **Writing & Creative Brainstorming:** Professional emails, business reports, translations, jokes

**Ask me anything below, or click any sample prompt to get started!**`,
    timestamp: new Date().toISOString(),
    suggested_actions: [
      'What is quantum computing?',
      'Write a binary search in Python',
      'Check low stock products',
      'Weather in Tokyo',
    ]
  }
]

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<AIMessage[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [streamingIndex, setStreamingIndex] = useState<number | null>(null)
  const [streamingText, setStreamingText] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const streamTimerRef = useRef<any>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  // Cleanup streaming timer on unmount
  useEffect(() => {
    return () => {
      if (streamTimerRef.current) clearInterval(streamTimerRef.current)
    }
  }, [])

  function startStreamingEffect(fullText: string, assistantMsg: AIMessage) {
    if (streamTimerRef.current) clearInterval(streamTimerRef.current)

    // Reserve a new slot in messages
    setMessages(prev => {
      const newIdx = prev.length
      setStreamingIndex(newIdx)
      setStreamingText('')
      return [...prev, { ...assistantMsg, content: '' }]
    })

    let currentLength = 0
    const step = Math.max(3, Math.floor(fullText.length / 70)) // Adaptive speed

    streamTimerRef.current = setInterval(() => {
      currentLength += step
      if (currentLength >= fullText.length) {
        clearInterval(streamTimerRef.current)
        streamTimerRef.current = null
        setStreamingIndex(null)
        setStreamingText('')
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
        setStreamingText(slice)
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
    const userText = (text ?? input).trim()
    if (!userText || loading) return

    // If currently streaming, complete immediately before next query
    if (streamTimerRef.current) {
      clearInterval(streamTimerRef.current)
      streamTimerRef.current = null
      setStreamingIndex(null)
      setStreamingText('')
    }

    const userMsg: AIMessage = { role: 'user', content: userText, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const history = [...messages, userMsg].slice(-12)
      const res = await aiApi.chat(history)
      const reply = res.data.response || (res.data as any).reply || 'Response received from LogiMind Real-Time Engine.'
      const model = res.data.model || 'LogiMind Universal Real-Time AI'
      const actions = res.data.suggested_actions || []

      const assistantMsg: AIMessage = {
        role: 'assistant',
        content: reply,
        model,
        suggested_actions: actions,
        timestamp: new Date().toISOString()
      }

      startStreamingEffect(reply, assistantMsg)
    } catch (err: any) {
      const status = err?.response?.status
      const errMsg = status === 401
        ? '🔐 Session expired. Please **refresh the page** and log in again.'
        : status === 422
        ? '⚠️ Invalid request format. Please try rephrasing your question.'
        : `⚠️ Could not reach the AI engine. Please ensure the backend server is running at **http://localhost:8000**.\n\nError: ${err?.message || 'Network error'}`
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: errMsg,
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

  const selectedCategory = CATEGORIES.find(c => c.id === activeCategory) || CATEGORIES[0]

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--spacing-topbar) - 56px)', maxHeight: 920 }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 14 }}>
        <div className="page-title-block">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1>AI Co-Pilot</h1>
            <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', padding: '4px 10px' }}>
              <span className="badge-dot success animate-pulse" />
              Real-Time AI Active · Answers Anything
            </span>
          </div>
          <p className="page-subtitle">Universal Real-Time Assistant · Live Web Intelligence · Supply Chain Telematics</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => {
            if (streamTimerRef.current) clearInterval(streamTimerRef.current)
            setMessages(INITIAL_MESSAGES)
            toast.success('Chat history cleared')
          }}>
            <RefreshCw size={14} /> New Chat
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '310px 1fr', gap: 18, flex: 1, minHeight: 0 }}>
        {/* Left: Interactive Category Explorer & Sample Questions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
          {/* Category Tabs */}
          <div className="card card-body" style={{ padding: 14 }}>
            <div className="text-xs text-muted mb-2" style={{ textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>
              Knowledge Domains
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {CATEGORIES.map(cat => {
                const Icon = cat.icon
                const isActive = activeCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-ghost'}`}
                    style={{
                      justifyContent: 'flex-start',
                      gap: 8,
                      fontSize: '0.8rem',
                      fontWeight: isActive ? 600 : 500,
                      padding: '8px 12px',
                    }}
                    onClick={() => setActiveCategory(cat.id)}
                  >
                    <Icon size={15} />
                    <span>{cat.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Quick Prompts for Active Category */}
          <div className="card card-body" style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>
                Sample Prompts
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-accent-1)', fontWeight: 600 }}>Click to Ask</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
              {selectedCategory.prompts.map((q, i) => (
                <button
                  key={i}
                  className="btn btn-ghost btn-sm"
                  style={{
                    textAlign: 'left',
                    justifyContent: 'flex-start',
                    fontSize: '0.76rem',
                    lineHeight: 1.4,
                    height: 'auto',
                    padding: '8px 10px',
                    whiteSpace: 'normal',
                    border: '1px solid var(--color-border-subtle)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 8,
                  }}
                  onClick={() => sendMessage(q)}
                >
                  <Zap size={12} style={{ color: 'var(--color-accent-1)', flexShrink: 0, marginTop: 2, marginRight: 6 }} />
                  <span>{q}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Real-Time Chat Area */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {/* Messages Feed */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 22, display: 'flex', flexDirection: 'column', gap: 18 }}>
            {messages.map((msg, i) => {
              const isAssistant = msg.role === 'assistant'
              const isStreamingThis = streamingIndex === i
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 12,
                    flexDirection: isAssistant ? 'row' : 'row-reverse',
                    alignItems: 'flex-start',
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      background: isAssistant ? 'var(--color-gradient-primary)' : 'rgba(99,102,241,0.2)',
                      border: isAssistant ? 'none' : '1px solid rgba(99,102,241,0.4)',
                      boxShadow: isAssistant ? '0 4px 12px rgba(99,102,241,0.25)' : 'none',
                    }}
                  >
                    {isAssistant ? '🧠' : '👤'}
                  </div>

                  {/* Bubble */}
                  <div style={{ maxWidth: '82%', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {/* Header info */}
                    {isAssistant && msg.model && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                        <span style={{ fontWeight: 600, color: 'var(--color-accent-1)' }}>{msg.model}</span>
                        {msg.timestamp && (
                          <span>· {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        )}
                      </div>
                    )}

                    <div
                      style={{
                        padding: '14px 18px',
                        borderRadius: isAssistant ? '14px 14px 14px 4px' : '14px 14px 4px 14px',
                        background: isAssistant ? 'rgba(99,102,241,0.06)' : 'rgba(99,102,241,0.2)',
                        border: `1px solid ${isAssistant ? 'rgba(99,102,241,0.18)' : 'rgba(99,102,241,0.38)'}`,
                        fontSize: '0.885rem',
                        lineHeight: 1.7,
                        color: 'var(--color-text-primary)',
                        position: 'relative',
                      }}
                    >
                      {isAssistant ? (
                        <div>
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p style={{ margin: '0 0 8px 0' }}>{children}</p>,
                              ul: ({ children }) => <ul style={{ margin: '6px 0', paddingLeft: 20 }}>{children}</ul>,
                              ol: ({ children }) => <ol style={{ margin: '6px 0', paddingLeft: 20 }}>{children}</ol>,
                              li: ({ children }) => <li style={{ marginBottom: 4 }}>{children}</li>,
                              code: ({ children }) => (
                                <code style={{ background: 'rgba(99,102,241,0.15)', borderRadius: 4, padding: '2px 6px', fontSize: '0.84em', fontFamily: 'monospace', color: '#c7d2fe' }}>
                                  {children}
                                </code>
                              ),
                              pre: ({ children }) => (
                                <pre style={{ background: '#090d16', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, padding: '12px 14px', overflowX: 'auto', fontSize: '0.82em', margin: '8px 0' }}>
                                  {children}
                                </pre>
                              ),
                              strong: ({ children }) => <strong style={{ color: 'var(--color-accent-1)' }}>{children}</strong>,
                              h1: ({ children }) => <h3 style={{ margin: '10px 0 6px', fontSize: '1.05rem', color: '#fff' }}>{children}</h3>,
                              h2: ({ children }) => <h4 style={{ margin: '8px 0 4px', fontSize: '0.98rem', color: '#e0e7ff' }}>{children}</h4>,
                              h3: ({ children }) => <h5 style={{ margin: '6px 0 3px', fontSize: '0.9rem', color: '#c7d2fe' }}>{children}</h5>,
                              table: ({ children }) => (
                                <div style={{ overflowX: 'auto', margin: '10px 0' }}>
                                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', border: '1px solid rgba(99,102,241,0.2)' }}>
                                    {children}
                                  </table>
                                </div>
                              ),
                              th: ({ children }) => (
                                <th style={{ background: 'rgba(99,102,241,0.15)', padding: '6px 10px', textAlign: 'left', borderBottom: '1px solid rgba(99,102,241,0.25)', fontWeight: 600 }}>
                                  {children}
                                </th>
                              ),
                              td: ({ children }) => (
                                <td style={{ padding: '6px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                  {children}
                                </td>
                              ),
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>

                          {/* Blinking streaming cursor */}
                          {isStreamingThis && (
                            <span
                              style={{
                                display: 'inline-block',
                                width: 8,
                                height: 16,
                                background: 'var(--color-accent-1)',
                                marginLeft: 4,
                                verticalAlign: 'middle',
                                animation: 'pulse 0.8s infinite',
                              }}
                            />
                          )}
                        </div>
                      ) : (
                        msg.content
                      )}

                      {/* Action tools: copy response */}
                      {isAssistant && !isStreamingThis && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ height: 24, padding: '2px 8px', fontSize: '0.72rem', gap: 4, opacity: 0.7 }}
                            onClick={() => handleCopy(msg.content, i)}
                            title="Copy response"
                          >
                            {copiedIndex === i ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                            {copiedIndex === i ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Interactive Suggested Action Pills */}
                    {isAssistant && !isStreamingThis && msg.suggested_actions && msg.suggested_actions.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                        {msg.suggested_actions.map((act, actIdx) => (
                          <button
                            key={actIdx}
                            className="btn btn-ghost btn-sm"
                            style={{
                              fontSize: '0.72rem',
                              padding: '4px 10px',
                              height: 'auto',
                              borderRadius: 16,
                              background: 'rgba(99,102,241,0.08)',
                              border: '1px solid rgba(99,102,241,0.25)',
                              color: 'var(--color-accent-1)',
                              cursor: 'pointer',
                            }}
                            onClick={() => sendMessage(act)}
                          >
                            <Sparkles size={11} style={{ marginRight: 4 }} />
                            {act}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Waiting for response loader */}
            {loading && streamingIndex === null && (
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'var(--color-gradient-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                  }}
                >
                  🧠
                </div>
                <div
                  style={{
                    padding: '12px 18px',
                    background: 'rgba(99,102,241,0.06)',
                    border: '1px solid rgba(99,102,241,0.18)',
                    borderRadius: '14px 14px 14px 4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Thinking in real-time...</span>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className="animate-pulse"
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          background: 'var(--color-accent-1)',
                          animationDelay: `${i * 0.15}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div
            style={{
              padding: '14px 20px',
              borderTop: '1px solid var(--color-border-primary)',
              background: 'rgba(15, 23, 42, 0.4)',
              display: 'flex',
              gap: 10,
              alignItems: 'flex-end',
            }}
          >
            <div style={{ flex: 1, position: 'relative' }}>
              <textarea
                ref={inputRef}
                className="form-textarea"
                style={{
                  width: '100%',
                  minHeight: 46,
                  maxHeight: 140,
                  resize: 'none',
                  paddingRight: 40,
                  fontFamily: 'var(--font-primary)',
                  fontSize: '0.885rem',
                }}
                placeholder="Ask anything... (e.g., 'What is quantum computing?', 'Write code for X', 'Weather in Tokyo', 'Show shipments')"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                aria-label="Universal AI chat query input"
              />
            </div>
            <button
              className="btn btn-primary"
              style={{ height: 46, padding: '0 20px', flexShrink: 0, gap: 6 }}
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              aria-label="Send to AI"
            >
              <Send size={15} />
              <span>Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

