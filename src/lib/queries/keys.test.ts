import { describe, expect, it } from 'vitest';
import { queryKeys } from '@/lib/queries/keys';

describe('query key boundaries', () => {
  it('separates category option queries from category page queries', () => {
    expect(queryKeys.categories.options('all')).toEqual(['categories', 'options', 'all']);
    expect(queryKeys.categories.pageList('all')).toEqual(['categories', 'page', 'list', 'all']);
    expect(queryKeys.categories.options('all')).not.toEqual(queryKeys.categories.pageList('all'));
  });
});
