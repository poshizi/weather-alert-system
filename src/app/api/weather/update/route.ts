import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import SMTPService from '@/lib/smtp'

// 灾害类型映射
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

// 预警等级映射
const levelMap: Record<string, string> = {
  "01": "蓝色", "02": "黄色", "03": "橙色", "04": "红色", "05": "白色"
}

export async function POST() {
  try {
    // 生成新的批次ID
    const batchId = `${new Date().toISOString().slice(0, 19).replace(/[:-]/g, '_')}_${Math.random().toString(36).substr(2, 8)}`
    
    // 获取远程数据
    const url = `https://product.weather.com.cn/alarm/grepalarm_cn.php?_=${Date.now()}`
    
    const response = await fetch(url, {
      headers: {
        "Accept": "*/*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Cookie": "f_city=%E5%8C%97%E4%BA%AC%7C101010100%7C",
        "Host": "product.weather.com.cn",
        "Pragma": "no-cache",
        "Referer": "https://www.weather.com.cn/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0",
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const responseText = await response.text()
    
    // 提取 JSON
    const jsonMatch = responseText.match(/var alarminfo=(\{.*?\});/s)
    if (!jsonMatch) {
      throw new Error('未能解析到有效数据')
    }
    
    const jsonStr = jsonMatch[1]
    const data = JSON.parse(jsonStr)
    
    if (!data || !data.data) {
      throw new Error('数据解析失败')
    }
    
    console.log(`数据解析成功，共 ${data.data.length} 条记录`)
    
    // 开始事务
    const result = await db.$transaction(async (tx) => {
      let insertCount = 0
      
      // 处理每条数据
      for (const item of data.data) {
        const link = item[1]
        const parts = link.split("-")
        
        const regionCode = parts[0]
        const publishRaw = parts[1]
        
        // 解析北京时间，直接存储为本地时间字符串（不转换为UTC）
        const year = publishRaw.slice(0, 4)
        const month = publishRaw.slice(4, 6)
        const day = publishRaw.slice(6, 8)
        const hour = publishRaw.slice(8, 10)
        const minute = publishRaw.slice(10, 12)
        const second = publishRaw.slice(12, 14)
        
        const publishTime = `${year}-${month}-${day} ${hour}:${minute}:${second}`
        
        const typeCode = parts[2].slice(0, 2)
        const typeName = typeMap[typeCode] || "未知"
        
        const levelCode = parts[2].slice(2, 4)
        const levelName = levelMap[levelCode] || "未知"
        
        // 插入新数据
        await tx.weatherAlert.create({
          data: {
            region: item[0],
            regionCode,
            publishTime,
            typeCode,
            typeName,
            levelCode,
            levelName,
            detailLink: link,
            longitude: item[2],
            latitude: item[3],
            batchId,
          }
        })
        
        insertCount++
      }
      
      // 记录批次信息
      await tx.updateLog.create({
        data: {
          batchId,
          recordCount: insertCount,
          status: 'success',
          message: `成功获取 ${insertCount} 条预警记录`
        }
      })
      
      return insertCount
    })
    
    // 清理7天前的数据
    const cleanupTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const deletedCount = await db.weatherAlert.deleteMany({
      where: {
        writeTime: {
          lt: cleanupTime
        }
      }
    })
    
    console.log(`清理了 ${deletedCount.count} 条7天前的数据`)
    
    // 清理旧的更新日志（保留最近30条）
    await db.updateLog.deleteMany({
      where: {
        id: {
          notIn: await db.updateLog.findMany({
            select: { id: true },
            orderBy: { updateTime: 'desc' },
            take: 30
          }).then(logs => logs.map(l => l.id))
        }
      }
    })
    
    // 获取总记录数
    const totalRecords = await db.weatherAlert.count()
    
    // 发送通知（异步）
    sendNotifications(batchId).catch(console.error)
    
    return NextResponse.json({
      success: true,
      batchId,
      insertCount: result,
      totalRecords,
      deletedCount: deletedCount.count,
      message: `数据更新成功，批次ID: ${batchId}`
    })
    
  } catch (error) {
    console.error('更新失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}

async function sendNotifications(batchId: string) {
  try {
    // 获取通知配置
    const configs = await db.notificationConfig.findMany({
      where: { enabled: true },
      include: {
        alertRules: {
          where: { enabled: true }
        }
      }
    })
    
    if (configs.length === 0) {
      console.log('没有启用的通知配置')
      return
    }
    
    // 获取本次批次的预警
    const currentBatchAlerts = await db.weatherAlert.findMany({
      where: { batchId }
    })
    
    if (currentBatchAlerts.length === 0) {
      console.log('本次批次没有预警，不发送通知')
      return
    }
    
    // 获取之前批次的预警（用于判断是否为新增）
    const previousAlerts = await db.weatherAlert.findMany({
      where: {
        batchId: { not: batchId }
      },
      orderBy: { writeTime: 'desc' },
      take: 1000 // 限制数量避免性能问题
    })
    
    // 创建之前批次的detailLink集合
    const previousDetailLinks = new Set(previousAlerts.map(alert => alert.detailLink))
    
    // 筛选出真正新增的预警（detailLink在之前批次中不存在）
    const newAlerts = currentBatchAlerts.filter(alert => !previousDetailLinks.has(alert.detailLink))
    
    if (newAlerts.length === 0) {
      console.log('没有真正新增的预警，不发送通知')
      return
    }
    
    console.log(`本次批次预警总数: ${currentBatchAlerts.length}，真正新增预警: ${newAlerts.length}`)
    
    for (const config of configs) {
      try {
        // 检查筛选条件（只对新增预警进行筛选）
        const filteredAlerts = filterAlerts(newAlerts, config)
        
        if (filteredAlerts.length === 0) {
          console.log('配置ID', config.id, '没有符合条件的新增预警')
          continue
        }
        
        // 发送Server酱通知
        if (config.sendKey) {
          await sendServerChanNotification(config.sendKey, filteredAlerts)
        }
        
        // 发送邮件通知
        if (config.email && config.smtpHost && config.smtpUser && config.smtpPassword) {
          await sendSMTPEmailNotification(config, filteredAlerts)
        }
        
        // 记录通知日志
        await db.notificationLog.create({
          data: {
            configId: config.id,
            message: `发送 ${filteredAlerts.length} 条新增预警通知`,
            status: 'sent'
          }
        })
        
      } catch (error) {
        console.error('通知发送失败:', error)
        await db.notificationLog.create({
          data: {
            configId: config.id,
            message: `通知发送失败: ${error instanceof Error ? error.message : '未知错误'}`,
            status: 'failed'
          }
        })
      }
    }
    
  } catch (error) {
    console.error('通知处理错误:', error)
  }
}

function filterAlerts(alerts: any[], config: any) {
  // 获取该配置的预警规则
  const alertRules = config.alertRules || []
  
  // 如果没有配置规则，使用旧的筛选方式
  if (alertRules.length === 0) {
    return alerts.filter(alert => {
      // 地区筛选
      if (config.regionCodes) {
        const regionCodes = config.regionCodes.split(',')
        if (!regionCodes.includes(alert.regionCode) && 
            !regionCodes.some(code => alert.regionCode.startsWith(code))) {
          return false
        }
      }
      
      // 灾害类型筛选
      if (config.levelTypes) {
        const levelTypes = config.levelTypes.split(',')
        if (!levelTypes.includes(alert.typeName)) {
          return false
        }
      }
      
      // 预警等级筛选
      if (config.alertLevels) {
        const alertLevels = config.alertLevels.split(',')
        if (!alertLevels.includes(alert.levelName)) {
          return false
        }
      }
      
      return true
    })
  }

  // 使用新的预警规则筛选
  return alerts.filter(alert => {
    for (const rule of alertRules) {
      if (!rule.enabled) continue
      
      let matches = true
      
      // 解析规则条件
      let ruleConditions = {}
      try {
        if (rule.conditions) {
          // 处理可能的双重转义问题
          let conditionsStr = rule.conditions
          if (conditionsStr.startsWith('"') && conditionsStr.endsWith('"')) {
            conditionsStr = JSON.parse(conditionsStr)
          }
          ruleConditions = JSON.parse(conditionsStr)
        }
      } catch (e) {
        console.error('解析规则条件失败:', e)
      }
      
      // 获取目标预警等级
      let targetLevels: string[] = []
      if (Array.isArray(ruleConditions.targetLevels)) {
        targetLevels = ruleConditions.targetLevels
      } else if (ruleConditions.targetLevels) {
        targetLevels = ruleConditions.targetLevels.split(',').map((s: string) => s.trim()).filter(Boolean)
      } else if (rule.targetLevel) {
        targetLevels = [rule.targetLevel]
      }
      
      // 获取目标地区代码
      let regionCodes: string[] = []
      if (Array.isArray(ruleConditions.regionCodes)) {
        regionCodes = ruleConditions.regionCodes
      } else if (ruleConditions.regionCodes) {
        regionCodes = ruleConditions.regionCodes.split(',').map((s: string) => s.trim()).filter(Boolean)
      } else if (rule.regionCode) {
        regionCodes = [rule.regionCode]
      }
      
      // 规则类型：地区级别预警
      if (rule.ruleType === 'regional_level') {
        // 检查地区级别
        if (rule.regionLevel) {
          const isProvincial = alert.regionCode.length === 5
          const isCity = alert.regionCode.length === 7
          if (rule.regionLevel === 'provincial' && !isProvincial) matches = false
          if (rule.regionLevel === 'city' && !isCity) matches = false
        }
        
        // 检查预警等级
        if (targetLevels.length > 0 && !targetLevels.includes(alert.levelName)) {
          matches = false
        }
        
        // 检查灾害类型
        if (rule.alertType && alert.typeName !== rule.alertType) {
          matches = false
        }
      }
      
      // 规则类型：等级预警
      else if (rule.ruleType === 'level') {
        if (targetLevels.length > 0 && !targetLevels.includes(alert.levelName)) {
          matches = false
        }
        
        // 检查灾害类型
        if (rule.alertType && alert.typeName !== rule.alertType) {
          matches = false
        }
      }
      
      // 规则类型：地区预警
      else if (rule.ruleType === 'regional') {
        // 检查地区
        if (regionCodes.length > 0) {
          const regionMatches = regionCodes.some(code => 
            alert.regionCode === code || alert.regionCode.startsWith(code)
          )
          if (!regionMatches) matches = false
        }
        
        // 检查预警等级
        if (targetLevels.length > 0 && !targetLevels.includes(alert.levelName)) {
          matches = false
        }
        
        // 检查灾害类型
        if (rule.alertType && alert.typeName !== rule.alertType) {
          matches = false
        }
      }
      
      // 规则类型：升级预警（兼容旧版本）
      else if (rule.ruleType === 'upgrade') {
        if (targetLevels.length > 0 && !targetLevels.includes(alert.levelName)) {
          matches = false
        }
      }
      
      if (matches) {
        console.log(`预警匹配规则 #${rule.id} (${rule.ruleType}): ${alert.region} - ${alert.levelName}${alert.typeName}`)
        return true // 匹配到第一个规则就返回
      }
    }
    
    return false // 没有匹配到任何规则
  })
}

async function sendServerChanNotification(sendkey: string, alerts: any[]) {
  const title = '气象预警通知'
  let content = `发现 ${alerts.length} 条新增预警：\n\n`
  
  // 限制通知内容长度，避免过长导致发送失败
  const maxAlerts = 10 // 最多显示10条预警
  const displayAlerts = alerts.slice(0, maxAlerts)
  
  displayAlerts.forEach(alert => {
    content += `【${alert.levelName}】${alert.typeName}预警\n`
    content += `地区：${alert.region}\n`
    content += `时间：${alert.publishTime}\n`
    content += `详情：https://www.weather.com.cn/alarm/newalarmcontent.shtml?file=${alert.detailLink}\n\n`
  })
  
  if (alerts.length > maxAlerts) {
    content += `\n还有 ${alerts.length - maxAlerts} 条新增预警未显示，请查看系统详情。`
  }
  
  console.log(`准备发送通知，新增预警数量: ${alerts.length}，显示数量: ${displayAlerts.length}`)
  
  // 使用Server酱3 API
  const { sendServerChanNotification } = await import('@/lib/serverchan')
  const result = await sendServerChanNotification(sendkey, title, content, {
    short: `${alerts.length}条新增预警`,
    tp: 'text' // 纯文本推送
  })
  
  if (!result.success) {
    console.error('Server酱通知发送失败:', result.error)
    throw new Error(`Server酱通知发送失败: ${result.error}`)
  }
  
  console.log('Server酱通知发送成功')
}

async function sendSMTPEmailNotification(config: any, alerts: any[]) {
  try {
    // 构建邮件内容
    const title = '气象预警通知'
    
    const emailContent = `
      <h2>${title}</h2>
      <p>发现 ${alerts.length} 条新增预警：</p>
      <table border="1" style="border-collapse: collapse; width: 100%; margin: 20px 0;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            <th style="padding: 10px; border: 1px solid #ddd;">地区</th>
            <th style="padding: 10px; border: 1px solid #ddd;">类型</th>
            <th style="padding: 10px; border: 1px solid #ddd;">等级</th>
            <th style="padding: 10px; border: 1px solid #ddd;">时间</th>
          </tr>
        </thead>
        <tbody>
          ${alerts.map(alert => `
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;">${alert.region}</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${alert.typeName}</td>
              <td style="padding: 10px; border: 1px solid #ddd;">
                <span style="color: ${
                  alert.levelName === '红色' ? '#dc3545' :
                  alert.levelName === '橙色' ? '#fd7e14' :
                  alert.levelName === '黄色' ? '#ffc107' :
                  alert.levelName === '蓝色' ? '#007bff' : '#6c757d'
                }; font-weight: bold;">${alert.levelName}</span>
              </td>
              <td style="padding: 10px; border: 1px solid #ddd;">${alert.publishTime}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <p>详细信息请访问：<a href="https://www.weather.com.cn/" style="color: #007bff;">中国天气网</a></p>
      <hr>
      <p style="color: #666; font-size: 12px;">
        此邮件由气象预警系统自动发送，请勿回复。<br>
        如需取消订阅，请联系系统管理员。
      </p>
    `
    
    // 配置SMTP服务
    const smtpService = SMTPService
    smtpService.configure({
      host: config.smtpHost,
      port: config.smtpPort || (config.smtpSecure ? 465 : 587),
      secure: config.smtpSecure !== undefined ? config.smtpSecure : true,
      user: config.smtpUser,
      password: config.smtpPassword
    })
    
    // 发送邮件
    const result = await smtpService.sendEmail({
      to: config.email,
      subject: `${title} - ${alerts.length}条新增预警`,
      html: emailContent
    })
    
    if (!result.success) {
      throw new Error(result.error || '邮件发送失败')
    }
    
    console.log(`SMTP邮件发送成功: ${config.email}`)
    
  } catch (error) {
    console.error('SMTP邮件通知发送失败:', error)
    throw new Error(`SMTP邮件通知发送失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}