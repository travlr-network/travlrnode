export class AccessControl {
    private permissions: Map<string, Map<string, { grantedBy: string; expirationTime: number | null }>> = new Map();
    private organizations: Set<string> = new Set();
    private individuals: Set<string> = new Set();
    private delegations: Map<string, Map<string, Set<string>>> = new Map();
  
    addOrganization(did: string): void {
      this.organizations.add(did);
    }
  
    addIndividual(did: string): void {
      this.individuals.add(did);
    }
  
    grantAccess(granterDID: string, granteeDID: string, dataKey: string, expirationTime: number | null = null): void {
      if (!this.permissions.has(dataKey)) {
        this.permissions.set(dataKey, new Map());
      }
      this.permissions.get(dataKey)!.set(granteeDID, { grantedBy: granterDID, expirationTime });
    }
  
    revokeAccess(revokerDID: string, granteeDID: string, dataKey: string): void {
      if (this.permissions.has(dataKey)) {
        const dataPermissions = this.permissions.get(dataKey)!;
        if (dataPermissions.has(granteeDID)) {
          const permission = dataPermissions.get(granteeDID)!;
          if (permission.grantedBy === revokerDID || this.organizations.has(revokerDID)) {
            dataPermissions.delete(granteeDID);
          }
        }
      }
    }
  
    hasAccess(did: string, dataKey: string): boolean {
      if (this.permissions.has(dataKey)) {
        const permission = this.permissions.get(dataKey)!.get(did);
        if (permission) {
          return !permission.expirationTime || permission.expirationTime > Date.now();
        }
      }
      return false;
    }
  
    addDelegation(fromDID: string, toDID: string, dataKey: string): void {
      if (!this.delegations.has(fromDID)) {
        this.delegations.set(fromDID, new Map());
      }
      if (!this.delegations.get(fromDID)!.has(dataKey)) {
        this.delegations.get(fromDID)!.set(dataKey, new Set());
      }
      this.delegations.get(fromDID)!.get(dataKey)!.add(toDID);
    }
  
    removeDelegation(fromDID: string, toDID: string, dataKey: string): void {
      if (this.delegations.has(fromDID) && this.delegations.get(fromDID)!.has(dataKey)) {
        this.delegations.get(fromDID)!.get(dataKey)!.delete(toDID);
      }
    }
  
    canDelegate(fromDID: string, toDID: string, dataKey: string): boolean {
      return this.organizations.has(fromDID) &&
             this.hasAccess(fromDID, dataKey) &&
             this.delegations.has(fromDID) &&
             this.delegations.get(fromDID)!.has(dataKey) &&
             this.delegations.get(fromDID)!.get(dataKey)!.has(toDID);
    }
  }