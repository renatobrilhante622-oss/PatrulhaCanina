# Validação da reformulação 3.0

- Simulação: seis missões completas aprovadas, incluindo ordens, reciclagem, roda do brinquedo, ponte, animais e ausência de penalidade por erro.
- Chromium: joystick com dois toques reais simultâneos, veículo, turbo, gamepad, troca de personagem preservando posição e aviso de paisagem aprovados. Repetido após baixar os MP3s neurais reais.
- Sintaxe JavaScript e workflow (actionlint) verificados.
- Gradle/Java 17: APK de exploração compilado localmente com sucesso, recompilado com os 105 MP3s.
- Geração neural: edge-tts 7.3.1 passou no GitHub Actions e o bot gravou 105 MP3s mais o manifest na main (f81b70d). Todos passaram novamente no validador estrito local (codec, duração e hashes).
- O endpoint ofereceu Antonio, Francisca e Thalita Multilingual, usados com os pitch/rates pedidos. Não ofereceu todos os nomes de vozes originalmente solicitados. Veja a tabela no guia.
- No CI, geração, testes, compilação, assinatura e upload do Artifact passaram. A publicação da Release é uma etapa separada, cujo resultado precisa ser confirmado na execução.
- Não houve teste em aparelho Android nem medição de FPS. O conforto sensorial e a naturalidade devem ser avaliados ouvindo/jogando no celular.
