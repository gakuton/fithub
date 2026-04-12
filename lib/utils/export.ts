// ─── プロフィール付記 ─────────────────────────────────

type BodyComposition = {
  measuredDate: string;
  weightKg: number;
  bodyFatPct: number | null;
  skeletalMuscleKg: number | null;
  bmr: number | null;
};

type DemographicData = {
  gender: string | null;
  heightCm: number | null;
  birthDate: string | null;
  activityLevel: string | null;
};

type MotivationData = {
  category: string | null;
  description: string | null;
};

const GENDER_LABELS_MAP: Record<string, string> = {
  male: '男性', female: '女性', other: 'その他',
};

const ACTIVITY_LEVEL_LABELS_MAP: Record<string, string> = {
  sedentary:         'ほぼ座っている（デスクワーク中心）',
  lightly_active:    '軽度活動（週1〜2回の軽い運動）',
  moderately_active: '中度活動（週3〜4回の運動）',
  very_active:       '高度活動（週5回以上の激しい運動）',
  extra_active:      '超高度活動（アスリート・肉体労働）',
};

const MOTIVATION_CATEGORY_LABELS_MAP: Record<string, string> = {
  cut: '減量', bulk: '増量', maintain: '現状維持',
};

function calcAgeFromBirth(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function buildProfileText(
  body: BodyComposition | null,
  demog: DemographicData | null,
  motivation: MotivationData | null,
): string {
  const lines: string[] = [];

  if (body) {
    lines.push('---');
    lines.push('【最新の体組成】');
    const parts = [`測定日：${formatJpDate(body.measuredDate)}`, `体重：${body.weightKg}kg`];
    if (body.bodyFatPct        !== null) parts.push(`体脂肪率：${body.bodyFatPct}%`);
    if (body.skeletalMuscleKg  !== null) parts.push(`骨格筋量：${body.skeletalMuscleKg}kg`);
    lines.push(parts.join('　'));
    if (body.bmr !== null) lines.push(`基礎代謝：${body.bmr}kcal`);
  }

  const demogParts: string[] = [];
  if (demog?.gender)        demogParts.push(`性別：${GENDER_LABELS_MAP[demog.gender] ?? demog.gender}`);
  if (demog?.heightCm)      demogParts.push(`身長：${demog.heightCm}cm`);
  if (demog?.birthDate)     demogParts.push(`年齢：${calcAgeFromBirth(demog.birthDate)}歳`);
  if (demog?.activityLevel) demogParts.push(`活動レベル：${ACTIVITY_LEVEL_LABELS_MAP[demog.activityLevel] ?? demog.activityLevel}`);

  const motivParts: string[] = [];
  if (motivation?.category)    motivParts.push(MOTIVATION_CATEGORY_LABELS_MAP[motivation.category] ?? motivation.category);
  if (motivation?.description) motivParts.push(motivation.description);

  if (demogParts.length > 0 || motivParts.length > 0) {
    lines.push('---');
    lines.push('【プロフィール】');
    if (demogParts.length > 0) lines.push(demogParts.join('　'));
    if (motivParts.length > 0) lines.push(`目標：${motivParts.join(' ／ ')}`);
  }

  if (lines.length === 0) return '';
  lines.push('---');
  return '\n' + lines.join('\n');
}

// ─── 共通ユーティリティ ────────────────────────────────

function formatJpDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${y}年${parseInt(m)}月${parseInt(d)}日`;
}

// ─── 食事エクスポート型 ───────────────────────────────

type MealItem = {
  foodName: string | null;
  proteinG: number;
  fatG: number;
  carbG: number;
  kcal: number;
};

type MealGroup = {
  meal_type: string;
  items: MealItem[];
  subtotal: { kcal: number; protein_g: number; fat_g: number; carb_g: number };
};

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: '朝食',
  lunch:     '昼食',
  dinner:    '夕食',
  other:     'その他',
};

function buildMealGroupLines(groups: MealGroup[]): string[] {
  const lines: string[] = [];
  for (const group of groups) {
    const label = MEAL_TYPE_LABELS[group.meal_type] ?? group.meal_type;
    lines.push(`【${label}】`);
    for (const item of group.items) {
      const name = item.foodName ?? '-';
      lines.push(`  ${name}　P:${item.proteinG}g F:${item.fatG}g C:${item.carbG}g　${Math.round(item.kcal)}kcal`);
    }
    const s = group.subtotal;
    lines.push(`  小計：${Math.round(s.kcal)}kcal（P:${Math.round(s.protein_g)}g F:${Math.round(s.fat_g)}g C:${Math.round(s.carb_g)}g）`);
    lines.push('');
  }
  return lines;
}

// ─── 食事テキスト出力（日別）───────────────────────────

export function buildMealDayText(
  groups: MealGroup[],
  total: { kcal: number; protein_g: number; fat_g: number; carb_g: number },
  date: string,
  profile?: { body: BodyComposition | null; demog: DemographicData | null; motivation: MotivationData | null },
): string {
  const lines: string[] = [];
  lines.push('---');
  lines.push('FitHub 食事記録');
  lines.push(`日付：${formatJpDate(date)}`);
  lines.push('---');
  lines.push('');

  if (groups.length === 0) {
    lines.push('この日の記録はありません');
  } else {
    lines.push(...buildMealGroupLines(groups));
    lines.push(`合計：${Math.round(total.kcal)}kcal`);
    lines.push(`  P:${Math.round(total.protein_g)}g ／ F:${Math.round(total.fat_g)}g ／ C:${Math.round(total.carb_g)}g`);
  }
  lines.push('---');
  if (profile) lines.push(buildProfileText(profile.body, profile.demog, profile.motivation));
  return lines.join('\n');
}

// ─── 食事テキスト出力（週別）───────────────────────────

type WeekDayMeal = {
  date: string;
  groups: MealGroup[];
  total: { kcal: number; protein_g: number; fat_g: number; carb_g: number };
};

export function buildMealWeekText(
  days: WeekDayMeal[],
  weekStart: string,
  profile?: { body: BodyComposition | null; demog: DemographicData | null; motivation: MotivationData | null },
): string {
  const lines: string[] = [];
  lines.push('---');
  lines.push('FitHub 週間食事記録');
  lines.push(`週：${formatJpDate(weekStart)} 〜`);
  lines.push('---');
  lines.push('');

  for (const day of days) {
    if (day.groups.length === 0) continue;
    lines.push(`■ ${formatJpDate(day.date)}`);
    lines.push(...buildMealGroupLines(day.groups));
    lines.push(`  合計：${Math.round(day.total.kcal)}kcal（P:${Math.round(day.total.protein_g)}g F:${Math.round(day.total.fat_g)}g C:${Math.round(day.total.carb_g)}g）`);
    lines.push('');
  }
  lines.push('---');
  if (profile) lines.push(buildProfileText(profile.body, profile.demog, profile.motivation));
  return lines.join('\n');
}

// ─── 体組成テキスト出力 ──────────────────────────────────

type BodyRow = {
  measuredDate: string;
  weightKg: number;
  bodyFatPct: number | null;
  skeletalMuscleKg: number | null;
  bmr: number | null;
};

export function buildBodyText(rows: BodyRow[]): string {
  const lines: string[] = [];
  lines.push('---');
  lines.push('FitHub 体組成履歴');
  lines.push('---');
  lines.push('');
  lines.push('【体組成履歴】');

  const sorted = [...rows].sort((a, b) => b.measuredDate.localeCompare(a.measuredDate));
  for (const r of sorted) {
    const parts = [`体重 ${r.weightKg}kg`];
    if (r.bodyFatPct       !== null) parts.push(`体脂肪率 ${r.bodyFatPct}%`);
    if (r.skeletalMuscleKg !== null) parts.push(`骨格筋量 ${r.skeletalMuscleKg}kg`);
    if (r.bmr              !== null) parts.push(`基礎代謝 ${r.bmr}kcal`);
    lines.push(`${r.measuredDate}: ${parts.join(' / ')}`);
  }

  lines.push('---');
  return lines.join('\n');
}

export function downloadTxt(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── 今日のセット ────────────────────────────────────────

type SetRow = {
  setNumber: number;
  isBodyweight: boolean;
  weightKg: number | null;
  reps: number;
  estimated1rm: number | null;
};

type GroupedExercise = {
  exerciseName: string;
  category: string | null;
  sets: SetRow[];
};

export function buildTodayText(
  groups: GroupedExercise[],
  date: string,
  mealGroups?: MealGroup[],
  mealTotal?: { kcal: number; protein_g: number; fat_g: number; carb_g: number },
  profile?: { body: BodyComposition | null; demog: DemographicData | null; motivation: MotivationData | null },
): string {
  const lines: string[] = [];
  lines.push('---');
  lines.push('FitHub トレーニング記録');
  lines.push(`日付：${formatJpDate(date)}`);
  lines.push('---');
  lines.push('');

  let totalSets = 0;
  let totalVolume = 0;
  let maxRm: { value: number; name: string } | null = null;

  for (const group of groups) {
    const cat = group.category ? `（${group.category}）` : '';
    lines.push(`【${group.exerciseName}】${cat}`);
    for (const set of group.sets) {
      let line = `  セット${set.setNumber}：`;
      if (set.isBodyweight) {
        line += `自重 × ${set.reps}回`;
      } else {
        line += `${set.weightKg}kg × ${set.reps}回`;
        if (set.estimated1rm !== null) {
          line += `　推定1RM: ${set.estimated1rm}kg`;
        }
      }
      lines.push(line);
      totalSets++;
      if (!set.isBodyweight && set.weightKg) {
        totalVolume += set.weightKg * set.reps;
      }
      if (set.estimated1rm !== null && (maxRm === null || set.estimated1rm > maxRm.value)) {
        maxRm = { value: set.estimated1rm, name: group.exerciseName };
      }
    }
    lines.push('');
  }

  lines.push('サマリー：');
  lines.push(`  種目数：${groups.length}`);
  lines.push(`  総セット数：${totalSets}`);
  lines.push(`  総負荷量：${totalVolume.toLocaleString()}kg`);
  if (maxRm) {
    lines.push(`  最高推定1RM：${maxRm.value}kg（${maxRm.name}）`);
  }
  lines.push('---');

  // 食事データがあれば追記
  if (mealGroups && mealGroups.length > 0 && mealTotal) {
    lines.push('');
    lines.push('【食事記録】');
    lines.push(...buildMealGroupLines(mealGroups));
    lines.push(`合計：${Math.round(mealTotal.kcal)}kcal`);
    lines.push(`  P:${Math.round(mealTotal.protein_g)}g ／ F:${Math.round(mealTotal.fat_g)}g ／ C:${Math.round(mealTotal.carb_g)}g`);
    lines.push('---');
  }

  if (profile) lines.push(buildProfileText(profile.body, profile.demog, profile.motivation));

  return lines.join('\n');
}

// ─── 種目別セット ─────────────────────────────────────────

type ExerciseSet = {
  workoutDate: string;
  setNumber: number;
  isBodyweight: boolean;
  weightKg: number | null;
  reps: number;
  estimated1rm: number | null;
};

export function buildExerciseText(
  exercise: { name: string; category: string | null },
  sets: ExerciseSet[],
  max1rm: { value: number; date: string } | null,
  exportDate: string,
): string {
  const lines: string[] = [];
  const cat = exercise.category ? `（${exercise.category}）` : '';
  lines.push('---');
  lines.push('FitHub 種目別記録');
  lines.push(`種目：${exercise.name}${cat}`);
  lines.push(`出力日：${formatJpDate(exportDate)}`);
  lines.push('---');
  lines.push('');

  // 日付でグループ化（降順）
  const byDate = new Map<string, ExerciseSet[]>();
  for (const set of sets) {
    if (!byDate.has(set.workoutDate)) byDate.set(set.workoutDate, []);
    byDate.get(set.workoutDate)!.push(set);
  }
  const sortedDates = Array.from(byDate.keys()).sort((a, b) => b.localeCompare(a));

  for (const date of sortedDates) {
    lines.push(formatJpDate(date));
    const daySets = byDate.get(date)!.sort((a, b) => a.setNumber - b.setNumber);
    let dayMax: number | null = null;

    for (const set of daySets) {
      let line = `  セット${set.setNumber}：`;
      if (set.isBodyweight) {
        line += `自重 × ${set.reps}回`;
      } else {
        line += `${set.weightKg}kg × ${set.reps}回`;
        if (set.estimated1rm !== null) {
          line += `　推定1RM: ${set.estimated1rm}kg`;
          if (dayMax === null || set.estimated1rm > dayMax) dayMax = set.estimated1rm;
        }
      }
      lines.push(line);
    }
    if (dayMax !== null) {
      lines.push(`  最高1RM：${dayMax}kg`);
    }
    lines.push('');
  }

  if (max1rm) {
    lines.push(`全期間最高1RM：${max1rm.value}kg（${formatJpDate(max1rm.date)}）`);
  }
  lines.push('---');

  return lines.join('\n');
}
