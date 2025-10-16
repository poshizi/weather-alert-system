'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import { 
  Download, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  X,
  File,
  Loader2,
  Link
} from 'lucide-react'

interface UploadedFile {
  id: string
  name: string
  originalName: string
  type: 'REGULATION' | 'SYSTEM'
  size: number
  status: 'uploading' | 'processing' | 'completed' | 'failed'
  progress: number
  error?: string
}

interface FileUploadProps {
  documentType: 'REGULATION' | 'SYSTEM'
  title: string
  description: string
  onUploadComplete?: (file: UploadedFile) => void
}

export function FileUpload({ 
  documentType, 
  title, 
  description, 
  onUploadComplete 
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [nameInput, setNameInput] = useState('')

  // 处理URL文件获取
  const handleUrlFetch = useCallback(async () => {
    if (!urlInput.trim()) {
      toast({
        title: "验证失败",
        description: "请输入文件URL地址",
        variant: "destructive"
      })
      return
    }

    if (!nameInput.trim()) {
      toast({
        title: "验证失败", 
        description: "请输入文件名称",
        variant: "destructive"
      })
      return
    }

    setIsUploading(true)

    const fileId = Date.now().toString() + Math.random().toString(36)
    const newFile: UploadedFile = {
      id: fileId,
      name: `${Date.now()}_${nameInput}`,
      originalName: nameInput,
      type: documentType,
      size: 0, // 网络文件大小未知
      status: 'uploading',
      progress: 0
    }

    setFiles(prev => [...prev, newFile])

    try {
      // 更新进度
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, progress: 30 }
          : f
      ))

      // 调用API获取网络文件
      const response = await fetch('/api/documents/fetch-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: urlInput,
          name: newFile.name,
          originalName: nameInput,
          type: documentType
        })
      })

      if (!response.ok) {
        throw new Error('文件获取失败')
      }

      const result = await response.json()

      // 更新文件状态
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: 'processing', progress: 100 }
          : f
      ))

      // 模拟处理过程
      setTimeout(() => {
        setFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, status: 'completed' }
            : f
        ))
        onUploadComplete?.(newFile)
      }, 2000)

      // 清空输入
      setUrlInput('')
      setNameInput('')

      toast({
        title: "获取成功",
        description: "文件已成功获取并开始处理"
      })

    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: 'failed', error: error instanceof Error ? error.message : '未知错误' }
          : f
      ))
      
      toast({
        title: "获取失败",
        description: `${nameInput} 获取失败`,
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }, [urlInput, nameInput, documentType, onUploadComplete])

  // 删除文件
  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }, [])

  // 验证URL格式
  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* URL获取区域 */}
        <div className="border rounded-lg p-6 space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <Link className="h-5 w-5 text-primary" />
            <h4 className="font-medium">从网络地址获取文件</h4>
          </div>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="file-url">文件URL地址 *</Label>
              <Input
                id="file-url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/document.pdf"
                disabled={isUploading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                支持HTTP/HTTPS协议，确保文件可公开访问
              </p>
            </div>
            
            <div>
              <Label htmlFor="file-name">文件名称 *</Label>
              <Input
                id="file-name"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="安全生产法规.pdf"
                disabled={isUploading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                为文件指定一个便于识别的名称
              </p>
            </div>
            
            <Button 
              onClick={handleUrlFetch}
              disabled={isUploading || !urlInput.trim() || !nameInput.trim() || !isValidUrl(urlInput)}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  获取中...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  获取文件
                </>
              )}
            </Button>
          </div>
        </div>

        {/* 支持的文件格式说明 */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium mb-2">支持的文件格式</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-green-600">✓ PDF文档</p>
              <p className="text-muted-foreground">.pdf格式，支持文本提取</p>
            </div>
            <div>
              <p className="font-medium text-green-600">✓ Word文档</p>
              <p className="text-muted-foreground">.doc, .docx格式</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            注意：文件需要可通过网络直接访问，无需登录验证
          </p>
        </div>

        {/* 文件列表 */}
        {files.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">已获取文件</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <File className="h-8 w-8 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.originalName}</p>
                      <p className="text-sm text-muted-foreground">
                        网络文件
                      </p>
                      
                      {/* 状态和进度 */}
                      <div className="flex items-center space-x-2 mt-1">
                        {file.status === 'uploading' && (
                          <>
                            <Badge variant="secondary">获取中</Badge>
                            <Progress value={file.progress} className="flex-1 h-1" />
                          </>
                        )}
                        {file.status === 'processing' && (
                          <Badge variant="secondary">处理中</Badge>
                        )}
                        {file.status === 'completed' && (
                          <Badge variant="default" className="text-green-600 bg-green-50 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            已完成
                          </Badge>
                        )}
                        {file.status === 'failed' && (
                          <Badge variant="destructive">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            失败
                          </Badge>
                        )}
                      </div>
                      
                      {file.error && (
                        <p className="text-sm text-red-600 mt-1">{file.error}</p>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    disabled={file.status === 'uploading' || file.status === 'processing'}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}