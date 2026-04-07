export interface WeaponDef {
  id: string;
  name: string;
  type: 'melee' | 'ranged';
  damage: number;
  knockback: number;
  range: number;
  attackSpeed: number;
  cooldown: number;
  projectileSpeed?: number;
  price: number;
}

export interface Projectile {
  x: number;
  y: number;
  velocityX: number;
  damage: number;
  knockback: number;
}

export interface WeaponState {
  weaponId: string;
  cooldownRemaining: number;
  projectiles: Projectile[];
}

export interface MeleeHit {
  damage: number;
  knockback: number;
  rangeX: number;
}

export interface FireResult {
  state: WeaponState;
  meleeHit: MeleeHit | null;
}

const WEAPONS: WeaponDef[] = [
  {
    id: 'toy_fish',
    name: 'Toy Fish',
    type: 'melee',
    damage: 10,
    knockback: 60,
    range: 50,
    attackSpeed: 0.3,
    cooldown: 0.3,
    price: 0,
  },
  {
    id: 'pufferfish_cannon',
    name: 'Pufferfish Cannon',
    type: 'ranged',
    damage: 8,
    knockback: 50,
    range: 800,
    attackSpeed: 0.4,
    cooldown: 1,
    projectileSpeed: 400,
    price: 100,
  },
];

export function getWeapon(id: string): WeaponDef | undefined {
  return WEAPONS.find(w => w.id === id);
}

export function getAllWeapons(): WeaponDef[] {
  return [...WEAPONS];
}

export function createWeaponState(weaponId: string): WeaponState {
  return {
    weaponId,
    cooldownRemaining: 0,
    projectiles: [],
  };
}

export function fireWeapon(
  state: WeaponState,
  x: number,
  y: number,
  facingRight: boolean,
): FireResult {
  const weapon = getWeapon(state.weaponId);
  if (!weapon || state.cooldownRemaining > 0) {
    return { state, meleeHit: null };
  }

  const newState: WeaponState = {
    ...state,
    cooldownRemaining: weapon.cooldown,
  };

  if (weapon.type === 'melee') {
    return {
      state: newState,
      meleeHit: {
        damage: weapon.damage,
        knockback: weapon.knockback,
        rangeX: weapon.range,
      },
    };
  }

  // Ranged — spawn projectile
  const dir = facingRight ? 1 : -1;
  const proj: Projectile = {
    x,
    y,
    velocityX: weapon.projectileSpeed! * dir,
    damage: weapon.damage,
    knockback: weapon.knockback,
  };

  return {
    state: { ...newState, projectiles: [...state.projectiles, proj] },
    meleeHit: null,
  };
}

export function updateProjectiles(
  state: WeaponState,
  dt: number,
  arenaWidth: number,
): WeaponState {
  const movedProjectiles = state.projectiles
    .map(p => ({ ...p, x: p.x + p.velocityX * dt }))
    .filter(p => p.x >= -50 && p.x <= arenaWidth + 50);

  return {
    ...state,
    projectiles: movedProjectiles,
    cooldownRemaining: Math.max(0, state.cooldownRemaining - dt),
  };
}

export function checkProjectileHit(
  proj: Projectile,
  targetX: number,
  targetY: number,
  hitRadius: number,
): boolean {
  const dx = proj.x - targetX;
  const dy = proj.y - targetY;
  return Math.sqrt(dx * dx + dy * dy) <= hitRadius;
}
