import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';

/** Cross-field check: the decorated dueDate must be on or after the sibling invoiceDate. */
export function IsDueDateOnOrAfterInvoiceDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isDueDateOnOrAfterInvoiceDate',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(dueDate: unknown, args: ValidationArguments) {
          if (typeof dueDate !== 'string') {
            return false;
          }

          const candidate = args.object as Record<string, unknown>;
          const invoiceDate = candidate.invoiceDate;

          if (typeof invoiceDate !== 'string') {
            return true;
          }

          const dueDateValue = new Date(dueDate);
          const invoiceDateValue = new Date(invoiceDate);

          if (Number.isNaN(dueDateValue.getTime()) || Number.isNaN(invoiceDateValue.getTime())) {
            return true;
          }

          return dueDateValue.getTime() >= invoiceDateValue.getTime();
        },
        defaultMessage() {
          return 'dueDate must be on or after invoiceDate';
        },
      },
    });
  };
}
