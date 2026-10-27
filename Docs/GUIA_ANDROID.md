# Patrulha Canina — Aventura 3D (Android 4.0)

## Arquitetura offline

Java 17 + Android Gradle Plugin 8.7.3 + Gradle 8.9 + SDK 35. Aplicativo com.t4b.patrulhacanina, versão 4.0.0/versionCode 4. Android mínimo 23, com WebView atualizado e suporte a WebGL/GLES 2. A atividade força sensorLandscape e LAYER_TYPE_HARDWARE, modo imersivo e área segura. O manifesto continua sem INTERNET.

Three.js **0.160.1**, licença MIT, está versionado em app/src/main/assets/js/three.min.js com licença e SHA-256. Não usa CDN, GLBs externos, fontes remotas ou downloads em execução. MainActivity serve /js e /audio diretamente dos assets por uma origem virtual HTTPS; os demais links são bloqueados.

Arquivos do jogo:

- world.js: simulação 3D, colisões, pulo, movimento, objetivos, bola e gols. Independente de Three.js para testes de física.
- models.js: oito filhotes originais articulados e oito veículos, criados com malhas tridimensionais.
- game.js: mundo, WebGLRenderer com antialias, PCFSoftShadowMap, iluminação Hemisphere/Directional, skybox procedural, FogExp2, câmeras, interface e animação.
- audio.js: fila de vozes, decodificação dos MP3s locais, música, motor, efeitos e ducking.

Não se trata de um Canvas 2D imitando perspectiva: as malhas são renderizadas pelo WebGL, com teste de profundidade, sombras, câmera PerspectiveCamera e um minimapa da própria cena por câmera OrthographicCamera/RenderTarget. O minimapa atualiza em cadência reduzida e é composto sobre a tela para limitar custo. O renderizador limita DPR a 1,5, usa distância de exibição por grupo e compartilha geometria/material; o desempenho real depende do GPU/aparelho. Não há promessa de 60 FPS sem medição física.

## Controles

Analógico esquerdo: anda/dirige relativo à direção da câmera. Arraste na parte direita livre: gira a câmera; após alguns segundos andando, o acompanhamento volta gradualmente para trás do personagem. A câmera evita atravessar os prédios registrados para colisão. Teleportes reposicionam a câmera imediatamente para evitar atravessar o mundo em um voo involuntário.

Cinco botões grandes: Pular/Turbo, Dirigir veículo, Mochila/Chute, Trocar amigo e Viajar. Há Pup-Pad, botão de som, contador de ossinhos/estrelas/gols e minimapa. Suporta simultaneamente movimento e outro dedo em botão. Gamepad padrão: A=ferramenta, B=pulo, X=veículo, Y=amigos e botão superior=áreas; analógico direito gira a câmera. Teclado: WASD/setas, J=ferramenta, Espaço=pulo, K=veículo, L=amigos, M=áreas.

## Personagens e veículos

Chase, Marshall, Skye, Rocky, Rubble, Zuma, Tracker e Everest podem ser trocados sem perder a posição. Ryder aparece como personagem humano no Farol e orienta por voz. Os filhotes têm cabeça/focinho/olhos, orelhas articuladas, patinhas com ciclo de caminhada, rabo, mochila e chapéu/capacete. Incluem manchas do Marshall, cachos/óculos da Skye, focinho do Rubble e máscaras claras do Tracker/Everest.

Veículos têm rodas com rotação, cabine e faróis. Há escada e tanques do Marshall, luzes de sinalização em variação lenta, hélice do helicóptero, caçamba do Rocky, pá do Rubble, hovercraft do Zuma, jipe branco listrado do Tracker e pá de neve da Everest. São modelos procedurais estilizados, não os modelos comerciais de PAW Patrol World/Grand Prix.

## Áreas conectadas

