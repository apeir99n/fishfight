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
    koZones: {
      left: -50,
      right: 850,
      top: -100,
    },
    layers: [
      // Sky gradient (top)
      { type: 'rect', y: 0, height: 180, color: 0x2d5a8a, alpha: 1 },
      // Horizon glow
      { type: 'rect', y: 180, height: 30, color: 0x4a7fad, alpha: 0.8 },
      // Ocean
      { type: 'rect', y: 210, height: 140, color: 0x1a4a7a, alpha: 1 },
      // Shallow water
      { type: 'rect', y: 350, height: 50, color: 0x2a6a9a, alpha: 0.7 },
      // Wet sand
      { type: 'rect', y: 395, height: 10, color: 0xa08850, alpha: 1 },
      // Sand/beach floor
      { type: 'rect', y: 400, height: 50, color: 0xc2a060, alpha: 1 },
    ],
  },
];

export function getArena(id: string): ArenaDef | undefined {
  return ARENAS.find(a => a.id === id);
}

export function getAllArenas(): ArenaDef[] {
  return [...ARENAS];
}
