'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MealWeekStrip } from '@/components/meal/MealWeekStrip';
import { MealDayDetail } from '@/components/meal/MealDayDetail';
import { MealGraph } from '@/components/meal/MealGraph';

function localToday(): string {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
}

export default function MealPage() {
  const today = localToday();
  const [selectedDate, setSelectedDate] = useState(today);
  const [weekOffset,   setWeekOffset]   = useState(0);

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <h1 className="mb-5 text-xl font-bold tracking-tight">食事</h1>

      <Tabs defaultValue="record">
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="record" className="flex-1">記録</TabsTrigger>
          <TabsTrigger value="graph"  className="flex-1">グラフ</TabsTrigger>
        </TabsList>

        {/* ── 記録タブ ── */}
        <TabsContent value="record" className="space-y-4">
          <MealWeekStrip
            selectedDate={selectedDate}
            weekOffset={weekOffset}
            onSelectDate={setSelectedDate}
            onWeekOffset={setWeekOffset}
          />

          <div>
            <p className="mb-3 text-sm font-semibold text-muted-foreground">
              {selectedDate === today ? '今日' : selectedDate}
            </p>
            <MealDayDetail date={selectedDate} />
          </div>
        </TabsContent>

        {/* ── グラフタブ ── */}
        <TabsContent value="graph">
          <MealGraph />
        </TabsContent>
      </Tabs>
    </div>
  );
}
