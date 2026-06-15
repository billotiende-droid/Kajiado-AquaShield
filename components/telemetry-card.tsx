'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface TelemetryCardProps {
  icon: ReactNode
  label: string
  value: string
  color: 'blue' | 'cyan' | 'gray' | 'teal'
}

const colorClasses = {
  blue: 'bg-blue-50',
  cyan: 'bg-cyan-50',
  gray: 'bg-gray-50',
  teal: 'bg-green-50',
}

const textColorClasses = {
  blue: 'text-blue-900',
  cyan: 'text-cyan-900',
  gray: 'text-gray-900',
  teal: 'text-green-900',
}

const iconColorClasses = {
  blue: 'text-blue-600',
  cyan: 'text-cyan-600',
  gray: 'text-slate-600',
  teal: 'text-green-600',
}

export default function TelemetryCard({ icon, label, value, color }: TelemetryCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`${colorClasses[color]} rounded-lg p-6 border border-slate-200 hover:shadow-md transition-shadow`}
    >
      <div className={`${iconColorClasses[color]} mb-3`}>{icon}</div>
      <p className="text-sm text-slate-600 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${textColorClasses[color]}`}>{value}</p>
    </motion.div>
  )
}
