import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { createBlockchainPlugin } from './blockchain/BlockchainPlugin';
import { AccessControl } from './data/AccessControl';
import { createP2PNodePlugin } from './p2p/P2PNodePlugin';
import { createDataStorePlugin } from './data/DataStorePlugin';
import { VeramoPlugin } from './did/VeramoPlugin';

const TravlrNodeExample: React.FC = () => {
  const [blockchain, setBlockchain] = useState<any>(null);
  const [accessControl, setAccessControl] = useState<AccessControl | null>(null);
  const [p2pNode, setP2PNode] = useState<any>(null);
  const [dataStore, setDataStore] = useState<any>(null);
  const [veramo, setVeramo] = useState<VeramoPlugin | null>(null);
  const [userDID, setUserDID] = useState<string | null>(null);
  const [orgDID, setOrgDID] = useState<string | null>(null);

  useEffect(() => {
    initializeTravlrNode();
  }, []);

  const initializeTravlrNode = async () => {
    // Initialize blockchain plugin
    const blockchainPlugin = createBlockchainPlugin('rest', {
      baseUrl: 'https://your-api-endpoint.com',
    });
    setBlockchain(blockchainPlugin);

    // Initialize AccessControl
    const accessControlInstance = new AccessControl(blockchainPlugin);
    setAccessControl(accessControlInstance);

    // Initialize P2P node plugin
    const p2pNodePlugin = createP2PNodePlugin('gun', accessControlInstance, dataStore, {
      // P2P configuration
    });
    setP2PNode(p2pNodePlugin);

    // Initialize DataStore plugin
    const dataStorePlugin = createDataStorePlugin('file', {
      dataDir: 'travlrnode_data',
    });
    setDataStore(dataStorePlugin);

    // Initialize Veramo plugin
    const veramoPlugin = new VeramoPlugin({
      secretKey: 'your-secret-key',
      didProvider: 'rest',
      restConfig: {
        publicBlockchainApiUrl: 'https://your-api-endpoint.com',
      },
    });
    setVeramo(veramoPlugin);

    // Connect to the blockchain
    await blockchainPlugin.connect();
  };

  const createDIDs = async () => {
    if (veramo) {
      const userIdentifier = await veramo.createDID();
      const orgIdentifier = await veramo.createDID();
      setUserDID(userIdentifier.did);
      setOrgDID(orgIdentifier.did);
    }
  };

  const grantAccess = async () => {
    if (accessControl && userDID && orgDID) {
      const dataKey = 'personal_info';
      const expirationTime = Date.now() + 86400000; // 24 hours from now
      await accessControl.grantAccess(userDID, orgDID, dataKey, expirationTime);
      console.log('Access granted');
    }
  };

  const checkAccess = async () => {
    if (accessControl && orgDID) {
      const dataKey = 'personal_info';
      const hasAccess = await accessControl.hasAccess(orgDID, dataKey);
      console.log(`Organization has access: ${hasAccess}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>TravlrNode Example</Text>
      <Button title="Create DIDs" onPress={createDIDs} />
      <Button title="Grant Access" onPress={grantAccess} />
      <Button title="Check Access" onPress={checkAccess} />
      {userDID && <Text>User DID: {userDID}</Text>}
      {orgDID && <Text>Organization DID: {orgDID}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default TravlrNodeExample;
