using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;
namespace PatrulhaCanina
{
    public sealed class GameBootstrapper : MonoBehaviour
    {
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.SubsystemRegistration)]
        private static void ResetState() { VoiceSynthesizer.ResetSession(); }

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void Boot()
        {
            if (FindObjectOfType<AutoGameController>() != null) return;
            if (Camera.main == null)
            {
                var cameraObject = new GameObject("Camera 2D", typeof(Camera), typeof(AudioListener));
                cameraObject.tag = "MainCamera";
                var camera = cameraObject.GetComponent<Camera>();
                camera.orthographic = true; camera.transform.position = new Vector3(0,0,-10);
            }
            if (FindObjectOfType<EventSystem>() == null)
                new GameObject("Touch EventSystem",typeof(EventSystem),typeof(StandaloneInputModule));
            if (VoiceManager.Instance == null) new GameObject("Audio persistente",typeof(VoiceManager));
            var canvasObject = new GameObject("Canvas automático",typeof(Canvas),typeof(CanvasScaler),typeof(GraphicRaycaster));
            canvasObject.GetComponent<Canvas>().renderMode = RenderMode.ScreenSpaceOverlay;
            CanvasScaler scaler = canvasObject.GetComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920,1080); scaler.matchWidthOrHeight = .5f;
            scaler.screenMatchMode = CanvasScaler.ScreenMatchMode.Expand;
            RectTransform stage = ProceduralWorldBuilder.Rect(canvasObject.transform,"Área segura",Vector2.zero,new Vector2(1920,1080));
            stage.gameObject.AddComponent<ResponsiveStage>();
            var root = new GameObject("Jogo automático",typeof(ProceduralWorldBuilder),typeof(AutoGameController));
            root.GetComponent<AutoGameController>().Initialize(stage,root.GetComponent<ProceduralWorldBuilder>());
            Screen.sleepTimeout = SleepTimeout.NeverSleep;
        }
    }
}
