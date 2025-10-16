'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Bell, Mail, Settings, Plus, Trash2, Edit, Save, X, Filter, Target, MapPin, AlertTriangle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { FormattedDate } from '@/components/ui/formatted-date'

interface NotificationConfig {
  id: number
  sendKey?: string
  email?: string
  smtpHost?: string
  smtpPort?: number
  smtpSecure?: boolean
  smtpUser?: string
  smtpPassword?: string
  regionCodes?: string
  levelTypes?: string
  alertLevels?: string
  enabled: boolean
  createdAt: string
  updatedAt: string
}

interface AlertRule {
  id: number
  configId: number
  ruleType: 'regional_level' | 'regional' | 'level'
  targetLevels?: string[] // 多选字段
  alertType?: string
  regionCodes?: string[] // 多选字段
  regionLevel?: string
  conditions?: string
  enabled: boolean
  createdAt: string
  updatedAt: string
  config?: {
    id: number
    sendKey?: string
    email?: string
  }
}

const typeOptions = [
  "台风", "暴雨", "暴雪", "寒潮", "大风", "沙尘暴", "高温", "干旱", 
  "雷电", "冰雹", "霜冻", "大雾", "霾", "道路结冰", "寒冷", "灰霾", 
  "雷雨大风", "森林火险", "降温", "道路冰雪", "干热风", "空气重污染", 
  "低温", "海上大雾", "雷暴大风", "持续低温", "浓浮尘", "龙卷风", 
  "低温冻害", "海上大风", "低温雨雪冰冻", "强对流", "臭氧", "大雪", 
  "强降雨", "强降温", "雪灾", "森林（草原）火险", "雷暴", "严寒", 
  "沙尘", "海上雷雨大风", "海上雷电", "海上台风"
].filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates

const levelOptions = ["蓝色", "黄色", "橙色", "红色", "白色"]

const regionOptions = [
  { code: "10101", name: "北京" },
  { code: "10102", name: "上海" },
  { code: "10103", name: "天津" },
  { code: "10104", name: "重庆" },
  { code: "10105", name: "黑龙江" },
  { code: "10106", name: "吉林" },
  { code: "10107", name: "辽宁" },
  { code: "10108", name: "内蒙古" },
  { code: "10109", name: "河北" },
  { code: "10110", name: "山西" },
  { code: "10111", name: "陕西" },
  { code: "10112", name: "山东" },
  { code: "10113", name: "新疆" },
  { code: "10114", name: "西藏" },
  { code: "10115", name: "青海" },
  { code: "10116", name: "甘肃" },
  { code: "10117", name: "宁夏" },
  { code: "10118", name: "河南" },
  { code: "10119", name: "江苏" },
  { code: "10120", name: "湖北" },
  { code: "10121", name: "浙江" },
  { code: "10122", name: "安徽" },
  { code: "10123", name: "福建" },
  { code: "10124", name: "江西" },
  { code: "10125", name: "湖南" },
  { code: "10126", name: "贵州" },
  { code: "10127", name: "四川" },
  { code: "10128", name: "广东" },
  { code: "10129", name: "云南" },
  { code: "10130", name: "广西" },
  { code: "10131", name: "海南" },
  { code: "10132", name: "香港" },
  { code: "10133", name: "澳门" },
  { code: "10134", name: "台湾" }
]

const smtpProviders = [
  { name: '自定义', host: '', port: 0, secure: false },
  { name: 'Gmail', host: 'smtp.gmail.com', port: 587, secure: false },
  { name: 'Outlook/Hotmail', host: 'smtp-mail.outlook.com', port: 587, secure: false },
  { name: 'QQ邮箱', host: 'smtp.qq.com', port: 587, secure: false },
  { name: '163邮箱', host: 'smtp.163.com', port: 465, secure: true },
  { name: '126邮箱', host: 'smtp.126.com', port: 465, secure: true },
  { name: '阿里云邮箱', host: 'smtp.mxhichina.com', port: 587, secure: false },
  { name: '腾讯企业邮箱', host: 'smtp.exmail.qq.com', port: 587, secure: false }
]

const ruleTypeOptions = [
  { value: 'regional_level', label: '地区级别', description: '匹配地区级别（省级、地市级）及预警等级、灾害类型' },
  { value: 'regional', label: '地区预警', description: '匹配特定地区及预警等级、灾害类型' },
  { value: 'level', label: '等级预警', description: '匹配特定预警等级' }
]

