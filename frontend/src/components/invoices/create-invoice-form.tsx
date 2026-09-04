'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, Package, Percent, User, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import { useForm, type UseFormRegisterReturn } from 'react-hook-form';

import { useAuth } from '@/components/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field, fieldControlClasses, fieldDescribedBy } from '@/components/ui/field';
import { ApiError, apiRequest } from '@/lib/api-client';
import { cn } from '@/lib/cn';
import {
  createInvoiceFormSchema,
  type CreateInvoiceFormValues,
} from '@/validation/create-invoice-form.schema';

import { InvoiceSummaryCard } from './invoice-summary-card';

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'name'> {
  readonly containerClassName?: string;
  readonly id: string;
  readonly label: string;
  readonly error?: string;
  readonly registration: UseFormRegisterReturn;
  readonly hint?: string;
}

function TextField({
  id,
  label,
  error,
  registration,
  hint,
  className,
  containerClassName,
  required = true,
  ...inputProps
}: TextFieldProps) {
  return (
    <Field
      className={containerClassName}
      error={error}
      hint={hint}
      id={id}
      label={label}
      required={required}
    >
      <input
        aria-describedby={fieldDescribedBy(id, { hint, error })}
        aria-invalid={error ? 'true' : 'false'}
        className={cn(fieldControlClasses, className)}
        id={id}
        required={required}
        {...inputProps}
        {...registration}
      />
    </Field>
  );
}

