#!/usr/bin/env python3
"""Valida o pacote; em CI a presença de todas as falas neurais é obrigatória."""
from pathlib import Path
import argparse,hashlib,json,subprocess,xml.etree.ElementTree as ET
root=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--allow-missing-audio',action='store_true',help='Só desenvolvimento local: não comprova dublagem completa.');args=p.parse_args()
assets=root/'app/src/main/assets';entries=json.loads((assets/'game/catalog.json').read_text())['entries']
assert len(entries)>80 and len({e['id'] for e in entries})==len(entries)
manifest=assets/'audio/neural-manifest.json'
records=json.loads(manifest.read_text())['entries'] if manifest.exists() else {}
missing=[]
for entry in entries:
 path=assets/entry['audio'].lstrip('/');record=records.get(entry['id'],{})
 if not path.is_file():missing.append(entry['id']);continue
 assert record.get('source')=='Microsoft Edge neural TTS'
 assert record['sha256']==hashlib.sha256(path.read_bytes()).hexdigest()
 assert record['textSha256']==hashlib.sha256(entry['text'].encode()).hexdigest()
 data=json.loads(subprocess.run(['ffprobe','-v','error','-show_entries','stream=codec_name:format=duration','-of','json',str(path)],capture_output=True,text=True,check=True).stdout)
 assert any(s.get('codec_name')=='mp3' for s in data['streams']) and float(data['format']['duration'])>.3
if missing and not args.allow_missing_audio:raise SystemExit(f'Faltam {len(missing)} MP3s neurais reais. Execute Tools/generate_voices.py em rede com acesso ao Microsoft Edge TTS.')
xml=ET.parse(root/'app/src/main/AndroidManifest.xml').getroot();a='{http://schemas.android.com/apk/res/android}'
assert not xml.findall('uses-permission');assert xml.find('application/activity').attrib[a+'screenOrientation']=='sensorLandscape'
assert 'setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE)' in (root/'app/src/main/java/com/t4b/patrulhacanina/MainActivity.java').read_text()
assert (root/'Tools/debug.keystore').is_file()
assert hashlib.sha256((root/'gradle/wrapper/gradle-wrapper.jar').read_bytes()).hexdigest()==(root/'gradle/wrapper/gradle-wrapper.jar.sha256').read_text().strip()
print(f'Android: {len(entries)} falas no roteiro; {len(entries)-len(missing)} MP3s neurais verificados; {len(missing)} ausentes. Paisagem e ausência de Internet verificadas.')
if missing:print('MODO LOCAL: dublagem não validada; o CI não aceita esta exceção.')
