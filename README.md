# Patrulha Canina — Tycoon, Construção & Resgate 3D · 6.0

Jogo Android 3D offline em Three.js/WebGL: base Tycoon, esteira com **50 níveis**, **16 espécies em 5 biomas**, horta, alimentação, renda dos animais, construção em grade e oito veículos com raridades, pinturas, nitro, voo, ímã e modo anfíbio. Os aliados acompanham e ajudam nas **12 missões / 97 objetivos** da campanha.

**306 falas neurais PT-BR** e 12 efeitos/música estão dentro do APK. Menus silenciosos; chamado em sequência: comunicador → briefing do Ryder → “O Ryder tá chamando!” da Skye. Sem voz em loop, anúncios, compras reais ou Game Over.

[Baixar APK](../../releases/latest/download/PatrulhaCanina.apk) · [Guia da edição Tycoon](Docs/GUIA_TYCOON_V6.md) · [Assets e licenças](Docs/ASSETS_3D.md)

```sh
npm ci
npx playwright install chromium
npm test
python3 -m pip install -r Tools/requirements-voices.txt
node Tools/export_campaign.cjs
python3 Tools/generate_voices.py
python3 Tools/validate_android.py
python3 Tools/validate_assets.py
./gradlew --no-daemon :app:assembleDebug
```

Java 17 e Android SDK 35. Saída: `app/build/outputs/apk/debug/app-debug.apk`. O único workflow ativo da raiz publica `PatrulhaCanina.apk` na Release `latest` após os testes e a compilação. Não exige Unity, licença ou segredo externo.

Pacote `com.t4b.patrulhacanina`, `versionCode 6`, `versionName 6.0`. A atualização mantém o save da v5 no aparelho. Android sem permissão de Internet; todos os GLBs, texturas, biblioteca e MP3s são locais. As implementações antigas em `Downloads/PatrulhaCanina` foram preservadas como recebidas e não participam do build da raiz.

Os filhotes/Ryder e props adicionais são modelos autorais estilizados; Kenney/Khronos fornecem assets com atribuição. Vozes neurais estilizadas, sem alegação de dublagem ou modelos oficiais. Assinatura de desenvolvimento estável para instalação/atualização direta.
