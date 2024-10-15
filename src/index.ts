import dotenv from 'dotenv';
import { createBlockchainPlugin, BlockchainPlugin } from './blockchain/BlockchainPlugin';
import { EthereumPlugin } from './blockchain/EthereumPlugin';
import { SuiPlugin } from './blockchain/SuiPlugin';
import { RestApiPlugin } from './blockchain/RestApiPlugin';
import { DataStore } from './data/DataStore';
import { AccessControl } from './data/AccessControl';
import { P2PNode } from './p2p/P2PNode';
import { RestApi } from './api/RestApi';
import { PublicBlockchainApi } from './testing/PublicBlockchainApi';

dotenv.config();

async function main() {
  const blockchainType = process.env.BLOCKCHAIN_TYPE || 'rest';
  let blockchain: BlockchainPlugin;

  switch (blockchainType) {
    case 'ethereum':
      blockchain = new EthereumPlugin({
        rpcUrl: process.env.ETH_RPC_URL!,
        privateKey: process.env.ETH_PRIVATE_KEY!,
        contractAddress: process.env.ETH_CONTRACT_ADDRESS!
      });
      break;
    case 'sui':
      blockchain = new SuiPlugin({
        rpcUrl: process.env.SUI_RPC_URL!,
        privateKey: process.env.SUI_PRIVATE_KEY!,
        contractAddress: process.env.SUI_CONTRACT_ADDRESS!,
        moduleId: process.env.SUI_MODULE_ID!
      });
      break;
    case 'rest':
    default:
      blockchain = new RestApiPlugin({
        baseUrl: process.env.REST_API_BASE_URL!
      });
      // Start the public blockchain API for testing
      const publicBlockchainApi = new PublicBlockchainApi();
      publicBlockchainApi.start(parseInt(process.env.API_PORT!) || 3000);
      break;
  }

  const dataStore = new DataStore();
  const accessControl = new AccessControl();
  const p2pNode = new P2PNode(dataStore, accessControl);
  const restApi = new RestApi(blockchain, p2pNode);

  try {
    await blockchain.connect();
    console.log('Connected to blockchain');

    await p2pNode.start();

    const apiPort = parseInt(process.env.API_PORT!) || 3001;
    restApi.start(apiPort);

    // Example usage
    const userDID = 'did:example:user1';
    const orgDID = 'did:example:org1';
    const dataKey = 'personal_info';

    await blockchain.registerNode(userDID, false);
    await blockchain.registerNode(orgDID, true);

    await blockchain.grantAccess(userDID, orgDID, dataKey, Date.now() + 86400000);

    const hasAccess = await blockchain.checkAccess(orgDID, dataKey);
    console.log(`Organization has access: ${hasAccess}`);

    // Keep the application running
    process.on('SIGINT', async () => {
      console.log('Shutting down...');
      await p2pNode.stop();
      await blockchain.disconnect();
      process.exit(0);
    });
  } catch (error) {
    console.error('An error occurred:', error);
    process.exit(1);
  }
}

main().catch(console.error);