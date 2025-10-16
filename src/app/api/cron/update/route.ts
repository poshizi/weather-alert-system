import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // 调用更新API
    const updateResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/weather/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const updateData = await updateResponse.json()
    
    if (updateData.success) {
      console.log('定时更新成功:', updateData.message)
      return NextResponse.json({
        success: true,
        message: '定时更新执行成功',
        data: updateData
      })
    } else {
      console.error('定时更新失败:', updateData.error)
      return NextResponse.json({
        success: false,
        error: updateData.error || '定时更新失败'
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('定时更新异常:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}

// 支持GET请求用于测试
export async function GET() {
  return NextResponse.json({
    message: '定时任务API已就绪，使用POST请求触发更新'
  })
}