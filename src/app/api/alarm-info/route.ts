import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const level = searchParams.get('level')
    const enabled = searchParams.get('enabled')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // 构建查询条件
    const where: any = {}
    
    if (type) {
      where.typeCode = type
    }
    
    if (level) {
      where.levelCode = level
    }
    
    if (enabled !== null && enabled !== undefined) {
      where.enabled = enabled === 'true'
    }

    // 获取总数
    const total = await db.alarmInfo.count({ where })

    // 获取分页数据
    const alarmInfos = await db.alarmInfo.findMany({
      where,
      orderBy: [
        { typeCode: 'asc' },
        { levelCode: 'asc' }
      ],
      skip: (page - 1) * limit,
      take: limit
    })

    // 获取统计信息
    const stats = await db.alarmInfo.groupBy({
      by: ['typeName', 'levelName'],
      _count: true
    })

    return NextResponse.json({
      success: true,
      data: alarmInfos,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats
    })

  } catch (error) {
    console.error('获取预警信息失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({
        success: false,
        error: '缺少预警信息ID'
      }, { status: 400 })
    }

    const alarmInfo = await db.alarmInfo.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: alarmInfo,
      message: '预警信息更新成功'
    })

  } catch (error) {
    console.error('更新预警信息失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}