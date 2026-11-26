// Local-only N64 DMA filesystem reader and Yaz0 extractor.
const input=document.querySelector("#rom"), statusBox=document.querySelector("#status"), details=document.querySelector("#details"), browser=document.querySelector("#browser"), rows=document.querySelector("#files"), filter=document.querySelector("#filter");
const known={"2258052847bdd056c8406a9ef6427f13":"NTSC 1.2 (Japanese)","57a9719ad547c516342e1a15d5c28c3d":"NTSC 1.2 (USA)"};
let rom=null, dmaFiles=[];
function devLog(level,message){
 const box=document.querySelector("#dev-console");if(!box)return;
 const line=document.createElement("div");line.className="console-line "+level;
 const time=new Date().toLocaleTimeString();line.textContent="["+time+"] ["+level.toUpperCase()+"] "+message;
 box.append(line);while(box.children.length>150)box.firstElementChild.remove();box.scrollTop=box.scrollHeight;
}
function dev(id,label,detail,kind){const a=document.querySelector("#dev-"+id);const b=document.querySelector("#dev-"+id+"-detail");if(a){a.textContent=label;a.className="dev-state "+kind}if(b)b.textContent=detail;}
function logDev(message){const el=document.querySelector("#dev-log");if(el)el.textContent="Diagnostic: "+message;}
dev("js","Running","JavaScript loaded and event handlers are being initialized.","implemented");
logDev("script loaded; waiting for ROM selection.");devLog("info","Extractor script initialized.");
window.addEventListener("error",e=>{const msg=(e.message||"unknown error")+" at "+(e.filename||"")+" : "+(e.lineno||"?");devLog("error",msg);statusBox.textContent="JavaScript error: "+msg;statusBox.className="status bad";});
window.addEventListener("unhandledrejection",e=>{const msg=e.reason?.message||String(e.reason);devLog("error","Unhandled promise rejection: "+msg);statusBox.textContent="Processing error: "+msg;statusBox.className="status bad";});
function status(s,k=""){statusBox.textContent=s;statusBox.className="status"+(k?" "+k:"");devLog(k==="bad"?"error":k==="good"?"success":"info",s);}
status("Extractor script loaded. Choose your ROM file.");
function md5(bytes){const shifts=[7,12,17,22,5,9,14,20,4,11,16,23,6,10,15,21],K=Array.from({length:64},(_,i)=>Math.floor(Math.abs(Math.sin(i+1))*4294967296)>>>0),bitLen=bytes.length*8,paddedLen=Math.ceil((bytes.length+9)/64)*64,data=new Uint8Array(paddedLen);data.set(bytes);data[bytes.length]=128;const v=new DataView(data.buffer);v.setUint32(paddedLen-8,bitLen>>>0,true);v.setUint32(paddedLen-4,Math.floor(bitLen/4294967296),true);let a0=0x67452301,b0=0xefcdab89,c0=0x98badcfe,d0=0x10325476,M=new Uint32Array(16);for(let o=0;o<paddedLen;o+=64){for(let j=0;j<16;j++)M[j]=v.getUint32(o+j*4,true);let A=a0,B=b0,C=c0,D=d0;for(let i=0;i<64;i++){let F,g,s;if(i<16){F=(B&C)|(~B&D);g=i;s=shifts[i%4]}else if(i<32){F=(D&B)|(~D&C);g=(5*i+1)%16;s=shifts[4+i%4]}else if(i<48){F=B^C^D;g=(3*i+5)%16;s=shifts[8+i%4]}else{F=C^(B|~D);g=(7*i)%16;s=shifts[12+i%4]}const z=(A+F+K[i]+M[g])>>>0,n=(B+((z<<s)|(z>>>(32-s))))>>>0;A=D;D=C;C=B;B=n}a0=(a0+A)>>>0;b0=(b0+B)>>>0;c0=(c0+C)>>>0;d0=(d0+D)>>>0}return[a0,b0,c0,d0].map(n=>[0,8,16,24].map(s=>((n>>>s)&255).toString(16).padStart(2,"0")).join("")).join("")}
function normalizeRom(src){const m=[...src.slice(0,4)].map(x=>x.toString(16).padStart(2,"0")).join("");if(m==="80371240")return src;if(m==="37804012"){const out=new Uint8Array(src.length);for(let i=0;i+1<src.length;i+=2){out[i]=src[i+1];out[i+1]=src[i]}return out}if(m==="40123780"){const out=new Uint8Array(src.length);for(let i=0;i+3<src.length;i+=4){out[i]=src[i+3];out[i+1]=src[i+2];out[i+2]=src[i+1];out[i+3]=src[i]}return out}throw Error("Unrecognized N64 ROM byte order.");}
function u32(v,o){return v.getUint32(o,false)}
function findDma(bytes){const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),limit=bytes.length-16;let best=null;for(let base=0;base<Math.min(limit,0x200000);base+=4){if(u32(v,base)!==0||u32(v,base+4)!==0x1060)continue;let valid=0,prev=0,foundEnd=false;for(let p=base;p+16<=bytes.length&&valid<5000;p+=16){const a=u32(v,p),b=u32(v,p+4),rs=u32(v,p+8),re=u32(v,p+12);if(a===0&&b===0){foundEnd=true;break}if(b<=a||a<prev||b>0x8000000)break;if(rs!==0xffffffff&&(rs>=bytes.length||((re!==0&&re<rs)|| (re>bytes.length))))break;prev=b;valid++}if(valid>=8&&foundEnd){const selfRomStart=u32(v,base+2*16+8);if(selfRomStart!==base)continue;best={base,count:0};for(let p=base;p+16<=bytes.length;p+=16){const a=u32(v,p),b=u32(v,p+4);if(a===0&&b===0)break;best.count++}return best}}if(best)return best;throw Error("Could not locate a valid DMA table. This extractor currently targets the supported Ocarina of Time N64 ROM layout.");}
function parseDma(bytes,base,count){const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),out=[];for(let i=0;i<count;i++){const p=base+i*16,a=u32(v,p),b=u32(v,p+4),rs=u32(v,p+8),re=u32(v,p+12);if(rs===0xffffffff)continue;const storedEnd=re===0?rs+(b-a):re;if(storedEnd>bytes.length||rs>bytes.length||storedEnd<rs)continue;out.push({id:i,vrom:a,vromEnd:b,size:b-a,romStart:rs,romEnd:storedEnd,compressed:re!==0})}return out}
function yaz0(src,expected){
  if(src.length<16||String.fromCharCode(...src.slice(0,4))!=="Yaz0")throw Error("The file is marked compressed but does not begin with Yaz0.");
  const v=new DataView(src.buffer,src.byteOffset,src.byteLength),size=v.getUint32(4,false);
  if(size!==expected)throw Error("Yaz0 size does not match the DMA entry.");
  const out=new Uint8Array(size);let ip=16,op=0,code=0,bits=0;
  while(op<size){
    if(bits===0){if(ip>=src.length)throw Error("Unexpected end of Yaz0 control stream.");code=src[ip++];bits=8;}
    if(code&128){if(ip>=src.length)throw Error("Unexpected end of Yaz0 literal.");out[op++]=src[ip++];}
    else{
      if(ip+1>=src.length)throw Error("Unexpected end of Yaz0 back-reference.");
      const b1=src[ip++],b2=src[ip++],dist=((b1&15)<<8|b2)+1;let len=b1>>4;
      if(len===0){if(ip>=src.length)throw Error("Unexpected end of Yaz0 long reference.");len=src[ip++]+0x12;}else len+=2;
      if(dist>op)throw Error("Invalid Yaz0 back-reference.");
      for(let j=0;j<len&&op<size;j++){out[op]=out[op-dist];op++;}
    }
    code=(code<<1)&255;bits--;
  }
  return out;
}

