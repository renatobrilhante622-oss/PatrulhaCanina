# Patrulha Canina: Aventura na Baía (Fase 2)

Jogo Android em landscape, WebView + Three.js, offline, sem anúncios e sem tela de Game Over.

## O que a Fase 2 tem

- **Filhotes 3D compostos:** Chase, Marshall, Skye, Rocky, Rubble e Zuma, com cabeça, orelhas, focinho, olhos brilhantes, chapéu/capacete próprio, mochila, 4 patas articuladas (trote e pulo) e rabo.
- **Veículos dirigíveis:** viatura do Chase e caminhão de bombeiro (rodas que giram, luzes piscando). Helicóptero da Skye como decoração, com rotores girando.
- **Cenário:** gramado com flores procedurais, cidade com prédios coloridos e janelas acesas, semáforos e hidrantes, torre-mirante com escorregador em espiral, farol, praia com palmeiras de folhas detalhadas, mar com ondas, píer e barco do Capitão Rodovalho.
- **Iluminação:** sol de fim de tarde com sombras suaves (`PCFSoftShadowMap`) que acompanham o jogador, luz hemisférica e neblina `FogExp2`.
- **Missão 1 (Marshall):** 10 focos com números coloridos e chamas em partículas, jato d'água em partículas, fumaça que some ao apagar o fogo, chuva de confetes 3D e Biscoito Canino dourado.
- **Pup-Pad do Ryder:** botão no canto superior direito. Repete a instrução, troca de filhote e volta ao farol.
- **Controles:** joystick translúcido à esquerda; botões Pular, Entrar (veículo) e Jato à direita.

## Controles

| Ação | Toque | Teclado | Gamepad |
|---|---|---|---|
| Andar | Joystick | Setas / WASD | Analógico esquerdo |
| Pular | Botão Pular | Shift esquerdo ou K | Botão A |
| Entrar/sair do veículo | Botão Entrar | E | Botão Y |
| Jato d'água | Segurar Jato | Espaço | Botão X |

## Estrutura

```
app/src/main/AndroidManifest.xml           orientação e permissões
app/src/main/java/.../MainActivity.java    WebView, tela cheia, botão voltar
app/src/main/assets/index.html             tela e HUD
app/src/main/assets/js/mundo.js            cena, luz, cidade, praia, farol, torre
app/src/main/assets/js/personagens.js      filhotes e veículos 3D
app/src/main/assets/js/jogo.js             controles, missão, Pup-Pad, áudio
app/src/main/assets/lib/three.min.js       gerado no build (não commitado)
app/src/main/assets/audio/*.mp3            gerado no build (não commitado)
app/src/main/assets/js/falas.js            gerado no build (não commitado)
scripts/gerar_audios.py                    gera as vozes com edge-tts + ffmpeg
.github/workflows/build-apk.yml            CI: compila e publica o APK
```

## Rodar no computador (opcional)

```bash
mkdir -p app/src/main/assets/lib
curl -fsSL https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js -o app/src/main/assets/lib/three.min.js
pip install edge-tts
python scripts/gerar_audios.py
```

Depois abra `app/src/main/assets/index.html` no navegador.

## Publicar

```bash
git add .
git commit -m "feat: fase 2 - personagens 3D, veiculos, cidade, praia e Pup-Pad"
git push origin main
```

## Observações

- **Assinatura:** cada build do CI usa uma chave de debug nova. Se der erro ao instalar sobre a versão anterior, desinstale antes.
- **Permissão do repositório:** em *Settings → Actions → General → Workflow permissions*, marque "Read and write permissions".
- **Vozes:** só o Marshall tem falas nesta fase. As outras vozes entram nas próximas fases, adicionando personagens em `VOZES` no `gerar_audios.py`.
- **Desempenho:** se um aparelho mais simples travar, reduza `mapSize` da sombra (em `mundo.js`) para 1024.
