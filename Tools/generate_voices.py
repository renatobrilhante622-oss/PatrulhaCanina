#!/usr/bin/env python3
"""Gera fala sintética PT-BR local e catálogo utilizado pelo jogo. Requer espeak-ng."""
import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import wave

ROOT = Path(__file__).resolve().parents[1]
NAMES = ['Ryder', 'Chase', 'Marshall', 'Skye', 'Rocky', 'Rubble', 'Zuma']
INSTRUCTIONS = {
 'Ryder': 'Escolha um amigo no distintivo. Vamos brincar com calma!',
 'Marshall': 'Toque nas chamas na ordem dos números. Comece pelo número um.',
 'Chase': 'Leve cada forma até a sombra igual. Você pode escolher por onde começar.',
 'Rocky': 'Papel na lixeira azul. Plástico na vermelha. Metal na amarela.',
 'Skye': 'Vamos conhecer as vogais. Toque na letra que eu falar.',
 'Rubble': 'Leve os blocos até a pilha. Comece pelo maior e termine com o menor.',
 'Zuma': 'Toque em duas boias. Encontre os animais iguais, sem pressa.'
}
MOTTOS = {
 'Ryder': 'Nenhum trabalho é tão grande, nenhum filhote é tão pequeno!',
 'Chase': 'Chase está no caso!', 'Marshall': 'Estou pronto para um resgate!',
 'Skye': 'Esse filhote vai voar!', 'Rocky': 'Não perca, reutilize!',
 'Rubble': 'Rubble a toda!', 'Zuma': 'Vamos mergulhar!'
}

def catalog():
 entries = []
 def add(id, speaker, text): entries.append(dict(id=id, speaker=speaker, text=text))
 for name in NAMES:
  add(name+'_call', name, f'Olá! Eu sou {name}. Vamos ajudar nossos amigos na Baía da Aventura?')
  add(name+'_motto', name, MOTTOS[name])
  add(name+'_instruction', name, INSTRUCTIONS[name])
  add(name+'_praise', name, 'Muito bem! Você conseguiu. Vamos continuar juntos!')
  add(name+'_hint', name, 'Tudo bem. Vamos tentar de novo com calma. Eu ajudo você.')
  add(name+'_reward', name, 'Que carinho! Aqui está um biscoito para nosso amigo. Obrigado por ajudar!')
 for n in range(1,6): add(f'Marshall_step{n}', 'Marshall', f'Agora toque na chama com o número {n}.')
 for vowel in 'AEIOU': add('Skye_'+vowel, 'Skye', f'Toque na vogal {vowel}.')
 add('Rubble_next', 'Rubble', 'Agora escolha o maior bloco que ainda está no chão.')
 add('Zuma_pair', 'Zuma', 'Olhe os animais. Se forem diferentes, podemos tentar outras boias.')
 return entries

def main():
 parser = argparse.ArgumentParser(description=__doc__)
 parser.add_argument('--engine', default=os.environ.get('ESPEAK_NG') or shutil.which('espeak-ng'))
 args = parser.parse_args()
 if not args.engine: parser.error('Instale espeak-ng ou defina ESPEAK_NG com o executável local.')
 target = ROOT/'Assets/Resources/Audio/Voices'
 target.mkdir(parents=True, exist_ok=True)
 entries = catalog()
 for entry in entries:
  index = NAMES.index(entry['speaker'])
  output = target/(entry['id']+'.wav')
  subprocess.run([args.engine, '-v', 'pt-br', '-s', '135', '-p', str(43+index*3), '-a', '65', '-w', str(output), entry['text']], check=True)
  with wave.open(str(output)) as wav:
   if wav.getnframes() < 1000 or wav.getsampwidth() != 2: raise RuntimeError(f'Áudio inválido: {output}')
 (ROOT/'Assets/Resources/VoiceCatalog.json').write_text(json.dumps({'entries':entries}, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
 print(f'{len(entries)} falas PT-BR geradas e verificadas.')
if __name__ == '__main__': main()
