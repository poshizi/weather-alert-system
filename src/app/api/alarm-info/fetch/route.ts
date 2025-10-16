import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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
    console.log('开始获取预警详细信息')
    
    let successCount = 0
    let failCount = 0
    const errors: string[] = []
    
    // 遍历所有类型和等级的组合
    for (const [typeCode, typeName] of Object.entries(typeMap)) {
      for (const [levelCode, levelName] of Object.entries(levelMap)) {
        const alarmCode = `${typeCode}${levelCode}`
        
        try {
          // 获取预警详细信息
          const url = `https://www.weather.com.cn/data/alarminfo/${alarmCode}.html?_=${Date.now()}`
          
          const response = await fetch(url, {
            headers: {
              "Accept": "*/*",
              "Accept-Encoding": "gzip, deflate, br",
              "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
              "Cache-Control": "no-cache",
              "Connection": "keep-alive",
              "Host": "www.weather.com.cn",
              "Pragma": "no-cache",
              "Referer": "https://www.weather.com.cn/",
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0",
            }
          })
          
          if (!response.ok) {
            console.warn(`获取预警 ${alarmCode} 信息失败: HTTP ${response.status}`)
            failCount++
            continue
          }
          
          const responseText = await response.text()
          
          // 解析JavaScript变量
          const match = responseText.match(/var alarmfyzn=(\[.*?\]);/)
          if (!match) {
            console.warn(`解析预警 ${alarmCode} 信息失败: 数据格式不正确`)
            failCount++
            continue
          }
          
          try {
            // 使用eval来解析JavaScript数组（这是服务器端，安全可控）
            const data = eval(match[1])
            
            if (Array.isArray(data) && data.length >= 4) {
              const [code, name, conditions, suggestions] = data
              
              // 验证代码是否匹配
              if (code !== alarmCode) {
                console.warn(`预警 ${alarmCode} 代码不匹配: 期望 ${alarmCode}, 实际 ${code}`)
                failCount++
                continue
              }
              
              // 使用upsert来创建或更新记录
              await db.alarmInfo.upsert({
                where: { alarmCode },
                update: {
                  alarmName: name,
                  conditions,
                  suggestions,
                  typeCode,
                  levelCode,
                  typeName,
                  levelName,
                  updatedAt: new Date()
                },
                create: {
                  alarmCode,
                  alarmName: name,
                  conditions,
                  suggestions,
                  typeCode,
                  levelCode,
                  typeName,
                  levelName
                }
              })
              
              console.log(`成功获取预警 ${alarmCode} (${typeName}${levelName}) 信息`)
              successCount++
              
              // 添加延迟避免请求过于频繁
              await new Promise(resolve => setTimeout(resolve, 100))
              
            } else {
              console.warn(`预警 ${alarmCode} 数据格式不正确`)
              failCount++
            }
            
          } catch (parseError) {
            console.error(`解析预警 ${alarmCode} JSON数据失败:`, parseError)
            failCount++
          }
          
        } catch (error) {
          console.error(`获取预警 ${alarmCode} 信息时出错:`, error)
          errors.push(`${alarmCode}: ${error instanceof Error ? error.message : '未知错误'}`)
          failCount++
        }
      }
    }
    
    console.log(`预警信息获取完成: 成功 ${successCount} 条, 失败 ${failCount} 条`)
    
    return NextResponse.json({
      success: true,
      message: `预警信息获取完成`,
      stats: {
        total: successCount + failCount,
        success: successCount,
        failed: failCount
      },
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined // 只返回前10个错误
    })
    
  } catch (error) {
    console.error('获取预警信息失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}