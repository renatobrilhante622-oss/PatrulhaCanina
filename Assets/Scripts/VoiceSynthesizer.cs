using System;
using System.Collections.Generic;
using UnityEngine;

namespace PatrulhaCanina
{
    // Os WAVs são fala sintética original, não imitações das vozes dos atores.
    public static class VoiceSynthesizer
    {
        [Serializable] private sealed class Entry { public string id; public string speaker; public string text; }
        [Serializable] private sealed class Catalog { public Entry[] entries; }
        private static Dictionary<string, Entry> entries;
        private static AudioClip fallback;
        public static event Action<string, Color> OnCaption;

        public static void ResetSession() { entries = null; OnCaption = null; fallback = null; }

        public static AudioClip Resolve(string id, Color color, bool showCaption = true)
        {
            if (entries == null)
            {
                entries = new Dictionary<string, Entry>();
                TextAsset json = Resources.Load<TextAsset>("VoiceCatalog");
                if (json != null)
                    foreach (Entry entry in JsonUtility.FromJson<Catalog>(json.text).entries) entries[entry.id] = entry;
            }
            string text = entries.TryGetValue(id, out Entry item) ? item.text : "Vamos brincar juntos, com calma!";
            if (showCaption) OnCaption?.Invoke(text, color);
            AudioClip clip = Resources.Load<AudioClip>("Audio/Voices/" + id);
            if (clip != null) return clip;
            // Uma campainha suave acompanhada da legenda; não finge ser fala inteligível.
            if (fallback == null)
            {
                const int rate = 22050;
                float[] samples = new float[rate];
                for (int i = 0; i < samples.Length; i++)
                {
                    float t = (float)i / rate;
                    samples[i] = Mathf.Sin(2 * Mathf.PI * 440 * t) * Mathf.Sin(Mathf.PI * t) * 0.07f;
                }
                fallback = AudioClip.Create("Sinal gentil", rate, 1, rate, false);
                fallback.SetData(samples, 0);
            }
            return fallback;
        }
    }
}
