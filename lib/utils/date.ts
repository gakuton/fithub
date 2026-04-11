/** システムのローカルタイムゾーンで今日の日付を YYYY-MM-DD で返す */
export function localToday(): string {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
}

/** JST 現在時刻からデフォルトの食事タイプを返す
 *  0-11時 → breakfast, 12-17時 → lunch, 18-23時 → dinner
 */
export function getDefaultMealType(): 'breakfast' | 'lunch' | 'dinner' {
  const jstHour = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }),
  ).getHours();
  if (jstHour < 12) return 'breakfast';
  if (jstHour < 18) return 'lunch';
  return 'dinner';
}
