# 🛍️ Marketplace Vêtements

Un projet full-stack (Backend + Frontend) pour une marketplace de vêtements.

---

## 🚀 Avancement V1

| Étape | Statut |
|-------|--------|
| 🏗️ Mise en place architecture | ✅ OK |
| ⚙️ Implémentation Backend | ✅ OK |
| 💻 Implémentation Frontend | ✅ OK |

---

## 🧱 Prérequis

Avant de démarrer, assurez-vous d’avoir installé :
- **Docker** (pour PostgreSQL & Minio)
- **pnpm** (gestionnaire de paquets)
- **Node.js** (v18+)

---

## 🗄️ Base de données : PostgreSQL

### 1️⃣ Lancer PostgreSQL via Docker

```bash
docker run --name postgresqldev   -e POSTGRES_PASSWORD=password   -e POSTGRES_USER=root   -p 5432:5432   -d postgres
```

### 2️⃣ Créer la base et l’utilisateur

Connectez-vous à PostgreSQL :

```sql
CREATE DATABASE marketplace_dev;
CREATE USER marketplace WITH PASSWORD 'marketplace123';
GRANT ALL PRIVILEGES ON DATABASE marketplace_dev TO marketplace;
```

### 3️⃣ Créer le schéma

```sql
\c marketplace_dev root
CREATE SCHEMA marketplace_schema;
GRANT ALL ON SCHEMA marketplace_schema TO marketplace;
\dn+ marketplace_schema
```

---

## ☁️ Stockage : Minio

### Lancer Minio via Docker

```bash
docker pull minio/minio
docker run --name miniodev   -p 9000:9000 -p 9001:9001   -e MINIO_ROOT_USER=minioadmin   -e MINIO_ROOT_PASSWORD=minioadmin123   minio/minio server /data --console-address ":9001"
```

### Accès à la console

👉 [http://127.0.0.1:9001/browser](http://127.0.0.1:9001/browser)

---

## ⚡ Quickstart

### 🏗️ Environnement de production

```bash
# Installer les dépendances
pnpm install

# Builder le projet (API + Web)
pnpm build

# Configuration initiale de la base
pnpm setup-db

# Démarrer les serveurs : Environnement de développement (local) (Redemarre a chaque modif)
pnpm dev

# Démarrer les serveurs : Environnement de production (prod)
pnpm start
```

---

## 🧪 Tests de base (API)

### Vérifier le fonctionnement du serveur :

```bash
pnpm dev:api
```

Puis ouvrez dans le navigateur :

- [http://localhost:3001/health](http://localhost:3001/health) → retourne `Ok`

---

## 👤 Test création d’utilisateur

```bash
curl -X POST http://localhost:3001/auth/register   -H "Content-Type: application/json"   -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

---

## 🧰 Commandes disponibles

| Commande | Description |
|-----------|-------------|
| `pnpm dev` | Lance le backend et le frontend en mode développement |
| `pnpm dev:api` | Lance uniquement l’API |
| `pnpm dev:web` | Lance uniquement le frontend |
| `pnpm build` | Construit le backend et le frontend |
| `pnpm start` | Démarre les serveurs en mode production |
| `pnpm setup-db` | Exécute les migrations et remplit la base de test |
| `pnpm migrate` | Applique les migrations |
| `pnpm seed` | Remplit la base avec des données de test |
| `pnpm populate` | Ajoute des données additionnelles (ex: produits, images) |
| `pnpm clean-db` | Vide complètement la base |
| `pnpm clean` | Supprime les dossiers node_modules et fichiers temporaires |
| `pnpm clean:all` | Nettoyage complet du projet (⚠️ root inclus) |

---

## 🧩 Installation d’une nouvelle librairie

Pour installer une dépendance dans le monorepo :  
Accedez au repertoire apps/api ou apps/web et executer :

```bash
pnpm add express-rate-limit
```

---

## 🔄 Ordre d’utilisation conseillé

1. `pnpm setup-db` → Crée et initialise la base  
2. Démarrer le projet avec `pnpm dev` ou `pnpm start` 
3. Créer un compte utilisateur depuis API (`/auth/register`) ou interface WEB
4. `pnpm populate` → Active le compte utilisateur & Ajoute les données de test (catégories, produits, etc.)  

---

## ✅ Vérification finale

- Backend accessible sur : **http://localhost:3001**
- Frontend accessible sur : **http://localhost:3000**
- Console Minio : **http://127.0.0.1:9001**

---

🧑‍💻 **Auteur :** Projet Marketplace-Vêtements  
📅 **Version :** 1.0.0  
📦 **Stack :** Node.js · Express · React · PostgreSQL · Minio
