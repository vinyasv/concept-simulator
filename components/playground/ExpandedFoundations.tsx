import React from "react";
import { Stat } from "../SimSDK";
import { Choices, Feedback, useMaterial, Workbench } from "./shared";
import {
  convertBase, evenParity, parityValid, runLengthEncode, insertAt, removeAt,
  unionGroups, heapInsert, heapPop, TreeNode, treeInsert, treePath,
  reachableObjects, pageForAddress,
} from "../../simulations/expandedPlayground";

export function BasesBench() {
  const model = useMaterial({ value: 42, base: 2, message: "Toggle place tiles to build a value." }), s = model.state;
  const places = [128, 64, 32, 16, 8, 4, 2, 1];
  return <Workbench id="bases" model={model} assumptions="Unsigned integers from 0 to 255. Place tiles build the same quantity; base 2, 8, 10, or 16 changes only its notation." readings={<Stat label={`Base ${s.base}`} value={convertBase(s.value, s.base)} />}>
    <Choices label="Display base" values={["2", "8", "10", "16"]} value={String(s.base)} onChange={base => model.change({...s, base:Number(base), message:`The quantity stays ${s.value}; only the symbols change.`})} />
    <div className="play-objects">{places.map(place => <button key={place} className={`play-tile ${s.value & place ? "is-on" : ""}`} aria-pressed={Boolean(s.value & place)} onClick={() => model.change({...s, value:s.value ^ place, message:`${s.value & place ? "Removed" : "Added"} place value ${place}.`})}><small>{place}</small><b>{s.value & place ? 1 : 0}</b></button>)}</div>
    <Feedback>{s.message}</Feedback>
  </Workbench>;
}

export function ParityBench() {
  const model = useMaterial({ bits:[1,0,1,1,0,0,1], parity:0, sent:false, message:"Set seven data bits, then attach an even-parity bit." }), s=model.state;
  const expected=evenParity(s.bits), valid=parityValid(s.bits,s.parity);
  return <Workbench id="parity" model={model} assumptions="Seven data bits plus one even-parity bit. Parity detects any odd number of flipped bits, but not every multi-bit error." readings={<Stat label="Receiver" value={s.sent ? (valid?"Valid":"Error") : "Waiting"} />}>
    <div className="play-signal-strip">{s.bits.map((bit,i)=><button key={i} className={bit?"is-on":""} onClick={()=>model.change({...s,bits:s.bits.map((b,j)=>j===i?1-b:b),message:s.sent?`Bit ${i+1} flipped in transit.`:`Data bit ${i+1} changed.`})}>{bit}</button>)}<span>+</span><button className={s.parity?"is-on":""} onClick={()=>model.change({...s,parity:1-s.parity,message:"Parity bit flipped."})}>{s.parity}<small>parity</small></button></div>
    <div className="play-actions"><button className="play-primary" onClick={()=>model.change({...s,parity:expected,sent:true,message:"Sent. Now flip one or two bits and watch what parity can detect."})}>Attach parity & send</button></div>
    <Feedback>{s.sent ? `${valid?"Even parity still agrees":"Parity disagrees: the receiver detects corruption"}.` : s.message}</Feedback>
  </Workbench>;
}

