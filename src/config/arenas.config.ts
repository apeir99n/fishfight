export interface ArenaLayer {
  type: 'rect' | 'gradient' | 'wave';
  y: number;
  height: number;
  color: number;
  alpha?: number;
}

export interface ArenaDef {
  id: string;
  name: string;
  bgColor: string;
  floorColor: number;
  floorY: number;
  koZones: {
    left: number;
    right: number;
    top: number;
  };
  layers: ArenaLayer[];
}

const ARENAS: ArenaDef[] = [
  {
    id: 'sea',
    name: 'Sea',
    bgColor: '#1a3a5c',
    floorColor: 0xc2a060,
    floorY: 400,
    koZones: { left: -50, right: 850, top: -100 },
    layers: [
      { type: 'rect', y: 0, height: 180, color: 0x2d5a8a },
      { type: 'rect', y: 180, height: 30, color: 0x4a7fad, alpha: 0.8 },
      { type: 'rect', y: 210, height: 140, color: 0x1a4a7a },
      { type: 'rect', y: 350, height: 50, color: 0x2a6a9a, alpha: 0.7 },
      { type: 'rect', y: 395, height: 10, color: 0xa08850 },
      { type: 'rect', y: 400, height: 50, color: 0xc2a060 },
    ],
  },
  {
    id: 'market',
    name: 'Fish Market',
    bgColor: '#2a1a0a',
    floorColor: 0x8a7a6a,
    floorY: 400,
    koZones: { left: -50, right: 850, top: -100 },
    layers: [
      // Ceiling / dark interior
      { type: 'rect', y: 0, height: 80, color: 0x1a1208 },
      // Hanging lights strip
      { type: 'rect', y: 80, height: 5, color: 0xffcc44, alpha: 0.6 },
      // Wall — tile pattern
      { type: 'rect', y: 85, height: 160, color: 0x3a3028 },
      // Counter / display case
      { type: 'rect', y: 245, height: 40, color: 0x556688 },
      // Ice display
      { type: 'rect', y: 285, height: 20, color: 0xaaccdd, alpha: 0.7 },
      // Counter front
      { type: 'rect', y: 305, height: 50, color: 0x4a4a4a },
      // Wet floor
      { type: 'rect', y: 355, height: 45, color: 0x5a5a5a, alpha: 0.8 },
      // Floor — stone tiles
      { type: 'rect', y: 400, height: 50, color: 0x8a7a6a },
    ],
  },
  {
    id: 'ship',
    name: 'Ship',
    bgColor: '#0a1a2a',
    floorColor: 0x6a4a2a,
    floorY: 400,
    koZones: { left: -50, right: 850, top: -100 },
    layers: [
      // Night sky
      { type: 'rect', y: 0, height: 120, color: 0x0a0a2a },
      // Stars strip (decorative)
      { type: 'rect', y: 30, height: 2, color: 0xffffff, alpha: 0.3 },
      { type: 'rect', y: 60, height: 2, color: 0xffffff, alpha: 0.2 },
      // Horizon — dark ocean
      { type: 'rect', y: 120, height: 80, color: 0x0a2a4a },
      // Ship railing
      { type: 'rect', y: 200, height: 8, color: 0x8a6a3a },
      // Ship hull — upper deck
      { type: 'rect', y: 208, height: 80, color: 0x5a3a1a },
      // Rope / netting line
      { type: 'rect', y: 288, height: 3, color: 0x9a8a5a, alpha: 0.6 },
      // Cargo area
      { type: 'rect', y: 291, height: 60, color: 0x4a3020 },
      // Wet planks
      { type: 'rect', y: 351, height: 49, color: 0x5a4030, alpha: 0.9 },
      // Deck floor — wooden planks
      { type: 'rect', y: 400, height: 50, color: 0x6a4a2a },
    ],
  },
  {
    id: 'restaurant',
    name: 'Restaurant',
    bgColor: '#1a0a0a',
    floorColor: 0x4a4a4a,
    floorY: 400,
    koZones: { left: -50, right: 850, top: -100 },
    layers: [
      // Kitchen ceiling — dark with vent
      { type: 'rect', y: 0, height: 60, color: 0x1a1a1a },
      // Vent / hood strip
      { type: 'rect', y: 60, height: 15, color: 0x888888, alpha: 0.5 },
      // Kitchen wall — white tile
      { type: 'rect', y: 75, height: 120, color: 0xdadada },
      // Red accent stripe (restaurant style)
      { type: 'rect', y: 195, height: 8, color: 0xcc3333 },
      // Lower wall — stainless steel
      { type: 'rect', y: 203, height: 80, color: 0xaaaaaa },
      // Counter with cutting board
      { type: 'rect', y: 283, height: 30, color: 0x8a7a5a },
      // Stove / heat glow
      { type: 'rect', y: 313, height: 20, color: 0xff6622, alpha: 0.3 },
      // Lower kitchen — dark
      { type: 'rect', y: 333, height: 67, color: 0x3a3a3a },
      // Kitchen floor — checkered tile
      { type: 'rect', y: 400, height: 50, color: 0x4a4a4a },
    ],
  },
];

// Maps fight number to arena id
const FIGHT_ARENA_MAP: Record<number, string> = {
  1: 'sea', 2: 'sea', 3: 'sea',
  4: 'market', 5: 'market',
  6: 'ship', 7: 'ship',
  8: 'restaurant', 9: 'restaurant', 10: 'restaurant',
};

export function getArena(id: string): ArenaDef | undefined {
  return ARENAS.find(a => a.id === id);
}

export function getAllArenas(): ArenaDef[] {
  return [...ARENAS];
}

export function getArenaForFight(fightNumber: number): string {
  return FIGHT_ARENA_MAP[fightNumber] || 'sea';
}
