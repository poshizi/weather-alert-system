import { NextResponse } from 'next/server'
import { getWeatherScheduler } from '@/lib/scheduler'

export async function GET() {
  try {
    const scheduler = getWeatherScheduler()
    const status = scheduler.getStatus()
    
    return NextResponse.json({
      success: true,
      data: {
        isRunning: status.isRunning,
        interval: status.interval,
        intervalMinutes: Math.round(status.interval / 60000),
        nextUpdate: status.nextUpdate,
        currentTime: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Failed to get scheduler status:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}