function Section({
  icon: Icon,
  title,
  description,
  children,
}: Readonly<{ icon: LucideIcon; title: string; description: string; children: ReactNode }>) {
  return (
    <fieldset className="rounded-lg bg-white p-5 shadow-md ring-1 ring-neutral-950/5 sm:p-6">
      <legend className="flex items-center gap-2.5 px-1 text-lg font-bold text-neutral-950">
        <span className="bg-primary-50 text-primary-700 grid size-8 shrink-0 place-items-center rounded-md">
          <Icon aria-hidden="true" className="size-4" />
        </span>
        {title}
      </legend>
      <p className="mt-2 mb-5 text-sm leading-6 text-neutral-600">{description}</p>
      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function messageForStatus(status: number, fallback: string): string {
  if (status === 409) return 'That invoice number may already exist. Review it and try again.';
  if (status === 401) return 'Your session has expired. Sign in again before retrying.';
  if (status === 0)
    return 'The invoice service is temporarily unavailable. Your entries have been kept.';
  return fallback;
}

const defaultValues: CreateInvoiceFormValues = {
  customer: { fullname: '', email: '', mobileNumber: '', address: '' },
  invoiceNumber: '',
  invoiceReference: '',
  invoiceDate: '',
  dueDate: '',
  currency: 'GBP',
  description: '',
  item: { name: '', quantity: 1, rate: 0 },
  taxPercent: 10,
  discount: 0,
};

export function CreateInvoiceForm() {
  const router = useRouter();
  const { accessToken, logout } = useAuth();
  const [formError, setFormError] = useState<string>();
  const [success, setSuccess] = useState<{ invoiceNumber: string }>();
  const [shouldFocusSummary, setShouldFocusSummary] = useState(false);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const isSubmittingRef = useRef(false);
  const {
    formState: { errors, isSubmitting },
    control,
    handleSubmit,
    register,
  } = useForm<CreateInvoiceFormValues>({
    defaultValues,
    resolver: zodResolver(createInvoiceFormSchema),
  });

  useEffect(() => {
    if (formError && shouldFocusSummary) errorSummaryRef.current?.focus();
  }, [formError, shouldFocusSummary]);

  useEffect(() => {
    if (success) successRef.current?.focus();
  }, [success]);

  const rhfSubmit = handleSubmit(
    async (submittedValues) => {
      setShouldFocusSummary(true);
      setFormError(undefined);
      setSuccess(undefined);

      try {
        const created = await apiRequest<{ invoiceNumber: string }>('/invoices', {
          method: 'POST',
          token: accessToken,
          body: submittedValues,
        });
        setSuccess({ invoiceNumber: created.invoiceNumber });
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          logout();
          router.replace('/login');
          return;
        }

        const message =
          error instanceof ApiError
            ? messageForStatus(error.status, error.message)
            : 'The invoice could not be created. Review your entries and try again.';
        setFormError(message);
      }
    },
    () => {
      setShouldFocusSummary(false);
      setSuccess(undefined);
      setFormError('Check the highlighted fields and submit the invoice again.');
    },
  );

  function handleFormSubmit(event: FormEvent<HTMLFormElement>): void {
    if (isSubmittingRef.current) {
      event.preventDefault();
      return;
    }

    isSubmittingRef.current = true;
    void rhfSubmit(event).finally(() => {
      isSubmittingRef.current = false;
    });
  }

  const numberRegistration = { valueAsNumber: true } as const;

  return (
    <form
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-8"
      noValidate
      onSubmit={handleFormSubmit}
    >
      <div className="space-y-6">
        <p className="text-sm text-neutral-600">
          Fields marked <span className="text-danger-600 font-semibold">*</span> are required.
        </p>
        {formError ? (
          <div
            className="border-danger-200 bg-danger-50 text-danger-900 focus:ring-danger-600 rounded-lg border px-4 py-3 text-sm outline-none focus:ring-2"
            ref={errorSummaryRef}
            role="alert"
            tabIndex={-1}
          >
            {formError}
          </div>
        ) : null}
        {success ? (
          <div
            aria-atomic="true"
            className="border-success-100 bg-success-100/60 text-success-900 focus:ring-success-600 rounded-lg border px-5 py-4 text-sm outline-none focus:ring-2"
            ref={successRef}
            role="status"
            tabIndex={-1}
          >
            <p className="font-semibold">Invoice {success.invoiceNumber} was created.</p>
            <Link className="mt-2 inline-block font-semibold underline" href="/invoices">
              View refreshed invoice list
            </Link>
          </div>
        ) : null}

        <Section
          description="Reference, dates, currency, and the purpose of this invoice. New invoices are created as Draft."
          icon={FileText}
          title="Invoice information"
        >
          <TextField
            error={errors.invoiceNumber?.message}
            id="invoice-number"
            label="Invoice number"
            registration={register('invoiceNumber')}
          />
          <TextField
            error={errors.invoiceReference?.message}
            id="invoice-reference"
            label="Invoice reference (optional)"
            registration={register('invoiceReference')}
            required={false}
          />
          <TextField
            error={errors.currency?.message}
            id="currency"
            label="Currency"
            maxLength={3}
            registration={register('currency')}
          />
          <TextField
            error={errors.invoiceDate?.message}
            id="invoice-date"
            label="Invoice date"
            registration={register('invoiceDate')}
            type="date"
          />
          <TextField
            error={errors.dueDate?.message}
            id="due-date"
            label="Due date"
            registration={register('dueDate')}
            type="date"
          />
          <TextField
            containerClassName="sm:col-span-2"
            error={errors.description?.message}
            id="description"
            label="Description (optional)"
            registration={register('description')}
            required={false}
          />
        </Section>

        <Section
          description="The billed customer and their contact details."
          icon={User}
          title="Customer"
        >
          <TextField
            autoComplete="name"
            error={errors.customer?.fullname?.message}
            id="customer-fullname"
            label="Customer name"
            registration={register('customer.fullname')}
          />
          <TextField
            autoComplete="email"
            error={errors.customer?.email?.message}
            id="customer-email"
            label="Customer email"
            registration={register('customer.email')}
            type="email"
          />
          <TextField
            autoComplete="tel"
            error={errors.customer?.mobileNumber?.message}
            id="customer-mobile"
            label="Mobile number (optional)"
            registration={register('customer.mobileNumber')}
            required={false}
            type="tel"
          />
          <TextField
            autoComplete="street-address"
            error={errors.customer?.address?.message}
            id="customer-address"
            label="Address (optional)"
            registration={register('customer.address')}
            required={false}
          />
        </Section>

        <Section
          description="The assessment requires exactly one line item; it cannot be added or removed."
          icon={Package}
          title="Line item"
        >
          <TextField
            containerClassName="sm:col-span-2"
            error={errors.item?.name?.message}
            id="item-name"
            label="Item name"
            registration={register('item.name')}
          />
          <TextField
            error={errors.item?.quantity?.message}
            id="item-quantity"
            label="Quantity"
            min="1"
            registration={register('item.quantity', numberRegistration)}
            step="1"
            type="number"
          />
          <TextField
            error={errors.item?.rate?.message}
            id="item-rate"
            label="Rate"
            min="0.01"
            registration={register('item.rate', numberRegistration)}
            step="0.01"
            type="number"
          />
        </Section>

        <Section
          description="Tax defaults to 10%; discount is a flat amount and defaults to zero."
          icon={Percent}
          title="Adjustments"
        >
          <TextField
            error={errors.taxPercent?.message}
            hint="Percentage, 0-100."
            id="tax-percent"
            label="Tax"
            min="0"
            registration={register('taxPercent', numberRegistration)}
            step="0.01"
            type="number"
          />
          <TextField
            error={errors.discount?.message}
            hint="Flat amount in the invoice currency."
            id="discount"
            label="Discount"
            min="0"
            registration={register('discount', numberRegistration)}
            step="0.01"
            type="number"
          />
        </Section>

        <div className="lg:hidden">
          <InvoiceSummaryCard control={control} />
        </div>

        <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <Link
            className="focus-visible:ring-primary-600 inline-flex min-h-11 w-full items-center justify-center rounded-lg px-3 py-2.5 text-center text-sm font-semibold text-neutral-700 outline-none hover:bg-neutral-100 focus-visible:ring-2 sm:w-auto"
            href="/invoices"
          >
            Cancel and return to invoices
          </Link>
          <Button
            aria-describedby={isSubmitting ? 'create-submit-status' : undefined}
            className="w-full sm:w-auto"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Creating invoice…' : 'Review and create invoice'}
          </Button>
          {isSubmitting ? (
            <span aria-live="polite" className="sr-only" id="create-submit-status" role="status">
              Creating invoice.
            </span>
          ) : null}
        </Card>
      </div>

      <div className="hidden lg:sticky lg:top-6 lg:block">
        <InvoiceSummaryCard control={control} />
      </div>
    </form>
  );
}
