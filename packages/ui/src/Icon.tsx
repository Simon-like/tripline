import type { ReactElement } from 'react';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

/**
 * 旅迹内联 SVG 图标系统（Expressive Pop：stroke ≈ 2、round cap/join、几何粗圆）。
 *
 * 背景：iOS 26 Emoji 字体级联回归（RN #56183 / xcodes #468）导致 RN `<Text>`
 * 中的 Emoji 渲染为 [?]，应用内所有图标位统一改用本组件。
 *
 * - 24×24 viewBox，stroke 风格；颜色语义等价 currentColor，由调用方显式传入
 * - 不做主题耦合，packages/ui 保持零运行时依赖反转（react-native-svg 为 peer）
 * - react-native-svg 在 iOS / Android / Web 三端均可渲染
 */
export const iconNames = [
  // Tab 栏
  'luggage',
  'map',
  'wallet',
  'notebook',
  'plane',
  // 清单分类
  'id-card',
  'train',
  'home',
  'plug',
  'pill',
  'shirt',
  'bankcard',
  'sparkle',
  // 装饰与功能
  'sun',
  'mountain',
  'party',
  'plus',
  'check',
  'chevron-left',
] as const;

export type IconName = (typeof iconNames)[number];

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
};

const paths: Record<IconName, ReactElement> = {
  // 行李箱：箱体 + 拉杆 + 提手 + 滚轮
  luggage: (
    <>
      <Rect x={5.5} y={8} width={13} height={11} rx={3.5} />
      <Path d="M9.5 8V5.5a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2V8" />
      <Path d="M12 11v5" />
      <Path d="M9 19v1.5M15 19v1.5" />
    </>
  ),
  // 折页地图
  map: (
    <>
      <Path d="M9 4 3.6 5.8A1 1 0 0 0 3 6.8v12.4a1 1 0 0 0 1.4.9L9 18.5l6 2 5.4-1.7a1 1 0 0 0 .6-1V5.4a1 1 0 0 0-1.4-.9L15 6.2 9 4Z" />
      <Path d="M9 4v14.5" />
      <Path d="M15 6.2v13.8" />
    </>
  ),
  // 钱包：主体 + 搭扣
  wallet: (
    <>
      <Path d="M5 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6.5A2.5 2.5 0 0 1 4 17.5v-11A2.5 2.5 0 0 1 6.5 4H18v3" />
      <Path d="M15.5 13.5h5v4h-5a2 2 0 0 1 0-4Z" />
    </>
  ),
  // 手账：本子 + 书脊 + 行线
  notebook: (
    <>
      <Rect x={5} y={3.5} width={14} height={17} rx={3} />
      <Path d="M9.5 3.5v17" />
      <Path d="M13 8.5h3" />
      <Path d="M13 12.5h3" />
    </>
  ),
  // 返程飞机（起飞姿态 + 地面线）
  plane: (
    <>
      <Path d="M3 20h18" />
      <Path d="M6.2 13.8l4.3 1.2 6.4-3.3a2.3 2.3 0 0 1 2.9.6l.6.8-11.4 5.9-4.2-1.2a2.2 2.2 0 0 1-1.1-3.4l2.5-.6Z" />
      <Path d="M9.5 14.5 7.8 10.6l2.3-.6 3.4 2.4" />
    </>
  ),
  // 证件卡：卡片 + 头像 + 信息线
  'id-card': (
    <>
      <Rect x={3} y={5} width={18} height={14} rx={3} />
      <Circle cx={8.6} cy={10.4} r={2} />
      <Path d="M5.6 15.6a3.2 3.2 0 0 1 6 0" />
      <Path d="M14.5 9.5H18" />
      <Path d="M14.5 13H18" />
    </>
  ),
  // 火车头：车身 + 车窗线 + 车灯 + 轨道
  train: (
    <>
      <Rect x={5} y={3} width={14} height={13.5} rx={3.5} />
      <Path d="M5 10h14" />
      <Path d="M9.2 13.4h.01" />
      <Path d="M14.8 13.4h.01" />
      <Path d="M8.5 16.5 7 20.5" />
      <Path d="M15.5 16.5 17 20.5" />
    </>
  ),
  // 房屋
  home: (
    <>
      <Path d="m3.5 10.5 8.5-7 8.5 7" />
      <Path d="M5.5 8.8V19a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5V8.8" />
      <Path d="M9.8 20.5v-6h4.4v6" />
    </>
  ),
  // 插头
  plug: (
    <>
      <Path d="M9.5 2.5V7" />
      <Path d="M14.5 2.5V7" />
      <Path d="M6.5 7h11v4.5a5.5 5.5 0 0 1-11 0V7Z" />
      <Path d="M12 17v4.5" />
    </>
  ),
  // 胶囊
  pill: (
    <>
      <Path d="m10.4 20.4 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
      <Path d="m8.4 8.4 7.2 7.2" />
    </>
  ),
  // T 恤
  shirt: (
    <Path d="M20.4 3.5 16 2a4 4 0 0 1-8 0L3.6 3.5a2 2 0 0 0-1.3 2.2l.6 3.5a1 1 0 0 0 1 .8H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.1a1 1 0 0 0 1-.8l.6-3.5a2 2 0 0 0-1.3-2.2Z" />
  ),
  // 银行卡：卡面 + 磁条
  bankcard: (
    <>
      <Rect x={3} y={5.5} width={18} height={13} rx={3} />
      <Path d="M3 10h18" />
      <Path d="M7 14.5h4" />
    </>
  ),
  // 四角星芒（通用装饰）
  sparkle: (
    <Path d="M12 3.5 13.9 9a2.2 2.2 0 0 0 1.4 1.4L20.5 12l-5.2 1.6a2.2 2.2 0 0 0-1.4 1.4L12 20.5l-1.9-5.5a2.2 2.2 0 0 0-1.4-1.4L3.5 12l5.2-1.6a2.2 2.2 0 0 0 1.4-1.4L12 3.5Z" />
  ),
  // 太阳（倒计时）
  sun: (
    <>
      <Circle cx={12} cy={12} r={4} />
      <Path d="M12 2.5V5" />
      <Path d="M12 19v2.5" />
      <Path d="M4.9 4.9 6.7 6.7" />
      <Path d="M17.3 17.3l1.8 1.8" />
      <Path d="M2.5 12H5" />
      <Path d="M19 12h2.5" />
      <Path d="M4.9 19.1l1.8-1.8" />
      <Path d="M17.3 6.7l1.8-1.8" />
    </>
  ),
  // 山峰（首页旅程意境）
  mountain: (
    <>
      <Path d="m8 3.5 4 8 5-5 5 14.5H2L8 3.5Z" />
      <Path d="m9.5 8.5 1.4 1.4a1.6 1.6 0 0 0 2.2 0L14.5 8.5" />
    </>
  ),
  // 庆祝礼花筒
  party: (
    <>
      <Path d="M5.9 11.4 2.5 21.5l10.1-3.4" />
      <Path d="M11.5 13c1.9 1.9 2.7 4 2 4.8-.7.7-2.9-.1-4.8-2-1.9-1.9-2.7-4-2-4.8.7-.7 2.9.1 4.8 2Z" />
      <Path d="M14.5 9.5c-1.5-2.5-.5-5 1-6.5" />
      <Path d="M18.5 5.5c1.5 2 .5 4-1 5.5" />
      <Path d="M20.5 3h.01" />
      <Path d="M21 9h.01" />
      <Path d="M15 3h.01" />
    </>
  ),
  // 加号
  plus: (
    <>
      <Path d="M12 5v14" />
      <Path d="M5 12h14" />
    </>
  ),
  // 对勾（完成态备用）
  check: <Path d="M20 6.5 9.2 17.5 4 12.3" />,
  // 返回箭头
  'chevron-left': <Path d="m14.5 6-6 6 6 6" />,
};

export function Icon({ name, size = 24, color = 'currentColor' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" color={color}>
      <G stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        {paths[name]}
      </G>
    </Svg>
  );
}
