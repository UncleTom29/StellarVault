import { useState, useCallback, useEffect } from 'react';
import {
  StellarWalletsKit,
  WalletNetwork,
  allowAllModules,
  FREIGHTER_ID,
} from '@creit.tech/stellar-wallets-kit';
import { parseErr } from '../utils/errors';
import { CFG } from '../config';

let _k = null;
const kit = () => {
  if (!_k)
    _k = new StellarWalletsKit({
      network: WalletNetwork.TESTNET,
      selectedWalletId: FREIGHTER_ID,
      modules: allowAllModules(),
    });
  return _k;
};

export function useWallet() {
  const [pk, setPk] = useState(() => localStorage.getItem('vault_pk'));
  const [wid, setWid] = useState(() => localStorage.getItem('vault_wid'));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  // Persistence
  useEffect(() => {
    if (pk) localStorage.setItem('vault_pk', pk);
    else localStorage.removeItem('vault_pk');
  }, [pk]);

  useEffect(() => {
    if (wid) localStorage.setItem('vault_wid', wid);
    else localStorage.removeItem('vault_wid');
  }, [wid]);

  const connect = useCallback(async () => {
    setBusy(true);
    setErr(null);
    try {
      await new Promise((resolve, reject) => {
        kit().openModal({
          onWalletSelected: async (option) => {
            try {
              kit().setWallet(option.id);
              setWid(option.id);
              const address = await kit().getPublicKey();
              if (!address) throw new Error('Wallet returned no address');
              setPk(address);
              resolve();
            } catch (e) {
              reject(e);
            }
          },
          onClosed: () => {
            resolve();
          },
        });
      });
    } catch (e) {
      setErr(parseErr(e).msg);
    } finally {
      setBusy(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setPk(null);
    setWid(null);
    localStorage.removeItem('vault_pk');
    localStorage.removeItem('vault_wid');
    _k = null;
  }, []);

  const sign = useCallback(
    async (xdr) => {
      if (!pk) throw new Error('No wallet connected');
      // If we are recovering from refresh, we need to ensure the kit knows which wallet to use
      if (wid) kit().setWallet(wid);

      const { result } = await kit().signTx({
        xdr,
        publicKeys: [pk],
        network: WalletNetwork.TESTNET,
      });
      return result;
    },
    [pk, wid]
  );

  return { pk, wid, busy, err, connect, disconnect, sign };
}
