'use client'

import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface UsageMeterProps {
  label: string
  current: number
  max: number
  unit?: string
}

export function UsageMeter({
  label,
  current,
  max,
  unit = ''
}: UsageMeterProps) {
  const percentage = max > 0 ? (current / max) * 100 : 0
  const isNearLimit = percentage > 80
  const isAtLimit = percentage >= 100

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className={isAtLimit ? 'text-red-600 font-semibold' : ''}>
              {current} / {max} {unit}
            </span>
            <span className={isNearLimit ? 'text-orange-600' : 'text-gray-500'}>
              {percentage.toFixed(0)}%
            </span>
          </div>
          <Progress
            value={Math.min(percentage, 100)}
            className={`h-2 ${isAtLimit ? 'bg-red-100' : isNearLimit ? 'bg-orange-100' : ''}`}
            // We might need custom indicator color class if Progress component supports it,
            // otherwise Shadcn Progress usually takes `className` for the root and `indicatorClassName` for the bar.
            // But standard simple usage:
          />
          <div
            className={`h-1 w-full rounded-full mt-1 ${
              isAtLimit
                ? 'bg-red-500'
                : isNearLimit
                  ? 'bg-orange-500'
                  : 'bg-primary'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          ></div>

          {isAtLimit && (
            <p className="text-xs text-red-600">Limite atteinte.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
