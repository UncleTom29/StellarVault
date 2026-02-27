const store=new Map();
export const cache={
  set(k,v,ttl=30000){store.set(k,{v,exp:Date.now()+ttl});},
  get(k){const i=store.get(k);if(!i)return null;if(Date.now()>i.exp){store.delete(k);return null;}return i.v;},
  del(k){store.delete(k);},
  prefix(p){for(const k of store.keys())if(k.startsWith(p))store.delete(k);},
  clear(){store.clear();}
};
