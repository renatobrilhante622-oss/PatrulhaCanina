"""Roteiro de dublagem original para exploração, com explicações curtas em PT-BR."""
NAMES=['Ryder','Chase','Marshall','Skye','Rocky','Rubble','Zuma','Tracker','Everest']
PROFILES={
 'Ryder':('pt-BR-AntonioNeural','+15Hz','+5%','Male'),
 'Chase':('pt-BR-FabioNeural','+20Hz','+8%','Male'),
 'Marshall':('pt-BR-JulioNeural','+25Hz','+5%','Male'),
 'Skye':('pt-BR-FranciscaNeural','+30Hz','+8%','Female'),
 'Rocky':('pt-BR-RodrigoNeural','+22Hz','+6%','Male'),
 'Rubble':('pt-BR-HumbertoNeural','+18Hz','+4%','Male'),
 'Zuma':('pt-BR-ThalitaNeural','+15Hz','+6%','Female'),
 'Tracker':('pt-BR-AntonioNeural','+24Hz','+5%','Male'),
 'Everest':('pt-BR-FranciscaNeural','+22Hz','+4%','Female')}
def catalog():
 entries=[]
 def add(id,speaker,text):entries.append(dict(id=id,speaker=speaker,text=text,audio='/audio/'+id+'.mp3'))
 instructions=[
  'Use a alavanca à esquerda para passear. A seta no chão mostra uma brincadeira. O botão A usa sua ferramenta.',
  'Vamos cuidar do trânsito e ajudar os gatinhos. Aproxime-se da placa e aperte A.',
  'Vamos apagar dez chamas, na ordem. Aproxime-se e aponte para a chama. Depois aperte A para usar água.',
  'Vamos passear no parque. Encontre os balões com as vogais. Aproxime-se e aperte A.',
  'Vamos limpar a praia. Pegue um material com A e leve até a lixeira da mesma cor.',
  'Vamos retirar pedras, construir uma ponte com formas e dar comida aos animais. Tudo com calma!',
  'Vamos ajudar os animais marinhos. Encontre a tartaruga, depois o polvo e a estrela do mar.',
  'Vamos explorar a selva! Encontre os ossinhos na ordem dos números e chegue perto dos animais com a mochila.',
  'Eu sou a Everest! Vamos limpar os montinhos de neve e cuidar dos nossos amigos.'
 ]
 mottos=['Nenhum trabalho é tão grande, nenhum filhote é tão pequeno!','O Chase está no caso!','Estou pronto para um resgate!','Esse filhote vai voar!','Não perca, reutilize!','Rubble a toda!','Vamos mergulhar!','Estou todo ouvidos!','Gelo ou neve, estou pronta!']
 for i,name in enumerate(NAMES):
  add(name+'_call',name,f'Olá! Eu sou {name}. Que bom passear com você na Baía da Aventura!')
  add(name+'_motto',name,mottos[i]);add(name+'_instruction',name,instructions[i])
  add(name+'_praise',name,'Muito bem! Você está aprendendo e ajudando nossos amigos.')
  add(name+'_hint',name,'Tudo bem. Podemos tentar outra vez, sem pressa. A seta mostra o caminho.')
  add(name+'_reward',name,'Missão cumprida! Que tal dar um biscoito ao nosso amigo?')
  add(name+'_vehicle',name,'Vamos passear no meu veículo! Use a alavanca para dirigir.')
  add(name+'_walk',name,'Agora vamos caminhar e explorar bem de pertinho.')
 for n in range(1,11):add('Marshall_step'+str(n),'Marshall',f'Agora vamos apagar a chama com o número {n}. Aponte a água e aperte A.')
 for color in ['azul','vermelha','amarela','verde']:
  add('flower_'+color,'Marshall',f'Olha que linda! Nasceu uma flor {color}. As plantas precisam de água e carinho.')
 for letter,words in [('A','Amor e Avião'),('E','Estrela e Escola'),('I','Ilha e Imaginação'),('O','Ovelha e Olho'),('U','Uva e Universo')]:add('Skye_'+letter,'Skye',f'{letter} de {words}! Vamos encontrar essa vogal no parque.')
 for material,color,explanation in [('papel','azul','O papel pode virar um caderno novo.'),('plastico','vermelha','Uma garrafa de plástico pode ganhar uma nova utilidade.'),('metal','amarela','Uma latinha é feita de metal e pode ser reciclada.'),('vidro','verde','O vidro pode ser reciclado. Deixe objetos quebrados para um adulto.')]:
  add('Rocky_'+material,'Rocky',f'Lixeira {color}. {explanation}')
 for name,text in [
  ('Chase_red','Vermelho significa pare. Vamos esperar com calma.'),('Chase_yellow','Amarelo significa atenção. Vamos observar.'),('Chase_green','Verde significa siga. Agora podemos atravessar.'),
  ('Chase_circle','Círculo! Ele é redondinho, sem pontinhas.'),('Chase_square','Quadrado! Ele tem quatro lados iguais.'),('Chase_triangle','Triângulo! Vamos contar as três pontinhas.'),('Chase_star','Estrela! Suas pontinhas parecem brilhar.'),
  ('Chase_treasure','Encontramos o baú! Obrigado por seguir as pegadas comigo.'),('Rocky_repair','Agora conserte o carrinho. Aproxime a roda do brinquedo e aperte A.'),
  ('Rubble_bridge','Vamos construir a ponte. Pegue uma forma e leve até o encaixe igual.'),('Rubble_next','Escolha a maior pedra que ainda está no caminho.'),
  ('Rubble_cow','A vaquinha faz mu! Ela gosta de capim. Vamos dar comida com carinho.'),('Rubble_pig','O porquinho faz oinc, oinc! Ele está feliz por receber sua ajuda.'),('Rubble_sheep','A ovelhinha faz bé! Vamos cuidar dela com carinho.'),
  ('Zuma_turtle','Uma tartaruga! Ela tem um casco que protege seu corpo. Vamos ajudar a tartaruga a voltar ao mar.'),('Zuma_octopus','Dois animais ajudados! O polvo tem oito braços e vive no mar.'),('Zuma_starfish','Três animais ajudados! Uma estrela do mar tem um formato muito especial.'),
  ('Ryder_slide','Iupi! Vamos descer pelo escorregador. Que passeio divertido!'),('Ryder_food','Nosso amigo recebeu um biscoito. Obrigado pelo carinho!'),('Ryder_near','Chegue um pouquinho mais perto e aperte A. A seta ajuda você.'),
  ('Ryder_switch','Escolha um amigo. Você continua no mesmo lugar do mapa.'),('Ryder_jump','Um pulinho alegre! Vamos brincar sem pressa.'),('Ryder_map','A estrela do radar mostra a próxima brincadeira. O farol fica no centro.'),
  ('Ryder_finish','Você conheceu todas as brincadeiras! Podemos continuar passeando e cuidando da Baía.'),('Rocky_full','Você já está levando um material. Vamos primeiro até a lixeira da mesma cor.'),('Ryder_star','Uma estrela do saber! Você encontrou uma surpresa pelo caminho.')]:add(name,name.split('_')[0],text)
 for n in range(1,11):
  add('Ryder_goal'+str(n),'Ryder',f'Goooool! Gol número {n}! Que chute legal! Vamos chutar a bola '+['azul','vermelha','amarela'][n%3]+' agora!')
  add('Tracker_bone'+str(n),'Tracker',f'Ossinho número {n}! Muito bem! Vamos explorar mais um pouquinho.')
 for animal,text in [('monkey','Um macaquinho! Ele gosta de subir nas árvores. Vamos cuidar da floresta.'),('toucan','Um tucano! Olhe o bico amarelo e as penas escuras. Que ave bonita!'),('frog','Um sapinho verde! Ele pula e gosta de lugares úmidos. Você consegue dar um pulinho?')]:add('Tracker_'+animal,'Tracker',text)
 add('Ryder_football','Ryder','Vamos brincar de futebol! Aproxime-se da bola e aperte o botão da mochila para chutar. Não tem pressa para fazer gol!')
 add('Ryder_race','Ryder','Vamos dirigir no circuito! Use o analógico, passe pelos aceleradores e encontre círculos, quadrados, triângulos e estrelas!')
 for area,text in [('selva','Chegamos à selva tropical. Vamos encontrar animais e ossinhos numerados!'),('pista','Bem-vindo ao circuito da Baía! Escolha seu veículo e vamos passear na pista!'),('futebol','Chegamos ao estádio! A bola está no meio do campo. Vamos chutar e contar os gols!'),('farol','Voltamos ao Farol! Aqui estão nossos amigos e as missões de resgate.')]:add('Ryder_area_'+area,'Ryder',text)
 return entries
