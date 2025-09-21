# marketplace-vetements

Avancement V1 :
Mise en place architecture : OK
Implémentation Backend : OK
Implémentation Frontend (Initiatlisation): OK

## Prerequisites

- Lancer PostgreSQL sous docker ou autre

docker run --name postgresqldev -e POSTGRES_PASSWORD=password -e POSTGRES_USER=root -p 5432:5432 -d postgres

- Lancer Minio

docker pull minio/minio

docker run --name miniodev -p 9000:9000 -p 9001:9001 -e MINIO_ROOT_USER=minioadmin -e MINIO_ROOT_PASSWORD=minioadmin123 minio/minio server /data --console-address ":9001"

Test connexion ok sous :

http://127.0.0.1:9001/browser

## Configuration bdd 

- Créer la base de données et l'utilisateur (as root)

CREATE DATABASE marketplace_dev;
CREATE USER marketplace WITH PASSWORD 'marketplace123';
GRANT ALL PRIVILEGES ON DATABASE marketplace_dev TO marketplace;

- Créer schema (as root)

\c marketplace_dev root
You are now connected to database "marketplace_dev" as user "root".

CREATE SCHEMA marketplace_schema;
GRANT ALL ON SCHEMA marketplace_schema TO marketplace;
\dn+ marketplace_schema

## Premier test de la base de données

Test script de connection & creation & remplissage base de données

```bash

marketplace-vetements> pnpm migrate
marketplace-vetements> pnpm seed

```

## Test minimal avec serveur simple

Test script de fonctionnement api basique

PS C:\Users\omarl\Desktop\projects\marketplace-vetements> pnpm dev:api

Sous naviguateur 
http://localhost:3001/health
Nous retourne Ok ...

Sous naviguateur
http://localhost:3001/test-categories
Nous retourne des categories

## Test Implémentation backend : API creation  utilisateur 

Dans un nouveau terminal :

curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'

## Quickstart

```bash

# Build packages Frontend & API
pnpm build

# Setup database & creation & remplissage
pnpm setup-db

# Start Frontend & API
pnpm dev

```