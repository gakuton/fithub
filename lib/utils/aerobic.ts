import { ACTIVITY_TYPE_LABELS, INTENSITY_OPTIONS, type ActivityType } from '@/lib/validations/aerobic';

export function formatAerobicRow(session: {
  activityType: string;
  intensity: string;
  durationMin: number;
  kcalBurned: number;
  distanceKm?: number | null;
}): string {
  const typeLabel = ACTIVITY_TYPE_LABELS[session.activityType as ActivityType] ?? session.activityType;
  const intensityOpts = INTENSITY_OPTIONS[session.activityType as ActivityType] ?? [];
  const intensityLabel = intensityOpts.find((o) => o.value === session.intensity)?.label ?? session.intensity;
  let text = `${typeLabel}（${intensityLabel}）　${session.durationMin}分　消費: ${Math.round(session.kcalBurned)}kcal`;
  if (session.distanceKm) text += `　/ ${session.distanceKm}km`;
  return text;
}

const MET_TABLE: Record<string, Record<string, number>> = {
  walking: { moderate: 3.5, brisk: 5.0 },
  running: { slow: 8.3,     moderate: 10.0 },
  tennis:  { doubles: 5.0,  singles: 7.3 },
};

function calcAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

type CalcInput = {
  activityType: string;
  durationMin:  number;
  intensity:    string;
  distanceKm?:  number;
  avgHeartRate?: number;
  weightKg:     number;
  gender?:      string | null;
  birthDate?:   string | null;
};

export function calcKcalBurned(input: CalcInput): number {
  const hours = input.durationMin / 60;

  // 1. Keytel 式（心拍数・性別・生年月日が揃っている場合）
  if (input.avgHeartRate && input.gender && input.birthDate) {
    const age = calcAge(input.birthDate);
    const hr  = input.avgHeartRate;
    const w   = input.weightKg;
    const kcal = input.gender === 'male'
      ? (-55.0969 + 0.6309 * hr + 0.1988 * w + 0.2017 * age) * input.durationMin / 4.184
      : (-20.4022 + 0.4472 * hr + 0.1263 * w + 0.074  * age) * input.durationMin / 4.184;
    if (kcal > 0) return Math.round(kcal);
  }

  // 2. ACSM 式（距離 + 時間がある場合 / ウォーキング・ランニングのみ）
  if (
    input.distanceKm &&
    (input.activityType === 'walking' || input.activityType === 'running')
  ) {
    const speedMpm = (input.distanceKm / input.durationMin) * 1000;
    const vo2 = speedMpm <= 133.3
      ? 0.1 * speedMpm + 3.5  // ウォーキング式
      : 0.2 * speedMpm + 3.5; // ランニング式
    const met = vo2 / 3.5;
    return Math.round(met * input.weightKg * hours);
  }

  // 3. 固定 MET 値（フォールバック）
  const met = MET_TABLE[input.activityType]?.[input.intensity] ?? 5.0;
  return Math.round(met * input.weightKg * hours);
}
