import { useState } from 'react'
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
        </div>
      </div>
    </div>
  )
}