export function CompressionBench() {
  const model=useMaterial({text:"AAABBCCCC",selected:"A",message:"Add symbols. Adjacent repeats collapse into one run."}),s=model.state,runs=runLengthEncode(s.text),encoded=runs.map(r=>`${r.count}${r.symbol}`).join("");
  return <Workbench id="compression" model={model} assumptions="Run-length encoding stores each consecutive run as count plus symbol. This toy measure counts those two symbols and ignores headers and character byte widths." readings={<><Stat label="Raw" value={s.text.length}/><Stat label="Encoded" value={encoded.length}/></>}>
    <Choices label="Symbol" values={["A","B","C"]} value={s.selected} onChange={selected=>model.change({...s,selected})}/>
    <div className="play-run-builder">{runs.map((run,i)=><button key={i} className="play-tile" onClick={()=>model.change({...s,selected:run.symbol,message:`This block stores ${run.count} adjacent ${run.symbol} symbol${run.count===1?"":"s"}.`})}><b>{run.symbol}</b><small>× {run.count}</small></button>)}</div>
    <div className="play-actions"><button className="play-primary" onClick={()=>model.change({...s,text:(s.text+s.selected).slice(-18),message:`Added ${s.selected}; ${runLengthEncode(s.text+s.selected).length} runs now.`})}>Add {s.selected}</button><button onClick={()=>model.change({...s,text:s.text.slice(0,-1),message:"Removed the last symbol."})}>Remove last</button><code>{encoded||"empty"}</code></div>
    <Feedback>{s.message}</Feedback>
  </Workbench>;
}

export function PixelsBench(){
  const model=useMaterial({pixels:Array(25).fill(false) as boolean[],message:"Paint pixels to store a five-by-five monochrome image."}),s=model.state;
  return <Workbench id="pixels" model={model} assumptions="A 5×5 one-bit bitmap in row-major order. Each pixel occupies one modeled bit; real image formats add metadata and often use color channels and compression." readings={<Stat label="Bits set" value={`${s.pixels.filter(Boolean).length} / 25`}/>}>
    <div className="play-pixel-grid">{s.pixels.map((on,i)=><button key={i} className={on?"is-on":""} aria-label={`Pixel ${i+1}`} aria-pressed={on} onClick={()=>model.change({...s,pixels:s.pixels.map((v,j)=>j===i?!v:v),message:`Pixel ${i+1} is now ${on?"0":"1"}.`})}/>)}</div><Feedback>{s.message}</Feedback>
  </Workbench>;
}

export function ArrayBench(){
 const model=useMaterial({values:[3,7,9,12],index:2,value:5,message:"Choose an index; later values must shift right."}),s=model.state;
 return <Workbench id="arrays" model={model} assumptions="A bounded array with room for eight integers. Inserting at index i shifts every later element one slot; deleting closes the gap." readings={<Stat label="Occupied" value={`${s.values.length} / 8`}/>}>
  <div className="play-slot-row">{Array.from({length:8},(_,i)=><button key={i} className={`play-tile ${s.index===i?"is-selected":""}`} onClick={()=>model.change({...s,index:Math.min(i,s.values.length),message:`Insertion point ${Math.min(i,s.values.length)} selected.`})}><small>[{i}]</small><b>{s.values[i]??"·"}</b></button>)}</div>
  <div className="play-actions"><input aria-label="Value to insert" type="number" value={s.value} onChange={e=>model.change({...s,value:Number(e.target.value)})}/><button className="play-primary" disabled={s.values.length>=8} onClick={()=>model.change({...s,values:insertAt(s.values,s.index,s.value),message:`Inserted ${s.value}; ${s.values.length-s.index} value(s) shifted.`})}>Insert here</button><button disabled={!s.values.length} onClick={()=>model.change({...s,values:removeAt(s.values,Math.min(s.index,s.values.length-1)),message:"Deleted one slot and closed the gap."})}>Delete here</button></div><Feedback>{s.message}</Feedback>
 </Workbench>;
}

export function LinkedBench(){
 const model=useMaterial({order:[0,1,2,3],cut:null as number|null,message:"Choose a node, then choose where its next pointer should lead."}),s=model.state;
 return <Workbench id="linked" model={model} assumptions="Four persistent nodes. Reordering changes next pointers, not node identity or storage position. This material keeps a single acyclic chain." readings={<Stat label="Head" value={`node ${s.order[0]}`}/>}>
  <div className="play-linked-row">{s.order.map((node,i)=><React.Fragment key={node}><button className={`play-tile ${s.cut===i?"is-selected":""}`} onClick={()=>s.cut===null?model.change({...s,cut:i,message:`Node ${node} lifted. Choose another position.`}):model.change({...s,order:insertAt(removeAt(s.order,s.cut),i,s.order[s.cut]),cut:null,message:`Reconnected node ${s.order[s.cut]} at position ${i}.`})}><small>node {node}</small><b>{[8,3,11,5][node]}</b></button>{i<s.order.length-1&&<span className="play-arrow">→</span>}</React.Fragment>)}</div><Feedback>{s.message}</Feedback>
 </Workbench>;
}

