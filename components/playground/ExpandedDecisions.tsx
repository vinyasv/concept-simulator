import React from "react";
import { Stat } from "../SimSDK";
import { Choices, Feedback, useMaterial, Workbench } from "./shared";
import { btreeInsert, planCost, classify, neuronOutput, qUpdate, canAccess } from "../../simulations/expandedPlayground";

export function BTreeBench(){
 const model=useMaterial({keys:[3,7,11],value:5,message:"Insert keys. A fourth key splits the leaf around its middle."}),s=model.state,next=btreeInsert(s.keys,s.value),split=next.length>3,mid=split?next[Math.floor(next.length/2)]:null;
 return <Workbench id="btree" model={model} assumptions="Order-four teaching B-tree. A leaf holds at most three keys; the fourth distinct key promotes a middle separator into a root with two leaf children. Deeper levels are omitted." readings={<Stat label="Tree height" value={s.keys.length>3?2:1}/>}>
  <div className="play-btree">{s.keys.length<=3?<div className="play-btree-node">{s.keys.map(k=><span key={k}>{k}</span>)}</div>:<><div className="play-btree-node is-root"><span>{s.keys[Math.floor(s.keys.length/2)]}</span></div><div className="play-btree-children"><div className="play-btree-node">{s.keys.slice(0,Math.floor(s.keys.length/2)).map(k=><span key={k}>{k}</span>)}</div><div className="play-btree-node">{s.keys.slice(Math.floor(s.keys.length/2)+1).map(k=><span key={k}>{k}</span>)}</div></div></>}</div>
  <div className="play-actions"><input aria-label="Index key" type="number" value={s.value} onChange={e=>model.change({...s,value:Number(e.target.value)})}/><button className="play-primary" onClick={()=>model.change({...s,keys:next,message:split?`Inserted ${s.value}; promoted ${mid} and split the leaf.`:`Inserted ${s.value} into sorted position.`})}>Insert key</button></div><Feedback>{s.message}</Feedback>
 </Workbench>;
}

export function QueryPlanBench(){
 const model=useMaterial({left:4,right:8,indexed:false,order:"Users first" as "Users first"|"Orders first",message:"Choose a join order and decide whether to build an index."}),s=model.state,outer=s.order==="Users first"?s.left:s.right,inner=s.order==="Users first"?s.right:s.left,cost=planCost(outer,inner,s.indexed);
 return <Workbench id="queryplan" model={model} assumptions="Toy join cost: nested loop scans outer×inner rows; an indexed lookup costs outer plus log2(inner) rounded up. Output cardinality and index-build cost are omitted." readings={<Stat label="Estimated work" value={cost}/>}>
  <Choices label="Join order" values={["Users first","Orders first"] as const} value={s.order} onChange={order=>model.change({...s,order,message:`${order} is now the outer input.`})}/>
  <div className="play-plan-tree"><div className="play-plan-op"><b>{s.indexed?"Index lookup":"Nested loop"}</b><small>{cost} work units</small></div><div className="play-plan-inputs"><button onClick={()=>model.change({...s,left:s.left===10?4:s.left+1,message:"Changed the Users collection size."})}>Users <b>{s.left}</b></button><button onClick={()=>model.change({...s,right:s.right===12?5:s.right+1,message:"Changed the Orders collection size."})}>Orders <b>{s.right}</b></button></div></div>
  <div className="play-actions"><button className={s.indexed?"is-on":""} aria-pressed={s.indexed} onClick={()=>model.change({...s,indexed:!s.indexed,message:`Index ${s.indexed?"removed":"added"}; estimated work recomputed.`})}>{s.indexed?"Remove index":"Add index"}</button></div><Feedback>{s.message}</Feedback>
 </Workbench>;
}

export function DecisionTreeBench(){
 const samples=[1,2,3,6,7,9],model=useMaterial({threshold:4,message:"Move the split; examples fall into two predicted classes."}),s=model.state;
 return <Workbench id="decisiontree" model={model} assumptions="One-dimensional examples and a single threshold split. Values at or below the threshold predict Blue; larger values predict Red. This does not train the threshold automatically." readings={<Stat label="Split" value={`x ≤ ${s.threshold}`}/>}>
  <div className="play-decision-line"><div className="play-threshold" style={{left:`${s.threshold*10}%`}}/><span className="play-zone is-blue">Blue</span><span className="play-zone is-red">Red</span>{samples.map(x=><button key={x} className={classify(x,s.threshold)==="Blue"?"is-blue":"is-red"} style={{left:`${x*10}%`}} onClick={()=>model.change({...s,threshold:x,message:`Moved threshold to sample ${x}.`})}>{x}</button>)}</div>
  <div className="play-actions"><button disabled={s.threshold<=1} onClick={()=>model.change({...s,threshold:s.threshold-1,message:"Moved the split left."})}>← threshold</button><button className="play-primary" disabled={s.threshold>=9} onClick={()=>model.change({...s,threshold:s.threshold+1,message:"Moved the split right."})}>threshold →</button></div><Feedback>{s.message}</Feedback>
 </Workbench>;
}

