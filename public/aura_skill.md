---
name: aura-orchestrator
description: Server-side orchestrator skill for the Aura agent. Automates end-to-end DeSci lab workflows — IPNFT minting, project creation, file uploads, and announcements — via Molecule DeSci GraphQL API and on-chain transactions. No UI assumptions; fully programmatic execution.
homepage: https://testnet.molecule.xyz/ipnfts
---

# Aura Orchestrator Skill: DeSci Lab Automation

Aura is a server-side orchestrator LLM that reads a **Blueprint JSON** and dispatches workflow steps against the Molecule DeSci infrastructure. This skill covers four canonical workflows:

1. **IPNFT Mint** — submit POI, prepare metadata via GraphQL, mint on-chain
2. **Project Creation** — create a data room linked to a minted IP-NFT via GraphQL
3. **File Upload** — three-phase presigned upload via GraphQL
4. **Announcement Creation** — publish updates with file attachments via GraphQL

Each workflow section clearly separates **GraphQL operations** from **on-chain transaction responsibilities**.

---

## 1. Prerequisites & Configuration

Before executing any workflow, verify **all** required credentials and configuration are available. Abort with a clear error if any are missing.

### Required Environment Variables

| Variable | Required For | Description |
|----------|-------------|-------------|
| `MOLECULE_API_KEY` | All GraphQL calls | API key. Sent as `x-api-key` header. |
| `MOLECULE_SERVICE_TOKEN` | File uploads, announcements | Service token JWT. Sent as `x-service-token` header. |
| `MOLECULE_LABS_URL` | All GraphQL calls | GraphQL endpoint (e.g. `https://staging.graphql.api.molecule.xyz/graphql`). |
| `MOLECULE_CLIENT_URL` | Link construction | Client URL (e.g. `https://testnet.molecule.xyz`). For user-facing links only. |
| `EVM_PRIVATE_KEY` | On-chain signing | Wallet private key (hex). **Never sent to any API.** Local signing only. |
| `EVM_RPC_URL` | On-chain transactions | Sepolia RPC endpoint (e.g. Alchemy, Infura). May contain provider credentials. |
| `POI_API_KEY` | POI regestration call | API key. Sent as Authorization: Bearer $POI_API_KEY. |

### On-Chain Configuration (Hardcoded Constants)

| Parameter | Value |
|-----------|-------|
| **Chain** | Sepolia testnet |
| **Chain ID** | `11155111` |
| **IPNFT Contract** | `0x152B444e60C526fe4434C721561a077269FcF61a` |
| **Mint Fee** | `0.001 ETH` |
| **IPNFT ABI** | `mintReservation(address to, uint256 reservationId, string tokenURI, string symbol, bytes authorization) payable returns (uint256)` |

### Prerequisite Checklist

Before starting any blueprint execution, Aura **must** confirm:

- [ ] `MOLECULE_API_KEY` is set and non-empty
- [ ] `POI_API_KEY` is set and non-empty
- [ ] `MOLECULE_LABS_URL` is set and starts with `https://`
- [ ] `MOLECULE_CLIENT_URL` is set
- [ ] `MOLECULE_SERVICE_TOKEN` is set (required for workflows 2–4)
- [ ] `EVM_PRIVATE_KEY` is set (required for workflow 1)
- [ ] `EVM_RPC_URL` is set and starts with `https://` (required for workflow 1)
- [ ] Wallet has sufficient Sepolia ETH for gas + 0.001 ETH mint fee (workflow 1)

---

## 2. Authentication

### GraphQL Authentication

All GraphQL requests go to:

```
POST ${MOLECULE_LABS_URL}
Content-Type: application/json
```

**Headers by workflow:**

| Workflow | Required Headers |
|----------|-----------------|
| IPNFT Mint (GraphQL steps) | `x-api-key: ${MOLECULE_API_KEY}` |
| Project Creation | `x-api-key: ${MOLECULE_API_KEY}`, `x-service-token: ${MOLECULE_SERVICE_TOKEN}` |
| File Upload | `x-api-key: ${MOLECULE_API_KEY}`, `x-service-token: ${MOLECULE_SERVICE_TOKEN}` |
| Announcements | `x-api-key: ${MOLECULE_API_KEY}`, `x-service-token: ${MOLECULE_SERVICE_TOKEN}` |

### Alternative Auth Mode

Instead of `x-service-token`, you may authenticate with:

```
Authorization: <bearer_token>
x-wallet-address: <admin_wallet_address>
```

