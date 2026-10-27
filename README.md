# Patrulha Canina — Edição Console 5.0

Campanha de **12 missões educativas e 97 objetivos**, menus narrados, Pup-Pad com quatro abas, nove regiões, garagem 3D giratória, álbum, biscoitos e save automático local.

A engine WebGL/Three.js, oito filhotes/veículos articulados, física, sombras e os 150 áudios da v4 foram preservados. A v5 acrescenta 141 falas, totalizando **291 MP3s neurais PT-BR**, gerados e validados pelo pipeline antes de publicar.

[Baixar APK publicado](../../releases/latest/download/PatrulhaCanina.apk) · [Guia da edição 5.0](Docs/GUIA_CONSOLE_V5.md)

- `npm ci && npx playwright install chromium && npm test`
- `node Tools/export_campaign.cjs`
- `python3 Tools/generate_voices.py && python3 Tools/validate_android.py`
- `./gradlew --no-daemon :app:assembleDebug`

Android `com.t4b.patrulhacanina`, versionCode 5/versionName 5.0. Funciona offline, sem anúncios, conta, Game Over ou licença Unity. A assinatura incluída é de desenvolvimento; os modelos, a interface e as vozes são estilizados, sem alegação de assets/dublagem oficiais.
