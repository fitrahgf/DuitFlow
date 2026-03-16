import { format } from 'date-fns';

export function toDateInputValue(value: Date | string = new Date()) {
  const parsedValue = value instanceof Date ? value : new Date(value);
  return format(parsedValue, 'yyyy-MM-dd');
}

export function toMonthKey(value: Date | string = new Date()) {
  const parsedValue = value instanceof Date ? value : new Date(value);
  return format(parsedValue, 'yyyy-MM');
}
