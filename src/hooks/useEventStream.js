import{useEffect,useRef,useCallback}from'react';
import{CFG}from'../config';

const RECONNECT_DELAY_MS=5000;

/**
 * useEventStream: real-time event streaming via Horizon SSE.
 * Subscribes to the contract account's operations and fires onEvent
 * whenever a new operation is detected (deposit/withdraw).
 */
export function useEventStream(contractId,onEvent){
  const esRef=useRef(null);
  const onEventRef=useRef(onEvent);
  useEffect(()=>{onEventRef.current=onEvent;},[onEvent]);

  const stop=useCallback(()=>{
    if(esRef.current){esRef.current.close();esRef.current=null;}
  },[]);

  const start=useCallback(()=>{
    if(!contractId||contractId==='YOUR_CONTRACT_ID'||esRef.current)return;
    const url=`${CFG.HORIZON_URL}/accounts/${contractId}/operations?order=desc&limit=1&cursor=now`;
    try{
      const es=new EventSource(url);
      esRef.current=es;
      es.addEventListener('message',e=>{
        try{
          const op=JSON.parse(e.data);
          if(op&&onEventRef.current)onEventRef.current(op);
        }catch(_){}
      });
      es.onerror=()=>{
        // Reconnect after 5 seconds on error
        stop();
        setTimeout(()=>start(),RECONNECT_DELAY_MS);
      };
    }catch(_){/* SSE not available in all envs */}
  },[contractId,stop]);

  useEffect(()=>{
    start();
    return()=>stop();
  },[start,stop]);

  return{start,stop};
}
