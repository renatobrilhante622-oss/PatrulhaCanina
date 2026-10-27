# Patrulha Canina - Missões

Jogo Android 2D **offline**, por toque, com seis missões educativas, cenários procedurais e **60 falas sintéticas PT-BR já incluídas**. Sem anúncios, tempo limite ou punição por erro.

**Arquitetura atual: Java 17 + Android Gradle + Canvas HTML5 em WebView local. Não usa Unity no build e não exige licença nem secrets externos.**

## Baixar no celular

Após uma execução bem-sucedida do workflow, baixe [PatrulhaCanina.apk na Release latest](../../releases/latest/download/PatrulhaCanina.apk). O link só existe depois que o build e a publicação terminarem. A instalação lateral pode exigir autorização do Android para o navegador.

Cada push para `main` compila, testa e atualiza a Release `latest`. Pull requests compilam e geram o Artifact **PatrulhaCanina-APK**, sem publicar Release. O upload usa apenas o token automático do próprio GitHub Actions.

## Compilar

Com Java 17 e Android SDK 35: `./gradlew :app:assembleDebug`. Saída: `app/build/outputs/apk/debug/app-debug.apk`. O Gradle Wrapper verifica o checksum oficial da distribuição.

A assinatura de desenvolvimento é pública, incluída em `Tools/debug.keystore`, para permitir atualizar os APKs de teste sem segredo externo. **Não use essa chave para distribuição de produção.**

## Desenvolvimento e testes

- `python3 Tools/sync_android_assets.py` empacota os WAVs locais.
- `python3 Tools/validate_android.py` verifica integridade e configuração offline.
- `npm ci && npx playwright install chromium && npm test` testa as seis missões no navegador.
- `python3 Tools/bootstrap_android.py /tmp/patrulha-android-sdk` instala o SDK oficial verificado em Linux quando necessário.

Veja [Docs/GUIA_ANDROID.md](Docs/GUIA_ANDROID.md). Os arquivos Unity de `Assets/Scripts`, `Packages` e `ProjectSettings` são legado preservado e não participam da compilação Android. Apenas as gravações de `Assets/Resources` são reaproveitadas pelo sincronizador.
