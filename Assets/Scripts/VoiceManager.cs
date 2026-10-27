using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace PatrulhaCanina
{
    // A fila evita que elogios cortem instruções no meio de uma frase.
    public sealed class VoiceManager : MonoBehaviour
    {
        public sealed class VoiceTicket
        {
            public bool IsFinished { get; internal set; }
        }

        private sealed class Request
        {
            public AudioClip clip;
            public VoiceTicket ticket;
            public System.Action onStart;
        }

        public static VoiceManager Instance { get; private set; }
        public bool IsVoiceBusy => current != null || queue.Count > 0;
        [SerializeField] private AudioSource voiceSource;
        [SerializeField] private AudioSource bgmSource;
        [SerializeField] private AudioSource sfxSource;
        [SerializeField, Range(0f, 1f)] private float musicVolume = 0.25f;
        [SerializeField, Range(0f, 1f)] private float duckMultiplier = 0.2f;
        [SerializeField, Min(0.01f)] private float fadeSeconds = 0.3f;
        [SerializeField, Range(0f, 1f)] private float voiceVolume = 0.8f;
        [SerializeField, Range(0f, 1f)] private float effectsVolume = 0.4f;

        private readonly Queue<Request> queue = new Queue<Request>();
        private Request current;
        private Coroutine worker;
        private AudioClip lastInstruction;
        private System.Action lastCaption;

        public VoiceTicket SpeakLine(string id, Color color, bool instruction = false)
        {
            AudioClip clip = VoiceSynthesizer.Resolve(id, color, false);
            var ticket = new VoiceTicket();
            if (!isActiveAndEnabled) { ticket.IsFinished = true; return ticket; }
            System.Action caption = () => VoiceSynthesizer.Resolve(id, color);
            if (instruction) { lastInstruction = clip; lastCaption = caption; }
            queue.Enqueue(new Request { clip = clip, ticket = ticket, onStart = caption });
            if (worker == null) worker = StartCoroutine(ProcessQueue());
            return ticket;
        }

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
            // Coloque este componente em um objeto raiz dedicado.
            DontDestroyOnLoad(gameObject);
            voiceSource = Prepare(voiceSource);
            if (bgmSource == voiceSource) bgmSource = null;
            bgmSource = Prepare(bgmSource);
            if (sfxSource == voiceSource || sfxSource == bgmSource) sfxSource = null;
            sfxSource = Prepare(sfxSource);
            voiceSource.loop = false;
            sfxSource.loop = false;
            bgmSource.loop = true;
            bgmSource.volume = musicVolume;
            voiceSource.volume = voiceVolume;
            sfxSource.volume = effectsVolume;
        }

        private AudioSource Prepare(AudioSource source)
        {
            if (source == null) source = gameObject.AddComponent<AudioSource>();
            source.playOnAwake = false;
            source.spatialBlend = 0f;
            source.Stop();
            return source;
        }

        private void Update()
        {
            if (Instance != this) return;
            float target = musicVolume * (current != null ? duckMultiplier : 1f);
            float blend = 1f - Mathf.Exp(-Time.unscaledDeltaTime / Mathf.Max(0.01f, fadeSeconds));
            bgmSource.volume = Mathf.Lerp(bgmSource.volume, target, blend);
            voiceSource.volume = voiceVolume;
            sfxSource.volume = effectsVolume;
        }

        public VoiceTicket Speak(AudioClip clip, bool rememberAsInstruction = false)
        {
            var ticket = new VoiceTicket();
            if (clip == null || !isActiveAndEnabled) { ticket.IsFinished = true; return ticket; }
            if (rememberAsInstruction) { lastInstruction = clip; lastCaption = null; }
            queue.Enqueue(new Request { clip = clip, ticket = ticket });
            if (worker == null) worker = StartCoroutine(ProcessQueue());
            return ticket;
        }

        private IEnumerator ProcessQueue()
        {
            // Garante que a referência da coroutine seja atribuída antes de terminar.
            yield return null;
            while (queue.Count > 0)
            {
                current = queue.Dequeue();
                current.onStart?.Invoke();
                voiceSource.clip = current.clip;
                voiceSource.volume = voiceVolume;
                voiceSource.Play();
                while (voiceSource.isPlaying) yield return null;
                current.ticket.IsFinished = true;
                current = null;
            }
            worker = null;
        }

        public void RepeatLastInstruction()
        {
            // Toques repetidos não criam uma fila de falas idênticas.
            if (!IsVoiceBusy)
            {
                lastCaption?.Invoke();
                Speak(lastInstruction);
            }
        }

        public void SetInstruction(AudioClip clip) { lastInstruction = clip; }

        public void PlayMusic(AudioClip clip)
        {
            if (clip == null) { bgmSource.Stop(); return; }
            if (bgmSource.clip == clip && bgmSource.isPlaying) return;
            bgmSource.clip = clip;
            bgmSource.Play();
        }

        public void PlayEffect(AudioClip clip)
        {
            if (clip == null) return;
            sfxSource.volume = effectsVolume;
            sfxSource.PlayOneShot(clip);
        }

        // Use ao sair de uma missão para não carregar falas para a próxima cena.
        public void StopVoices()
        {
            if (worker != null) StopCoroutine(worker);
            worker = null;
            if (voiceSource != null) voiceSource.Stop();
            if (current != null) current.ticket.IsFinished = true;
            current = null;
            while (queue.Count > 0) queue.Dequeue().ticket.IsFinished = true;
            lastInstruction = null;
            lastCaption = null;
        }

        private void OnDisable()
        {
            if (Instance == this) StopVoices();
        }

        private void OnDestroy()
        {
            if (Instance == this) Instance = null;
        }
    }
}
