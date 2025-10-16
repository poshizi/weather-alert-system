'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  Edit, 
  Save, 
  X, 
  CheckCircle,
  AlertCircle,
  Upload,
  Download,
  FileText
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface AlarmInfo {
  id: number
  alarmCode: string
  alarmName: string
  conditions: string
  suggestions: string
  typeCode: string
  levelCode: string
  typeName: string
  levelName: string
  enabled: boolean
  createdAt: string
  updatedAt: string
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

export default function AlarmInfoPage() {
  const [alarmInfos, setAlarmInfos] = useState<AlarmInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterLevel, setFilterLevel] = useState('all')
  const [filterEnabled, setFilterEnabled] = useState<string>('all')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<Partial<AlarmInfo>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)

  const fetchAlarmInfos = async () => {
    try {
      const params = new URLSearchParams()
      if (filterType !== 'all') params.append('type', filterType)
      if (filterLevel !== 'all') params.append('level', filterLevel)
      if (filterEnabled !== 'all') params.append('enabled', filterEnabled)
      params.append('page', currentPage.toString())
      params.append('limit', '50')

      const response = await fetch(`/api/alarm-info?${params}`)
      const data = await response.json()

      if (data.success) {
        setAlarmInfos(data.data)
        setTotalPages(data.pagination.pages)
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
        description: "无法获取预警信息",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (alarm: AlarmInfo) => {
    setEditingId(alarm.id)
    setEditForm(alarm)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }

  const saveEdit = async () => {
    if (!editingId) return

    try {
      const response = await fetch('/api/alarm-info', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, ...editForm })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "保存成功",
          description: "预警信息已更新"
        })
        setEditingId(null)
        setEditForm({})
        await fetchAlarmInfos()
      } else {
        toast({
          title: "保存失败",
          description: data.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "网络错误",
        description: "无法保存预警信息",
        variant: "destructive"
      })
    }
  }

  const toggleEnabled = async (id: number, enabled: boolean) => {
    try {
      const response = await fetch('/api/alarm-info', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, enabled })
      })

      const data = await response.json()

      if (data.success) {
        await fetchAlarmInfos()
      } else {
        toast({
          title: "操作失败",
          description: data.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "网络错误",
        description: "无法更新预警信息",
        variant: "destructive"
      })
    }
  }

  const handleImport = async () => {
    if (!importFile) {
      toast({
        title: "请选择文件",
        description: "请选择要导入的Excel文件",
        variant: "destructive"
      })
      return
    }

    setImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', importFile)

      const response = await fetch('/api/alarm-info/import', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "导入成功",
          description: `成功导入 ${data.imported} 条记录，更新 ${data.updated} 条记录`
        })
        setImportDialogOpen(false)
        setImportFile(null)
        await fetchAlarmInfos()
      } else {
        toast({
          title: "导入失败",
          description: data.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "导入失败",
        description: "文件上传失败",
        variant: "destructive"
      })
    } finally {
      setImporting(false)
    }
  }

  const handleExportTemplate = async () => {
    try {
      const response = await fetch('/api/alarm-info/export-template')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = '预警信息导入模板.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      toast({
        title: "下载失败",
        description: "无法下载模板文件",
        variant: "destructive"
      })
    }
  }

  const handleExportData = async () => {
    try {
      const response = await fetch('/api/alarm-info/export')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `预警信息_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      toast({
        title: "导出失败",
        description: "无法导出数据",
        variant: "destructive"
      })
    }
  }

  const filteredAlarmInfos = alarmInfos.filter(alarm => {
    const matchesSearch = searchTerm === '' || 
      alarm.alarmName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alarm.alarmCode.includes(searchTerm) ||
      alarm.typeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alarm.levelName.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

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

  useEffect(() => {
    fetchAlarmInfos()
  }, [filterType, filterLevel, filterEnabled, currentPage])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">预警信息管理</h1>
              <p className="opacity-90">管理和编辑各类预警的详细信息</p>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                导入Excel文件
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>导入预警信息</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file">选择Excel文件</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="mt-2"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleImport} disabled={importing}>
                    {importing ? '导入中...' : '开始导入'}
                  </Button>
                  <Button variant="outline" onClick={handleExportTemplate}>
                    下载模板
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button
            onClick={handleExportTemplate}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            下载模板
          </Button>
          
          <Button
            onClick={handleExportData}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            导出数据
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">总预警类型</p>
                  <p className="text-2xl font-bold text-gray-900">{alarmInfos.length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">已启用</p>
                  <p className="text-2xl font-bold text-green-600">
                    {alarmInfos.filter(a => a.enabled).length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">已禁用</p>
                  <p className="text-2xl font-bold text-red-600">
                    {alarmInfos.filter(a => !a.enabled).length}
                  </p>
                </div>
                <X className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 筛选器 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              筛选条件
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <Label className="block text-sm font-medium mb-2">搜索</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="搜索预警名称、代码..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label className="block text-sm font-medium mb-2">灾害类型</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="全部类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    {Object.entries(typeMap).map(([code, name]) => (
                      <SelectItem key={code} value={code}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="block text-sm font-medium mb-2">预警等级</Label>
                <Select value={filterLevel} onValueChange={setFilterLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="全部等级" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    {Object.entries(levelMap).map(([code, name]) => (
                      <SelectItem key={code} value={code}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="block text-sm font-medium mb-2">启用状态</Label>
                <Select value={filterEnabled} onValueChange={setFilterEnabled}>
                  <SelectTrigger>
                    <SelectValue placeholder="全部状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="true">已启用</SelectItem>
                    <SelectItem value="false">已禁用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 预警信息列表 */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>预警代码</TableHead>
                    <TableHead>预警名称</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>等级</TableHead>
                    <TableHead>预警条件</TableHead>
                    <TableHead>防护建议</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 mx-auto mb-2"></div>
                        <p>加载中...</p>
                      </TableCell>
                    </TableRow>
                  ) : filteredAlarmInfos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">暂无数据</h3>
                        <p className="text-gray-600 mb-4">没有找到符合条件的预警信息</p>
                        <p className="text-sm text-gray-500">请通过Excel导入功能添加预警信息</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAlarmInfos.map((alarm) => (
                      <TableRow key={alarm.id}>
                        <TableCell className="font-mono">{alarm.alarmCode}</TableCell>
                        <TableCell>
                          {editingId === alarm.id ? (
                            <Input
                              value={editForm.alarmName || ''}
                              onChange={(e) => setEditForm({ ...editForm, alarmName: e.target.value })}
                              className="w-full"
                            />
                          ) : (
                            <div className="max-w-xs truncate" title={alarm.alarmName}>
                              {alarm.alarmName}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{alarm.typeName}</TableCell>
                        <TableCell>
                          <Badge className={getLevelColor(alarm.levelName)}>
                            {alarm.levelName}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {editingId === alarm.id ? (
                            <Textarea
                              value={editForm.conditions || ''}
                              onChange={(e) => setEditForm({ ...editForm, conditions: e.target.value })}
                              className="w-full min-h-[60px] resize-none"
                            />
                          ) : (
                            <div className="max-w-xs truncate" title={alarm.conditions}>
                              {alarm.conditions}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === alarm.id ? (
                            <Textarea
                              value={editForm.suggestions || ''}
                              onChange={(e) => setEditForm({ ...editForm, suggestions: e.target.value })}
                              className="w-full min-h-[60px] resize-none"
                            />
                          ) : (
                            <div className="max-w-xs truncate" title={alarm.suggestions}>
                              {alarm.suggestions}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={alarm.enabled}
                            onCheckedChange={(checked) => toggleEnabled(alarm.id, checked)}
                          />
                        </TableCell>
                        <TableCell>
                          {editingId === alarm.id ? (
                            <div className="flex gap-2">
                              <Button size="sm" onClick={saveEdit}>
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={cancelEdit}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => startEdit(alarm)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              上一页
            </Button>
            <span className="text-sm text-gray-600">
              第 {currentPage} 页，共 {totalPages} 页
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              下一页
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}