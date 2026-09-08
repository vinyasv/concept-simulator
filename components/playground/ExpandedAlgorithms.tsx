import React from "react";
import { Stat } from "../SimSDK";
import { Feedback, useMaterial, Workbench } from "./shared";
import { binarySearchStep, shortestDistances, factorialFrames, coinChange, knapsackValue, matchAt, WeightedEdge } from "../../simulations/expandedPlayground";

export function BinarySearchBench(){
 const values=[2,5,8,12,16,23,31,40], model=useMaterial({target:23,low:0,high:7,last:-1,found:false,message:"Choose a target, then decide which half survives."}),s=model.state;
 const restart=(target:number)=>({target,low:0,high:7,last:-1,found:false,message:`Searching for ${target}. Inspect the middle tile.`});
 return <Workbench id="binarysearch" model={model} assumptions="Eight fixed sorted unique values. Each step compares the middle element and removes the half that cannot contain the target." readings={<Stat label="Candidates" value={Math.max(0,s.high-s.low+1)}/>}>
  <div className="play-slot-row">{values.map((v,i)=><button key={v} className={`${i<s.low||i>s.high?"is-muted":""} ${i===s.last?"is-selected":""} ${s.found&&i===s.last?"is-on":""}`} onClick={()=>model.change(restart(v))}><small>{i}</small><b>{v}</b></button>)}</div>
  <div className="play-actions"><button className="play-primary" disabled={s.found||s.low>s.high} onClick={()=>{const n=binarySearchStep(values,s.target,s.low,s.high);model.change({...s,...n,last:n.mid,message:n.found?`Found ${s.target} at index ${n.mid}.`:n.mid<0?`${s.target} is absent.`:`Compared with ${values[n.mid]}; kept indices ${n.low}–${n.high}.`})}}>Compare middle</button><span>Target {s.target}</span></div><Feedback>{s.message}</Feedback>
 </Workbench>;
}

const mazeNeighbors=(cell:number,walls:Set<number>)=>{const r=Math.floor(cell/5),c=cell%5;return [[r-1,c],[r+1,c],[r,c-1],[r,c+1]].flatMap(([y,x])=>y>=0&&y<5&&x>=0&&x<5&&!walls.has(y*5+x)?[y*5+x]:[])};
export function MazeBench(){
 const model=useMaterial({walls:[7,8,12,17],frontier:[0],seen:[0],message:"Place walls, then grow the frontier one layer at a time."}),s=model.state,walls=new Set(s.walls),goal=24;
 const step=()=>{const next=[...new Set(s.frontier.flatMap(c=>mazeNeighbors(c,walls)).filter(c=>!s.seen.includes(c)))];return {...s,frontier:next,seen:[...s.seen,...next],message:next.includes(goal)?"The frontier reached the goal.":next.length?`Frontier expanded into ${next.length} new cell(s).`:"No path remains. Remove a wall."};};
 return <Workbench id="maze" model={model} assumptions="A 5×5 orthogonal grid. The frontier expands breadth first; every open move costs one. Start and goal cannot become walls." readings={<Stat label="Reached" value={`${s.seen.length} / ${25-s.walls.length}`}/>}>
  <div className="play-maze-grid">{Array.from({length:25},(_,i)=><button key={i} className={`${walls.has(i)?"is-wall":""} ${s.frontier.includes(i)?"is-on":""} ${s.seen.includes(i)?"is-seen":""}`} disabled={i===0||i===goal} aria-label={`Cell ${i}${i===0?", start":i===goal?", goal":""}`} onClick={()=>model.change({...s,walls:walls.has(i)?s.walls.filter(w=>w!==i):[...s.walls,i],frontier:[0],seen:[0],message:`${walls.has(i)?"Removed":"Placed"} a wall; search restarted.`})}>{i===0?"S":i===goal?"G":""}</button>)}</div>
  <div className="play-actions"><button className="play-primary" onClick={()=>model.change(step())} disabled={!s.frontier.length||s.seen.includes(goal)}>Grow frontier</button></div><Feedback>{s.message}</Feedback>
 </Workbench>;
}

