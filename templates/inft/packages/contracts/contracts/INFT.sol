// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title INFT — Intelligent NFT
/// @notice ERC-721 token where each token's metadata is stored on 0G decentralized storage.
///         The encrypted URI points to a root hash on 0G Storage; the metadata hash provides
///         on-chain verifiability of the underlying data.
contract INFT is ERC721, Ownable {
    /// @dev Maps tokenId → 0G Storage root hash (the encrypted metadata URI)
    mapping(uint256 => string) private _encryptedURIs;

    /// @dev Maps tokenId → keccak256 hash of the plaintext metadata JSON
    mapping(uint256 => bytes32) private _metadataHashes;

    uint256 private _nextTokenId = 1;

    event INFTMinted(uint256 indexed tokenId, address indexed owner, bytes32 metadataHash, string encryptedURI);

    constructor(string memory name, string memory symbol) ERC721(name, symbol) Ownable(msg.sender) {}

    /// @notice Mint a new INFT. Only the contract owner (deployer) can mint.
    /// @param to          Recipient address
    /// @param encryptedURI 0G Storage root hash where the encrypted metadata lives
    /// @param metadataHash keccak256 of the plaintext metadata — lets anyone verify integrity
    function mint(
        address to,
        string calldata encryptedURI,
        bytes32 metadataHash
    ) external onlyOwner returns (uint256 tokenId) {
        tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _encryptedURIs[tokenId] = encryptedURI;
        _metadataHashes[tokenId] = metadataHash;
        emit INFTMinted(tokenId, to, metadataHash, encryptedURI);
    }

    /// @notice Returns the 0G Storage root hash for a given token's metadata.
    function getEncryptedURI(uint256 tokenId) external view returns (string memory) {
        return _encryptedURIs[tokenId];
    }

    /// @notice Returns the keccak256 hash of the token's metadata for on-chain verification.
    function getMetadataHash(uint256 tokenId) external view returns (bytes32) {
        return _metadataHashes[tokenId];
    }
}
