import { BodyCompositionForm } from '@/components/body/BodyCompositionForm';
import { BodyChart } from '@/components/body/BodyChart';

export default function BodyPage() {
  return (
    <div className="mx-auto max-w-lg px-4 pt-6 space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">体組成</h1>
      <BodyCompositionForm />
      <BodyChart />
    </div>
  );
}
