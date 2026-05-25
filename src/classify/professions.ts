export const PROFESSIONS = [
  "开发工程师",
  "AI 工程师",
  "数据工程师",
  "数据分析师",
  "运维工程师",
  "测试工程师",
  "安全工程师",
  "架构师",
  "技术写作",
  "产品经理",
  "设计师",
  "市场营销",
  "内容运营",
  "用户运营",
  "品牌公关",
  "电商运营",
  "销售支持",
  "客户支持",
  "项目管理",
  "人力资源",
  "财务会计",
  "法务合规",
  "行政管理",
  "教育培训",
  "翻译本地化",
  "科研学术",
  "咨询顾问",
  "金融科技",
  "医疗健康",
  "智能制造",
  "供应链管理",
  "创业管理",
  "团队管理",
  "个人效率",
  "通用技能",
] as const

export type Profession = (typeof PROFESSIONS)[number]

export const PROFESSION_SET = new Set<string>(PROFESSIONS as readonly string[])

export const FALLBACK_PROFESSION: Profession = "通用技能"

export function isProfession(value: string): value is Profession {
  return PROFESSION_SET.has(value)
}
