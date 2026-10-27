# Patrulha Canina — Baía da Aventura

Exploração Android 2D top-down em um mundo de 3200 × 2400: analógico virtual, gamepad Bluetooth, veículos, ferramentas, seis zonas educativas, radar e recompensas sem punição. Tudo funciona offline depois de empacotado.

Versão 3.0.0: Java 17 + Android Gradle + Canvas/WebView. Sem Unity no build, anúncios ou permissão de Internet. Inclui 105 MP3s neurais PT-BR reais, gerados com edge-tts 7.3.1 e já versionados em app/src/main/assets/audio. O manifest registra as três vozes-base disponíveis e as variações de pitch/velocidade dos sete personagens. O CI verifica todos antes de publicar.

[Guia de controles, missões, voz e build](Docs/GUIA_ANDROID.md).

- Testes: `npm ci && npx playwright install chromium && npm test`
- Build: `./gradlew :app:assembleDebug`
- Voz neural: `python3 -m pip install -r Tools/requirements-voices.txt && python3 Tools/generate_voices.py`
- Verificação estrita: `python3 Tools/validate_android.py`

Cada push na main executa o CI. Se a geração neural e as verificações passarem, o bot versiona os MP3s e a Release latest recebe o APK. A assinatura incluída é pública e de desenvolvimento; não serve para distribuição de produção.

Os scripts Unity e as gravações antigas em Assets são históricos e não participam do novo jogo Android.
