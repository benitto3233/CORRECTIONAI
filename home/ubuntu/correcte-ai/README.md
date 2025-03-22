# Correcte-AI

Correcte-AI est une application SaaS conçue pour aider les enseignants K-12 à noter automatiquement les travaux manuscrits des élèves grâce à l'intelligence artificielle.

## À propos du projet

Cette application combine des technologies OCR avancées et des modèles de langage pour extraire le texte des documents manuscrits, les évaluer selon des critères spécifiques, et fournir des retours détaillés.

## Fonctionnalités principales

- Tableau de bord intuitif avec statistiques et analyses
- Notation automatique des travaux manuscrits
- Génération de matériel pédagogique personnalisé
- Exportation des notes et intégration avec les LMS
- Configuration flexible des API d'IA

## Structure du projet

```
correcte-ai/
├── frontend/               # Application React
│   ├── src/
│   │   ├── components/     # Composants réutilisables
│   │   ├── pages/          # Pages de l'application
│   │   ├── services/       # Services pour les appels API
│   │   └── App.jsx         # Composant racine
│   ├── tests/              # Tests frontend
│   └── Dockerfile          # Configuration Docker pour le frontend
│
├── backend/                # API Node.js/Express
│   ├── src/
│   │   ├── models/         # Modèles Mongoose
│   │   ├── routes/         # Routes API
│   │   ├── services/       # Services d'IA et utilitaires
│   │   ├── middleware/     # Middleware Express
│   │   └── server.js       # Point d'entrée du serveur
│   ├── tests/              # Tests backend
│   └── Dockerfile          # Configuration Docker pour le backend
│
├── docs/                   # Documentation
├── docker-compose.yml      # Configuration Docker Compose
└── README.md               # Documentation principale
```

## Plan d'amélioration

Nous suivons un plan d'amélioration structuré en trois phases :

1. **Phase 1 : Fondations** - Améliorations critiques de sécurité, performances et expérience utilisateur
2. **Phase 2 : Expansion** - Fonctionnalités collaboratives, optimisation commerciale et API
3. **Phase 3 : Innovation** - IA adaptative, applications mobiles et marketplace d'extensions

Voir le fichier `plan_amelioration.md` pour plus de détails.

## Branches de développement

- `main` - Branche principale stable
- `ux-improvements` - Améliorations de l'expérience utilisateur
- `technical-optimization` - Optimisations des performances techniques
- `new-functionality` - Développement de nouvelles fonctionnalités
- `security-enhancements` - Renforcement de la sécurité et conformité
- `metrics-implementation` - Implémentation des métriques commerciales

## Installation et déploiement

Instructions à venir.

## Licence

Propriétaire - Tous droits réservés
