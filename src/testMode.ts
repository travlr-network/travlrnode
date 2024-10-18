import dotenv from 'dotenv';
import { runNode } from './runNode';
import { VeramoPlugin } from './did/VeramoPlugin';
import { PublicBlockchainApi } from './testing/PublicBlockchainApi';

dotenv.config();

async function runTestMode() {
  // Initialize and start the PublicBlockchainAPI
  const publicBlockchain = new PublicBlockchainApi();
  await publicBlockchain.start();

  const { blockchain, p2pNode, accessControl, dataStore, veramoPlugin: veramo, restApi } = await runNode();

  // Add debug logging
  console.log('Initialized components:', { blockchain, p2pNode, accessControl, dataStore, veramo, restApi });

  try {
    // Check if veramo is properly initialized
    if (!veramo) {
      throw new Error('Veramo plugin is not initialized');
    }

    // Example usage for testing
    const userIdentifier = await veramo.createDID();
    const orgIdentifier = await veramo.createDID();

    const userDID = userIdentifier.did;
    const orgDID = orgIdentifier.did;
    const dataKey = 'personal_info';

    await blockchain.registerNode(userDID, false);
    await blockchain.registerNode(orgDID, true);

    await accessControl.grantAccess(userDID, orgDID, dataKey, Date.now() + 86400000);

    const hasAccess = await accessControl.hasAccess(orgDID, dataKey);
    console.log(`Organization has access: ${hasAccess}`);

    // Issue a Verifiable Credential
    const vc = await veramo.issueVC(userDID, orgDID, { dataKey, accessGranted: true });
    console.log('Issued VC:', vc);

    // Verify the Verifiable Credential
    const isValid = await veramo.verifyVC(vc);
    console.log('VC is valid:', isValid);

    // Keep the application running
    process.on('SIGINT', async () => {
      console.log('Shutting down...');
      await p2pNode.stop();
      await blockchain.disconnect();
      await publicBlockchain.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error('An error occurred:', error);
    if (publicBlockchain && typeof publicBlockchain.stop === 'function') {
      await publicBlockchain.stop();
    }
    process.exit(1);
  }
}

runTestMode().catch(console.error);
