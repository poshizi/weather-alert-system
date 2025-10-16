import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({
        success: false,
        error: '未选择文件'
      }, { status: 400 })
    }

    // 读取Excel文件
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet)

    let imported = 0
    let updated = 0
    let errors = 0

    for (const row of data) {
      try {
        // 验证必要字段
        if (!row['预警代码'] || !row['预警名称']) {
          errors++
          continue
        }

        const alarmCode = String(row['预警代码']).trim()
        const alarmName = String(row['预警名称']).trim()
        const conditions = String(row['预警条件'] || '').trim()
        const suggestions = String(row['防护建议'] || '').trim()
        const enabled = row['启用状态'] === '是' || row['启用状态'] === true

        // 解析类型和等级代码
        let typeCode = ''
        let levelCode = ''
        let typeName = ''
        let levelName = ''

        if (alarmCode.length >= 4) {
          typeCode = alarmCode.substring(0, 2)
          levelCode = alarmCode.substring(2, 4)
          
          // 类型映射
          const typeMap: Record<string, string> = {
            "01": "台风", "02": "暴雨", "03": "暴雪", "04": "寒潮", "05": "大风",
            "06": "沙尘暴", "07": "高温", "08": "干旱", "09": "雷电", "10": "冰雹",
            "11": "霜冻", "12": "大雾", "13": "霾", "14": "道路结冰", "91": "寒冷",
            "92": "灰霾", "93": "雷雨大风", "94": "森林火险", "95": "降温",
            "96": "道路冰雪", "97": "干热风", "98": "空气重污染", "99": "低温",
            "51": "海上大雾", "52": "雷暴大风", "53": "持续低温", "54": "浓浮尘",
            "55": "龙卷风", "56": "低温冻害", "57": "海上大风", "58": "低温雨雪冰冻",
            "59": "强对流", "60": "臭氧", "61": "大雪", "62": "强降雨",
            "63": "强降温", "64": "雪灾", "65": "森林（草原）火险", "66": "雷暴",
            "67": "严寒", "68": "沙尘", "69": "海上雷雨大风", "70": "海上雷电",
            "71": "海上台风", "72": "低温"
          }

          const levelMap: Record<string, string> = {
            "01": "蓝色", "02": "黄色", "03": "橙色", "04": "红色", "05": "白色"
          }

          typeName = typeMap[typeCode] || '未知'
          levelName = levelMap[levelCode] || '未知'
        }

        // 检查是否已存在
        const existing = await db.alarmInfo.findUnique({
          where: { alarmCode }
        })

        if (existing) {
          // 更新现有记录
          await db.alarmInfo.update({
            where: { alarmCode },
            data: {
              alarmName,
              conditions,
              suggestions,
              typeCode,
              levelCode,
              typeName,
              levelName,
              enabled,
              updatedAt: new Date()
            }
          })
          updated++
        } else {
          // 创建新记录
          await db.alarmInfo.create({
            data: {
              alarmCode,
              alarmName,
              conditions,
              suggestions,
              typeCode,
              levelCode,
              typeName,
              levelName,
              enabled
            }
          })
          imported++
        }
      } catch (error) {
        console.error('处理行数据失败:', error)
        errors++
      }
    }

    return NextResponse.json({
      success: true,
      message: `导入完成：新增 ${imported} 条，更新 ${updated} 条，失败 ${errors} 条`,
      imported,
      updated,
      errors
    })

  } catch (error) {
    console.error('导入失败:', error)
    return NextResponse.json({
      success: false,
      error: '导入失败：' + (error instanceof Error ? error.message : '未知错误')
    }, { status: 500 })
  }
}