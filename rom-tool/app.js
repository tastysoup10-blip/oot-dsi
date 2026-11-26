// Local-only ROM identification. No network requests are made.
const input = document.querySelector("#rom");
const statusBox = document.querySelector("#status");
const details = document.querySelector("#details");

const known = {
  "2258052847bdd056c8406a9ef6427f13": "NTSC 1.2 (Japanese)",
  "57a9719ad547c516342e1a15d5c28c3d": "NTSC 1.2 (USA)"
};

function md5(bytes) {
  const shifts = [7,12,17,22,5,9,14,20,4,11,16,23,6,10,15,21];
  const K = Array.from({length:64},(_,i)=>Math.floor(Math.abs(Math.sin(i+1))*4294967296)>>>0);
  const bitLen = bytes.length * 8;
  const paddedLen = Math.ceil((bytes.length + 9) / 64) * 64;
  const data = new Uint8Array(paddedLen);
  data.set(bytes); data[bytes.length] = 0x80;
  const view = new DataView(data.buffer);
  view.setUint32(paddedLen-8, bitLen >>> 0, true);
  view.setUint32(paddedLen-4, Math.floor(bitLen / 4294967296), true);
  let a0=0x67452301,b0=0xefcdab89,c0=0x98badcfe,d0=0x10325476;
  const M = new Uint32Array(16);
  for(let offset=0;offset<paddedLen;offset+=64){
    for(let j=0;j<16;j++) M[j]=view.getUint32(offset+j*4,true);
    let A=a0,B=b0,C=c0,D=d0;
    for(let i=0;i<64;i++){
      let F,g,s;
      if(i<16){F=(B&C)|(~B&D);g=i;s=shifts[i%4];}
      else if(i<32){F=(D&B)|(~D&C);g=(5*i+1)%16;s=shifts[4+i%4];}
      else if(i<48){F=B^C^D;g=(3*i+5)%16;s=shifts[8+i%4];}
      else{F=C^(B|~D);g=(7*i)%16;s=shifts[12+i%4];}
      const sum=(A+F+K[i]+M[g])>>>0;
      const rotated=((sum<<s)|(sum>>>(32-s)))>>>0;
      const next=(B+rotated)>>>0;
      A=D;D=C;C=B;B=next;
    }
    a0=(a0+A)>>>0;b0=(b0+B)>>>0;c0=(c0+C)>>>0;d0=(d0+D)>>>0;
  }
  return [a0,b0,c0,d0].map(n=>[0,8,16,24].map(s=>((n>>>s)&255).toString(16).padStart(2,"0")).join("")).join("");
}

function showStatus(message, kind="") {
  statusBox.textContent=message;
  statusBox.className="status"+(kind?" "+kind:"");
}

input.addEventListener("change", async () => {
  const file=input.files?.[0];
  details.hidden=true;
  if(!file){showStatus("Waiting for a ROM file.");return;}
  if(file.size<0x1000000){showStatus("This file is unexpectedly small for an N64 Ocarina of Time ROM.", "bad");return;}
  showStatus("Reading the file locally and calculating its checksum…");
  try{
    const bytes=new Uint8Array(await file.arrayBuffer());
    const magic=[...bytes.slice(0,4)].map(x=>x.toString(16).padStart(2,"0")).join("");
    const formats={"80371240":"Big-endian .z64","37804012":"Byte-swapped .v64","40123780":"Little-endian .n64"};
    const format=formats[magic]||"Unknown N64 byte order";
    const hash=md5(bytes);
    const version=known[hash]||"Not a recognized NTSC 1.2 checksum";
    document.querySelector("#filename").textContent=file.name;
    document.querySelector("#filesize").textContent=(file.size/1048576).toFixed(2)+" MiB";
    document.querySelector("#format").textContent=format;
    document.querySelector("#md5").textContent=hash;
    document.querySelector("#version").textContent=version;
    details.hidden=false;
    if(known[hash]) showStatus("Verified: "+version+". This matches the expected NTSC 1.2 checksum.", "good");
    else showStatus("The file was read locally, but its checksum does not match the known NTSC 1.2 versions. No extraction has been started.", "bad");
  }catch(error){showStatus("Could not read this file: "+error.message,"bad");}
});