function render(){const q=filter.value.trim().toLowerCase();rows.replaceChildren();const frag=document.createDocumentFragment();for(const f of dmaFiles){const s=[String(f.id),f.vrom.toString(16),f.size.toString(16),f.compressed?"yaz0":"raw"].join(" ").toLowerCase();if(q&&!s.includes(q))continue;const tr=document.createElement("tr");for(const val of [String(f.id),"0x"+f.vrom.toString(16).toUpperCase().padStart(8,"0"),(f.size/1024).toFixed(1)+" KiB",f.compressed?"Yaz0":"Raw"]){const td=document.createElement("td");td.textContent=val;tr.append(td)}const td=document.createElement("td"),btn=document.createElement("button");btn.textContent="Extract";btn.addEventListener("click",()=>extract(f,btn));td.append(btn);tr.append(td);frag.append(tr)}rows.append(frag)}
function extract(f,btn){try{btn.disabled=true;let data=rom.slice(f.romStart,f.romEnd);if(f.compressed)data=yaz0(data,f.size);const blob=new Blob([data],{type:"application/octet-stream"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="oot_file_"+String(f.id).padStart(4,"0")+".bin";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status("Extracted DMA file "+f.id+" ("+(data.length/1024).toFixed(1)+" KiB).","good")}catch(e){status("Extraction failed: "+e.message,"bad")}finally{btn.disabled=false}}

function crc32(bytes){let c=0xffffffff;for(let i=0;i<bytes.length;i++){c^=bytes[i];for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0)}return(c^0xffffffff)>>>0}
function zipStore(entries){
 const enc=new TextEncoder(),locals=[],centrals=[];let offset=0;
 for(const entry of entries){
  const name=enc.encode(entry.name),data=entry.data,crc=crc32(data);
  const lh=new Uint8Array(30+name.length),lv=new DataView(lh.buffer);
  lv.setUint32(0,0x04034b50,true);lv.setUint16(4,20,true);lv.setUint16(6,0,true);lv.setUint16(8,0,true);
  lv.setUint32(14,crc,true);lv.setUint32(18,data.length,true);lv.setUint32(22,data.length,true);lv.setUint16(26,name.length,true);lv.setUint16(28,0,true);lh.set(name,30);
  locals.push(lh,data);
  const ch=new Uint8Array(46+name.length),cv=new DataView(ch.buffer);
  cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0,true);cv.setUint16(10,0,true);
  cv.setUint32(16,crc,true);cv.setUint32(20,data.length,true);cv.setUint32(24,data.length,true);cv.setUint16(28,name.length,true);cv.setUint16(30,0,true);cv.setUint16(32,0,true);cv.setUint16(34,0,true);cv.setUint16(36,0,true);cv.setUint32(38,0,true);cv.setUint32(42,offset,true);ch.set(name,46);
  centrals.push(ch);offset+=lh.length+data.length;
 }
 const centralSize=centrals.reduce((n,x)=>n+x.length,0),end=new Uint8Array(22),ev=new DataView(end.buffer);
 ev.setUint32(0,0x06054b50,true);ev.setUint16(4,0,true);ev.setUint16(6,0,true);ev.setUint16(8,entries.length,true);ev.setUint16(10,entries.length,true);ev.setUint32(12,centralSize,true);ev.setUint32(16,offset,true);ev.setUint16(20,0,true);
 return new Blob([...locals,...centrals,end],{type:"application/zip"});
}
async function extractAll(){
 const button=document.querySelector("#extract-all");if(!rom||!dmaFiles.length)return;
 button.disabled=true;const entries=[],manifest={format:"OoT DSi local DMA asset archive",romVersion:document.querySelector("#version").textContent,romMD5:document.querySelector("#md5").textContent,created:new Date().toISOString(),note:"Files are extracted locally from the user-selected ROM. DMA IDs are table indexes, not ZeldaRET object IDs.",files:[]};
 try{
  for(let i=0;i<dmaFiles.length;i++){
   const f=dmaFiles[i];let data=rom.slice(f.romStart,f.romEnd);if(f.compressed)data=yaz0(data,f.size);
   const name="dma/"+String(f.id).padStart(4,"0")+".bin";entries.push({name,data});
   manifest.files.push({dmaId:f.id,file:name,vromStart:"0x"+f.vrom.toString(16).toUpperCase(),vromEnd:"0x"+f.vromEnd.toString(16).toUpperCase(),size:data.length,storage:f.compressed?"Yaz0 (decompressed)":"raw"});
   if(i%20===0){status("Preparing archive: "+(i+1)+" / "+dmaFiles.length+" files…");await new Promise(resolve=>setTimeout(resolve,0))}
  }
  entries.push({name:"manifest.json",data:encUtf8(JSON.stringify(manifest,null,2))});
  const blob=zipStore(entries),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="oot-ntsc-1.2-all-dma-assets.zip";a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
  status("Archive ready: "+dmaFiles.length+" DMA files plus manifest ("+(blob.size/1048576).toFixed(2)+" MiB ZIP).","good");
 }catch(e){status("Bulk extraction failed: "+e.message,"bad");devLog("error","Bulk extraction: "+e.message)}
 finally{button.disabled=false}
}
function encUtf8(text){return new TextEncoder().encode(text)}

