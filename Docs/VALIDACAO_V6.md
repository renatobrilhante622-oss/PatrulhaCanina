# Verificação da edição Tycoon 6.0

Validação de engenharia realizada antes do envio para a main:

- Física original: movimento relativo à câmera, salto, turbo, trocas, missões livres, colisões, rampa e gol.
- Campanha: simulação de todas as 12 missões / 97 objetivos, ritual, ação incorreta sem perda, checkpoint e recompensa.
- Economia: esteira até nível 50; compra/capacidade de 16 espécies e cinco biomas; alimentação e interrupção gentil da renda; sementes, tempo de cultivo, colheita e transferência de estoque; construção, posição inválida, melhoria, movimentação e remoção; pinturas e acessórios; voo lendário; recompensas sem duplicar animal exclusivo; BOT Marshall efetivamente apaga um objetivo de fogo.
- Física Tycoon adicional: esteira mantém o filhote no lugar enquanto corre e permite sair; melhoria anfíbia muda a velocidade na água; ímã coleta a 12 metros.
- Browser real em Chromium com WebGL/SwiftShader: menu, modelos, dez regiões, controles, garagem, mapa, rolagem por toque, opções e save da campanha.
- Segundo browser real: adoção, plantio, melhoria de esteira, construção de celeiro por toque com raycast, pintura Neon, nitro, voo/altitude, chamada de BOTs, recarga de save migrado da v5 e ordem das Promises de áudio Ryder antes de Skye. Zero requisições externas durante a execução desse teste. Também foi verificado o início a frio entrando diretamente no Modo História: o primeiro toque libera o áudio do comunicador e o briefing.
- `validate_android.py`: 306/306 MP3s neurais com proveniência, hash do texto/arquivo, codec MP3 e duração; 12 efeitos/música; wrapper/Three.js; ausência de permissão INTERNET; sensorLandscape e versionCode 6/versionName 6.0.
- `validate_assets.py`: 27 GLBs 2.0 com hashes e licenças, dependências locais e 18 texturas de pelagem/uniforme de 1024 × 1024. Também há íris, terrenos, cinco pinturas UV e 16 miniaturas renderizadas dos GLBs.
- Gradle `:app:assembleDebug` com Java 17 e SDK 35: concluído. `apksigner verify --verbose`: assinatura v1/v2 válida. `aapt dump badging`: pacote `com.t4b.patrulhacanina`, versão 6/6.0, rótulo “Patrulha Canina - Tycoon”.

Os testes de domínio percorrem toda a campanha; isso não equivale a uma sessão manual completa de todas as missões no celular. Não foi feito teste em aparelho Android físico, medição de FPS/GPU/bateria ou avaliação clínica de acessibilidade. A interface oferece qualidade gráfica e 30/60 FPS configuráveis; não se afirma desempenho sustentado em todos os celulares.

Modelos autorais estilizados e vozes neurais próprias não são assets ou dublagem oficiais da série. As atribuições dos recursos de terceiros estão em `ASSETS_3D.md` e no APK.

O workflow da raiz repete as verificações e os testes, compila o APK, verifica a assinatura e atualiza a Release `latest` apenas se todas as etapas terminarem com sucesso.
