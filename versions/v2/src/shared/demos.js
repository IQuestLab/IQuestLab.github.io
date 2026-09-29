import { t } from './i18n.js'
import { poster, video } from './media.js'

// Frontend generation showcase. `demo` is the folder under public/demos (interactive first);
// `video` is an optional recorded walkthrough. Text in *asterisks* renders as emphasis.
export const demoCategories = [
  { id: 'all', label: t('All', '全部') },
  { id: 'game', label: t('Games', '游戏') },
  { id: 'tool', label: t('Personal tools', '个人工具') },
  { id: 'design', label: t('Design & layout', '设计与布局') },
  { id: 'viz', label: t('Scientific visualization', '科学可视化') },
]

export const frontendDemos = [
  {
    id: 'coral-dome', cat: 'game', demo: 'coral-dome', demoEn: true, cover: poster('frontend/coral-dome'), hue: ['#0b6e8a', '#f28c6b'],
    title: t('Underwater Voxel City', '我的世界 · 海洋版'),
    body: t('A voxel city beneath the sea, with kelp forests, farms, and deep-sea creatures. Players mine, trade with villagers, and build habitats under breathable domes.', '把方块世界搬到海底：海藻林、农场和深海生物围绕着可呼吸的穹顶。玩家可以挖矿、与村民交易，建造自己的水下栖息地。'),
  },
  {
    id: 'toy-soldiers', cat: 'game', demo: 'toy-soldiers', demoEn: true, cover: poster('frontend/toy-soldiers'), hue: ['#3b5d2a', '#e0b44c'],
    title: t('Toy Soldiers: Multiplayer FPS', '玩具兵大战 · 多人 FPS'),
    body: t('A child’s bedroom becomes a miniature battlefield. Players face AI opponents among oversized furniture, with a character-preview lobby and an in-game display for health, weapons, and ammunition.', '儿童房成了玩具兵的微缩战场。玩家在家具之间与 AI 对手交战，从大厅的角色预览进入第一人称视角，随时查看血量、武器和弹药。'),
  },
  {
    id: 'sunset-racer', cat: 'game', demo: 'sunset-racer', demoEn: true, cover: poster('frontend/sunset-racer'), hue: ['#4a2a7a', '#ff8a3d'],
    title: t('Sunset Coast Racer', '落日飙车'),
    body: t('Race along a sunset coast against AI drivers. Palm silhouettes and a purple-orange sky set the scene; a banking chase camera and collision shake give each turn a sense of motion.', '在落日余晖下的海岸赛道上与 AI 竞速。游戏以紫橙色的天空和棕榈树剪影为背景，跟随镜头会随着赛车的过弯而倾斜，碰撞时还会产生震动，带来逼真的驾驶反馈。'),
  },
  {
    id: 'aegean-garden', cat: 'tool', demo: 'aegean-garden', demoEn: true, video: video('frontend/aegean-garden'), poster: poster('frontend/aegean-garden'), size: [1920, 822], hue: ['#1f5fa8', '#d9468c'],
    title: t('Aegean Garden Planner', '爱琴海花园 · 花卉种植模拟器'),
    shortTitle: t('Aegean Garden', '爱琴海花园'),
    body: t('A 3D garden planner in the colors of the Aegean: white walls, blue accents, terracotta, and bougainvillea. Soft shadows and open spacing keep the planting scene in focus.', '在白墙、赤陶与爱琴海蓝之间规划一座 3D 花园。九重葛的洋红点缀其中，浅浅的投影和舒展的留白，让植物与造景成为画面的中心。'),
  },
  {
    id: 'antigrav-racer', cat: 'game', demo: 'antigrav-racer', cover: poster('frontend/antigrav-racer'), hue: ['#0d1b2e', '#c9a86a'],
    title: t('Anti-Gravity Racing', '反重力竞速'),
    body: t('A hovercraft races along a suspended track in deep space. The white-and-orange vehicle banks into turns, leaving blue thruster trails and white speed lines behind it.', '白橙相间的悬浮赛车沿深空轨道疾驰，过弯时车身向一侧倾斜。淡蓝推进光带与白色速度线拖在身后，勾出行驶的轨迹。'),
  },
  {
    id: 'lunar-rover', cat: 'tool', demo: 'lunar-rover', cover: poster('frontend/lunar-rover'), hue: ['#2b2f3a', '#d8b36a'],
    title: t('Lunar Rover Console', '月海探测器'),
    body: t('Explore a lunar landscape from follow, side, overhead, and front cameras. A mythology-inspired console tracks mission goals, power, temperature, wheel load, and alerts.', '驾驶巡视车穿过灰沙、陨石坑与岩石，在跟随、侧视、俯视和正面镜头间切换。东方神话风格的控制台同步显示任务、电量、温度、车轮载荷与告警。'),
  },
  {
    id: 'brutal-player', cat: 'design', demo: 'brutal-player', demoEn: true, cover: poster('frontend/brutal-player'), hue: ['#0a0a0a', '#e8e8e8'],
    title: t('Brutalist 3D Music Player', '粗野主义 3D 音乐播放器'),
    body: t('A music player built around a draggable 3D wireframe with album labels on its faces. Black backgrounds, monospaced type, and hard borders carry through the library, track details, and video views.', '将专辑放在线框几何体上，拖动旋转即可浏览。纯黑背景、等宽字体和硬线边框贯穿曲库、详情与视频视图，形成克制的粗野主义风格。'),
  },
  {
    id: 'inline4-engine', cat: 'design', demo: 'inline4-engine', demoEn: true, video: video('frontend/inline4-engine'), poster: poster('frontend/inline4-engine'), size: [1920, 822], hue: ['#1a1a5e', '#ff3d6e'],
    title: t('Four-Cylinder Engine', '四缸发动机'),
    body: t('A four-cylinder engine simulation rendered in the comic-book style of *Spider-Man: Into the Spider-Verse*. Bold primary colors and sharp contrasts make the mechanical motion the focus.', '用《蜘蛛侠：平行宇宙》式的漫画风格呈现四缸发动机运转。鲜明的原色与强烈对比，让机械运动成为画面的主角。'),
  },
  {
    id: 'three-bodies', cat: 'viz', demo: 'three-bodies', video: video('frontend/three-bodies'), poster: poster('frontend/three-bodies'), size: [1920, 822], hue: ['#2a1f0a', '#e3b341'],
    title: t('Three-Body Orbits in Gold', '金色三体轨道'),
    body: t('The model integrates the three-body equations of motion numerically in under 100,000 steps, then renders the orbits in Three.js as glowing gold threads in the decorative style of Klimt’s *The Kiss*.', '模型在 10 万步以内数值求解三体运动方程，再用 Three.js 把三条轨道渲染成发光的金丝线，整体取法克里姆特《吻》的金色装饰风格。'),
  },
]
