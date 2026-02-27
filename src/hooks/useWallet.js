import{useState,useCallback}from'react';
import{StellarWalletsKit,WalletNetwork,allowAllModules,FREIGHTER_ID}from'@creit.tech/stellar-wallets-kit';
import{parseErr}from'../utils/errors';
import{CFG}from'../config';
let _k=null;
const kit=()=>{if(!_k)_k=new StellarWalletsKit({network:WalletNetwork.TESTNET,selectedWalletId:FREIGHTER_ID,modules:allowAllModules()});return _k;};
export function useWallet(){
  const[pk,setPk]=useState(null);
  const[wid,setWid]=useState(null);
  const[busy,setBusy]=useState(false);
  const[err,setErr]=useState(null);
  const connect=useCallback(async()=>{
    setBusy(true);setErr(null);
    try{await kit().openModal({onWalletSelected:async o=>{kit().setWallet(o.id);setWid(o.id);const{address}=await kit().getAddress();if(!address)throw new Error('No address');setPk(address);}});}
    catch(e){setErr(parseErr(e).msg);}finally{setBusy(false);}
  },[]);
  const disconnect=useCallback(()=>{setPk(null);setWid(null);_k=null;},[]);
  const sign=useCallback(async xdr=>{const{signedTxXdr}=await kit().signTransaction(xdr,{network:WalletNetwork.TESTNET,networkPassphrase:CFG.PASSPHRASE});return signedTxXdr;},[]);
  return{pk,wid,busy,err,connect,disconnect,sign};
}
