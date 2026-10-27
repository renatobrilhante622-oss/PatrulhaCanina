using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

namespace PatrulhaCanina
{
    // Toda a arte é gerada localmente. Coordenadas lógicas: 1920 x 1080.
    public sealed class ProceduralWorldBuilder : MonoBehaviour
    {
        private static readonly Dictionary<string, Sprite> sprites = new Dictionary<string, Sprite>();
        private static Sprite skySprite;
        public static readonly Color[] Colors = { new Color(.8f,.22f,.25f), new Color(.17f,.38f,.75f), new Color(.85f,.23f,.22f), new Color(.85f,.35f,.62f), new Color(.21f,.55f,.35f), new Color(.92f,.66f,.16f), new Color(.96f,.43f,.16f) };
        public static RectTransform Rect(Transform parent, string name, Vector2 point, Vector2 size)
        {
            var obj = new GameObject(name, typeof(RectTransform));
            var rect = obj.GetComponent<RectTransform>();
            rect.SetParent(parent, false);
            rect.anchorMin = rect.anchorMax = Vector2.zero;
            rect.anchoredPosition = point;
            rect.sizeDelta = size;
            return rect;
        }
        public static Image Art(Transform parent, string shape, Vector2 point, Vector2 size, Color color)
        {
            RectTransform rect = Rect(parent, shape, point, size);
            Image image = rect.gameObject.AddComponent<Image>();
            image.sprite = Shape(shape); image.color = color; image.raycastTarget = false;
            return image;
        }
        public static Text Label(Transform parent, string text, Vector2 point, Vector2 size, int fontSize = 40, Color? color = null)
        {
            Text label = Rect(parent, text, point, size).gameObject.AddComponent<Text>();
            label.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            label.text = text; label.fontSize = fontSize; label.alignment = TextAnchor.MiddleCenter;
            label.color = color ?? new Color(.1f,.17f,.26f); label.raycastTarget = false;
            return label;
        }
        public static Button Button(Transform parent, string text, Vector2 point, Vector2 size, Color color, UnityEngine.Events.UnityAction action, string shape = "round")
        {
            Image image = Art(parent, shape, point, size, color); image.raycastTarget = true;
            Button button = image.gameObject.AddComponent<Button>();
            button.targetGraphic = image; button.transition = Selectable.Transition.ColorTint;
            float luminance=color.r*.2126f+color.g*.7152f+color.b*.0722f;
            Label(image.transform, text, size / 2, size * .9f, 36, luminance>.55f ? new Color(.12f,.18f,.24f) : Color.white);
            button.onClick.AddListener(action);
            return button;
        }
        public static Sprite Shape(string shape)
        {
            if (sprites.TryGetValue(shape, out Sprite sprite) && sprite != null) return sprite;
            const int n = 128;
            Texture2D texture = new Texture2D(n,n,TextureFormat.RGBA32,false);
            texture.name = "Procedural_" + shape; texture.wrapMode = TextureWrapMode.Clamp;
            Color[] pixels = new Color[n*n];
            for (int y=0;y<n;y++) for (int x=0;x<n;x++)
            {
                float u = (x+.5f)/n*2-1, v = (y+.5f)/n*2-1;
                bool inside;
                switch(shape)
                {
                    case "circle": case "head": inside = u*u+v*v <= .96f; break;
                    case "triangle": inside = v >= -.9f && v <= .95f && Mathf.Abs(u) <= (.95f-v)*.52f; break;
                    case "star":
                        float a = Mathf.Atan2(u,v), r = Mathf.Sqrt(u*u+v*v);
                        inside = r <= .68f + .25f*Mathf.Cos(a*5); break;
                    case "flame": inside = v > -.85f && v < .98f && Mathf.Abs(u) < Mathf.Sqrt(Mathf.Max(0,1-v*v)) * (.55f-.3f*v); break;
                    case "boat": inside = v > -.8f && v < .5f && Mathf.Abs(u) < .75f+.2f*v; break;
                    case "round": inside = Mathf.Pow(Mathf.Abs(u),6)+Mathf.Pow(Mathf.Abs(v),6)<.95f; break;
                    default: inside = true; break;
                }
                pixels[y*n+x] = inside ? Color.white : Color.clear;
            }
            texture.SetPixels(pixels); texture.Apply();
            sprite = Sprite.Create(texture, new Rect(0,0,n,n), new Vector2(.5f,.5f), 100);
            sprites[shape] = sprite; return sprite;
        }
        public static void Portrait(Transform parent, int pup, Vector2 point, float size)
        {
            Art(parent,"circle",point,new Vector2(size,size),Colors[pup]);
            Color fur = pup == 2 ? Color.white : new Color(.86f,.68f,.43f);
            Art(parent,"head",point,new Vector2(size*.7f,size*.7f),fur);
            if(pup!=0)
            {
                Art(parent,"circle",point+new Vector2(-size*.3f,0),new Vector2(size*.2f,size*.45f),new Color(.42f,.27f,.18f));
                Art(parent,"circle",point+new Vector2(size*.3f,0),new Vector2(size*.2f,size*.45f),new Color(.42f,.27f,.18f));
            }
            for(int side=-1;side<=1;side+=2) Art(parent,"circle",point+new Vector2(side*size*.14f,size*.06f),Vector2.one*size*.075f,Color.black);
            Art(parent,"triangle",point-new Vector2(0,size*.12f),Vector2.one*size*.14f,Color.black);
            Art(parent,"round",point+new Vector2(0,size*.28f),new Vector2(size*.64f,size*.18f),Colors[pup]);
        }
        public void Build(Transform parent, int terrain)
        {
            if(skySprite==null)
            {
                Texture2D sky = new Texture2D(1,128);
                sky.wrapMode=TextureWrapMode.Clamp;
                for(int y=0;y<128;y++) sky.SetPixel(0,y,Color.Lerp(new Color(.8f,.95f,1),new Color(.31f,.66f,.93f),y/127f));
                sky.Apply();
                skySprite=Sprite.Create(sky,new Rect(0,0,1,128),new Vector2(.5f,.5f));
            }
            Image backdrop = Art(parent,"square",new Vector2(960,540),new Vector2(1920,1080),Color.white);
            backdrop.sprite = skySprite;
            Art(parent,"circle",new Vector2(1670,865),Vector2.one*125,new Color(1,.88f,.43f));
            for(int i=0;i<5;i++)
            {
                Image cloud = Art(parent,"round",new Vector2(180+i*390,830+i%2*70),new Vector2(230,75),new Color(1,1,1,.85f));
                cloud.gameObject.AddComponent<GentleMotion>().Configure(18, .25f, i);
            }
            Color ground = terrain==0 ? new Color(.3f,.65f,.4f) : terrain==3 ? new Color(.94f,.83f,.6f) : terrain==5 ? new Color(.76f,.58f,.38f) : terrain==4 || terrain==6 ? new Color(.25f,.7f,.85f) : new Color(.36f,.4f,.46f);
            Art(parent,"square",new Vector2(960,280),new Vector2(1920,560),ground);
            if(terrain==0 || terrain==3 || terrain==6)
            {
                Image sea = Art(parent,"square",new Vector2(960,610),new Vector2(1920,200),new Color(.18f,.67f,.84f));
                sea.gameObject.AddComponent<GentleMotion>().Configure(7,.4f,0);
                for(int i=0;i<10;i++) Art(parent,"round",new Vector2(i*210,620),new Vector2(150,9),new Color(.8f,1,1,.6f));
            }
            if(terrain==0)
            {
                Art(parent,"triangle",new Vector2(960,865),new Vector2(270,170),Colors[0]);
                Art(parent,"round",new Vector2(960,650),new Vector2(210,340),Color.white);
                Art(parent,"square",new Vector2(960,740),new Vector2(215,65),Colors[0]);
                Art(parent,"round",new Vector2(960,570),new Vector2(75,130),Colors[1]);
            }
            if(terrain==1 || terrain==2)
            {
                for(int i=0;i<7;i++) Art(parent,"square",new Vector2(140+i*300,235),new Vector2(170,16),Color.white);
                for(int i=0;i<5;i++) Art(parent,"round",new Vector2(120+i*420,640),new Vector2(210,170),new Color(.65f,.77f,.84f));
            }
            if(terrain==6) for(int i=0;i<9;i++) Art(parent,"square",new Vector2(960,70+i*26),new Vector2(1100,20),new Color(.66f,.43f,.24f));
            if(terrain>0) Vehicle(parent,terrain);
            if(terrain==1)
            {
                Art(parent,"round",new Vector2(170,440),new Vector2(60,120),Colors[2]);
                Art(parent,"round",new Vector2(170,465),new Vector2(110,35),Colors[2]);
            }
        }
        private void Vehicle(Transform parent,int terrain)
        {
            int[] pup = {0,2,1,4,3,5,6};
            Color color = Colors[pup[terrain]];
            Vector2 origin = new Vector2(1550,690);
            Art(parent,terrain==6?"boat":"round",origin,new Vector2(300,100),color);
            Art(parent,"round",origin+new Vector2(55,70),new Vector2(135,90),color);
            Art(parent,"round",origin+new Vector2(55,80),new Vector2(90,50),new Color(.8f,.95f,1));
            if(terrain==4) Art(parent,"round",origin+new Vector2(0,145),new Vector2(340,12),Color.white);
            else if(terrain!=6) for(int side=-1;side<=1;side+=2) Art(parent,"circle",origin+new Vector2(side*95,-55),Vector2.one*60,new Color(.17f,.21f,.27f));
            if(terrain==1)
            {
                Art(parent,"round",origin+new Vector2(-80,75),new Vector2(155,14),Color.white);
                Art(parent,"round",origin+new Vector2(-80,105),new Vector2(155,14),Color.white);
                for(int i=0;i<5;i++) Art(parent,"square",origin+new Vector2(-140+i*30,90),new Vector2(8,35),Color.white);
            }
            if(terrain==2) Art(parent,"round",origin+new Vector2(55,130),new Vector2(70,20),Colors[2]);
            if(terrain==3) Label(parent,"RECICLAR",origin-new Vector2(50,0),new Vector2(180,50),23,Color.white);
            if(terrain==5) Art(parent,"triangle",origin+new Vector2(-190,-10),new Vector2(120,110),color);
        }
    }
}
