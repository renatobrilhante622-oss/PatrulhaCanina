# Validação da reformulação 3.0

- Simulação: seis missões completas aprovadas, incluindo ordens, reciclagem, roda do brinquedo, ponte, animais e ausência de penalidade por erro.
- Chromium: joystick com dois toques simultâneos, pulo, veículo, turbo, gamepad, troca de personagem preservando posição e aviso de paisagem aprovados.
- Sintaxe JavaScript e workflow (actionlint) verificados.
- Gradle/Java 17: APK de exploração compilado localmente com sucesso. Este APK local ainda não contém MP3s neurais e não foi publicado como dublagem completa.
- Edge TTS: o proxy local retornou HTTP 403. Zero MP3s neurais gerados/verificados localmente; o roteiro possui 105 falas. A geração e commit dos áudios foram automatizados no CI, com validação obrigatória antes de publicação.
- Não houve teste em aparelho Android nem medição de FPS. A naturalidade/volume das vozes requer audição real depois que os arquivos forem gerados.
