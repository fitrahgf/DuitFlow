import { describe, expect, it } from 'vitest';
import { projectFormSchema } from '@/lib/validators/project';

describe('projectFormSchema', () => {
  it('trims and validates project payloads', () => {
    expect(
      projectFormSchema.parse({
        name: '  Bali Trip  ',
        budgetTarget: '5000000',
        categoryNames: [' Flights ', 'Hotel'],
      })
    ).toEqual({
      name: 'Bali Trip',
      budgetTarget: 5000000,
      categoryNames: ['Flights', 'Hotel'],
    });
  });

  it('rejects invalid budget targets', () => {
    expect(() =>
      projectFormSchema.parse({
        name: 'Emergency Fund',
        budgetTarget: 0,
        categoryNames: [],
      })
    ).toThrow();
  });
});
