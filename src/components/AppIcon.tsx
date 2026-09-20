import React from 'react';
import Svg, { Circle, Line, Path, Polyline, Rect } from 'react-native-svg';

export type IconName = 'search' | 'home' | 'journal' | 'plus' | 'chart' | 'profile' | 'camera' | 'type' | 'list' | 'trash' | 'chevron' | 'sparkle' | 'target' | 'info' | 'check' | 'volume' | 'stop'
  // V1.8 — navigation par date, lecteur de séquences, poids et export.
  | 'play' | 'pause' | 'close' | 'chevronLeft' | 'calendar' | 'weight' | 'film' | 'download' | 'edit' | 'repeat' | 'steps';

type Props = { name: IconName; size?: number; color?: string; strokeWidth?: number };

export function AppIcon({ name, size = 24, color = '#183230', strokeWidth = 1.8 }: Props) {
  const common = { fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden>
      {name === 'search' && <><Circle cx="10.5" cy="10.5" r="6.5" {...common} /><Line x1="15.5" y1="15.5" x2="21" y2="21" {...common} /></>}
      {name === 'home' && <><Path d="M3.5 10.8 12 3.8l8.5 7" {...common} /><Path d="M5.7 9.7v10h12.6v-10M9.5 19.7v-6h5v6" {...common} /></>}
      {name === 'journal' && <><Rect x="4.5" y="3.5" width="15" height="17" rx="2.5" {...common} /><Line x1="8" y1="8" x2="16" y2="8" {...common} /><Line x1="8" y1="12" x2="16" y2="12" {...common} /><Line x1="8" y1="16" x2="13" y2="16" {...common} /></>}
      {name === 'plus' && <><Line x1="12" y1="5" x2="12" y2="19" {...common} /><Line x1="5" y1="12" x2="19" y2="12" {...common} /></>}
      {name === 'chart' && <><Line x1="5" y1="19" x2="5" y2="13" {...common} /><Line x1="12" y1="19" x2="12" y2="5" {...common} /><Line x1="19" y1="19" x2="19" y2="9" {...common} /></>}
      {name === 'profile' && <><Circle cx="12" cy="8" r="3.5" {...common} /><Path d="M5 20c.8-4 3.1-6 7-6s6.2 2 7 6" {...common} /></>}
      {name === 'camera' && <><Path d="M4 8.5h3l1.5-2h7l1.5 2h3v10H4z" {...common} /><Circle cx="12" cy="13.5" r="3" {...common} /></>}
      {name === 'type' && <><Line x1="5" y1="6" x2="19" y2="6" {...common} /><Line x1="12" y1="6" x2="12" y2="19" {...common} /><Line x1="8.5" y1="19" x2="15.5" y2="19" {...common} /></>}
      {name === 'list' && <><Line x1="9" y1="7" x2="20" y2="7" {...common} /><Line x1="9" y1="12" x2="20" y2="12" {...common} /><Line x1="9" y1="17" x2="20" y2="17" {...common} /><Circle cx="5" cy="7" r=".7" fill={color} /><Circle cx="5" cy="12" r=".7" fill={color} /><Circle cx="5" cy="17" r=".7" fill={color} /></>}
      {name === 'trash' && <><Path d="M5 7h14M9 7V4h6v3M7.5 7l.8 13h7.4l.8-13" {...common} /><Line x1="10" y1="11" x2="10.5" y2="17" {...common} /><Line x1="14" y1="11" x2="13.5" y2="17" {...common} /></>}
      {name === 'chevron' && <Polyline points="9 5 16 12 9 19" {...common} />}
      {name === 'sparkle' && <><Path d="M12 3c.5 4.6 2.4 6.5 7 7-4.6.5-6.5 2.4-7 7-.5-4.6-2.4-6.5-7-7 4.6-.5 6.5-2.4 7-7Z" {...common} /><Path d="M19 15c.2 1.8 1 2.6 2.8 2.8-1.8.2-2.6 1-2.8 2.8-.2-1.8-1-2.6-2.8-2.8 1.8-.2 2.6-1 2.8-2.8Z" {...common} /></>}
      {name === 'target' && <><Circle cx="12" cy="12" r="8.5" {...common} /><Circle cx="12" cy="12" r="4.5" {...common} /><Circle cx="12" cy="12" r="1" fill={color} /></>}
      {name === 'info' && <><Circle cx="12" cy="12" r="9" {...common} /><Line x1="12" y1="11" x2="12" y2="17" {...common} /><Circle cx="12" cy="7.5" r=".8" fill={color} /></>}
      {name === 'check' && <Path d="m5 12.5 4.2 4.2L19 7" {...common} />}
      {name === 'volume' && <><Path d="M4 9h4l5-4v14l-5-4H4zM16 8c3 2 3 6 0 8M19 5c5 4 5 10 0 14" {...common} /></>}
      {name === 'stop' && <Rect x="5" y="5" width="14" height="14" rx="3" fill={color} />}
      {name === 'play' && <Path d="M8 5.5 18 12 8 18.5Z" fill={color} stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />}
      {name === 'pause' && <><Rect x="7" y="5" width="3.6" height="14" rx="1.4" fill={color} /><Rect x="13.4" y="5" width="3.6" height="14" rx="1.4" fill={color} /></>}
      {name === 'close' && <><Line x1="6" y1="6" x2="18" y2="18" {...common} /><Line x1="18" y1="6" x2="6" y2="18" {...common} /></>}
      {name === 'chevronLeft' && <Polyline points="15 5 8 12 15 19" {...common} />}
      {name === 'calendar' && <><Rect x="4" y="5.5" width="16" height="15" rx="3" {...common} /><Line x1="4" y1="10" x2="20" y2="10" {...common} /><Line x1="8.5" y1="3.5" x2="8.5" y2="7" {...common} /><Line x1="15.5" y1="3.5" x2="15.5" y2="7" {...common} /></>}
      {name === 'weight' && <><Path d="M5.6 8h12.8l1.6 11.5a1.5 1.5 0 0 1-1.5 1.5H5.5a1.5 1.5 0 0 1-1.5-1.5Z" {...common} /><Path d="M9 8a3 3 0 0 1 6 0" {...common} /><Path d="M12 12v3.2M12 15.2l2.4-1.4" {...common} /></>}
      {name === 'film' && <><Rect x="3.5" y="5" width="17" height="14" rx="3" {...common} /><Path d="M10 9.2 14.8 12 10 14.8Z" fill={color} stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" /></>}
      {name === 'download' && <><Path d="M12 4v10.5M8 11.5l4 4 4-4" {...common} /><Path d="M5 17.5v1.5a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5v-1.5" {...common} /></>}
      {name === 'edit' && <><Path d="M15.2 4.8a2 2 0 0 1 2.8 2.8L8.6 17 4.5 18.2l1.2-4.1Z" {...common} /><Line x1="13.4" y1="6.6" x2="16.2" y2="9.4" {...common} /></>}
      {name === 'repeat' && <><Path d="M4.5 12a7.5 7.5 0 0 1 13-5" {...common} /><Path d="M19.5 12a7.5 7.5 0 0 1-13 5" {...common} /><Polyline points="17.5 3.4 17.5 7.4 13.5 7.4" {...common} /><Polyline points="6.5 20.6 6.5 16.6 10.5 16.6" {...common} /></>}
      {name === 'steps' && <><Path d="M7.5 4.5c1.7 0 2.6 1.4 2.4 3.4-.2 2-.6 3.3-2.3 3.3S5 9.8 5.2 7.6C5.4 5.6 5.8 4.5 7.5 4.5Z" {...common} /><Path d="M6 12.8h3.3c.5 1 .4 2.2-.2 2.8-.8.8-2.5.7-3.1-.2-.4-.7-.4-1.8 0-2.6Z" {...common} /><Path d="M16.5 8.8c1.7 0 2.6 1.4 2.4 3.4-.2 2-.6 3.3-2.3 3.3S14 14.1 14.2 11.9c.2-2 .6-3.1 2.3-3.1Z" {...common} /><Path d="M15 17.1h3.3c.5 1 .4 2.2-.2 2.8-.8.8-2.5.7-3.1-.2-.4-.7-.4-1.8 0-2.6Z" {...common} /></>}
    </Svg>
  );
}
