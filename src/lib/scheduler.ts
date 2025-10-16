// 定时任务调度器
export class WeatherUpdateScheduler {
  private intervalId: NodeJS.Timeout | null = null
  private isRunning: boolean = false
  private readonly UPDATE_INTERVAL = 10 * 60 * 1000 // 10分钟

  constructor() {
    this.start()
  }

  start() {
    if (this.isRunning) {
      console.log('Weather update scheduler is already running')
      return
    }

    console.log('Starting weather update scheduler (10-minute intervals)')
    
    // 立即执行一次更新
    this.scheduleUpdate()
    
    // 设置定时任务
    this.intervalId = setInterval(() => {
      this.scheduleUpdate()
    }, this.UPDATE_INTERVAL)
    
    this.isRunning = true
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
    console.log('Weather update scheduler stopped')
  }

  private async scheduleUpdate() {
    try {
      console.log(`[${new Date().toISOString()}] Scheduling weather update...`)
      
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      const response = await fetch(`${baseUrl}/api/weather/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        console.log(`[${new Date().toISOString()}] Weather update completed successfully:`, data.message)
      } else {
        console.error(`[${new Date().toISOString()}] Weather update failed:`, data.error)
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Weather update error:`, error)
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      interval: this.UPDATE_INTERVAL,
      nextUpdate: this.isRunning ? new Date(Date.now() + this.UPDATE_INTERVAL) : null
    }
  }
}

// 全局调度器实例
let weatherScheduler: WeatherUpdateScheduler | null = null

export function getWeatherScheduler(): WeatherUpdateScheduler {
  if (!weatherScheduler) {
    weatherScheduler = new WeatherUpdateScheduler()
  }
  return weatherScheduler
}

export function stopWeatherScheduler() {
  if (weatherScheduler) {
    weatherScheduler.stop()
    weatherScheduler = null
  }
}