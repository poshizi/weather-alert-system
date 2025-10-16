import * as nodemailer from 'nodemailer'

interface SMTPConfig {
  host: string
  port: number
  secure: boolean
  user: string
  password: string
}

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

interface SMTPOptions {
  host: string
  port: number
  secure: boolean
  user: string
  password: string
  to: string
  subject: string
  html: string
  text?: string
}

class SMTPService {
  private transporter: nodemailer.Transporter | null = null
  private config: SMTPConfig | null = null

  // 配置SMTP
  configure(config: SMTPConfig) {
    this.config = config
    this.transporter = (nodemailer as any).createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure, // true for 465, false for other ports
      auth: {
        user: config.user,
        pass: config.password,
      },
      // 添加一些常用配置
      tls: {
        rejectUnauthorized: false // 允许自签名证书
      }
    })
  }

  // 验证SMTP配置
  async verify(): Promise<boolean> {
    if (!this.transporter) {
      throw new Error('SMTP未配置')
    }

    try {
      await this.transporter.verify()
      return true
    } catch (error) {
      console.error('SMTP验证失败:', error)
      return false
    }
  }

  // 发送邮件
  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.transporter || !this.config) {
      return {
        success: false,
        error: 'SMTP未配置'
      }
    }

    try {
      const mailOptions = {
        from: `"气象预警系统" <${this.config.user}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.htmlToText(options.html)
      }

      const result = await this.transporter.sendMail(mailOptions)
      
      return {
        success: true,
        messageId: result.messageId
      }
    } catch (error) {
      console.error('邮件发送失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  // HTML转纯文本（备用）
  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '') // 移除HTML标签
      .replace(/&nbsp;/g, ' ') // 替换空格实体
      .replace(/&lt;/g, '<') // 替换小于号
      .replace(/&gt;/g, '>') // 替换大于号
      .replace(/&amp;/g, '&') // 替换和号
      .replace(/\s+/g, ' ') // 合并多个空格
      .trim()
  }

  // 获取常用SMTP配置预设
  static getCommonProviders(): Array<{ name: string; host: string; port: number; secure: boolean }> {
    return [
      {
        name: 'Gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false
      },
      {
        name: 'Outlook/Hotmail',
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false
      },
      {
        name: 'QQ邮箱',
        host: 'smtp.qq.com',
        port: 587,
        secure: false
      },
      {
        name: '163邮箱',
        host: 'smtp.163.com',
        port: 465,
        secure: true
      },
      {
        name: '126邮箱',
        host: 'smtp.126.com',
        port: 465,
        secure: true
      },
      {
        name: '阿里云邮箱',
        host: 'smtp.mxhichina.com',
        port: 587,
        secure: false
      },
      {
        name: '腾讯企业邮箱',
        host: 'smtp.exmail.qq.com',
        port: 587,
        secure: false
      }
    ]
  }
}

const smtpService = new SMTPService()
export default smtpService

// 便捷函数：直接发送邮件
export async function sendSMTPEmail(options: SMTPOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const service = new SMTPService()
  service.configure({
    host: options.host,
    port: options.port,
    secure: options.secure,
    user: options.user,
    password: options.password
  })

  return await service.sendEmail({
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text
  })
}