Use this only if a service token is unavailable and the operator provides a bearer token + wallet address.

### On-Chain Authentication

On-chain transactions use `EVM_PRIVATE_KEY` for local signing via an Ethereum library (viem, ethers.js). The private key **never** leaves the runtime environment.

---

## 3. GraphQL Request Format

All GraphQL operations use this shape:

```bash
curl -X POST ${MOLECULE_LABS_URL} \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${MOLECULE_API_KEY}" \
  -H "x-service-token: ${MOLECULE_SERVICE_TOKEN}" \
  -d '{
    "query": "mutation { ... }",
    "variables": { ... }
  }'
```

### Response Format

**Success:**
```json
{
  "data": {
    "mutationName": {
      "isSuccess": true,
      "message": "Success message",
      "error": null
    }
  }
}
```

**Failure:**
```json
{
  "data": {
    "mutationName": {
      "isSuccess": false,
      "error": {
        "message": "What went wrong",
        "code": "ERROR_CODE",
        "retryable": false
      }
    }
  }
}
```

Always check `isSuccess` before proceeding to the next step.

---

## 4. Workflow 1: IPNFT Mint

A 9-step process combining on-chain transactions with GraphQL API calls. This is the most complex workflow and must be executed sequentially.

**Responsibility split:**
- Steps 1, 7, 9 → **On-chain / local signing** (no GraphQL)
- Steps 2, 3, 5, 6, 8 → **GraphQL API**
- Step 4 → **HTTP PUT** to presigned URL

**Auth required:** `x-api-key` only (no service token needed for minting).

### Step 1: Register POI

```bash
curl -X POST \
  https://testnet.molecule.xyz/api/v1/inventions \
  -H 'Authorization: Bearer POI_API_KEY' \
  -H 'Content-Type: multipart/form-data' \
  -F 'files=@document1.pdf' \
  -F 'files=@document2.pdf'
```

### Response Format

**Success:**
```json
{
  "success": true,
  "data": {
    "proof": {
      "format": "simple-v1",
      "tree": [
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba"
      ],
      "values": [
        {
          "value": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
          "treeIndex": 1
        },
        {
          "value": "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba",
          "treeIndex": 2
        }
      ]
    },
    "transaction": {
      "data": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      "to": "0x1DEA29b04a59000b877979339a457d5aBE315b52"
    }
  },
  "metadata": {
    "supportedEvmChainIds": [1, 8453],
    "apiVersion": "1.0",
    "timestamp": "2025-05-22T15:30:45.123Z"
  }
}
```

**Failure:**
```json
{
  "success": false,
  "error": {
    "message": "Error message describing what went wrong",
    "code": 400
  },
  "metadata": {
    "supportedEvmChainIds": [1, 8453],
    "apiVersion": "1.0",
    "timestamp": "2025-05-22T15:31:12.456Z"
  }
}
```

Always check `isSuccess` before proceeding to the next step.

Next Steps After API Response
After receiving a successful response from the API, you'll need to submit the transaction to the blockchain to store your proof on-chain:

Use the transaction object from the API response

Submit a transaction to the selected EVM blockchain (Sepolia)

Use the payload as transaction data and recipient as the recipient address

Example (using viem)

```javascript
import { createWalletClient, createPublicClient, http, parseAbi } from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const account = privateKeyToAccount(process.env.EVM_PRIVATE_KEY);
const walletClient = createWalletClient({
  account,
  chain: sepolia,
  transport: http(process.env.EVM_RPC_URL),
});
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.EVM_RPC_URL),
});


const tx = await walletClient.sendTransaction({
  data: result.transaction.data,  // Merkle root from API response
  to: result.transaction.to,  // Contract address from API response
  from: yourWalletAddress,
  ...
})

// Wait for transaction confirmation
const receipt = await waitForTransactionReceipt(walletClient, { hash: tx })
// Cast input Data to uint256 to get reservationId
```

**State to persist:** `reservationId`, `transactionHash`

**Gas estimation:** Call `estimateGas` before sending. If estimation fails, abort — the contract will revert.

### Step 2: Generate Assignment Agreement (GraphQL)

```graphql
mutation GenerateAssignmentAgreement($projectData: AWSJSON!) {
  generateAssignmentAgreement(projectData: $projectData) {
    agreementCid
    agreementUrl
    agreementContentHash
    agreementUri
    isSuccess
    error { message code retryable }
  }
}
```

**Variables** — `projectData` is a **JSON-encoded string**:

