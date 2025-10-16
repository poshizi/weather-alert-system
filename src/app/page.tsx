'use client'

import { useState, useEffect } from 'react'
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertCircle, RefreshCw, Bell, BellOff, MapPin, Clock, TrendingUp } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { FormattedDate } from '@/components/ui/formatted-date'

interface WeatherAlert {
  id: number
  region: string
  regionCode: string
  publishTime: string
  typeName: string
  levelName: string
  detailLink: string
  longitude?: string
  latitude?: string
  batchId: string
  writeTime: string
  isNew: boolean
  isProvincial: boolean
  isCity: boolean
}

interface AlertStats {
  total: number
  levelCount: Record<string, number>
  provincialCount: number
  cityCount: number
}

interface BatchInfo {
  batchId: string
  updateTime: string
  recordCount: number
  status: string
}

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

const regionCodeMap: Record<string, string> = {
  "10101": "北京", "10102": "上海", "10103": "天津", "10104": "重庆",
  "10105": "黑龙江", "10106": "吉林", "10107": "辽宁", "10108": "内蒙古",
  "10109": "河北", "10110": "山西", "10111": "陕西", "10112": "山东",
  "10113": "新疆", "10114": "西藏", "10115": "青海", "10116": "甘肃",
  "10117": "宁夏", "10118": "河南", "10119": "江苏", "10120": "湖北",
  "10121": "浙江", "10122": "安徽", "10123": "福建", "10124": "江西",
  "10125": "湖南", "10126": "贵州", "10127": "四川", "10128": "广东",
  "10129": "云南", "10130": "广西", "10131": "海南", "10132": "香港",
  "10133": "澳门", "10134": "台湾"
}

