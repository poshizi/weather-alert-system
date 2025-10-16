import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // 检查数据库连接
    await db.$queryRaw`SELECT 1`
    
    // 检查最新数据时间
    const latestUpdate = await db.updateLog.findFirst({
      where: { status: 'success' },
      orderBy: { updateTime: 'desc' }
    })
    
    // 检查预警数据数量
    const alertCount = await db.weatherAlert.count()
    
    const status = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      lastUpdate: latestUpdate?.updateTime || null,
      alertCount,
      uptime: process.uptime()
    }
    
    return NextResponse.json(status)
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}