# Edição Tycoon 6.0 — uso e implementação

## Começar e continuar

Instale o APK da Release `latest` sobre a v5, mantendo o mesmo pacote e assinatura. Não é preciso abrir Unity, extrair ZIP, configurar Inspector ou baixar recursos. A orientação é `sensorLandscape`, em WebView acelerado e modo imersivo. Toque em **Minha Base** para conhecer a economia ou **Modo História** para continuar as 12 missões. Os cartões do telefone permitem jogar qualquer missão.

O progresso fica no `localStorage` da origem virtual estável `https://game.local/`, chave `patrulha.console.v5`. O nome da chave foi mantido para migrar estrelas, biscoitos, figurinhas e opções. O novo campo `empire` guarda moedas, esteira, espécies, refeições restantes, comida, sementes, hortas, construções, peças, aliados e as melhorias de cada veículo. O save acontece nas compras/colheitas/construções, periodicamente, ao pausar e ao sair. Dados inválidos são limitados e armazenamento indisponível é sinalizado. Desinstalar ou limpar os dados do Android remove esse progresso.

## Esteira e animais

A base começa com 180 moedas, comida e sementes. Na esteira iluminada, mova o analógico para correr; o filhote permanece sobre ela. Use habilidade ou pule para sair. Ela rende `4 × 1,12^(nível−1)` moedas por segundo correndo e um biscoito a cada 12 segundos de corrida. O botão **Esteira** melhora do nível 1 ao 50, com materiais Madeira/Ferro/Ouro/Diamante/Neon. Parar o analógico interrompe o ganho de corrida.

A loja oferece 16 espécies:

| Bioma | Animais |
| --- | --- |
| Fazenda | Galinha, vaquinha, ovelha, porquinho, cavalo |
| Selva | Tucano, macaquinho, panda, tigre dourado, dinossauro |
| Neve | Pinguim real, lobo brilhante |
| Oceano | Tartaruga, golfinho |
| Deserto | Leãozinho, dragãozinho |

Raridades Comum/Raro/Épico/Lendário/Mítico têm cores e brilho. A renda varia de 10 a 900 moedas por minuto antes dos bônus. Cada animal consome um alimento para uma refeição de 30 segundos. Sem comida, descansa; não desaparece nem perde progresso. Os habitats do bioma aumentam a renda em 15% por nível e dão espaço para mais animais. Eles passeiam perto do habitat construído, ou no campo central quando ainda não há abrigo do bioma.

Os ovos de 120 moedas do jogo seguem uma sequência fixa por bioma entre comuns, raros e épicos. Não há compras com dinheiro real. O limite inicial é de quatro animais; celeiros, habitats e expansões de cercado aumentam a capacidade. Recompensas especiais das missões chegam mesmo quando o cercado está cheio.

## Horta e alimentação

Em **Horta**, escolha trigo, cenoura, milho ou maçã dourada. Sementes disponíveis são gastas primeiro; sem sementes, pode-se plantar pagando o custo mostrado. Os tempos são 18/25/32/40 segundos de brincadeira e o rendimento básico é 20/35/55/110 alimentos. Colher devolve duas sementes e envia alimento à despensa. **Abastecer cocho** transfere a despensa para o estoque compartilhado dos animais.

As plantas e a renda continuam nos painéis da economia. Menu principal e pausa suspendem a simulação. Fechar o aplicativo não consome comida nem calcula renda fora do jogo. Melhorar a horta acelera crescimento e aumenta a colheita. Com ímã instalado, dirigir a até 12 metros de uma horta pronta colhe automaticamente.

## Construção por toque

Em **Construir**, escolha celeiro, habitat da selva, iglu, aquário, oásis, cercado, horta, canhão de água, rede, catapulta de lama ou rampa. A câmera mostra a base e sua grade de 10 × 8 células de sete metros. Toque no chão 3D para posicionar: raycast, limites, ocupação e saldo são verificados antes da cobrança. A célula indica livre/ocupada. A esteira, o cocho e a horta inicial ficam reservados.

