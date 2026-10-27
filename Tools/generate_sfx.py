#!/usr/bin/env python3
"""Efeitos originais sintetizados; não são gravações dos atores ou do tema oficial."""
from pathlib import Path
import math,random,struct,subprocess,tempfile,wave,json,hashlib
ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/'app/src/main/assets/audio';DEST.mkdir(parents=True,exist_ok=True)
RATE=22050
spec={'bark':.7,'siren':1.5,'engine':2,'whistle':.5,'kick':.35,'crowd':2.5,'water':1.8,'collect':.45,'jump':.4,'music':16}
rng=random.Random(42)
manifest={}
for name,duration in spec.items():
 data=[]
 notes=[261.63,329.63,392,523.25,440,349.23,392,329.63]
 for i in range(int(RATE*duration)):
  t=i/RATE;noise=rng.uniform(-1,1);env=math.sin(math.pi*t/duration)**.5
  if name=='bark':
   u=t%.35;v=math.sin(2*math.pi*(180-90*u)*t)*math.sin(math.pi*min(1,u/.2)) if u<.2 else 0;v=(v*.55+noise*.1)*env
  elif name=='siren':v=math.sin(2*math.pi*470*t+50*math.sin(2*math.pi*1.8*t))*.16*env
  elif name=='engine':v=(math.sin(2*math.pi*70*t)+.3*noise)*.08*env
  elif name=='whistle':v=math.sin(2*math.pi*1200*t+4*math.sin(t*20))*.1*env
  elif name=='kick':v=(noise*.4+math.sin(2*math.pi*90*t))*.5*math.exp(-t*20)
  elif name=='crowd':v=(noise*.18+math.sin(2*math.pi*220*t)*.1+math.sin(2*math.pi*329*t)*.08)*(.5+.5*math.sin(t*7)**2)*env
  elif name=='water':v=noise*.18*(.7+.3*math.sin(t*17))*env
  elif name in ['jump','collect']:v=math.sin(2*math.pi*(400*t+250*t*t))*.12*env
  else:
   step=int(t*4)%len(notes);beat=t%.25
   v=(math.sin(2*math.pi*notes[step]*t)*.065+math.sin(2*math.pi*notes[(step//4)*2]*.5*t)*.035)*math.exp(-beat*9)
  data.append(struct.pack('<h',max(-32767,min(32767,int(v*22000)))))
 path=DEST/('sfx_'+name+'.mp3')
 with tempfile.TemporaryDirectory() as tmp:
  raw=Path(tmp)/'s.wav'
  with wave.open(str(raw),'wb') as f:f.setparams((1,2,RATE,0,'NONE','not compressed'));f.writeframes(b''.join(data))
  subprocess.run(['ffmpeg','-v','error','-y','-i',str(raw),'-codec:a','libmp3lame','-b:a','96k',str(path)],check=True)
 manifest[name]={'file':path.name,'source':'original procedural synthesis','sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
(DEST/'sfx-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('10 efeitos/música originais em MP3 gerados.')