export function NeuralNetBench(){
 const model=useMaterial({inputs:[0,1],weights:[1,1],bias:-1,message:"Toggle inputs and tune weights until the neuron fires."}),s=model.state,sum=s.inputs.reduce((v,n,i)=>v+n*s.weights[i],s.bias),out=neuronOutput(s.inputs,s.weights,s.bias);
 return <Workbench id="neuralnet" model={model} assumptions="A binary threshold neuron with two binary inputs, integer weights, and integer bias. Output is 1 when the weighted sum is at least zero; there is no training loop." readings={<Stat label="Output" value={out}/>}>
  <div className="play-neuron">{s.inputs.map((input,i)=><div key={i} className="play-neuron-input"><button className={`play-node ${input?"is-on":""}`} onClick={()=>model.change({...s,inputs:s.inputs.map((v,j)=>j===i?1-v:v),message:`Input x${i+1} changed to ${1-input}.`})}>x{i+1}<small>{input}</small></button><button onClick={()=>model.change({...s,weights:s.weights.map((v,j)=>j===i?(v===2?-1:v+1):v),message:`Weight w${i+1} is now ${s.weights[i]===2?-1:s.weights[i]+1}.`})}>w{i+1}={s.weights[i]}</button></div>)}<span className="play-arrow">→</span><div className={`play-node ${out?"is-on":""}`}>{out}<small>Σ {sum}</small></div></div><Feedback>{s.message}</Feedback>
 </Workbench>;
}

export function ReinforcementBench(){
 const rewards=[0,0,-1,0,1],model=useMaterial({at:0,q:[0,0,0,0,0],message:"Move toward rewards and update the value of the state you left."}),s=model.state;
 const move=(next:number)=>{const reward=rewards[next],q=[...s.q];q[s.at]=qUpdate(q[s.at],reward,q[next]);return {...s,at:next,q,message:`Moved to ${next}; reward ${reward}. Updated state ${s.at} toward ${q[s.at].toFixed(2)}.`};};
 return <Workbench id="reinforcement" model={model} assumptions="Five-state line world. Moving into state 2 gives −1 and state 4 gives +1. Q-like state values update with learning rate 0.5 and discount 0.9; this is a teaching simplification." readings={<Stat label="Current value" value={s.q[s.at].toFixed(2)}/>}>
  <div className="play-reward-path">{rewards.map((reward,i)=><button key={i} className={`${i===s.at?"is-on":""} ${reward<0?"is-danger":reward>0?"is-goal":""}`} onClick={()=>Math.abs(i-s.at)===1&&model.change(move(i))}><b>{i===s.at?"●":reward===1?"+1":reward===-1?"−1":"·"}</b><small>V {s.q[i].toFixed(1)}</small></button>)}</div>
  <div className="play-actions"><button disabled={s.at===0} onClick={()=>model.change(move(s.at-1))}>Move left</button><button className="play-primary" disabled={s.at===4} onClick={()=>model.change(move(s.at+1))}>Move right</button></div><Feedback>{s.message}</Feedback>
 </Workbench>;
}

export function AccessBench(){
 const roles=["reader","editor","admin"] as const,resources=["Article","Draft","Users"],model=useMaterial({role:"reader",resource:"Draft",message:"Choose an identity role and try a resource door."}),s=model.state,allowed=canAccess(s.role,s.resource);
 return <Workbench id="access" model={model} assumptions="Fixed role-based access policy: readers may open Articles; editors also open Drafts; admins also open Users. Authentication, ownership, and deny overrides are omitted." readings={<Stat label="Decision" value={allowed?"Allow":"Deny"}/>}>
  <Choices label="Identity role" values={roles} value={s.role as typeof roles[number]} onChange={role=>model.change({...s,role,message:`Identity now carries the ${role} role.`})}/>
  <div className="play-door-row">{resources.map(resource=><button key={resource} className={`${resource===s.resource?"is-selected":""} ${resource===s.resource&&allowed?"is-on":""}`} onClick={()=>model.change({...s,resource,message:`${s.role} → ${resource}: ${canAccess(s.role,resource)?"allowed":"denied"}.`})}><span>{resource===s.resource&&allowed?"Open":"Closed"}</span><b>{resource}</b></button>)}</div><Feedback>{s.message}</Feedback>
 </Workbench>;
}
