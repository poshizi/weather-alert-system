import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET() {
  try {
    // 创建模板数据
    const templateData = [
      {
        '预警代码': '0101',
        '预警名称': '台风蓝色预警',
        '预警条件': '24小时内可能受热带气旋影响,平均风力达6级以上',
        '防护建议': '1. 停止露天活动和高空作业\n2. 加固门窗、围板、棚架等\n3. 切断危险电源，妥善安置室外物品',
        '启用状态': '是'
      },
      {
        '预警代码': '0201',
        '预警名称': '暴雨蓝色预警',
        '预警条件': '12小时内降雨量将达50毫米以上',
        '防护建议': '1. 切断低洼地带有危险的室外电源\n2. 停止在空旷地方的户外作业\n3. 转移危险地带人员和危房居民到安全场所',
        '启用状态': '是'
      },
      {
        '预警代码': '0301',
        '预警名称': '暴雪蓝色预警',
        '预警条件': '12小时内降雪量将达4毫米以上',
        '防护建议': '1. 交通、公安等部门做好道路清扫和积雪融化工作\n2. 行人注意防寒防滑，驾驶人员小心驾驶\n3. 农牧区和种养殖业要备足饲料，做好防雪灾准备',
        '启用状态': '是'
      }
    ]

    // 创建工作簿
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(templateData)
    
    // 设置列宽
    const colWidths = [
      { wch: 10 }, // 预警代码
      { wch: 20 }, // 预警名称
      { wch: 40 }, // 预警条件
      { wch: 50 }, // 防护建议
      { wch: 10 }  // 启用状态
    ]
    worksheet['!cols'] = colWidths

    XLSX.utils.book_append_sheet(workbook, worksheet, '预警信息模板')

    // 生成Excel文件
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })

    // 返回文件
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="预警信息导入模板.xlsx"'
      }
    })

  } catch (error) {
    console.error('生成模板失败:', error)
    return NextResponse.json({
      success: false,
      error: '生成模板失败'
    }, { status: 500 })
  }
}