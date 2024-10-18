import { createBlockchainPlugin } from './blockchain/BlockchainPlugin';
import { AccessControl } from './data/AccessControl';
import { createP2PNodePlugin } from './p2p/P2PNodePlugin';
import { createDataStorePlugin } from './data/DataStorePlugin';
import { RestApi } from './api/RestApi';
import { VeramoPlugin } from './did/VeramoPlugin';

export async function runNode() {
  const blockchainType = process.env.BLOCKCHAIN_TYPE || 'rest';
  const blockchain = createBlockchainPlugin(blockchainType, {
    // ... blockchain configuration ...
  });

  const dataStoreType = process.env.DATA_STORE_TYPE || 'file';
  const dataStore = createDataStorePlugin(dataStoreType, {
    dataDir: process.env.DATA_STORE_DIR || './data'
  });

  const accessControl = new AccessControl(blockchain);

  const p2pType = process.env.P2P_TYPE || 'gun';
  const p2pNode = createP2PNodePlugin(p2pType, accessControl, dataStore, {
    // ... P2P configuration ...
  });

  const didProvider = process.env.DID_PROVIDER as 'ethereum' | 'rest';
  let veramoConfig: any = {
    secretKey: process.env.VERAMO_SECRET_KEY!,
    didProvider: didProvider,
  };

  if (didProvider === 'ethereum') {
    veramoConfig.ethereumConfig = {
      infuraProjectId: process.env.INFURA_PROJECT_ID!,
      network: process.env.ETHEREUM_NETWORK || 'mainnet',
    };
  } else if (didProvider === 'rest') {
    veramoConfig.restConfig = {
      publicBlockchainApiUrl: process.env.PUBLIC_BLOCKCHAIN_API_URL!,
    };
  }

  const veramo = new VeramoPlugin(veramoConfig);

  const restApi = new RestApi(blockchain, p2pNode, accessControl, dataStore, veramo);

  await blockchain.connect();
  console.log('Connected to blockchain');

  await p2pNode.start();

  const apiPort = parseInt(process.env.API_PORT!) || 3000;
  restApi.start(apiPort);

  return { blockchain, p2pNode, accessControl, dataStore, veramo, restApi };
}