```json
{
  "projectData": "{\"project\":{\"name\":\"Research Title\",\"description\":\"Description of the research.\",\"initialSymbol\":\"SYM1\",\"funding_amount\":{\"value\":0,\"currency\":\"USD\",\"currency_type\":\"ISO4217\",\"decimals\":2},\"organization\":\"Organization Name\",\"research_lead\":{\"name\":\"Lead Name\",\"email\":\"lead@example.com\"},\"topic\":\"Research Topic\"},\"connectedWalletAddress\":\"0xYourWalletAddress\",\"chainId\":11155111,\"ipnftId\":\"RESERVATION_ID_FROM_STEP_1\"}"
}
```

**Required fields in `project`:**

| Field | Type | Constraints |
|-------|------|-------------|
| `name` | string | min 1 char |
| `description` | string | min 1 char |
| `initialSymbol` | string | min 1 char, alphanumeric |
| `funding_amount` | object | `{ value, currency, currency_type, decimals }` |
| `organization` | string | min 1, max 120 chars |
| `research_lead` | object | `name` (min 3 chars) + `email` (valid email) |
| `topic` | string | min 3, max 80 chars |

**Optional:** `industry` (max 80 chars)

**State to persist:** `agreementCid`, `agreementContentHash`

### Step 3: Generate Image Upload URL (GraphQL)

```graphql
mutation GenerateImageUploadUrl(
  $filename: String!,
  $contentType: String!,
  $ipnftId: String!
) {
  generateImageUploadUrl(
    filename: $filename,
    contentType: $contentType,
    ipnftId: $ipnftId
  ) {
    uploadUrl
    key
    isSuccess
    error { message code retryable }
  }
}
```

**Variables:**
```json
{
  "filename": "cover.png",
  "contentType": "image/png",
  "ipnftId": "RESERVATION_ID_FROM_STEP_1"
}
```

**State to persist:** `imageUploadUrl`, `imageKey`

### Step 4: Upload Image to Presigned URL (HTTP PUT)

```bash
curl -X PUT "${imageUploadUrl}" \
  -H "Content-Type: image/png" \
  --data-binary @cover.png
```

Upload must complete before the presigned URL expires. On expiry, re-execute Step 3 to get a fresh URL.

### Step 5: Upload Metadata with Image Key (GraphQL)

```graphql
mutation UploadMetadataWithImageKey(
  $metadata: AWSJSON!,
  $imageKey: String!,
  $ipnftId: String!
) {
  uploadMetadataWithImageKey(
    metadata: $metadata,
    imageKey: $imageKey,
    ipnftId: $ipnftId
  ) {
    metadataCid
    metadataUrl
    isSuccess
    error { message code retryable }
  }
}
```

**Variables** — `metadata` is a **JSON-encoded string**. Do **NOT** include `schema_version` or `properties.type` (auto-injected by backend):

```json
{
  "metadata": "{\"name\":\"Research Title\",\"description\":\"Description (min 10 chars)\",\"external_url\":\"https://project.example.com\",\"terms_signature\":\"placeholder\",\"properties\":{\"agreements\":[{\"content_hash\":\"AGREEMENT_CONTENT_HASH_FROM_STEP_2\",\"mime_type\":\"application/json\",\"type\":\"RESEARCH_ASSIGNMENT\",\"url\":\"ipfs://AGREEMENT_CID_FROM_STEP_2\"}],\"initial_symbol\":\"SYM1\",\"project_details\":{\"funding_amount\":{\"value\":0,\"currency\":\"USD\",\"currency_type\":\"ISO4217\",\"decimals\":2},\"organization\":\"Organization Name\",\"research_lead\":{\"name\":\"Lead Name\",\"email\":\"lead@example.com\"},\"topic\":\"Research Topic\"}}}",
  "imageKey": "IMAGE_KEY_FROM_STEP_3",
  "ipnftId": "RESERVATION_ID_FROM_STEP_1"
}
```

**Required metadata fields:**

| Field | Constraints |
|-------|-------------|
| `name` | min 5 chars |
| `description` | min 10 chars |
| `external_url` | min 1 char |
| `terms_signature` | min 1 char (use `"placeholder"`) |
| `properties.agreements` | At least one with `content_hash`, `mime_type`, `type`, `url` |
| `properties.initial_symbol` | Must match symbol from Step 2 |
| `properties.project_details` | Same structure as Step 2 |

**Auto-injected by backend (do NOT include):** `schema_version`, `properties.type`, `image`

