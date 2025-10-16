import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as XLSX from 'xlsx'

export async function GET() {
  try {
    // 获取所有预警信息
    const alarmInfos = await db.alarmInfo.findMany({
      orderBy: [
        { typeCode: 'asc' },
        { levelCode: 'asc' }
      ]
    })

    // 转换为Excel格式
    const exportData = alarmInfos.map(alarm => ({
      '预警代码': alarm.alarmCode,
      '预警名称': alarm.alarmName,
      '灾害类型': alarm.typeName,
      '预警等级': alarm.levelName,
      '预警条件': alarm.conditions || '',
      '防护建议': alarm.suggestions || '',
      '启用状态': alarm.enabled ? '是' : '否',
      '创建时间': alarm.createdAt.toLocaleString('zh-CN'),
      '更新时间': alarm.updatedAt.toLocaleString('zh-CN')
    }))

    // 创建工作簿
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(exportData)
    
    // 设置列宽
    const colWidths = [
      { wch: 10 }, // 预警代码
      { wch: 20 }, // 预警名称
      { wch: 10 }, // 灾害类型
      { wch: 10 }, // 预警等级
      { wch: 40 }, // 预警条件
      { wch: 50 }, // 防护建议
      { wch: 10 }, // 启用状态
      { wch: 20 }, // 创建时间
      { wch: 20 }  // 更新时间
    ]
    worksheet['!cols'] = colWidths

    XLSX.utils.book_append_sheet(workbook, worksheet, '预警信息')

    // 生成Excel文件
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })

    // 生成文件名
    const fileName = `预警信息_${new Date().toISOString().split('T')[0]}.xlsx`

    // 返回文件
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`
      }
    })

  } catch (error) {
    console.error('导出失败:', error)
    return NextResponse.json({
      success: false,
      error: '导出失败'
    }, { status: 500 })
  }
}