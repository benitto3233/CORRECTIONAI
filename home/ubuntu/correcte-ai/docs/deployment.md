# Correcte-AI - Guide de déploiement

Ce document explique comment déployer l'application Correcte-AI en utilisant Docker et docker-compose.

## Prérequis

- Docker
- Docker Compose
- Git

## Étapes de déploiement

### 1. Cloner le dépôt

```bash
git clone https://github.com/votre-organisation/correcte-ai.git
cd correcte-ai
```

### 2. Configuration des variables d'environnement

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```
# Configuration du backend
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://mongodb:27017/correcte-ai
JWT_SECRET=votre-secret-jwt-securise

# Configuration du frontend
REACT_APP_API_URL=http://localhost:5000/api
```

### 3. Construire et démarrer les conteneurs

```bash
docker-compose up -d --build
```

Cette commande va construire les images Docker pour le frontend et le backend, puis démarrer les conteneurs.

### 4. Vérifier le déploiement

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

### 5. Arrêter les conteneurs

```bash
docker-compose down
```

## Structure des conteneurs

- **Frontend**: Serveur Nginx servant l'application React compilée
- **Backend**: Serveur Node.js exécutant l'API Express
- **MongoDB**: Base de données pour stocker les données de l'application

## Persistance des données

Les données MongoDB sont stockées dans un volume Docker nommé `mongodb-data`, ce qui garantit que les données persistent même après l'arrêt des conteneurs.

## Déploiement en production

Pour un déploiement en production, il est recommandé de :

1. Utiliser un service de base de données géré (MongoDB Atlas, AWS DocumentDB, etc.)
2. Configurer HTTPS avec des certificats SSL
3. Mettre en place un système de surveillance et de journalisation
4. Configurer un système de sauvegarde automatique

## Dépannage

### Problèmes courants

- **Le frontend ne peut pas se connecter au backend** : Vérifiez que la variable d'environnement `REACT_APP_API_URL` est correctement configurée.
- **Le backend ne peut pas se connecter à MongoDB** : Vérifiez que la variable d'environnement `MONGODB_URI` est correcte.

### Logs des conteneurs

Pour voir les logs d'un conteneur spécifique :

```bash
docker-compose logs frontend
docker-compose logs backend
docker-compose logs mongodb
```