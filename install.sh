#!/bin/bash

# 🌦️ 气象预警系统 - 自动安装脚本
# 适用于 Ubuntu 20.04+, Debian 11+, CentOS 8+

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
APP_NAME="weather-alert-system"
APP_DIR="/opt/$APP_NAME"
APP_USER="www-data"
REPO_URL="https://github.com/your-username/weather-alert-system.git"
NODE_VERSION="18"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否为root用户
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "此脚本需要root权限运行"
        echo "请使用: sudo $0"
        exit 1
    fi
}

# 检测操作系统
detect_os() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS=$NAME
        VER=$VERSION_ID
    else
        log_error "无法检测操作系统"
        exit 1
    fi
    
    log_info "检测到操作系统: $OS $VER"
}

# 更新系统
update_system() {
    log_info "更新系统包..."
    
    if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        apt update && apt upgrade -y
        apt install -y curl wget git unzip software-properties-common
    elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]]; then
        yum update -y
        yum install -y curl wget git unzip epel-release
    else
        log_error "不支持的操作系统: $OS"
        exit 1
    fi
    
    log_success "系统更新完成"
}

# 安装Node.js
install_nodejs() {
    log_info "安装Node.js $NODE_VERSION..."
    
    # 检查是否已安装Node.js
    if command -v node &> /dev/null; then
        NODE_CURRENT=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [[ "$NODE_CURRENT" -ge "$NODE_VERSION" ]]; then
            log_success "Node.js $(node -v) 已安装"
            return
        fi
    fi
    
    # 安装Node.js
    if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
        apt-get install -y nodejs
    elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]]; then
        curl -fsSL https://rpm.nodesource.com/setup_${NODE_VERSION}.x | bash -
        yum install -y nodejs
    fi
    
    # 验证安装
    if command -v node &> /dev/null; then
        log_success "Node.js $(node -v) 安装完成"
    else
        log_error "Node.js 安装失败"
        exit 1
    fi
}

# 安装PM2
install_pm2() {
    log_info "安装PM2..."
    
    if ! command -v pm2 &> /dev/null; then
        npm install -g pm2
        log_success "PM2 安装完成"
    else
        log_success "PM2 $(pm2 -v) 已安装"
    fi
}

# 安装Nginx (可选)
install_nginx() {
    if [[ "$INSTALL_NGINX" == "true" ]]; then
        log_info "安装Nginx..."
        
        if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
            apt install -y nginx
        elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]]; then
            yum install -y nginx
        fi
        
        # 启动并启用Nginx
        systemctl start nginx
        systemctl enable nginx
        
        log_success "Nginx 安装完成"
    fi
}

# 创建应用目录
create_app_dir() {
    log_info "创建应用目录..."
    
    if [[ -d "$APP_DIR" ]]; then
        log_warning "应用目录已存在，正在备份..."
        mv "$APP_DIR" "${APP_DIR}.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    mkdir -p "$APP_DIR"
    cd "$APP_DIR"
    
    log_success "应用目录创建完成: $APP_DIR"
}

# 下载项目代码
download_project() {
    log_info "下载项目代码..."
    
    # 尝试使用Git克隆
    if command -v git &> /dev/null; then
        git clone "$REPO_URL" .
        log_success "代码下载完成"
    else
        log_error "Git未安装，无法下载代码"
        exit 1
    fi
}

# 安装依赖
install_dependencies() {
    log_info "安装项目依赖..."
    
    # 生产环境安装
    npm ci --production
    
    # 生成Prisma客户端
    npx prisma generate
    
    log_success "依赖安装完成"
}

# 配置环境变量
configure_environment() {
    log_info "配置环境变量..."
    
    if [[ ! -f .env ]]; then
        cp .env.example .env
        
        # 生成随机密钥
        SECRET=$(openssl rand -base64 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
        
        # 更新配置文件
        sed -i "s/your-secret-key-here/$SECRET/g" .env
        
        log_success "环境变量配置完成"
        log_warning "请编辑 $APP_DIR/.env 文件配置您的具体设置"
    else
        log_warning "环境变量文件已存在，跳过配置"
    fi
}

# 初始化数据库
init_database() {
    log_info "初始化数据库..."
    
    # 推送数据库schema
    npm run db:push
    
    # 设置权限
    chown $APP_USER:$APP_USER dev.db
    chmod 664 dev.db
    
    log_success "数据库初始化完成"
}

# 构建应用
build_application() {
    log_info "构建应用..."
    
    npm run build
    
    log_success "应用构建完成"
}

# 配置PM2服务
configure_pm2() {
    log_info "配置PM2服务..."
    
    # 创建PM2配置文件
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '$APP_NAME',
    script: 'npm',
    args: 'start',
    cwd: '$APP_DIR',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/$APP_NAME-error.log',
    out_file: '/var/log/pm2/$APP_NAME-out.log',
    log_file: '/var/log/pm2/$APP_NAME-combined.log',
    time: true
  }]
};
EOF
    
    # 创建日志目录
    mkdir -p /var/log/pm2
    
    # 启动应用
    pm2 start ecosystem.config.js
    
    # 设置开机自启
    pm2 startup
    pm2 save
    
    log_success "PM2服务配置完成"
}

