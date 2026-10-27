# Edição Console 5.0

## Base preservada

A versão 5.0 estende a engine Three.js offline da v4.0. Permanecem os oito filhotes/veículos articulados, Ryder, quatro áreas originais, câmera orbital, sombras, minimapa 3D, joystick/gamepad, física de bola, efeitos e **150 MP3s originais da v4**. Não foi trocado o motor nem adotada uma licença de Unity.

A expansão acrescenta Cidade como destino próprio, Praia/Píer, Fazenda da Yumi, Pet Shop da Katie e Montanha do Jake: nove destinos no total. Casas, pomar, personagens, neve, banheira, escova, secador e portão são malhas 3D locais, sem download em execução.

## Menu e Pup-Pad

A câmera do menu orbita o Farol enquanto os filhotes acenam. Botões narrados abrem história, exploração livre, Pup-Pad, garagem e opções dos pais. O Pup-Pad tem uma interface original inspirada no tablet da série, com quatro abas:

- Missões: 12 cartões, filhote principal, aprendizado e melhor resultado em estrelas. Qualquer missão pode ser escolhida, sem bloqueio punitivo.
- Mapa: visão 3D superior do mundo e marcadores clicáveis, além dos nomes dos nove destinos. Viajar não apaga o progresso da missão.
- Garagem: preview WebGL real, rotação automática e por arraste, filhote/veículo alternáveis. Escolha toca latido estilizado e bordão neural.
- Biscoitos e álbum: filhote 3D mastiga e pula ao receber biscoito; 12 figurinhas brilhantes são desbloqueadas nas missões.

A história retoma o checkpoint salvo ou inicia a primeira missão ainda não concluída. O ritual é: chamado no Pup-Pad, briefing de Ryder, saída do Farol com veículo/sirene, exploração guiada por patinhas e conclusão com confetes/biscoitos. Os botões permitem ouvir novamente e continuar no ritmo da criança.

## As 12 missões e 97 objetivos

| Missão | Objetivos jogáveis |
| --- | --- |
| 1. Marshall — Prefeitura | Dez chamas, de 1 a 10, apagadas com água na ordem. |
| 2. Chase — Trânsito | Buscar e posicionar quatro formas; operar vermelho, amarelo e verde. |
| 3. Skye — Vogais | Voar pelos anéis A/E/I/O/U e resgatar a Galinheta no telhado. |
| 4. Rocky — Reciclagem | Quatro materiais nas lixeiras corretas e reparo visível da ponte. |
| 5. Rubble — Fazenda | Retirar quatro pedras contando, transportar e empilhar grande/médio/pequeno. |
| 6. Zuma — Tartarugas | Navegar, resgatar grupos de 1/2/3 e ouvir somas progressivas até seis. |
| 7. Tracker — Mistério | Cinco pegadas, três animais por pistas sonoras e três painéis para abrir o portão. |
| 8. Everest — Jake | Limpar placas de 1 a 5 com limpa-neve e ajudar dois pinguins. |
| 9. Katie — Higiene | Espuma, enxágue, secador e escova animados, na ordem. |
| 10. Yumi — Pomar | Duas maçãs, três bananas e duas uvas, transportadas às cestas de cor/quantidade. |
| 11. Copa Canina | Três gols nas traves de cor/número pedidos, preservando a física e o goleiro. |
| 12. Grand Prix | Oito portões de formas/cores dirigindo e um troféu no pódio. |

Mochila interage perto do objeto; analógico controla deslocamento; voo exige helicóptero e resgates marítimos exigem hovercraft. As patinhas indicam o próximo objetivo e desviam dos obstáculos registrados. Objetos carregados aparecem no mundo. A garagem permite trocar de filhote; se a missão exigir outro amigo, a dica fala quem chamar.

Não há cronômetro, Game Over ou perda de progresso por erro. Gol em outra trave continua sendo gol no contador livre, mas a missão explica a trave desejada e aguarda a tentativa correta. Na conclusão, a missão concede três estrelas, três biscoitos na primeira vez e uma figurinha; repetições preservam as estrelas e dão mais um biscoito.

## Salvamento e opções

DomStorage está habilitado no WebView. ConsoleSave usa localStorage na origem estável https://game.local, chave `patrulha.console.v5`. Guarda estrelas das 12 missões, biscoitos, figurinhas, contadores, checkpoint da missão (incluindo material carregado) e opções. A gravação ocorre a cada objetivo, recompensa, alimentação e alteração de opção; contadores livres são atualizados periodicamente e ao pausar/sair da página.

Os pais podem ajustar separadamente voz/música/SFX, joystick de 80% a 150%, limite de 30 ou 60 quadros e qualidade leve/equilibrada/alta. O modo leve reduz resolução e desliga sombras; alto mantém sombras completas. O limite é uma meta, não garantia de desempenho em todo aparelho. A música continua com ducking durante falas.

Se o armazenamento estiver indisponível ou cheio, o jogo continua na sessão e informa isso. Dados corrompidos são tratados com valores seguros. Limpar dados do aplicativo ou desinstalá-lo apaga o save local; não existe nuvem, conta ou coleta de dados pessoais.

## Organização do código

- `save.js`: formato versionado, validação, persistência e opções.
- `campaign.js`: definições únicas das 12 missões e máquina de estados do ritual/objetivos.
- `console.js`: menus, tablet, cartões, opções e álbum.
- `world.js`: física v4 preservada e pontos de integração da campanha.
- `game.js`: cena, novas regiões, preview 3D, patinhas e feedback visual.
- `audio.js`: mixer com barramentos de voz, música e efeitos independentes.
- `Tools/export_campaign.cjs`: exporta as definições para `campaign-catalog.json`, fonte das novas gravações, evitando texto de missão divergente.

O roteiro total passa a **291 falas**: as 150 da v4 e 141 novas para menus/missões/destinos. A geração usa edge-tts/ffmpeg existentes, com manifesto de voz e hashes. São vozes neurais estilizadas, não dublagem oficial ou identidade dos atores. A nova Release só é publicada quando todas estiverem geradas e validadas; a geração remota ocorre antes de empacotar, e o jogo instalado permanece offline.

## Build e testes

Versão Android: `versionCode 5`, `versionName "5.0"`, pacote `com.t4b.patrulhacanina`, mesma chave pública de desenvolvimento da v4 para atualização por instalação do APK. Não é assinatura privada de produção.

Comandos:

1. `node Tools/export_campaign.cjs`
2. `python3 Tools/generate_voices.py`
3. `python3 Tools/validate_android.py`
4. `npm ci && npx playwright install chromium && npm test`
5. `./gradlew --no-daemon :app:assembleDebug`

O workflow da main exporta a campanha, gera e versiona novos MP3s, valida, testa e publica `latest`. Não exige licença Unity nem secret externo. A suíte preserva os testes de física v4, resolve as 12 missões/97 objetivos em simulação e testa os menus/WebGL, opções após recarga, garagem, mapa e ritual por interação real no Chromium. Também exercita save corrompido, armazenamento cheio, reentrada com item carregado e ausência de punição.

A resolução de todas as missões em simulação não equivale a 12 percursos completos por toque em um aparelho Android. A compatibilidade sensorial, áudio no volume normal, gamepads e desempenho térmico precisam ser avaliados em celular real. O guia da v4 continua em GUIA_ANDROID.md para detalhes da engine preservada.
