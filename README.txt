My Web 项目

启动
双击“打开网站.command”启动本地预览。首次运行且缺少依赖时会自动安装；运行期间请保持终端窗口开启，结束时按 Control+C。
不要直接双击 index.html；Vite、JavaScript 模块和 React 组件需要通过本地网页服务运行。

项目结构
index.html                 首页、黑色 F 开窗转场和页面结构
hero.css / hero.js         首页样式、鼠标透镜和滚动交互
ShapeWaves.jsx             首页动态背景（WebGPU）
HeroFluidGlass.jsx         首页玻璃透镜与轻微文字色散
app-components.jsx         React 组件入口与首页效果配置
assets/                    图片与中文字体素材
public/fonts/              网站使用的 DINish 字体
package.json               依赖与运行命令

维护
构建网站：在项目目录运行 npm run build。构建产物会生成在 dist/，无需手动保留。
依赖目录 node_modules/ 是运行预览所需的本地安装内容；删除后启动脚本会重新安装。
旧版备份、PSD 原稿和未使用的 2D Lens 渲染器已移除。

第三方署名
ShapeWaves 与首页透镜参考 React Bits 的组件实现，并针对本项目修改。
来源：https://reactbits.dev/c/backgrounds/shape-waves
代码仓库：https://github.com/DavidHDev/react-bits
上游仓库注明 MIT + Commons Clause License Condition v1.0；重新分发相关代码前请核对该许可。