let lastFile=null;
async function handleRomSelection(){const file=input.files?.[0];if(!file||file===lastFile)return;lastFile=file;details.hidden=true;browser.hidden=true;dmaFiles=[];rom=null;document.querySelector("#extract-all").disabled=true;document.querySelector("#extract-link").disabled=true;if(!file){status("Waiting for a ROM file.");return}status("Reading ROM locally and verifying checksum…");dev("rom","Checking","Reading the selected file and calculating its checksum.","pending");logDev("file selected: "+file.name+" ("+file.size+" bytes).");devLog("info","Selected "+file.name+" ("+file.size+" bytes).");try{const source=new Uint8Array(await file.arrayBuffer());rom=normalizeRom(source);const hash=md5(rom),version=known[hash];if(!version){dev("rom","Failed","Checksum not recognized: "+hash,"missing");throw Error("This file is not a recognized NTSC 1.2 ROM (MD5: "+hash+").");}dev("rom","Verified",version+" checksum matched.","implemented");status("Verified "+version+". Locating the DMA filesystem…");dev("dma","Scanning","Searching the ROM for a valid DMA table.","pending");const dma=findDma(rom);dmaFiles=parseDma(rom,dma.base,dma.count);if(dmaFiles.length<8)throw Error("A DMA table was found, but too few valid entries were parsed.");dev("dma","Parsed",dmaFiles.length+" present DMA entries parsed from table at 0x"+dma.base.toString(16)+".","implemented");document.querySelector("#extract-all").disabled=false;document.querySelector("#extract-link").disabled=false;document.querySelector("#filename").textContent=file.name;document.querySelector("#filesize").textContent=(file.size/1048576).toFixed(2)+" MiB";document.querySelector("#format").textContent="Normalized N64 byte order";document.querySelector("#md5").textContent=hash;document.querySelector("#version").textContent=version;document.querySelector("#dma-location").textContent="0x"+dma.base.toString(16).toUpperCase()+" ("+dma.count+" entries)";document.querySelector("#file-count").textContent=dmaFiles.length+" present files";details.hidden=false;browser.hidden=false;render();status("Filesystem parsed. Select any file to extract it; Yaz0 files are decompressed automatically.","good");logDev("success: checksum verified; DMA table parsed; "+dmaFiles.length+" entries available.");devLog("success","DMA table parsed: "+dmaFiles.length+" files available.")}catch(e){rom=null;if((e.message||"").includes("DMA")){dev("dma","Failed",e.message,"missing")}status(e.message||String(e),"bad");logDev("error: "+(e.message||String(e)));devLog("error",e.message||String(e))}}
input.addEventListener("change",handleRomSelection);
input.addEventListener("input",handleRomSelection);
filter.addEventListener("input",render);
document.querySelector("#extract-all")?.addEventListener("click",extractAll);
document.querySelector("#extract-link")?.addEventListener("click",extractAdultLink);

