import { LoadingState } from '@/components/ui/feedback-state';

export default function Loading() {
  return (
    <LoadingState
      description="Please wait while the application is prepared."
      headingLevel={1}
      title="Loading SimpleInvoice"
    />
  );
}
