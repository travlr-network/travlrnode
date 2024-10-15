import { BlockchainPlugin } from './BlockchainPlugin';
import { JsonRpcProvider, RawSigner, Ed25519Keypair, TransactionBlock } from '@mysten/sui.js';

export class SuiPlugin implements BlockchainPlugin {
  private provider: JsonRpcProvider;
  private signer: RawSigner;
  private contractAddress: string;
  private moduleId: string;

  constructor(config: { rpcUrl: string; privateKey: string; contractAddress: string; moduleId: string }) {
    this.provider = new JsonRpcProvider(config.rpcUrl);
    const keypair = Ed25519Keypair.fromSecretKey(Buffer.from(config.privateKey, 'hex'));
    this.signer = new RawSigner(keypair, this.provider);
    this.contractAddress = config.contractAddress;
    this.moduleId = config.moduleId;
  }

  async connect(): Promise<void> {
    // Connection logic if needed
  }

  async disconnect(): Promise<void> {
    // Disconnection logic if needed
  }

  async registerNode(did: string, isOrganization: boolean): Promise<string> {
    const tx = new TransactionBlock();
    tx.moveCall({
      target: `${this.moduleId}::register_node`,
      arguments: [
        tx.object(this.contractAddress),
        tx.pure(did),
        tx.pure(isOrganization)
      ],
    });
    const result = await this.signer.signAndExecuteTransactionBlock({ transactionBlock: tx });
    return result.digest;
  }

  async grantAccess(granterDID: string, granteeDID: string, dataKey: string, expirationTime: number): Promise<string> {
    const tx = new TransactionBlock();
    tx.moveCall({
      target: `${this.moduleId}::grant_access`,
      arguments: [
        tx.object(this.contractAddress),
        tx.pure(granterDID),
        tx.pure(granteeDID),
        tx.pure(Buffer.from(dataKey)),
        tx.pure(expirationTime),
        tx.object('0x6') // Assuming '0x6' is the Clock object ID
      ],
    });
    const result = await this.signer.signAndExecuteTransactionBlock({ transactionBlock: tx });
    return result.digest;
  }

  // Implement other methods similarly...

  async checkAccess(did: string, dataKey: string): Promise<boolean> {
    const result = await this.provider.devInspectTransactionBlock({
      sender: await this.signer.getAddress(),
      transactionBlock: {
        kind: 'moveCall',
        data: {
          target: `${this.moduleId}::check_access`,
          arguments: [
            { kind: 'Input', index: 0 },
            { kind: 'Input', index: 1 },
            { kind: 'Input', index: 2 },
          ],
        },
      },
      typeArguments: [],
      arguments: [
        this.contractAddress,
        did,
        Array.from(Buffer.from(dataKey)),
      ],
    });
    return this.parseBooleanResult(result);
  }

  async checkDelegation(fromDID: string, toDID: string, dataKey: string): Promise<boolean> {
    const result = await this.provider.devInspectTransactionBlock({
      sender: await this.signer.getAddress(),
      transactionBlock: {
        kind: 'moveCall',
        data: {
          target: `${this.moduleId}::check_delegation`,
          arguments: [
            { kind: 'Input', index: 0 },
            { kind: 'Input', index: 1 },
            { kind: 'Input', index: 2 },
            { kind: 'Input', index: 3 },
          ],
        },
      },
      typeArguments: [],
      arguments: [
        this.contractAddress,
        fromDID,
        toDID,
        Array.from(Buffer.from(dataKey)),
      ],
    });
    return this.parseBooleanResult(result);
  }

  private parseBooleanResult(result: any): boolean {
    return result.results[0].returnValues[0] === true;
  }
}