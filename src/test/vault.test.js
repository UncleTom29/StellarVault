import{describe,it,expect,vi,beforeEach}from'vitest';
const{mockGetVault,mockGetXLM}=vi.hoisted(()=>({mockGetVault:vi.fn(),mockGetXLM:vi.fn()}));
vi.mock('../utils/contract',()=>({getVault:mockGetVault,getXLM:mockGetXLM,buildDeposit:vi.fn(),buildWithdraw:vi.fn(),submit:vi.fn(),waitTx:vi.fn(),bust:vi.fn()}));
import{renderHook,waitFor}from'@testing-library/react';
import{useVault,TX}from'../hooks/useVault';
describe('useVault',()=>{
  beforeEach(()=>{vi.clearAllMocks();mockGetVault.mockResolvedValue({balance:100,deposited:200,withdrawn:100,count:2});mockGetXLM.mockResolvedValue(9999);});
  it('loads vault on mount',async()=>{const{result}=renderHook(()=>useVault('GTEST',vi.fn()));await waitFor(()=>expect(result.current.vault).not.toBeNull());expect(result.current.vault.balance).toBe(100);});
  it('idle tx status initially',()=>{const{result}=renderHook(()=>useVault(null,vi.fn()));expect(result.current.st).toBe(TX.IDLE);});
  it('clears on disconnect',async()=>{const{result,rerender}=renderHook(({pk})=>useVault(pk,vi.fn()),{initialProps:{pk:'G1'}});await waitFor(()=>expect(result.current.vault).not.toBeNull());rerender({pk:null});await waitFor(()=>expect(result.current.vault).toBeNull());});
});
