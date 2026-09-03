// Instance isolée du Contexte de Langue
// Conforme aux règles Fast Refresh de Vite et à la modularité de l'architecture
import { createContext } from 'react';

export const LanguageContext = createContext(null);
