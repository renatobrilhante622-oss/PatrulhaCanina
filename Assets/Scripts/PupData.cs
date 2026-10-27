using UnityEngine;

namespace PatrulhaCanina
{
    public enum PupName { Ryder, Chase, Marshall, Skye, Rocky, Rubble, Zuma }

    [CreateAssetMenu(fileName = "Pup", menuName = "Patrulha Canina/Personagem")]
    public sealed class PupData : ScriptableObject
    {
        public PupName pupName;
        public Color themeColor = Color.white;
        public Sprite characterSprite;
        public Sprite badgeSprite;
        public Sprite vehicleSprite;
        public AudioClip[] initialCalls;
        public AudioClip[] correctPraise;
        public AudioClip[] gentleHints;
        public AudioClip[] cookieRewards;

        // Ignora entradas vazias sem precisar criar listas temporárias.
        public static AudioClip Pick(AudioClip[] clips)
        {
            if (clips == null) return null;
            AudioClip selected = null;
            int count = 0;
            foreach (AudioClip clip in clips)
                if (clip != null && Random.Range(0, ++count) == 0) selected = clip;
            return selected;
        }
    }
}
