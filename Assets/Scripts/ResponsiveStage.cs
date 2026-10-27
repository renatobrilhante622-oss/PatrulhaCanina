using UnityEngine;
namespace PatrulhaCanina
{
    // Mantém os controles inteiros dentro da área segura, sem ajustes no Inspector.
    public sealed class ResponsiveStage : MonoBehaviour
    {
        private void LateUpdate()
        {
            Canvas canvas=GetComponentInParent<Canvas>();
            RectTransform rect=(RectTransform)transform;
            Rect safe=Screen.safeArea;
            float factor=Mathf.Max(.001f,canvas.scaleFactor);
            rect.anchorMin=rect.anchorMax=new Vector2(.5f,.5f);
            rect.anchoredPosition=(safe.center-new Vector2(Screen.width*.5f,Screen.height*.5f))/factor;
            rect.localScale=Vector3.one*Mathf.Min(safe.width/factor/1920,safe.height/factor/1080);
        }
    }
}
