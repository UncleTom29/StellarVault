import React,{useState,useEffect,useCallback}from'react';
import{Toaster,toast}from'react-hot-toast';
import{useWallet}from'./hooks/useWallet';
import{useVault,TX}from'./hooks/useVault';
import{useEventStream}from'./hooks/useEventStream';
import{CFG}from'./config';
const STEPS={[TX.BUILD]:{p:20,l:'Building...'}, [TX.SIGN]:{p:45,l:'Sign in wallet...'}, [TX.SEND]:{p:68,l:'Submitting...'}, [TX.CONFIRM]:{p:85,l:'Confirming...'}};
function TxBox({st,hash,txErr}){
  if(st===TX.IDLE)return null;
  const active=STEPS[st];
  const cls=active?'w':st===TX.OK?'ok':'fail';
  const title={[TX.BUILD]:'⚙️ Building TX',[TX.SIGN]:'✍️ Awaiting signature',[TX.SEND]:'📡 Submitting',[TX.CONFIRM]:'⏳ Confirming',[TX.OK]:'✅ Confirmed!',[TX.FAIL]:'❌ Failed'};
  return(<div className={`txb ${cls}`}>
    <div className={`txt ${cls}`}>{title[st]}</div>
    {active&&<><div style={{fontSize:'0.72rem',color:'var(--warn)',marginBottom:4}}>{active.l}</div><div className="prog"><div className="pb" style={{width:`${active.p}%`}}/></div></>}
    {hash&&<><div className="txh">{hash}</div><a className="txl" href={`${CFG.EXPLORER}/tx/${hash}`} target="_blank" rel="noopener noreferrer">🔍 View on Stellar Expert →</a></>}
    {txErr&&<div style={{fontSize:'0.76rem',color:'var(--err)',marginTop:5}}>{txErr}</div>}
  </div>);
}
function VaultStats({vault,xlm,loading,updated,onRefresh,streamActive}){
  if(!vault)return<div className="card" style={{textAlign:'center',color:'var(--mt)',padding:32}}>{loading?<><span className="sp"/> Loading...</>:'⚠️ Set VITE_CONTRACT_ID in .env'}</div>;
  return(<div className="card">
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
      <span className="cl" style={{marginBottom:0}}>Your Vault</span>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        {streamActive&&<span className="live-dot" title="Live updates active">● LIVE</span>}
        <button onClick={onRefresh} disabled={loading} style={{background:'none',border:'none',color:'var(--d)',cursor:'pointer',fontSize:'0.95rem'}}><span className={loading?'spin':''}>↻</span></button>
      </div>
    </div>
    <div className="stats">
      <div className="stat sf"><div className="sv">{vault.balance.toFixed(4)}</div><div className="sl">Vault Balance (XLM)</div></div>
      <div className="stat"><div className="sv" style={{fontSize:'1.1rem'}}>{vault.deposited.toFixed(2)}</div><div className="sl">Total Deposited</div></div>
      <div className="stat"><div className="sv" style={{fontSize:'1.1rem'}}>{vault.count}</div><div className="sl">Deposits</div></div>
    </div>
    <div style={{fontSize:'0.67rem',color:'var(--d)',marginTop:6}}>Wallet: {xlm!==null?parseFloat(xlm).toFixed(2)+' XLM':'—'}{updated?` · ${updated.toLocaleTimeString()}`:''}</div>
  </div>);
}
function Actions({vault,xlm,deposit,withdraw,st,hash,txErr,reset}){
  const[amt,setAmt]=useState('');
  const[mode,setMode]=useState('deposit');
  const busy=[TX.BUILD,TX.SIGN,TX.SEND,TX.CONFIRM].includes(st);
  const go=()=>{
    const n=parseFloat(amt);
    if(isNaN(n)||n<=0)return toast.error('Enter a valid amount');
    if(mode==='deposit'&&xlm!==null&&n>xlm-1)return toast.error('Keep 1 XLM for fees');
    if(mode==='withdraw'&&vault&&n>vault.balance)return toast.error('Exceeds vault balance');
    mode==='deposit'?deposit(n):withdraw(n);setAmt('');
  };
  useEffect(()=>{if(st===TX.OK)toast.success(mode==='deposit'?'Deposited! 🎉':'Withdrawn! ✅');},[st]);
  return(<div className="card">
    <p className="cl">Actions</p>
    <div style={{display:'flex',gap:8,marginBottom:14}}>
      {['deposit','withdraw'].map(m=><button key={m} className={`btn ${mode===m?'bp':'bs'}`} onClick={()=>{setMode(m);reset();}} style={{flex:1,textTransform:'capitalize'}}>{m==='deposit'?'⬇️ Deposit':'⬆️ Withdraw'}</button>)}
    </div>
    <label className="lbl">Amount (XLM)</label>
    <input className="inp" type="number" placeholder="e.g. 10" value={amt} onChange={e=>setAmt(e.target.value)} disabled={busy} min="0" step="0.0000001"/>
    <div style={{fontSize:'0.7rem',color:'var(--d)',marginTop:3}}>{mode==='deposit'?`Available: ${xlm!==null?parseFloat(xlm).toFixed(2):'-'} XLM`:`In vault: ${vault?vault.balance.toFixed(4):'-'} XLM`}</div>
    <button className="btn bp bf" onClick={go} disabled={busy||!amt} style={{marginTop:10}}>
      {busy?<><span className="sp"/>Processing...</>:mode==='deposit'?'⬇️ Deposit to Vault':'⬆️ Withdraw from Vault'}
    </button>
    <TxBox st={st} hash={hash} txErr={txErr}/>
  </div>);
}
export default function App(){
  const{pk,wid,busy,err,connect,disconnect,sign}=useWallet();
  const{vault,xlm,loading,st,hash,txErr,updated,refresh,deposit,withdraw,reset}=useVault(pk,sign);
  const[streamActive,setStreamActive]=useState(false);
  const copy=t=>{navigator.clipboard.writeText(t).catch(()=>{});toast.success('Copied!',{duration:1200});};
  const handleLiveEvent=useCallback(()=>{
    setStreamActive(true);
    refresh(true);
  },[refresh]);
  const{start,stop}=useEventStream(CFG.CONTRACT_ID,handleLiveEvent);
  useEffect(()=>{
    if(pk)start();
    else{stop();setStreamActive(false);}
  },[pk,start,stop]);
  return(<>
    <Toaster position="top-center" toastOptions={{style:{background:'#0e0e26',color:'#f0f0ff',border:'1px solid #1e1e42',borderRadius:9,fontFamily:'Inter,sans-serif',fontSize:'0.83rem'}}}/>
    <header className="hdr">
      <div className="logo">🏦 StellarVault</div>
      <div style={{display:'flex',alignItems:'center',gap:7}}>
        <span className="bdg">Testnet</span>
        {wid&&<span style={{fontSize:'0.62rem',background:'rgba(167,139,250,0.1)',color:'#a78bfa',border:'1px solid rgba(167,139,250,0.18)',padding:'2px 7px',borderRadius:'999px'}}>{wid}</span>}
        {pk&&<button className="btn bd" onClick={disconnect} style={{padding:'6px 11px',fontSize:'0.75rem'}}>Disconnect</button>}
      </div>
    </header>
    <main className="main">
      {!pk?<div className="card hero">
        <div style={{fontSize:'3rem'}}>🏦</div>
        <h1 className="ht">StellarVault</h1>
        <p className="hs">Your personal XLM savings vault.<br/>Powered by Soroban smart contract.</p>
        <div className="feats">
          <div className="feat">⭐ Multi-wallet via StellarWalletsKit</div>
          <div className="feat">📜 Non-custodial Soroban contract</div>
          <div className="feat">⚡ Inter-contract XLM token calls</div>
          <div className="feat">🔴 Real-time live event streaming</div>
        </div>
        <button className="btn bp" onClick={connect} disabled={busy} style={{minWidth:200}}>
          {busy?<><span className="sp"/>Connecting...</>:'🔗 Connect Wallet'}
        </button>
        {err&&<p className="em">⚠️ {err}</p>}
      </div>:<>
        <div style={{fontSize:'0.72rem',color:'var(--d)'}}>{pk.slice(0,8)}...{pk.slice(-6)}</div>
        <VaultStats vault={vault} xlm={xlm} loading={loading} updated={updated} onRefresh={()=>refresh(true)} streamActive={streamActive}/>
        <Actions vault={vault} xlm={xlm} deposit={deposit} withdraw={withdraw} st={st} hash={hash} txErr={txErr} reset={reset}/>
        <div className="card">
          <p className="cl">Contracts</p>
          <div style={{marginBottom:8}}>
            <div style={{fontSize:'0.67rem',color:'var(--d)',marginBottom:3}}>Vault Contract</div>
            <div className="ci" onClick={()=>copy(CFG.CONTRACT_ID)}>📜 {CFG.CONTRACT_ID}</div>
            <a style={{display:'inline-flex',alignItems:'center',gap:4,marginTop:5,fontSize:'0.7rem',color:'var(--ac)',textDecoration:'none'}} href={`${CFG.EXPLORER}/contract/${CFG.CONTRACT_ID}`} target="_blank" rel="noopener noreferrer">🔍 View on Stellar Expert →</a>
          </div>
          <div>
            <div style={{fontSize:'0.67rem',color:'var(--d)',marginBottom:3}}>XLM Token Contract (SAC)</div>
            <div className="ci" onClick={()=>copy(CFG.XLM_TOKEN_ID)}>🪙 {CFG.XLM_TOKEN_ID}</div>
            <a style={{display:'inline-flex',alignItems:'center',gap:4,marginTop:5,fontSize:'0.7rem',color:'var(--ac)',textDecoration:'none'}} href={`${CFG.EXPLORER}/contract/${CFG.XLM_TOKEN_ID}`} target="_blank" rel="noopener noreferrer">🔍 View XLM Token →</a>
          </div>
        </div>
      </>}
    </main>
    <footer className="footer">Built on <a href="https://stellar.org" target="_blank" rel="noopener">Stellar</a> · Testnet only</footer>
  </>);
}
