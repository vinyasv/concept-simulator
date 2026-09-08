import React from "react";
import { Stat } from "../SimSDK";
import { Choices, Feedback, useMaterial, Workbench } from "./shared";
import { advancePipeline, scheduleProcess, allocateFile, updatePredictor, chooseLeastLoaded, tcpEvent } from "../../simulations/expandedPlayground";

export function PipelineBench(){
 const stages=["Fetch","Decode","Execute","Memory","Write back"],model=useMaterial({slots:[null,null,null,null,null] as (string|null)[],next:1,stall:false,message:"Feed instructions and advance the five-stage lane."}),s=model.state;
 return <Workbench id="pipeline" model={model} assumptions="Ideal five-stage scalar pipeline with one optional global stall. Each cycle advances every instruction one stage; hazards and forwarding are represented only by the learner-controlled stall." readings={<Stat label="In flight" value={s.slots.filter(Boolean).length}/>}>
  <div className="play-pipeline">{stages.map((stage,i)=><div className={`play-stage ${s.stall&&i===2?"is-stalled":""}`} key={stage}><small>{stage}</small><b>{s.slots[i]??"·"}</b></div>)}</div>
  <div className="play-actions"><button className="play-primary" onClick={()=>model.change({...s,slots:advancePipeline(s.slots,`I${s.next}`,s.stall),next:s.next+(s.stall?0:1),message:s.stall?"Pipeline held: no stage advanced.":`Cycle advanced; instruction I${s.next} entered Fetch.`})}>Clock + instruction</button><button aria-pressed={s.stall} onClick={()=>model.change({...s,stall:!s.stall,message:`Stall ${s.stall?"cleared":"inserted"}.`})}>{s.stall?"Clear stall":"Insert stall"}</button></div><Feedback>{s.message}</Feedback>
 </Workbench>;
}

export function SchedulerBench(){
 const model=useMaterial({remaining:[5,3,7],turn:0,quantum:2,mode:"Round robin" as "Round robin"|"Shortest first",message:"Choose a policy and hand out CPU slices."}),s=model.state;
 const runnable=s.remaining.flatMap((v,i)=>v>0?[i]:[]),choice=s.mode==="Shortest first"?runnable.sort((a,b)=>s.remaining[a]-s.remaining[b])[0]??-1:runnable.find(i=>i>=s.turn)??runnable[0]??-1;
 return <Workbench id="scheduler" model={model} assumptions="Three CPU-only processes with fixed work units. A slice consumes up to two units. Round robin rotates after each slice; shortest-first chooses the least remaining work." readings={<Stat label="Next" value={choice<0?"Done":`P${choice+1}`}/>}>
  <Choices label="Scheduling policy" values={["Round robin","Shortest first"] as const} value={s.mode} onChange={mode=>model.change({...s,mode,message:`Switched to ${mode}. Remaining work is preserved.`})}/>
  <div className="play-process-lanes">{s.remaining.map((left,i)=><div key={i} className={choice===i?"is-selected":""}><strong>P{i+1}</strong><span style={{width:`${left/7*100}%`}}/><small>{left} work left</small></div>)}</div>
  <div className="play-actions"><button className="play-primary" disabled={choice<0} onClick={()=>model.change({...s,remaining:scheduleProcess(s.remaining,choice,s.quantum),turn:(choice+1)%3,message:`P${choice+1} used up to ${s.quantum} CPU units.`})}>Run next slice</button></div><Feedback>{s.message}</Feedback>
 </Workbench>;
}

export function FileSystemBench(){
 const model=useMaterial({blocks:["A","A",null,"B",null,null,"B",null,null,null] as (string|null)[],name:"C",size:3,mode:"Contiguous" as "Contiguous"|"Linked",message:"Place a new file into a fragmented block shelf."}),s=model.state;
 return <Workbench id="filesystem" model={model} assumptions="Ten equal disk blocks. Contiguous allocation needs one adjacent free run; linked allocation may use scattered free blocks. Metadata and seek time are omitted." readings={<Stat label="Free blocks" value={s.blocks.filter(v=>v===null).length}/>}>
  <Choices label="Allocation" values={["Contiguous","Linked"] as const} value={s.mode} onChange={mode=>model.change({...s,mode,message:`${mode} allocation selected.`})}/>
  <div className="play-disk-blocks">{s.blocks.map((file,i)=><button key={i} className={file?"is-on":""} onClick={()=>file&&model.change({...s,blocks:s.blocks.map((v,j)=>j===i?null:v),message:`Freed block ${i} from file ${file}.`})}><small>{i}</small><b>{file??"free"}</b></button>)}</div>
  <div className="play-actions"><button className="play-primary" onClick={()=>{const next=allocateFile(s.blocks,s.name,s.size,s.mode==="Contiguous");model.change({...s,blocks:next,name:String.fromCharCode(Math.min(90,s.name.charCodeAt(0)+1)),message:next===s.blocks?"Enough free blocks exist, but no contiguous run fits. Try linked allocation or free a neighbor.":`Allocated file ${s.name} in ${s.size} block(s).`})}}>Allocate {s.name}</button></div><Feedback>{s.message}</Feedback>
 </Workbench>;
}

