import{describe,it,expect,vi,beforeEach,afterEach}from'vitest';
import{renderHook,act}from'@testing-library/react';
import{useEventStream}from'../hooks/useEventStream';

// Mock EventSource
class MockEventSource{
  constructor(url){this.url=url;this.listeners={};MockEventSource.instances.push(this);}
  addEventListener(t,fn){this.listeners[t]=fn;}
  close(){this.closed=true;}
  emit(t,data){if(this.listeners[t])this.listeners[t]({data:JSON.stringify(data)});}
}
MockEventSource.instances=[];

describe('useEventStream',()=>{
  let origES;
  beforeEach(()=>{origES=global.EventSource;global.EventSource=MockEventSource;MockEventSource.instances=[];});
  afterEach(()=>{global.EventSource=origES;vi.clearAllMocks();});

  it('does not open stream without contractId',()=>{
    renderHook(()=>useEventStream('YOUR_CONTRACT_ID',vi.fn()));
    expect(MockEventSource.instances).toHaveLength(0);
  });

  it('opens stream with valid contractId',()=>{
    renderHook(()=>useEventStream('CTEST123',vi.fn()));
    expect(MockEventSource.instances).toHaveLength(1);
  });

  it('calls onEvent when message received',()=>{
    const onEvent=vi.fn();
    renderHook(()=>useEventStream('CTEST123',onEvent));
    const es=MockEventSource.instances[0];
    act(()=>es.emit('message',{type:'payment'}));
    expect(onEvent).toHaveBeenCalledWith({type:'payment'});
  });

  it('closes stream on unmount',()=>{
    const{unmount}=renderHook(()=>useEventStream('CTEST123',vi.fn()));
    const es=MockEventSource.instances[0];
    unmount();
    expect(es.closed).toBe(true);
  });
});
