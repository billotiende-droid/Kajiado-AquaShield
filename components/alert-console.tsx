'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Webhook } from 'lucide-react'

interface AlertLog {
  id: number
  alert_type: string
  content: Record<string, any>
  timestamp: string
  status: string
}

interface AlertConsoleProps {
  logs: AlertLog[]
}

export default function AlertConsole({ logs }: AlertConsoleProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs])

  if (logs.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400">
        <div className="text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p>No alerts yet. Send a test alert to see it here.</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={scrollRef}
      className="flex-1 space-y-3 overflow-y-auto max-h-[600px] pr-2"
      style={{
        scrollBehavior: 'smooth',
      }}
    >
      <AnimatePresence mode="popLayout">
        {logs.map((log, index) => (
          <motion.div
            key={`${log.id}-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {log.alert_type === 'sms' ? (
                  <MessageSquare className="w-4 h-4 text-green-600" />
                ) : (
                  <Webhook className="w-4 h-4 text-blue-600" />
                )}
                <span className="font-mono text-sm font-bold text-slate-900 uppercase">
                  {log.alert_type}
                </span>
                <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">
                  {log.status}
                </span>
              </div>
              <span className="text-xs text-slate-500">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
            </div>

            {/* Content */}
            <div className="bg-slate-100 rounded p-3 overflow-x-auto">
              <pre className="text-xs text-slate-700 font-mono break-words whitespace-pre-wrap">
                {JSON.stringify(log.content, null, 2)}
              </pre>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