export function UnionFindBench(){
 const model=useMaterial({parents:[0,1,2,3,4,5],selected:null as number|null,message:"Choose two objects to join their groups."}),s=model.state;
 const root=(n:number)=>{while(s.parents[n]!==n)n=s.parents[n];return n;};
 return <Workbench id="unionfind" model={model} assumptions="Six objects, union by the first selected root. Find follows parent links. This small forest omits rank and path compression so group changes stay visible." readings={<Stat label="Groups" value={new Set(s.parents.map((_,i)=>root(i))).size}/>}>
  <div className="play-cluster">{s.parents.map((_,i)=><div className="play-peer" key={i}><button className={`play-node ${s.selected===i?"is-selected":""}`} style={{borderColor:["#176c63","#9b6a39","#57749a","#8a5d83","#777","#54795c"][root(i)]}} onClick={()=>s.selected===null?model.change({...s,selected:i,message:`Object ${i} selected; choose another.`}):model.change({...s,parents:unionGroups(s.parents,s.selected,i),selected:null,message:`Joined the groups containing ${s.selected} and ${i}.`})}>{i}</button><small>root {root(i)}</small></div>)}</div><Feedback>{s.message}</Feedback>
 </Workbench>;
}

export function HeapBench(){
 const model=useMaterial({heap:[2,5,7,9,8],value:4,message:"Insert a priority; the smallest value belongs at the root."}),s=model.state;
 return <Workbench id="heap" model={model} assumptions="Array-backed binary min-heap with unique or repeated integer priorities. Insert bubbles upward; remove-min moves the last item to the root and restores the heap invariant." readings={<Stat label="Next out" value={s.heap[0]??"Empty"}/>}>
  <div className="play-heap-tree">{s.heap.map((value,i)=><div key={i} className="play-node" style={{gridColumn:`${(i-(2**Math.floor(Math.log2(i+1))-1))*2+1} / span 2`}}>{value}<small>i{i}</small></div>)}</div>
  <div className="play-actions"><input aria-label="Priority" type="number" value={s.value} onChange={e=>model.change({...s,value:Number(e.target.value)})}/><button className="play-primary" onClick={()=>model.change({...s,heap:heapInsert(s.heap,s.value),message:`Inserted ${s.value}; smaller priorities climbed.`})}>Insert</button><button onClick={()=>model.change({...s,heap:heapPop(s.heap),message:`Removed minimum ${s.heap[0]??""}; restored heap order.`})}>Remove min</button></div><Feedback>{s.message}</Feedback>
 </Workbench>;
}

const flattenTree=(node:TreeNode|null,depth=0,x=50,out:{value:number;depth:number;x:number}[]=[]):typeof out=>{if(!node)return out;flattenTree(node.left,depth+1,x-18/(depth+1),out);out.push({value:node.value,depth,x});flattenTree(node.right,depth+1,x+18/(depth+1),out);return out;};
export function TreeBench(){
 const initial=[8,4,12,2,6,10,14].reduce<TreeNode|null>((n,v)=>treeInsert(n,v),null);
 const model=useMaterial({tree:initial,value:5,path:[] as number[],message:"Plant a value; comparisons decide left or right."}),s=model.state,nodes=flattenTree(s.tree);
 return <Workbench id="tree" model={model} assumptions="Unbalanced binary search tree with unique integer keys. Smaller keys go left and larger keys go right; shape depends on insertion order." readings={<Stat label="Visited" value={s.path.length}/>}>
  <div className="play-tree-canvas">{nodes.map((n,i)=><button key={i} className={`play-node ${s.path.includes(n.value)?"is-on":""}`} style={{left:`${n.x}%`,top:`${12+n.depth*27}%`}} onClick={()=>model.change({...s,value:n.value,path:treePath(s.tree,n.value),message:`Search path: ${treePath(s.tree,n.value).join(" → ")}.`})}>{n.value}</button>)}</div>
  <div className="play-actions"><input aria-label="Tree value" type="number" value={s.value} onChange={e=>model.change({...s,value:Number(e.target.value)})}/><button className="play-primary" onClick={()=>model.change({...s,tree:treeInsert(s.tree,s.value),path:treePath(treeInsert(s.tree,s.value),s.value),message:`Planted ${s.value} along the highlighted comparison path.`})}>Plant value</button><button onClick={()=>model.change({...s,path:treePath(s.tree,s.value),message:`Search ${s.value}: ${treePath(s.tree,s.value).join(" → ")||"empty"}.`})}>Search</button></div><Feedback>{s.message}</Feedback>
 </Workbench>;
}

