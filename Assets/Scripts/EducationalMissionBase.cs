using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Events;
using UnityEngine.EventSystems;

namespace PatrulhaCanina
{
    public enum MissionPhase { Idle, LighthouseCall, PupSelection, Instruction, Playing, Reward }

    public abstract class EducationalMissionBase : MonoBehaviour
    {
        [Header("Personagem e apresentação")]
        [SerializeField] protected PupData missionPup;
        [SerializeField] private AudioClip missionInstruction;
        [SerializeField] private bool beginOnStart = true;
        [SerializeField, Min(0f)] private float hintInterval = 2f;
        [Header("Conecte os painéis pelo Inspector")]
        [SerializeField] private UnityEvent onLighthouseCall = new UnityEvent();
        [SerializeField] private UnityEvent onPupSelection = new UnityEvent();
        [SerializeField] private UnityEvent onInstruction = new UnityEvent();
        [SerializeField] private UnityEvent onMinigame = new UnityEvent();
        [SerializeField] private UnityEvent onCookieReward = new UnityEvent();

        public MissionPhase Phase { get; private set; } = MissionPhase.Idle;
        public bool CanInteract => Phase == MissionPhase.Playing && !feedbackBusy;
        protected abstract PupName RequiredPup { get; }
        protected abstract bool IsComplete { get; }
        protected abstract bool ValidateMinigame();
        protected abstract void ResetMinigame();
        protected abstract void AdvanceAfterCorrect();
        protected virtual void OnGameplayStarted() { }
        private bool feedbackBusy;
        private float nextHintTime;
        private readonly List<Action> cancelDrags = new List<Action>();

        protected virtual void Start()
        {
            if (beginOnStart) BeginMission();
        }

        public void BeginMission()
        {
            if (Phase != MissionPhase.Idle && Phase != MissionPhase.Reward) return;
            if (VoiceManager.Instance == null || missionPup == null || missionPup.pupName != RequiredPup)
            {
                Debug.LogError("Configure VoiceManager e o PupData correto antes de iniciar.", this);
                return;
            }
            if (!ValidateMinigame()) return;
            feedbackBusy = false;
            nextHintTime = 0f;
            VoiceManager.Instance.StopVoices();
            ResetMinigame();
            StartCoroutine(CallRoutine());
        }

        private IEnumerator CallRoutine()
        {
            Phase = MissionPhase.LighthouseCall;
            onLighthouseCall.Invoke();
            yield return Say(PupData.Pick(missionPup.initialCalls), true);
            Phase = MissionPhase.PupSelection;
            onPupSelection.Invoke();
        }

        // Cada botão de personagem pode passar seu próprio asset PupData.
        public void SelectPup(PupData selected)
        {
            if (Phase != MissionPhase.PupSelection || selected == null) return;
            if (selected.pupName != RequiredPup) { RegisterGentleError(); return; }
            Phase = MissionPhase.Instruction;
            StartCoroutine(InstructionRoutine());
        }

        private IEnumerator InstructionRoutine()
        {
            onInstruction.Invoke();
            yield return Say(missionInstruction, true);
            Phase = MissionPhase.Playing;
            OnGameplayStarted();
            onMinigame.Invoke();
        }

        protected IEnumerator Say(AudioClip clip, bool instruction = false)
        {
            VoiceManager manager = VoiceManager.Instance;
            if (manager == null) yield break;
            var ticket = manager.Speak(clip, instruction);
            while (!ticket.IsFinished && manager != null) yield return null;
        }

        protected void RememberInstruction(AudioClip clip)
        {
            if (VoiceManager.Instance != null) VoiceManager.Instance.SetInstruction(clip);
        }

        public void RegisterCorrect()
        {
            if (!CanInteract) return;
            feedbackBusy = true;
            StartCoroutine(CorrectRoutine());
        }

        private IEnumerator CorrectRoutine()
        {
            yield return Say(PupData.Pick(missionPup.correctPraise));
            if (IsComplete)
            {
                Phase = MissionPhase.Reward;
                feedbackBusy = false;
                onCookieReward.Invoke();
                if (VoiceManager.Instance != null)
                    VoiceManager.Instance.PlayEffect(PupData.Pick(missionPup.cookieRewards));
                yield break;
            }
            AdvanceAfterCorrect();
            feedbackBusy = false;
        }

        public void RegisterGentleError()
        {
            if (Phase != MissionPhase.Playing && Phase != MissionPhase.PupSelection) return;
            if (feedbackBusy || Time.unscaledTime < nextHintTime) return;
            // Não acumula dicas se a criança tocar várias vezes durante outra fala.
            if (VoiceManager.Instance != null && VoiceManager.Instance.IsVoiceBusy) return;
            nextHintTime = Time.unscaledTime + hintInterval;
            StartCoroutine(Say(PupData.Pick(missionPup.gentleHints)));
        }

        protected static bool Contains(RectTransform target, PointerEventData pointer)
        {
            return target != null && target.gameObject.activeInHierarchy &&
                RectTransformUtility.RectangleContainsScreenPoint(target, pointer.position, pointer.pressEventCamera);
        }

        // EventTrigger recebe toque e mouse do EventSystem; nenhum polling de mouse.
        protected void BindDrag(RectTransform item, Func<PointerEventData, bool> acceptDrop, Func<bool> canDrag)
        {
            EventTrigger trigger = item.GetComponent<EventTrigger>();
            if (trigger == null) trigger = item.gameObject.AddComponent<EventTrigger>();
            int? activePointer = null;
            Vector3 home = Vector3.zero;
            Vector3 offset = Vector3.zero;
            RectTransform plane = item.parent as RectTransform;
            cancelDrags.Add(() =>
            {
                if (activePointer.HasValue && item != null) item.position = home;
                activePointer = null;
            });
            Action<PointerEventData> restore = p =>
            {
                if (!activePointer.HasValue || activePointer.Value != p.pointerId) return;
                bool accepted = CanInteract && acceptDrop(p);
                if (!accepted) item.position = home;
                activePointer = null;
            };
            AddTrigger(trigger, EventTriggerType.BeginDrag, p =>
            {
                if (!CanInteract || !canDrag() || activePointer.HasValue || plane == null) return;
                if (!RectTransformUtility.ScreenPointToWorldPointInRectangle(plane, p.position, p.pressEventCamera, out Vector3 point)) return;
                activePointer = p.pointerId;
                home = item.position;
                offset = home - point;
            });
            AddTrigger(trigger, EventTriggerType.Drag, p =>
            {
                if (activePointer != p.pointerId || !CanInteract) return;
                if (RectTransformUtility.ScreenPointToWorldPointInRectangle(plane, p.position, p.pressEventCamera, out Vector3 point))
                    item.position = point + offset;
            });
            AddTrigger(trigger, EventTriggerType.EndDrag, restore);
        }

        private static void AddTrigger(EventTrigger trigger, EventTriggerType type, Action<PointerEventData> callback)
        {
            var entry = new EventTrigger.Entry { eventID = type };
            entry.callback.AddListener(data => { if (data is PointerEventData pointer) callback(pointer); });
            trigger.triggers.Add(entry);
        }

        protected virtual void OnDisable()
        {
            bool wasActive = Phase != MissionPhase.Idle;
            foreach (Action cancel in cancelDrags) cancel();
            StopAllCoroutines();
            Phase = MissionPhase.Idle;
            feedbackBusy = false;
            if (wasActive && VoiceManager.Instance != null) VoiceManager.Instance.StopVoices();
        }

        private void OnApplicationFocus(bool focused)
        {
            if (!focused) foreach (Action cancel in cancelDrags) cancel();
        }
    }
}
