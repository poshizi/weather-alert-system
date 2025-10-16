import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const level = searchParams.get('level')
    const region = searchParams.get('region')
    const levelType = searchParams.get('level_type')

    // 获取最新的批次ID
    const latestBatch = await db.updateLog.findFirst({
      where: { status: 'success' },
      orderBy: { updateTime: 'desc' }
    })

    if (!latestBatch) {
      return NextResponse.json({
        success: false,
        error: '暂无数据'
      })
    }

    // 构建查询条件
    const where: any = {
      batchId: latestBatch.batchId
    }

    if (type) {
      where.typeName = type
    }

    if (level) {
      where.levelName = level
    }

    if (region) {
      where.regionCode = {
        startsWith: region
      }
    }

    // 获取当前批次的预警数据
    let currentAlerts = await db.weatherAlert.findMany({
      where,
      orderBy: { publishTime: 'desc' }
    })

    // 如果有levelType筛选，在应用层处理
    if (levelType) {
      currentAlerts = currentAlerts.filter(alert => {
        if (levelType === 'provincial') {
          return alert.regionCode.length === 5
        } else if (levelType === 'city') {
          return alert.regionCode.length === 7
        }
        return true
      })
    }

    // 获取上一批次的数据用于对比（判断新增）
    const previousAlerts = await db.weatherAlert.findMany({
      where: {
        batchId: {
          not: latestBatch.batchId
        }
      },
      orderBy: { writeTime: 'desc' },
      take: 1000
    })

    // 创建详情链接集合
    const previousLinksSet = new Set()
    previousAlerts.forEach(alert => {
      previousLinksSet.add(alert.detailLink)
    })

    // 标记新增、省级和地市级预警
    const processedAlerts = currentAlerts.map(alert => ({
      ...alert,
      isNew: !previousLinksSet.has(alert.detailLink),
      isProvincial: alert.regionCode.length === 5,
      isCity: alert.regionCode.length === 7
    }))

    // 统计等级数量
    const levelCount: Record<string, number> = {}
    processedAlerts.forEach(item => {
      const levelName = item.levelName
      levelCount[levelName] = (levelCount[levelName] || 0) + 1
    })

    // 统计省级和地市级数量
    const provincialCount = processedAlerts.filter(alert => alert.isProvincial).length
    const cityCount = processedAlerts.filter(alert => alert.isCity).length

    // 检查通知配置状态
    const notificationConfig = await db.notificationConfig.findFirst({
      where: { enabled: true },
      orderBy: { id: 'desc' }
    })

    const notificationEnabled = !!(notificationConfig && notificationConfig.sendKey)

    return NextResponse.json({
      success: true,
      data: processedAlerts,
      stats: {
        total: processedAlerts.length,
        levelCount,
        provincialCount,
        cityCount
      },
      batchInfo: {
        batchId: latestBatch.batchId,
        updateTime: latestBatch.updateTime,
        recordCount: latestBatch.recordCount,
        status: latestBatch.status
      },
      notificationEnabled,
      lastUpdate: latestBatch.updateTime
    })

  } catch (error) {
    console.error('获取预警数据失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}