document.querySelector("#clear-console")?.addEventListener("click",()=>{document.querySelector("#dev-console").replaceChildren();devLog("info","Console cleared by user.");});

// Adult Link asset identification for the verified NTSC 1.2 ROM.
// The object IDs are not DMA IDs. Resolve the object table by matching its
// two known RomFile ranges, then map those ranges back to the DMA filesystem.
function findAdultLinkObject(){
 // The NTSC 1.2 object file VROM ranges are independently listed in the
 // version-specific ROM file map. Resolve them directly in the parsed DMA
 // filesystem; do not guess where the runtime object table sits in code.
 const specs=[
  {key:"adult",id:0x0014,name:"object_link_boy",start:0x00F86000,end:0x00FBD800},
  {key:"child",id:0x0015,name:"object_link_child",start:0x00FBE000,end:0x00FEAF80}
 ];
 const found={};
 for(const spec of specs){
  const matches=dmaFiles.filter(x=>x.vrom===spec.start&&x.vromEnd===spec.end);
  if(matches.length!==1){
   throw Error("Could not uniquely locate "+spec.name+" in the parsed NTSC 1.2 DMA filesystem (matches: "+matches.length+"). Expected VROM 0x"+spec.start.toString(16).toUpperCase()+"–0x"+spec.end.toString(16).toUpperCase()+".");
  }
  const f=matches[0];
  if(f.size!==spec.end-spec.start||f.romStart<0||f.romEnd>rom.length||f.romEnd<=f.romStart){
   throw Error("The DMA entry for "+spec.name+" failed its size or ROM-boundary checks.");
  }
  found[spec.key]=Object.assign({},spec,{file:f});
 }
 return found;
}
async function extractAdultLink(){
 const button=document.querySelector("#extract-link");
 devLog("info","Link asset extraction button clicked.");
 if(!rom||!dmaFiles.length){
  status("Load and verify your ROM first; no parsed DMA data is available.","bad");
  devLog("error","Link extraction stopped: ROM or DMA data is missing.");
  return;
 }
 button.disabled=true;
 try{
  status("Verifying the Link object table and preparing the asset bundle…");
  devLog("info","Starting Link object-table verification.");
  const found=findAdultLinkObject();
  const getData=f=>{let b=rom.slice(f.romStart,f.romEnd);return f.compressed?yaz0(b,f.size):b};
  const adultData=getData(found.adult.file),childData=getData(found.child.file);
  const report={
   title:"Ocarina of Time — Link object assets",
   romVersion:document.querySelector("#version").textContent,
   romMD5:document.querySelector("#md5").textContent,
   identification:"Adult and Child Link entries matched by their exact NTSC 1.2 VROM ranges in the DMA filesystem.",
   identificationMethod:"Matched the two exact NTSC 1.2 Link VROM ranges against the parsed DMA filesystem; validated sizes and ROM bounds.",
   adultLink:{objectId:"0x0014",name:"object_link_boy",dmaId:found.adult.file.id,vromStart:"0x00F86000",vromEnd:"0x00FBD800",size:adultData.length,skeletonOffset:"0x377F4",limbTableOffset:"0x377A0",limbCount:21},
   childLink:{objectId:"0x0015",name:"object_link_child",dmaId:found.child.file.id,vromStart:"0x00FBE000",vromEnd:"0x00FEAF80",size:childData.length,skeletonOffset:"0x2CF6C",limbTableOffset:"0x2CF18",limbCount:21},
   note:"These are the original object binary files, not decoded meshes. They contain model display lists, vertex data, textures and skeleton-related data. A display-list/texture decoder is still required to produce OBJ/glTF or a DSi-ready model."
  };
  const blob=zipStore([
   {name:"adult/object_link_boy.bin",data:adultData},
   {name:"child/object_link_child.bin",data:childData},
   {name:"link-asset-report.json",data:encUtf8(JSON.stringify(report,null,2))},
   {name:"README.txt",data:encUtf8([
    "This bundle contains the verified Adult Link and Child Link object binaries from your locally selected NTSC 1.2 ROM.",
    "",
    "The .bin files are not directly viewable 3D models. Adult Link skeleton metadata: skeleton offset 0x377F4; limb table offset 0x377A0; 21 limbs. Child Link: skeleton offset 0x2CF6C; limb table offset 0x2CF18; 21 limbs.",
    "",
    "Next conversion step: decode the N64 display lists, vertices, textures and skeleton into a standard model format. No ROM data was uploaded."
   ].join(String.fromCharCode(10))) }
  ]);
  const url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download="oot-link-object-assets-ntsc-1.2.zip";
  a.style.display="none";document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),30000);
  status("Adult and Child Link object assets extracted. Your browser should download the ZIP now.","good");
  devLog("success","Created Link asset ZIP ("+blob.size+" bytes); download was requested.");
 }catch(e){
  status("Link asset extraction failed: "+(e&&e.message?e.message:String(e)),"bad");
  devLog("error","Link asset extraction: "+(e&&e.stack?e.stack:String(e)));
 }
 finally{button.disabled=false}
}
