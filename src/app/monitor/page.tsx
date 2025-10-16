'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Activity, 
  Database, 
  Bell, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Users,
  Mail
} from 'lucide-react'
import { toast } from 'sonner'

interface UpdateLog {
  id: number
  batchId: string
  updateTime: string
  recordCount: number
  status: string
  message: string
}

interface NotificationConfig {
  id: number
  sendkey: string
  email: string
  enabled: boolean
  createdAt: string
}

interface NotificationLog {
  id: number
  message: string
  sentAt: string
  status: string
}

interface Alert {
  id: number
  region: string
  typeName: string
  levelName: string
  publishTime: string
  writeTime: string
}

interface MonitorData {
  success: boolean
  data: {
    updateLogs: UpdateLog[]
    stats: {
      totalAlerts: number
      todayAlerts: number
      enabledConfigs: number
      totalConfigs: number
    }
    latestBatch: UpdateLog | null
    notificationConfigs: NotificationConfig[]
    notificationLogs: NotificationLog[]
    recentAlerts: Alert[]
  }
}

export default function MonitorPage() {
  const [monitorData, setMonitorData] = useState<MonitorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchMonitorData = async () => {
    try {
      const response = await fetch('/api/monitor')
      const data = await response.json()
      
      if (data.success) {
        setMonitorData(data)
      } else {
        toast.error(data.error || '获取监控数据失败')
      }
    } catch (error) {
      console.error('获取监控数据失败:', error)
      toast.error('获取监控数据失败')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const refreshData = () => {
    setRefreshing(true)
    fetchMonitorData()
  }

  useEffect(() => {
    fetchMonitorData()
    
    // 每30秒自动刷新
    const interval = setInterval(fetchMonitorData, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>加载中...</p>
        </div>
      </div>
    )
  }

  if (!monitorData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">加载失败</h3>
            <Button onClick={refreshData}>重试</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { data } = monitorData

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8" />
              <h1 className="text-2xl md:text-3xl font-bold">系统监控</h1>
            </div>
            <Button 
              variant="secondary" 
              onClick={refreshData}
              disabled={refreshing}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              {refreshing ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
              刷新数据
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">总预警数</p>
                  <p className="text-2xl font-bold text-gray-900">{data.stats.totalAlerts}</p>
                </div>
                <Database className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">今日新增</p>
                  <p className="text-2xl font-bold text-green-600">{data.stats.todayAlerts}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">通知配置</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {data.stats.enabledConfigs}/{data.stats.totalConfigs}
                  </p>
                </div>
                <Bell className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">系统状态</p>
                  <p className="text-lg font-bold">
                    {data.latestBatch?.status === 'success' ? (
                      <Badge className="bg-green-100 text-green-800">正常</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800">异常</Badge>
                    )}
                  </p>
                </div>
                {data.latestBatch?.status === 'success' ? (
                  <CheckCircle className="h-8 w-8 text-green-500" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-500" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="updates" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="updates">更新日志</TabsTrigger>
            <TabsTrigger value="notifications">通知状态</TabsTrigger>
            <TabsTrigger value="configs">配置管理</TabsTrigger>
            <TabsTrigger value="recent">最近预警</TabsTrigger>
          </TabsList>

          <TabsContent value="updates">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  更新日志
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {data.updateLogs.map((log) => (
                      <div key={log.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {log.status === 'success' ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="font-medium">批次: {log.batchId}</span>
                            <Badge className={
                              log.status === 'success' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }>
                              {log.status === 'success' ? '成功' : '失败'}
                            </Badge>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(log.updateTime).toLocaleString('zh-CN')}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>记录数: {log.recordCount}</p>
                          {log.message && <p>消息: {log.message}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    通知日志
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {data.notificationLogs.map((log) => (
                        <div key={log.id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <Badge className={
                              log.status === 'sent' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }>
                              {log.status === 'sent' ? '已发送' : '发送失败'}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(log.sentAt).toLocaleString('zh-CN')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{log.message}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    通知配置状态
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.notificationConfigs.map((config) => (
                      <div key={config.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">配置 #{config.id}</span>
                          <Badge className={
                            config.enabled 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }>
                            {config.enabled ? '已启用' : '已禁用'}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-2">
                            <span>Server酱:</span>
                            {config.sendkey ? (
                              <Badge variant="outline" className="text-green-600">已配置</Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-400">未配置</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span>邮箱:</span>
                            {config.email ? (
                              <Badge variant="outline" className="text-green-600">已配置</Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-400">未配置</Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            创建时间: {new Date(config.createdAt).toLocaleString('zh-CN')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="configs">
            <Card>
              <CardHeader>
                <CardTitle>通知配置概览</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{data.stats.totalConfigs}</div>
                      <div className="text-sm text-gray-600">总配置数</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{data.stats.enabledConfigs}</div>
                      <div className="text-sm text-gray-600">已启用</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-gray-600">{data.stats.totalConfigs - data.stats.enabledConfigs}</div>
                      <div className="text-sm text-gray-600">已禁用</div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <Button asChild>
                      <a href="/config">管理通知配置</a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recent">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  最近预警
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {data.recentAlerts.map((alert) => (
                      <div key={alert.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{alert.region}</span>
                            <Badge className={
                              alert.levelName === '红色' ? 'bg-red-500' :
                              alert.levelName === '橙色' ? 'bg-orange-500' :
                              alert.levelName === '黄色' ? 'bg-yellow-500' :
                              alert.levelName === '蓝色' ? 'bg-blue-500' :
                              'bg-gray-500'
                            }>
                              {alert.levelName}
                            </Badge>
                          </div>
                          <span className="text-sm text-gray-500">
                            {alert.publishTime}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>类型: {alert.typeName}</p>
                          <p>写入时间: {new Date(alert.writeTime).toLocaleString('zh-CN')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}