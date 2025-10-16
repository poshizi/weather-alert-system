'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { Settings, Plus, Edit, Trash2, Check, AlertCircle } from 'lucide-react'

interface OpenAIConfig {
  id: string
  name: string
  baseUrl: string
  apiKey: string
  isActive: boolean
}

export function OpenAIConfigComponent() {
  const [configs, setConfigs] = useState<OpenAIConfig[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<OpenAIConfig | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    baseUrl: '',
    apiKey: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  // 加载配置列表
  const loadConfigs = async () => {
    try {
      const response = await fetch('/api/openai-config')
      if (response.ok) {
        const data = await response.json()
        setConfigs(data.configs || [])
      }
    } catch (error) {
      console.error('Failed to load configs:', error)
    }
  }

  useEffect(() => {
    loadConfigs()
  }, [])

  // 重置表单
  const resetForm = () => {
    setFormData({ name: '', baseUrl: '', apiKey: '' })
    setEditingConfig(null)
  }

  // 打开编辑对话框
  const openEditDialog = (config?: OpenAIConfig) => {
    if (config) {
      setEditingConfig(config)
      setFormData({
        name: config.name,
        baseUrl: config.baseUrl,
        apiKey: config.apiKey
      })
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }

  // 保存配置
  const saveConfig = async () => {
    if (!formData.name || !formData.baseUrl || !formData.apiKey) {
      toast({
        title: "验证失败",
        description: "请填写所有必填字段",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const url = editingConfig ? `/api/openai-config/${editingConfig.id}` : '/api/openai-config'
      const method = editingConfig ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast({
          title: "保存成功",
          description: editingConfig ? "配置已更新" : "新配置已创建"
        })
        setIsDialogOpen(false)
        resetForm()
        loadConfigs()
      } else {
        const error = await response.json()
        toast({
          title: "保存失败",
          description: error.message || "未知错误",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "保存失败",
        description: "网络错误",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 删除配置
  const deleteConfig = async (id: string) => {
    if (!confirm('确定要删除这个配置吗？')) {
      return
    }

    try {
      const response = await fetch(`/api/openai-config/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "删除成功",
          description: "配置已删除"
        })
        loadConfigs()
      } else {
        toast({
          title: "删除失败",
          description: "无法删除配置",
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

  // 设置活跃配置
  const setActiveConfig = async (id: string) => {
    try {
      const response = await fetch(`/api/openai-config/${id}/activate`, {
        method: 'POST'
      })

      if (response.ok) {
        toast({
          title: "设置成功",
          description: "已设置为活跃配置"
        })
        loadConfigs()
      } else {
        toast({
          title: "设置失败",
          description: "无法设置活跃配置",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "设置失败",
        description: "网络错误",
        variant: "destructive"
      })
    }
  }

  // 测试配置
  const testConfig = async (config: OpenAIConfig) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/openai-config/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          baseUrl: config.baseUrl,
          apiKey: config.apiKey
        })
      })

      if (response.ok) {
        toast({
          title: "测试成功",
          description: "配置连接正常"
        })
      } else {
        const error = await response.json()
        toast({
          title: "测试失败",
          description: error.message || "连接失败",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "测试失败",
        description: "网络错误",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">OpenAI 配置管理</h3>
          <p className="text-sm text-muted-foreground">
            管理用于AI分析的OpenAI API配置
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openEditDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              添加配置
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingConfig ? '编辑配置' : '添加新配置'}
              </DialogTitle>
              <DialogDescription>
                配置OpenAI API的Base URL和API Key
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">配置名称</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例如：主配置、测试配置"
                />
              </div>
              <div>
                <Label htmlFor="baseUrl">Base URL</Label>
                <Input
                  id="baseUrl"
                  value={formData.baseUrl}
                  onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                  placeholder="https://api.openai.com/v1"
                />
              </div>
              <div>
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder="sk-..."
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  取消
                </Button>
                <Button onClick={saveConfig} disabled={isLoading}>
                  {isLoading ? '保存中...' : '保存'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {configs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">暂无配置</h3>
            <p className="text-muted-foreground mb-4">
              添加OpenAI API配置以启用AI功能
            </p>
            <Button onClick={() => openEditDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              添加第一个配置
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {configs.map((config) => (
            <Card key={config.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CardTitle className="text-base">{config.name}</CardTitle>
                    {config.isActive && (
                      <Badge variant="default" className="text-green-600 bg-green-50 border-green-200">
                        <Check className="h-3 w-3 mr-1" />
                        活跃
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testConfig(config)}
                      disabled={isLoading}
                    >
                      <AlertCircle className="h-4 w-4 mr-1" />
                      测试
                    </Button>
                    {!config.isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveConfig(config.id)}
                      >
                        设为活跃
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(config)}
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
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm font-medium">Base URL:</Label>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {config.baseUrl}
                    </code>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm font-medium">API Key:</Label>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {config.apiKey.slice(0, 8)}***
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}