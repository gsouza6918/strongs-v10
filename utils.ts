import { ConfTier, GameScore, Member, Top100Entry } from './types';

export const getTierMultiplier = (tier: ConfTier): number => {
  switch (tier) {
    case ConfTier.SUPREME: return 1.5;
    case ConfTier.DIAMOND: return 1.2;
    default: return 1.0;
  }
};

export const calculateMemberPoints = (member: Member, tier: ConfTier): number => {
  let total = 0;
  const multiplier = getTierMultiplier(tier);

  member.weeks.forEach(week => {
    week.games.forEach(game => {
      // Result Points (Multiplied)
      let resultPoints = 0;
      if (game.result === 'WIN') resultPoints = 3;
      else if (game.result === 'DRAW') resultPoints = 1;
      
      total += (resultPoints * multiplier);

      // Attendance Points (Not Multiplied)
      if (game.attendance === 'PRESENT') total += 3;
      else if (game.attendance === 'ABSENT') total += 1;
      else if (game.attendance === 'NO_TRAIN') total -= 6;
    });
  });

  return Math.round(total * 100) / 100; // Round to 2 decimals
};

export const calculateTop100Points = (rank: number): { points: number, bonus: number } => {
  const basePoints = Math.max(0, 101 - rank);
  let bonus = 0;

  if (rank === 1) bonus = 100;
  else if (rank === 2) bonus = 60;
  else if (rank === 3) bonus = 40;
  else if (rank >= 4 && rank <= 10) bonus = 20;
  else if (rank >= 11 && rank <= 20) bonus = 10;
  else if (rank >= 21 && rank <= 100) bonus = 5;

  return { points: basePoints, bonus };
};