export function ShortestPathBench(){
 const base:WeightedEdge[]=[[0,1,2],[0,2,5],[1,2,1],[1,3,4],[2,3,1]],model=useMaterial({edges:base,selected:1,message:"Change a road cost and watch the best distances reroute."}),s=model.state,dist=shortestDistances(4,s.edges,0);
 const pts=[[10,50],[37,18],[63,78],[90,45]];
 return <Workbench id="shortest" model={model} assumptions="Four-node undirected graph with positive integer weights. Distances are recomputed with Dijkstra's algorithm from A." readings={<Stat label="A → D" value={dist[3]}/>}>
  <div className="play-weighted-map"><svg viewBox="0 0 100 100">{s.edges.map(([a,b,w],i)=><g key={i} onClick={()=>model.change({...s,selected:i,message:`Road ${"ABCD"[a]}–${"ABCD"[b]} selected.`})}><line className={s.selected===i?"is-selected":""} x1={pts[a][0]} y1={pts[a][1]} x2={pts[b][0]} y2={pts[b][1]}/><text x={(pts[a][0]+pts[b][0])/2} y={(pts[a][1]+pts[b][1])/2}>{w}</text></g>)}</svg>{pts.map(([x,y],i)=><button key={i} className="play-node" style={{left:`${x}%`,top:`${y}%`}}>{"ABCD"[i]}<small>{dist[i]}</small></button>)}</div>
  <div className="play-actions"><button onClick={()=>model.change({...s,edges:s.edges.map((e,i)=>i===s.selected?[e[0],e[1],Math.max(1,e[2]-1)]:e) as WeightedEdge[],message:"Lowered the selected road cost."})}>− cost</button><button className="play-primary" onClick={()=>model.change({...s,edges:s.edges.map((e,i)=>i===s.selected?[e[0],e[1],e[2]+1]:e) as WeightedEdge[],message:"Raised the selected road cost; shortest distances recomputed."})}>+ cost</button></div><Feedback>{s.message}</Feedback>
 </Workbench>;
}

export function RecursionBench(){
 const model=useMaterial({n:5,phase:0,message:"Push calls down to the base case, then unwind returns."}),s=model.state,frames=factorialFrames(s.n),depth=Math.min(s.phase,frames.length),unwinding=s.phase>frames.length,result=unwinding?Array.from({length:s.phase-frames.length},(_,i)=>i+1).reduce((a,b)=>a*b,1):1;
 return <Workbench id="recursion" model={model} assumptions="Factorial n! with n from 1 to 6. Each recursive call waits on the stack until the base case returns 1, then multiplication unwinds." readings={<Stat label="Returned" value={s.phase>=frames.length*2?s.n+"! = "+frames[0].stack.reduce((a,b)=>a*b,1):result}/>}>
  <div className="play-call-stack">{Array.from({length:depth},(_,i)=><div className={`play-tile ${unwinding&&i>=frames.length-(s.phase-frames.length)?"is-on":""}`} key={i}><code>factorial({s.n-i})</code><small>{unwinding?"returning":"waiting"}</small></div>)}</div>
  <div className="play-actions"><button className="play-primary" disabled={s.phase>=frames.length*2} onClick={()=>model.change({...s,phase:s.phase+1,message:s.phase+1<frames.length?`Called factorial(${s.n-s.phase-1}).`:s.phase+1===frames.length?"Base case returns 1.":"A waiting call multiplies the returned value."})}>Next call / return</button><button onClick={()=>model.change({...s,n:s.n===6?3:s.n+1,phase:0,message:"Changed n; the stack is empty again."})}>Change n</button></div><Feedback>{s.message}</Feedback>
 </Workbench>;
}

