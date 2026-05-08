import { BottomNav } from '@/components/common/BottomNav';
import { Toaster } from '@/components/ui/sonner';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="pb-20">{children}</main>
      <BottomNav />
      <Toaster />
    </>
  );
}
