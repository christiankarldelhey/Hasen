# 🐰 Hasen - Juego de Cartas Multijugador

Juego de cartas multijugador en tiempo real construido con Vue 3, TypeScript y Socket.IO.

## Características

- **Multijugador en tiempo real** con Socket.IO
- **Sistema de lobby** para crear y unirse a partidas
- **Mecánicas de juego completas**: turnos, apuestas, tricks y puntuación
- **Interfaz** con Vue 3, TypeScript, TailwindCSS y DaisyUI
- **Arquitectura limpia** con separación de dominio, lógica y presentación

## Stack Tecnológico

### Frontend
- Vue 3 + TypeScript
- Vite
- TailwindCSS + DaisyUI
- Socket.IO Client
- Pinia (state management)
- Vue Router

### Backend
- Node.js + Express
- TypeScript
- Socket.IO
- MongoDB + Mongoose
- CORS

## Desarrollo Local

### Requisitos
- Node.js 18+
- MongoDB (local o Atlas)

### Configuración

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/hasen.git
cd hasen
```

2. **Configurar Backend**
```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tus valores
npm run dev
```

3. **Configurar Frontend**
```bash
# En otra terminal, desde la raíz
npm install
cp .env.example .env
# Editar .env si es necesario
npm run dev
```

4. **Abrir en el navegador**
```
http://localhost:5173
```

## Estructura del Proyecto

```
hasen/
├── backend/          # Servidor Node.js + Express + Socket.IO
│   ├── src/
│   │   ├── config/   # Configuración (DB, etc)
│   │   ├── controllers/
│   │   ├── models/   # Modelos de MongoDB
│   │   ├── services/ # Lógica de negocio
│   │   ├── socket/   # Handlers de Socket.IO
│   │   └── server.ts
│   └── package.json
├── frontend/         # Cliente Vue 3
│   ├── src/
│   │   ├── assets/
│   │   ├── common/   # Composables y utilidades
│   │   ├── features/ # Componentes por feature
│   │   ├── stores/   # Pinia stores
│   │   └── main.ts
│   └── package.json
├── domain/           # Lógica de dominio compartida
│   ├── data/         # Definiciones de cartas y bids
│   ├── events/       # Eventos del juego
│   ├── interfaces/   # Tipos TypeScript
│   └── rules/        # Reglas del juego
└── package.json      # Root package.json
```

