import{describe,it,expect,beforeEach,vi}from'vitest';
import{cache}from'../utils/cache';
describe('cache',()=>{
  beforeEach(()=>cache.clear());
  it('stores and retrieves',()=>{cache.set('k','v',5000);expect(cache.get('k')).toBe('v');});
  it('returns null for missing',()=>{expect(cache.get('nope')).toBeNull();});
  it('expires after TTL',()=>{vi.useFakeTimers();cache.set('k','v',1000);vi.advanceTimersByTime(1500);expect(cache.get('k')).toBeNull();vi.useRealTimers();});
  it('deletes by key',()=>{cache.set('k','v',5000);cache.del('k');expect(cache.get('k')).toBeNull();});
  it('deletes by prefix',()=>{cache.set('v:a','1',5000);cache.set('v:b','2',5000);cache.set('x:a','3',5000);cache.prefix('v:');expect(cache.get('v:a')).toBeNull();expect(cache.get('x:a')).toBe('3');});
});
