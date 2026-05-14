export const HOT_API_BASE = process.env.HOT_API_BASE || 'https://api-hot.imsyy.top';

export const PLATFORMS = [
  { key: 'weibo', name: '微博', weight: 1.2, categoryHint: '综合' },
  { key: 'douyin', name: '抖音', weight: 1.2, categoryHint: '娱乐' },
  { key: 'baidu', name: '百度', weight: 1.0, categoryHint: '综合' },
  { key: 'bilibili', name: 'B站', weight: 0.9, categoryHint: '视频' },
  { key: 'zhihu', name: '知乎', weight: 0.8, categoryHint: '知识' }
];

export const CATEGORY_RULES = [
  { category: '社会', words: ['警方', '通报', '男子', '女子', '学生', '学校', '医院', '事故', '案件', '法院', '救援', '火灾', '地震', '暴雨'] },
  { category: '娱乐', words: ['明星', '电影', '电视剧', '综艺', '演唱会', '演员', '导演', '歌手', '票房', '官宣', '恋情'] },
  { category: '体育', words: ['世界杯', '中超', 'NBA', 'CBA', '足球', '篮球', '冠军', '比赛', '国足', '奥运', '运动员'] },
  { category: '科技', words: ['AI', '人工智能', '大模型', '苹果', '华为', '小米', '芯片', '机器人', '手机', '特斯拉', 'OpenAI'] },
  { category: '财经', words: ['股市', 'A股', '基金', '楼市', '房价', '银行', '经济', '消费', '价格', '人民币', '企业'] },
  { category: '国际', words: ['美国', '日本', '韩国', '俄罗斯', '欧洲', '以色列', '乌克兰', '联合国', '总统', '外交'] },
  { category: '民生', words: ['高考', '就业', '工资', '社保', '医保', '教育', '住房', '交通', '天气', '假期', '旅游'] }
];

export const DEFAULT_SITE = {
  title: '国内热点实时榜',
  description: '聚合微博、抖音、百度、B站、知乎热榜，支持综合榜、平台榜和分类榜，每小时更新。',
  author: 'China Hot Rank'
};
