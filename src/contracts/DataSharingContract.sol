// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DataSharingContract {
    struct Access {
        address grantedBy;
        uint256 expirationTime;
    }

    mapping(bytes32 => mapping(address => Access)) private accessRights;
    mapping(address => bool) private organizations;
    mapping(address => bool) private individuals;
    mapping(bytes32 => mapping(address => mapping(address => bool))) private delegations;

    event NodeRegistered(address indexed did, bool isOrganization);
    event AccessGranted(address indexed granterDID, address indexed granteeDID, bytes32 dataKey, uint256 expirationTime);
    event AccessRevoked(address indexed revokerDID, address indexed granteeDID, bytes32 dataKey);
    event DelegationAdded(address indexed fromDID, address indexed toDID, bytes32 dataKey);
    event DelegationRemoved(address indexed fromDID, address indexed toDID, bytes32 dataKey);
    event DataForwardingRequested(address indexed requesterDID, address indexed targetDID, bytes32 dataKey);

    function registerNode(address did, bool isOrganization) public {
        if (isOrganization) {
            organizations[did] = true;
        } else {
            individuals[did] = true;
        }
        emit NodeRegistered(did, isOrganization);
    }

    function grantAccess(address granterDID, address granteeDID, bytes32 dataKey, uint256 expirationTime) public {
        require(msg.sender == granterDID, "Only the granter can grant access");
        accessRights[dataKey][granteeDID] = Access(granterDID, expirationTime);
        emit AccessGranted(granterDID, granteeDID, dataKey, expirationTime);
    }

    function revokeAccess(address revokerDID, address granteeDID, bytes32 dataKey) public {
        require(msg.sender == revokerDID || organizations[msg.sender], "Only the granter or an organization can revoke access");
        delete accessRights[dataKey][granteeDID];
        emit AccessRevoked(revokerDID, granteeDID, dataKey);
    }

    function addDelegation(address fromDID, address toDID, bytes32 dataKey) public {
        require(organizations[fromDID], "Only organizations can delegate");
        require(hasAccess(fromDID, dataKey), "Delegator must have access to the data");
        delegations[dataKey][fromDID][toDID] = true;
        emit DelegationAdded(fromDID, toDID, dataKey);
    }

    function removeDelegation(address fromDID, address toDID, bytes32 dataKey) public {
        require(msg.sender == fromDID || organizations[msg.sender], "Only the delegator or an organization can remove delegation");
        delegations[dataKey][fromDID][toDID] = false;
        emit DelegationRemoved(fromDID, toDID, dataKey);
    }

    function requestDataForwarding(address requesterDID, address targetDID, bytes32 dataKey) public {
        require(organizations[requesterDID], "Only organizations can request data forwarding");
        emit DataForwardingRequested(requesterDID, targetDID, dataKey);
    }

    function checkAccess(address did, bytes32 dataKey) public view returns (bool) {
        Access memory access = accessRights[dataKey][did];
        return access.grantedBy != address(0) && (access.expirationTime == 0 || access.expirationTime > block.timestamp);
    }

    function checkDelegation(address fromDID, address toDID, bytes32 dataKey) public view returns (bool) {
        return organizations[fromDID] && hasAccess(fromDID, dataKey) && delegations[dataKey][fromDID][toDID];
    }

    function hasAccess(address did, bytes32 dataKey) internal view returns (bool) {
        Access memory access = accessRights[dataKey][did];
        return access.grantedBy != address(0) && (access.expirationTime == 0 || access.expirationTime > block.timestamp);
    }
}