'use client'

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface AnalyticsChartItem {
  label: string
  value: number
  highlighted?: boolean
}

export function RoleAnalyticsChart({
  title,
  data,
  color = '#059669',
  highlightColor = '#7c3aed',
}: {
  title: string
  data: AnalyticsChartItem[]
  color?: string
  highlightColor?: string
}) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        {data.length === 0 || data.every((item) => item.value === 0) ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No data available yet.</p>
        ) : (
          <div className="h-64 w-full" role="img" aria-label={title}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill={color} radius={[5, 5, 0, 0]}>
                  {data.map((item) => (
                    <Cell key={item.label} fill={item.highlighted ? highlightColor : color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