// 辅助函数：解析规则的预警等级
const getRuleTargetLevels = (rule: AlertRule): string[] => {
  try {
    if (rule.conditions) {
      // 处理可能的双重转义问题
      let conditionsStr = rule.conditions
      if (conditionsStr.startsWith('"') && conditionsStr.endsWith('"')) {
        conditionsStr = JSON.parse(conditionsStr)
      }
      const conditions = JSON.parse(conditionsStr)
      
      if (Array.isArray(conditions.targetLevels)) {
        return conditions.targetLevels
      } else if (conditions.targetLevels) {
        return conditions.targetLevels.split(',').map((s: string) => s.trim()).filter(Boolean)
      }
    }
  } catch (e) {
    console.error('Failed to parse rule target levels:', e)
  }
  
  // 回退到单个字段
  return rule.targetLevel ? [rule.targetLevel] : []
}

// 辅助函数：解析规则的地区代码
const getRuleRegionCodes = (rule: AlertRule): string[] => {
  try {
    if (rule.conditions) {
      // 处理可能的双重转义问题
      let conditionsStr = rule.conditions
      if (conditionsStr.startsWith('"') && conditionsStr.endsWith('"')) {
        conditionsStr = JSON.parse(conditionsStr)
      }
      const conditions = JSON.parse(conditionsStr)
      
      if (Array.isArray(conditions.regionCodes)) {
        return conditions.regionCodes
      } else if (conditions.regionCodes) {
        return conditions.regionCodes.split(',').map((s: string) => s.trim()).filter(Boolean)
      }
    }
  } catch (e) {
    console.error('Failed to parse rule region codes:', e)
  }
  
  // 回退到单个字段
  return rule.regionCode ? [rule.regionCode] : []
}

