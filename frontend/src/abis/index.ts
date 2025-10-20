// Import ABIs - these are Hardhat artifact files with metadata
import VaultManagerArtifact from './VaultManager.json';
import GMFOTTokenArtifact from './GMFOTToken.json';
import SavingsVaultArtifact from './SavingsVault.json';
import OracleManagerArtifact from './OracleManager.json';
import MockERC20Artifact from './MockERC20.json';
import IERC20Artifact from './IERC20.json';

// Type definition for Hardhat artifact structure
interface HardhatArtifact {
  abi: any[];
  bytecode: string;
  contractName: string;
  [key: string]: any;
}

// Extract just the ABI arrays from the artifact files
// Use double cast (unknown first) to handle TypeScript's strict type checking
export const VaultManagerABI = (VaultManagerArtifact as unknown as HardhatArtifact).abi;
export const GMFOTTokenABI = (GMFOTTokenArtifact as unknown as HardhatArtifact).abi;
export const SavingsVaultABI = (SavingsVaultArtifact as unknown as HardhatArtifact).abi;
export const OracleManagerABI = (OracleManagerArtifact as unknown as HardhatArtifact).abi;
export const MockERC20ABI = (MockERC20Artifact as unknown as HardhatArtifact).abi;
export const IERC20ABI = (IERC20Artifact as unknown as HardhatArtifact).abi;

// Export ABIs with proper typing
export const ABIS = {
  VaultManager: VaultManagerABI,
  GMFOTToken: GMFOTTokenABI,
  SavingsVault: SavingsVaultABI,
  OracleManager: OracleManagerABI,
  MockERC20: MockERC20ABI,
  IERC20: IERC20ABI,
} as const;
