"use client"
import React from 'react'
import { 
  XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Area, AreaChart 
} from 'recharts'

export default function UsageChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorQueries" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
        <XAxis dataKey="name" stroke="#525252" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
        <YAxis stroke="#525252" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
        <Tooltip 
          contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', borderRadius: '12px', color: '#fff' }}
          itemStyle={{ color: '#a3a3a3' }}
        />
        <Area type="monotone" dataKey="queries" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorQueries)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
