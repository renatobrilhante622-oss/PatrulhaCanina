#!/usr/bin/env python3
"""Verifica o pacote Android offline, sem depender de Unity ou TTS instalado."""
from pathlib import Path
import hashlib
import json
import wave
import xml.etree.ElementTree as ET
root=Path(__file__).resolve().parents[1]
assets=root/'app/src/main/assets/game'
catalog=json.loads((assets/'catalog.json').read_text())['entries']
assert len({e['id'] for e in catalog})==len(catalog)
for entry in catalog:
    assert entry['text'].strip()
    with wave.open(str(assets/'audio'/(entry['id']+'.wav'))) as wav:
        assert wav.getsampwidth()==2 and wav.getnchannels()==1 and wav.getnframes()>1000
for name in ['Ryder','Chase','Marshall','Skye','Rocky','Rubble','Zuma']:
    for kind in ['call','motto','instruction','praise','hint','reward']:
        assert any(e['id']==name+'_'+kind for e in catalog)
manifest=ET.parse(root/'app/src/main/AndroidManifest.xml').getroot()
assert not manifest.findall('uses-permission'), 'APK não deve solicitar Internet ou outras permissões'
android='{http://schemas.android.com/apk/res/android}'
assert manifest.find('application/activity').attrib[android+'screenOrientation']=='sensorLandscape'
assert 'com.t4b.patrulhacanina' in (root/'app/build.gradle').read_text()
assert (root/'Tools/debug.keystore').is_file()
wrapper=root/'gradle/wrapper/gradle-wrapper.jar'
# Checksum oficial de distribuição do Wrapper é verificado ao baixar e fixado no repositório.
expected=(root/'gradle/wrapper/gradle-wrapper.jar.sha256').read_text().strip()
assert hashlib.sha256(wrapper.read_bytes()).hexdigest()==expected
assert 'distributionSha256Sum=' in (root/'gradle/wrapper/gradle-wrapper.properties').read_text()
print(f'Android offline: {len(catalog)} WAVs PCM válidos, sete personagens, paisagem, assinatura e Wrapper verificados.')
