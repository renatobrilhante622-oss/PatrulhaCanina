# Android sem licença Unity e sem secrets externos

## Arquitetura e execução

O projeto Android está na raiz: settings.gradle, build.gradle, gradlew, gradle/wrapper e módulo app. Usa Android Gradle Plugin 8.7.3, Gradle 8.9, Java 17, compile/target SDK 35 e min SDK 23. O identificador é `com.t4b.patrulhacanina`; o nome exibido é **Patrulha Canina - Missões**.

MainActivity cria uma WebView acelerada por hardware, em paisagem e modo imersivo. O Android ainda permite revelar barras por gesto do sistema: modo imersivo não é modo quiosque nem controle parental. Voltar retorna ao Farol em vez de fechar abruptamente a missão.

Todos os pedidos HTTPS à origem virtual game.local são atendidos diretamente pelos assets do APK, sem conexão com servidor. Links e outras origens são bloqueados; acesso a arquivos externos e conteúdo de outros aplicativos está desativado. O manifesto não declara INTERNET nem outra permissão. Não há JavaScriptInterface, anúncios, analítica, TTS remoto ou instalação de pacote de voz no aparelho.

O motor em app/src/main/assets/game/game.js desenha os cenários e personagens no Canvas, com requestAnimationFrame, limite de delta de física e resolução interna limitada a DPR 2. A meta é 60 FPS; a taxa efetiva depende do aparelho e não é uma garantia. O jogo requer Android System WebView com suporte a Canvas, Web Audio, Pointer Events e JavaScript moderno. WebView antigo/desatualizado pode não suportar todos esses recursos.

O viewport mantém proporções e alvos grandes. Os gestos usam captura de ponteiro, um arraste ativo de cada vez e restauração da peça ao cancelar ou trocar o foco. Não há contador de erros, tempo limite ou Game Over. O progresso das tentativas permanece na sessão; não há coleta de dados ou salvamento de perfil pessoal.

## Conteúdo

O Farol é interativo. Ryder orienta; os outros seis personagens levam às respectivas missões depois de um chamado e confirmação por toque.

- Marshall: chamas 1–5 em sequência, caminhão e jato de gotas com trajetória curva.
- Chase: círculo, quadrado, triângulo e estrela arrastados até as sombras.
- Rocky: seis resíduos em lixeiras de papel/azul, plástico/vermelho e metal/amarelo; depois encaixe da roda para consertar o carrinho.
- Skye: estrelas com vogais em sequência; o helicóptero voa suavemente até a escolha correta.
- Rubble: blocos do maior para o menor; depois contagem de cinco pedras em sequência.
- Zuma: seis boias embaralhadas com três pares de animais. Pares diferentes fecham sem punição depois de uma observação calma.

Ao concluir, estrelas descem lentamente e o personagem recebe um biscoito por toque. Há animação de boca, som sintético de mastigação e sinal alegre. A arte e os sons são originais e procedurais; os retratos são estilizados e não são sprites oficiais. As vozes são síntese PT-BR do eSpeak NG, não imitações dos atores. As preferências sensoriais variam; valide volume, ritmo e estímulos com responsáveis antes de uso pela criança.

## Voz e áudio

Os 60 WAVs e o catálogo ficam dentro de app/src/main/assets/game. Tools/sync_android_assets.py sincroniza os originais locais, verificáveis no Git. Não é necessário instalar eSpeak para compilar ou jogar. Para modificar falas, regenere com Tools/generate_voices.py e sincronize o pacote.

AudioGuide cria uma fila de falas, mostra legendas sincronizadas no início de cada fala e reduz a música com setTargetAtTime durante a voz. A música e os efeitos também são gerados localmente pelo Web Audio. Pup-Pad pode ser acionado durante a missão; uma repetição é enfileirada após a fala atual, sem cortar frases ou acumular várias repetições. Elogios não substituem a instrução lembrada. Som pode ser desligado; as legendas continuam. Na falta inesperada de um WAV, há legenda e um sinal suave, sem depender de síntese de voz do aparelho.

