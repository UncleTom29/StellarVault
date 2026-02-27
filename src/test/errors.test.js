import{describe,it,expect}from'vitest';
import{parseErr,ET}from'../utils/errors';
describe('parseErr',()=>{
  it('wallet not found',()=>{expect(parseErr(new Error('Wallet not found')).t).toBe(ET.WALLET);});
  it('user rejected',()=>{expect(parseErr(new Error('User declined the request')).t).toBe(ET.REJECTED);});
  it('insufficient balance',()=>{expect(parseErr(new Error('Account underfunded')).t).toBe(ET.BALANCE);});
  it('contract error',()=>{expect(parseErr(new Error('Contract simulation failed')).t).toBe(ET.CONTRACT);});
  it('network fallback',()=>{expect(parseErr(new Error('random error')).t).toBe(ET.NETWORK);});
  it('handles strings',()=>{expect(parseErr('bad').t).toBe(ET.NETWORK);});
});
