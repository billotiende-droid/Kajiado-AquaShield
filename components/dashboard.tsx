'use client'

import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { motion } from 'framer-motion'
import {
  Cloud,
  CloudRain,
  Wind,
  Droplets,
  AlertTriangle,
  RefreshCw,
  Send,
  MessageSquare,
  Activity,
  Droplet,
  MapPin,
} from 'lucide-react'
import TelemetryCard from './telemetry-card'
import AlertSimulator from './alert-simulator'
import AlertConsole from './alert-console'
import { RiskAssessmentMap } from './risk-assessment-map'
import { AffectedAreasList } from './affected-areas-list'
import { RiskScoreDisplay } from './risk-score-display'
import { WarningBanner } from './warning-banner'
import { FooterSection } from './footer-section'

interface TelemetryData {
  temperature: number
  precipitation: number
  cloud_density: number
  wind_speed: number
  humidity: number
  risk_level: string
  timestamp: string
  location: string
}

interface RiskAssessment {
  risk_score: number
  risk_level: string
  flash_flood_probability: number
  rainfall_score: number
  humidity_score: number
  wind_score: number
  temperature_score: number
  trend_multiplier: number
  affected_areas: string[]
  recommended_action: string
  timestamp: string
}

interface DashboardSummary {
  locations: Array<{
    name: string
    risk_level: string
    risk_score: number
  }>
  overall_risk: string
  timestamp: string
  critical_alerts: number
}

interface AlertLog {
  id: number
  alert_type: string
  content: Record<string, any>
  timestamp: string
  status: string
  location?: string
  risk_level?: string
  message?: string
}

