import dotenv from 'dotenv';
import { createBlockchainPlugin } from './blockchain/BlockchainPlugin';
import { AccessControl } from './data/AccessControl';
import { P2PNode } from './p2p/P2PNode';
import { FileDataStore } from './data/DataStore';
import { RestApi } from './api/RestApi';

dotenv.config();

async function main() {
  const blockchainType = process.env.BLOCKCHAIN_TYPE || 'rest';
  const blockchain = createBlockchainPlugin(blockchainType, {
    // ... blockchain configuration ...
  });

  const dataStore = new FileDataStore(); // Or SQLiteDataStore
  const accessControl = new AccessControl(blockchain);
  const p2pNode = new P2PNode(accessControl, dataStore, { useGun: true });
  const restApi = new RestApi(blockchain, p2pNode, accessControl, dataStore);

  try {
    await blockchain.connect();
    console.log('Connected to blockchain');

    await p2pNode.start();

    const apiPort = parseInt(process.env.API_PORT!) || 3000;
    restApi.start(apiPort);

    // Example usage
    const userDID = 'did:example:user1';
    const orgDID = 'did:example:org1';
    const dataKey = 'personal_info';

    await blockchain.registerNode(userDID, false);
    await blockchain.registerNode(orgDID, true);

    await accessControl.grantAccess(userDID, orgDID, dataKey, Date.now() + 86400000);

    const hasAccess = await accessControl.hasAccess(orgDID, dataKey);
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
