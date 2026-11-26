// Local OBJ-to-libnds mesh converter. No network requests or uploads.
const input=document.querySelector("#model"), statusBox=document.querySelector("#status"), result=document.querySelector("#result"), download=document.querySelector("#download");
let outputHeader="";
function status(message,kind=""){statusBox.textContent=message;statusBox.className="status"+(kind?" "+kind:"");}
function parseOBJ(source){
 const positions=[], triangles=[];
 for(const raw of source.split(/\r?\n/)){
  const line=raw.trim(); if(!line||line.startsWith("#"))continue;
  const parts=line.split(/\s+/), tag=parts.shift();
  if(tag==="v"){
   if(parts.length<3)continue;
   const p=parts.slice(0,3).map(Number); if(!p.every(Number.isFinite))throw Error("An OBJ vertex contains an invalid number.");
   positions.push(p);
  }else if(tag==="f"){
   const ids=parts.map(token=>{
    const n=parseInt(token.split("/")[0],10); if(!Number.isInteger(n)||n===0)throw Error("An OBJ face has an invalid vertex index.");
    const index=n>0?n-1:positions.length+n;
    if(index<0||index>=positions.length)throw Error("An OBJ face references a vertex that does not exist.");
    return index;
   });
   for(let i=1;i<ids.length-1;i++)triangles.push([ids[0],ids[i],ids[i+1]]);
  }
 }
 if(!positions.length||!triangles.length)throw Error("No usable vertices and faces were found. The file needs OBJ 'v' and 'f' records.");
 if(triangles.length>500)throw Error("This first converter supports up to 500 triangles. Simplify the model and try again.");
 const mins=[0,1,2].map(k=>Math.min(...positions.map(p=>p[k])));
 const maxs=[0,1,2].map(k=>Math.max(...positions.map(p=>p[k])));
 const center=mins.map((v,k)=>(v+maxs[k])/2);
 const extent=Math.max(...mins.map((v,k)=>maxs[k]-v));
 if(!Number.isFinite(extent)||extent===0)throw Error("The model has no measurable 3D size.");
 const scale=1.5/extent;
 const verts=triangles.flatMap(face=>face.map(id=>positions[id].map((v,k)=>(v-center[k])*scale)));
 return {verts,vertexCount:positions.length,triangleCount:triangles.length};
}
function makeHeader(model){
 const rows=[];
 for(let i=0;i<model.verts.length;i+=3){
  const p=model.verts[i].map(v=>v.toFixed(5)+"f");
  rows.push("    glVertex3f("+p.join(", ")+");");
 }
 return `// Generated locally by the OoT DSi Model Converter.
// Geometry only: no copyrighted assets, textures, or rigging.
// Source OBJ: user-supplied. Maximum supported output: 500 triangles.
#ifndef OOT_DSI_IMPORTED_MODEL_MESH_H
#define OOT_DSI_IMPORTED_MODEL_MESH_H
#include <nds.h>

#define IMPORTED_MODEL_TRIANGLE_COUNT ${model.triangleCount}
#define IMPORTED_MODEL_VERTEX_COUNT ${model.verts.length}

static inline void draw_imported_model(void)
{
    glBegin(GL_TRIANGLES);
${rows.join("\n")}
    glEnd();
}
#endif
`;
}
input.addEventListener("change",async()=>{
 result.hidden=true; outputHeader="";
 const file=input.files?.[0]; if(!file){status("Waiting for an OBJ file.");return;}
 status("Parsing model locally…");
 try{
  const parsed=parseOBJ(await file.text()); outputHeader=makeHeader(parsed);
  document.querySelector("#vertices").textContent=parsed.vertexCount;
  document.querySelector("#triangles").textContent=parsed.triangleCount;
  result.hidden=false; status("Converted successfully. Review the model limits, then download the C header.","good");
 }catch(e){status(e.message,"bad");}
});
download.addEventListener("click",()=>{
 if(!outputHeader)return;
 const blob=new Blob([outputHeader],{type:"text/x-c"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download="model_mesh.h";a.click();URL.revokeObjectURL(url);
});