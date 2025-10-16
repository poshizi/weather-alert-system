import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// 从网络URL获取文件
export async function POST(request: NextRequest) {
  try {
    const { url, name, originalName, type } = await request.json()

    if (!url || !name || !originalName || !type) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // 验证URL格式
    let parsedUrl
    try {
      parsedUrl = new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // 只允许HTTP和HTTPS协议
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json(
        { error: 'Only HTTP and HTTPS protocols are allowed' },
        { status: 400 }
      )
    }

    // 获取或创建用户
    let user = await db.user.findFirst()
    if (!user) {
      user = await db.user.create({
        data: {
          email: 'default@example.com',
          name: '默认用户'
        }
      })
    }

    // 获取网络文件内容
    let content = ''
    let fileSize = 0
    let contentType = ''

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'EHS-System/1.0 (+https://ehs-system.com)'
        },
        // 设置超时
        signal: AbortSignal.timeout(30000) // 30秒超时
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // 获取文件大小
      const contentLength = response.headers.get('content-length')
      if (contentLength) {
        fileSize = parseInt(contentLength)
      }

      // 获取内容类型
      contentType = response.headers.get('content-type') || ''

      // 检查文件类型
      const isPdf = contentType.includes('application/pdf') || url.toLowerCase().endsWith('.pdf')
      const isWord = contentType.includes('application/msword') || 
                    contentType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') ||
                    url.toLowerCase().endsWith('.doc') || 
                    url.toLowerCase().endsWith('.docx')

      if (!isPdf && !isWord) {
        return NextResponse.json(
          { error: 'Unsupported file type. Only PDF and Word documents are supported.' },
          { status: 400 }
        )
      }

      // 获取文件内容
      const buffer = await response.arrayBuffer()
      const text = new TextDecoder('utf-8', { fatal: false }).decode(buffer)
      
      // 简单的文本提取（实际应用中可能需要更复杂的解析）
      if (isPdf) {
        // 对于PDF，尝试提取文本（简化版本）
        content = extractTextFromContent(text, 'pdf')
      } else if (isWord) {
        // 对于Word文档，尝试提取文本（简化版本）
        content = extractTextFromContent(text, 'word')
      }

      if (!content || content.trim().length < 10) {
        content = `文件已从网络获取: ${originalName}\n来源: ${url}\n\n注意: 文件内容可能需要进一步处理。`
      }

    } catch (error) {
      console.error('Failed to fetch file:', error)
      return NextResponse.json(
        { 
          error: 'Failed to fetch file from URL',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 400 }
      )
    }

    // 保存到数据库
    const document = await db.document.create({
      data: {
        userId: user.id,
        name,
        originalName,
        type: type as 'REGULATION' | 'SYSTEM',
        category: type === 'REGULATION' ? '法规文件' : '制度文件',
        content,
        filePath: url, // 存储原始URL
        fileSize,
        status: 'PROCESSING'
      }
    })

    // 异步处理文档条款
    processDocumentClauses(document.id, content).catch(error => {
      console.error('Failed to process document clauses:', error)
    })

    return NextResponse.json({ 
      success: true, 
      document: {
        id: document.id,
        name: document.name,
        originalName: document.originalName,
        type: document.type,
        size: document.fileSize,
        source: url
      }
    })

  } catch (error) {
    console.error('Fetch URL failed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch file from URL' },
      { status: 500 }
    )
  }
}

// 简单的文本提取函数
function extractTextFromContent(content: string, fileType: string): string {
  // 这是一个简化的文本提取实现
  // 在生产环境中，您可能需要使用专门的库如pdf-parse或mammoth
  
  let extractedText = content
  
  // 移除二进制字符和非打印字符
  extractedText = extractedText.replace(/[^\x20-\x7E\u4e00-\u9fff\u3000-\u303f\uff00-\uffef\s]/g, ' ')
  
  // 移除多余的空白字符
  extractedText = extractedText.replace(/\s+/g, ' ').trim()
  
  // 如果内容太短，返回默认信息
  if (extractedText.length < 50) {
    return `文档内容提取失败或文档为空。\n\n文件信息:\n类型: ${fileType}\n原始内容长度: ${content.length} 字符\n提取内容长度: ${extractedText.length} 字符\n\n建议: 请检查文件是否可以正常访问，或尝试其他文件。`
  }
  
  return extractedText
}

// 处理文档条款
async function processDocumentClauses(documentId: string, content: string) {
  try {
    // 更新文档状态为处理中
    await db.document.update({
      where: { id: documentId },
      data: { status: 'PROCESSING' }
    })

    // 简单的条款分割逻辑
    const clauses = content
      .split(/\n\s*\d+\.|\n\s*[一二三四五六七八九十]+[、.]\s*/g)
      .filter(clause => clause.trim().length > 20)
      .map((clause, index) => clause.trim())
      .filter((clause, index, arr) => arr.indexOf(clause) === index)

    // 保存条款到数据库
    for (let i = 0; i < clauses.length; i++) {
      await db.documentClause.create({
        data: {
          documentId,
          content: clauses[i],
          clauseIndex: i + 1
        }
      })
    }

    // 更新文档状态为已完成
    await db.document.update({
      where: { id: documentId },
      data: { status: 'COMPLETED' }
    })

  } catch (error) {
    console.error('Failed to process document clauses:', error)
    
    // 更新文档状态为失败
    await db.document.update({
      where: { id: documentId },
      data: { status: 'FAILED' }
    })
  }
}