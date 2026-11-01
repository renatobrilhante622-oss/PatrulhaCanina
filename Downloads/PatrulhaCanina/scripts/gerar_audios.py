#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gera as falas em Português do Brasil com edge-tts (vozes neurais) e normaliza o volume com ffmpeg.

Saída:
  app/src/main/assets/audio/<id>.mp3   -> áudios tocados pelo jogo
  app/src/main/assets/js/falas.js      -> textos das falas (legenda e fallback de voz do sistema)

Roda dentro do GitHub Actions antes do build. Se uma fala falhar, o script continua;
o jogo então usa a síntese de voz do aparelho para aquela fala.
"""
import asyncio
import json
import os
import shutil
import subprocess
import sys

import edge_tts

RAIZ = os.path.normpath(os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "app", "src", "main", "assets"))
PASTA_AUDIO = os.path.join(RAIZ, "audio")
PASTA_JS = os.path.join(RAIZ, "js")

# Cada personagem tem a sua voz. Nas próximas fases, basta adicionar entradas aqui.
VOZES = {
    "marshall": {"voz": "pt-BR-AntonioNeural", "rate": "+6%", "pitch": "+6Hz"},
}


def montar_falas():
    """Retorna {id: (personagem, texto)}."""
    falas = {
        "briefing": ("marshall",
                     "Ei, equipe! Tem fogo na praça da Baía da Aventura! Vamos apagar os focos "
                     "na ordem, do número 1 ao número 10. Com o jato d'água a gente consegue!"),
        "dica_spray": ("marshall",
                       "Segure o botão azul do jato d'água, bem firme, para apagar o fogo!"),
        "vitoria": ("marshall",
                    "Missão cumprida! Vocês são heróis! Ganhamos um biscoito canino!"),
    }
    for n in range(1, 11):
        texto_dica = ("Primeiro, mire o jato no número 1!" if n == 1
                      else f"Mire o jato no número {n}!")
        falas[f"dica_{n}"] = ("marshall", texto_dica)
        falas[f"apagado_{n}"] = ("marshall", f"Número {n} apagado! Muito bem!")
    return falas


async def gerar_uma(id_fala, personagem, texto):
    cfg = VOZES[personagem]
    destino = os.path.join(PASTA_AUDIO, f"{id_fala}.mp3")
    bruto = destino + ".bruto.mp3"
    try:
        com = edge_tts.Communicate(texto, cfg["voz"], rate=cfg["rate"], pitch=cfg["pitch"])
        await com.save(bruto)
    except Exception as erro:  # rede, serviço indisponível, etc.
        print(f"[ERRO] {id_fala}: {erro}")
        return False

    if shutil.which("ffmpeg"):
        r = subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", bruto,
             "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
             "-c:a", "libmp3lame", "-q:a", "4", destino],
            capture_output=True)
        if r.returncode == 0 and os.path.exists(destino) and os.path.getsize(destino) > 0:
            os.remove(bruto)
            return True

    # Sem ffmpeg (ou se falhou): usa o áudio bruto mesmo
    os.replace(bruto, destino)
    return True


async def main():
    os.makedirs(PASTA_AUDIO, exist_ok=True)
    os.makedirs(PASTA_JS, exist_ok=True)

    falas = montar_falas()
    ok = 0
    for id_fala, (personagem, texto) in falas.items():
        if await gerar_uma(id_fala, personagem, texto):
            ok += 1

    textos = {k: v[1] for k, v in falas.items()}
    caminho_js = os.path.join(PASTA_JS, "falas.js")
    with open(caminho_js, "w", encoding="utf-8") as f:
        f.write("// Gerado por scripts/gerar_audios.py. Não editar à mão.\n")
        f.write("window.FALAS = " + json.dumps(textos, ensure_ascii=False, indent=2) + ";\n")

    print(f"Áudios gerados: {ok}/{len(falas)}")
    print(f"Textos escritos em: {caminho_js}")
    return 0  # não falha o build; o jogo tem fallback


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
