import { useState, useEffect, useCallback } from 'react'
import glossyBall from './assets/glossy-ball-png-26229.svg'



export default function App() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState(null)
  const [entryId, setEntryId] = useState(null)
  const [email, setEmail] = useState('')
  const [isShaking, setIsShaking] = useState(false)
  const [isLoadingAnswer, setIsLoadingAnswer] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [recentHistory, setRecentHistory] = useState([])
  const [fullHistory, setFullHistory] = useState([])
  const [showFullHistory, setShowFullHistory] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [expandedEntryId, setExpandedEntryId] = useState(null)

  const fetchRecentHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/history/recent')
      const data = await res.json()
      if (res.ok) setRecentHistory(data.history)
    } catch (err) { console.error('Failed to load recent history') }
  }, [])

  const fetchFullHistory = useCallback(async () => {
    setLoadingHistory(true)
    try {
      const res = await fetch('/api/history/all')
      const data = await res.json()
      if (res.ok) setFullHistory(data.history)
    } catch (err) { console.error('Failed to load full history') }
    setLoadingHistory(false)
  }, [])



  useEffect(() => {
    fetchRecentHistory()
  }, [fetchRecentHistory, answer])

  const canAsk = question.trim().length > 0 && !isLoadingAnswer && !isShaking
  const canSendEmail = !!answer && !!entryId && !isSendingEmail

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const SHAKE_DURATION_MS = 2000

  const handleAsk = async () => {
    if (!question.trim()) {
      setErrorMessage('Please enter a question first.')
      return
    }

    setErrorMessage('')
    setStatusMessage('')
    setAnswer(null)
    setEntryId(null)
    setEmail('')
    setIsShaking(true)

    try {
      setIsLoadingAnswer(true)
      const [response] = await Promise.all([
        fetch('/api/answer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ question: question.trim() })
        }),
        new Promise((resolve) => {
          setTimeout(resolve, SHAKE_DURATION_MS)
        })
      ])

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to get an answer right now.')
      }

      setAnswer(payload.answer)
      setEntryId(payload.entryId)
      setStatusMessage('Decision made. You can ask again or send this by email.')
    } catch (error) {
      setErrorMessage(error.message || 'Unable to get an answer right now.')
    } finally {
      setIsLoadingAnswer(false)
      setIsShaking(false)
    }
  }

  const handleSendEmail = async () => {
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('Please provide a valid email address.')
      return
    }

    setErrorMessage('')
    setStatusMessage('')

    try {
      setIsSendingEmail(true)
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          entryId,
          email: email.trim()
        })
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to send email right now.')
      }

      setStatusMessage('Email sent successfully.')
    } catch (error) {
      setErrorMessage(error.message || 'Unable to send email right now.')
    } finally {
      setIsSendingEmail(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center p-6 sm:p-8 font-[Inter]">
      <div className="w-full max-w-lg">
        <div className="backdrop-blur-2xl bg-white/5 rounded-3xl border border-white/15 p-6 sm:p-10 shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
          <h1 className="text-3xl sm:text-4xl font-bold text-center mb-3 bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
            Magic Crystall Ball
          </h1>
          <p className="text-center text-slate-200 mb-8">
            Ask a yes/no question and get a random answer.
          </p>

          <div className="space-y-4 mb-8">
            <label htmlFor="question" className="block text-sm font-medium text-slate-100">
              Your question
            </label>
            <input
              id="question"
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
              placeholder="Should I take the new job?"
              className="w-full px-5 py-4 rounded-2xl bg-white/10 border border-white/25 text-white text-base placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-all"
              aria-invalid={errorMessage ? 'true' : 'false'}
            />

            <button
              onClick={handleAsk}
              disabled={!canAsk}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-lg rounded-full hover:from-indigo-500 hover:to-purple-500 hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100 transition-all duration-200 shadow-lg shadow-indigo-900/40 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              {isLoadingAnswer || isShaking ? 'Deciding...' : 'Get a Decision'}
            </button>
          </div>

          <div className="flex justify-center mb-10" aria-live="polite">
            <div className="relative flex flex-col items-center">
              <div className="absolute inset-0 w-96 h-96 rounded-full bg-indigo-500/15 blur-3xl"></div>
              <div className={`relative w-96 h-96 flex items-center justify-center ${isShaking ? 'animate-shake' : ''}`}>
                <img
                  src={glossyBall}
                  alt="Magic decision ball"
                  className="w-96 h-96 object-contain drop-shadow-[0_20px_36px_rgba(0,0,0,0.5)] saturate-90 brightness-95"
                />
                <div className="absolute w-56 h-56 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-indigo-900/30 blur-xl"></div>
                  <div className="absolute inset-[10%] rounded-full bg-gradient-to-br from-indigo-950/30 via-indigo-950/14 to-indigo-900/0 blur-md"></div>
                  {/* <div className="absolute inset-[18%] rounded-full bg-slate-950/22 backdrop-blur-[0px]"></div> */}
                  <div className="relative z-10 w-40 text-white text-center px-2 font-semibold text-base leading-relaxed">
                    {isShaking ? 'Thinking...' : answer || 'Ask your question to get a decision'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {answer && (
            <div className="bg-white/5 rounded-2xl border border-white/10 p-5 space-y-4">
              <label htmlFor="email" className="block text-sm font-medium text-slate-100">
                Email this result (optional)
              </label>
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <button
                onClick={handleSendEmail}
                disabled={!canSendEmail}
                className="w-full py-3 bg-white/10 text-slate-100 font-medium rounded-full hover:bg-white/20 disabled:opacity-50 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                {isSendingEmail ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          )}

          <div className="mt-5 min-h-6" aria-live="polite">
            {errorMessage && (
              <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                {errorMessage}
              </p>
            )}
            {!errorMessage && statusMessage && (
              <p className="text-sm text-emerald-200 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
                {statusMessage}
              </p>
            )}
          </div>

          {recentHistory.length > 0 && (
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-semibold">Recent Answers</h3>
                <button
                  onClick={() => { setShowFullHistory(true); fetchFullHistory(); }}
                  className="text-sm text-indigo-300 hover:text-indigo-200 transition-colors"
                >
                  View full history
                </button>
              </div>
              <div className="space-y-3">
                {recentHistory.map((entry) => (
                  <div
                    key={entry.id}
                    onClick={() => setExpandedEntryId(expandedEntryId === entry.id ? null : entry.id)}
                    className="bg-white/5 rounded-xl border border-white/10 p-4 cursor-pointer hover:bg-white/8 transition-all"
                  >
                    <p className="text-slate-200 font-medium flex justify-between items-center">
                      {entry.question}
                      <span className={`text-indigo-300 transition-transform duration-200 ${expandedEntryId === entry.id ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </p>
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedEntryId === entry.id ? 'max-h-20 mt-3' : 'max-h-0'}`}>
                      <p className="text-indigo-300">{entry.answer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showFullHistory && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-slate-900 rounded-2xl border border-white/15 max-w-lg w-full max-h-[80vh] overflow-auto p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-white font-bold text-xl">Full Answer History</h2>
                  <button
                    onClick={() => setShowFullHistory(false)}
                    className="text-slate-400 hover:text-white text-lg"
                  >
                    ✕
                  </button>
                </div>
                {loadingHistory ? (
                  <p className="text-slate-400 text-center">Loading history...</p>
                ) : fullHistory.length === 0 ? (
                  <p className="text-slate-400 text-center">No history recorded yet.</p>
                ) : (
                  <div className="space-y-3">
                    {fullHistory.map((entry) => (
                      <div key={entry.id} className="bg-white/5 rounded-xl p-4">
                        <p className="text-slate-200">{entry.question}</p>
                        <p className="text-indigo-300 mt-1">{entry.answer}</p>
                        <p className="text-slate-500 text-xs mt-1">
                          {new Date(entry.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