export function BranchBench(){
 const model=useMaterial({counter:1,hits:0,total:0,message:"Choose outcomes and train a two-bit saturating predictor."}),s=model.state,predict=s.counter>=2;
 const choose=(taken:boolean)=>model.change({...s,counter:updatePredictor(s.counter,taken),hits:s.hits+Number(predict===taken),total:s.total+1,message:`Predicted ${predict?"taken":"not taken"}; branch was ${taken?"taken":"not taken"}.`});
 return <Workbench id="branch" model={model} assumptions="One branch and a two-bit saturating counter: states 0–1 predict not taken and 2–3 predict taken. Actual outcomes move the counter by one toward the observed direction." readings={<Stat label="Prediction" value={predict?"Taken":"Not taken"}/>}>
  <div className="play-predictor">{[0,1,2,3].map(i=><div className={`${i===s.counter?"is-on":""}`} key={i}><b>{i}</b><small>{i<2?"not taken":"taken"}</small></div>)}</div><div className="play-actions"><button onClick={()=>choose(false)}>Actual: not taken</button><button className="play-primary" onClick={()=>choose(true)}>Actual: taken</button><span>{s.hits}/{s.total} correct</span></div><Feedback>{s.message}</Feedback>
 </Workbench>;
}

export function DnsBench(){
 const stops=["Browser","Resolver","Root",".org","Authoritative"],model=useMaterial({at:0,cached:false,message:"Move the request outward until an authority answers."}),s=model.state;
 return <Workbench id="dns" model={model} assumptions="Simplified recursive DNS lookup for example.org. A completed lookup populates the browser cache; clearing it requires another trip. TTLs, retries, DNSSEC, and multiple records are omitted." readings={<Stat label="Answer" value={s.cached?"93.184.216.34":"Unknown"}/>}>
  <div className="play-relay">{stops.map((stop,i)=><React.Fragment key={stop}><button className={`play-node ${s.at===i?"is-on":""}`} onClick={()=>model.change({...s,at:i,message:`Moved the request to ${stop}.`})}>{i===0?"B":i===1?"R":i===2?"/":i===3?"org":"A"}<small>{stop}</small></button>{i<stops.length-1&&<span className="play-arrow">→</span>}</React.Fragment>)}</div>
  <div className="play-actions"><button className="play-primary" onClick={()=>s.cached?model.change({...s,message:"Browser cache answers immediately; no relay needed."}):s.at<4?model.change({...s,at:s.at+1,message:`Forwarded to ${stops[s.at+1]}.`}):model.change({...s,at:0,cached:true,message:"Authoritative answer returned and entered the browser cache."})}>{s.cached?"Resolve from cache":s.at<4?"Forward request":"Return answer"}</button><button onClick={()=>model.change({...s,cached:false,at:0,message:"Cache cleared."})}>Clear cache</button></div><Feedback>{s.message}</Feedback>
 </Workbench>;
}

export function LoadBalanceBench(){
 const model=useMaterial({loads:[2,0,1],online:[true,true,true],message:"Send work to the least-loaded healthy server."}),s=model.state,choice=chooseLeastLoaded(s.loads,s.online);
 return <Workbench id="loadbalance" model={model} assumptions="Three identical servers and least-connections routing. Each request adds one active connection; draining removes one. Offline servers receive no new work." readings={<Stat label="Next server" value={choice<0?"None":`S${choice+1}`}/>}>
  <div className="play-server-rack">{s.loads.map((load,i)=><div className={!s.online[i]?"is-offline":""} key={i}><button className={`play-node ${choice===i?"is-selected":""}`} onClick={()=>model.change({...s,online:s.online.map((v,j)=>j===i?!v:v),message:`Server ${i+1} is now ${s.online[i]?"offline":"online"}.`})}>S{i+1}</button><div>{Array.from({length:load},(_,j)=><span key={j}/>)}</div><button disabled={!load} onClick={()=>model.change({...s,loads:s.loads.map((v,j)=>j===i?Math.max(0,v-1):v),message:`One request finished on S${i+1}.`})}>Drain</button></div>)}</div>
  <div className="play-actions"><button className="play-primary" disabled={choice<0} onClick={()=>model.change({...s,loads:s.loads.map((v,i)=>i===choice?v+1:v),message:`Routed the request to S${choice+1}.`})}>Send request</button></div><Feedback>{s.message}</Feedback>
 </Workbench>;
}

export function TcpBench(){
 const model=useMaterial({window:1,inflight:0,delivered:0,message:"Fill the send window, acknowledge packets, then cause loss."}),s=model.state;
 return <Workbench id="tcp" model={model} assumptions="Toy additive-increase/multiplicative-decrease sender. Each acknowledgment increases the congestion window by one; loss halves it. The receiver and round-trip timing are not modeled." readings={<Stat label="Window" value={s.window}/>}>
  <div className="play-tcp-lane"><div className="play-packet-stack">{Array.from({length:s.inflight},(_,i)=><span className="play-tile" key={i}>P{s.delivered+i+1}</span>)}</div><span className="play-arrow">→</span><div className="play-destination"><output>{s.delivered}</output><span>delivered</span></div></div>
  <div className="play-actions"><button onClick={()=>model.change({...s,inflight:s.window,message:`Sent ${s.window} packet(s), filling the congestion window.`})}>Fill window</button><button className="play-primary" disabled={!s.inflight} onClick={()=>model.change({...s,window:tcpEvent(s.window,"ack"),delivered:s.delivered+s.inflight,inflight:0,message:"Acknowledged the flight; the window grew by one."})}>Acknowledge flight</button><button disabled={!s.inflight} onClick={()=>model.change({...s,window:tcpEvent(s.window,"loss"),inflight:0,message:"Packet loss cleared the flight and halved the window."})}>Lose a packet</button></div><Feedback>{s.message}</Feedback>
 </Workbench>;
}
