# Baía da Aventura — exploração Android 3.0

## Controles e mundo

O jogo atual é um mundo top-down de **3200 × 2400**, desenhado em Canvas e empacotado em Android WebView local. Não há troca para telas estáticas de minigame: os objetivos ficam distribuídos pelo mapa, com câmera suave, radar, seta no chão, caminhada animada, pulo e veículos.

- Analógico esquerdo: movimento em 360 graus com aceleração, frenagem e zona morta. É possível usar outro dedo para apertar um botão ao mesmo tempo.
- A: ferramenta da mochila e interação com o objeto próximo. Segurar repete a ação com intervalo. Marshall precisa estar apontando para a chama; não basta apertar longe dela.
- B: pulo a pé ou turbo temporário dirigindo.
- X: chama/entra/sai do veículo, com sinal sonoro suave e animação de chegada.
- Y: abre seleção rápida dos sete personagens. A troca mantém a posição e o progresso do mapa.
- Pup-Pad: interrompe a fala anterior, repete a dica do objetivo atual e destaca a seta.
- Som: permite silenciar música, vozes e efeitos mantendo as legendas.
- Gamepad externo: analógico esquerdo ou direcional, botões padrão A/B/X/Y. O navegador precisa expor o controle por navigator.getGamepads; a compatibilidade de mapeamento depende do gamepad/WebView.
- Teclado para desenvolvimento: WASD/setas; J=A, Espaço=B, K=X, L=Y.

O HUD mostra biscoitos e estrelas. O radar mostra o jogador, o Farol e objetivos. A seta usa o objetivo do personagem atual; Ryder orienta junto ao painel central. Não há pontuação negativa, cronômetro, vida ou Game Over.

## Atividades completas

1. Farol central: painel do Ryder, escorregador e comedouro. O escorregador funciona com A; o comedouro permite dar carinho/biscoito.
2. Cidade: dez chamas numeradas em ordem para Marshall, água com trajetória animada, três cores do semáforo e quatro gatinhos com pistas de formas para Chase.
3. Praia/píer: Rocky coleta papel, plástico, metal e vidro e leva cada um à lixeira correta; depois leva uma roda ao brinquedo. Zuma resgata tartaruga, polvo e estrela do mar, em sequência com contagem e explicações.
4. Parque/pomar: Skye encontra as cinco vogais em balões, com exemplos de palavras; helicóptero disponível pelo X.
5. Fazenda/obras: Rubble retira quatro pedras do maior para o menor, leva quatro peças de formas à ponte e alimenta vaquinha, porquinho e ovelha.
6. Atividades livres: sementes que viram flores com água do Marshall, hidrantes, flores que abrem por proximidade, cinco pegadas em sequência até um baú, biscoitos e ossinhos coletáveis pelo caminho.

Cada missão principal concede estrelas e abre uma recompensa com estrelas suaves e biscoito. A conclusão não apaga o mapa nem bloqueia atividades livres. O progresso é da sessão; não há armazenamento de dados pessoais. A arte dos personagens é estilizada e original, sem sprites oficiais. O motor trabalha com requestAnimationFrame e culling; 60 FPS é uma meta, não uma medição garantida em todos os celulares.

## Paisagem e Android

Manifesto: sensorLandscape e configChanges orientation|screenSize|keyboardHidden. MainActivity também chama setRequestedOrientation(SCREEN_ORIENTATION_SENSOR_LANDSCAPE), aplica IMMERSIVE_STICKY e respeita recortes. O Canvas preserva 16:9 com ajuste fluido e mostra aviso quando a viewport estiver em retrato. O modo imersivo não é quiosque: o Android permite revelar barras por gestos do sistema.

Identificador: com.t4b.patrulhacanina. Versão 3.0.0, versionCode 3. Java 17, Gradle 8.9, AGP 8.7.3, SDK 35 e mínimo 23. É necessário Android System WebView atualizado para Canvas, Pointer Events, Web Audio e JavaScript moderno.

