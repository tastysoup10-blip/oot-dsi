// OoT Link object geometry decoder — conservative F3DEX2 pass.
const $=s=>document.querySelector(s);
let bundle=null,catalog=null;
const say=(m,bad=false)=>{$("#status").textContent=m;$("#status").className="status"+(bad?" bad":"");$("#log").textContent+="\n"+m;};
function s16(v,o){return v.getInt16(o,false)} function u32(v,o){return v.getUint32(o,false)}
function readZip(buf){
 const v=new DataView(buf),out={};let p=0;
 while(p+30<=buf.byteLength&&v.getUint32(p,true)===0x04034b50){
  const method=v.getUint16(p+8,true),csize=v.getUint32(p+18,true),nlen=v.getUint16(p+26,true),elen=v.getUint16(p+28,true);
  const name=new TextDecoder().decode(new Uint8Array(buf,p+30,nlen)),start=p+30+nlen+elen;
  if(method!==0)throw Error("ZIP uses compression. Please use the ZIP created by the ROM extractor.");
  if(start+csize>buf.byteLength)throw Error("ZIP entry extends beyond the file.");
  out[name]=new Uint8Array(buf.slice(start,start+csize));p=start+csize;
 }
 if(!Object.keys(out).length)throw Error("No stored ZIP entries found.");
 return out;
}
function decodePart(bytes,part){
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 const loaded=new Array(32).fill(null),triangles=[],activeLists=new Set();
 let commands=0,unsupported=0,badVertices=0,degenerate=0;
 function loadVertices(addr,n,dest){
  const seg=addr>>>24,off=addr&0xffffff;
  if(seg!==6||n<1||n>32||dest<0||dest+n>32||off+n*16>bytes.length){badVertices++;return;}
  for(let i=0;i<n;i++){const o=off+i*16;loaded[dest+i]={x:s16(view,o),y:s16(view,o+2),z:s16(view,o+4)};}
 }
 function addTri(a,b,c){
  const A=loaded[a],B=loaded[b],C=loaded[c];
  if(!A||!B||!C){badVertices++;return;}
  if(a===b||b===c||a===c||(A.x===B.x&&A.y===B.y&&A.z===B.z)||(B.x===C.x&&B.y===C.y&&B.z===C.z)||(A.x===C.x&&A.y===C.y&&A.z===C.z)){degenerate++;return;}
  triangles.push([A,B,C]);
 }
 function walk(start,depth){
  if(depth>16||activeLists.has(start))return;
  activeLists.add(start);
  let pc=start;
  for(let steps=0;steps<12000;steps++){
   if(pc<0||pc+8>bytes.length)break;
   const at=pc,w0=u32(view,pc),w1=u32(view,pc+4),op=w0>>>24;pc+=8;commands++;
   if(op===0xDF)break;
   if(op===0x01){
    // F3DEX2 G_VTX: n vertices are loaded beginning at v0.
    const n=(w0>>>12)&0xff,dest=(w0>>>1)&0x7f;
    loadVertices(w1,n,dest);continue;
   }
   if(op===0x05){
    // F3DEX2 triangle indices are encoded in even-numbered units.
    addTri(((w0>>>17)&0x7f)>>>1,((w0>>>9)&0x7f)>>>1,((w0>>>1)&0x7f)>>>1);continue;
   }
   if(op===0x06){
    addTri(((w0>>>17)&0x7f)>>>1,((w0>>>9)&0x7f)>>>1,((w0>>>1)&0x7f)>>>1);
    addTri(((w1>>>17)&0x7f)>>>1,((w1>>>9)&0x7f)>>>1,((w1>>>1)&0x7f)>>>1);continue;
   }
   if(op===0xDE){
    const target=w1&0xffffff,seg=w1>>>24,push=(w0&0x00ff0000)===0;
    if(seg!==6||target+8>bytes.length){unsupported++;continue;}
    if(push){walk(target,depth+1);}
    else {walk(target,depth+1);break;}
    continue;
   }
   unsupported++;
  }
  activeLists.delete(start);
 }
 walk(part.dl,0);
 const verts=[],lookup=new Map(),faces=[];
 for(const t of triangles){
  const f=[];
  for(const p of t){const k=p.x+","+p.y+","+p.z;let id=lookup.get(k);if(id===undefined){id=verts.length+1;lookup.set(k,id);verts.push(p);}f.push(id);}
  if(new Set(f).size===3)faces.push(f);else degenerate++;
 }
 return {name:part.name.replace(/Vtx\d*$/,""),vertices:verts,faces,commands,unsupported,badVertices,degenerate};
}
function makeObj(parts){
 const lines=["# OoT DSi Link geometry export — experimental","", "# Geometry only; no UVs, materials, skeleton, or animation."];
 let base=0,total=0;
 for(const p of parts){if(!p.faces.length)continue;lines.push("","g "+p.name.replace(/[^A-Za-z0-9_]/g,"_"));for(const v of p.vertices)lines.push("v "+v.x+" "+v.y+" "+v.z);for(const f of p.faces)lines.push("f "+f.map(i=>i+base).join(" "));base+=p.vertices.length;total+=p.faces.length;}
 return {text:lines.join("\n")+"\n",total};
}
async function init(){
 try{
  const r=await fetch("parts.json");if(!r.ok)throw Error("Could not load the model part catalog.");catalog=await r.json();
  $("#bundle").addEventListener("change",async e=>{
   try{const f=e.target.files[0];if(!f)return;const entries=readZip(await f.arrayBuffer());const report=JSON.parse(new TextDecoder().decode(entries["link-asset-report.json"]||new Uint8Array()));
    if(report.romVersion!=="NTSC 1.2 (USA)")throw Error("This decoder catalog currently targets NTSC 1.2 USA.");
    bundle={adult:entries["adult/object_link_boy.bin"],child:entries["child/object_link_child.bin"]};
    if(!bundle.adult||!bundle.child)throw Error("ZIP must contain both Link object binaries.");
    $("#decode").hidden=false;$("#summary").textContent="Loaded Adult ("+bundle.adult.length.toLocaleString()+" bytes) and Child ("+bundle.child.length.toLocaleString()+" bytes) object files.";say("Asset ZIP loaded. Select a character and decode.");
   }catch(err){say(err.message,true);}
  });
  $("#run").addEventListener("click",()=>{
   try{const key=$("#variant").value,bytes=bundle?.[key];if(!bytes)throw Error("Load the Link asset ZIP first.");
    const parts=catalog[key].filter(p=>/NearVtx\d*$/.test(p.name));
    const decoded=parts.map(p=>decodePart(bytes,p)),result=makeObj(decoded);
    if(!result.total)throw Error("No valid triangles survived decoding. The display-list parser still needs work; no OBJ was downloaded.");
    const blob=new Blob([result.text],{type:"text/plain"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="oot-"+key+"-link-experimental.obj";a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
    const sum=k=>decoded.reduce((n,p)=>n+p[k],0),mesh=decoded.filter(p=>p.faces.length).length;
    say("Experimental OBJ generated: "+result.total+" non-degenerate triangles in "+mesh+" parts. Commands: "+sum("commands")+". Skipped/unsupported: "+sum("unsupported")+". Invalid vertex references: "+sum("badVertices")+". Degenerate triangles discarded: "+sum("degenerate")+".");
   }catch(err){say(err.message,true);}
  });
 }catch(e){say(e.message,true);}
}
init();