export function DynamicBench(){
 const model=useMaterial({coins:[1,3,4],target:6,revealed:0,message:"Choose coin sizes, then reveal reusable answers from 0 upward."}),s=model.state,best=coinChange(s.coins,s.target);
 return <Workbench id="dynamic" model={model} assumptions="Minimum-coin change for targets 0 through 10 with reusable unlimited positive coin denominations. Each cell uses already-solved smaller amounts." readings={<Stat label={`Best for ${s.target}`} value={s.revealed>=s.target?best[s.target]:"?"}/>}>
  <div className="play-dp-board">{best.map((value,i)=><button key={i} className={i<=s.revealed?"is-on":""} onClick={()=>model.change({...s,target:i,message:`Target changed to ${i}.`})}><small>{i}</small><b>{i<=s.revealed?(Number.isFinite(value)?value:"∞"):"?"}</b></button>)}</div>
  <div className="play-actions"><span>Coins {s.coins.join(", ")}</span><button className="play-primary" disabled={s.revealed>=s.target} onClick={()=>model.change({...s,revealed:s.revealed+1,message:`Solved amount ${s.revealed+1} using earlier cells.`})}>Reveal next</button><button onClick={()=>model.change({...s,coins:s.coins.includes(3)?[1,4]:[1,3,4],revealed:0,message:"Changed available coins; cleared the board."})}>{s.coins.includes(3)?"Remove 3 coin":"Add 3 coin"}</button></div><Feedback>{s.message}</Feedback>
 </Workbench>;
}

export function KnapsackBench(){
 const weights=[2,3,4,5],values=[3,4,5,8],model=useMaterial({selected:[false,false,false,false],message:"Pack objects up to weight seven."}),s=model.state,total=knapsackValue(s.selected,weights,values),over=total.weight>7;
 return <Workbench id="knapsack" model={model} assumptions="Four indivisible items and capacity seven. Weight and value add; this is the 0/1 knapsack problem, so each item is either in or out." readings={<><Stat label="Weight" value={`${total.weight} / 7`}/><Stat label="Value" value={total.value}/></>}>
  <div className={`play-knapsack ${over?"is-over":""}`}><div className="play-bag">{s.selected.map((on,i)=>on&&<span key={i}>{"◆●■▲"[i]}</span>)}</div><div className="play-objects">{s.selected.map((on,i)=><button key={i} className={`play-tile ${on?"is-on":""}`} onClick={()=>model.change({...s,selected:s.selected.map((v,j)=>j===i?!v:v),message:`${on?"Removed":"Packed"} item ${i+1}.`})}><b>{"◆●■▲"[i]}</b><small>w{weights[i]} · v{values[i]}</small></button>)}</div></div><Feedback>{over?"The bag is over capacity. Remove or swap an item.":s.message}</Feedback>
 </Workbench>;
}

export function StringMatchBench(){
 const text="BANANABANDANA",pattern="ANA",model=useMaterial({index:0,comparisons:0,message:"Slide the pattern; matching symbols line up vertically."}),s=model.state,match=matchAt(text,pattern,s.index);
 return <Workbench id="stringmatch" model={model} assumptions="Naive exact substring matching over uppercase symbols. The three-symbol pattern is compared at each valid alignment from left to right." readings={<Stat label="Alignment" value={match?"Match":"Mismatch"}/>}>
  <div className="play-pattern-scene"><div className="play-letter-row">{[...text].map((c,i)=><span className={i>=s.index&&i<s.index+pattern.length?"is-window":""} key={i}>{c}</span>)}</div><div className="play-letter-row play-pattern" style={{transform:`translateX(${s.index*32}px)`}}>{[...pattern].map((c,i)=><span className={text[s.index+i]===c?"is-on":"is-miss"} key={i}>{c}</span>)}</div></div>
  <div className="play-actions"><button disabled={s.index===0} onClick={()=>model.change({...s,index:s.index-1,comparisons:s.comparisons+1,message:"Slid left one position."})}>← Slide</button><button className="play-primary" disabled={s.index>=text.length-pattern.length} onClick={()=>model.change({...s,index:s.index+1,comparisons:s.comparisons+1,message:`Slid to index ${s.index+1}.`})}>Slide →</button></div><Feedback>{match?`All three symbols match at index ${s.index}.`:s.message}</Feedback>
 </Workbench>;
}
