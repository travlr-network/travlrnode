# TravlrNode

TravlrNode is a flexible and modular blockchain-based data management system designed to handle decentralized identity (DID) and access control across multiple blockchain platforms.

## Features

- Support for multiple blockchain platforms (Ethereum, Sui, and a REST API fallback)
- Decentralized identity (DID) management
- Access control for data sharing between nodes
- Peer-to-peer (P2P) networking capabilities
- RESTful API for easy integration
- Configurable through environment variables

## Prerequisites

- Node.js (v14 or later recommended)
- npm or yarn
- Access to an Ethereum or Sui blockchain node (optional, depending on configuration)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/travlrnode.git
   cd travlrnode
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory and configure the following variables:

   ```
   BLOCKCHAIN_TYPE=ethereum|sui|rest
   API_PORT=3001

   # For Ethereum
   ETH_RPC_URL=https://your-ethereum-rpc-url
   ETH_PRIVATE_KEY=your-private-key
   ETH_CONTRACT_ADDRESS=your-contract-address

   # For Sui
   SUI_RPC_URL=https://your-sui-rpc-url
   SUI_PRIVATE_KEY=your-private-key
   SUI_CONTRACT_ADDRESS=your-contract-address
   SUI_MODULE_ID=your-module-id

   # For REST API fallback
   REST_API_BASE_URL=http://localhost:3000
   ```

## Usage

To start the TravlrNode application, run:


```
npm start
```
This will:
1. Connect to the specified blockchain (Ethereum, Sui, or REST API)
2. Start the P2P node
3. Launch the REST API server

The application will continue running until you press Ctrl+C or send a SIGINT signal.

## Blockchain Plugins

TravlrNode supports multiple blockchain platforms through a plugin system:

- **Ethereum**: Uses the EthereumPlugin for interacting with Ethereum smart contracts.
- **Sui**: Uses the SuiPlugin for interacting with the Sui blockchain.
- **REST API**: Uses the RestApiPlugin as a fallback or for testing purposes.

The blockchain type can be configured using the `BLOCKCHAIN_TYPE` environment variable.

## API Endpoints

The REST API provides endpoints for interacting with the blockchain and P2P network. Detailed API documentation will be provided separately.

## Testing

For testing purposes, a PublicBlockchainApi is included and can be started when using the REST API fallback. This simulates blockchain interactions for development and testing.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.