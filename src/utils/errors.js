export const ET={WALLET:'WALLET',REJECTED:'REJECTED',BALANCE:'BALANCE',CONTRACT:'CONTRACT',NETWORK:'NETWORK'};
export function parseErr(e){
  const m=e?.message||String(e);
  if(m.includes('not found')||m.includes('No wallet')||m.includes('not installed'))return{t:ET.WALLET,msg:'Wallet not found. Install a Stellar wallet extension.'};
  if(m.includes('reject')||m.includes('declined')||m.includes('cancel'))return{t:ET.REJECTED,msg:'Transaction cancelled by user.'};
  if(m.includes('insufficient')||m.includes('underfunded'))return{t:ET.BALANCE,msg:'Insufficient balance. Fund via testnet faucet.'};
  if(m.includes('Contract')||m.includes('simulation'))return{t:ET.CONTRACT,msg:'Contract error: '+m.slice(0,80)};
  return{t:ET.NETWORK,msg:'Network error: '+m.slice(0,80)};
}
