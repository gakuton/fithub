/** システムのローカルタイムゾーンで今日の日付を YYYY-MM-DD で返す */
export function localToday(): string {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
}
