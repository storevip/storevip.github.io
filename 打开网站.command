#!/bin/zsh

cd "$(dirname "$0")" || exit 1

echo "======================================"
echo "  My Web"
echo "  项目位置：$(pwd)"
echo "======================================"
echo ""

# Finder 双击 .command 时，尝试加载用户环境
if ! command -v npm >/dev/null 2>&1; then
  [ -f "$HOME/.zprofile" ] && source "$HOME/.zprofile"
  [ -f "$HOME/.zshrc" ] && source "$HOME/.zshrc"
fi

# 检查 Node / npm
if ! command -v node >/dev/null 2>&1; then
  echo "未检测到 Node.js。"
  echo "请先在这台 Mac 安装 Node.js。"
  echo ""
  read "?按回车关闭..."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "未检测到 npm。"
  echo ""
  read "?按回车关闭..."
  exit 1
fi

echo "Node: $(node -v)"
echo "npm:  $(npm -v)"
echo ""

# 新电脑第一次使用时才安装依赖
if [ ! -d "node_modules" ]; then
  echo "未发现 node_modules，正在安装项目依赖..."
  npm ci || {
    echo ""
    echo "依赖安装失败。"
    read "?按回车关闭..."
    exit 1
  }
fi

echo "正在启动网站..."
echo ""

npm run dev -- --open
