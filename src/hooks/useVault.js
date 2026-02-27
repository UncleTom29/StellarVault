import{useState,useEffect,useCallback}from'react';
import{getVault,getXLM,buildDeposit,buildWithdraw,submit,waitTx,bust}from'../utils/contract';
import{parseErr}from'../utils/errors';
export const TX={IDLE:'idle',BUILD:'build',SIGN:'sign',SEND:'send',CONFIRM:'confirm',OK:'ok',FAIL:'fail'};
export function useVault(pk,sign){
  const[vault,setVault]=useState(null);
  const[xlm,setXlm]=useState(null);
  const[loading,setLoading]=useState(false);
  const[st,setSt]=useState(TX.IDLE);
  const[hash,setHash]=useState(null);
  const[txErr,setTxErr]=useState(null);
  const[updated,setUpdated]=useState(null);
  const refresh=useCallback(async(force=false)=>{
    if(!pk)return;setLoading(true);
    try{if(force)bust(pk);const[v,b]=await Promise.all([getVault(pk),getXLM(pk)]);setVault(v);setXlm(b);setUpdated(new Date());}
    catch(e){console.error(e);}finally{setLoading(false);}
  },[pk]);
  useEffect(()=>{
    if(pk){refresh();const id=setInterval(()=>refresh(false),30000);return()=>clearInterval(id);}
    else{setVault(null);setXlm(null);setSt(TX.IDLE);}
  },[pk,refresh]);
  const run=useCallback(async(buildFn,amt)=>{
    if(!pk||!sign)return;
    setSt(TX.BUILD);setTxErr(null);setHash(null);
    try{
      const tx=await buildFn(pk,amt);setSt(TX.SIGN);
      const signed=await sign(tx.toXDR());setSt(TX.SEND);
      const h=await submit(signed);setHash(h);setSt(TX.CONFIRM);
      await waitTx(h);setSt(TX.OK);
      setTimeout(()=>refresh(true),2000);
    }catch(e){setTxErr(parseErr(e).msg);setSt(TX.FAIL);}
  },[pk,sign,refresh]);
  return{vault,xlm,loading,st,hash,txErr,updated,refresh,deposit:amt=>run(buildDeposit,amt),withdraw:amt=>run(buildWithdraw,amt),reset:()=>setSt(TX.IDLE)};
}