export default function Dashboard() {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null)
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null)
  const [alertLogs, setAlertLogs] = useState<AlertLog[]>([])
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)
  const [activeTab, setActiveTab] = useState<'sms' | 'webhook'>('sms')
  const [selectedLocation, setSelectedLocation] = useState('Kajiado Central')
  
  // SMS form state
  const [smsPhone, setSmsPhone] = useState('+2547XXXXXXXX')
  const [smsMessage, setSmsMessage] = useState('🚨 ONYO: Maji yanazidi kwa Kajiado. Jua mafuta yako na utulie.')
  const [smsLoading, setSmsLoading] = useState(false)
  const [smsStatus, setSmsStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

  // Fetch weather and risk data for selected location
  const fetchLocationData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [riskRes, weatherRes] = await Promise.all([
        axios.get(`${apiBaseUrl}/api/risk/${encodeURIComponent(selectedLocation)}`, { timeout: 5000 }),
        axios.get(`${apiBaseUrl}/api/weather/${encodeURIComponent(selectedLocation)}`, { timeout: 5000 }),
      ])
      
      const riskData = riskRes.data.risk_assessment
      const weatherData = weatherRes.data.data?.[0] || weatherRes.data
      
      if (riskData) {
        setRiskAssessment(riskData)
        setTelemetry({
          temperature: weatherData.temperature ?? 25,
          precipitation: weatherData.rainfall ?? 0,
          cloud_density: weatherData.humidity ?? 0,
          wind_speed: weatherData.wind_speed ?? 0,
          humidity: weatherData.humidity ?? 0,
          risk_level: riskData.risk_level,
          timestamp: riskData.timestamp,
          location: selectedLocation,
        })
      }
      
      setLastFetch(new Date())
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to fetch location data'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl, selectedLocation])

  // Fetch alert logs
  const fetchAlertLogs = useCallback(async () => {
    try {
      const response = await axios.get(`${apiBaseUrl}/api/sms/alerts`, { timeout: 5000 })
      setAlertLogs(response.data.alerts || [])
    } catch (err: any) {
      console.error('Failed to fetch alert logs:', err)
    }
  }, [apiBaseUrl])

  // Fetch dashboard summary
  const fetchDashboardSummary = useCallback(async () => {
    try {
      const response = await axios.get(`${apiBaseUrl}/api/dashboard/summary`, { timeout: 5000 })
      setDashboardSummary(response.data)
    } catch (err: any) {
      console.error('Failed to fetch dashboard summary:', err)
    }
  }, [apiBaseUrl])

  // Initial fetch
  useEffect(() => {
    fetchLocationData()
    fetchAlertLogs()
    fetchDashboardSummary()
  }, [fetchLocationData, fetchAlertLogs, fetchDashboardSummary])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLocationData()
      fetchAlertLogs()
      fetchDashboardSummary()
    }, 30000)

    return () => clearInterval(interval)
  }, [fetchLocationData, fetchAlertLogs, fetchDashboardSummary])

  const getRiskPercentage = (level: string): number => {
    switch (level) {
      case 'CRITICAL': return 85
      case 'HIGH': return 65
      case 'VERY_HIGH': return 75
      case 'MODERATE': return 42
      case 'LOW': return 18
      default: return 0
    }
  }

  // SMS handler
  const handleSendSMS = async () => {
    if (!smsPhone.trim() || !smsMessage.trim()) {
      setSmsStatus({ type: 'error', text: 'Please fill in all fields' })
      return
    }
    if (smsMessage.length > 160) {
      setSmsStatus({ type: 'error', text: 'Message exceeds 160 characters' })
      return
    }

    try {
      setSmsLoading(true)
      setSmsStatus(null)
      await axios.post(`${apiBaseUrl}/api/sms/alert`, {
        recipient: smsPhone,
        message: smsMessage,
        location: selectedLocation,
        risk_level: riskAssessment?.risk_level || 'HIGH',
      })
      setSmsStatus({ type: 'success', text: 'SMS alert sent successfully!' })
      setSmsPhone('+2547XXXXXXXX')
      setSmsMessage('🚨 ONYO: Maji yanazidi kwa Kajiado. Jua mafuta yako na utulie.')
      fetchAlertLogs()
      fetchDashboardSummary()
    } catch (err: any) {
      const errorText = err.response?.data?.detail || err.message || 'Failed to send SMS'
      setSmsStatus({ type: 'error', text: errorText })
    } finally {
      setSmsLoading(false)
    }
  }

  const applyTemplate = (template: string) => {
    setSmsMessage(template)
  }

  const templates = [
    { label: 'Flood Warning', text: '🚨 ONYO: Maji yanazidi kwa Kajiado. Jua mafuta yako na utulie.' },
    { label: 'Evacuation Notice', text: '🚨 ONYO MKUBWA: Hamia haraka! Maafa ya maji yanayokuja. Endelea kwa salama.' },
    { label: 'All Clear', text: '✅ SALAMA: Hali ya maji imebaki salama. Endelea na shughuli zako kama kawaida.' },
  ]

  const charCount = smsMessage.length
  const isOverLimit = charCount > 160

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                <Droplet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">AquaShield</h1>
                <p className="text-xs text-slate-600">Emergency Response System</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right text-sm">
                <p className="font-semibold text-slate-900">Kajiado County</p>
                <p className="text-xs text-slate-500">Kenya</p>
              </div>
              <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                English
              </div>
              <button
                onClick={fetchLocationData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-lg transition-colors font-medium"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 w-full">
        {/* Page Title - compact */}
        <div className="mb-3">
          <h2 className="text-xl font-bold text-slate-900 mb-1">AquaShield Emergency Operations Dashboard</h2>
          <p className="text-sm text-slate-600">Real-time Flash-Flood Risk Assessment - Kajiado County, Kenya</p>
        </div>

        {/* Error Banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3"
          >
            <WarningBanner message={`Error Loading Data: ${error}`} type="alert" />
          </motion.div>
        )}

        {/* Main Grid: Left (Map + SMS) | Right (Risk + Alerts + Weather) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
          {/* Left Column: Risk Map + SMS Simulation */}
          <div className="lg:col-span-2 space-y-3 min-h-0">
            {/* Risk Assessment Map */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              {telemetry ? (
                <RiskAssessmentMap
                  selectedLocation={selectedLocation}
                  onLocationSelect={setSelectedLocation}
                />
              ) : (
                <div className="h-60 bg-slate-100 rounded-lg animate-pulse"></div>
              )}
            </div>

            {/* SMS Simulation Panel - below map */}
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-600" />
                SMS Alert Simulation
              </h3>

              {/* Status Message */}
              {smsStatus && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-lg mb-3 flex items-center gap-2 ${
                    smsStatus.type === 'success'
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{smsStatus.text}</span>
                </motion.div>
              )}

              <div className="space-y-3">
                {/* Phone Number */}
                <div>
                  <label className="text-sm text-slate-700 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={smsPhone}
                    onChange={(e) => setSmsPhone(e.target.value)}
                    placeholder="+2547XXXXXXXX"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={15}
                  />
                </div>

                {/* Alert Message with Character Count */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm text-slate-700">Alert Message (Swahili)</label>
                    <span className={`text-xs font-mono ${isOverLimit ? 'text-red-600' : 'text-slate-400'}`}>
                      {charCount}/160
                    </span>
                  </div>
                  <textarea
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                    rows={3}
                    placeholder="Enter alert message in Swahili..."
                    className={`w-full px-3 py-2 bg-white border rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                      isOverLimit ? 'border-red-300' : 'border-slate-300'
                    }`}
                    maxLength={160}
                  />
                  {isOverLimit && (
                    <p className="text-xs text-red-600">Message exceeds 160 character limit</p>
                  )}
                </div>

                {/* Quick Templates */}
                <div className="pt-2 border-t border-slate-200">
                  <p className="text-xs text-slate-600 mb-2">Quick Templates:</p>
                  <div className="flex flex-wrap gap-2">
                    {templates.map((template) => (
                      <button
                        key={template.label}
                        type="button"
                        onClick={() => applyTemplate(template.text)}
                        className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors whitespace-nowrap"
                      >
                        {template.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Send Button */}
                <button
                  onClick={handleSendSMS}
                  disabled={smsLoading || isOverLimit || !smsPhone.trim() || !smsMessage.trim()}
                  className="w-full mt-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-400 text-white py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  {smsLoading ? 'Sending...' : 'Send SMS Alert'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Overall Risk + Active Alerts + Weather & Risk Metrics */}
          <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-220px)] pr-2">
            {/* Overall Risk Level */}
            {dashboardSummary && (
              <div className="bg-white rounded-lg border-l-4 border-l-blue-500 border border-slate-200 p-3">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xs font-semibold text-slate-600">Overall Risk Level</h3>
                  <Activity className="w-3 h-3 text-slate-400" />
                </div>
                <div className={`text-2xl font-bold mb-0.5 ${dashboardSummary.overall_risk === 'CRITICAL' || dashboardSummary.overall_risk === 'VERY_HIGH' ? 'text-red-600' : dashboardSummary.overall_risk === 'HIGH' ? 'text-orange-600' : dashboardSummary.overall_risk === 'MODERATE' ? 'text-yellow-600' : 'text-green-600'}`}>
                  {dashboardSummary.overall_risk}
                </div>
                <p className="text-[10px] text-slate-600">{dashboardSummary.critical_alerts} critical alerts active</p>
              </div>
            )}

            {/* Active Alerts */}
            <div className="bg-white rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-900">Active Alerts</h3>
                <button
                  onClick={fetchAlertLogs}
                  className="text-[10px] text-blue-600 hover:text-blue-700 font-medium"
                >
                  Refresh
                </button>
              </div>
              {alertLogs.length === 0 ? (
                <div className="text-center py-4 text-slate-500">
                  <AlertTriangle className="w-5 h-5 mx-auto mb-1 opacity-30" />
                  <p className="text-xs">No active alerts</p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {alertLogs.slice(0, 3).map((alert) => (
                    <div key={alert.id} className="p-1.5 bg-slate-50 rounded border border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-900">{alert.location || 'Unknown'}</span>
                        <span className={`text-[9px] px-1 py-0.5 rounded ${
                          alert.risk_level === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                          alert.risk_level === 'HIGH' || alert.risk_level === 'VERY_HIGH' ? 'bg-orange-100 text-orange-700' :
                          alert.risk_level === 'MODERATE' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {alert.risk_level}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-600 mt-0.5 line-clamp-1">{alert.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Weather & Risk Metrics */}
            {telemetry && riskAssessment && (
              <div className="bg-white rounded-lg border border-slate-200 p-3">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">{selectedLocation} - Weather & Risk Metrics</h3>
                
                {/* Risk Score + Weather in 2-col grid */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {/* Risk Score */}
                  <div className="bg-slate-50 rounded-lg p-2">
                    <div className="flex items-center gap-1 mb-1">
                      <Cloud className="w-3 h-3 text-blue-600" />
                      <h4 className="text-[10px] font-semibold text-slate-700">Risk Score</h4>
                    </div>
                    <div className={`text-xl font-bold ${riskAssessment.risk_level === 'CRITICAL' ? 'text-red-600' : riskAssessment.risk_level === 'VERY_HIGH' ? 'text-red-500' : riskAssessment.risk_level === 'HIGH' ? 'text-orange-600' : riskAssessment.risk_level === 'MODERATE' ? 'text-yellow-600' : 'text-green-600'}`}>
                      {(riskAssessment.risk_score * 100).toFixed(1)}%
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1 mt-1">
                      <div 
                        className={`h-1 rounded-full ${riskAssessment.risk_level === 'CRITICAL' ? 'bg-red-500' : riskAssessment.risk_level === 'VERY_HIGH' ? 'bg-red-400' : riskAssessment.risk_level === 'HIGH' ? 'bg-orange-500' : riskAssessment.risk_level === 'MODERATE' ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${(riskAssessment.risk_score * 100)}%` }}
                      ></div>
                    </div>
                    <div className={`inline-block px-1.5 py-0.5 rounded-full text-[9px] font-semibold mt-1 ${riskAssessment.risk_level === 'CRITICAL' ? 'text-red-600 bg-red-50' : riskAssessment.risk_level === 'VERY_HIGH' ? 'text-red-500 bg-red-50' : riskAssessment.risk_level === 'HIGH' ? 'text-orange-600 bg-orange-50' : riskAssessment.risk_level === 'MODERATE' ? 'text-yellow-600 bg-yellow-50' : 'text-green-600 bg-green-50'}`}>
                      {riskAssessment.risk_level}
                    </div>
                  </div>

                  {/* Weather Summary */}
                  <div className="bg-slate-50 rounded-lg p-2">
                    <h4 className="text-[10px] font-semibold text-slate-700 mb-1">Weather</h4>
                    <div className="space-y-0.5 text-[10px] text-slate-700">
                      <div><span className="text-slate-600">Temp:</span> <span className="font-medium ml-1">{telemetry.temperature.toFixed(1)}°C</span></div>
                      <div><span className="text-slate-600">Rain:</span> <span className="font-medium ml-1">{telemetry.precipitation.toFixed(1)}mm</span></div>
                      <div><span className="text-slate-600">Humidity:</span> <span className="font-medium ml-1">{telemetry.humidity.toFixed(0)}%</span></div>
                      <div><span className="text-slate-600">Wind:</span> <span className="font-medium ml-1">{telemetry.wind_speed.toFixed(1)} km/h</span></div>
                    </div>
                  </div>
                </div>

                {/* Affected Areas */}
                <div className="mb-2">
                  <h4 className="text-[10px] font-semibold text-slate-700 mb-1">Affected Areas</h4>
                  <div className="flex flex-wrap gap-1">
                    {(() => {
                      try {
                        const areas = typeof riskAssessment.affected_areas === 'string' 
                          ? JSON.parse(riskAssessment.affected_areas) 
                          : riskAssessment.affected_areas;
                        return areas.slice(0, 4).map((area: string, index: number) => (
                          <span key={index} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-red-50 text-red-700 text-[10px] rounded">
                            <span className="w-1 h-1 rounded-full bg-red-500"></span>
                            {area}
                          </span>
                        ));
                      } catch {
                        return <span className="text-[10px] text-slate-500">No data</span>;
                      }
                    })()}
                  </div>
                </div>

                {/* Warning Banner from Risk Assessment */}
                <WarningBanner
                  message={riskAssessment.recommended_action}
                  type={riskAssessment.risk_level === 'CRITICAL' || riskAssessment.risk_level === 'VERY_HIGH' ? 'alert' : riskAssessment.risk_level === 'HIGH' ? 'warning' : 'info'}
                />
              </div>
            )}

            {/* Location Selector */}
            <div className="bg-white rounded-lg border border-slate-200 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <MapPin className="w-3 h-3 text-slate-600" />
                <h3 className="text-sm font-semibold text-slate-900">Select Location</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['Kajiado Central', 'Magadi', 'Loitokitok', 'Namanga', 'Isinya'].map((location) => (
                  <button
                    key={location}
                    onClick={() => setSelectedLocation(location)}
                    className={`px-2.5 py-1 rounded font-medium text-xs transition-all ${
                      selectedLocation === location
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {location}
                  </button>
                ))}
              </div>
            </div>

            {/* Swahili Message */}
            {telemetry && riskAssessment && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3"
              >
                <h3 className="text-sm font-bold mb-1.5 text-green-900">
                  📢 Ujumbe wa Afya ya Maji
                </h3>
                <div className="text-green-800 text-[11px]">
                  <p className="mb-1">
                    {riskAssessment.risk_level === 'CRITICAL'
                      ? '⚠️ ONYO MKUBWA: Hali ya maji ni hatari sana. Jua maji na ujihadari.'
                      : riskAssessment.risk_level === 'VERY_HIGH'
                        ? '⚠️ ONYO MKUBWA: Hali hatari. Hamia salama mara moja.'
                        : riskAssessment.risk_level === 'HIGH'
                          ? '⚠️ ONYO: Hakuna kulingana. Kuwa na ujihadari kwa mvua hatari.'
                          : riskAssessment.risk_level === 'MODERATE'
                            ? '⚠️ ONYO: Kuwa makini. Mvua inaweza kusababisha maafa.'
                            : '✅ SALAMA: Hali ya maji ni salama. Endelea kukimbilia habari.'}
                  </p>
                  <p className="text-xs text-slate-600">
                    {new Date(riskAssessment.timestamp).toLocaleString('sw-KE')}
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Refresh Button + Last Update */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-3">
          <button
            onClick={fetchLocationData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded font-medium text-sm transition-colors flex items-center justify-center gap-1.5 mx-auto sm:mx-0"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {lastFetch && (
            <div className="text-center text-[10px] text-slate-500">
              Last updated: {lastFetch.toLocaleTimeString()}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <FooterSection />
    </div>
  )
}