1. **Selva (-125, -100)**: trilha de lajes, 28 palmeiras com sombras e balanço, vegetação tropical, paredão, barris, templo e dez ossinhos numerados. Macaco, tucano e sapo têm explicações por voz. Ossinhos fora de sequência permanecem disponíveis, sem punição.
2. **Grand Prix (120, -85)**: circuito oval pavimentado, muretas/cores, bandeiras com coroas, pinheiros, torre de relógio, ponte sobre água e rampas. Veículos recebem turbo nos boosters; formas coletáveis apresentam círculo/quadrado/triângulo/estrela. A corrida é livre, sem cronômetro ou derrota.
3. **Estádio (35, 125)**: gramado listrado, linhas, círculo central, áreas, pista de atletismo, cercas, arquibancadas com público instanciado e duas traves com redes de geometria real. Bola tem gravidade, velocidade, rotação, amortecimento, atrito e colisões. O contato empurra; a mochila chuta com arco. Zuma é goleiro amistoso que alcança apenas bolas baixas. Gols geram partículas 3D e narração de 1 a 10; após 10, continuam contando no placar com elogio genérico. A cor da bola muda junto à fala educativa.
4. **Farol/cidade (0, 0)**: torre, Ryder, veículos estacionados, prédios, resgates de cinco chamas numeradas pelo Marshall, lixeiras e materiais de quatro categorias para Rocky, vogais/resgate aéreo com Skye e montinhos de neve para Everest.

As áreas podem ser alcançadas andando/dirigindo ou pelo botão Viajar. Árvores, montanhas, nuvens volumétricas e dirigível roxo completam o horizonte. Não há Game Over, dano, punição por erro ou limite de tempo. O progresso permanece durante a sessão.

## Vozes e sons: o que é realmente fornecido

O roteiro foi ampliado para **150 falas PT-BR**, incluindo Tracker, Everest, gols e apresentação das áreas. Edge TTS 7.3.1 gera arquivos reais com voz neural. Em seguida ffmpeg aplica uma estilização leve usando asetrate/aresample, atempo, equalizer e chorus, com limitador. O manifest registra processamento, voz-base, parâmetros, texto e hashes. O CI exige o conjunto completo antes de publicar.

**Não há clonagem nem identidade vocal dos atores originais.** Processar uma voz-base não a torna idêntica à dublagem brasileira. Não foram fornecidas amostras de atores com autorização/licença para integração; não baixamos bordões de vídeos para apresentá-los como material livre. O serviço Edge não anuncia todas as vozes Azure originalmente pedidas: usa vozes PT-BR disponíveis do mesmo gênero e documenta os nomes reais no manifest. Tracker usa Antonio e Everest usa Francisca como preferências.

Tools/generate_sfx.py gera dez MP3s **originais sintetizados**: latido estilizado, sirene suave, motor, apito, chute, textura de torcida, água, coleta, pulo e uma composição instrumental própria em loop. Eles não são gravações reais de animais/público nem o tema oficial da série. Música abaixa durante as falas; motor varia a velocidade de reprodução conforme a condução.

Os 105 arquivos anteriores são processados localmente quando compatíveis e os 45 novos são gerados em CI se o proxy local bloquear o Edge. Depois que todos estão versionados, o gerador verifica hashes sem depender da rede de voz para todo build. Áudio e jogo funcionam offline depois da instalação.

## Build e publicação

O workflow único .github/workflows/build-apk.yml usa Ubuntu 24.04, Java 17, Python 3.11 e SDK do runner. Instala ffmpeg/edge-tts, gera efeitos e falas faltantes, valida hashes/codec/duração, testa simulação e WebGL no Chromium, compila e verifica a assinatura. Em main o bot versiona os áudios com [skip ci] e publica o APK na Release latest usando o GITHUB_TOKEN automático, sem licença Unity ou secrets externos.

Comandos:

- npm ci
- python3 -m pip install -r Tools/requirements-voices.txt
- python3 Tools/generate_sfx.py
- python3 Tools/generate_voices.py
- python3 Tools/validate_android.py
- CHROMIUM_PATH=/usr/bin/chromium npm test (ou npx playwright install --with-deps chromium e npm test)
- ./gradlew --no-daemon :app:assembleDebug

APK em app/build/outputs/apk/debug/app-debug.apk. A chave incluída é pública, de desenvolvimento, e não serve como assinatura privada de produção. Modo imersivo não é quiosque: Android permite gestos do sistema para sair/revelar barras.

## Validação e limites

A suíte de simulação exercita movimento relativo à câmera, pulo/aterrissagem, turbo, personagens, ossinhos ordenados, animais, fogo, reciclagem, voo, neve, altura da ponte, chute, quique e gol. Chromium executa **WebGL real**, por SwiftShader em CI, para verificar oito modelos, quatro áreas, teleporte, câmera orbital, veículo, turbo e paisagem. Isso não mede aceleração de GPU Android nem substitui jogar no celular.

O APK deve ser testado em aparelho real: performance térmica, legibilidade dos números, conforto sensorial, áudio no volume normal, multitouch e diferentes gamepads. A qualidade é procedural e original; não alegamos equivalência visual ao produto comercial nem dublagem oficial.
