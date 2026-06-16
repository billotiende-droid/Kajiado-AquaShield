'use client'

import { useState } from 'react'
import axios from 'axios'
import { motion } from 'framer-motion'
import { Send, AlertCircle } from 'lucide-react'

interface AlertSimulatorProps {
  type: 'sms' | 'webhook'
  apiBaseUrl: string
  onAlertSimulated: () => void
}

export default function AlertSimulator({
  type,
  apiBaseUrl,
  onAlertSimulated,
}: AlertSimulatorProps) {
  const apiUrl = `${apiBaseUrl.replace(/\/$/, '').replace(/\/api\/v1$/, '')}/api/v1`
  const [smsMessage, setSmsMessage] = useState('🚨 ONYO: Maji yanazidi kwa Kajiado. Jua mafuta yako na utulie.')
  const [smsPhone, setSmsPhone] = useState('+254XXXXXXXXX')
  const [webhookPayload, setWebhookPayload] = useState(
    JSON.stringify(
      {
        event: 'flood_alert',
        region: 'Kajiado',
        severity: 'critical',
        message: 'Flood risk detected',
        timestamp: new Date().toISOString(),
      },
      null,
      2
    )
  )
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSendSMS = async () => {
    if (!smsMessage.trim() || !smsPhone.trim()) {
      setMessage({ type: 'error', text: 'Please fill in all SMS fields' })
      return
    }

    try {
      setLoading(true)
      await axios.post(`${apiUrl}/sms/alert`, {
        recipient: smsPhone,
        message: smsMessage,
        location: 'Kajiado Central',
        risk_level: 'HIGH',
      })
      setMessage({ type: 'success', text: 'SMS alert simulated successfully!' })
      setSmsMessage('🚨 ONYO: Maji yanazidi kwa Kajiado. Jua mafuta yako na utulie.')
      setSmsPhone('+254XXXXXXXXX')
      onAlertSimulated()
    } catch (err: any) {
      const errorText = err.response?.data?.detail || err.message || 'Failed to simulate SMS'
      setMessage({ type: 'error', text: errorText })
    } finally {
      setLoading(false)
    }
  }

  const handleSendWebhook = async () => {
    if (!webhookPayload.trim()) {
      setMessage({ type: 'error', text: 'Please provide a webhook payload' })
      return
    }

    try {
      setLoading(true)
      let payload
      try {
        payload = JSON.parse(webhookPayload)
      } catch {
        setMessage({ type: 'error', text: 'Invalid JSON in webhook payload' })
        setLoading(false)
        return
      }

      await axios.post(`${apiUrl}/sms/alert`, {
        ...payload,
        recipient: payload.recipient || 'webhook',
        location: payload.location || 'Kajiado Central',
        risk_level: payload.risk_level || 'HIGH',
      })
      setMessage({ type: 'success', text: 'Webhook alert simulated successfully!' })
      setWebhookPayload(
        JSON.stringify(
          {
            event: 'flood_alert',
            region: 'Kajiado',
            severity: 'critical',
            message: 'Flood risk detected',
            timestamp: new Date().toISOString(),
          },
          null,
          2
        )
      )
      onAlertSimulated()
    } catch (err: any) {
      const errorText = err.response?.data?.detail || err.message || 'Failed to simulate webhook'
      setMessage({ type: 'error', text: errorText })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Message Display */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3 rounded-lg flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">{message.text}</span>
        </motion.div>
      )}

      {/* SMS Form */}
      {type === 'sms' && (
        <div className="space-y-3">
          <div>
            <label className="text-sm text-slate-700 block mb-2">Phone Number</label>
            <input
              type="text"
              value={smsPhone}
              onChange={(e) => setSmsPhone(e.target.value)}
              placeholder="+254XXXXXXXXX"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-sm text-slate-700 block mb-2">Message (Swahili)</label>
            <textarea
              value={smsMessage}
              onChange={(e) => setSmsMessage(e.target.value)}
              rows={4}
              placeholder="Enter SMS message in Swahili..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <button
            onClick={handleSendSMS}
            disabled={loading}
            className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send SMS Alert
          </button>
        </div>
      )}

      {/* Webhook Form */}
      {type === 'webhook' && (
        <div className="space-y-3">
          <div>
            <label className="text-sm text-slate-700 block mb-2">JSON Payload</label>
            <textarea
              value={webhookPayload}
              onChange={(e) => setWebhookPayload(e.target.value)}
              rows={8}
              placeholder='{"event": "flood_alert", ...}'
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-xs"
            />
          </div>
          <button
            onClick={handleSendWebhook}
            disabled={loading}
            className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send Webhook Alert
          </button>
        </div>
      )}
    </div>
  )
}
