#!/usr/bin/env python3
"""Texturas UV originais 1024²; geração reprodutível, sem imagens da série."""
from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path
import random, math
out=Path(__file__).resolve().parents[1]/'app/src/main/assets/textures';out.mkdir(exist_ok=True)
fur=['#e1b992','#bb8651','#faf8ed','#d5ad7f','#999e91','#c99f65','#76533c','#bda67c','#96abb9']
for index,color in enumerate(fur):
 r=random.Random(index+24);image=Image.new('RGB',(1024,1024),color);d=ImageDraw.Draw(image)
 for _ in range(9500):
  x=r.randrange(1024);y=r.randrange(1024)
  d.line((x,y,x+r.randrange(-3,4),y+r.randrange(2,8)),fill=(255,250,234),width=1)
 if index==2:
  for _ in range(42):
   x=r.randrange(1024);y=r.randrange(1024);rx=r.randrange(12,42);ry=r.randrange(10,35)
   d.ellipse((x-rx,y-ry,x+rx,y+ry),fill='#393c42')
 image=image.filter(ImageFilter.GaussianBlur(.45));image.save(out/f'fur-{index}.png',optimize=True)
 # Tecido técnico com costuras discretas e acabamento acetinado.
 uniform=Image.new('RGB',(1024,1024),['#d63343','#1555b8','#e43e33','#e3519d','#338b56','#edbb1b','#f58222','#718a42','#44a5be'][index]);ud=ImageDraw.Draw(uniform)
 for y in range(0,1024,6):ud.line((0,y,1024,y),fill=(100,100,110),width=1)
 for x in (24,1000):
  for y in range(8,1024,16):ud.line((x,y,x,y+7),fill='#f5ecce',width=3)
 uniform.save(out/f'uniform-{index}.png',optimize=True)
# Íris HD compartilhada: fibras radiais e reflexos, aplicada a discos UV nos olhos.
eye=Image.new('RGBA',(1024,1024),(0,0,0,0));d=ImageDraw.Draw(eye);d.ellipse((6,6,1018,1018),fill='#34231d')
for i in range(420):
 a=i*math.tau/420;r=random.Random(i);radius=r.randrange(270,425);d.line((512+math.cos(a)*210,512+math.sin(a)*210,512+math.cos(a)*radius,512+math.sin(a)*radius),fill=(100+r.randrange(55),64+r.randrange(30),25),width=4)
d.ellipse((280,280,744,744),fill='#101b29');d.ellipse((205,125,450,370),fill='white');d.ellipse((675,635,790,750),fill='#c8ebff');eye.save(out/'iris.png',optimize=True)
for name,base in [('grass',(69,132,69)),('sand',(214,187,135)),('stone',(112,127,137))]:
 image=Image.new('RGB',(1024,1024),base);d=ImageDraw.Draw(image);r=random.Random(1)
 for _ in range(30000):
  x,y=r.randrange(1024),r.randrange(1024);delta=r.randint(-18,18);c=tuple(max(0,min(255,v+delta)) for v in base);d.line((x,y,x+r.randint(-2,2),y+r.randint(1,8)),fill=c)
 image.save(out/(name+'.png'),optimize=True)
print('23 texturas UV HD originais geradas.')
# Pinturas 1024² distintas para a oficina.
for name in ['Neon','Camuflado','Fogo','Ouro','Galaxia']:
 image=Image.new('RGB',(1024,1024),'#142537');d=ImageDraw.Draw(image);r=random.Random(83)
 if name=='Camuflado':
  for _ in range(180):
   x,y=r.randrange(-50,1070),r.randrange(-50,1070);points=[(x+r.randint(-110,110),y+r.randint(-65,65)) for _ in range(7)];d.polygon(points,fill=r.choice(['#8b9b68','#3a564b','#a9a479','#223d37']))
 if name=='Neon':
  for i in range(24):
   x,y=r.randrange(1024),r.randrange(1024);d.line((x,y,x+100,y,x+100,y+100),fill='#39e6cf',width=8);d.ellipse((x-6,y-6,x+6,y+6),fill='#b7fff0')
 if name=='Ouro':
  for y in range(1024):
   value=int(180+35*math.sin(y/1024*math.pi));d.line((0,y,1024,y),fill=(min(255,value+30),value,75))
  for _ in range(5000):
   x,y=r.randrange(1024),r.randrange(1024);d.line((x,y,x+50,y),fill=r.choice(['#dec777','#dab34e','#f1d98d']),width=1)
 if name=='Fogo':
  image=Image.new('RGB',(1024,1024),'#25202c');d=ImageDraw.Draw(image)
  for i in range(12):
   x=i*95-20;d.polygon([(x,1024),(x-20,800),(x+30,590),(x+20,380),(x+100,690),(x+140,1024)],fill='#dc4524');d.polygon([(x+25,1024),(x+30,800),(x+45,660),(x+90,1024)],fill='#f9ad42')
 if name=='Galaxia':
  for _ in range(65):
   x,y=r.randrange(1024),r.randrange(1024);rad=r.randrange(60,180);d.ellipse((x-rad,y-rad,x+rad,y+rad),fill=r.choice(['#282a59','#343264','#4c386e','#3b516a']))
  image=image.filter(ImageFilter.GaussianBlur(30));d=ImageDraw.Draw(image)
  for _ in range(700):
   x,y=r.randrange(1024),r.randrange(1024);rad=r.choice([1,1,2,3]);d.ellipse((x-rad,y-rad,x+rad,y+rad),fill='#e0e4ff')
 image.save(out/('skin-'+name.lower()+'.png'),optimize=True)
