import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// 获取预警规则
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const configId = searchParams.get('configId')

    let rules
    if (configId) {
      rules = await db.alertRule.findMany({
        where: { configId: parseInt(configId) },
        orderBy: { id: 'desc' }
      })
    } else {
      rules = await db.alertRule.findMany({
        include: {
          config: {
            select: {
              id: true,
              sendKey: true,
              email: true
            }
          }
        },
        orderBy: { id: 'desc' }
      })
    }

    return NextResponse.json({
      success: true,
      data: rules
    })
  } catch (error) {
    console.error('获取预警规则失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}

// 创建预警规则
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      configId,
      ruleType,
      targetLevel,
      alertType,
      regionCode,
      regionLevel,
      conditions,
      enabled 
    } = body

    // 验证必填字段
    if (!configId || !ruleType) {
      return NextResponse.json({
        success: false,
        error: '配置ID和规则类型不能为空'
      }, { status: 400 })
    }

    // 验证规则类型
    const validRuleTypes = ['regional_level', 'level', 'regional']
    if (!validRuleTypes.includes(ruleType)) {
      return NextResponse.json({
        success: false,
        error: '无效的规则类型'
      }, { status: 400 })
    }

    // 解析conditions字段以获取多选数据
    let parsedConditions = {}
    if (conditions) {
      try {
        parsedConditions = JSON.parse(conditions)
      } catch (e) {
        console.error('Failed to parse conditions:', e)
      }
    }

    // 验证规则类型特定字段
    if (ruleType === 'regional_level' && !regionLevel) {
      return NextResponse.json({
        success: false,
        error: '地区级别规则必须选择地区级别'
      }, { status: 400 })
    }

    if (ruleType === 'regional' && !regionCode && (!parsedConditions.regionCodes || parsedConditions.regionCodes.length === 0)) {
      return NextResponse.json({
        success: false,
        error: '地区预警规则必须选择至少一个地区'
      }, { status: 400 })
    }

    if (ruleType === 'level' && !targetLevel && (!parsedConditions.targetLevels || parsedConditions.targetLevels.length === 0)) {
      return NextResponse.json({
        success: false,
        error: '等级预警规则必须选择至少一个预警等级'
      }, { status: 400 })
    }

    // 验证配置是否存在
    const config = await db.notificationConfig.findUnique({
      where: { id: configId }
    })

    if (!config) {
      return NextResponse.json({
        success: false,
        error: '通知配置不存在'
      }, { status: 404 })
    }

    const rule = await db.alertRule.create({
      data: {
        configId,
        ruleType,
        targetLevel: targetLevel || null,
        alertType: alertType || null,
        regionCode: regionCode || null,
        regionLevel: regionLevel || null,
        conditions: conditions ? JSON.stringify(conditions) : null,
        enabled: enabled !== undefined ? enabled : true
      }
    })

    return NextResponse.json({
      success: true,
      data: rule,
      message: '预警规则创建成功'
    })
  } catch (error) {
    console.error('创建预警规则失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}

// 更新预警规则
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      id,
      ruleType,
      targetLevel,
      alertType,
      regionCode,
      regionLevel,
      conditions,
      enabled 
    } = body

    if (!id) {
      return NextResponse.json({
        success: false,
        error: '规则ID不能为空'
      }, { status: 400 })
    }

    // 验证规则类型
    if (ruleType) {
      const validRuleTypes = ['regional_level', 'level', 'regional']
      if (!validRuleTypes.includes(ruleType)) {
        return NextResponse.json({
          success: false,
          error: '无效的规则类型'
        }, { status: 400 })
      }
    }

    const rule = await db.alertRule.update({
      where: { id },
      data: {
        ruleType: ruleType || undefined,
        targetLevel: targetLevel || undefined,
        alertType: alertType || undefined,
        regionCode: regionCode || undefined,
        regionLevel: regionLevel || undefined,
        conditions: conditions ? JSON.stringify(conditions) : undefined,
        enabled: enabled !== undefined ? enabled : undefined
      }
    })

    return NextResponse.json({
      success: true,
      data: rule,
      message: '预警规则更新成功'
    })
  } catch (error) {
    console.error('更新预警规则失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}

// 删除预警规则
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({
        success: false,
        error: '规则ID不能为空'
      }, { status: 400 })
    }

    await db.alertRule.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({
      success: true,
      message: '预警规则删除成功'
    })
  } catch (error) {
    console.error('删除预警规则失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}