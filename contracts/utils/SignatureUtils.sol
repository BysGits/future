// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

// Signature Verification

contract SignatureUtils {
    function getMessageHash(
        address _kAssetAddress,
        uint256 _targetPrice,
        uint256 _deadline,
        bytes memory _id
    ) public pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    _kAssetAddress,
                    _targetPrice,
                    _deadline,
                    _id
                )
            );
    }

    // Verify mint signature
    function verifySignature(
        address _signer,
        address _kAssetAddress,
        uint256 _targetPrice,
        uint256 _deadline,
        bytes memory _id,
        bytes memory _signature
    ) public pure returns (bool) {
        bytes32 messageHash = getMessageHash(
            _kAssetAddress,
            _targetPrice,
            _deadline,
            _id
        );
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);

        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);

        return ecrecover(ethSignedMessageHash, v, r, s) == _signer;
    }

    // Split signature to r, s, v
    function splitSignature(
        bytes memory _signature
    ) public pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(_signature.length == 65, "invalid signature length");

        assembly {
            r := mload(add(_signature, 32))
            s := mload(add(_signature, 64))
            v := byte(0, mload(add(_signature, 96)))
        }
    }

    function getEthSignedMessageHash(
        bytes32 _messageHash
    ) public pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    "\x19Ethereum Signed Message:\n32",
                    _messageHash
                )
            );
    }
}
