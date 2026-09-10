<div align="center">

# 🍽️ Cartaya

**Sistema de gestión de restaurante con pedidos por QR**

[![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2024-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/es/docs/Web/JavaScript)
[![OpenSpec](https://img.shields.io/badge/OpenSpec-API--First-blue)](https://github.com)

</div>

---

## ¿Qué es Cartaya?

Cartaya es un **sistema de gestión integral para restaurantes y locales de comidas/desayunos** que permite a los clientes pedir desde su mesa escaneando un código QR, y al equipo de cocina y camareros gestionar los pedidos en tiempo real.

---

## ¿Cómo funciona?

| Rol | Qué hace |
|-----|----------|
| **Cliente** | Escanea el QR de su mesa → ve la carta → hace su pedido directamente desde el móvil |
| **Cocina** | Ve los pedidos pendientes → puede dar de baja platos sin stock |
| **Camarero** | Ve qué platos llevar a cada mesa → gestiona el servicio |

```
Cliente (QR)  ──→  Pedidos  ──→  Cocina (gestión de stock)
                     │
                     └──→  Camarero (qué llevar a qué mesa)
```

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| **Backend** | Node.js |
| **Frontend** | Aplicación web |
| **API** | Contratos OpenSpec (API-first) |
| **Testing** | Suite de tests |
| **Flujo de trabajo** | Claude Code + SDD |

---

## Estructura del proyecto

```
cartaya/
├── server/            # Backend: API, lógica de negocio, gestión de stock
├── web/               # Frontend: interfaz de cliente (QR), cocina y camareros
├── tests/             # Suite de tests
├── openspec/          # Contratos de API (API-first)
└── .claude/           # Configuración para asistente de IA
```

---

## Funcionalidades principales

- 📱 **Pedido por QR**: el cliente escanea, ve la carta y pide desde su móvil
- 🍳 **Gestión de cocina**: la cocina ve los pedidos en tiempo y puede anular platos sin stock
- 🍷 **Gestión de camareros**: cada camarero ve su asignación de mesas y qué platos llevar
- 📊 **Control de stock**: baja automática de platos cuando no hay producto
- ⚡ **Tiempo real**: pedidos, actualizaciones y notificaciones al instante

---

## Metodología

Cartaya se desarrolla con un enfoque **API-first** usando OpenSpec, definiendo los contratos de comunicación antes de la implementación.

---

## Instalación y desarrollo

```bash
# Clonar
git clone https://github.com/JoseManuelVeraGordillo/cartaya.git
cd cartaya

# Backend
cd server
npm install
npm run dev

# Frontend (en otra terminal)
cd ../web
npm install
npm run dev
```

---

## Caso de uso real

Pensado para **pequeños locales de comidas y desayunos** que quieren:
- Eliminar colas en la barra para pedir
- Dar más autonomía al cliente
- Reducir errores en los pedidos
- Tener control en tiempo real de lo que se sirve y lo que hay

---

## Autor

[José Manuel Vera Gordillo](https://github.com/JoseManuelVeraGordillo)
