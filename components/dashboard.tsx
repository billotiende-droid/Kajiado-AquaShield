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
} from 'lucide-react'
import TelemetryCard from './telemetry-card'
import AlertSimulator from './alert-simulator'
import AlertConsole from './alert-console'
import { RiskAssessmentMap } from './risk-assessment-map'
import { LocationSelector } from './location-selector'
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

interface AlertLog {
  id: number
  alert_type: string
  content: Record<string, any>
  timestamp: string
  status: string
}

export default function Dashboard() {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null)
  const [alertLogs, setAlertLogs] = useState<AlertLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)
  const [activeTab, setActiveTab] = useState<'sms' | 'webhook'>('sms')
  const [selectedLocation, setSelectedLocation] = useState('Kajiado Central')

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

  // Fetch telemetry data
  const fetchTelemetry = useCallback(async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${apiBaseUrl}/api/v1/telemetry`, {
        timeout: 5000,
      })
      setTelemetry(response.data)
      setError(null)
      setLastFetch(new Date())
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to fetch telemetry'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl])

  // Fetch alert logs
  const fetchAlertLogs = useCallback(async () => {
    try {
      const response = await axios.get(`${apiBaseUrl}/api/v1/logs`, {
        timeout: 5000,
      })
      setAlertLogs(response.data.logs || [])
    } catch (err: any) {
      console.error('Failed to fetch alert logs:', err)
    }
  }, [apiBaseUrl])

  // Initial fetch
  useEffect(() => {
    fetchTelemetry()
    fetchAlertLogs()
  }, [fetchTelemetry, fetchAlertLogs])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTelemetry()
      fetchAlertLogs()
    }, 30000)

    return () => clearInterval(interval)
  }, [fetchTelemetry, fetchAlertLogs])

  const handleAlertSimulated = () => {
    fetchAlertLogs()
  }

  const getRiskPercentage = (level: string): number => {
    switch (level) {
      case 'CRITICAL':
        return 85
      case 'HIGH':
        return 65
      case 'MODERATE':
        return 42
      case 'LOW':
        return 18
      default:
        return 0
    }
  }

  return (
    <div className="min-h-screen bg-white">
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
                onClick={fetchTelemetry}
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">AquaShield Emergency Operations Dashboard</h2>
          <p className="text-slate-600">Real-time Flash-Flood Risk Assessment - Kajiado County, Kenya</p>
        </div>

        {/* Error Banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <WarningBanner
              message={`Error Loading Data: ${error}`}
              type="alert"
            />
          </motion.div>
        )}

        {/* Risk Assessment Map and Overall Risk */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left: Risk Assessment Map */}
          <div className="lg:col-span-2">
            {telemetry ? (
              <RiskAssessmentMap
                selectedLocation={selectedLocation}
                onLocationSelect={setSelectedLocation}
              />
            ) : (
              <div className="h-96 bg-slate-100 rounded-lg animate-pulse"></div>
            )}
          </div>

          {/* Right: Overall Risk Level and Alerts */}
          <div className="space-y-6">
            {/* Risk Score Card */}
            {telemetry && (
              <div className="bg-white rounded-lg border-l-4 border-l-blue-500 border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-slate-600">Overall Risk Level</h3>
                  <Activity className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-4xl font-bold text-orange-600 mb-1">MODERATE</div>
                <p className="text-sm text-slate-600">2 critical alerts active</p>
              </div>
            )}

            {/* Active Alerts */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">Active Alerts</h3>
                <button
                  onClick={fetchAlertLogs}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Refresh
                </button>
              </div>
              <div className="text-center py-8 text-slate-500">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No active alerts</p>
              </div>
              <button className="w-full mt-4 text-center text-blue-600 hover:text-blue-700 text-sm font-medium py-2 border-t border-slate-100">
                Load More
              </button>
            </div>

            {/* SMS Simulation Panel */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                SMS Simulation Panel
              </h3>
              
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Phone Number"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  placeholder="Alert Message"
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors">
                  <Send className="w-4 h-4" />
                  Send SMS
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-600 text-center">Quick Templates:</p>
                <div className="mt-2 space-y-2 text-xs">
                  <button className="w-full text-left px-2 py-1 bg-slate-50 hover:bg-slate-100 rounded text-slate-700">
                    → Flood Warning Template
                  </button>
                  <button className="w-full text-left px-2 py-1 bg-slate-50 hover:bg-slate-100 rounded text-slate-700">
                    → Evacuation Notice
                  </button>
                  <button className="w-full text-left px-2 py-1 bg-slate-50 hover:bg-slate-100 rounded text-slate-700">
                    → All Clear Message
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-500 text-center mt-3">No SMS messages sent yet</p>
            </div>
          </div>
        </div>

        {/* Weather Metrics Section */}
        {telemetry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-lg border border-slate-200 p-6 mb-8"
          >
            <h3 className="text-lg font-semibold text-slate-900 mb-6">
              {selectedLocation} - Weather & Risk Metrics
            </h3>

            {/* Risk Score and Affected Areas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Risk Score */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Cloud className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-slate-900">Risk Score</h4>
                </div>
                <div className="text-4xl font-bold text-orange-600 mb-2">42.0%</div>
                <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: '42%' }}></div>
                </div>
                <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-orange-600 bg-orange-50">
                  MODERATE
                </div>
              </div>

              {/* Affected Areas */}
              <div>
                <AffectedAreasList location={selectedLocation} />
              </div>

              {/* Weather Summary */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-3">Weather Summary</h4>
                <div className="space-y-2 text-sm text-slate-700">
                  <div>
                    <span className="text-slate-600">Temperature:</span>
                    <span className="font-medium ml-2">{telemetry.temperature.toFixed(1)}°C</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Rainfall:</span>
                    <span className="font-medium ml-2">{telemetry.precipitation.toFixed(1)}mm</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Humidity:</span>
                    <span className="font-medium ml-2">{telemetry.humidity.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Telemetry Cards Grid - 2x2 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
            >
              <TelemetryCard
                icon={<Cloud className="w-6 h-6" />}
                label="Temperature"
                value={`${telemetry.temperature.toFixed(1)}°C`}
                color="blue"
              />
              <TelemetryCard
                icon={<Droplets className="w-6 h-6" />}
                label="Humidity"
                value={`${telemetry.humidity.toFixed(0)}%`}
                color="cyan"
              />
              <TelemetryCard
                icon={<CloudRain className="w-6 h-6" />}
                label="Rainfall"
                value={`${telemetry.precipitation.toFixed(1)}mm`}
                color="cyan"
              />
              <TelemetryCard
                icon={<Wind className="w-6 h-6" />}
                label="Wind Speed"
                value={`${telemetry.wind_speed.toFixed(1)}km/h`}
                color="gray"
              />
            </motion.div>

            {/* Warning Banner */}
            <WarningBanner
              message="Monitor weather conditions closely. Risk levels may change based on incoming rainfall."
              type="warning"
            />
          </motion.div>
        )}

        {/* Location Selection */}
        <div className="mb-8">
          <LocationSelector
            selectedLocation={selectedLocation}
            onLocationSelect={setSelectedLocation}
          />
        </div>

        {/* Refresh Button */}
        <div className="text-center mb-12">
          <button
            onClick={fetchTelemetry}
            disabled={loading}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>

        {/* Swahili Message */}
        {telemetry && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 mb-12"
          >
            <h3 className="text-lg font-bold mb-3 text-green-900">
              📢 Ujumbe wa Afya ya Maji (Water Safety Message)
            </h3>
            <div className="text-green-800">
              <p className="mb-2">
                {telemetry.risk_level === 'CRITICAL'
                  ? '⚠️ ONYO MKUBWA: Hali ya maji ni hatari sana. Jua maji yenyewe katika nyumba yako na ujihadari.'
                  : telemetry.risk_level === 'MODERATE'
                    ? '⚠️ ONYO: Hakuna kulingana. Kuwa na ujihadari kwa sababu ya mvua inayoweza kuwa na hatari.'
                    : '✅ SALAMA: Hali ya maji ni salama kwa sasa. Endelea kusoma habari za sasa.'}
              </p>
              <p className="text-sm text-slate-600">
                Sasa: {new Date(telemetry.timestamp).toLocaleString('sw-KE')}
              </p>
            </div>
          </motion.div>
        )}

        {/* Last Update */}
        {lastFetch && (
          <div className="text-center text-xs text-slate-500 mb-8">
            Last updated: {lastFetch.toLocaleTimeString()}
          </div>
        )}
      </main>

      {/* Footer */}
      <FooterSection />
    </div>
  )
}
