import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // 获取最近的更新日志
    const updateLogs = await db.updateLog.findMany({
      orderBy: { updateTime: 'desc' },
      take: 30
    })

    // 获取数据库统计信息
    const totalAlerts = await db.weatherAlert.count()
    const todayAlerts = await db.weatherAlert.count({
      where: {
        writeTime: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    })

    // 获取最新的批次信息
    const latestBatch = await db.updateLog.findFirst({
      where: { status: 'success' },
      orderBy: { updateTime: 'desc' }
    })

    // 获取通知配置状态
    const notificationConfigs = await db.notificationConfig.findMany()
    const enabledConfigs = notificationConfigs.filter(config => config.enabled)

    // 获取通知日志
    const notificationLogs = await db.notificationLog.findMany({
      orderBy: { sentAt: 'desc' },
      take: 20
    })

    // 获取最近的预警数据
    const recentAlerts = await db.weatherAlert.findMany({
      orderBy: { writeTime: 'desc' },
      take: 10
    })

    return NextResponse.json({
      success: true,
      data: {
        updateLogs,
        stats: {
          totalAlerts,
          todayAlerts,
          enabledConfigs: enabledConfigs.length,
          totalConfigs: notificationConfigs.length
        },
        latestBatch,
        notificationConfigs,
        notificationLogs,
        recentAlerts
      }
    })

  } catch (error) {
    console.error('获取监控数据失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}