# 配置Nginx (如果安装)
configure_nginx() {
    if [[ "$INSTALL_NGINX" == "true" ]] && [[ -n "$DOMAIN_NAME" ]]; then
        log_info "配置Nginx反向代理..."
        
        # 创建Nginx配置
        cat > /etc/nginx/sites-available/$APP_NAME << EOF
server {
    listen 80;
    server_name $DOMAIN_NAME;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
        
        # 启用站点
        ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
        rm -f /etc/nginx/sites-enabled/default
        
        # 测试配置
        nginx -t && systemctl reload nginx
        
        log_success "Nginx配置完成"
        
        # 询问是否安装SSL证书
        if [[ "$INSTALL_SSL" == "true" ]]; then
            install_ssl_certificate
        fi
    fi
}

# 安装SSL证书
install_ssl_certificate() {
    if command -v certbot &> /dev/null; then
        log_info "安装SSL证书..."
        
        certbot --nginx -d $DOMAIN_NAME --non-interactive --agree-tos --email admin@$DOMAIN_NAME
        
        # 设置自动续期
        (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
        
        log_success "SSL证书安装完成"
    else
        log_warning "Certbot未安装，跳过SSL证书安装"
    fi
}

# 配置防火墙
configure_firewall() {
    log_info "配置防火墙..."
    
    if command -v ufw &> /dev/null; then
        # Ubuntu/Debian
        ufw --force enable
        ufw allow ssh
        ufw allow 80
        ufw allow 443
        
        log_success "UFW防火墙配置完成"
    elif command -v firewall-cmd &> /dev/null; then
        # CentOS/RHEL
        systemctl start firewalld
        systemctl enable firewalld
        
        firewall-cmd --permanent --add-service=ssh
        firewall-cmd --permanent --add-service=http
        firewall-cmd --permanent --add-service=https
        firewall-cmd --reload
        
        log_success "firewalld防火墙配置完成"
    else
        log_warning "未找到支持的防火墙工具"
    fi
}

# 设置权限
set_permissions() {
    log_info "设置文件权限..."
    
    chown -R $APP_USER:$APP_USER $APP_DIR
    chmod -R 755 $APP_DIR
    
    log_success "权限设置完成"
}

# 验证安装
verify_installation() {
    log_info "验证安装..."
    
    # 检查服务状态
    if pm2 list | grep -q "$APP_NAME.*online"; then
        log_success "应用服务运行正常"
    else
        log_error "应用服务启动失败"
        return 1
    fi
    
    # 检查端口
    if netstat -tlnp | grep -q ":3000"; then
        log_success "端口3000监听正常"
    else
        log_error "端口3000未监听"
        return 1
    fi
    
    # 测试API
    sleep 5
    if curl -s http://localhost:3000/api/health > /dev/null; then
        log_success "API接口响应正常"
    else
        log_warning "API接口测试失败，可能需要等待服务完全启动"
    fi
    
    return 0
}

# 显示安装信息
show_install_info() {
    echo ""
    echo "🎉 气象预警系统安装完成！"
    echo ""
    echo "📋 安装信息:"
    echo "   应用目录: $APP_DIR"
    echo "   访问地址: http://localhost:3000"
    
    if [[ -n "$DOMAIN_NAME" ]]; then
        echo "   域名访问: http://$DOMAIN_NAME"
        if [[ "$INSTALL_SSL" == "true" ]]; then
            echo "   HTTPS访问: https://$DOMAIN_NAME"
        fi
    fi
    
    echo ""
    echo "🔧 管理命令:"
    echo "   查看状态: pm2 status"
    echo "   查看日志: pm2 logs $APP_NAME"
    echo "   重启服务: pm2 restart $APP_NAME"
    echo "   停止服务: pm2 stop $APP_NAME"
    echo ""
    echo "⚙️ 配置文件:"
    echo "   环境变量: $APP_DIR/.env"
    echo "   PM2配置: $APP_DIR/ecosystem.config.js"
    echo ""
    echo "📚 更多信息:"
    echo "   文档: $APP_DIR/README.md"
    echo "   安装指南: $APP_DIR/INSTALL.md"
    echo ""
    
    if [[ ! -f "$APP_DIR/.env" ]] || grep -q "your-secret-key-here" "$APP_DIR/.env"; then
        echo "⚠️  重要提醒:"
        echo "   请编辑 $APP_DIR/.env 文件配置您的环境变量"
        echo "   特别是 NEXTAUTH_SECRET 和通知配置"
        echo ""
    fi
}

# 主函数
main() {
    echo "🌦️  气象预警系统 - 自动安装脚本"
    echo "=================================="
    echo ""
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --nginx)
                INSTALL_NGINX="true"
                shift
                ;;
            --domain)
                DOMAIN_NAME="$2"
                shift 2
                ;;
            --ssl)
                INSTALL_SSL="true"
                shift
                ;;
            --help)
                echo "用法: $0 [选项]"
                echo ""
                echo "选项:"
                echo "  --nginx      安装并配置Nginx"
                echo "  --domain     设置域名 (需要配合--nginx)"
                echo "  --ssl        安装SSL证书 (需要先设置域名)"
                echo "  --help       显示帮助信息"
                echo ""
                echo "示例:"
                echo "  $0 --nginx --domain example.com --ssl"
                echo ""
                exit 0
                ;;
            *)
                log_error "未知参数: $1"
                echo "使用 --help 查看帮助信息"
                exit 1
                ;;
        esac
    done
    
    # 执行安装步骤
    check_root
    detect_os
    update_system
    install_nodejs
    install_pm2
    install_nginx
    create_app_dir
    download_project
    install_dependencies
    configure_environment
    init_database
    build_application
    configure_pm2
    configure_nginx
    configure_firewall
    set_permissions
    
    # 验证安装
    if verify_installation; then
        show_install_info
        log_success "安装完成！"
    else
        log_error "安装验证失败，请检查日志"
        exit 1
    fi
}

# 运行主函数
main "$@"