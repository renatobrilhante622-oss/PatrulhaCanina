# Assets 3D e atribuições

Todos os recursos ficam dentro de `app/src/main/assets/`. O jogo não acessa CDN, API, serviço de voz ou loja online durante a execução.

| Recursos | Origem / autores | Licença |
| --- | --- | --- |
| `tree`, `tree-tall`, `house`, `garage` GLB e sua paleta | [Kenney Starter Kit City Builder](https://github.com/KenneyNL/Starter-Kit-City-Builder), revisão `4535092b740b378b700efd9df9e27a631815b84a` | MIT, texto incluído |
| `coin.glb`, paleta específica | [Kenney Starter Kit 3D Platformer](https://github.com/KenneyNL/Starter-Kit-3D-Platformer), revisão `3fa8a04b1c01ab23db43123d4ce814a34c3fc7f0` | MIT |
| `fox.glb` animado | [Khronos Fox](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/Fox), modelo PixelMannen; rig/animação tomkranis; conversão AsoboStudio/scurest | Modelo CC0; rig/conversão CC BY 4.0; atribuição completa incluída |
| `car.glb` | [Khronos ToyCar](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/ToyCar), Guido Odendahl e Eric Chadwick | CC0 1.0 |
| `pet-*.glb`, `palm`, `barn`, `fence`, `rock` | Autoria do projeto, gerados por `Tools/author_models.mjs` | MIT |
| Pelagens, íris, tecido, terreno e pinturas 1024² | Autoria do projeto, `Tools/generate_textures.py` | MIT |
| Filhotes e Ryder articulados | Malhas autorais em `premium-models.js` | Código MIT; nomes/personagens pertencem aos respectivos titulares |
| Miniaturas de animais | Renderizações dos próprios GLBs, `Tools/render_pet_previews.cjs` | MIT |
| Three.js, GLTFLoader, SkeletonUtils, BufferGeometryUtils | Three.js 0.160.1 | MIT, `js/THREE-LICENSE.txt` |

Os avisos dos fornecedores estão em `models/licenses/`. `models/manifest.json` registra origem, licença e SHA256 de cada GLB. Modelos originais exportados usam Three.js/GLTFExporter. O carregador oficial é empacotado por `Tools/bundle_loaders.cjs` usando esbuild, com imports de Three.js direcionados à biblioteca global já existente.

Para recriar assets autorais: `node Tools/author_models.mjs`, `python3 Tools/generate_textures.py` (Pillow), `CHROMIUM_PATH=/caminho/chromium node Tools/render_pet_previews.cjs`. Modelos baixados são versionados; os builds não dependem da disponibilidade das páginas dos fornecedores. Atualizar um GLB exige atualizar seu hash no manifesto e rodar `Tools/validate_assets.py`.

As malhas são uma interpretação estilizada. Não são modelos oficiais licenciados do desenho e não foram extraídas de outro jogo. Os MP3s são síntese neural estilizada, sem reprodução da identidade vocal dos dubladores brasileiros.
