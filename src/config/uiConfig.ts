export const uiConfig = {
  /**
   * 是否显示页面右上角工具菜单（在两个工具页中）
   */
  enableToolMenu: true,
  /**
   * 工具菜单路由配置：只有出现在这里的路由才会显示在右上角菜单中
   */
  toolMenuRoutes: [
    {
      key: "csharp",
      label: "C# 脚本转换器",
      description: "脚本 ⇄ 可调试 C# 文件",
      href: "/csharp-convert",
    },
    {
      key: "sql",
      label: "SQL 转换器",
      description: "提取 SQL / 反向生成 C# 字符串",
      href: "/sql-convert",
    },
  ],
  /**
   * 是否在路由切换时展示加载遮罩动画（五角星旋转弹跳）
   */
  enableLoadingOverlay: true,
  /**
   * 页面是否以弹跳动画进入（路由切换时）
   */
  enablePageBounceTransition: false,
} as const;

