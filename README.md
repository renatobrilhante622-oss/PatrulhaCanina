# Patrulha Canina — Aventura 3D

Jogo Android offline em terceira pessoa, com Three.js/WebGL local, sombras, oito filhotes articulados, veículos e quatro áreas conectadas: Selva, Grand Prix, Estádio e Farol/Cidade.

Analógico virtual, câmera orbital, gamepad, pulo/turbo, ferramentas, teleporte e futebol com física, goleiro e contagem de gols. Sem anúncios, Game Over ou limite de tempo.

A versão 4.0 usa Java 17 + Android Gradle e Three.js 0.160.1 MIT embarcado. O catálogo contém 150 falas neurais PT-BR; os arquivos são validados e versionados pelo CI. Os efeitos e a música são originais sintetizados. Os modelos são procedurais estilizados e as vozes não são a dublagem oficial nem imitações idênticas dos atores.

[Guia completo](Docs/GUIA_ANDROID.md) · [Baixar APK publicado](../../releases/latest/download/PatrulhaCanina.apk)

`npm ci && npx playwright install chromium && npm test`

`./gradlew --no-daemon :app:assembleDebug`

Build automático na main, sem Unity ou secrets externos. A assinatura incluída é pública e de desenvolvimento. A Release só é atualizada depois da geração completa das vozes, testes e compilação.