export default function WeatherAlertsPage() {
  const [alerts, setAlerts] = useState<WeatherAlert[]>([])
  const [filteredAlerts, setFilteredAlerts] = useState<WeatherAlert[]>([])
  const [stats, setStats] = useState<AlertStats | null>(null)
  const [batchInfo, setBatchInfo] = useState<BatchInfo | null>(null)
  const [notificationEnabled, setNotificationEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [selectedLevel, setSelectedLevel] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [selectedLevelType, setSelectedLevelType] = useState('all')
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  const fetchAlerts = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedType && selectedType !== 'all') params.append('type', selectedType)
      if (selectedLevel && selectedLevel !== 'all') params.append('level', selectedLevel)
      if (selectedRegion && selectedRegion !== 'all') params.append('region', selectedRegion)
      if (selectedLevelType && selectedLevelType !== 'all') params.append('level_type', selectedLevelType)

      const response = await fetch(`/api/weather/alerts?${params}`)
      const data = await response.json()

      if (data.success) {
        setAlerts(data.data)
        setFilteredAlerts(data.data)
        setStats(data.stats)
        setBatchInfo(data.batchInfo)
        setNotificationEnabled(data.notificationEnabled)
      } else {
        toast({
          title: "获取数据失败",
          description: data.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "网络错误",
        description: "无法获取预警数据",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const updateData = async () => {
    setUpdating(true)
    try {
      const response = await fetch('/api/weather/update', { method: 'POST' })
      const data = await response.json()

      if (data.success) {
        toast({
          title: "更新成功",
          description: `新增 ${data.insertCount} 条预警记录`
        })
        await fetchAlerts()
      } else {
        toast({
          title: "更新失败",
          description: data.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "更新失败",
        description: "网络错误",
        variant: "destructive"
      })
    } finally {
      setUpdating(false)
    }
  }

  const toggleRowExpansion = (id: number) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      '蓝色': 'bg-blue-500',
      '黄色': 'bg-yellow-500',
      '橙色': 'bg-orange-500',
      '红色': 'bg-red-500',
      '白色': 'bg-gray-100 text-gray-800 border'
    }
    return colors[level] || 'bg-gray-500'
  }

  
  const clearFilters = () => {
    setSelectedLevel('all')
    setSelectedType('all')
    setSelectedRegion('all')
    setSelectedLevelType('all')
  }

  useEffect(() => {
    setMounted(true)
    fetchAlerts()
  }, [selectedLevel, selectedType, selectedRegion, selectedLevelType])

  // 独立的自动刷新逻辑，不依赖筛选条件变化
  useEffect(() => {
    const interval = setInterval(fetchAlerts, 60000) // 每分钟刷新
    return () => clearInterval(interval)
  }, [])

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">全国气象预警信息</h1>
              <div className="flex items-center gap-4 text-sm opacity-90">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>最后更新: {batchInfo ? <FormattedDate dateString={batchInfo.updateTime} /> : '未知'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  <span>最新批次: {stats?.total || 0} 条</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>省级: {stats?.provincialCount || 0} | 地市级: {stats?.cityCount || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  {notificationEnabled ? (
                    <><Bell className="h-4 w-4" />通知已启用</>
                  ) : (
                    <><BellOff className="h-4 w-4" />通知未配置</>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={updateData} 
                disabled={updating}
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                {updating ? (
                  <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />更新中...</>
                ) : (
                  <><RefreshCw className="h-4 w-4 mr-2" />立即更新</>
                )}
              </Button>
              <Button 
                href="/alarm-info"
                className="bg-white text-blue-600 hover:bg-gray-100"
                asChild
              >
                <a href="/alarm-info">预警信息管理</a>
              </Button>
            </div>
          </div>
        </div>

        {alerts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">暂无预警数据</h3>
              <p className="text-gray-600 mb-4">请先运行更新脚本获取最新数据</p>
              <Button onClick={updateData} disabled={updating}>
                {updating ? '更新中...' : '获取数据'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* 统计卡片 */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
              <Card 
                className={`cursor-pointer transition-all ${selectedLevel === 'all' ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => setSelectedLevel('all')}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats?.total || 0}</div>
                  <div className="text-sm text-gray-600">全部</div>
                </CardContent>
              </Card>
              {Object.entries(stats?.levelCount || {}).map(([level, count]) => (
                <Card 
                  key={level}
                  className={`cursor-pointer transition-all ${selectedLevel === level ? 'ring-2 ring-blue-500' : ''}`}
                  onClick={() => setSelectedLevel(selectedLevel === level ? 'all' : level)}
                >
                  <CardContent className="p-4 text-center">
                    <div className={`text-2xl font-bold ${getLevelColor(level).includes('text') ? '' : 'text-white'} ${getLevelColor(level)} rounded px-2 py-1 mb-1`}>
                      {count}
                    </div>
                    <div className="text-sm text-gray-600">{level}预警</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 筛选器 */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>筛选条件</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">灾害类型</label>
                    <Select value={selectedType} onValueChange={setSelectedType}>
                      <SelectTrigger>
                        <SelectValue placeholder="全部类型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部</SelectItem>
                        {Object.values(typeMap).map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">预警等级</label>
                    <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                      <SelectTrigger>
                        <SelectValue placeholder="全部等级" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部</SelectItem>
                        {Object.values(levelMap).map(level => (
                          <SelectItem key={level} value={level}>{level}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">预警地区</label>
                    <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                      <SelectTrigger>
                        <SelectValue placeholder="全部地区" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部</SelectItem>
                        {Object.entries(regionCodeMap).map(([code, name]) => (
                          <SelectItem key={code} value={code}>{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">预警级别</label>
                    <Select value={selectedLevelType} onValueChange={setSelectedLevelType}>
                      <SelectTrigger>
                        <SelectValue placeholder="全部级别" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部</SelectItem>
                        <SelectItem value="provincial">省级</SelectItem>
                        <SelectItem value="city">地市级</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    当前筛选条件: <span className="font-medium">{filteredAlerts.length} 条预警</span>
                  </div>
                  <Button variant="outline" onClick={clearFilters}>
                    清除筛选
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 预警列表 */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>地区</TableHead>
                        <TableHead className="hidden md:table-cell">发布时间</TableHead>
                        <TableHead>灾害类型</TableHead>
                        <TableHead>预警等级</TableHead>
                        <TableHead>详情</TableHead>
                        <TableHead>状态</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAlerts.map((alert) => (
                        <React.Fragment key={alert.id}>
                          <TableRow 
                            className={`cursor-pointer transition-colors ${
                              alert.isProvincial ? 'bg-yellow-50 hover:bg-yellow-100' : 
                              alert.isCity ? 'bg-blue-50 hover:bg-blue-100' : 
                              'hover:bg-gray-50'
                            }`}
                            onClick={() => toggleRowExpansion(alert.id)}
                          >
                            <TableCell className="font-medium">{alert.region}</TableCell>
                            <TableCell className="hidden md:table-cell">
                              <FormattedDate dateString={alert.publishTime} />
                            </TableCell>
                            <TableCell>{alert.typeName}</TableCell>
                            <TableCell>
                              <Badge className={getLevelColor(alert.levelName)}>
                                {alert.levelName}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="link" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  window.open(`https://www.weather.com.cn/alarm/newalarmcontent.shtml?file=${alert.detailLink}`, '_blank')
                                }}
                              >
                                查看
                              </Button>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1 flex-wrap">
                                {alert.isNew && <Badge variant="secondary" className="text-xs">新增</Badge>}
                                {alert.isProvincial && <Badge variant="outline" className="text-xs">省级</Badge>}
                                {alert.isCity && <Badge variant="outline" className="text-xs">地市级</Badge>}
                              </div>
                            </TableCell>
                          </TableRow>
                          {expandedRows.has(alert.id) && (
                            <TableRow>
                              <TableCell colSpan={6} className="bg-gray-50">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 text-sm">
                                  <div>
                                    <span className="font-medium">地区代码:</span> {alert.regionCode}
                                  </div>
                                  <div>
                                    <span className="font-medium">发布时间:</span> <FormattedDate dateString={alert.publishTime} />
                                  </div>
                                  <div>
                                    <span className="font-medium">写入时间:</span> <FormattedDate dateString={alert.writeTime} />
                                  </div>
                                  <div>
                                    <span className="font-medium">批次ID:</span> {alert.batchId}
                                  </div>
                                  <div>
                                    <span className="font-medium">经度:</span> {alert.longitude || '未知'}
                                  </div>
                                  <div>
                                    <span className="font-medium">纬度:</span> {alert.latitude || '未知'}
                                  </div>
                                  <div className="col-span-2">
                                    <span className="font-medium">详情链接:</span> 
                                    <a 
                                      href={`https://www.weather.com.cn/alarm/newalarmcontent.shtml?file=${alert.detailLink}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline ml-1"
                                    >
                                      {alert.detailLink}
                                    </a>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* 批次信息 */}
            {batchInfo && (
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle>最新更新批次信息</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <span className="font-medium">批次ID:</span> {batchInfo.batchId}
                    </div>
                    <div>
                      <span className="font-medium">状态:</span> 
                      <Badge className={batchInfo.status === 'success' ? 'bg-green-500' : 'bg-red-500'}>
                        {batchInfo.status === 'success' ? '成功' : '失败'}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">新增记录:</span> {batchInfo.recordCount} 条
                    </div>
                    <div>
                      <span className="font-medium">更新时间:</span> <FormattedDate dateString={batchInfo.updateTime} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 说明信息 */}
            <Card className="mt-8">
              <CardContent className="pt-6">
                <div className="text-sm text-gray-600">
                  <p className="mb-2"><strong>自动更新说明：</strong></p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>系统已配置为每10分钟自动更新一次数据</li>
                    <li>页面每60秒自动刷新一次以显示最新数据</li>
                    <li>当前显示的是最新一次更新获取的预警信息</li>
                    <li>点击预警行可查看详细信息</li>
                  </ul>
                  <div className="flex gap-4 mt-4">
                    <Button variant="outline" onClick={() => window.location.href = '/monitor'}>
                      系统监控
                    </Button>
                    <Button variant="outline" onClick={() => window.location.href = '/config'}>
                      通知配置
                    </Button>
                    <Button variant="outline" onClick={() => window.location.href = '/alarm-info'}>
                      预警信息管理
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}