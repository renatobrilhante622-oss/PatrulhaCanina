using UnityEngine;
namespace PatrulhaCanina
{
    // Movimento lento; sem flashes ou deslocamentos bruscos.
    public sealed class GentleMotion : MonoBehaviour
    {
        private Vector3 origin;
        private float amplitude, speed, phase;
        public void Configure(float amount, float frequency, float offset)
        { origin = transform.localPosition; amplitude = amount; speed = frequency; phase = offset; }
        private void Update()
        { transform.localPosition = origin + Vector3.up * (Mathf.Sin(Time.unscaledTime*speed+phase)*amplitude); }
    }
}
