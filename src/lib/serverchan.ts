// Server酱通知服务（兼容Server酱3和原版）
interface ServerChanResponse {
  code: number
  message: string
  data?: any
}

interface ServerChanResult {
  success: boolean
  error?: string
  data?: any
}

// 尝试使用Server酱3，失败时回退到原版
export async function sendServerChanNotification(
  sendKey: string,
  title: string,
  content: string,
  options?: {
    short?: string
    tp?: string
    channel?: string
    openid?: string
  }
): Promise<ServerChanResult> {
  try {
    if (!sendKey) {
      return {
        success: false,
        error: 'Server酱密钥不能为空'
      }
    }

    // 首先尝试Server酱3 API
    try {
      const url = 'https://api.sc3.ft07.com/send/push'
      
      const payload: any = {
        title,
        content,
        ...options
      }

      // 如果没有设置短内容，使用标题的简化版本
      if (!payload.short && title) {
        payload.short = title.length > 20 ? title.substring(0, 17) + '...' : title
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sendKey}`
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const result = await response.json()
        if (result.code === 0) {
          console.log('Server酱3通知发送成功')
          return {
            success: true,
            data: result.data
          }
        }
      }
    } catch (sc3Error) {
      console.log('Server酱3 API不可用，尝试原版API')
    }

    // 回退到原版Server酱 API
    const url = `https://sctapi.ftqq.com/${sendKey}.send`
    
    const formData = new URLSearchParams()
    formData.append('title', title)
    formData.append('desp', content)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    })

    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status} ${response.statusText}`)
    }

    const result: ServerChanResponse = await response.json()
    
    if (result.code === 0) {
      console.log('Server酱原版通知发送成功')
      return {
        success: true
      }
    } else {
      return {
        success: false,
        error: result.message || `Server酱错误: ${result.code}`
      }
    }
  } catch (error) {
    console.error('Server酱发送失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}

// 兼容旧版本函数
export async function sendServerChan3Notification(
  sendKey: string,
  title: string,
  content: string,
  options?: {
    short?: string
    tp?: string
    channel?: string
    openid?: string
  }
): Promise<ServerChanResult> {
  return sendServerChanNotification(sendKey, title, content, options)
}