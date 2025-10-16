import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// 获取通知配置
export async function GET() {
  try {
    const configs = await db.notificationConfig.findMany({
      orderBy: { id: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: configs
    })
  } catch (error) {
    console.error('获取通知配置失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}

// 创建或更新通知配置
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      sendKey, 
      email, 
      smtpHost,
      smtpPort,
      smtpSecure,
      smtpUser,
      smtpPassword,
      regionCodes, 
      levelTypes, 
      alertLevels, 
      enabled 
    } = body

    // 验证必填字段
    if (!sendKey && !email) {
      return NextResponse.json({
        success: false,
        error: '至少需要配置Server酱密钥或邮箱地址'
      }, { status: 400 })
    }

    // 如果配置了SMTP，验证必填字段
    if (smtpHost && (!smtpUser || !smtpPassword)) {
      return NextResponse.json({
        success: false,
        error: 'SMTP配置需要用户名和密码'
      }, { status: 400 })
    }

    // 创建新配置
    const config = await db.notificationConfig.create({
      data: {
        sendKey: sendKey || '',
        email: email || '',
        smtpHost: smtpHost || null,
        smtpPort: smtpPort ? (typeof smtpPort === 'string' ? parseInt(smtpPort) : smtpPort) : null,
        smtpSecure: smtpSecure !== undefined ? smtpSecure : true,
        smtpUser: smtpUser || null,
        smtpPassword: smtpPassword || null,
        regionCodes: regionCodes || '',
        levelTypes: levelTypes || '',
        alertLevels: alertLevels || '',
        enabled: enabled !== undefined ? enabled : true
      }
    })

    return NextResponse.json({
      success: true,
      data: config,
      message: '通知配置创建成功'
    })
  } catch (error) {
    console.error('创建通知配置失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}

// 更新通知配置
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      id, 
      sendKey, 
      email, 
      smtpHost,
      smtpPort,
      smtpSecure,
      smtpUser,
      smtpPassword,
      regionCodes, 
      levelTypes, 
      alertLevels, 
      enabled 
    } = body

    if (!id) {
      return NextResponse.json({
        success: false,
        error: '配置ID不能为空'
      }, { status: 400 })
    }

    // 验证必填字段
    if (!sendKey && !email) {
      return NextResponse.json({
        success: false,
        error: '至少需要配置Server酱密钥或邮箱地址'
      }, { status: 400 })
    }

    // 如果配置了SMTP，验证必填字段
    if (smtpHost && (!smtpUser || !smtpPassword)) {
      return NextResponse.json({
        success: false,
        error: 'SMTP配置需要用户名和密码'
      }, { status: 400 })
    }

    const config = await db.notificationConfig.update({
      where: { id },
      data: {
        sendKey: sendKey || '',
        email: email || '',
        smtpHost: smtpHost || null,
        smtpPort: smtpPort ? (typeof smtpPort === 'string' ? parseInt(smtpPort) : smtpPort) : null,
        smtpSecure: smtpSecure !== undefined ? smtpSecure : true,
        smtpUser: smtpUser || null,
        smtpPassword: smtpPassword || null,
        regionCodes: regionCodes || '',
        levelTypes: levelTypes || '',
        alertLevels: alertLevels || '',
        enabled: enabled !== undefined ? enabled : true
      }
    })

    return NextResponse.json({
      success: true,
      data: config,
      message: '通知配置更新成功'
    })
  } catch (error) {
    console.error('更新通知配置失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}

// 删除通知配置
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({
        success: false,
        error: '配置ID不能为空'
      }, { status: 400 })
    }

    await db.notificationConfig.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({
      success: true,
      message: '通知配置删除成功'
    })
  } catch (error) {
    console.error('删除通知配置失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}