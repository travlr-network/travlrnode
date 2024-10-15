import { BlockchainPlugin } from './BlockchainPlugin';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { Contract } from 'web3-eth-contract';

const ABI: AbiItem[] = [
  // Include the ABI of the deployed Ethereum contract here
];

export class EthereumPlugin implements BlockchainPlugin {
  private web3: Web3;
  private contract: Contract;
  private account: string;

  constructor(config: { rpcUrl: string; contractAddress: string; privateKey: string }) {
    this.web3 = new Web3(config.rpcUrl);
    this.contract = new this.web3.eth.Contract(ABI, config.contractAddress);
    this.account = this.web3.eth.accounts.privateKeyToAccount(config.privateKey).address;
  }

  async connect(): Promise<void> {
    // Connection logic if needed
  }

  async disconnect(): Promise<void> {
    // Disconnection logic if needed
  }

  async registerNode(did: string, isOrganization: boolean): Promise<string> {
    const tx = await this.contract.methods.registerNode(did, isOrganization).send({ from: this.account });
    return tx.transactionHash;
  }

  async grantAccess(granterDID: string, granteeDID: string, dataKey: string, expirationTime: number): Promise<string> {
    const tx = await this.contract.methods.grantAccess(granterDID, granteeDID, this.web3.utils.asciiToHex(dataKey), expirationTime).send({ from: this.account });
    return tx.transactionHash;
  }

  async revokeAccess(revokerDID: string, granteeDID: string, dataKey: string): Promise<string> {
    const tx = await this.contract.methods.revokeAccess(revokerDID, granteeDID, this.web3.utils.asciiToHex(dataKey)).send({ from: this.account });
    return tx.transactionHash;
  }

  async addDelegation(fromDID: string, toDID: string, dataKey: string): Promise<string> {
    const tx = await this.contract.methods.addDelegation(fromDID, toDID, this.web3.utils.asciiToHex(dataKey)).send({ from: this.account });
    return tx.transactionHash;
  }

  async removeDelegation(fromDID: string, toDID: string, dataKey: string): Promise<string> {
    const tx = await this.contract.methods.removeDelegation(fromDID, toDID, this.web3.utils.asciiToHex(dataKey)).send({ from: this.account });
    return tx.transactionHash;
  }

  async requestDataForwarding(requesterDID: string, targetDID: string, dataKey: string): Promise<string> {
    const tx = await this.contract.methods.requestDataForwarding(requesterDID, targetDID, this.web3.utils.asciiToHex(dataKey)).send({ from: this.account });
    return tx.transactionHash;
  }

  async checkAccess(did: string, dataKey: string): Promise<boolean> {
    return await this.contract.methods.checkAccess(did, this.web3.utils.asciiToHex(dataKey)).call();
  }

  async checkDelegation(fromDID: string, toDID: string, dataKey: string): Promise<boolean> {
    return await this.contract.methods.checkDelegation(fromDID, toDID, this.web3.utils.asciiToHex(dataKey)).call();
  }
}