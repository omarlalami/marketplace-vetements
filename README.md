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
# download image
docker pull postgres:18
# start an independant container
docker run --name postgresqldev   -e POSTGRES_PASSWORD=password   -e POSTGRES_USER=root   -p 5432:5432   -d postgres:18
```

### 2️⃣ Créer la base et l’utilisateur

Connectez-vous à PostgreSQL (executed from a terminal) :

```bash
# one-liner that drops you directly into a PostgreSQL shell inside the container 
docker exec -it postgresqldev psql -U root -d postgres
```

```sql
CREATE DATABASE marketplace_dev;
CREATE USER marketplace WITH PASSWORD 'marketplace123';
GRANT ALL PRIVILEGES ON DATABASE marketplace_dev TO marketplace;
\c marketplace_dev
GRANT ALL ON SCHEMA public TO marketplace;
ALTER SCHEMA public OWNER TO marketplace;
```

### 3️⃣ Usefull commande

```sql
--montrer les bases de donnee 
\l

--se connecter a une base
\c marketplace_dev

--se connecter a une base en tant que
\c marketplace_dev marketplace
\c marketplace_dev root

--montrer les tables
\dt

--montrer droit sur un schema
\dn+ marketplace_schema

--quitter
\q
```

---

## ☁️ Stockage : Minio

### Lancer Minio via Docker

```bash
docker pull minio/minio:RELEASE.2025-09-07T16-13-09Z
docker run --name miniodev   -p 9000:9000 -p 9001:9001   -e MINIO_ROOT_USER=minioadmin   -e MINIO_ROOT_PASSWORD=minioadmin123  -d minio/minio:RELEASE.2025-09-07T16-13-09Z server /data --console-address ":9001"
```

### Accès à la console

👉 Web Console Minio : **http://localhost:9001**  
👉 API Minio: http://localhost:9000

---

## ⚡ Quickstart

### 🏗️ Environnement de production / dev

Executer dans rep \marketplace-vetements>

```bash
# Installer les dépendances
pnpm install

# Builder le projet (API + Web)
pnpm build

# Configuration initiale de la base
pnpm setup-db

# Cree un compte  vendeur & Ajoute les données de test (catégories, produits, etc.)
pnpm populate

# Démarrer les serveurs : Environnement de développement (local) (Redemarre a chaque modif)
pnpm dev

# Démarrer les serveurs : Environnement de production (prod)
pnpm start
```

---

## 🧪 Tests de base (API)

### Vérifier le fonctionnement du serveur :

Dans un navigateur :

- [http://localhost:3001/health](http://localhost:3001/health) → retourne `Ok`

Dans un terminal :

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

## ✅ Vérification finale

- Backend accessible sur : **http://localhost:3001**
- Frontend accessible sur : **http://localhost:3000**
- Exising account to connect to : user : admin@admin.com  password : admin@admin.com

---

🧑‍💻 **Auteur :** Projet Marketplace-Vêtements  
📅 **Version :** 1.0.0  
📦 **Stack :** Node.js · Express · React · PostgreSQL · Minio
