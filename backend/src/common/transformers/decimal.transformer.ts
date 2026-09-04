import type { ValueTransformer } from 'typeorm';

/**
 * The pg driver returns NUMERIC/DECIMAL columns as strings to avoid silent
 * precision loss. The application works in plain JS numbers (invoice amounts
 * fit comfortably within float precision at 2 decimal places), so this
 * transformer converts at the TypeORM boundary only.
 */
export class DecimalTransformer implements ValueTransformer {
  to(data?: number | null): number | null | undefined {
    return data;
  }

  from(data?: string | null): number | null | undefined {
    if (data === null || data === undefined) {
      return data;
    }

    return parseFloat(data);
  }
}
