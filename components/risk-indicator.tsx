import { motion } from 'framer-motion'
import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react'

interface RiskIndicatorProps {
  riskLevel: string
}

export default function RiskIndicator({ riskLevel }: RiskIndicatorProps) {
  const getRiskConfig = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return {
          bgGradient: 'from-red-600 to-red-800',
          icon: AlertTriangle,
          text: 'CRITICAL RISK',
          pulse: true,
          textColor: 'text-red-100',
          borderColor: 'border-red-500',
        }
      case 'MODERATE':
        return {
          bgGradient: 'from-yellow-500 to-yellow-700',
          icon: AlertCircle,
          text: 'MODERATE RISK',
          pulse: false,
          textColor: 'text-yellow-100',
          borderColor: 'border-yellow-500',
        }
      case 'LOW':
        return {
          bgGradient: 'from-green-600 to-green-800',
          icon: CheckCircle,
          text: 'LOW RISK',
          pulse: false,
          textColor: 'text-green-100',
          borderColor: 'border-green-500',
        }
      default:
        return {
          bgGradient: 'from-gray-600 to-gray-800',
          icon: AlertCircle,
          text: 'UNKNOWN',
          pulse: false,
          textColor: 'text-gray-100',
          borderColor: 'border-gray-500',
        }
    }
  }

  const config = getRiskConfig(riskLevel)
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`mb-8 bg-gradient-to-r ${config.bgGradient} rounded-xl p-8 border-2 ${config.borderColor} ${
        config.pulse ? 'animate-pulse' : ''
      }`}
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 bg-white/20 rounded-lg`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-white">{config.text}</h2>
          <p className={`${config.textColor} text-sm mt-1`}>
            {riskLevel === 'CRITICAL'
              ? 'Immediate action required. Flood risk is high.'
              : riskLevel === 'MODERATE'
                ? 'Monitor conditions closely. Be prepared.'
                : 'Conditions are stable. Continue normal operations.'}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