Não há permissão INTERNET no APK. HTTPS game.local é uma origem virtual: MainActivity intercepta e serve somente arquivos de assets, inclusive /audio/*.mp3. A geração de áudio acontece antes de empacotar; o jogo instalado não consulta Microsoft, Unity ou qualquer servidor.

## Dublagem neural: procedência e limitações reais

Tools/voice_catalog.py contém **105 falas** de saudações, bordões, números, cores, formas, vogais, materiais e animais. Tools/generate_voices.py usa edge-tts 7.2.8 e grava **MP3s reais** em app/src/main/assets/audio. Não usa eSpeak, conversão de WAV antigo, clonagem de ator ou bipes como se fossem fala. Os WAVs históricos permanecem em Assets/Resources apenas como legado; foram removidos do pacote Android.

O gerador consulta as vozes PT-BR anunciadas pelo próprio serviço. Solicita Antonio, Fabio, Julio, Francisca, Rodrigo, Humberto e Thalita, com os pitch/rates pedidos. **A existência de uma voz no catálogo Azure não garante que o endpoint Edge a ofereça.** Quando a solicitada não está disponível, usa uma voz PT-BR anunciada com o mesmo gênero, preserva pitch/rate e registra requestedVoice e voice usados no manifest. Assim, a configuração não inventa sete vozes distintas quando o serviço oferece menos.

neural-manifest.json registra origem, voz, parâmetros, hash de texto e SHA-256 do MP3. ffprobe exige codec MP3 e duração de fala; o validador compara hashes e exige todos os arquivos em CI. Isso verifica formato/integridade/procedência declarada pelo gerador, mas ouvir as falas continua necessário para avaliar naturalidade e conforto. Não há promessa de que um serviço gratuito e não contratado permaneça disponível indefinidamente.

Neste ambiente, a consulta HTTPS ao Microsoft Edge TTS recebeu **HTTP 403 do proxy**, inclusive na tentativa com execução ampliada. Por isso não foi possível gerar ou validar MP3s neurais localmente nesta etapa. O build local valida código/empacotamento com legendas, sem dublagem, e não comprova entrega das vozes. A API de reprodução simplesmente mantém a legenda se um MP3 faltar; nunca substitui por voz robotizada. O workflow é estrito e não publica uma nova Release sem os MP3s completos.

## CI e commit automático dos MP3s

O workflow instala edge-tts e ffprobe, gera MP3s faltantes e valida todos. Em push para main, grava os MP3s e o manifest em um commit bot (`[skip ci]`), usando apenas o GITHUB_TOKEN automático com contents:write. Assets já completos e com hash correto são reaproveitados sem consultar o serviço. A revisão compilada, incluindo o commit de áudio, é passada ao job da Release latest. Não são necessários secrets de Unity ou API keys.

Se o serviço de voz estiver indisponível também no runner, a etapa neural falha explicitamente e preserva a Release anterior. Esse é um bloqueio externo de geração, não um erro de Gradle nem autorização para fabricar áudios. Consulte a etapa **Gerar falas neurais PT-BR reais** no Actions e o manifest antes de afirmar que o novo APK está dublado.

## Comandos e verificações

- Instalar gerador: python3 -m pip install -r Tools/requirements-voices.txt
- Gerar MP3s em rede com acesso ao serviço: python3 Tools/generate_voices.py
- Gerar apenas roteiro/legendas, sem alegar voz pronta: python3 Tools/generate_voices.py --catalog-only
- Verificação estrita de áudio e projeto: python3 Tools/validate_android.py
- Verificação local explícita com áudio ainda ausente: python3 Tools/validate_android.py --allow-missing-audio
- Testes: npm ci; npx playwright install chromium; npm test
- APK: ./gradlew --no-daemon :app:assembleDebug

A suíte de simulação resolve as seis missões, testando ordens, erros gentis, transporte de materiais, ponte e troca de personagem. A suíte Chromium usa dois toques reais simultâneos via CDP, veículo, turbo, gamepad, posição preservada e aviso de orientação. Esses testes não substituem teste em aparelho Android, escuta das vozes neurais nem medição de FPS.

A assinatura continua pública e exclusiva de desenvolvimento, em Tools/debug.keystore. Não é uma chave de produção. O APK fica no Artifact PatrulhaCanina-APK e, após sucesso completo em main, em releases/latest/download/PatrulhaCanina.apk. O Android pode exigir autorização para instalar APKs pelo navegador.
