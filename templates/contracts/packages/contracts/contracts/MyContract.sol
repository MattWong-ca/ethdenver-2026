// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title MyContract
/// @notice Starter contract — replace this with your own logic.
contract MyContract {
    address public owner;
    string public message;

    event MessageUpdated(address indexed sender, string newMessage);

    constructor(string memory _message) {
        owner = msg.sender;
        message = _message;
    }

    function setMessage(string calldata _message) external {
        message = _message;
        emit MessageUpdated(msg.sender, _message);
    }
}
