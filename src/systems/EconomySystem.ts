export interface PlayerSave {
  coins: number;
  unlockedWeapons: string[];
  equippedWeapon: string;
  purchasedCharacters: string[];
  ladderClears: number;
}

export function createPlayerSave(): PlayerSave {
  return {
    coins: 0,
    unlockedWeapons: ['toy_fish'],
    equippedWeapon: 'toy_fish',
    purchasedCharacters: [],
    ladderClears: 0,
  };
}

export function purchaseCharacter(save: PlayerSave, charId: string, price: number): PlayerSave {
  if (save.purchasedCharacters.includes(charId)) return save;
  if (!canAfford(save, price)) return save;
  return {
    ...save,
    coins: save.coins - price,
    purchasedCharacters: [...save.purchasedCharacters, charId],
  };
}

export function addCoins(save: PlayerSave, amount: number): PlayerSave {
  return { ...save, coins: save.coins + amount };
}

export function canAfford(save: PlayerSave, price: number): boolean {
  return save.coins >= price;
}

export function purchaseWeapon(save: PlayerSave, weaponId: string, price: number): PlayerSave {
  if (save.unlockedWeapons.includes(weaponId)) return save;
  if (!canAfford(save, price)) return save;
  return {
    ...save,
    coins: save.coins - price,
    unlockedWeapons: [...save.unlockedWeapons, weaponId],
  };
}

export function equipWeapon(save: PlayerSave, weaponId: string): PlayerSave {
  if (!save.unlockedWeapons.includes(weaponId)) return save;
  return { ...save, equippedWeapon: weaponId };
}
