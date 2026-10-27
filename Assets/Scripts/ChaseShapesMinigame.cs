using System;
using System.Collections.Generic;
using UnityEngine;

namespace PatrulhaCanina
{
    public enum GeometricShape { Circle, Square, Triangle }

    public sealed class ChaseShapesMinigame : EducationalMissionBase
    {
        [Serializable]
        public sealed class ShapePiece
        {
            public GeometricShape shape;
            public RectTransform visual;
            [NonSerialized] public Vector3 home;
            [NonSerialized] public bool placed;
        }

        [Serializable]
        public sealed class ShapeShadow
        {
            public GeometricShape shape;
            public RectTransform area;
            [NonSerialized] public bool occupied;
        }

        [SerializeField] private ShapePiece[] pieces;
        [SerializeField] private ShapeShadow[] shadows;
        private int placedCount;
        protected override PupName RequiredPup => PupName.Chase;
        protected override bool IsComplete => placedCount >= pieces.Length;

        protected override void Start()
        {
            if (pieces != null)
                foreach (ShapePiece piece in pieces)
                    if (piece != null && piece.visual != null)
                    {
                        ShapePiece captured = piece;
                        piece.home = piece.visual.localPosition;
                        BindDrag(piece.visual, pointer =>
                        {
                            if (captured.placed) return true;
                            foreach (ShapeShadow shadow in shadows)
                            {
                                if (!Contains(shadow.area, pointer)) continue;
                                if (shadow.shape != captured.shape || shadow.occupied) continue;
                                captured.placed = true;
                                shadow.occupied = true;
                                captured.visual.position = shadow.area.position;
                                placedCount++;
                                RegisterCorrect();
                                return true;
                            }
                            RegisterGentleError();
                            return false;
                        }, () => !captured.placed);
                    }
            base.Start();
        }

        protected override bool ValidateMinigame()
        {
            if (pieces == null || shadows == null || pieces.Length == 0) return Invalid();
            var visuals = new HashSet<RectTransform>();
            var areas = new HashSet<RectTransform>();
            var supply = new Dictionary<GeometricShape, int>();
            foreach (ShapeShadow shadow in shadows)
            {
                if (shadow == null || shadow.area == null || !areas.Add(shadow.area)) return Invalid();
                if (!supply.ContainsKey(shadow.shape)) supply[shadow.shape] = 0;
                supply[shadow.shape]++;
            }
            foreach (ShapePiece piece in pieces)
            {
                if (piece == null || piece.visual == null || !(piece.visual.parent is RectTransform) ||
                    !visuals.Add(piece.visual) || areas.Contains(piece.visual) ||
                    !supply.ContainsKey(piece.shape) || supply[piece.shape] == 0) return Invalid();
                supply[piece.shape]--;
            }
            return true;
        }

        private bool Invalid()
        {
            Debug.LogError("Chase: configure peças únicas e uma sombra disponível para cada peça.", this);
            return false;
        }

        protected override void ResetMinigame()
        {
            placedCount = 0;
            foreach (ShapeShadow shadow in shadows) shadow.occupied = false;
            foreach (ShapePiece piece in pieces)
            {
                piece.placed = false;
                piece.visual.localPosition = piece.home;
                piece.visual.gameObject.SetActive(true);
            }
        }

        // Aqui a criança escolhe livremente a próxima forma.
        protected override void AdvanceAfterCorrect() { }
    }
}