**State to persist:** `metadataCid`, `metadataUrl`

### Step 6: Get Terms Message (GraphQL)

```graphql
query GetTermsMessage(
  $metadataCid: String!,
  $minter: String!,
  $chainId: Int!
) {
  getTermsMessage(
    metadataCid: $metadataCid,
    minter: $minter,
    chainId: $chainId
  ) {
    message
    digest
    isSuccess
    error { message code retryable }
  }
}
```

**Variables:**
```json
{
  "metadataCid": "METADATA_CID_FROM_STEP_5",
  "minter": "0xYourWalletAddress",
  "chainId": 11155111
}
```

**State to persist:** `termsMessage`, `termsDigest`

### Step 7: Sign Terms Message (Local Wallet — No Network Call)

Sign the terms message locally. This is a message signature — no gas cost, no on-chain transaction.

```javascript
const signature = await account.signMessage({
  message: termsMessage, // from Step 6
});
```

**State to persist:** `termsSignature`

### Step 8: Sign Off Metadata (GraphQL)

The backend generates the on-chain authorization signature.

```graphql
mutation SignoffMetadata(
  $ipnftId: String!,
  $tokenURI: String!,
  $chainId: Int!,
  $minter: String!,
  $to: String!,
  $termsSignature: String!
) {
  signoffMetadata(
    ipnftId: $ipnftId,
    tokenURI: $tokenURI,
    chainId: $chainId,
    minter: $minter,
    to: $to,
    termsSignature: $termsSignature
  ) {
    authorization
    isSuccess
    error { message code retryable }
  }
}
```

**Variables:**
```json
{
  "ipnftId": "RESERVATION_ID_FROM_STEP_1",
  "tokenURI": "ipfs://METADATA_CID_FROM_STEP_5",
  "chainId": 11155111,
  "minter": "0xYourWalletAddress",
  "to": "0xYourWalletAddress",
  "termsSignature": "SIGNATURE_FROM_STEP_7"
}
```

**State to persist:** `authorization`

### Step 9: Mint the IP-NFT (On-Chain)

Call `mintReservation()` on the IPNFT contract. Costs gas + 0.001 ETH mint fee.

```javascript
import { parseEther } from "viem";

// Estimate gas first
const gasEstimate = await publicClient.estimateContractGas({
  address: IPNFT_ADDRESS,
  abi: IPNFT_ABI,
  functionName: "mintReservation",
  args: [
    account.address,
    reservationId,
    `ipfs://${metadataCid}`,
    "SYM1",
    authorization,
  ],
  value: parseEther("0.001"),
  account: account.address,
});

// Execute mint
const hash = await walletClient.writeContract({
  address: IPNFT_ADDRESS,
  abi: IPNFT_ABI,
  functionName: "mintReservation",
  args: [
    account.address,             // to
    reservationId,               // from Step 1
    `ipfs://${metadataCid}`,     // tokenURI from Step 5
    "SYM1",                      // symbol (must match)
    authorization,               // from Step 8
  ],
  value: parseEther("0.001"),
});

