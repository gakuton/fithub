// ─── 共通ユーティリティ ────────────────────────────────

function formatJpDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${y}年${parseInt(m)}月${parseInt(d)}日`;
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

export function buildTodayText(groups: GroupedExercise[], date: string): string {
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
