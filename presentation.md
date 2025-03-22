# Correcte-AI - Présentation du Projet

## Aperçu

Correcte-AI est une application SaaS innovante conçue pour les enseignants K-12, permettant de noter automatiquement les travaux manuscrits des élèves grâce à l'intelligence artificielle. Cette solution combine des technologies OCR avancées et des modèles de langage pour extraire le texte des documents manuscrits, les évaluer selon des critères spécifiques, et fournir des retours détaillés.

## Fonctionnalités Clés

### Tableau de Bord Intuitif
- Vue d'ensemble des statistiques importantes (travaux notés, notes moyennes)
- Accès rapide aux tâches en cours et récemment complétées
- Interface moderne et réactive inspirée de StarGrader

### Notation Automatique
- Téléchargement facile des travaux manuscrits (images, PDF)
- Extraction de texte via OCR de pointe
- Notation automatique basée sur des rubriques personnalisables
- Feedback détaillé généré par IA

### Création de Matériel Pédagogique
- Génération de devoirs, examens et rubriques personnalisés
- Options pour différents types de questions
- Adaptation au niveau scolaire et à la matière

### Gestion Flexible
- Exportation des notes au format CSV/Excel
- Intégration possible avec les systèmes LMS existants
- Configuration personnalisée des fournisseurs d'IA

## Architecture Technique

### Frontend
- React avec Material UI pour une interface moderne
- Composants modulaires et réutilisables
- Routage avec React Router

### Backend
- Node.js et Express pour l'API RESTful
- MongoDB pour le stockage des données
- JWT pour l'authentification sécurisée

### Services d'IA
- Support pour multiples fournisseurs d'IA (OpenAI, Google Gemini, Anthropic, Deepseek)
- Services OCR flexibles (Mistral OCR, Google Cloud Vision)
- Prompts optimisés pour la notation éducative

### Déploiement
- Conteneurisation avec Docker
- Configuration Docker Compose pour un déploiement simplifié
- Documentation détaillée pour l'installation et la maintenance

## Avantages pour les Enseignants

- **Gain de temps considérable** : Réduction du temps consacré à la notation manuelle
- **Cohérence** : Application uniforme des critères de notation
- **Feedback enrichi** : Commentaires détaillés générés automatiquement
- **Flexibilité** : Fonctionne avec différents types de travaux et matières
- **Simplicité** : Interface intuitive ne nécessitant pas de compétences techniques

## Perspectives d'Évolution

- Intégration avec davantage de systèmes LMS
- Amélioration continue des modèles d'IA via le feedback des utilisateurs
- Fonctionnalités collaboratives pour les équipes pédagogiques
- Analyses avancées des performances des élèves
- Support pour des langues et formats supplémentaires

## Conclusion

Correcte-AI représente une solution complète et innovante pour moderniser le processus de notation dans l'éducation K-12. En combinant des technologies d'IA de pointe avec une interface utilisateur intuitive, l'application permet aux enseignants de se concentrer davantage sur l'enseignement et moins sur les tâches administratives, tout en fournissant des retours de qualité aux élèves.
