# 💑 Shared Life Hub - Dashboard Personal & De Pareja

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![PWA](https://img.shields.io/badge/PWA-Ready-success.svg)
![React](https://img.shields.io/badge/React-18-61DAFB.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3-38BDF8.svg)

> **Shared Life Hub** es una Aplicación Web Progresiva (PWA) moderna, colaborativa y con diseño **Clean Fintech** diseñada para gestionar finanzas personales y compartidas en pareja, seguimiento de hábitos y gestión de tareas en tiempo real.

🌐 **Demo En Vivo**: [https://dashboard-pareja.web.app/](https://dashboard-pareja.web.app/)

---

## ✨ Características Principales

- 💳 **Gestión Financiera & Cuentas Compartidas**:
  - Registro e historial de ingresos y gastos.
  - Visualización gráfica de gastos por categorías con **Chart.js** (`react-chartjs-2`).
  - Filtro por contexto: *Todo*, *Personal* (privado) y *Compartido* (sincronizado al instante).
- 🔒 **Autenticación y Vinculación por Código**:
  - Autenticación con **Firebase Auth**.
  - Generación de código único de pareja para vincular cuentas y compartir espacio.
- ⚡ **Tracker de Hábitos**:
  - Seguimiento de hábitos diarios con contador automático de rachas (*streaks*).
- 📋 **Tablero de Tareas**:
  - Lista interactiva de pendientes compartidos o individuales.
- 📱 **Progressive Web App (PWA)**:
  - Instalable en dispositivos iOS, Android y PC.
  - Funcionamiento offline básico mediante Service Workers (`vite-plugin-pwa`).

---

## 🛠️ Tecnologías Utilizadas

- **Frontend Core**: React 18, TypeScript, Vite.
- **Estilos & UI**: Tailwind CSS (Tema Clean Fintech / Modo claro y oscuro dinámico), Lucide Icons.
- **Visualizaciones**: Chart.js & React-Chartjs-2.
- **Backend / Realtime Database**: Firebase Auth & Cloud Firestore (SDK v10+ Modular).
- **PWA & Deployment**: Vite PWA Plugin, Firebase Hosting.

---

## 🚀 Desarrollo Local

1. Clona el repositorio:
   ```bash
   git clone https://github.com/TU_USUARIO/dashboard-pareja.git
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Ejecuta el servidor de desarrollo:
   ```bash
   npm run dev
   ```
4. Compila para producción:
   ```bash
   npm run build
   ```

---

## 📄 Licencia

Este proyecto se distribuye bajo la licencia MIT.
