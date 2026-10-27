#if UNITY_EDITOR
using System;
using System.IO;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;

namespace PatrulhaCanina.Editor
{
    [InitializeOnLoad]
    public static class AutoFullGameSetup
    {
        private static readonly string[] Names = {"Ryder","Chase","Marshall","Skye","Rocky","Rubble","Zuma"};
        static AutoFullGameSetup() { EditorApplication.delayCall += EnsureProject; }

        // Executado após compilação/importação: não substitui cenas já existentes.
        public static void EnsureProject()
        {
            if(EditorApplication.isPlayingOrWillChangePlaymode || EditorApplication.isCompiling) return;
            Directory.CreateDirectory("Assets/Scenes");
            Directory.CreateDirectory("Assets/Resources/Pups");
            Directory.CreateDirectory("Assets/Resources/Generated");
            AssetDatabase.Refresh();
            string[] shapes={"head","star","round"};
            foreach(string shape in shapes)
            {
                string path="Assets/Resources/Generated/"+shape+".png";
                if(!File.Exists(path))
                {
                    Sprite source=ProceduralWorldBuilder.Shape(shape);
                    File.WriteAllBytes(path,source.texture.EncodeToPNG());
                    AssetDatabase.ImportAsset(path);
                    var importer=(TextureImporter)AssetImporter.GetAtPath(path);
                    importer.textureType=TextureImporterType.Sprite;
                    importer.spritePixelsPerUnit=100;
                    importer.SaveAndReimport();
                }
            }
            for(int i=0;i<Names.Length;i++)
            {
                string path="Assets/Resources/Pups/"+Names[i]+".asset";
                if(AssetDatabase.LoadAssetAtPath<PupData>(path)!=null) continue;
                PupData data=AutoGameController.CreatePup(i);
                data.characterSprite=AssetDatabase.LoadAssetAtPath<Sprite>("Assets/Resources/Generated/head.png");
                data.badgeSprite=AssetDatabase.LoadAssetAtPath<Sprite>("Assets/Resources/Generated/star.png");
                data.vehicleSprite=AssetDatabase.LoadAssetAtPath<Sprite>("Assets/Resources/Generated/round.png");
                AssetDatabase.CreateAsset(data,path);
            }
            if(!File.Exists("Assets/Scenes/MainGame.unity"))
            {
                var previous=UnityEngine.SceneManagement.SceneManager.GetActiveScene();
                var scene=EditorSceneManager.NewScene(NewSceneSetup.EmptyScene,NewSceneMode.Additive);
                EditorSceneManager.SaveScene(scene,"Assets/Scenes/MainGame.unity");
                EditorSceneManager.CloseScene(scene,true);
                if(previous.IsValid()) UnityEngine.SceneManagement.SceneManager.SetActiveScene(previous);
            }
            EditorBuildSettings.scenes=new[]{new EditorBuildSettingsScene("Assets/Scenes/MainGame.unity",true)};
            PlayerSettings.companyName="RenatoBrilhante";
            PlayerSettings.productName="PatrulhaCanina";
            PlayerSettings.SetApplicationIdentifier(BuildTargetGroup.Android,"com.renatobrilhante.patrulhacanina");
            PlayerSettings.defaultInterfaceOrientation=UIOrientation.LandscapeLeft;
            PlayerSettings.Android.minSdkVersion=AndroidSdkVersions.AndroidApiLevel23;
            PlayerSettings.Android.targetArchitectures=AndroidArchitecture.ARM64;
            PlayerSettings.Android.forceInternetPermission=false;
            PlayerSettings.SetScriptingBackend(BuildTargetGroup.Android,ScriptingImplementation.IL2CPP);
            EditorUserBuildSettings.buildAppBundle=false;
            AssetDatabase.SaveAssets();
        }

        [MenuItem("PatrulhaCanina/Construir Jogo Completo e Gerar APK")]
        public static void BuildAndroid()
        {
            EnsureProject();
            if(!BuildPipeline.IsBuildTargetSupported(BuildTargetGroup.Android,BuildTarget.Android))
                throw new InvalidOperationException("Android Build Support precisa estar instalado no Editor usado para compilar.");
            Directory.CreateDirectory("build/Android");
            BuildReport report=BuildPipeline.BuildPlayer(new BuildPlayerOptions
            {
                scenes=new[]{"Assets/Scenes/MainGame.unity"},
                locationPathName="build/Android/PatrulhaCanina.apk",
                target=BuildTarget.Android, options=BuildOptions.None
            });
            if(report.summary.result!=BuildResult.Succeeded)
                throw new InvalidOperationException("Build Android falhou: "+report.summary.result);
            Debug.Log("APK gerado: build/Android/PatrulhaCanina.apk");
        }
    }
}
#endif
