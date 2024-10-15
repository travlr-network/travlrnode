module data_sharing_contract {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::dynamic_field;
    use sui::clock::{Self, Clock};
    use std::vector;

    struct AccessRight has store {
        granted_by: address,
        expiration_time: u64
    }

    struct DataSharingContract has key {
        id: UID,
        organizations: vector<address>,
        individuals: vector<address>,
    }

    struct AccessRights has key {
        id: UID,
        rights: vector<AccessRight>,
    }

    struct Delegations has key {
        id: UID,
        delegations: vector<address>,
    }

    public fun init(ctx: &mut TxContext) {
        let contract = DataSharingContract {
            id: object::new(ctx),
            organizations: vector::empty(),
            individuals: vector::empty(),
        };
        transfer::share_object(contract);
    }

    public entry fun register_node(contract: &mut DataSharingContract, did: address, is_organization: bool, ctx: &mut TxContext) {
        if (is_organization) {
            vector::push_back(&mut contract.organizations, did);
        } else {
            vector::push_back(&mut contract.individuals, did);
        }
    }

    public entry fun grant_access(contract: &mut DataSharingContract, granter_did: address, grantee_did: address, data_key: vector<u8>, expiration_time: u64, clock: &Clock, ctx: &mut TxContext) {
        assert!(tx_context::sender(ctx) == granter_did, 0);
        
        let access_right = AccessRight {
            granted_by: granter_did,
            expiration_time: expiration_time,
        };

        if (!dynamic_field::exists_(&contract.id, data_key)) {
            let access_rights = AccessRights {
                id: object::new(ctx),
                rights: vector::empty(),
            };
            dynamic_field::add(&mut contract.id, data_key, access_rights);
        }

        let access_rights = dynamic_field::borrow_mut<vector<u8>, AccessRights>(&mut contract.id, data_key);
        vector::push_back(&mut access_rights.rights, access_right);
    }

    public entry fun revoke_access(contract: &mut DataSharingContract, revoker_did: address, grantee_did: address, data_key: vector<u8>, ctx: &mut TxContext) {
        assert!(tx_context::sender(ctx) == revoker_did || vector::contains(&contract.organizations, &tx_context::sender(ctx)), 0);
        
        if (dynamic_field::exists_(&contract.id, data_key)) {
            let access_rights = dynamic_field::borrow_mut<vector<u8>, AccessRights>(&mut contract.id, data_key);
            let (i, len) = (0, vector::length(&access_rights.rights));
            while (i < len) {
                let access_right = vector::borrow(&access_rights.rights, i);
                if (access_right.granted_by == grantee_did) {
                    vector::remove(&mut access_rights.rights, i);
                    break
                };
                i = i + 1;
            };
        }
    }

    public entry fun add_delegation(contract: &mut DataSharingContract, from_did: address, to_did: address, data_key: vector<u8>, ctx: &mut TxContext) {
        assert!(vector::contains(&contract.organizations, &from_did), 0);
        assert!(check_access(contract, from_did, data_key), 1);

        if (!dynamic_field::exists_(&contract.id, (data_key, from_did))) {
            let delegations = Delegations {
                id: object::new(ctx),
                delegations: vector::empty(),
            };
            dynamic_field::add(&mut contract.id, (data_key, from_did), delegations);
        }

        let delegations = dynamic_field::borrow_mut<(vector<u8>, address), Delegations>(&mut contract.id, (data_key, from_did));
        vector::push_back(&mut delegations.delegations, to_did);
    }

    public entry fun remove_delegation(contract: &mut DataSharingContract, from_did: address, to_did: address, data_key: vector<u8>, ctx: &mut TxContext) {
        assert!(tx_context::sender(ctx) == from_did || vector::contains(&contract.organizations, &tx_context::sender(ctx)), 0);

        if (dynamic_field::exists_(&contract.id, (data_key, from_did))) {
            let delegations = dynamic_field::borrow_mut<(vector<u8>, address), Delegations>(&mut contract.id, (data_key, from_did));
            let (i, len) = (0, vector::length(&delegations.delegations));
            while (i < len) {
                if (*vector::borrow(&delegations.delegations, i) == to_did) {
                    vector::remove(&mut delegations.delegations, i);
                    break
                };
                i = i + 1;
            };
        }
    }

    public entry fun request_data_forwarding(contract: &DataSharingContract, requester_did: address, target_did: address, data_key: vector<u8>) {
        assert!(vector::contains(&contract.organizations, &requester_did), 0);
        // In a real implementation, this would trigger some kind of event or action
    }

    public fun check_access(contract: &DataSharingContract, did: address, data_key: vector<u8>): bool {
        if (dynamic_field::exists_(&contract.id, data_key)) {
            let access_rights = dynamic_field::borrow<vector<u8>, AccessRights>(&contract.id, data_key);
            let (i, len) = (0, vector::length(&access_rights.rights));
            while (i < len) {
                let access_right = vector::borrow(&access_rights.rights, i);
                if (access_right.granted_by == did && (access_right.expiration_time == 0 || clock::timestamp_ms(clock) < access_right.expiration_time)) {
                    return true
                };
                i = i + 1;
            };
        };
        false
    }

    public fun check_delegation(contract: &DataSharingContract, from_did: address, to_did: address, data_key: vector<u8>): bool {
        vector::contains(&contract.organizations, &from_did) &&
        check_access(contract, from_did, data_key) &&
        dynamic_field::exists_(&contract.id, (data_key, from_did)) &&
        vector::contains(
            &dynamic_field::borrow<(vector<u8>, address), Delegations>(&contract.id, (data_key, from_did)).delegations,
            &to_did
        )
    }
}