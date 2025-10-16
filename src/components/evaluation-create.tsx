'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from '@/hooks/use-toast'
import { 
  FileText, 
  BookOpen, 
  Play, 
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'

interface Document {
  id: string
  name: string
  originalName: string
  type: 'REGULATION' | 'SYSTEM'
  status: string
  _count: {
    clauses: number
  }
}

interface EvaluationCreateProps {
  onEvaluationCreated?: (evaluationId: string) => void
}

export function EvaluationCreate({ onEvaluationCreated }: EvaluationCreateProps) {
  const [regulations, setRegulations] = useState<Document[]>([])
  const [systems, setSystems] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  })
  
  const [selectedRegulation, setSelectedRegulation] = useState<string>('')
  const [selectedSystems, setSelectedSystems] = useState<string[]>([])

  // 加载文档列表
  const loadDocuments = async () => {
    try {
      const [regResponse, sysResponse] = await Promise.all([
        fetch('/api/documents?type=REGULATION'),
        fetch('/api/documents?type=SYSTEM')
      ])

      if (regResponse.ok && sysResponse.ok) {
        const regData = await regResponse.json()
        const sysData = await sysResponse.json()
        
        setRegulations(regData.documents || [])
        setSystems(sysData.documents || [])
      }
    } catch (error) {
      console.error('Failed to load documents:', error)
      toast({
        title: "加载失败",
        description: "无法加载文档列表",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [])

  // 处理制度文档选择
  const handleSystemToggle = (systemId: string, checked: boolean) => {
    if (checked) {
      setSelectedSystems(prev => [...prev, systemId])
    } else {
      setSelectedSystems(prev => prev.filter(id => id !== systemId))
    }
  }

  // 创建评价任务
  const createEvaluation = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "验证失败",
        description: "请输入评价任务名称",
        variant: "destructive"
      })
      return
    }

    if (!selectedRegulation) {
      toast({
        title: "验证失败",
        description: "请选择法规文件",
        variant: "destructive"
      })
      return
    }

    if (selectedSystems.length === 0) {
      toast({
        title: "验证失败",
        description: "请至少选择一个制度文件",
        variant: "destructive"
      })
      return
    }

    setCreating(true)

    try {
      const response = await fetch('/api/evaluation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          regulationDocumentId: selectedRegulation,
          systemDocumentIds: selectedSystems
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "创建成功",
          description: "评价任务已创建，正在后台处理"
        })
        
        // 重置表单
        setFormData({ title: '', description: '' })
        setSelectedRegulation('')
        setSelectedSystems([])
        
        // 通知父组件
        onEvaluationCreated?.(data.evaluation.id)
        
      } else {
        const error = await response.json()
        toast({
          title: "创建失败",
          description: error.message || "未知错误",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "创建失败",
        description: "网络错误",
        variant: "destructive"
      })
    } finally {
      setCreating(false)
    }
  }

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'PROCESSING':
        return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />
      case 'FAILED':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return '已完成'
      case 'PROCESSING':
        return '处理中'
      case 'FAILED':
        return '失败'
      default:
        return '待处理'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-muted-foreground" />
          <p>加载文档列表...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 基本信息 */}
      <Card>
        <CardHeader>
          <CardTitle>创建评价任务</CardTitle>
          <CardDescription>
            设置评价任务的基本信息
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">任务名称 *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="例如：安全生产法规合规评价"
            />
          </div>
          
          <div>
            <Label htmlFor="description">任务描述</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="详细描述本次评价的目的和范围..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* 选择法规文件 */}
      <Card>
        <CardHeader>
          <CardTitle>选择法规文件 *</CardTitle>
          <CardDescription>
            选择需要评价的法规文件（单选）
          </CardDescription>
        </CardHeader>
        <CardContent>
          {regulations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>暂无可用的法规文件</p>
              <p className="text-sm">请先获取并处理法规文件</p>
            </div>
          ) : (
            <div className="space-y-3">
              {regulations.map((regulation) => (
                <div
                  key={regulation.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedRegulation === regulation.id
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedRegulation(regulation.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{regulation.originalName}</p>
                        <p className="text-sm text-muted-foreground">
                          {regulation._count.clauses} 个条款
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(regulation.status)}
                      <span className="text-sm">{getStatusText(regulation.status)}</span>
                      <Checkbox
                        checked={selectedRegulation === regulation.id}
                        onChange={() => setSelectedRegulation(regulation.id)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 选择制度文件 */}
      <Card>
        <CardHeader>
          <CardTitle>选择制度文件 *</CardTitle>
          <CardDescription>
            选择用于对比评价的制度文件（可多选）
          </CardDescription>
        </CardHeader>
        <CardContent>
          {systems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>暂无可用的制度文件</p>
              <p className="text-sm">请先获取并处理制度文件</p>
            </div>
          ) : (
            <div className="space-y-3">
              {systems.map((system) => (
                <div
                  key={system.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedSystems.includes(system.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-primary/50'
                  }`}
                  onClick={() => handleSystemToggle(system.id, !selectedSystems.includes(system.id))}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <BookOpen className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{system.originalName}</p>
                        <p className="text-sm text-muted-foreground">
                          {system._count.clauses} 个条款
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(system.status)}
                      <span className="text-sm">{getStatusText(system.status)}</span>
                      <Checkbox
                        checked={selectedSystems.includes(system.id)}
                        onChange={() => handleSystemToggle(system.id, !selectedSystems.includes(system.id))}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 创建按钮 */}
      <div className="flex justify-end">
        <Button
          onClick={createEvaluation}
          disabled={creating || !selectedRegulation || selectedSystems.length === 0}
          size="lg"
        >
          {creating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              创建中...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              开始评价
            </>
          )}
        </Button>
      </div>

      {/* 选中项摘要 */}
      {(selectedRegulation || selectedSystems.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>评价任务摘要</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedRegulation && (
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">
                    法规文件: {regulations.find(r => r.id === selectedRegulation)?.originalName}
                  </span>
                </div>
              )}
              
              {selectedSystems.length > 0 && (
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-green-500" />
                  <span className="text-sm">
                    制度文件: {selectedSystems.length} 个文件
                  </span>
                </div>
              )}
              
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">
                  预计将评价 {regulations.find(r => r.id === selectedRegulation)?._count.clauses || 0} 个法规条款
                  与 {selectedSystems.reduce((sum, id) => 
                    sum + (systems.find(s => s.id === id)?._count.clauses || 0), 0
                  )} 个制度条款的匹配情况
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}