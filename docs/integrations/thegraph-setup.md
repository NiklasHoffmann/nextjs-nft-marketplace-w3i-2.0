# Lokaler Graph Node Setup (Docker)

## Voraussetzungen
- Docker installiert
- Node.js installiert
- Subgraph-Konfiguration (subgraph.yaml, Mapping, ABIs)
- Ethereum Node URL (Infura, Alchemy, lokal)

## Verzeichnisstruktur
Lege einen Ordner für deinen Subgraph an, z. B. `subgraph/` im Projekt.

## Docker Compose Datei
Erstelle im Projekt-Root eine Datei `docker-compose.graph-node.yml`:

```yaml
version: '3'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: graph-node
      POSTGRES_PASSWORD: letmein
      POSTGRES_DB: graph-node
    ports:
      - '5432:5432'
    volumes:
      - pgdata:/var/lib/postgresql/data
  ipfs:
    image: ipfs/kubo:v0.24.0
    ports:
      - '5001:5001'
      - '8080:8080'
      - '4001:4001'
  graph-node:
    image: graphprotocol/graph-node:v0.34.0
    environment:
      postgres_host: postgres
      postgres_user: graph-node
      postgres_pass: letmein
      postgres_db: graph-node
      ipfs: 'ipfs:5001'
      ethereum: 'mainnet:<DEINE_ETH_NODE_URL>'
      GRAPH_LOG: info
    ports:
      - '8000:8000'
      - '8001:8001'
      - '8020:8020'
      - '8030:8030'
      - '8040:8040'
    depends_on:
      - postgres
      - ipfs
volumes:
  pgdata:
```

## Subgraph deployen
- Navigiere in deinen Subgraph-Ordner.
- Installiere die Graph CLI:
  `npm install -g @graphprotocol/graph-cli`
- Erstelle und deploye den Subgraph:
  ```powershell
  graph codegen
  graph build
  graph create <SUBGRAPH_NAME> --node http://localhost:8020
  graph deploy <SUBGRAPH_NAME> --node http://localhost:8020 --ipfs http://localhost:5001
  ```

## Docker starten
Im Projekt-Root:
```powershell
docker compose -f docker-compose.graph-node.yml up
```

## Endpunkte
- GraphQL HTTP: http://localhost:8000/subgraphs/name/<SUBGRAPH_NAME>
- GraphQL WS: ws://localhost:8000/subgraphs/name/<SUBGRAPH_NAME>

## .env.local Beispiel
```
GRAPH_HTTP_URL=http://localhost:8000/subgraphs/name/<SUBGRAPH_NAME>
GRAPH_WS_URL=ws://localhost:8000/subgraphs/name/<SUBGRAPH_NAME>
USE_GRAPH_SUBSCRIPTIONS=true
```

## Hinweise
- Subgraph-Konfiguration und Ethereum Node URL müssen individuell angepasst werden.
- Für produktive Nutzung empfiehlt sich ein eigener Server.
