using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

namespace PatrulhaCanina
{
    public sealed class MarshallFireMinigame : EducationalMissionBase
    {
        [Serializable]
        public sealed class Flame
        {
            public Button touchButton;
            public Image colorImage;
            public Text numberLabel;
            [Min(1)] public int number = 1;
            public Color color = Color.red;
            public AudioClip instruction;
            [NonSerialized] public bool extinguished;
        }

        [Header("Ordem educativa: primeiro elemento, segundo elemento...")]
        [SerializeField] private Flame[] flames;
        [SerializeField] private ParticleSystem waterJet;
        [SerializeField] private AudioClip waterSound;
        private int currentIndex;
        protected override PupName RequiredPup => PupName.Marshall;
        protected override bool IsComplete => currentIndex >= flames.Length;

        protected override void Start()
        {
            if (flames != null)
                for (int i = 0; i < flames.Length; i++)
                {
                    int index = i;
                    if (flames[i] != null && flames[i].touchButton != null)
                        flames[i].touchButton.onClick.AddListener(() => TouchFlame(index));
                }
            base.Start();
        }

        protected override bool ValidateMinigame()
        {
            if (flames == null || flames.Length == 0) return Invalid();
            var buttons = new HashSet<Button>();
            foreach (Flame flame in flames)
                if (flame == null || flame.touchButton == null || flame.colorImage == null ||
                    flame.numberLabel == null || flame.number < 1 || !buttons.Add(flame.touchButton)) return Invalid();
            return true;
        }

        private bool Invalid()
        {
            Debug.LogError("Marshall: configure chamas com botões exclusivos, Image, Text e número positivo.", this);
            return false;
        }

        protected override void ResetMinigame()
        {
            currentIndex = 0;
            if (waterJet != null) waterJet.Stop(true, ParticleSystemStopBehavior.StopEmittingAndClear);
            foreach (Flame flame in flames)
            {
                flame.extinguished = false;
                flame.touchButton.gameObject.SetActive(true);
                flame.touchButton.interactable = true;
                flame.colorImage.color = flame.color;
                flame.numberLabel.text = flame.number.ToString();
            }
        }

        protected override void OnGameplayStarted() { AnnounceNext(); }
        protected override void AdvanceAfterCorrect() { AnnounceNext(); }

        private void AnnounceNext()
        {
            if (IsComplete) return;
            AudioClip clip = flames[currentIndex].instruction;
            RememberInstruction(clip);
            StartCoroutine(Say(clip));
        }

        public void TouchFlame(int index)
        {
            if (!CanInteract || index < 0 || index >= flames.Length || flames[index].extinguished) return;
            if (index != currentIndex) { RegisterGentleError(); return; }
            Flame flame = flames[index];
            if (waterJet != null)
            {
                // Funciona com partículas em espaço de mundo; ajuste a direção no Inspector.
                waterJet.transform.position = flame.touchButton.transform.position;
                waterJet.Play();
            }
            if (VoiceManager.Instance != null) VoiceManager.Instance.PlayEffect(waterSound);
            flame.extinguished = true;
            flame.touchButton.gameObject.SetActive(false);
            currentIndex++;
            RegisterCorrect();
        }
    }
}
