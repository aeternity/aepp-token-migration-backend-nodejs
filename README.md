# aepp-token-migration-backend

## æUnited
This application is a result of the [æUnited](https://github.com/aeternity/bounties) open-source contribution program of æternity.

## Requirements
- Set up `PostgreSQL` and provide the connection URL via env variable.
- Set the migration contract address via env variable:
    - `ct_eJhrbPPS4V97VLKEVbSCJFpdA4uyXiZujQyLqMFoYV88TzDe6` or [deploy your own](https://github.com/aeternity/aepp-token-migration-smart-contract/blob/master/contracts/TokenMigration.aes)
- Set the Node URL via env variable:
    - `https://mainnet.aeternity.io` (mainnet)
    - `https://testnet.aeternity.io` (testnet)
- Set the private and public key via env variable:
    - Can be created via [aecli](https://github.com/aeternity/aepp-cli-js) or any tool you like
- Project was tested with Node.js version 14

## Env variables
```
DB_URL=postgresql://user:pass@url:port/db
TABLE_NAME = <table_name>
COMPILER_URL=https://latest.compiler.aepps.com
CONTRACT_ADDRESS=ct_eJhrb....
NODE_URL=https://mainnet.aeternity.io
PRIVATE_KEY=52f9....
PUBLIC_KEY=ak_2H4....
LOG_LEVEL=info
```

## Run the script from _src_ directory locally

1. Install all dependencies by executing `yarn`.

2. Run `npm run dev` which will use **nodemon** to run the typescript with `app.ts` as entrypoint.

## Files & Folders in the *src* directory

- *data* folder: Contains token holders data that is used to create merkle tree.
- `app.ts`: The entrypoint of the project to handle the routes.
- `controllers/holderController.ts`: Contains logic for the routes to resolve and respond, Also contains function definition to run data addition on PostgreSQL
- `holders.ts`: This script initiates the Database (PostgreSQL) and run data additions if they are not present.
- `createMerkleTree.js`: Create the merkle tree for the supplied data.
- `aeternitySdk.ts`: This script contains logic for interacting with æternity blockchain using **aepp-sdk**.
- `TokenMigrationInterface.aes`: The contract interface needed to initialize the contract instance in order to perform contract calls using the SDK.