# PatrulhaCanina — construção automática

O repositório é um projeto Unity 2022.3.62f1. Os arquivos de Packages e ProjectSettings, a cena MainGame, sete perfis PupData, sprites procedurais e **54 WAVs de fala sintética PT-BR** já estão salvos. Não é necessário montar Canvas, arrastar referências, criar personagens ou desenhar cenários.

## Como o jogo se monta

`GameBootstrapper` usa `RuntimeInitializeOnLoadMethod` após carregar qualquer cena, inclusive uma cena vazia. Ele cria câmera 2D quando necessário, EventSystem com StandaloneInputModule, gerenciador persistente de áudio, Canvas Overlay 1920 × 1080, área segura responsiva e controlador do jogo.

`ProceduralWorldBuilder` desenha céu em gradiente, nuvens, gramado, farol, cidade, asfalto, hidrante, veículos, praia, pista, terra e píer usando Texture2D, Sprite.Create e formas de UI. `GentleMotion` anima nuvens, ondas, estrelas e chamas lentamente. A arte é original e estilizada, sem imagens ou vozes oficiais da franquia.

`AutoGameController` cria o Hub com os sete distintivos/personagens. Ryder orienta a escolha dos seis amigos com missões. Tocar em um amigo abre o chamado no Farol; o botão de confirmação seleciona o personagem, toca a instrução e libera a brincadeira. Os controles ficam bloqueados durante instruções e elogios. Pup-Pad repete a instrução quando a fila está livre. O botão Farol permite sair a qualquer momento.

| Personagem | Experiência pronta |
| --- | --- |
| Marshall | Cinco chamas coloridas, numeradas de 1 a 5, para tocar em ordem; gotas de água aparecem no acerto. |
| Chase | Círculo, quadrado, triângulo e estrela arrastáveis para sombras correspondentes. |
| Rocky | Seis resíduos com ícones e cores, três lixeiras: papel azul, plástico vermelho, metal amarelo. |
| Skye | Estrelas com A, E, I, O, U; a fala solicita cada vogal em sequência. |
| Rubble | Quatro blocos numerados com tamanhos diferentes, empilhados do maior para o menor. |
| Zuma | Seis boias embaralhadas, três pares de animais marinhos desenhados; pares diferentes voltam a fechar após observação, sem penalidade. |

O biscoito aparece ao concluir a missão e pode ser dado ao personagem com um toque. É possível repetir ou escolher outro amigo. Não há cronômetro, pontuação negativa, anúncios, rede ou Game Over. Os sprites genéricos dos perfis são substituídos por retratos desenhados em código na UI. Os scripts originais EducationalMissionBase, MarshallFireMinigame, ChaseShapesMinigame e RockyRecycleMinigame continuam disponíveis para cenas personalizadas; o fluxo automático usa AutoGameController para unificar as seis missões.

## Editor automático

`Assets/Editor/AutoFullGameSetup.cs` executa após a importação/compilação. Ele preserva assets existentes, cria perfis e imagens ausentes, registra MainGame e configura Android Landscape, IL2CPP e ARM64. A cena inicial contém apenas um marcador: os objetos visuais são construídos automaticamente ao executar o jogo, e não precisam ser salvos manualmente na Hierarchy.

O menu **PatrulhaCanina > Construir Jogo Completo e Gerar APK** gera `build/Android/PatrulhaCanina.apk`. Requer um Editor Unity ativado e Android Build Support, SDK, NDK e OpenJDK da mesma versão. Pelo terminal, a mesma operação é `Unity -batchmode -quit -projectPath . -executeMethod PatrulhaCanina.Editor.AutoFullGameSetup.BuildAndroid -buildTarget Android -logFile build.log`. Nenhuma montagem manual de cena é necessária.

## Vozes e legendas

Todos os WAVs estão em `Assets/Resources/Audio/Voices/`. O catálogo `Assets/Resources/VoiceCatalog.json` associa identificadores, personagens e legendas. As falas incluem chamados, bordões, instruções, elogios, dicas e recompensa. O gerador usa eSpeak NG com voz `pt-br`, ritmo reduzido e variações leves de altura; é voz sintética, não dublagem humana nem clonagem de atores. Não há síntese online em execução.

`VoiceManager` mantém uma fila, três AudioSources locais, ducking suave e última instrução separada dos elogios. `VoiceSynthesizer` publica a legenda correspondente quando a fala começa; a UI mostra um distintivo colorido ao lado. Se um WAV estiver ausente, toca um sinal suave e mantém a legenda. Esse fallback sonoro não pronuncia palavras. Música fica desligada por padrão para reduzir estímulos; PlayMusic aceita um AudioClip local se desejado.

Para regenerar as gravações, instale eSpeak NG e execute `python3 Tools/generate_voices.py`; também aceita `--engine /caminho/espeak-ng`. O jogo distribuído não precisa de Python nem eSpeak. Para materializar sprites, perfis e metadados fora do Editor, execute `python3 Tools/prepare_assets.py`. O preparador preserva arquivos existentes e usa GUIDs determinísticos.

## APK na nuvem e download pelo celular

O workflow `.github/workflows/build-android-apk.yml` executa em push para main, tags v* e acionamento manual. Ele verifica os áudios, usa game-ci/unity-builder com Unity 2022.3.62f1, chama o construtor do Editor e publica o APK nos Artifacts. Em tags v*, também anexa o APK diretamente a uma GitHub Release. O build comum da main gera Artifact, não cria uma Release automaticamente.

**Pré-requisito externo obrigatório:** o repositório precisa de credenciais/licença Unity válidas e Actions habilitado. O workflow referencia os secrets `UNITY_LICENSE`, `UNITY_EMAIL` e `UNITY_PASSWORD` conforme o mecanismo de ativação do GameCI. Configure esses valores apenas em GitHub > Settings > Secrets and variables > Actions; nunca em código ou chat. A compatibilidade da licença com ativação em CI depende da modalidade Unity contratada. Este projeto não gera, compra ou contorna uma licença. Sem ativação válida o build falha, mesmo que o código esteja correto.

Depois de um build bem-sucedido, abra Actions > Build Android APK > execução > Artifacts > PatrulhaCanina-Android-APK. O Artifact é um ZIP que contém o APK; extraia-o antes de instalar no celular. Para download direto do arquivo APK sem ZIP, use a Release criada por uma tag v*. Instalação lateral no Android pode exigir autorizar o navegador/gerenciador de arquivos. O APK usa assinatura de desenvolvimento padrão; publicação em loja exige identidade de assinatura própria, guardada fora do Git.

## Validação e limites

`python3 Tools/validate_project.py` verifica catálogo, integridade PCM dos WAVs, duração não vazia, sete perfis, GUIDs únicos e registro da cena. Essa verificação não executa Unity. A sintaxe de C# pode ser analisada separadamente, mas a confirmação de compilação depende do Editor ou do workflow.

Este ambiente de desenvolvimento não possui Editor Unity nem Android toolchain. Portanto, não foi possível executar os minigames, inspecionar visualmente os cenários, confirmar compilação C# contra Unity ou gerar/instalar um APK aqui. O commit/push também não comprova sucesso do build. Valide a execução da Action e teste o APK em aparelho real antes de entregá-lo a uma criança.

No aparelho, verifique todas as seis missões, dois dedos simultâneos, retorno ao Farol durante fala, pausa/retomada durante arraste, repetição pelo Pup-Pad, telas com recorte e modo avião desde a primeira abertura. As preferências sensoriais variam: mantenha áudio baixo, observe conforto e ajuste ritmo/cores com responsáveis. O jogo é educativo e não faz alegações terapêuticas.
