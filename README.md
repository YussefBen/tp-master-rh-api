# TP Master : Système de Pilotage RH (API REST & Design Patterns)

Ce dépôt contient l'ensemble des livrables demandés pour le TP d'architecture logicielle. Le projet est réalisé avec **Next.js 14 (App Router)**, **Prisma ORM** et **MySQL**.

---

## 📂 Localisation des Livrables

Voici la correspondance entre les éléments demandés et l'architecture du projet :

| Livrable demandé | Emplacement dans le projet | Description |
| :--- | :--- | :--- |
| **1. Schéma BDD** | `prisma/schema.prisma` | Modèle complet incluant les tables `employees`, `titles`, `salaries`, etc., + la table `User` pour l'auth. |
| **2. Routes API** | `app/api/` | Contient les dossiers `login`, `stats`, `employees` et `export`. |
| **3. Proxy (Protection)** | `proxy.ts` | Fichier à la racine. Intercepte les requêtes pour vérifier le JWT et le rôle Admin. |
| **4. Doc Design Pattern** | `README.md` | Voir la section détaillée ci-dessous. |

---

## 🧠 Implémentation du Design Pattern : Strategy (Bonus)

Pour répondre au besoin d'export flexible des salaires (JSON, CSV, et potentiellement XML ou PDF à l'avenir), j'ai implémenté le **Strategy Pattern**.

### 1. La Problématique
L'utilisation de multiples conditions `if (type === 'csv') ... else if (type === 'json')` dans le contrôleur viole le principe **Open/Closed** (SOLID). Ajouter un format demanderait de modifier le code de la route, augmentant le risque de bugs.

### 2. La Solution Architecturale
J'ai isolé la logique de formatage dans des classes dédiées interchangeables.

Le code se trouve dans : `app/api/export/route.ts`

#### A. L'Interface (L'Abstraction)
J'ai défini une interface commune que toutes les stratégies doivent respecter :
```typescript
interface ExportStrategy {
  generate(data: any[]): string;    
  getContentType(): string;          
}