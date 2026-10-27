#!/usr/bin/env python3
"""Geração neural real via edge-tts. Não converte WAV antigo nem sintetiza bipes."""
import argparse,asyncio,hashlib,json,os,subprocess,tempfile
from pathlib import Path
from voice_catalog import catalog,PROFILES
ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/'app/src/main/assets/audio'
CATALOG=ROOT/'app/src/main/assets/game/catalog.json'
MANIFEST=DEST/'neural-manifest.json'
STAGE='cache'

def probe(path):
 result=subprocess.run(['ffprobe','-v','error','-show_entries','stream=codec_name:format=duration','-of','json',str(path)],capture_output=True,text=True,check=True)
 data=json.loads(result.stdout)
 if not any(s.get('codec_name')=='mp3' for s in data.get('streams',[])) or float(data.get('format',{}).get('duration',0))<.3:raise ValueError('MP3 de fala inválido: '+str(path))

def write_catalog():
 CATALOG.write_text(json.dumps({'entries':catalog()},ensure_ascii=False,indent=2)+'\n')

async def generate(args):
 global STAGE
 import edge_tts
 DEST.mkdir(parents=True,exist_ok=True)
 old=json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {'entries':{}}
 # Sem consultar a rede quando os MP3s neurais corretos já estão versionados.
 todo=[]
 for entry in catalog():
  p=DEST/(entry['id']+'.mp3');record=old['entries'].get(entry['id'],{})
  expected=hashlib.sha256(entry['text'].encode()).hexdigest()
  if not args.force and p.exists() and record.get('textSha256')==expected and record.get('requestedVoice')==PROFILES[entry['speaker']][0] and record.get('pitch')==PROFILES[entry['speaker']][1] and record.get('rate')==PROFILES[entry['speaker']][2] and record.get('sha256')==hashlib.sha256(p.read_bytes()).hexdigest():probe(p)
  else:todo.append(entry)
 if not todo:write_catalog();print('Todos os MP3s neurais estão completos e verificados.');return
 proxy=os.environ.get('HTTPS_PROXY') or os.environ.get('https_proxy')
 STAGE='list_voices'
 voices=await asyncio.wait_for(edge_tts.list_voices(proxy=proxy),45)
 available={v['ShortName']:v for v in voices if v['Locale']=='pt-BR'}
 if not available:raise RuntimeError('O serviço não anunciou vozes PT-BR.')
 resolved={}
 for name,(requested,pitch,rate,gender) in PROFILES.items():
  voice=requested if requested in available else next((k for k,v in available.items() if v.get('Gender')==gender),None)
  if not voice:raise RuntimeError('Sem voz PT-BR compatível para '+name)
  resolved[name]=(voice,pitch,rate)
  print(f'{name}: solicitada={requested}; disponível/usada={voice}',flush=True)
 sem=asyncio.Semaphore(args.workers)
 async def one(entry):
  async with sem:
   voice,pitch,rate=resolved[entry['speaker']]
   path=DEST/(entry['id']+'.mp3');tmp=path.with_suffix('.part.mp3')
   for attempt in range(3):
    try:
     await asyncio.wait_for(edge_tts.Communicate(entry['text'],voice,rate=rate,pitch=pitch,proxy=proxy).save(str(tmp)),75)
     probe(tmp);tmp.replace(path)
     old['entries'][entry['id']]={'source':'Microsoft Edge neural TTS','voice':voice,'requestedVoice':PROFILES[entry['speaker']][0],'pitch':pitch,'rate':rate,'textSha256':hashlib.sha256(entry['text'].encode()).hexdigest(),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
     # Atualização atômica por evento: sem await durante a escrita.
     MANIFEST.write_text(json.dumps(old,ensure_ascii=False,indent=2)+'\n')
     print('Gerado:',entry['id'],flush=True);return
    except Exception:
     tmp.unlink(missing_ok=True)
     if attempt==2:raise
     await asyncio.sleep(2*(attempt+1))
 STAGE='synthesize'
 await asyncio.gather(*(one(entry) for entry in todo))
 write_catalog();print(f'{len(catalog())} falas neurais verificadas.')

def main():
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--catalog-only',action='store_true');parser.add_argument('--force',action='store_true');parser.add_argument('--workers',type=int,default=3);args=parser.parse_args()
 if args.catalog_only:write_catalog();print(f'{len(catalog())} falas no roteiro; isso não gera áudio.');return
 asyncio.run(generate(args))
if __name__=='__main__':
 try:main()
 except Exception as error:
  status=getattr(error,'status',None)
  message=f'Edge TTS: etapa={STAGE}; tipo={type(error).__name__}; HTTP={status or "n/a"}. Nenhum audio artificial foi usado.'
  print(message,flush=True)
  if os.environ.get('GITHUB_ACTIONS'):print('::error title=Geracao neural interrompida::'+message,flush=True)
  raise SystemExit(1)
