#!/usr/bin/env python3
"""Validação offline de integridade: catálogo, WAVs, cena, build e metadados."""
import json
from pathlib import Path
import re
import wave

root = Path(__file__).resolve().parents[1]
catalog = json.loads((root/'Assets/Resources/VoiceCatalog.json').read_text())['entries']
assert len({e['id'] for e in catalog}) == len(catalog)
seconds = 0
for entry in catalog:
    assert entry['text'].strip() and entry['speaker']
    path = root/'Assets/Resources/Audio/Voices'/f"{entry['id']}.wav"
    with wave.open(str(path)) as audio:
        assert audio.getnchannels() == 1 and audio.getsampwidth() == 2
        assert audio.getnframes() > audio.getframerate()*.3
        data = audio.readframes(audio.getnframes())
        assert any(data), f'Áudio silencioso: {path}'
        seconds += audio.getnframes()/audio.getframerate()
ids = {e['id'] for e in catalog}
for name in ['Ryder','Chase','Marshall','Skye','Rocky','Rubble','Zuma']:
    for kind in ['call','motto','instruction','praise','hint','reward']:
        assert f'{name}_{kind}' in ids
    assert (root/f'Assets/Resources/Pups/{name}.asset').is_file()
for vowel in 'AEIOU': assert 'Skye_'+vowel in ids
for number in range(1,6): assert f'Marshall_step{number}' in ids
json.loads((root/'Packages/manifest.json').read_text())
scene = root/'Assets/Scenes/MainGame.unity'
assert scene.is_file()
guid = re.search(r'guid: ([a-f0-9]{32})',Path(str(scene)+'.meta').read_text()).group(1)
assert guid in (root/'ProjectSettings/EditorBuildSettings.asset').read_text()
guids = []
for meta in (root/'Assets').rglob('*.meta'):
    match = re.search(r'^guid: ([a-f0-9]{32})$',meta.read_text(),re.M)
    assert match, meta
    guids.append(match.group(1))
assert len(guids)==len(set(guids)), 'GUID duplicado'
print(f'Integridade aprovada: {len(catalog)} WAVs, {seconds:.1f}s de fala, sete perfis, catálogo e cena registrados.')
print('Este teste não substitui compilação Unity nem teste funcional no Android.')
