// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title FileRegistry
/// @notice Records on-chain provenance for files stored on 0G decentralized storage.
///         The actual file bytes live off-chain; only the content ID (merkle root) is stored here.
contract FileRegistry {
    struct FileRecord {
        string contentId; // 0G storage merkle root / content identifier
        string filename;  // original filename for display purposes
        uint256 timestamp;
    }

    // owner => list of file records
    mapping(address => FileRecord[]) private _files;

    event FileUploaded(
        address indexed owner,
        string contentId,
        string filename,
        uint256 timestamp
    );

    /// @notice Register a file that has been uploaded to 0G storage.
    /// @param contentId The merkle root / content ID returned by the 0G storage SDK.
    /// @param filename  The original filename (for display only).
    function registerFile(string calldata contentId, string calldata filename) external {
        require(bytes(contentId).length > 0, "FileRegistry: contentId required");
        require(bytes(filename).length > 0, "FileRegistry: filename required");

        _files[msg.sender].push(FileRecord({
            contentId: contentId,
            filename: filename,
            timestamp: block.timestamp
        }));

        emit FileUploaded(msg.sender, contentId, filename, block.timestamp);
    }

    /// @notice Return all file records for a given owner.
    function getFiles(address owner) external view returns (FileRecord[] memory) {
        return _files[owner];
    }

    /// @notice Return the total number of files registered by an owner.
    function getFileCount(address owner) external view returns (uint256) {
        return _files[owner].length;
    }
}
