# Validação 4.0 — WebGL/Three.js

- Three.js local com licença MIT e SHA-256; sem CDN.
- Testes da simulação 3D: movimento, câmera relativa, pulo, turbo, selva, ordens, animais, fogo, reciclagem, resgate aéreo, neve, ponte e física/gol aprovados.
- Testes Chromium com WebGL/SwiftShader: oito modelos, quatro áreas, analógico, veículo, câmera orbital, teleporte e paisagem. Não é medição de desempenho no GPU Android.
- Build Android real com Java 17/Gradle/SDK 35 executado localmente; compilação final e verificação de todos os 150 MP3s são repetidas após a geração no CI.
- Primeiros 105 áudios neurais foram estilizados via ffmpeg. Os 45 novos dependem da geração Edge no CI porque o proxy local retorna HTTP 403 ao serviço. O workflow não publica um pacote com áudio incompleto.
- Dez efeitos/música MP3 originais foram gerados e versionados. Não são gravações reais de animais, vozes dos atores ou tema oficial.
- Ainda sem teste em aparelho Android e sem garantia de 60 FPS. Compare os resultados finais da execução do CI e teste o APK no celular.