É possível girar em passos de 90°, mover, melhorar até o nível 10 e guardar construções com devolução de 70% do preço inicial. Melhorias de habitat aumentam renda/capacidade; hortas melhoram crescimento/colheita; armadilhas organizam a base periodicamente e dão moedas proporcionais ao nível. Perto de uma armadilha, **Usar habilidade** dispara água/rede/lama sem machucar animais. Rampas têm altura de colisão para manobras.

## Veículos e aliados

A oficina inclui viatura, caminhão de bombeiros, helicóptero, escavadeira, caminhão de reciclagem, hovercraft, jipe e limpa-neve. Cada um tem cinco raridades, seis pinturas UV distintas e melhorias independentes. Raridades aumentam a velocidade em 12% por estágio; três peças dão 40% de desconto na próxima evolução.

**Nitro** amplia o turbo. **Ímã** atrai colecionáveis e colhe hortas próximas. **Anfíbio** evita a redução de velocidade na água e permite flutuar; o hovercraft já possui essa capacidade. Helicóptero e veículos lendários ou Cyber voam. **Pular/Voar** alterna decolagem/pouso; **Subir/Descer** ajusta a altura entre 4 e 24 metros. Os veículos lendários abrem o kit de asas; o helicóptero usa seu rotor.

**Chamar BOTs** ativa aliados Rubble, Chase, Skye e Marshall, excluindo o filhote controlado. Eles seguem, contornam obstáculos simples e aproximam-se do objetivo quando a criança está perto. Após sete segundos ajudando ao alcance do objetivo, podem concluir ações compatíveis: fogo, rochas/blocos/reparo, formas/painéis e transporte de reciclagem/frutas. A criança continua responsável por voo, futebol, corrida, números e demais ações. Não é um planejador de navegação com malha: em construções densas os aliados usam desvio local e se reaproximam quando ficam muito longe.

Missões dão um baú: `450 + 100 × número` moedas na primeira conclusão, três peças e duas sementes douradas; repetições dão 150 moedas, uma peça e uma semente. As missões 3/6/9/12 também entregam panda/pinguim/tigre/dragão na primeira conclusão. As estrelas/biscoitos/figurinhas da campanha continuam funcionando.

## Vozes e gráficos

Menus não narram. Ao iniciar missão, toca o comunicador original sintetizado. Atendendo, aparece Ryder em 3D e toca o briefing completo. A Promise de voz precisa terminar antes da fala **“O Ryder tá chamando!”** de Skye. Só então o botão de partida é habilitado. A saída do Farol conserva sirene e trilha de patinhas. Dica repete quando pedida, sem repetição automática; a mesma fala tem cooldown de 14 segundos, fila limitada e música com ducking suave. Voz, música e efeitos têm volumes separados.

São 306 MP3s neurais PT-BR. `edge-tts` usa vozes disponíveis do serviço e `ffmpeg` aplica tratamento leve. O manifesto registra voz solicitada, voz efetivamente usada, parâmetros e hashes. Não é clonagem dos atores. O efeito de comunicador também é original; não contém áudio extraído do desenho.

27 GLBs locais, filhotes/Ryder suavizados articulados, pelagem/íris/uniformes UV HD, pinturas de oficina, sombras PCFSoft, skybox, água com deformação de ondas e reflexão do céu. Peças estáticas de mesmo material são unidas para reduzir chamadas de desenho. O carregador GLTF oficial compartilha a mesma instância de Three.js. Gráficos leves/equilibrados/altos, resolução limitada e 30/60 FPS podem ser ajustados pelos pais. Não foi medido desempenho em celular físico; o limite de 60 FPS é uma configuração, não garantia de taxa sustentada em qualquer aparelho.

## Verificações executáveis

`npm test` cobre a física anterior, as 12 missões, persistência, economia e dois testes reais em Chromium/WebGL. O teste Tycoon usa toque na grade, compra um animal, planta, melhora a esteira, instala pintura/nitro, voa, chama BOTs e recarrega o save. As Promises reais de voz verificam Ryder antes de Skye. Todas as requisições do teste são para a origem local.

`Tools/validate_assets.py` confere GLB 2.0, hashes, dependências locais, licenças e texturas de 1024². `Tools/validate_android.py` confere todos os MP3s com ffprobe, proveniência/hash, ausência de INTERNET, wrapper, Three.js, versões e configuração Android. O workflow roda essas verificações antes de publicar a Release.
