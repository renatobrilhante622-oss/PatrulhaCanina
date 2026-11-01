#!/usr/bin/env python3
"""Confere GLB 2.0, referências offline, hashes, atribuições e texturas HD reais."""
from pathlib import Path
import hashlib,json,struct,zlib
root=Path(__file__).resolve().parents[1]/'app/src/main/assets'
manifest=json.loads((root/'models/manifest.json').read_text())
assert len(manifest['entries'])>=27
for item in manifest['entries']:
 path=root/'models'/item['file'];data=path.read_bytes()
 magic,version,total=struct.unpack_from('<4sII',data);assert magic==b'glTF' and version==2 and total==len(data)
 size,kind=struct.unpack_from('<II',data,12);assert kind==0x4e4f534a;doc=json.loads(data[20:20+size]);assert doc.get('meshes')
 assert hashlib.sha256(data).hexdigest()==item['sha256'] and item['source'] and item['license']
 for entry in doc.get('images',[])+doc.get('buffers',[]):
  uri=entry.get('uri','');assert not uri.startswith(('http:','https:'))
  if uri and not uri.startswith('data:'):assert (path.parent/uri).is_file()
for i in range(9):
 for name in ('fur','uniform'):
  data=(root/f'textures/{name}-{i}.png').read_bytes();assert data[:8]==b'\x89PNG\r\n\x1a\n';assert struct.unpack_from('>II',data,16)==(1024,1024)
for name in ['Fox.md','ToyCar.md','Kenney-MIT.txt']:assert (root/'models/licenses'/name).is_file()
assert (root/'js/GLTFLoader.js').stat().st_size>30000
# O chamado incorreto saiu do roteiro; menus não narram e o runtime não tem TTS online.
entries=json.loads((root/'game/catalog.json').read_text())['entries']
assert not any('pup-pad está chamando' in e['text'].lower() or 'pup-pad tá chamando' in e['text'].lower() for e in entries)
assert next(e['text'] for e in entries if e['id']=='Skye_ryder_call')=='O Ryder tá chamando!'
print(f'{len(manifest["entries"])} GLBs locais, licenças, referências, SHA256, 18 texturas UV HD e chamado corrigido verificados.')
