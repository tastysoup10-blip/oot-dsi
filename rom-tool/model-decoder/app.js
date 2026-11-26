// First-pass Ocarina of Time Link object geometry decoder.
const $=s=>document.querySelector(s);
let bundle=null, catalog=null;
const say=(m,bad=false)=>{$("#status").textContent=m;$("#status").className="status"+(bad?" bad":"");$("#log").textContent+="\n"+m;};
function u16(v,o){return v.getUint16(o,false)} function s16(v,o){return v.getInt16(o,false)} function u32(v,o){return v.getUint32(o,false)}
function readZip(buf){
 const v=new DataView(buf),out={};let p=0;
 while(p+30<=buf.byteLength&&v.getUint32(p,true)===0x04034b50){
  const method=v.getUint16(p+8,true),csize=v.getUint32(p+18,true),nlen=v.getUint16(p+26,true),elen=v.getUint16(p+28,true);
  const name=new TextDecoder().decode(new Uint8Array(buf,p+30,nlen));const start=p+30+nlen+elen;
  if(method!==0)throw Error("ZIP uses compression. Please use the ZIP created by the ROM extractor (stored entries).");
  if(start+csize>buf.byteLength)throw Error("ZIP entry extends beyond the file.");
  out[name]=new Uint8Array(buf.slice(start,start+csize));p=start+csize;
 }
 if(!Object.keys(out).length)throw Error("No stored ZIP entries found.");
 return out;
}
function decodePart(bytes,part){
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 const vertices=[],triangles=[],loaded=new Array(80).fill(null),visited=new Set();let commands=0,skipped=0;
 function vertexLoad(addr,n,dest){
  const seg=addr>>>24,off=addr&0xffffff;if(seg!==6||off+n*16>bytes.length){skipped++;return}
  for(let i=0;i<n;i++){const o=off+i*16;const vert={x:s16(view,o),y:s16(view,o+2),z:s16(view,o+4)};loaded[dest+i]=vert;}
 }
 function tri(a,b,c){const A=loaded[a],B=loaded[b],C=loaded[c];if(A&&B&&C)triangles.push([A,B,C]);else skipped++}
 function walk(start,depth){
  if(depth>12||visited.size>10000)return;
  let pc=start;
  for(let steps=0;steps<20000;steps++){
   if(pc<0||pc+8>bytes.length||visited.has(pc))return;
   visited.add(pc);commands++;const w0=u32(view,pc),w1=u32(view,pc+4),op=w0>>>24;pc+=8;
   if(op===0xDF)return;
   if(op===0x01){const n=(w0>>>12)&255,dest=(w0>>>1)&127;vertexLoad(w1,n,dest);continue;}
   if(op===0x05){tri(((w0>>>17)&127)>>>1,((w0>>>9)&127)>>>1,((w0>>>1)&127)>>>1);continue;}
   if(op===0x06){tri((w0>>>17)&127,(w0>>>9)&127,(w0>>>1)&127);tri(((w1>>>17)&127)>>>1,((w1>>>9)&127)>>>1,((w1>>>1)&127)>>>1);continue;}
   if(op===0xDE){const target=w1&0xffffff;if((w1>>>24)===6&&target<bytes.length)walk(target,depth+1);else skipped++;continue;}
   if(op===0x00&&w0===0&&w1===0)continue;
   skipped++;
  }
 }
 walk(part.dl,0);
 const unique=[];const index=new Map();
 for(const t of triangles){const face=[];for(const p of t){const k=p.x+","+p.y+","+p.z;let id=index.get(k);if(id===undefined){id=unique.length+1;index.set(k,id);unique.push(p)}face.push(id)}}
 return {name:part.name.replace(/Vtx\d*$/,""),vertices:unique,faces:triangles.length,indices:triangles.map(t=>t.map(p=>index.get(p.x+","+p.y+","+p.z))),commands,skipped};
}
function makeObj(parts){
 let lines=["# OoT DSi first-pass Link geometry export","# Geometry only; texture coordinates/materials/rig are not included."],base=0,total=0;
 for(const p of parts){if(!p.faces)continue;lines.push("","g "+p.name.replace(/[^A-Za-z0-9_]/g,"_"));for(const v of p.vertices)lines.push("v "+v.x+" "+v.y+" "+v.z);for(const f of p.indices)lines.push("f "+f.map(i=>i+base).join(" "));base+=p.vertices.length;total+=p.faces}
 return {text:lines.join("\n")+"\n",total};
}
async function init(){
 try{
  const r=await fetch("parts.json");if(!r.ok)throw Error("Could not load the model part catalog.");catalog=await r.json();
  $("#bundle").addEventListener("change",async e=>{
   try{const f=e.target.files[0];if(!f)return;const entries=readZip(await f.arrayBuffer());const report=JSON.parse(new TextDecoder().decode(entries["link-asset-report.json"]||new Uint8Array()));
    if(report.romVersion!=="NTSC 1.2 (USA)")throw Error("This decoder catalog currently targets NTSC 1.2 USA.");
    bundle={adult:entries["adult/object_link_boy.bin"],child:entries["child/object_link_child.bin"]};
    if(!bundle.adult||!bundle.child)throw Error("ZIP must contain adult/object_link_boy.bin and child/object_link_child.bin.");
    $("#decode").hidden=false;$("#summary").textContent="Loaded Adult ("+bundle.adult.length.toLocaleString()+" bytes) and Child ("+bundle.child.length.toLocaleString()+" bytes) object files.";say("Asset ZIP loaded. Select a character and decode.");
   }catch(err){say(err.message,true)}
  });
  $("#run").addEventListener("click",()=>{
   try{const key=$("#variant").value,bytes=bundle?.[key];if(!bytes)throw Error("Load the Link asset ZIP first.");
    const parts=catalog[key].filter(p=>/NearVtx$/.test(p.name)||/NearVtx\d+$/.test(p.name));
    const decoded=parts.map(p=>decodePart(bytes,p));const result=makeObj(decoded);
    if(!result.total)throw Error("No triangles were decoded. The display-list command layout may need another revision.");
    const blob=new Blob([result.text],{type:"text/plain"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="oot-"+key+"-link-first-pass.obj";a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
    const meshCount=decoded.filter(p=>p.faces).length,cmd=decoded.reduce((n,p)=>n+p.commands,0),skip=decoded.reduce((n,p)=>n+p.skipped,0);
    say("OBJ generated: "+result.total+" triangles across "+meshCount+" mesh parts. Display-list commands read: "+cmd+"; unsupported/invalid operations: "+skip+".");
   }catch(err){say(err.message,true)}
  });
 }catch(e){say(e.message,true)}
}
init();