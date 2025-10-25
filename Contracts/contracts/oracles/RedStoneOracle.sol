// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// RedStone Classic interface (copy this; no import needed)
interface IRedstoneCore {
    function getPrice(bytes32 dataFeedId, bytes calldata signedData) external view returns (uint256);
    // Add more if needed, from https://github.com/redstone-finance/redstone-oracles-monorepo/blob/main/packages/evm-connector/contracts/core/RedstoneConsumerV3.sol
}

// Inherit from RedstoneConsumerV3 for verification (copy code or install @redstone-finance/evm-connector)
abstract contract RedstoneConsumerV3 {
    error InvalidCalldataPointer();
    error InvalidUniqueSignersThreshold();
    error SignerNotAuthorised(address signer);
    error InsufficientNumberOfUniqueSigners(uint256 receivedSignersCount, uint256 requiredSignersCount);
    error CalldataOverOrUnderFlow();
    error IncorrectUnsignedMetadataSize();
    error EachSignerMustProvideTheSameValue();
    error EmptyCalldataPointersArr();
    error InvalidSignature();
    error SignatureReplay();
    error CalldataMustHaveValidPayload();

    uint256 internal constant SIG_SIZE = 65;
    uint256 internal constant UNSIGNED_METADATA_BYTE_SIZE = 3;
    uint256 internal constant DATA_PACKAGES_COUNT_BYTE_SIZE = 1;
    uint256 internal constant DATA_POINTS_COUNT_BYTE_SIZE = 4;
    uint256 internal constant DATA_POINT_VALUE_BYTE_SIZE = 32;
    uint256 internal constant DATA_POINT_SYMBOL_BYTE_SIZE = 32;
    uint256 internal constant DEFAULT_DATA_POINT_VALUE_BYTE_SIZE = 10;
    uint256 internal constant REDSTONE_MARKER_BYTE_SIZE = 9;
    uint256 internal constant REDSTONE_MARKER = 0x000002ed57011e0000;

    uint8 internal constant MIN_UNIQUE_SIGNERS = 1;

    // Override in child contracts
    function getDataServiceId() public view virtual returns (string memory);
    function getUniqueSignersThreshold() public view virtual returns (uint8);
    function getAuthorisedSignerIndex(address signerAddress) public view virtual returns (uint8);

    function aggregateValues(bytes32[] memory values) public pure virtual returns (uint256);

    function validateTimestamp(uint256 receivedTimestampMilliseconds) public view virtual;

    function getDataFeedIds() public view virtual returns (bytes32[] memory);

    function getDataFeedIdAtIndex(uint256 index) public view returns (bytes32) {
        bytes32[] memory dataFeedIds = getDataFeedIds();
        return dataFeedIds[index];
    }

    function extractTimestampsAndAssertAllAreEqual() internal pure returns (uint256 extractedTimestamp) {
        uint256 dataPackagesCount = getDataPackagesCountFromCalldata();

        uint256 lastExtractedTimestamp = 0;

        uint256 defaultDataPointValueByteSize = getDataPointValueByteSize();
        uint256 dataPointValueByteSize;
        uint256 currentDataPackageByteOffsetInCalldata = 0;

        for (uint256 dataPackageIndex = 0; dataPackageIndex < dataPackagesCount; dataPackageIndex++) {
            {
                uint256 dataPointsCount = getDataPointsCount(currentDataPackageByteOffsetInCalldata);
                uint256 dataPackageByteSize = SIG_SIZE + UNSIGNED_METADATA_BYTE_SIZE + dataPointsCount * DATA_POINT_SYMBOL_BYTE_SIZE + dataPointsCount * defaultDataPointValueByteSize + DATA_POINTS_COUNT_BYTE_SIZE + REDSTONE_MARKER_BYTE_SIZE;

                currentDataPackageByteOffsetInCalldata += dataPackageByteSize;
            }

            uint256 currentDataPointValueByteOffsetInPackage = currentDataPackageByteOffsetInCalldata - REDSTONE_MARKER_BYTE_SIZE - defaultDataPointValueByteSize;

            for (uint256 dataPointIndex = 0; dataPointIndex < getDataPointsCount(currentDataPackageByteOffsetInCalldata); dataPointIndex++) {
                assembly {
                    dataPointValueByteSize := calldataload(currentDataPointValueByteOffsetInPackage)
                }
                currentDataPointValueByteOffsetInPackage -= dataPointValueByteSize + DATA_POINT_VALUE_BYTE_SIZE;
            }

            uint256 timestampByteOffsetInPackage = currentDataPointValueByteOffsetInPackage - DATA_TIMESTAMP_BYTE_SIZE;
            uint256 currentExtractedTimestamp;
            assembly {
                currentExtractedTimestamp := calldataload(timestampByteOffsetInPackage)
            }
            if (lastExtractedTimestamp == 0) {
                lastExtractedTimestamp = currentExtractedTimestamp;
            } else if (currentExtractedTimestamp != lastExtractedTimestamp) {
                revert EachSignerMustProvideTheSameValue();
            }
        }
        extractedTimestamp = lastExtractedTimestamp;
        validateTimestamp(extractedTimestamp);
    }

    // Stubbed for brevity; copy full from RedStone GitHub if needed
    // ... (add the rest of the verification logic from RedstoneConsumerV3.sol)
}

contract RedStonePriceConsumer is RedstoneConsumerV3 {
    // Override RedStone functions
    function getDataServiceId() public view override returns (string memory) {
        return "redstone"; // Or "redstone-avax-prod" for test
    }

    function getUniqueSignersThreshold() public view override returns (uint8) {
        return 1; // Adjust for security
    }

    function getAuthorisedSignerIndex(address signerAddress) public view override returns (uint8) {
        // Add authorised signers, e.g., if (signerAddress == 0x... ) return 0;
        revert("Implement authorised signers");
    }

    function aggregateValues(bytes32[] memory values) public pure override returns (uint256) {
        // Simple median or average; implement as needed
        return uint256(values[0]);
    }

    function validateTimestamp(uint256 receivedTimestampMilliseconds) public view override {
        // Check staleness, e.g., require(block.timestamp * 1000 - receivedTimestampMilliseconds < 1 hours);
    }

    function getDataFeedIds() public view override returns (bytes32[] memory) {
        bytes32[] memory ids = new bytes32[](2);
        ids[0] = bytes32("ETH");
        ids[1] = bytes32("LSK");
        return ids;
    }

    // Fetch price (call with signed data in calldata)
    function getETHPrice(bytes calldata signedData) public view returns (uint256) {
        bytes32[] memory dataFeedIds = new bytes32[](1);
        dataFeedIds[0] = bytes32("ETH");
        uint256[] memory prices = getOracleNumericValuesFromTxMsg(dataFeedIds);
        return prices[0]; // Scaled by 8 decimals typically
    }

    function getLSKPrice(bytes calldata signedData) public view returns (uint256) {
        bytes32[] memory dataFeedIds = new bytes32[](1);
        dataFeedIds[0] = bytes32("LSK");
        uint256[] memory prices = getOracleNumericValuesFromTxMsg(dataFeedIds);
        return prices[0];
    }
}
