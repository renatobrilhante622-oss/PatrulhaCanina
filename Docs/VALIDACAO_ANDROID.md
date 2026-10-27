# Validação executada no ambiente de desenvolvimento

- Build Android real com OpenJDK 17, Gradle 8.9 e Android SDK 35: `:app:assembleDebug` — BUILD SUCCESSFUL.
- Assinatura debug verificada por apksigner (v1 e v2).
- APK inspecionado com aapt: com.t4b.patrulhacanina, versão 2.0.0, target SDK 35 e paisagem.
- Integridade ZIP aprovada; DEX, motor JavaScript e 60 WAVs embutidos.
- Manifesto sem permissões, incluindo ausência de INTERNET.
- Seis missões resolvidas por eventos reais de ponteiro no Chromium: testes de acertos, erros gentis, arrastes, pares diferentes, conserto, contagem, biscoito e retorno ao Farol aprovados.
- Testes de áudio usam WAVs reais com reprodução acelerada; não avaliam conforto sensorial.
- npm audit: nenhuma vulnerabilidade reportada nas dependências de teste.

APK local: 12720789 bytes. SHA-256: `91dbc6b7c90c99c5904dd5b2a4b5e5545a49b1dc57a5bcf33facdc4c3962c739`.

O build local não confirma execução do GitHub Actions, publicação de Release ou instalação em aparelho real. Não foram executados testes em emulador Android nem medição de FPS em celular.