export function GarbageBench(){
 const links=[[1,2],[3],[3],[],[5],[]], model=useMaterial({roots:[0,4],message:"Toggle roots. Unreachable objects become collectible."}),s=model.state,live=reachableObjects(s.roots,links);
 return <Workbench id="gc" model={model} assumptions="Mark-and-sweep reachability over six objects and fixed directed references. Root removal does not immediately reuse memory; collectible objects are those the marker cannot reach." readings={<Stat label="Collectible" value={6-live.size}/>}>
  <div className="play-object-map">{links.map((targets,i)=><div key={i} className={`play-peer ${live.has(i)?"":"is-garbage"}`}><button className={`play-node ${s.roots.includes(i)?"is-on":""}`} onClick={()=>model.change({...s,roots:s.roots.includes(i)?s.roots.filter(r=>r!==i):[...s.roots,i],message:`Object ${i} ${s.roots.includes(i)?"is no longer":"is now"} a root.`})}>{i}</button><small>{s.roots.includes(i)?"root":live.has(i)?"reachable":"collectible"}</small><code>→ {targets.join(",")||"∅"}</code></div>)}</div><Feedback>{s.message}</Feedback>
 </Workbench>;
}

export function PagingBench(){
 const model=useMaterial({frames:[0,2,null] as (number|null)[],address:13,message:"Translate an address; load its page if it is absent."}),s=model.state,part=pageForAddress(s.address),frame=s.frames.indexOf(part.page);
 return <Workbench id="paging" model={model} assumptions="Sixteen virtual bytes, four-byte pages, and three physical frames. Loading a missing page replaces frame zero. Address translation preserves the page offset." readings={<Stat label="Translation" value={frame<0?"Page fault":`F${frame} + ${part.offset}`}/>}>
  <div className="play-page-map"><div className="play-memory-column"><strong>Virtual pages</strong>{[0,1,2,3].map(page=><button key={page} className={page===part.page?"is-selected":""} onClick={()=>model.change({...s,address:page*4+s.address%4,message:`Selected virtual page ${page}.`})}>P{page}<small>bytes {page*4}–{page*4+3}</small></button>)}</div><span className="play-arrow">→</span><div className="play-memory-column"><strong>Frames</strong>{s.frames.map((page,i)=><button key={i} className={i===frame?"is-on":""}>F{i}<small>{page===null?"empty":`page ${page}`}</small></button>)}</div></div>
  <div className="play-actions"><input aria-label="Virtual address" type="number" min="0" max="15" value={s.address} onChange={e=>model.change({...s,address:Math.max(0,Math.min(15,Number(e.target.value)))})}/><button className="play-primary" onClick={()=>frame<0?model.change({...s,frames:[part.page,...s.frames.slice(1)],message:`Page fault: loaded page ${part.page} into frame 0.`}):model.change({...s,message:`Hit: page ${part.page} is already in frame ${frame}.`})}>Translate</button></div><Feedback>{s.message}</Feedback>
 </Workbench>;
}
