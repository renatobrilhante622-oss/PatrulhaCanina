#!/usr/bin/env python3
"""Empacota WAVs locais. CI não usa TTS, rede de fala, API key ou vozes do aparelho."""
import json
import shutil
from pathlib import Path
root=Path(__file__).resolve().parents[1]
dest=root/'app/src/main/assets/game'
(dest/'audio').mkdir(parents=True,exist_ok=True)
catalog=root/'Assets/Resources/VoiceCatalog.json'
entries=json.loads(catalog.read_text())['entries']
for entry in entries:
    source=root/'Assets/Resources/Audio/Voices'/(entry['id']+'.wav')
    if not source.is_file(): raise FileNotFoundError(source)
    shutil.copyfile(source,dest/'audio'/source.name)
shutil.copyfile(catalog,dest/'catalog.json')
print(f'{len(entries)} falas locais empacotadas no Android.')
