# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fire Banking Performance Calculator - A React TypeScript application for tracking marketing performance metrics including lead generation, sales funnel performance, and SDR activity. Used by 3 team members to calculate and track KPIs with automatic Google Sheets export functionality.

## Development Commands

- `npm run dev` - Start development server (http://localhost:5173/)
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint (if configured)

## Architecture

**Stack:** React 18 + TypeScript + Vite + Tailwind CSS

**Key Components:**
- `App.tsx` - Main calculator interface with input fields and KPI calculations
- `hooks/useCalculationHistory.ts` - History management with localStorage and CSV export
- `types.ts` - TypeScript interfaces for calculation data

**Key Features:**
- Real-time KPI calculations (CPL, MQL conversion, SDR activity)
- Target status indicators (CPL ≤ R$40, MQL ≥ 30%, Desqualificados ≤ 15%)
- Calculation history with localStorage persistence
- CSV export for Google Sheets integration
- Brazilian Portuguese localization (pt-BR)

## Key Calculations

- **CPL** (Cost Per Lead): Orçamento / Qtd Leads
- **MQL%** (Marketing Qualified Lead): MQL / Qtd Leads  
- **Desqualificados%**: Desqualificados / Qtd Leads
- **No-show**: Reuniões Marcadas - Reuniões Acontecidas
- **SDR Connectivity**: Reuniões Marcadas / MQL

## Deployment

Deploy as static site to Vercel/Netlify for easy team access across devices.