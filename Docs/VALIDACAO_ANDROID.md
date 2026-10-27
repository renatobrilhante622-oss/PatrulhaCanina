# Validação 4.0 — WebGL/Three.js

- Three.js local com licença MIT e SHA-256; sem CDN.
- Testes da simulação 3D: movimento, câmera relativa, pulo, turbo, selva, ordens, animais, fogo, reciclagem, resgate aéreo, neve, ponte e física/gol aprovados.
- Testes Chromium com WebGL/SwiftShader: oito modelos, quatro áreas, analógico, veículo, câmera orbital, teleporte e paisagem. Não é medição de desempenho no GPU Android.
- Build Android real com Java 17/Gradle/SDK 35 executado localmente e no GitHub Actions. APK 4.0.0/versionCode 4 íntegro, com Three.js, 150 falas e dez efeitos/música embarcados, assinatura verificada por apksigner.
- Todos os 150 MP3s neurais foram gerados/estilizados, versionados pelo bot e passaram novamente na validação estrita local. O CI também atualizou as instruções para a versão 3D. O proxy local continua bloqueando a consulta Edge, mas os arquivos completos já estão no repositório.
- Dez efeitos/música MP3 originais foram gerados e versionados. Não são gravações reais de animais, vozes dos atores ou tema oficial.
- Ainda sem teste em aparelho Android e sem garantia de 60 FPS. Compare os resultados finais da execução do CI e teste o APK no celular.

Execução verificada: https://github.com/renatobrilhante622-oss/PatrulhaCanina/actions/runs/40582002629 — geração, testes WebGL, Gradle, assinatura e Artifact aprovados. A publicação da Release é um job separado.
