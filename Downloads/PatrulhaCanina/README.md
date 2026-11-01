# Patrulha Canina: Aventura na Baía (Fase 1)

Jogo Android em landscape, feito com WebView + Three.js, offline, sem anúncios e sem tela de Game Over.

## O que a Fase 1 tem

- Projeto Android (Gradle, `MainActivity` com WebView acelerada por hardware, tela cheia imersiva, `sensorLandscape`)
- Tela de título com câmera 3D orbitando o Farol da Baía da Aventura
- Mundo 3D com sombras suaves (`PCFSoftShadowMap`), luz solar e hemisférica, céu e câmera em terceira pessoa
- Marshall andando com joystick na tela, teclado (setas/WASD) ou gamepad
- **Missão 1**: apagar os 10 focos de fogo na ordem, segurando o botão do jato d'água
- Vozes PT-BR geradas com `edge-tts` no build, ducking automático da música
- Opções dos pais: volume de voz, música, efeitos e sensibilidade
- Workflow do GitHub Actions que gera o APK, sobe em Artifacts e atualiza a release `latest`

## Estrutura

```
app/src/main/AndroidManifest.xml          orientação e permissões
app/src/main/java/.../MainActivity.java   WebView, tela cheia, botão voltar
app/src/main/assets/index.html            o jogo inteiro (Three.js + lógica)
app/src/main/assets/lib/three.min.js      gerado no build (não commitado)
app/src/main/assets/audio/*.mp3           gerado no build (não commitado)
app/src/main/assets/js/falas.js           gerado no build (não commitado)
scripts/gerar_audios.py                   gera as vozes com edge-tts + ffmpeg
.github/workflows/build-apk.yml           CI: compila e publica o APK
```

## Rodar localmente (opcional)

Para testar o jogo no computador, baixe o Three.js e gere as falas:

```bash
mkdir -p app/src/main/assets/lib
curl -fsSL https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js -o app/src/main/assets/lib/three.min.js
pip install edge-tts
python scripts/gerar_audios.py
```

Depois abra `app/src/main/assets/index.html` no navegador. O jogo funciona com mouse/teclado: setas para andar, e segure **Espaço** para o jato.

## Publicar no GitHub

```bash
git add .
git commit -m "feat: fase 1 - esqueleto Android, Three.js, titulo e Missao 1 do Marshall"
git push origin main
```

O push dispara o workflow. O APK aparece em **Actions → Artifacts** e na release **latest**.

## Observações

- **Instalação:** cada build do CI é assinado com uma chave de debug nova. Se der erro de assinatura ao instalar, desinstale a versão anterior antes de instalar a nova.
- **Permissões do GitHub:** em *Settings → Actions → General → Workflow permissions*, deixe "Read and write permissions" para a release ser atualizada. O workflow já pede `contents: write`, mas essa opção do repositório pode bloquear.
- **Vozes:** se o `edge-tts` não conseguir gerar alguma fala no build, o jogo usa a voz do próprio aparelho para ela.