const receipt = await publicClient.waitForTransactionReceipt({ hash });
// Verify receipt.status === "success"
```

**Post-mint state:**
- `ipnftUid` = `${IPNFT_ADDRESS}_${reservationId}` (e.g. `0x152B444e60C526fe4434C721561a077269FcF61a_42`)
- `tokenId` = `reservationId`
- Project link: `${MOLECULE_CLIENT_URL}/ipnfts/${reservationId}`

**State to persist:** `mintTransactionHash`, `ipnftUid`, `tokenId`

---

## 5. Workflow 2: Create Project (Data Room)

Creates a project linked to a minted IP-NFT. **Must be executed after Workflow 1.**

**Responsibility:** GraphQL only.
**Auth required:** `x-api-key` + `x-service-token`

### Sequencing Constraint

The project requires a valid `ipnftTokenId` from a successfully minted IP-NFT. The mint transaction must be confirmed on-chain before calling this mutation.

### Mutation

```graphql
mutation CreateProject($input: CreateProjectInput!) {
  createProject(input: $input) {
    isSuccess
    message
    error { message code retryable }
    project {
      ipnftUid
      ipnftSymbol
      ipnftAddress
      ipnftTokenId
    }
  }
}
```

### Variables

```json
{
  "input": {
    "ipnftSymbol": "SYM1",
    "ipnftTokenId": "RESERVATION_ID_AS_STRING"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `ipnftSymbol` | string | Symbol used during minting (must match exactly) |
| `ipnftTokenId` | string | The reservation ID from Workflow 1, Step 1 (as string) |

### Expected Response

```json
{
  "data": {
    "createProject": {
      "isSuccess": true,
      "message": "Project created",
      "error": null,
      "project": {
        "ipnftUid": "0x152B444e60C526fe4434C721561a077269FcF61a_42",
        "ipnftSymbol": "SYM1",
        "ipnftAddress": "0x152B444e60C526fe4434C721561a077269FcF61a",
        "ipnftTokenId": "42"
      }
    }
  }
}
```

**State to persist:** `ipnftUid` (confirms the format `{contractAddress}_{tokenId}`)

---

## 6. Workflow 3: File Upload (V2)

Three-phase presigned upload flow. **Must be executed after Workflow 2** (project must exist).

**Responsibility:** GraphQL + HTTP PUT to presigned URL.
**Auth required:** `x-api-key` + `x-service-token`

### Step 1: Initiate Upload (GraphQL)

```graphql
mutation InitiateCreateOrUpdateFileV2(
  $ipnftUid: String!,
  $contentType: String!,
  $contentLength: Int!
) {
  initiateCreateOrUpdateFileV2(
    ipnftUid: $ipnftUid,
    contentType: $contentType,
    contentLength: $contentLength
  ) {
    uploadToken
    uploadUrl
    uploadUrlExpiry
    method
    headers { key value }
    useMultipart
    isSuccess
    error { message code retryable }
  }
}
```

**Variables:**
```json
{
  "ipnftUid": "0x152B444e60C526fe4434C721561a077269FcF61a_42",
  "contentType": "application/pdf",
  "contentLength": 381846
}
```

**Expected response (relevant fields):**
```json
{
  "data": {
    "initiateCreateOrUpdateFileV2": {
      "uploadToken": "tok_abc123...",
      "uploadUrl": "https://s3.amazonaws.com/...",
      "uploadUrlExpiry": "2024-01-15T12:30:00Z",
      "method": "PUT",
      "headers": [
        { "key": "Content-Type", "value": "application/pdf" }
      ],
      "useMultipart": false,
      "isSuccess": true,
      "error": null
    }
  }
}
```

**State to persist:** `uploadToken`, `uploadUrl`, `uploadUrlExpiry`, `headers`

**Important:** The `uploadUrl` has an expiry (`uploadUrlExpiry`). Check the current time against this before uploading. If expired, re-initiate.

### Step 2: Upload File Bytes (HTTP PUT)

Upload the file to the presigned URL using the `method` and `headers` from Step 1.

```bash
curl -X PUT "${uploadUrl}" \
  -H "Content-Type: application/pdf" \
  --data-binary @research-data.pdf
```

Include **all** headers returned in Step 1 — they contain authorization for the storage upload.

**Content-type and size considerations:**
- The `Content-Type` must match what was declared in Step 1
- The actual file size must match `contentLength` from Step 1
- Common types: `application/pdf`, `text/csv`, `image/png`, `application/json`

### Step 3: Finalize Upload (GraphQL)

```graphql
mutation FinishCreateOrUpdateFileV2(
  $ipnftUid: String!,
  $uploadToken: String!,
  $path: String,
  $ref: String,
  $accessLevel: String!,
  $changeBy: String!,
  $description: String,
  $tags: [String!],
  $categories: [String!]
) {
  finishCreateOrUpdateFileV2(
    ipnftUid: $ipnftUid,
    uploadToken: $uploadToken,
    path: $path,
    ref: $ref,
    accessLevel: $accessLevel,
    changeBy: $changeBy,
    description: $description,
    tags: $tags,
    categories: $categories
  ) {
    datasetId
    contentHash
    version
    newHead
    isSuccess
    message
    error { message code retryable }
  }
}
```

**Variables (new file):**
```json
{
  "ipnftUid": "0x152B444e60C526fe4434C721561a077269FcF61a_42",
  "uploadToken": "TOKEN_FROM_STEP_1",
  "path": "research-data.pdf",
  "accessLevel": "PUBLIC",
  "changeBy": "0xYourWalletAddress",
  "description": "Initial research dataset",
  "tags": ["research", "data"],
  "categories": ["research"]
}
```

**Variables (new version of existing file):** Use `ref` instead of `path`:
```json
{
  "ipnftUid": "0x152B444e60C526fe4434C721561a077269FcF61a_42",
  "uploadToken": "TOKEN_FROM_STEP_1",
  "ref": "EXISTING_DATASET_ID",
  "accessLevel": "PUBLIC",
  "changeBy": "0xYourWalletAddress",
  "description": "Updated dataset v2"
}
```

**Access levels:**

| Level | Visibility |
|-------|-----------|
| `PUBLIC` | Anyone can view |
| `HOLDERS` | Only IP-NFT/IPT token holders |
| `ADMIN` | Only project admins |

**Expected response (relevant fields):**
```json
{
  "data": {
    "finishCreateOrUpdateFileV2": {
      "datasetId": "ds_abc123",
      "contentHash": "0xabc...",
      "version": 1,
      "newHead": "head_xyz",
      "isSuccess": true,
      "message": "File created",
      "error": null
    }
  }
}
```

**State to persist:** `datasetId`, `contentHash`, `version`

---

## 7. Workflow 4: Create Announcement

Publishes an announcement to the project activity feed. **Must be executed after Workflow 2** (project must exist).

**Responsibility:** GraphQL only.
**Auth required:** `x-api-key` + `x-service-token`

### Validation Constraints

- `attachments` references must correspond to **successfully completed** file uploads (valid `datasetId` values from Workflow 3)
- `headline` and `body` must be non-empty
- `body` supports Markdown

### Mutation

```graphql
mutation CreateAnnouncementV2(
  $ipnftUid: String!,
  $headline: String!,
  $body: String!,
  $attachments: [String!]
) {
  createAnnouncementV2(
    ipnftUid: $ipnftUid,
    headline: $headline,
    body: $body,
    attachments: $attachments
  ) {
    isSuccess
    message
    error { message code retryable }
  }
}
```

### Variables

```json
{
  "ipnftUid": "0x152B444e60C526fe4434C721561a077269FcF61a_42",
  "headline": "Research Milestone: Phase 1 Complete",
  "body": "We are excited to announce completion of Phase 1.\n\n## Key Results\n- Dataset collected and validated\n- Initial analysis supports the hypothesis\n\nFull details in the attached report.",
  "attachments": ["DATASET_ID_FROM_FILE_UPLOAD"]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `ipnftUid` | string | Project identifier (`{contractAddress}_{tokenId}`) |
| `headline` | string | Short announcement title (non-empty) |
| `body` | string | Full content, supports Markdown (non-empty) |
| `attachments` | string[] | Optional. Array of `datasetId` from completed file uploads |

### Expected Response

```json
{
  "data": {
    "createAnnouncementV2": {
      "isSuccess": true,
      "message": "Announcement created",
      "error": null
    }
  }
}
```

---

## 8. Query Operations

Use these to verify state, check existing projects, or retrieve data for blueprint processing.

### List Projects

```graphql
query ProjectsV2 {
  projectsV2 {
    projects {
      ipnftUid
      ipnftSymbol
      ipnftAddress
      ipnftTokenId
    }
    isSuccess
    error { message code }
  }
}
```

### Get Project with Data Room and Files

```graphql
query ProjectWithDataRoomAndFilesV2($ipnftUid: String!) {
  projectWithDataRoomAndFilesV2(ipnftUid: $ipnftUid) {
    isSuccess
    error { message code }
    project {
      ipnftUid
      ipnftSymbol
    }
    dataRoom {
      files {
        datasetId
        name
        contentType
        accessLevel
        description
        tags
        categories
        versions {
          version
          contentHash
          createdAt
        }
      }
    }
  }
}
```

### Get Project Activity

```graphql
query ProjectActivityV2($ipnftUid: String!) {
  projectActivityV2(ipnftUid: $ipnftUid) {
    isSuccess
    activities {
      type
      timestamp
      headline
      body
      attachments
    }
  }
}
```

### Search Projects

```graphql
query SearchLabs($query: String!) {
  searchLabs(query: $query) {
    isSuccess
    results {
      ipnftUid
      ipnftSymbol
    }
  }
}
```

---

## 9. Sequencing & Orchestration Constraints

### Required Execution Order

```
Workflow 1 (Mint IPNFT)
    │
    ├── Produces: reservationId, ipnftUid, tokenId
    │
    ▼
Workflow 2 (Create Project)
    │
    ├── Requires: tokenId, symbol from Workflow 1
    ├── Produces: ipnftUid (confirmed)
    │
    ▼
┌───────────────────┬───────────────────┐
│                   │                   │
▼                   ▼                   │
Workflow 3          Workflow 4          │
(File Upload)       (Announcement)      │
│                   │                   │
├── Independent     ├── If attachments  │
│   of Workflow 4   │   needed, depends │
│                   │   on Workflow 3   │
│                   │                   │
└───────────────────┴───────────────────┘
```

**Key constraints:**
1. Workflow 1 **must** complete before Workflow 2
2. Workflow 2 **must** complete before Workflows 3 or 4
3. Workflow 3 and 4 can run in parallel **unless** Workflow 4 needs attachments from Workflow 3
4. If announcements need file attachments, Workflow 3 **must** complete first

### State Dependencies

| State | Produced By | Consumed By |
|-------|-------------|-------------|
| `reservationId` / `tokenId` | Workflow 1, Step 1 | Workflow 1 (Steps 2–9), Workflow 2 |
| `agreementCid`, `agreementContentHash` | Workflow 1, Step 2 | Workflow 1, Step 5 |
| `imageKey` | Workflow 1, Step 3 | Workflow 1, Steps 4–5 |
| `metadataCid` | Workflow 1, Step 5 | Workflow 1, Steps 6, 8, 9 |
| `termsMessage` | Workflow 1, Step 6 | Workflow 1, Step 7 |
| `termsSignature` | Workflow 1, Step 7 | Workflow 1, Step 8 |
| `authorization` | Workflow 1, Step 8 | Workflow 1, Step 9 |
| `ipnftUid` | Workflow 1 (derived), Workflow 2 | Workflows 3, 4 |
| `uploadToken` | Workflow 3, Step 1 | Workflow 3, Step 3 |
| `datasetId` | Workflow 3, Step 3 | Workflow 4 (as attachment) |

### Blueprint JSON Interpretation

Aura should interpret Blueprint JSON by:

1. **Parse** the blueprint to identify which workflows are required
2. **Validate** all prerequisites are met before starting
3. **Map** blueprint stages to the canonical workflows above
4. **Execute** in the required order, persisting intermediate state after each step
5. **Record** final results (tokenId, ipnftUid, datasetIds, announcementId) back to the blueprint or operator callback

### Intermediate State Persistence

Aura **must** persist intermediate state after each successful step to enable recovery from partial failures:

```json
{
  "blueprintId": "bp_123",
  "workflow": "mint_ipnft",
  "currentStep": 5,
  "state": {
    "reservationId": "42",
    "reservationTxHash": "0xabc...",
    "agreementCid": "Qm...",
    "agreementContentHash": "0xdef...",
    "imageKey": "uploads/cover.png",
    "metadataCid": "Qm...",
    "metadataUrl": "ipfs://Qm..."
  },
  "startedAt": "2024-01-15T10:00:00Z",
  "lastUpdatedAt": "2024-01-15T10:02:30Z"
}
```

---

## 10. Error Handling Playbook

### Common Error Codes

| Code | Meaning | Retryable | Action |
|------|---------|-----------|--------|
| `AUTH_FAILED` | Invalid or missing `x-api-key` | No | Verify `MOLECULE_API_KEY` is correct. Do not retry. |
| `SERVICE_AUTH_FAILED` | Invalid or expired `x-service-token` | No | Regenerate service token via `generateServiceToken`, then retry the failed operation. |
| `MISSING_PARAMETERS` | Required field not provided | No | Fix the request payload. Do not retry without correction. |
| `INVALID_IPNFT_UID` | Malformed `ipnftUid` | No | Verify format is `{contractAddress}_{tokenId}`. |
| `NOT_FOUND` | Resource does not exist | No | Verify the resource was created in a prior step. |
| `INTERNAL_ERROR` | Server error | Yes | Wait 3–5 seconds, retry up to 3 times with exponential backoff. |

### On-Chain Error Handling

| Error | Cause | Action |
|-------|-------|--------|
| Gas estimation failure | Insufficient funds, contract revert | Check wallet balance. If sufficient, the contract will revert — do not submit. Investigate parameters. |
| Transaction reverted | Invalid parameters, already minted | Check revert reason. Do **not** retry the same transaction — it will revert again. |
| Nonce too low | Transaction already mined or replaced | Refresh nonce from chain. The operation may have already succeeded — check on-chain state. |
| RPC timeout | Network issues | Retry with exponential backoff (max 3 attempts). Consider switching RPC provider. |

### Presigned URL Expiry

If the presigned URL from `initiateCreateOrUpdateFileV2` or `generateImageUploadUrl` has expired:

1. Do **not** retry the HTTP PUT — it will fail with 403
2. Re-execute the initiate/generate step to get a fresh URL
3. The `uploadToken` from the expired initiation is invalid — use the new one

### Partial Workflow Failure Recovery

| Scenario | Recovery Strategy |
|----------|-------------------|
| Mint succeeded, project creation failed | Retry `createProject` with the same `tokenId` and `symbol`. The mint is permanent. |
| File initiate succeeded, upload failed | Re-initiate (get fresh presigned URL). The old `uploadToken` is orphaned and will expire. |
| File upload succeeded, finalize failed | Retry `finishCreateOrUpdateFileV2` with the same `uploadToken`. This is idempotent. |
| Announcement failed with invalid attachment | Verify the `datasetId` exists by querying `projectWithDataRoomAndFilesV2`. Re-upload if needed. |
| Reserve succeeded, later steps failed | Resume from the failed step using the persisted `reservationId`. Do **not** call `reserve()` again. |

### Retry Guidance

| Operation | Safe to Retry? | Max Retries | Backoff |
|-----------|---------------|-------------|---------|
| GraphQL queries | Yes | 3 | 1s, 2s, 4s |
| GraphQL mutations (idempotent) | Yes | 3 | 2s, 4s, 8s |
| `reserve()` on-chain | **No** — creates a new reservation each time | 0 | N/A |
| `mintReservation()` on-chain | **No** — unless tx was not mined | Check chain first | N/A |
| HTTP PUT to presigned URL | Yes (within expiry) | 2 | 1s, 3s |
| Service token regeneration | Yes | 2 | 5s, 10s |

### When NOT to Retry

- `AUTH_FAILED` — credentials are wrong, not transient
- `MISSING_PARAMETERS` — payload is malformed
- `INVALID_IPNFT_UID` — format error
- Contract revert — parameters are invalid, retrying will revert again
- `reserve()` — each call creates a new on-chain reservation (wastes gas)

### Logging Requirements

Aura **must** log the following for operator observability:

- Every GraphQL request/response (redact auth headers in logs)
- Every on-chain transaction hash and receipt status
- Step transitions with timestamps
- All errors with full context (step number, state snapshot, error code)
- Presigned URL expiry warnings (log when <60s remaining before upload)

---

## 11. Security

- **`MOLECULE_API_KEY`:** Send only as `x-api-key` to `${MOLECULE_LABS_URL}`. Never log the full value.
- **`MOLECULE_SERVICE_TOKEN`:** Send only as `x-service-token` to `${MOLECULE_LABS_URL}`. High-privilege — never expose in logs, commits, or external calls.
- **`EVM_PRIVATE_KEY`:** **Critical secret.** Use only for local signing. Never send to any API, log, or external service.
- **`EVM_RPC_URL`:** Treat as sensitive (often contains provider API keys). Do not expose in logs or public output.
- **`MOLECULE_LABS_URL`:** Send GraphQL auth headers only to this host. Always use HTTPS.
- **`MOLECULE_CLIENT_URL`:** Public URL for user-facing links only. Never attach auth headers to this URL.
- **Content fields:** Never include keys, tokens, private keys, or RPC URLs in project metadata, file descriptions, or announcement bodies.

---

## 12. Content Guidelines

For project metadata, file descriptions, and announcements:

- **Be specific.** Describe methods, assumptions, and scope clearly.
- **Be verifiable.** Reference datasets, analysis outputs, and reproducible steps.
- **Be transparent.** Note limitations, unresolved risks, and open questions.
- **Be structured.** Use headings/lists for long updates.
- **Markdown supported:** `##`, `**bold**`, `*italic*`, `[links](url)`, lists, blockquotes, code blocks.

---

## 13. Quick Reference

| What | Where / Value |
|------|---------------|
| GraphQL endpoint | `${MOLECULE_LABS_URL}` |
| GraphQL API key header | `x-api-key: ${MOLECULE_API_KEY}` |
| GraphQL service token header | `x-service-token: ${MOLECULE_SERVICE_TOKEN}` |
| IPNFT contract (Sepolia) | `0x152B444e60C526fe4434C721561a077269FcF61a` |
| Chain ID | `11155111` |
| Mint fee | `0.001 ETH` |
| `ipnftUid` format | `{contractAddress}_{tokenId}` |
| Project link format | `${MOLECULE_CLIENT_URL}/ipnfts/{tokenId}` |
| Execution order | Mint → Project → File Upload / Announcement |
| On-chain library | viem (recommended), ethers.js, web3.js |
