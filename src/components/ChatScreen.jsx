import { useState } from 'react';

const RESPONSES = [
  "¡Qué buena pregunta! Recuerda que cada tipo de piel es único y merece cuidado personalizado. 💕",
  "Para cuidar tu piel, la constancia es más importante que usar muchos productos. Empieza con lo básico: limpieza, hidratación y protector solar. ☀️",
  "Los colores que mejor te quedan dependen de tu subtono. ¿Ya hiciste el test de colorimetría? Te ayudará mucho. 🎨",
  "El visagismo nos enseña que no hay forma de rostro 'mala'. Cada una tiene su belleza y estrategias para resaltarla. ✨",
  "¡Recuerda tomar agua! La hidratación interna se refleja en tu piel. Intenta llegar a 2 litros diarios. 💧",
];

export default function ChatScreen({ onBack }) {
  const [msgs, setMsgs] = useState([
    { from: 'lumina', text: '¡Hola! Soy Lumina, tu asistente de belleza. 🌸 ¿En qué puedo ayudarte hoy?' }
  ]);
  const [input, setInput] = useState('');

  const send = () => {
    if (!input.trim()) return;
    const userMsg = { from: 'user', text: input.trim() };
    const botMsg = { from: 'lumina', text: RESPONSES[Math.floor(Math.random() * RESPONSES.length)] };
    setMsgs(prev => [...prev, userMsg]);
    setInput('');
    setTimeout(() => setMsgs(prev => [...prev, botMsg]), 800);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)' }}>
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10, background: 'white', borderBottom: '1px solid var(--border)' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text)' }}>←</button>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✨</div>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>Lumina</h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--green)' }}>En línea</p>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '16px 16px' }}>
        {msgs.map((m, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: m.from === 'user' ? 'flex-end' : 'flex-start',
            marginBottom: 10,
          }}>
            <div style={{
              maxWidth: '80%', padding: '12px 16px', borderRadius: 18,
              background: m.from === 'user' ? 'linear-gradient(135deg, var(--pink-light), var(--pink))' : 'white',
              color: m.from === 'user' ? 'white' : 'var(--text)',
              fontFamily: "'DM Sans', sans-serif", fontSize: 14, lineHeight: 1.5,
              boxShadow: m.from === 'lumina' ? 'var(--shadow)' : 'none',
              borderBottomRightRadius: m.from === 'user' ? 4 : 18,
              borderBottomLeftRadius: m.from === 'lumina' ? 4 : 18,
            }}>{m.text}</div>
          </div>
        ))}
      </div>

      <div style={{
        padding: '12px 16px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
        background: 'white', borderTop: '1px solid var(--border)',
        display: 'flex', gap: 10,
      }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Escribe tu pregunta..."
          style={{
            flex: 1, padding: '12px 16px', borderRadius: 24,
            border: '1px solid var(--border)', fontFamily: "'DM Sans', sans-serif",
            fontSize: 14, outline: 'none', background: 'var(--bg)',
          }}
        />
        <button onClick={send} style={{
          width: 44, height: 44, borderRadius: '50%', border: 'none',
          background: 'linear-gradient(135deg, var(--pink-light), var(--pink))',
          color: 'white', fontSize: 18, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>→</button>
      </div>
    </div>
  );
}
