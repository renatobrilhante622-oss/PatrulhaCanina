# Verificações executadas — edição 5.0

- Testes v4 de física e exploração preservados.
- As 12 missões completaram seus 97 objetivos nos testes de simulação, com ritual, erros gentis e gols na trave correta.
- Save: estrelas, biscoitos, figurinhas e opções persistem; checkpoint com material carregado é retomado; corrupção e falta de espaço não encerram o jogo.
- Chromium/WebGL: menu, opções preservadas após reload, garagem com preview, nove destinos, movimento, veículo, turbo, câmera e ritual aprovados. A rolagem dos cartões foi validada com eventos de toque reais via CDP; não depende apenas de scroll por mouse.
- Build Android local Java 17/Gradle/SDK 35 executado; a compilação final é repetida com as novas vozes geradas no CI.
- Os 141 novos MP3s foram gerados e versionados pelo CI; o catálogo completo de 291 passou novamente na validação estrita local. Os mesmos 150 MP3s da v4 foram preservados byte a byte (SHA-256).
- Sem testes em aparelho físico nem garantia de FPS em todos os celulares. Os 12 percursos foram validados em simulação, não integralmente por toque em Android.

Revisão final de interface: bf0f5a9. O resultado da publicação dessa revisão deve ser conferido no workflow, separado das verificações locais.