export default function ConfigPage() {
  const [configs, setConfigs] = useState<NotificationConfig[]>([])
  const [rules, setRules] = useState<AlertRule[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [editingConfig, setEditingConfig] = useState<NotificationConfig | null>(null)
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null)
  const [isCreatingConfig, setIsCreatingConfig] = useState(false)
  const [isCreatingRule, setIsCreatingRule] = useState(false)
  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null)
  
  const [configFormData, setConfigFormData] = useState({
    sendKey: '',
    email: '',
    smtpHost: '',
    smtpPort: '',
    smtpSecure: true,
    smtpUser: '',
    smtpPassword: '',
    regionCodes: '',
    levelTypes: '',
    alertLevels: '',
    enabled: true
  })

  const [ruleFormData, setRuleFormData] = useState({
    configId: 0,
    ruleType: 'level' as 'regional_level' | 'regional' | 'level',
    targetLevels: [] as string[], // 改为数组支持多选
    alertType: '',
    regionCodes: [] as string[], // 改为数组支持多选
    regionLevel: '',
    enabled: true
  })

  const fetchConfigs = async () => {
    try {
      const response = await fetch('/api/notification/config')
      const data = await response.json()
      if (data.success) {
        setConfigs(data.data)
      }
    } catch (error) {
      toast({
        title: "获取配置失败",
        description: "无法加载通知配置",
        variant: "destructive"
      })
    }
  }

  const fetchRules = async () => {
    try {
      const response = await fetch('/api/notification/rules')
      const data = await response.json()
      if (data.success) {
        setRules(data.data)
      }
    } catch (error) {
      toast({
        title: "获取规则失败",
        description: "无法加载预警规则",
        variant: "destructive"
      })
    }
  }

  const testConfig = async () => {
    if (!configFormData.sendKey && !configFormData.email) {
      toast({
        title: "测试失败",
        description: "至少需要配置Server酱密钥或邮箱地址",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch('/api/notification/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sendKey: configFormData.sendKey,
          email: configFormData.email,
          smtpHost: configFormData.smtpHost,
          smtpPort: configFormData.smtpPort ? parseInt(configFormData.smtpPort) : undefined,
          smtpSecure: configFormData.smtpSecure,
          smtpUser: configFormData.smtpUser,
          smtpPassword: configFormData.smtpPassword
        })
      })

      const data = await response.json()
      if (data.success) {
        const successResults = data.results.filter((r: any) => r.status === 'success')
        const errorResults = data.results.filter((r: any) => r.status === 'error')
        
        if (successResults.length > 0) {
          toast({
            title: "测试成功",
            description: `${successResults.map((r: any) => r.type).join('、')}测试成功`,
          })
        }
        
        if (errorResults.length > 0) {
          toast({
            title: "部分测试失败",
            description: errorResults.map((r: any) => `${r.type}: ${r.message}`).join('；'),
            variant: "destructive"
          })
        }
      } else {
        toast({
          title: "测试失败",
          description: data.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "测试失败",
        description: "网络错误",
        variant: "destructive"
      })
    }
  }

  const saveConfig = async () => {
    if (!configFormData.sendKey && !configFormData.email) {
      toast({
        title: "验证失败",
        description: "至少需要配置Server酱密钥或邮箱地址",
        variant: "destructive"
      })
      return
    }

    try {
      const url = isCreatingConfig ? '/api/notification/config' : '/api/notification/config'
      const method = isCreatingConfig ? 'POST' : 'PUT'
      const payload = isCreatingConfig ? configFormData : { ...configFormData, id: editingConfig?.id }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      if (data.success) {
        toast({
          title: "保存成功",
          description: isCreatingConfig ? "配置创建成功" : "配置更新成功"
        })
        await fetchConfigs()
        resetConfigForm()
      } else {
        toast({
          title: "保存失败",
          description: data.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "保存失败",
        description: "网络错误",
        variant: "destructive"
      })
    }
  }

  const saveRule = async () => {
    if (!ruleFormData.configId || !ruleFormData.ruleType) {
      toast({
        title: "验证失败",
        description: "请选择配置和规则类型",
        variant: "destructive"
      })
      return
    }

    // 验证数组字段
    if (ruleFormData.ruleType === 'level' && (!ruleFormData.targetLevels || ruleFormData.targetLevels.length === 0)) {
      toast({
        title: "验证失败",
        description: "请选择至少一个预警等级",
        variant: "destructive"
      })
      return
    }

    if (ruleFormData.ruleType === 'regional_level' && !ruleFormData.regionLevel) {
      toast({
        title: "验证失败",
        description: "请选择地区级别",
        variant: "destructive"
      })
      return
    }

    if (ruleFormData.ruleType === 'regional' && (!ruleFormData.regionCodes || ruleFormData.regionCodes.length === 0)) {
      toast({
        title: "验证失败",
        description: "请选择至少一个地区",
        variant: "destructive"
      })
      return
    }

    try {
      const url = isCreatingRule ? '/api/notification/rules' : '/api/notification/rules'
      const method = isCreatingRule ? 'POST' : 'PUT'
      // 构建conditions对象来存储多选值
      const conditions = {
        targetLevels: ruleFormData.targetLevels || [],
        regionCodes: ruleFormData.regionCodes || []
      }
      
      // 为了向后兼容，如果只有一个选择，也设置单个字段
      const payload = isCreatingRule ? {
        ...ruleFormData,
        targetLevel: (ruleFormData.targetLevels || []).length > 0 ? (ruleFormData.targetLevels || [])[0] : undefined,
        regionCode: (ruleFormData.regionCodes || []).length > 0 ? (ruleFormData.regionCodes || [])[0] : undefined,
        conditions: JSON.stringify(conditions)
      } : { 
        ...ruleFormData, 
        id: editingRule?.id,
        targetLevel: (ruleFormData.targetLevels || []).length > 0 ? (ruleFormData.targetLevels || [])[0] : undefined,
        regionCode: (ruleFormData.regionCodes || []).length > 0 ? (ruleFormData.regionCodes || [])[0] : undefined,
        conditions: JSON.stringify(conditions)
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      if (data.success) {
        toast({
          title: "保存成功",
          description: isCreatingRule ? "规则创建成功" : "规则更新成功"
        })
        await fetchRules()
        resetRuleForm()
      } else {
        toast({
          title: "保存失败",
          description: data.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "保存失败",
        description: "网络错误",
        variant: "destructive"
      })
    }
  }

  const deleteConfig = async (id: number) => {
    if (!confirm('确定要删除这个配置吗？相关的预警规则也会被删除。')) return

    try {
      const response = await fetch(`/api/notification/config?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      if (data.success) {
        toast({
          title: "删除成功",
          description: "配置已删除"
        })
        await fetchConfigs()
        await fetchRules()
      } else {
        toast({
          title: "删除失败",
          description: data.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "删除失败",
        description: "网络错误",
        variant: "destructive"
      })
    }
  }

  const deleteRule = async (id: number) => {
    if (!confirm('确定要删除这个预警规则吗？')) return

    try {
      const response = await fetch(`/api/notification/rules?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      if (data.success) {
        toast({
          title: "删除成功",
          description: "规则已删除"
        })
        await fetchRules()
      } else {
        toast({
          title: "删除失败",
          description: data.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "删除失败",
        description: "网络错误",
        variant: "destructive"
      })
    }
  }

  const startEditConfig = (config: NotificationConfig) => {
    setEditingConfig(config)
    setConfigFormData({
      sendKey: config.sendKey || '',
      email: config.email || '',
      smtpHost: config.smtpHost || '',
      smtpPort: config.smtpPort?.toString() || '',
      smtpSecure: config.smtpSecure !== undefined ? config.smtpSecure : true,
      smtpUser: config.smtpUser || '',
      smtpPassword: config.smtpPassword || '',
      regionCodes: config.regionCodes || '',
      levelTypes: config.levelTypes || '',
      alertLevels: config.alertLevels || '',
      enabled: config.enabled
    })
    setIsCreatingConfig(false)
  }

  const startEditRule = (rule: AlertRule) => {
    setEditingRule(rule)
    // 解析conditions字段来获取多选值
    let conditions = {}
    try {
      if (rule.conditions) {
        // 处理可能的双重转义问题
        let conditionsStr = rule.conditions
        if (conditionsStr.startsWith('"') && conditionsStr.endsWith('"')) {
          conditionsStr = JSON.parse(conditionsStr)
        }
        conditions = JSON.parse(conditionsStr)
      }
    } catch (e) {
      console.error('Failed to parse conditions:', e, 'Raw conditions:', rule.conditions)
    }

    // 从conditions中提取targetLevels，确保数组类型
    let extractedTargetLevels: string[] = []
    if (Array.isArray(conditions.targetLevels)) {
      extractedTargetLevels = conditions.targetLevels
    } else if (conditions.targetLevels) {
      // 如果是字符串，尝试分割
      extractedTargetLevels = conditions.targetLevels.split(',').map((s: string) => s.trim()).filter(Boolean)
    }
    
    // 从conditions中提取regionCodes，确保数组类型
    let extractedRegionCodes: string[] = []
    if (Array.isArray(conditions.regionCodes)) {
      extractedRegionCodes = conditions.regionCodes
    } else if (conditions.regionCodes) {
      // 如果是字符串，尝试分割
      extractedRegionCodes = conditions.regionCodes.split(',').map((s: string) => s.trim()).filter(Boolean)
    }

    setRuleFormData({
      configId: rule.configId,
      ruleType: rule.ruleType,
      targetLevels: extractedTargetLevels,
      alertType: rule.alertType || '',
      regionCodes: extractedRegionCodes.length > 0 ? extractedRegionCodes : (rule.regionCode ? [rule.regionCode] : []),
      regionLevel: rule.regionLevel || '',
      enabled: rule.enabled
    })
    setIsCreatingRule(false)
  }

  const startCreateConfig = () => {
    setEditingConfig(null)
    setConfigFormData({
      sendKey: '',
      email: '',
      smtpHost: '',
      smtpPort: '',
      smtpSecure: true,
      smtpUser: '',
      smtpPassword: '',
      regionCodes: '',
      levelTypes: '',
      alertLevels: '',
      enabled: true
    })
    setIsCreatingConfig(true)
  }

  const startCreateRule = (configId?: number) => {
    setEditingRule(null)
    setRuleFormData({
      configId: configId || 0,
      ruleType: 'level',
      targetLevels: [],
      alertType: '',
      regionCodes: [],
      regionLevel: '',
      enabled: true
    })
    setIsCreatingRule(true)
  }

  const resetConfigForm = () => {
    setEditingConfig(null)
    setIsCreatingConfig(false)
    setConfigFormData({
      sendKey: '',
      email: '',
      smtpHost: '',
      smtpPort: '',
      smtpSecure: true,
      smtpUser: '',
      smtpPassword: '',
      regionCodes: '',
      levelTypes: '',
      alertLevels: '',
      enabled: true
    })
  }

  const resetRuleForm = () => {
    setEditingRule(null)
    setIsCreatingRule(false)
    setRuleFormData({
      configId: 0,
      ruleType: 'level',
      targetLevels: [],
      alertType: '',
      regionCodes: [],
      regionLevel: '',
      enabled: true
    })
  }

  const handleSMTPProviderChange = (providerName: string) => {
    const provider = smtpProviders.find(p => p.name === providerName)
    if (provider && provider.host) {
      setConfigFormData(prev => ({
        ...prev,
        smtpHost: provider.host,
        smtpPort: provider.port.toString(),
        smtpSecure: provider.secure
      }))
    }
  }

  const getRuleTypeLabel = (ruleType: string) => {
    const option = ruleTypeOptions.find(opt => opt.value === ruleType)
    return option?.label || ruleType
  }

  const getRuleTypeDescription = (ruleType: string) => {
    const option = ruleTypeOptions.find(opt => opt.value === ruleType)
    return option?.description || ''
  }

  const getFilteredRules = () => {
    if (!selectedConfigId) return rules
    return rules.filter(rule => rule.configId === selectedConfigId)
  }

  useEffect(() => {
    setMounted(true)
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchConfigs(), fetchRules()])
      setLoading(false)
    }
    loadData()
  }, [])

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">通知配置</h1>
            <p className="text-gray-600 mt-2">配置Server酱3和邮件通知，设置精细化的预警规则</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={startCreateConfig} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              新建配置
            </Button>
            <Button onClick={() => startCreateRule()} variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              新建规则
            </Button>
          </div>
        </div>

        <Tabs defaultValue="configs" className="space-y-6">
          <TabsList>
            <TabsTrigger value="configs">通知配置</TabsTrigger>
            <TabsTrigger value="rules">预警规则</TabsTrigger>
          </TabsList>

          <TabsContent value="configs" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 配置列表 */}
              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-xl font-semibold">现有配置</h2>
                {!mounted || configs.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <Settings className="h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-600 text-center">
                        {!mounted ? '加载中...' : '暂无通知配置'}
                      </p>
                      <p className="text-sm text-gray-500 text-center mt-2">
                        {!mounted ? '' : '创建第一个配置开始接收预警通知'}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {configs.map((config) => (
                      <Card key={config.id} className={`${config.enabled ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                              配置 #{config.id}
                              {config.enabled ? (
                                <Badge variant="default" className="bg-green-500">已启用</Badge>
                              ) : (
                                <Badge variant="secondary">已禁用</Badge>
                              )}
                            </CardTitle>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startEditConfig(config)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteConfig(config.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {config.sendKey && (
                              <div className="flex items-center gap-2">
                                <Bell className="h-4 w-4 text-blue-500" />
                                <span className="text-sm">Server酱3已配置</span>
                              </div>
                            )}
                            {config.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-green-500" />
                                <span className="text-sm">邮件: {config.email}</span>
                                {config.smtpHost && (
                                  <Badge variant="outline" className="text-xs">SMTP已配置</Badge>
                                )}
                              </div>
                            )}
                            <div className="text-xs text-gray-500 pt-2 border-t">
                              创建时间: <FormattedDate dateString={config.createdAt} />
                              {config.updatedAt !== config.createdAt && (
                                <> | 更新时间: <FormattedDate dateString={config.updatedAt} /></>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* 配置表单 */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">
                  {isCreatingConfig ? '新建配置' : editingConfig ? '编辑配置' : '配置表单'}
                </h2>
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <Label htmlFor="sendKey">Server酱3密钥</Label>
                      <Input
                        id="sendKey"
                        type="password"
                        value={configFormData.sendKey}
                        onChange={(e) => setConfigFormData(prev => ({ ...prev, sendKey: e.target.value }))}
                        placeholder="请输入Server酱3的sendkey"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">邮箱地址</Label>
                      <Input
                        id="email"
                        type="email"
                        value={configFormData.email}
                        onChange={(e) => setConfigFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="用于接收邮件通知"
                      />
                    </div>

                    <div>
                      <Label htmlFor="smtpProvider">邮箱服务商</Label>
                      <Select onValueChange={handleSMTPProviderChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="选择邮箱服务商" />
                        </SelectTrigger>
                        <SelectContent>
                          {smtpProviders.map(provider => (
                            <SelectItem key={provider.name} value={provider.name}>
                              {provider.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="smtpHost">SMTP服务器</Label>
                        <Input
                          id="smtpHost"
                          value={configFormData.smtpHost}
                          onChange={(e) => setConfigFormData(prev => ({ ...prev, smtpHost: e.target.value }))}
                          placeholder="smtp.example.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="smtpPort">端口</Label>
                        <Input
                          id="smtpPort"
                          type="number"
                          value={configFormData.smtpPort}
                          onChange={(e) => setConfigFormData(prev => ({ ...prev, smtpPort: e.target.value }))}
                          placeholder="587"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="smtpUser">SMTP用户名</Label>
                        <Input
                          id="smtpUser"
                          value={configFormData.smtpUser}
                          onChange={(e) => setConfigFormData(prev => ({ ...prev, smtpUser: e.target.value }))}
                          placeholder="邮箱地址"
                        />
                      </div>
                      <div>
                        <Label htmlFor="smtpPassword">SMTP密码</Label>
                        <Input
                          id="smtpPassword"
                          type="password"
                          value={configFormData.smtpPassword}
                          onChange={(e) => setConfigFormData(prev => ({ ...prev, smtpPassword: e.target.value }))}
                          placeholder="邮箱密码或授权码"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="enabled"
                        checked={configFormData.enabled}
                        onCheckedChange={(checked) => setConfigFormData(prev => ({ ...prev, enabled: checked }))}
                      />
                      <Label htmlFor="enabled">启用此配置</Label>
                    </div>

                    <div className="flex gap-2 pt-4">
                      {(isCreatingConfig || editingConfig) && (
                        <>
                          <Button onClick={saveConfig} className="flex-1">
                            <Save className="h-4 w-4 mr-2" />
                            保存
                          </Button>
                          <Button onClick={resetConfigForm} variant="outline">
                            <X className="h-4 w-4 mr-2" />
                            取消
                          </Button>
                        </>
                      )}
                      <Button onClick={testConfig} variant="outline" className="flex-1">
                        测试通知
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="rules" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 规则列表 */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">预警规则</h2>
                  <Select value={selectedConfigId?.toString() || 'all'} onValueChange={(value) => setSelectedConfigId(value === 'all' ? null : parseInt(value))}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="筛选配置" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部配置</SelectItem>
                      {configs.map(config => (
                        <SelectItem key={config.id} value={config.id.toString()}>
                          配置 #{config.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {!mounted || getFilteredRules().length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <Filter className="h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-600 text-center">
                        {!mounted ? '加载中...' : '暂无预警规则'}
                      </p>
                      <p className="text-sm text-gray-500 text-center mt-2">
                        {!mounted ? '' : '创建规则来精细化控制预警通知'}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {getFilteredRules().map((rule) => (
                      <Card key={rule.id} className={`${rule.enabled ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <div className="flex items-center gap-2">
                                {rule.ruleType === 'regional_level' && <Target className="h-4 w-4 text-purple-500" />}
                                {rule.ruleType === 'level' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                                {rule.ruleType === 'regional' && <MapPin className="h-4 w-4 text-green-500" />}
                                {getRuleTypeLabel(rule.ruleType)}
                              </div>
                              {rule.enabled ? (
                                <Badge variant="default" className="bg-blue-500">已启用</Badge>
                              ) : (
                                <Badge variant="secondary">已禁用</Badge>
                              )}
                            </CardTitle>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startEditRule(rule)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteRule(rule.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <p className="text-sm text-gray-600">{getRuleTypeDescription(rule.ruleType)}</p>
                            
                            {/* 显示预警等级 */}
                            {(() => {
                              const targetLevels = getRuleTargetLevels(rule)
                              return targetLevels.length > 0 && (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">预警等级:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {targetLevels.map(level => (
                                      <Badge key={level} variant="outline" className="text-xs">
                                        {level}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )
                            })()}
                            
                            {rule.regionLevel && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">地区级别:</span>
                                <Badge variant="outline">
                                  {rule.regionLevel === 'provincial' ? '省级' : '地市级'}
                                </Badge>
                              </div>
                            )}

                            {rule.alertType && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">灾害类型:</span>
                                <Badge variant="outline">{rule.alertType}</Badge>
                              </div>
                            )}

                            {(() => {
                              const regionCodes = getRuleRegionCodes(rule)
                              return regionCodes.length > 0 && (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">地区:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {regionCodes.map(code => {
                                      const region = regionOptions.find(r => r.code === code)
                                      return (
                                        <Badge key={code} variant="outline" className="text-xs">
                                          {region?.name || code}
                                        </Badge>
                                      )
                                    })}
                                  </div>
                                </div>
                              )
                            })()}

                            <div className="text-xs text-gray-500 pt-2 border-t">
                              配置 #{rule.configId} | 创建时间: <FormattedDate dateString={rule.createdAt} />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* 规则表单 */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">
                  {isCreatingRule ? '新建规则' : editingRule ? '编辑规则' : '规则表单'}
                </h2>
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <Label htmlFor="configId">所属配置</Label>
                      <Select 
                        value={ruleFormData.configId.toString()} 
                        onValueChange={(value) => setRuleFormData(prev => ({ 
                          ...prev, 
                          configId: parseInt(value),
                          targetLevels: prev.targetLevels || [],
                          regionCodes: prev.regionCodes || []
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择通知配置" />
                        </SelectTrigger>
                        <SelectContent>
                          {configs.map(config => (
                            <SelectItem key={config.id} value={config.id.toString()}>
                              配置 #{config.id} {config.sendKey ? '(Server酱)' : ''} {config.email ? '(邮件)' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="ruleType">规则类型</Label>
                      <Select 
                        value={ruleFormData.ruleType} 
                        onValueChange={(value: 'regional_level' | 'regional' | 'level') => setRuleFormData(prev => ({ 
                          ...prev, 
                          ruleType: value,
                          targetLevels: prev.targetLevels || [],
                          regionCodes: prev.regionCodes || []
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择规则类型" />
                        </SelectTrigger>
                        <SelectContent>
                          {ruleTypeOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              <div>
                                <div className="font-medium">{option.label}</div>
                                <div className="text-xs text-gray-500">{option.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {ruleFormData.ruleType === 'level' && (
                      <div>
                        <Label htmlFor="targetLevels">预警等级（可多选）</Label>
                        <div className="space-y-2 mt-2">
                          {levelOptions.map(level => (
                            <div key={level} className="flex items-center space-x-2">
                              <Checkbox
                                id={`level-${level}`}
                                checked={(ruleFormData.targetLevels || []).includes(level)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setRuleFormData(prev => ({ 
                                      ...prev, 
                                      targetLevels: [...(prev.targetLevels || []), level] 
                                    }))
                                  } else {
                                    setRuleFormData(prev => ({ 
                                      ...prev, 
                                      targetLevels: (prev.targetLevels || []).filter(l => l !== level) 
                                    }))
                                  }
                                }}
                              />
                              <Label htmlFor={`level-${level}`} className="text-sm font-normal">
                                {level}预警
                              </Label>
                            </div>
                          ))}
                        </div>
                        {(ruleFormData.targetLevels || []).length > 0 && (
                          <div className="mt-2">
                            <div className="text-sm text-gray-600">已选择：</div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(ruleFormData.targetLevels || []).map(level => (
                                <Badge key={level} variant="secondary" className="text-xs">
                                  {level}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {ruleFormData.ruleType === 'regional_level' && (
                      <>
                        <div>
                          <Label htmlFor="regionLevel">地区级别</Label>
                          <Select 
                            value={ruleFormData.regionLevel} 
                            onValueChange={(value) => setRuleFormData(prev => ({ 
                              ...prev, 
                              regionLevel: value,
                              targetLevels: prev.targetLevels || [],
                              regionCodes: prev.regionCodes || []
                            }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="选择地区级别" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="provincial">省级预警</SelectItem>
                              <SelectItem value="city">地市级预警</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="targetLevels">预警等级（可多选）</Label>
                          <div className="space-y-2 mt-2">
                            {levelOptions.map(level => (
                              <div key={level} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`regional-level-target-${level}`}
                                  checked={(ruleFormData.targetLevels || []).includes(level)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setRuleFormData(prev => ({ 
                                        ...prev, 
                                        targetLevels: [...(prev.targetLevels || []), level] 
                                      }))
                                    } else {
                                      setRuleFormData(prev => ({ 
                                        ...prev, 
                                        targetLevels: (prev.targetLevels || []).filter(l => l !== level) 
                                      }))
                                    }
                                  }}
                                />
                                <Label htmlFor={`regional-level-target-${level}`} className="text-sm font-normal">
                                  {level}预警
                                </Label>
                              </div>
                            ))}
                          </div>
                          {(ruleFormData.targetLevels || []).length > 0 && (
                            <div className="mt-2">
                              <div className="text-sm text-gray-600">已选择：</div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {(ruleFormData.targetLevels || []).map(level => (
                                  <Badge key={level} variant="secondary" className="text-xs">
                                    {level}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="alertType">灾害类型（可选）</Label>
                          <Select 
                            value={ruleFormData.alertType || 'all'} 
                            onValueChange={(value) => setRuleFormData(prev => ({ 
                                ...prev, 
                                alertType: value === 'all' ? '' : value,
                                targetLevels: prev.targetLevels || [],
                                regionCodes: prev.regionCodes || []
                              }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="选择灾害类型" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">全部类型</SelectItem>
                              {typeOptions.map(type => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}

                    {ruleFormData.ruleType === 'regional' && (
                      <>
                        <div>
                          <Label htmlFor="regionCodes">地区（可多选）</Label>
                          <div className="space-y-2 mt-2 max-h-40 overflow-y-auto border rounded-md p-3">
                            {regionOptions.map(region => (
                              <div key={region.code} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`region-${region.code}`}
                                  checked={(ruleFormData.regionCodes || []).includes(region.code)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setRuleFormData(prev => ({ 
                                        ...prev, 
                                        regionCodes: [...(prev.regionCodes || []), region.code] 
                                      }))
                                    } else {
                                      setRuleFormData(prev => ({ 
                                        ...prev, 
                                        regionCodes: (prev.regionCodes || []).filter(r => r !== region.code) 
                                      }))
                                    }
                                  }}
                                />
                                <Label htmlFor={`region-${region.code}`} className="text-sm font-normal">
                                  {region.name}
                                </Label>
                              </div>
                            ))}
                          </div>
                          {(ruleFormData.regionCodes || []).length > 0 && (
                            <div className="mt-2">
                              <div className="text-sm text-gray-600">已选择：</div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {(ruleFormData.regionCodes || []).map(code => {
                                  const region = regionOptions.find(r => r.code === code)
                                  return (
                                    <Badge key={code} variant="secondary" className="text-xs">
                                      {region?.name || code}
                                    </Badge>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="targetLevels">预警等级（可多选）</Label>
                          <div className="space-y-2 mt-2">
                            {levelOptions.map(level => (
                              <div key={level} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`regional-area-target-${level}`}
                                  checked={(ruleFormData.targetLevels || []).includes(level)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setRuleFormData(prev => ({ 
                                        ...prev, 
                                        targetLevels: [...(prev.targetLevels || []), level] 
                                      }))
                                    } else {
                                      setRuleFormData(prev => ({ 
                                        ...prev, 
                                        targetLevels: (prev.targetLevels || []).filter(l => l !== level) 
                                      }))
                                    }
                                  }}
                                />
                                <Label htmlFor={`regional-area-target-${level}`} className="text-sm font-normal">
                                  {level}预警
                                </Label>
                              </div>
                            ))}
                          </div>
                          {(ruleFormData.targetLevels || []).length > 0 && (
                            <div className="mt-2">
                              <div className="text-sm text-gray-600">已选择：</div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {(ruleFormData.targetLevels || []).map(level => (
                                  <Badge key={level} variant="secondary" className="text-xs">
                                    {level}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="alertType">灾害类型（可选）</Label>
                          <Select 
                            value={ruleFormData.alertType || 'all'} 
                            onValueChange={(value) => setRuleFormData(prev => ({ 
                                ...prev, 
                                alertType: value === 'all' ? '' : value,
                                targetLevels: prev.targetLevels || [],
                                regionCodes: prev.regionCodes || []
                              }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="选择灾害类型" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">全部类型</SelectItem>
                              {typeOptions.map(type => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="ruleEnabled"
                        checked={ruleFormData.enabled}
                        onCheckedChange={(checked) => setRuleFormData(prev => ({ 
                          ...prev, 
                          enabled: checked,
                          targetLevels: prev.targetLevels || [],
                          regionCodes: prev.regionCodes || []
                        }))}
                      />
                      <Label htmlFor="ruleEnabled">启用此规则</Label>
                    </div>

                    <div className="flex gap-2 pt-4">
                      {(isCreatingRule || editingRule) && (
                        <>
                          <Button onClick={saveRule} className="flex-1">
                            <Save className="h-4 w-4 mr-2" />
                            保存
                          </Button>
                          <Button onClick={resetRuleForm} variant="outline">
                            <X className="h-4 w-4 mr-2" />
                            取消
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* 使用说明 */}
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>规则说明：</strong><br />
                    • <strong>地区级别</strong>：匹配地区级别（省级、地市级）及预警等级、灾害类型<br />
                    • <strong>等级预警</strong>：特定等级的预警发送通知<br />
                    • <strong>地区预警</strong>：特定地区的预警发送通知<br />
                    规则按优先级匹配，匹配到第一个规则即停止。
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}