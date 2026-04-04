// エプリー式: weight × (1 + reps / 30)、小数点2桁で四捨五入
export function calcEstimated1rm(weightKg: number, reps: number): number {
  return Math.round(weightKg * (1 + reps / 30) * 100) / 100;
}
