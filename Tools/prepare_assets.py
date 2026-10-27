#!/usr/bin/env python3
"""Materializa sprites, GUIDs estáveis e sete ScriptableObjects sem abrir o Editor."""
from pathlib import Path
import math
import struct
import uuid
import zlib

ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/'Assets'

def guid(path):
    meta=Path(str(path)+'.meta')
    if meta.exists():
        return next(line.split(':',1)[1].strip() for line in meta.read_text().splitlines() if line.startswith('guid:'))
    return uuid.uuid5(uuid.NAMESPACE_URL,'PatrulhaCanina/'+path.relative_to(ROOT).as_posix()).hex

def png(shape):
    n=128; data=bytearray()
    for y in range(n):
        data.append(0)
        for x in range(n):
            u=(x+.5)/n*2-1; v=(y+.5)/n*2-1
            inside=u*u+v*v<=.96 if shape=='head' else (math.hypot(u,v)<=.68+.25*math.cos(math.atan2(u,v)*5) if shape=='star' else abs(u)**6+abs(v)**6<.95)
            data.extend((255,255,255,255 if inside else 0))
    def chunk(kind,body): return struct.pack('!I',len(body))+kind+body+struct.pack('!I',zlib.crc32(kind+body)&0xffffffff)
    return b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('!IIBBBBB',n,n,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(bytes(data)))+chunk(b'IEND',b'')

def main():
    generated=ASSETS/'Resources/Generated'; generated.mkdir(parents=True,exist_ok=True)
    for shape in ['head','star','round']:
        path=generated/(shape+'.png')
        if not path.exists(): path.write_bytes(png(shape))
    pups=ASSETS/'Resources/Pups'; pups.mkdir(parents=True,exist_ok=True)
    colors=[(.8,.22,.25),(.17,.38,.75),(.85,.23,.22),(.85,.35,.62),(.21,.55,.35),(.92,.66,.16),(.96,.43,.16)]
    script=guid(ASSETS/'Scripts/PupData.cs')
    for index,name in enumerate(['Ryder','Chase','Marshall','Skye','Rocky','Rubble','Zuma']):
        path=pups/(name+'.asset')
        if path.exists(): continue
        r,g,b=colors[index]
        text=f'''%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!114 &11400000
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {{fileID: 0}}
  m_PrefabInstance: {{fileID: 0}}
  m_PrefabAsset: {{fileID: 0}}
  m_GameObject: {{fileID: 0}}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {{fileID: 11500000, guid: {script}, type: 3}}
  m_Name: {name}
  m_EditorClassIdentifier:
  pupName: {index}
  themeColor: {{r: {r}, g: {g}, b: {b}, a: 1}}
'''
        for field,shape in [('characterSprite','head'),('badgeSprite','star'),('vehicleSprite','round')]:
            text+=f'  {field}: {{fileID: 21300000, guid: {guid(generated/(shape+".png"))}, type: 3}}\n'
        for field,kind in [('initialCalls','call'),('correctPraise','praise'),('gentleHints','hint'),('cookieRewards','reward')]:
            audio=ASSETS/'Resources/Audio/Voices'/f'{name}_{kind}.wav'
            text+=f'  {field}:\n  - {{fileID: 8300000, guid: {guid(audio)}, type: 3}}\n'
        path.write_text(text)
    for path in sorted(ASSETS.rglob('*')):
        if path.suffix=='.meta': continue
        meta=Path(str(path)+'.meta')
        if meta.exists(): continue
        text='fileFormatVersion: 2\nguid: '+guid(path)+'\n'
        if path.is_dir(): text+='folderAsset: yes\nDefaultImporter:\n  externalObjects: {}\n'
        elif path.suffix=='.cs': text+='MonoImporter:\n  externalObjects: {}\n  serializedVersion: 2\n  defaultReferences: []\n  executionOrder: 0\n'
        elif path.suffix=='.asset': text+='NativeFormatImporter:\n  externalObjects: {}\n  mainObjectFileID: 11400000\n'
        elif path.suffix=='.png': text+='TextureImporter:\n  externalObjects: {}\n  serializedVersion: 12\n  mipmaps:\n    enableMipMap: 0\n  isReadable: 0\n  textureType: 8\n  spriteMode: 1\n  spritePixelsToUnits: 100\n  alphaIsTransparency: 1\n'
        elif path.suffix=='.wav': text+='AudioImporter:\n  externalObjects: {}\n  serializedVersion: 7\n  defaultSettings:\n    serializedVersion: 2\n    loadType: 0\n    sampleRateSetting: 0\n    sampleRateOverride: 22050\n    compressionFormat: 1\n    quality: 0.7\n    conversionMode: 0\n  forceToMono: 1\n  preloadAudioData: 1\n  loadInBackground: 0\n  ambisonic: 0\n  3D: 0\n'
        elif path.suffix=='.json': text+='TextScriptImporter:\n  externalObjects: {}\n'
        else: text+='DefaultImporter:\n  externalObjects: {}\n'
        meta.write_text(text)
    print('Sprites, perfis e metadados preparados sem referências manuais.')

if __name__=='__main__': main()