O áudio só é iniciado após o primeiro toque, respeitando a política do WebView. Ao suspender o aplicativo, áudio e arraste são pausados. Um novo toque retoma o áudio ao voltar. A ausência de rede não afeta nenhum conteúdo.

## Pipeline automático

.github/workflows/build-apk.yml roda em pushes para main, pull requests e acionamento manual. Ele instala Java 17 e Python 3.11, usa o Android SDK pré-instalado do runner ubuntu-24.04 e instala as plataformas/Build Tools necessários, verifica os áudios, testa as seis missões com Chromium/Playwright, compila assembleDebug, verifica a assinatura e publica o Artifact PatrulhaCanina-APK.

Após sucesso em push para main, o job release atualiza a tag e a Release latest e anexa **PatrulhaCanina.apk**. O download direto fica em:

https://github.com/renatobrilhante622-oss/PatrulhaCanina/releases/latest/download/PatrulhaCanina.apk

O job de Release tem contents:write e usa exclusivamente github.token, fornecido automaticamente pelo GitHub. Não há UNITY_LICENSE, API key de voz, senha de conta ou secret externo. Pull requests não publicam releases; o GitHub reduz as permissões de tokens em contribuições de forks conforme sua política. A organização/repositório ainda precisa permitir Actions e a permissão declarada pelo workflow; políticas administrativas ou indisponibilidade dos serviços podem impedir builds/publicação.

GitHub Actions oferece cotas gratuitas conforme o plano e a visibilidade do repositório; o projeto usa ferramentas gratuitas, mas não promete minutos ilimitados do serviço. A instalação das dependências de build requer rede; o aplicativo instalado funciona offline.

## Assinatura e atualização

Tools/debug.keystore é deliberadamente uma chave pública de desenvolvimento, com alias androiddebugkey e senhas padrão android. Serve exclusivamente para APKs de teste e mantém a mesma identidade de assinatura entre execuções. Não é uma credencial externa e não oferece segurança de autoria de produção: qualquer pessoa com o arquivo pode assinar outro APK. Para distribuição final, substitua por chave privada de produção protegida.

O pacote novo `com.t4b.patrulhacanina` não atualiza o antigo aplicativo Unity `com.renatobrilhante.patrulhacanina`: ambos podem coexistir. Versão de teste atual: 2.0.0, versionCode 2. O APK debug é depurável; não é um pacote de distribuição para loja.

## Validação

Tools/validate_android.py confere todos os WAVs, catálogo, personagens, identificador, orientação, ausência de permissões, chave debug e checksums do Wrapper. Tools/test_game.cjs usa eventos reais de ponteiro no Chromium para resolver todas as missões, inclusive tentativas incorretas, conserto, contagem, pares diferentes, repetição, recompensa e retorno ao Hub. As falas são decodificadas de arquivos reais, mas aceleradas no teste para reduzir duração. Isso não substitui ouvir as falas no ritmo normal nem executar em WebView Android.

Teste o APK em aparelho real, em modo avião desde a abertura, verificando áudio, multitouch, suspensão/retomada, modo imersivo e áreas próximas das barras do sistema. Uma compilação bem-sucedida não é prova de conforto sensorial ou desempenho em todos os aparelhos.

## Correção da inicialização do CI

A execução 40542808059 falhou na etapa android-actions/setup-android@v3, antes do Gradle; checkout e Java concluíram. A interface pública permite ver o estado das etapas, mas exige autenticação para ler o conteúdo dos logs. O instalador foi removido: o workflow agora usa diretamente o SDK do runner ubuntu-24.04, fixa Python 3.11, confere o checksum do Wrapper versionado e garante chmod +x. Upload e softprops/action-gh-release@v2 usam o mesmo caminho app/build/outputs/apk/debug/*.apk, com permissões contents:write nos jobs. A conclusão da execução nova deve ser verificada no Actions; permissões de workflow não substituem eventuais restrições administrativas do GitHub.
