using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

namespace PatrulhaCanina
{
    public enum RecycleCategory { Paper, Plastic, Glass, Metal }

    public sealed class RockyRecycleMinigame : EducationalMissionBase
    {
        [Serializable]
        public sealed class BeachWaste
        {
            public RecycleCategory category;
            public RectTransform visual;
            // Use também um símbolo de material, além da cor, para facilitar a identificação.
            public Image categoryMarker;
            [NonSerialized] public Vector3 home;
            [NonSerialized] public bool sorted;
        }

        [Serializable]
        public sealed class RecycleBin
        {
            public RecycleCategory category;
            public RectTransform dropArea;
            public Image colorPanel;
        }

        [SerializeField] private BeachWaste[] waste;
        [SerializeField] private RecycleBin[] bins;
        [SerializeField] private AudioClip recycleSound;
        private int sortedCount;
        protected override PupName RequiredPup => PupName.Rocky;
        protected override bool IsComplete => sortedCount >= waste.Length;

        // Convenção brasileira: papel azul, plástico vermelho, vidro verde, metal amarelo.
        public static Color CategoryColor(RecycleCategory category)
        {
            switch (category)
            {
                case RecycleCategory.Paper: return new Color32(40, 110, 210, 255);
                case RecycleCategory.Plastic: return new Color32(210, 65, 65, 255);
                case RecycleCategory.Glass: return new Color32(55, 150, 90, 255);
                case RecycleCategory.Metal: return new Color32(240, 195, 55, 255);
                default: return Color.white;
            }
        }

        protected override void Start()
        {
            if (waste != null)
                foreach (BeachWaste item in waste)
                    if (item != null && item.visual != null)
                    {
                        BeachWaste captured = item;
                        item.home = item.visual.localPosition;
                        BindDrag(item.visual, pointer =>
                        {
                            if (captured.sorted) return true;
                            foreach (RecycleBin bin in bins)
                            {
                                if (!Contains(bin.dropArea, pointer) || bin.category != captured.category) continue;
                                captured.sorted = true;
                                captured.visual.gameObject.SetActive(false);
                                sortedCount++;
                                if (VoiceManager.Instance != null) VoiceManager.Instance.PlayEffect(recycleSound);
                                RegisterCorrect();
                                return true;
                            }
                            RegisterGentleError();
                            return false;
                        }, () => !captured.sorted);
                    }
            base.Start();
        }

        protected override bool ValidateMinigame()
        {
            if (waste == null || waste.Length == 0 || bins == null || bins.Length == 0) return Invalid();
            var categories = new HashSet<RecycleCategory>();
            var areas = new HashSet<RectTransform>();
            var visuals = new HashSet<RectTransform>();
            foreach (RecycleBin bin in bins)
            {
                if (bin == null || bin.dropArea == null || bin.colorPanel == null || !areas.Add(bin.dropArea)) return Invalid();
                categories.Add(bin.category);
            }
            foreach (BeachWaste item in waste)
                if (item == null || item.visual == null || !(item.visual.parent is RectTransform) ||
                    item.categoryMarker == null || !visuals.Add(item.visual) || areas.Contains(item.visual) ||
                    !categories.Contains(item.category)) return Invalid();
            return true;
        }

        private bool Invalid()
        {
            Debug.LogError("Rocky: configure itens únicos, marcadores e lixeiras compatíveis com todas as categorias.", this);
            return false;
        }

        protected override void ResetMinigame()
        {
            sortedCount = 0;
            foreach (RecycleBin bin in bins) bin.colorPanel.color = CategoryColor(bin.category);
            foreach (BeachWaste item in waste)
            {
                item.sorted = false;
                item.visual.localPosition = item.home;
                item.categoryMarker.color = CategoryColor(item.category);
                item.visual.gameObject.SetActive(true);
            }
        }

        // Os resíduos podem ser separados em qualquer ordem, sem próxima peça obrigatória.
        protected override void AdvanceAfterCorrect() { }
    }
}
