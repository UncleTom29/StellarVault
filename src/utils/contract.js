import { Contract, SorobanRpc, TransactionBuilder, Networks, BASE_FEE, Address, nativeToScVal, scValToNative } from '@stellar/stellar-sdk';
import { CFG } from '../config';
import { cache } from './cache';

const rpc = new SorobanRpc.Server(CFG.RPC_URL, { allowHttp: false });

const ct = () => {
  if (!CFG.CONTRACT_ID || CFG.CONTRACT_ID === 'YOUR_CONTRACT_ID')
    throw new Error('Contract not configured. Set VITE_CONTRACT_ID in your environment variables.');
  return new Contract(CFG.CONTRACT_ID);
};

async function sim(pk, fn, args = []) {
  const acc = await rpc.getAccount(pk);
  const tx = new TransactionBuilder(acc, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
    .addOperation(ct().call(fn, ...args))
    .setTimeout(30)
    .build();
  const s = await rpc.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(s)) throw new Error(s.error);
  return s.result?.retval ? scValToNative(s.result.retval) : null;
}

async function prep(pk, fn, args = []) {
  const acc = await rpc.getAccount(pk);
  const tx = new TransactionBuilder(acc, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
    .addOperation(ct().call(fn, ...args))
    .setTimeout(30)
    .build();
  return rpc.prepareTransaction(tx);
}

export async function getVault(pk) {
  const ck = `v:${pk}`;
  const hit = cache.get(ck);
  if (hit) return hit;
  const r = await sim(pk, 'get_vault', [new Address(pk).toScVal()]);
  const d = {
    balance: Number(r?.balance || 0) / 1e7,
    deposited: Number(r?.deposited || 0) / 1e7,
    withdrawn: Number(r?.withdrawn || 0) / 1e7,
    count: Number(r?.count || 0),
  };
  cache.set(ck, d, CFG.CACHE_TTL);
  return d;
}

export async function getXLM(pk) {
  const ck = `x:${pk}`;
  const hit = cache.get(ck);
  if (hit !== null) return hit;
  const res = await fetch(`${CFG.HORIZON_URL}/accounts/${pk}`);
  if (!res.ok) throw new Error('Account not found');
  const d = await res.json();
  const b = d.balances.find(b => b.asset_type === 'native');
  const val = b ? parseFloat(b.balance) : 0;
  cache.set(ck, val, 15000);
  return val;
}

export async function buildDeposit(pk, xlm) {
  return prep(pk, 'deposit', [new Address(pk).toScVal(), nativeToScVal(Math.round(xlm * 1e7), { type: 'i128' })]);
}

export async function buildWithdraw(pk, xlm) {
  return prep(pk, 'withdraw', [new Address(pk).toScVal(), nativeToScVal(Math.round(xlm * 1e7), { type: 'i128' })]);
}

export async function submit(xdr) {
  const tx = TransactionBuilder.fromXDR(xdr, Networks.TESTNET);
  const r = await rpc.sendTransaction(tx);
  if (r.status === 'ERROR') throw new Error('Submit error');
  return r.hash;
}

export async function waitTx(hash) {
  // Use a manual JSON-RPC fetch for polling so we bypass the SDK's internal
  // XDR decoding for transaction metadata (avoids "Bad union switch" errors).
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(CFG.RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: i + 1,
          method: 'getTransaction',
          params: [hash],
        }),
      });
      if (!res.ok) throw new Error('RPC offline');
      const { result } = await res.json();
      if (result) {
        if (result.status === 'SUCCESS') return result;
        if (result.status === 'FAILED') throw new Error('Transaction failed on-chain');
        // 'NOT_FOUND' means still pending — keep polling
      }
    } catch (e) {
      if (e.message === 'Transaction failed on-chain') throw e;
      console.warn('Polling retry...', e.message);
    }
    await new Promise(r => setTimeout(r, 2000));
  }
  throw new Error('Transaction timed out — please refresh to check your balance.');
}

export function bust(pk) {
  cache.prefix(`v:${pk}`);
  cache.prefix(`x:${pk}`);
}
