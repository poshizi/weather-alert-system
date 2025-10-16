'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  FileText, 
  Scale,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'

interface Evaluation {
  id: string
  title: string
  description?: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  progress: number
  createdAt: string
  regulationDocument: {
    name: string
    originalName: string
    clauses: any[]
  }
  matches: {
    id: string
    regulationClause: {
      content: string
    }
    isApplicable: boolean
    complianceScore?: number
    analysis?: string
    matchedClauses?: string
  }[]
  systemEvaluations: {
    id: string
    systemDocument: {
      name: string
      originalName: string
    }
    overallScore: number
    analysis?: string
  }[]
}

interface EvaluationResultsProps {
  evaluationId?: string
}

export function EvaluationResults({ evaluationId }: EvaluationResultsProps) {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null)
  const [loading, setLoading] = useState(true)

  // 加载评价列表
  const loadEvaluations = async () => {
    try {
      const response = await fetch('/api/evaluation')
      if (response.ok) {
        const data = await response.json()
        setEvaluations(data.evaluations || [])
        
        // 如果指定了evaluationId，选择对应的评价
        if (evaluationId) {
          const evaluation = data.evaluations.find((e: Evaluation) => e.id === evaluationId)
          if (evaluation) {
            setSelectedEvaluation(evaluation)
          }
        }
      }
    } catch (error) {
      console.error('Failed to load evaluations:', error)
    } finally {
      setLoading(false)
    }
  }

  // 加载评价详情
  const loadEvaluationDetail = async (id: string) => {
    try {
      const response = await fetch(`/api/evaluation/${id}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedEvaluation(data.evaluation)
      }
    } catch (error) {
      console.error('Failed to load evaluation detail:', error)
    }
  }

  useEffect(() => {
    loadEvaluations()
  }, [])

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'PROCESSING':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'FAILED':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return '已完成'
      case 'PROCESSING':
        return '进行中'
      case 'FAILED':
        return '失败'
      default:
        return '待开始'
    }
  }

  // 获取评分颜色
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  // 获取评分趋势图标
  const getScoreTrend = (score: number) => {
    if (score >= 80) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (score >= 60) return <Minus className="h-4 w-4 text-yellow-500" />
    return <TrendingDown className="h-4 w-4 text-red-500" />
  }

  // 计算总体统计
  const getOverallStats = (evaluation: Evaluation) => {
    const applicableMatches = evaluation.matches.filter(m => m.isApplicable)
    const totalClauses = evaluation.regulationDocument.clauses.length
    const applicableCount = applicableMatches.length
    const avgScore = applicableMatches.length > 0 
      ? applicableMatches.reduce((sum, m) => sum + (m.complianceScore || 0), 0) / applicableMatches.length
      : 0

    return {
      totalClauses,
      applicableCount,
      avgScore,
      complianceRate: totalClauses > 0 ? (applicableCount / totalClauses) * 100 : 0
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Clock className="h-8 w-8 mx-auto mb-4 animate-spin text-muted-foreground" />
          <p>加载评价结果...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 评价列表 */}
      {!selectedEvaluation && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">评价历史</h3>
          {evaluations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Scale className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">暂无评价结果</h3>
                <p className="text-muted-foreground">完成评价任务后，结果将在此处显示</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {evaluations.map((evaluation) => {
                const stats = getOverallStats(evaluation)
                return (
                  <Card key={evaluation.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(evaluation.status)}
                          <div>
                            <CardTitle className="text-base">{evaluation.title}</CardTitle>
                            <CardDescription>
                              {evaluation.regulationDocument.originalName}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={evaluation.status === 'COMPLETED' ? 'default' : 'secondary'}>
                            {getStatusText(evaluation.status)}
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            {new Date(evaluation.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    {evaluation.status === 'PROCESSING' && (
                      <CardContent>
                        <Progress value={evaluation.progress} className="h-2" />
                        <p className="text-sm text-muted-foreground mt-2">
                          进度: {evaluation.progress.toFixed(1)}%
                        </p>
                      </CardContent>
                    )}
                    {evaluation.status === 'COMPLETED' && (
                      <CardContent>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">总条款</p>
                            <p className="font-medium">{stats.totalClauses}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">适用条款</p>
                            <p className="font-medium">{stats.applicableCount}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">合规率</p>
                            <p className="font-medium">{stats.complianceRate.toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">平均评分</p>
                            <p className={`font-medium ${getScoreColor(stats.avgScore)}`}>
                              {stats.avgScore.toFixed(1)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => loadEvaluationDetail(evaluation.id)}
                          >
                            查看详情
                          </Button>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* 评价详情 */}
      {selectedEvaluation && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">{selectedEvaluation.title}</h3>
              <p className="text-muted-foreground">
                {selectedEvaluation.description}
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setSelectedEvaluation(null)}
            >
              返回列表
            </Button>
          </div>

          {/* 总体统计 */}
          <div className="grid gap-4 md:grid-cols-4">
            {(() => {
              const stats = getOverallStats(selectedEvaluation)
              return (
                <>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">总条款数</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalClauses}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">适用条款</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.applicableCount}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">合规率</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {stats.complianceRate.toFixed(1)}%
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">平均评分</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center space-x-2">
                        <div className={`text-2xl font-bold ${getScoreColor(stats.avgScore)}`}>
                          {stats.avgScore.toFixed(1)}
                        </div>
                        {getScoreTrend(stats.avgScore)}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )
            })()}
          </div>

          {/* 详细结果 */}
          <Tabs defaultValue="matches" className="space-y-4">
            <TabsList>
              <TabsTrigger value="matches">条款匹配</TabsTrigger>
              <TabsTrigger value="systems">制度评价</TabsTrigger>
            </TabsList>

            <TabsContent value="matches" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>法规条款匹配结果</CardTitle>
                  <CardDescription>
                    每个法规条款的适用性分析和合规评分
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {selectedEvaluation.matches.map((match, index) => (
                        <div key={match.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">条款 {index + 1}</Badge>
                              {match.isApplicable ? (
                                <Badge className="bg-green-50 text-green-600 border-green-200">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  适用
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  不适用
                                </Badge>
                              )}
                            </div>
                            {match.isApplicable && match.complianceScore && (
                              <div className="flex items-center space-x-2">
                                <span className={`font-medium ${getScoreColor(match.complianceScore)}`}>
                                  {match.complianceScore.toFixed(1)}分
                                </span>
                                {getScoreTrend(match.complianceScore)}
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">法规条款：</p>
                              <p className="text-sm bg-muted p-2 rounded">
                                {match.regulationClause.content}
                              </p>
                            </div>
                            
                            {match.analysis && (
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">分析结果：</p>
                                <p className="text-sm">{match.analysis}</p>
                              </div>
                            )}

                            {match.matchedClauses && (
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">匹配的制度条款：</p>
                                <div className="mt-1 space-y-1">
                                  {JSON.parse(match.matchedClauses).map((clause: any, idx: number) => (
                                    <div key={idx} className="text-sm bg-blue-50 p-2 rounded border-l-2 border-blue-200">
                                      <p className="font-medium text-blue-700">
                                        相似度: {(clause.similarity * 100).toFixed(1)}%
                                      </p>
                                      <p className="text-gray-700">{clause.content}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="systems" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>制度文件总体评价</CardTitle>
                  <CardDescription>
                    各制度文件的合规评分和分析
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedEvaluation.systemEvaluations.map((sysEval) => (
                      <div key={sysEval.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{sysEval.systemDocument.originalName}</h4>
                            <p className="text-sm text-muted-foreground">
                              {sysEval.systemDocument.name}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`text-lg font-bold ${getScoreColor(sysEval.overallScore)}`}>
                              {sysEval.overallScore.toFixed(1)}分
                            </span>
                            {getScoreTrend(sysEval.overallScore)}
                          </div>
                        </div>
                        
                        <Progress value={sysEval.overallScore} className="h-2 mb-2" />
                        
                        {sysEval.analysis && (
                          <p className="text-sm text-muted-foreground">
                            {sysEval.analysis}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}