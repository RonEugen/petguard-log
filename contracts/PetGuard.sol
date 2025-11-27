// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title PetGuard - Privacy-first pet care log DApp
/// @notice A smart contract for storing pet care logs with optional field-level encryption
/// @dev Sensitive data is encrypted using FHEVM, only the owner can decrypt
contract PetGuard is SepoliaConfig {
    /// @notice Care log entry structure
    struct CareLog {
        uint256 id;
        address owner;
        uint8 logType; // 0: feeding, 1: medication, 2: activity
        string title;
        string description;
        uint256 timestamp;
        bool hasEncryptedData;
        euint32 encryptedSensitiveData; // Encrypted sensitive information
    }

    /// @notice Mapping from log ID to CareLog
    mapping(uint256 => CareLog) public careLogs;
    
    /// @notice Mapping from owner address to array of log IDs
    mapping(address => uint256[]) public ownerLogs;
    
    /// @notice Total number of logs created
    uint256 public totalLogs;

    /// @notice Event emitted when a new care log is created
    event CareLogCreated(
        uint256 indexed logId,
        address indexed owner,
        uint8 logType,
        string title,
        uint256 timestamp
    );

    /// @notice Create a new care log entry
    /// @param logType Type of care log (0: feeding, 1: medication, 2: activity)
    /// @param title Title of the care log
    /// @param description Description of the care log (public)
    /// @param encryptedSensitiveData Encrypted sensitive data (if provided)
    /// @param inputProof Proof for the encrypted data
    /// @return logId The ID of the newly created log
    function createCareLog(
        uint8 logType,
        string memory title,
        string memory description,
        externalEuint32 encryptedSensitiveData,
        bytes calldata inputProof
    ) external returns (uint256) {
        require(logType <= 2, "Invalid log type");
        require(bytes(title).length > 0, "Title cannot be empty");

        uint256 logId = totalLogs;
        totalLogs++;

        bool hasEncrypted = inputProof.length > 0;
        euint32 encryptedData;

        if (hasEncrypted) {
            encryptedData = FHE.fromExternal(encryptedSensitiveData, inputProof);
            FHE.allowThis(encryptedData);
            FHE.allow(encryptedData, msg.sender);
        }

        careLogs[logId] = CareLog({
            id: logId,
            owner: msg.sender,
            logType: logType,
            title: title,
            description: description,
            timestamp: block.timestamp,
            hasEncryptedData: hasEncrypted,
            encryptedSensitiveData: encryptedData
        });

        ownerLogs[msg.sender].push(logId);

        emit CareLogCreated(logId, msg.sender, logType, title, block.timestamp);

        return logId;
    }

    /// @notice Get a care log by ID (returns encrypted data as handle)
    /// @param logId The ID of the log to retrieve
    /// @return owner The owner of the log
    /// @return logType The type of the log
    /// @return title The title of the log
    /// @return description The description of the log
    /// @return timestamp The timestamp when the log was created
    /// @return hasEncryptedData Whether the log has encrypted data
    /// @return encryptedSensitiveData The encrypted sensitive data (handle)
    function getCareLog(uint256 logId)
        external
        view
        returns (
            address owner,
            uint8 logType,
            string memory title,
            string memory description,
            uint256 timestamp,
            bool hasEncryptedData,
            euint32 encryptedSensitiveData
        )
    {
        CareLog memory log = careLogs[logId];
        require(log.owner != address(0), "Log does not exist");
        
        return (
            log.owner,
            log.logType,
            log.title,
            log.description,
            log.timestamp,
            log.hasEncryptedData,
            log.encryptedSensitiveData
        );
    }

    /// @notice Get all log IDs for an owner
    /// @param owner The address of the owner
    /// @return An array of log IDs
    function getOwnerLogs(address owner) external view returns (uint256[] memory) {
        return ownerLogs[owner];
    }

    /// @notice Get the total number of logs
    /// @return The total number of logs
    function getTotalLogs() external view returns (uint256) {
        return totalLogs;
    }
}


