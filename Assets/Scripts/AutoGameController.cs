using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;
using U = PatrulhaCanina.ProceduralWorldBuilder;

namespace PatrulhaCanina
{
    // Controlador das seis experiências autônomas; não exige referências de Inspector.
    public sealed class AutoGameController : MonoBehaviour
    {
        private Transform canvas;
        private RectTransform screen, content;
        private Text caption;
        private Image captionIcon;
        private ProceduralWorldBuilder world;
        private PupData[] pups;
        private int pupIndex, progress, cookieCount;
        private bool busy;
        private readonly string[] names = {"Ryder","Chase","Marshall","Skye","Rocky","Rubble","Zuma"};
        private readonly List<Action> cancelDrags = new List<Action>();
        private VoiceManager Voice => VoiceManager.Instance;
        private Color Theme => U.Colors[pupIndex];

        public void Initialize(Transform parent, ProceduralWorldBuilder builder)
        {
            canvas = parent; world = builder;
            pups = new PupData[names.Length];
            for(int i=0;i<pups.Length;i++)
            {
                pups[i] = Resources.Load<PupData>("Pups/"+names[i]);
                if(pups[i] == null) pups[i] = CreatePup(i);
            }
            VoiceSynthesizer.OnCaption += ShowCaption;
            Hub();
        }
        public static PupData CreatePup(int index)
        {
            string name = ((PupName)index).ToString();
            PupData data = ScriptableObject.CreateInstance<PupData>();
            data.pupName = (PupName)index; data.themeColor = U.Colors[index];
            data.characterSprite = U.Shape("head"); data.badgeSprite = U.Shape("star"); data.vehicleSprite = U.Shape("round");
            data.initialCalls = new[]{Resources.Load<AudioClip>("Audio/Voices/"+name+"_call")};
            data.correctPraise = new[]{Resources.Load<AudioClip>("Audio/Voices/"+name+"_praise")};
            data.gentleHints = new[]{Resources.Load<AudioClip>("Audio/Voices/"+name+"_hint")};
            data.cookieRewards = new[]{Resources.Load<AudioClip>("Audio/Voices/"+name+"_reward")};
            return data;
        }
        private void ShowCaption(string text, Color color)
        {
            if(caption == null) return;
            caption.text = text; captionIcon.color = color;
        }
        private void NewScreen(int terrain, string title)
        {
            StopAllCoroutines();
            foreach(Action cancel in cancelDrags) cancel();
            cancelDrags.Clear(); Voice.StopVoices(); busy = false;
            if(screen != null) { screen.gameObject.SetActive(false); Destroy(screen.gameObject); }
            screen = U.Rect(canvas,"Tela",Vector2.zero,new Vector2(1920,1080));
            // O CanvasScaler preserva a área lógica em diferentes proporções de tela.
            screen.anchorMin = screen.anchorMax = new Vector2(.5f,.5f);
            screen.pivot = new Vector2(.5f,.5f);
            world.Build(screen,terrain);
            U.Label(screen,title,new Vector2(920,985),new Vector2(1150,85),56);
            U.Button(screen,"Farol",new Vector2(135,980),new Vector2(200,90),U.Colors[0],Hub);
            U.Button(screen,"Pup-Pad\nOuvir",new Vector2(1750,975),new Vector2(230,125),U.Colors[1],Voice.RepeatLastInstruction);
            Button soundButton=null;
            soundButton=U.Button(screen,AudioListener.volume>0?"Som ligado":"Som desligado",new Vector2(1750,820),new Vector2(250,90),U.Colors[1],()=>
            {
                AudioListener.volume=AudioListener.volume>0?0:1;
                soundButton.GetComponentInChildren<Text>().text=AudioListener.volume>0?"Som ligado":"Som desligado";
            });
            content = U.Rect(screen,"Objetos da brincadeira",new Vector2(960,540),new Vector2(1920,1080));
            U.Art(screen,"round",new Vector2(960,100),new Vector2(1760,150),new Color(1,1,1,.95f));
            captionIcon = U.Art(screen,"star",new Vector2(155,100),Vector2.one*65,Theme);
            caption = U.Label(screen,"Vamos brincar com calma!",new Vector2(1010,100),new Vector2(1480,130),36);
        }
        public void Hub()
        {
            pupIndex = 0; NewScreen(0,"Baía da Aventura");
            U.Label(content,"Escolha um amigo para brincar",new Vector2(960,450),new Vector2(1600,90),48);
            for(int i=0;i<7;i++)
            {
                int index = i; Vector2 p = new Vector2(210+i*250,310);
                U.Button(content,names[i],p,new Vector2(220,100),U.Colors[i],()=>Select(index));
                U.Portrait(content,i,p+new Vector2(0,150),105);
            }
            U.Label(content,"Seis brincadeiras • Sem pressa",new Vector2(960,810),new Vector2(1000,70),32);
            Voice.SpeakLine("Ryder_instruction",Theme,true);
        }
        private void Select(int index)
        {
            if(index==0) { Voice.StopVoices(); Voice.SpeakLine("Ryder_call",U.Colors[0]); Voice.SpeakLine("Ryder_instruction",U.Colors[0],true); return; }
            pupIndex = index;
            NewScreen(0,"Chamado no Farol");
            U.Portrait(content,index,new Vector2(960,475),210);
            U.Button(content,"Vamos com "+names[index],new Vector2(960,275),new Vector2(700,110),Theme,()=>StartMission(index));
            Voice.SpeakLine(names[index]+"_call",Theme,true);
        }
        private void StartMission(int index)
        {
            pupIndex=index; progress=0;
            int[] terrain = {0,2,1,4,3,5,6};
            string[] titles = {"Farol","Formas com Chase","Cores e números com Marshall","Vogais com Skye","Reciclagem com Rocky","Tamanhos com Rubble","Memória com Zuma"};
            NewScreen(terrain[index],titles[index]);
            switch(index)
            {
                case 1: Shapes(); break;
                case 2: Fire(); break;
                case 3: Vowels(); break;
                case 4: Recycle(); break;
                case 5: Blocks(); break;
                case 6: Memory(); break;
            }
            busy=true; StartCoroutine(Introduction());
        }
        private IEnumerator Wait(VoiceManager.VoiceTicket ticket)
        { while(!ticket.IsFinished) yield return null; }
        private IEnumerator Introduction()
        {
            yield return Wait(Voice.SpeakLine(names[pupIndex]+"_instruction",Theme,true));
            if(pupIndex==2) yield return Wait(Voice.SpeakLine("Marshall_step1",Theme,true));
            if(pupIndex==3) yield return Wait(Voice.SpeakLine("Skye_A",Theme,true));
            busy=false;
        }
        private void Hint()
        {
            if(!Voice.IsVoiceBusy) Voice.SpeakLine(names[pupIndex]+"_hint",Theme);
        }
        private void Correct(int total, string next = null)
        {
            progress++; busy=true; StartCoroutine(Praise(total,next));
        }
        private IEnumerator Praise(int total,string next)
        {
            yield return Wait(Voice.SpeakLine(names[pupIndex]+"_praise",Theme));
            if(progress>=total) { Reward(); yield break; }
            if(next!=null) yield return Wait(Voice.SpeakLine(next,Theme,true));
            busy=false;
        }
        private void Reward()
        {
            NewScreen(0,"Obrigado por ajudar!");
            U.Portrait(content,pupIndex,new Vector2(960,620),240);
            Button cookie = null;
            cookie = U.Button(content,"Dar biscoito",new Vector2(960,365),new Vector2(520,140),new Color(.65f,.4f,.17f),()=>
            {
                cookie.interactable=false; cookieCount++;
                U.Label(content,"Biscoito recebido com carinho!",new Vector2(960,250),new Vector2(1200,80),45);
                Voice.SpeakLine(names[pupIndex]+"_reward",Theme);
            });
            U.Button(content,"Brincar de novo",new Vector2(380,270),new Vector2(470,100),Theme,()=>StartMission(pupIndex));
            U.Button(content,"Escolher amigo",new Vector2(1540,270),new Vector2(470,100),U.Colors[0],Hub);
            Voice.SpeakLine(names[pupIndex]+"_praise",Theme,true);
        }
        private void Fire()
        {
            for(int i=0;i<5;i++)
            {
                int order=i;
                Button button=null;
                button=U.Button(content,(i+1).ToString(),new Vector2(380+i*290,440),new Vector2(170,240),U.Colors[i+1],()=>
                {
                    if(busy) return;
                    if(order!=progress) { Hint(); return; }
                    Vector2 point=button.GetComponent<RectTransform>().anchoredPosition;
                    button.gameObject.SetActive(false); StartCoroutine(Water(point));
                    Correct(5,order<4 ? "Marshall_step"+(order+2) : null);
                },"flame");
                button.gameObject.AddComponent<GentleMotion>().Configure(5,.7f,i);
            }
        }
        private IEnumerator Water(Vector2 point)
        {
            var drops=new List<RectTransform>();
            for(int i=0;i<12;i++) drops.Add(U.Art(content,"circle",point+new Vector2((i%4-1.5f)*25,100+i*10),Vector2.one*18,new Color(.6f,.9f,1)).rectTransform);
            float t=0;
            while(t<.65f)
            { t+=Time.unscaledDeltaTime; foreach(var drop in drops) if(drop!=null) drop.anchoredPosition+=Vector2.down*260*Time.unscaledDeltaTime; yield return null; }
            foreach(var drop in drops) if(drop!=null) Destroy(drop.gameObject);
        }
        private void Shapes()
        {
            string[] shapes={"circle","square","triangle","star"};
            for(int i=0;i<4;i++)
            {
                int index=i;
                Image target=U.Art(content,shapes[i],new Vector2(400+i*360,630),Vector2.one*180,new Color(.18f,.26f,.34f));
                Image piece=U.Art(content,shapes[i],new Vector2(400+(3-i)*360,310),Vector2.one*160,U.Colors[1]);
                bool placed=false;
                Drag(piece,()=>!placed,p=>
                {
                    if(!Hit(target.rectTransform,p)) return false;
                    placed=true; piece.rectTransform.position=target.rectTransform.position;
                    Correct(4); return true;
                });
                string[] labels={"Círculo","Quadrado","Triângulo","Estrela"};
                U.Label(content,labels[index],new Vector2(400+i*360,775),new Vector2(300,55),30);
            }
        }
        private static bool Hit(RectTransform target,PointerEventData p)
        { return RectTransformUtility.RectangleContainsScreenPoint(target,p.position,p.pressEventCamera); }
        private void Drag(Image image,Func<bool> enabled,Func<PointerEventData,bool> drop)
        {
            image.raycastTarget=true;
            RectTransform rect=image.rectTransform;
            RectTransform plane=rect.parent as RectTransform;
            int? pointer=null; Vector3 home=Vector3.zero,offset=Vector3.zero;
            Action cancel=()=> { if(pointer.HasValue && rect!=null) rect.position=home; pointer=null; };
            cancelDrags.Add(cancel);
            EventTrigger trigger=image.gameObject.AddComponent<EventTrigger>();
            Add(trigger,EventTriggerType.BeginDrag,p=>
            {
                if(busy || !enabled() || pointer.HasValue) return;
                if(!RectTransformUtility.ScreenPointToWorldPointInRectangle(plane,p.position,p.pressEventCamera,out Vector3 worldPoint)) return;
                pointer=p.pointerId; home=rect.position; offset=home-worldPoint;
            });
            Add(trigger,EventTriggerType.Drag,p=>
            {
                if(pointer!=p.pointerId || busy) return;
                if(RectTransformUtility.ScreenPointToWorldPointInRectangle(plane,p.position,p.pressEventCamera,out Vector3 worldPoint)) rect.position=worldPoint+offset;
            });
            Add(trigger,EventTriggerType.EndDrag,p=>
            {
                if(pointer!=p.pointerId) return;
                bool accepted=!busy && drop(p);
                if(!accepted) { rect.position=home; if(!busy) Hint(); }
                pointer=null;
            });
        }
        private static void Add(EventTrigger trigger,EventTriggerType type,Action<PointerEventData> callback)
        {
            var entry=new EventTrigger.Entry{eventID=type};
            entry.callback.AddListener(e=> { if(e is PointerEventData p) callback(p); }); trigger.triggers.Add(entry);
        }
        private void Recycle()
        {
            Color[] colors={new Color(.15f,.4f,.8f),new Color(.8f,.22f,.2f),new Color(.9f,.67f,.1f)};
            string[] labels={"Papel","Plástico","Metal"};
            RectTransform[] targets=new RectTransform[3];
            for(int i=0;i<3;i++)
            {
                targets[i]=U.Art(content,"round",new Vector2(490+i*460,590),new Vector2(280,230),colors[i]).rectTransform;
                U.Label(content,labels[i],new Vector2(490+i*460,735),new Vector2(350,70),40);
            }
            for(int i=0;i<6;i++)
            {
                int category=i%3; bool sorted=false;
                Vector2 point=new Vector2(300+i*265,295);
                Image item=U.Art(content,category==2?"circle":"round",point,new Vector2(180,110),colors[category]);
                // Pistas visuais de material para quem ainda não lê.
                U.Art(item.transform,category==2?"circle":"round",new Vector2(90,65),new Vector2(55,65),new Color(.92f,.95f,.97f));
                if(category==0)
                    for(int line=0;line<3;line++) U.Art(item.transform,"square",new Vector2(90,50+line*15),new Vector2(36,3),colors[0]);
                if(category==1) U.Art(item.transform,"round",new Vector2(90,100),new Vector2(25,18),colors[1]);
                U.Label(item.transform,labels[category],new Vector2(90,15),new Vector2(175,35),24,Color.white);
                Drag(item,()=>!sorted,p=>
                {
                    if(!Hit(targets[category],p)) return false;
                    sorted=true; item.gameObject.SetActive(false); Correct(6); return true;
                });
            }
        }
        private void Vowels()
        {
            string vowels="AEIOU";
            for(int i=0;i<5;i++)
            {
                int index=i; Button button=null;
                button=U.Button(content,vowels[i].ToString(),new Vector2(350+i*310,460+(i%2)*100),Vector2.one*200,U.Colors[3],()=>
                {
                    if(busy) return;
                    if(index!=progress) { Hint(); return; }
                    button.gameObject.SetActive(false);
                    Correct(5,index<4?"Skye_"+vowels[index+1]:null);
                },"star");
                button.gameObject.AddComponent<GentleMotion>().Configure(14,.4f,i);
            }
        }
        private void Blocks()
        {
            RectTransform target=U.Art(content,"round",new Vector2(1410,420),new Vector2(420,430),new Color(1,1,1,.35f)).rectTransform;
            U.Label(content,"Pilha de blocos",new Vector2(1410,710),new Vector2(450,70),40);
            for(int i=0;i<4;i++)
            {
                int order=i; bool placed=false;
                float width=330-i*65;
                Image block=U.Art(content,"round",new Vector2(380+(i%2)*420,330+(i/2)*250),new Vector2(width,115),U.Colors[5]);
                U.Label(block.transform,(4-i).ToString(),new Vector2(width/2,57),new Vector2(80,90),44,Color.white);
                Drag(block,()=>!placed,p=>
                {
                    if(order!=progress || !Hit(target,p)) return false;
                    placed=true; block.rectTransform.anchoredPosition=new Vector2(1410,260+order*110);
                    Correct(4,order<3?"Rubble_next":null); return true;
                });
            }
        }
        private void Memory()
        {
            int[] animals={0,1,2,0,1,2};
            for(int i=animals.Length-1;i>0;i--) { int j=UnityEngine.Random.Range(0,i+1); int a=animals[i]; animals[i]=animals[j]; animals[j]=a; }
            Button[] cards=new Button[6]; Text[] labels=new Text[6]; bool[] matched=new bool[6];
            int first=-1;
            string[] namesOfAnimals={"Peixe","Tartaruga","Caranguejo"};
            Action<int> reveal=i=>
            {
                labels[i].text=namesOfAnimals[animals[i]];
                Animal(cards[i].transform,animals[i]);
            };
            for(int i=0;i<6;i++)
            {
                int index=i;
                cards[i]=U.Button(content,"?",new Vector2(500+(i%3)*450,330+(i/3)*300),new Vector2(320,230),U.Colors[6],()=>
                {
                    if(busy || matched[index] || first==index) return;
                    reveal(index);
                    if(first<0) { first=index; return; }
                    int previous=first; first=-1;
                    if(animals[previous]==animals[index])
                    { matched[previous]=matched[index]=true; Correct(3); }
                    else { busy=true; StartCoroutine(ClosePair(cards,labels,previous,index)); }
                },"round");
                labels[i]=cards[i].GetComponentInChildren<Text>(); labels[i].fontSize=34;
            }
        }
        private static void Animal(Transform parent,int type)
        {
            Color c=type==0?new Color(.2f,.55f,.85f):type==1?new Color(.25f,.6f,.35f):new Color(.85f,.35f,.25f);
            U.Art(parent,"circle",new Vector2(160,150),new Vector2(95,55),c).name="Animal";
            for(int side=-1;side<=1;side+=2)
                U.Art(parent,type==0?"triangle":"circle",new Vector2(160+side*65,150),new Vector2(35,30),c).name="Animal";
            U.Art(parent,"circle",new Vector2(180,160),Vector2.one*9,Color.black).name="Animal";
        }
        private IEnumerator ClosePair(Button[] cards,Text[] labels,int a,int b)
        {
            yield return Wait(Voice.SpeakLine("Zuma_pair",Theme));
            yield return new WaitForSecondsRealtime(1.3f);
            foreach(int index in new[]{a,b})
            {
                labels[index].text="?";
                foreach(Transform child in cards[index].transform) if(child.name=="Animal") Destroy(child.gameObject);
            }
            busy=false;
        }
        private void OnApplicationFocus(bool focused)
        { if(!focused) foreach(Action cancel in cancelDrags) cancel(); }
        private void OnDestroy() { VoiceSynthesizer.OnCaption-=ShowCaption; }
    }
}
