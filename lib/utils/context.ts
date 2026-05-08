import { and, gte, lte, desc, eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  workoutSets,
  exercises,
  meals,
  mealItems,
  bodyCompositions,
  demographicData,
  motivations,
  aerobicSessions,
} from '@/lib/db/schema'

const GENDER_LABELS_MAP: Record<string, string> = {
  male: '男性', female: '女性', other: 'その他',
}
const ACTIVITY_LEVEL_LABELS_MAP: Record<string, string> = {
  sedentary:         'ほぼ座っている（デスクワーク中心）',
  lightly_active:    '軽度活動（週1〜2回の軽い運動）',
  moderately_active: '中度活動（週3〜4回の運動）',
  very_active:       '高度活動（週5回以上の激しい運動）',
  extra_active:      '超高度活動（アスリート・肉体労働）',
}
const MOTIVATION_CATEGORY_LABELS_MAP: Record<string, string> = {
  cut: '減量', bulk: '増量', maintain: '現状維持',
}
const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: '朝食', lunch: '昼食', dinner: '夕食', other: 'その他',
}

function toDateString(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function calcAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export interface Period {
  startDate: string
  endDate: string
}

export function detectPeriod(message: string): Period {
  const today = new Date()
  const endDate = toDateString(today)

  const makeStart = (daysBack: number): string => {
    const d = new Date(today)
    d.setDate(d.getDate() - daysBack)
    return toDateString(d)
  }

  if (/今日|本日/.test(message)) return { startDate: endDate, endDate }
  if (/今週|この週/.test(message)) return { startDate: makeStart(6), endDate }
  if (/先週/.test(message)) {
    const d = new Date(today)
    const dayOfWeek = d.getDay()
    const lastSunday = new Date(d)
    lastSunday.setDate(d.getDate() - dayOfWeek - 7)
    const lastSat = new Date(lastSunday)
    lastSat.setDate(lastSunday.getDate() + 6)
    return { startDate: toDateString(lastSunday), endDate: toDateString(lastSat) }
  }
  if (/今月|この月/.test(message)) return { startDate: makeStart(29), endDate }
  if (/先月/.test(message)) {
    const d = new Date(today)
    const firstOfMonth = new Date(d.getFullYear(), d.getMonth(), 1)
    const lastOfPrevMonth = new Date(firstOfMonth)
    lastOfPrevMonth.setDate(lastOfPrevMonth.getDate() - 1)
    const firstOfPrevMonth = new Date(lastOfPrevMonth.getFullYear(), lastOfPrevMonth.getMonth(), 1)
    return { startDate: toDateString(firstOfPrevMonth), endDate: toDateString(lastOfPrevMonth) }
  }
  if (/3ヶ月|3か月|3カ月|三ヶ月/.test(message)) return { startDate: makeStart(89), endDate }
  if (/半年|6ヶ月|6か月|6カ月/.test(message)) return { startDate: makeStart(179), endDate }
  if (/1年|一年|12ヶ月/.test(message)) return { startDate: makeStart(364), endDate }
  // default: 30 days
  return { startDate: makeStart(29), endDate }
}

export function detectFoodDetail(message: string): boolean {
  const keywords = ['食事の詳細', '何を食べ', '食品名', '具体的な食事', 'メニュー', '食材', '食べたもの']
  return keywords.some((k) => message.includes(k))
}

export async function buildChatContext(period: Period, includesFoodDetail: boolean, userId?: string): Promise<string> {
  const { startDate, endDate } = period

  const lines: string[] = []
  lines.push(`## FitHubデータ（${startDate} 〜 ${endDate}）`)
  lines.push('')

  // ── トレーニングデータ ──────────────────────────────────
  const sets = await db
    .select({
      workoutDate:  workoutSets.workoutDate,
      exerciseId:   workoutSets.exerciseId,
      exerciseName: exercises.name,
      category:     exercises.category,
      setNumber:    workoutSets.setNumber,
      isBodyweight: workoutSets.isBodyweight,
      weightKg:     workoutSets.weightKg,
      reps:         workoutSets.reps,
      estimated1rm: workoutSets.estimated1rm,
    })
    .from(workoutSets)
    .innerJoin(exercises, eq(workoutSets.exerciseId, exercises.id))
    .where(and(gte(workoutSets.workoutDate, startDate), lte(workoutSets.workoutDate, endDate)))
    .orderBy(workoutSets.workoutDate, workoutSets.exerciseId, workoutSets.setNumber)

  if (sets.length > 0) {
    lines.push('### トレーニング記録')
    // Group by date → exercise
    const byDate = new Map<string, Map<string, typeof sets>>()
    for (const s of sets) {
      if (!byDate.has(s.workoutDate)) byDate.set(s.workoutDate, new Map())
      const byEx = byDate.get(s.workoutDate)!
      const key = s.exerciseId
      if (!byEx.has(key)) byEx.set(key, [])
      byEx.get(key)!.push(s)
    }
    for (const [date, byEx] of Array.from(byDate.entries()).sort()) {
      lines.push(`\n**${date}**`)
      for (const [, exSets] of byEx) {
        const name = exSets[0].exerciseName
        const setStrs = exSets.map((s) => {
          if (s.isBodyweight) return `${s.reps}回`
          return `${s.weightKg ?? 0}kg×${s.reps}回`
        })
        const maxE1rm = Math.max(...exSets.map((s) => s.estimated1rm ?? 0))
        const e1rmStr = maxE1rm > 0 ? `（推定1RM: ${maxE1rm.toFixed(1)}kg）` : ''
        lines.push(`- ${name}: ${setStrs.join(', ')} ${e1rmStr}`.trim())
      }
    }
    lines.push('')
  } else {
    lines.push('### トレーニング記録')
    lines.push('この期間のトレーニング記録なし')
    lines.push('')
  }

  // ── 有酸素セッション ────────────────────────────────────
  const cardio = await db
    .select()
    .from(aerobicSessions)
    .where(and(gte(aerobicSessions.sessionDate, startDate), lte(aerobicSessions.sessionDate, endDate)))
    .orderBy(aerobicSessions.sessionDate)

  if (cardio.length > 0) {
    lines.push('### 有酸素運動')
    for (const s of cardio) {
      const dist = s.distanceKm ? ` ${s.distanceKm}km` : ''
      const hr = s.avgHeartRate ? ` 平均心拍${s.avgHeartRate}bpm` : ''
      lines.push(`- ${s.sessionDate} ${s.activityType} ${s.durationMin}分${dist}${hr} ${s.kcalBurned}kcal`)
    }
    lines.push('')
  }

  // ── 食事データ ──────────────────────────────────────────
  const mealRows = await db
    .select()
    .from(meals)
    .where(and(gte(meals.mealDate, startDate), lte(meals.mealDate, endDate)))
    .orderBy(meals.mealDate, meals.mealType)

  if (mealRows.length > 0) {
    lines.push('### 食事記録')

    const mealIds = mealRows.map((m) => m.id)
    const items = await db
      .select()
      .from(mealItems)
      .where(inArray(mealItems.mealId, mealIds))

    const itemsByMeal = new Map<string, typeof items>()
    for (const item of items) {
      if (!itemsByMeal.has(item.mealId)) itemsByMeal.set(item.mealId, [])
      itemsByMeal.get(item.mealId)!.push(item)
    }

    // Aggregate by date
    const byDate2 = new Map<string, typeof mealRows>()
    for (const m of mealRows) {
      if (!byDate2.has(m.mealDate)) byDate2.set(m.mealDate, [])
      byDate2.get(m.mealDate)!.push(m)
    }

    for (const [date, dayMeals] of Array.from(byDate2.entries()).sort()) {
      let dayP = 0, dayF = 0, dayC = 0, dayKcal = 0
      const mealLines: string[] = []

      for (const meal of dayMeals) {
        const mealItemList = itemsByMeal.get(meal.id) ?? []
        let mp = 0, mf = 0, mc = 0, mk = 0
        for (const it of mealItemList) {
          mp += it.proteinG; mf += it.fatG; mc += it.carbG; mk += it.kcal
        }
        dayP += mp; dayF += mf; dayC += mc; dayKcal += mk

        if (includesFoodDetail && mealItemList.length > 0) {
          const typeLabel = MEAL_TYPE_LABELS[meal.mealType] ?? meal.mealType
          const foodNames = mealItemList.map((it) => it.foodName).filter(Boolean).join('、')
          mealLines.push(`  - ${typeLabel}: ${foodNames}（P${mp.toFixed(0)}g F${mf.toFixed(0)}g C${mc.toFixed(0)}g ${mk.toFixed(0)}kcal）`)
        }
      }

      lines.push(`\n**${date}** 合計: P${dayP.toFixed(0)}g F${dayF.toFixed(0)}g C${dayC.toFixed(0)}g ${dayKcal.toFixed(0)}kcal`)
      if (includesFoodDetail) lines.push(...mealLines)
    }
    lines.push('')
  } else {
    lines.push('### 食事記録')
    lines.push('この期間の食事記録なし')
    lines.push('')
  }

  // ── 体組成データ ────────────────────────────────────────
  const bodyRows = await db
    .select()
    .from(bodyCompositions)
    .where(and(gte(bodyCompositions.measuredDate, startDate), lte(bodyCompositions.measuredDate, endDate)))
    .orderBy(bodyCompositions.measuredDate)

  if (bodyRows.length > 0) {
    lines.push('### 体組成')
    for (const b of bodyRows) {
      const fat = b.bodyFatPct != null ? ` 体脂肪率${b.bodyFatPct}%` : ''
      const mus = b.skeletalMuscleKg != null ? ` 骨格筋量${b.skeletalMuscleKg}kg` : ''
      const bmr = b.bmr != null ? ` 基礎代謝${b.bmr}kcal` : ''
      lines.push(`- ${b.measuredDate}: 体重${b.weightKg}kg${fat}${mus}${bmr}`)
    }
    lines.push('')
  }

  // ── プロフィール ────────────────────────────────────────
  const [demog] = await db.select().from(demographicData).where(eq(demographicData.userId, userId ?? ''))
  const goals = await db.select().from(motivations).orderBy(desc(motivations.createdAt))

  if (demog) {
    lines.push('### プロフィール')
    const parts: string[] = []
    if (demog.gender) parts.push(GENDER_LABELS_MAP[demog.gender] ?? demog.gender)
    if (demog.birthDate) parts.push(`${calcAge(demog.birthDate)}歳`)
    if (demog.heightCm) parts.push(`身長${demog.heightCm}cm`)
    if (demog.activityLevel) parts.push(ACTIVITY_LEVEL_LABELS_MAP[demog.activityLevel] ?? demog.activityLevel)
    if (parts.length > 0) lines.push(parts.join(' / '))

    const activeGoals = goals.filter((g) => !g.achievedAt)
    if (activeGoals.length > 0) {
      lines.push('目標:')
      for (const g of activeGoals) {
        const cat = g.category ? MOTIVATION_CATEGORY_LABELS_MAP[g.category] ?? g.category : ''
        lines.push(`- ${cat}${g.description ? '：' + g.description : ''}`)
      }
    }
    lines.push('')
  }

  return lines.join('\n')
}
