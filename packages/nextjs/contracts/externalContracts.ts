import { erc20Abi } from "viem";
import { USDC_ADDRESS } from "~~/utils/constants";
import { GenericContractsDeclaration } from "~~/utils/scaffold-eth/contract";

/**
 * @example
 * const externalContracts = {
 *   1: {
 *     DAI: {
 *       address: "0x...",
 *       abi: [...],
 *     },
 *   },
 * } as const;
 */
const externalContracts = {
  84532: {
    USDC: {
      address: USDC_ADDRESS,
      abi: erc20Abi,
    },
  },
} as const;

export default externalContracts satisfies GenericContractsDeclaration;
