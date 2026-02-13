# ✨ Lumina — App de Belleza con IA

App de belleza y autocuidado con análisis facial en tiempo real (MediaPipe), colorimetría y diagnóstico de piel.

## Módulos
- 📸 **Análisis Facial** — MediaPipe 478 landmarks → forma de rostro + recomendaciones
- 🎨 **Colorimetría** — Quiz subtono frío/cálido/neutro + paleta de colores
- 💧 **Test de Piel** — Diagnóstico + rutina + vitaminas
- 💕 **Amor Propio** — Afirmaciones + versículos bíblicos
- 💬 **Chat con Lumina**

## 🚀 Deploy (GitHub + Vercel)

### 1. Crear repo en GitHub
- [github.com/new](https://github.com/new) → nombre: `lumina-app` → Create

### 2. Subir código
```bash
cd lumina-app
git init
git add .
git commit -m "Lumina v1"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/lumina-app.git
git push -u origin main
```

### 3. Conectar Vercel
1. [vercel.com](https://vercel.com) → Sign up con GitHub
2. "Add New Project" → importar `lumina-app`
3. Click Deploy → listo en ~60s

### 4. Probar en iPhone
1. Safari → tu URL de Vercel
2. Compartir (⬆️) → "Agregar a pantalla de inicio"
3. Abrir → Tests → Análisis Facial → permitir cámara

## 💻 Dev Local
```bash
npm install
npm run dev
```

> Cámara requiere `localhost` o `https://`

## Fuentes Técnicas
- Google MediaPipe Face Landmarker (478 3D landmarks)
- Faciometrics: Orofacial Harmonization (2020)
- CalState 3D Face Shape Classification thesis
- Philip Hallawell Visagismo method
- Fitzpatrick Skin Phototype Scale (1988)
- Baumann Skin Type Indicator (2006)
