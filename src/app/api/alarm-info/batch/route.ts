import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { updates } = body

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({
        success: false,
        error: '请提供有效的更新数据'
      }, { status: 400 })
    }

    const results = []
    
    for (const update of updates) {
      const { id, ...data } = update
      
      if (!id) {
        results.push({ id, success: false, error: '缺少ID' })
        continue
      }

      try {
        const result = await db.alarmInfo.update({
          where: { id },
          data: {
            ...data,
            updatedAt: new Date()
          }
        })
        
        results.push({ id, success: true, data: result })
      } catch (error) {
        results.push({ 
          id, 
          success: false, 
          error: error instanceof Error ? error.message : '更新失败' 
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    return NextResponse.json({
      success: true,
      message: `批量更新完成: 成功 ${successCount} 条, 失败 ${failCount} 条`,
      results,
      stats: {
        total: results.length,
        success: successCount,
        failed: failCount
      }
    })

  } catch (error) {
    console.error('批量更新预警信息失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}