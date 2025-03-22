# Guide d'utilisation - Correcte-AI

## Introduction

Bienvenue dans Correcte-AI, votre assistant de notation alimenté par l'intelligence artificielle. Cette application est conçue pour aider les enseignants K-12 à noter automatiquement les travaux manuscrits des élèves, créer du matériel pédagogique et gérer efficacement les devoirs et examens.

## Table des matières

1. [Premiers pas](#premiers-pas)
2. [Tableau de bord](#tableau-de-bord)
3. [Notation des travaux](#notation-des-travaux)
4. [Création de matériel pédagogique](#création-de-matériel-pédagogique)
5. [Gestion des paramètres](#gestion-des-paramètres)
6. [Exportation des notes](#exportation-des-notes)
7. [Dépannage](#dépannage)

## Premiers pas

### Création de compte

1. Accédez à l'application via l'URL fournie par votre administrateur
2. Cliquez sur "S'inscrire" et remplissez le formulaire avec vos informations
3. Vérifiez votre email et suivez les instructions pour activer votre compte
4. Connectez-vous avec vos identifiants

### Configuration initiale

Avant de commencer à utiliser les fonctionnalités d'IA, vous devez configurer vos clés API :

1. Accédez à la page "Paramètres" depuis le menu latéral
2. Dans la section "Configuration des API d'IA", ajoutez au moins une clé API
3. Vous pouvez obtenir des clés API auprès des fournisseurs suivants :
   - OpenAI: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - Google Gemini: [https://ai.google.dev/](https://ai.google.dev/)
   - Anthropic: [https://console.anthropic.com/](https://console.anthropic.com/)
   - Mistral OCR: [https://mistral.ai/](https://mistral.ai/)

## Tableau de bord

Le tableau de bord est votre point de départ dans l'application. Il affiche :

- Un résumé de vos statistiques (nombre de devoirs notés, note moyenne, etc.)
- Vos tâches à faire
- Les travaux récemment notés
- Les matériels récemment créés

### Création d'un nouvel élément

Pour créer un nouveau devoir, examen ou rubrique :

1. Cliquez sur le bouton "Nouveau" en haut à gauche
2. Choisissez entre "Noter" ou "Créer du matériel"
3. Suivez les instructions spécifiques à l'option choisie

## Notation des travaux

La fonctionnalité de notation automatique vous permet de noter rapidement les travaux manuscrits des élèves.

### Étape 1 : Téléchargement des fichiers

1. Accédez à la page "Notation" depuis le menu latéral ou en cliquant sur "Noter" dans la fenêtre "Nouveau"
2. Téléchargez les fichiers nécessaires :
   - **Questionnaire** : Le document contenant les questions du devoir ou de l'examen
   - **Soumissions des élèves** : Les travaux manuscrits à noter (formats acceptés : JPG, PNG, PDF)
   - **Solutions** (optionnel) : Le corrigé ou les solutions du devoir
   - **Rubrique** (optionnel) : Une rubrique de notation existante

### Étape 2 : Instructions de notation

1. Ajoutez des instructions spécifiques pour personnaliser la notation
2. Vous pouvez préciser :
   - Le style de notation souhaité
   - Les critères importants
   - L'échelle de notation
   - Les points partiels à accorder
   - Le ton des commentaires de feedback

### Étape 3 : Notation automatique

1. Cliquez sur "Commencer la notation"
2. L'IA analysera les soumissions et appliquera les critères de notation
3. Une fois le processus terminé, vous pourrez consulter les résultats

### Révision des notes

Après la notation automatique, vous pouvez :

1. Consulter les notes attribuées à chaque élève
2. Lire les commentaires générés par l'IA
3. Ajuster manuellement les notes si nécessaire
4. Ajouter vos propres commentaires

## Création de matériel pédagogique

Cette fonctionnalité vous permet de générer rapidement des devoirs, examens ou rubriques.

### Création d'un devoir ou examen

1. Accédez à la page "Créer du matériel" depuis le menu latéral ou en cliquant sur "Créer du matériel" dans la fenêtre "Nouveau"
2. Remplissez les champs suivants :
   - **Titre** : Donnez un titre à votre matériel
   - **Type de devoir** : Choisissez entre Devoir, Examen ou Rubrique
   - **Sélection des questions** (pour les examens) : Choisissez les types de questions à inclure
3. Ajoutez des instructions détaillées sur le sujet et les objectifs
4. Cliquez sur "Générer"

### Personnalisation du matériel généré

Une fois le matériel généré, vous pouvez :

1. Modifier les questions ou instructions
2. Ajuster le barème de notation
3. Ajouter ou supprimer des sections
4. Enregistrer le matériel pour une utilisation future

## Gestion des paramètres

La page Paramètres vous permet de personnaliser votre expérience.

### Configuration des API d'IA

1. Ajoutez, modifiez ou supprimez des clés API
2. Activez ou désactivez des fournisseurs d'IA
3. Définissez votre modèle d'IA préféré pour la notation et la génération

### Préférences de notation

1. Choisissez votre format d'exportation préféré (CSV, Excel, JSON, PDF)
2. Configurez les paramètres de notation par défaut

### Intégration LMS

Si votre établissement utilise un système de gestion d'apprentissage (LMS) :

1. Sélectionnez votre LMS (Canvas, Blackboard, Moodle, Google Classroom)
2. Entrez l'URL de votre LMS
3. Configurez la clé d'API du LMS
4. Cliquez sur "Connecter" pour établir l'intégration

## Exportation des notes

Après avoir noté des travaux, vous pouvez exporter les résultats.

### Exportation au format CSV

1. Accédez à la page des soumissions d'un devoir
2. Cliquez sur "Exporter les notes"
3. Sélectionnez le format CSV
4. Téléchargez le fichier généré

### Synchronisation avec un LMS

Si vous avez configuré une intégration LMS :

1. Accédez à la page des soumissions d'un devoir
2. Cliquez sur "Synchroniser avec LMS"
3. Vérifiez les données à synchroniser
4. Confirmez la synchronisation

## Dépannage

### Problèmes courants

#### L'OCR ne fonctionne pas correctement

- Assurez-vous que les images sont nettes et bien éclairées
- Vérifiez que vous avez configuré une clé API valide pour l'OCR
- Essayez de convertir les PDF en images si l'extraction de texte échoue

#### La notation automatique donne des résultats incorrects

- Fournissez des instructions de notation plus détaillées
- Téléchargez une rubrique claire avec des critères bien définis
- Vérifiez que le texte extrait par l'OCR est correct

#### Problèmes de connexion

- Vérifiez vos identifiants
- Assurez-vous que votre compte est activé
- Contactez votre administrateur si le problème persiste

### Contacter le support

Si vous rencontrez des problèmes non résolus, contactez le support technique :

- Email : support@correcte-ai.com
- Formulaire de contact : disponible dans l'application sous "Aide > Contacter le support"