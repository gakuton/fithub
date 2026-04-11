'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { DemographicSection } from '@/components/profile/DemographicSection';
import { MotivationSection } from '@/components/profile/MotivationSection';

export default function ProfilePage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <div className="mb-5 flex items-center gap-2">
        <button
          onClick={() => router.back()}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-xl font-bold tracking-tight">プロフィール</h1>
      </div>

      <div className="space-y-6 pb-8">
        <DemographicSection />
        <MotivationSection />
      </div>
    </div>
  );
}
