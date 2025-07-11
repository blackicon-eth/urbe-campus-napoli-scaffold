"use client";

import { useEffect, useState } from "react";
import { IntegerInput } from "./scaffold-eth/Input";
import { motion } from "motion/react";
import type { Address } from "viem";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { parseAmount } from "~~/utils";

enum CampaignStatus {
  Active = 0,
  Completed = 1,
  Claimed = 2,
}

interface CampaignInterface {
  campaign: {
    creator: Address;
    title: string;
    description: string;
    goal: bigint;
    amountRaised: bigint;
    status: number;
  };
  index: number;
  userAllowance: number;
  CrowdfundingPlatformData: any;
  connectedAddress: string;
  fetchAllowance: () => Promise<void>;
  refetchCampaigns: any;
}

export const Campaign = ({
  campaign,
  userAllowance,
  CrowdfundingPlatformData,
  index,
  connectedAddress,
  fetchAllowance,
  refetchCampaigns,
}: CampaignInterface) => {
  const [amount, setAmount] = useState(0);
  const [isClaimingFunds, setIsClaimingFunds] = useState(false);

  // Creates a write contract function that can be used to write to our deployed contract
  const { writeContractAsync: writeToCrowdfundingPlatformContract } = useScaffoldWriteContract({
    contractName: "CrowdfundingPlatform",
  });

  // Creates a write contract function that can be used to write to the USDC contract
  const { writeContractAsync: writeToUSDCContract } = useScaffoldWriteContract({
    contractName: "USDC",
  });

  // Handles the button click
  const handleButtonClick = async (campaignId: number, crowdfundingPlatformAddress: string) => {
    if (userAllowance < Number(amount)) {
      try {
        await writeToUSDCContract({
          functionName: "approve",
          args: [crowdfundingPlatformAddress, BigInt(amount)],
        });
        await fetchAllowance();
      } catch (error) {
        console.error("Error approving: ", error);
      } finally {
        await refetchCampaigns();
      }
    } else {
      try {
        writeToCrowdfundingPlatformContract({
          functionName: "contribute",
          args: [BigInt(campaignId), BigInt(amount)],
        });
      } catch (error) {
        console.error("Error contributing: ", error);
      } finally {
        await refetchCampaigns();
      }
    }
  };

  // Handles the button click for claiming funds
  const handleClaimFunds = async () => {
    try {
      setIsClaimingFunds(true);
      await writeToCrowdfundingPlatformContract({
        functionName: "withdraw",
        args: [BigInt(index + 1)],
      });
    } catch (error) {
      console.error("Error claiming funds: ", error);
    } finally {
      await refetchCampaigns();
      setIsClaimingFunds(false);
    }
  };

  // Check how much the user has contributed to the campaign
  const { data: userContribution } = useScaffoldReadContract({
    contractName: "CrowdfundingPlatform",
    functionName: "getContributionByUser",
    args: [BigInt(index + 1), connectedAddress],
  });

  // Logs the user contribution to the console when it changes
  useEffect(() => {
    console.log("userContribution", userContribution);
  }, [userContribution]);

  // Calculate progress percentage
  const progressPercentage = Math.min((Number(campaign.amountRaised) / Number(campaign.goal)) * 100, 100);

  // Get status configuration
  const getStatusConfig = (status: number) => {
    switch (status) {
      case CampaignStatus.Active:
        return {
          label: "Active",
          bgColor: "bg-gradient-to-r from-emerald-500 to-teal-500",
          textColor: "text-white",
          dotColor: "bg-emerald-400",
        };
      case CampaignStatus.Completed:
        return {
          label: "Completed",
          bgColor: "bg-gradient-to-r from-blue-500 to-indigo-500",
          textColor: "text-white",
          dotColor: "bg-blue-400",
        };
      case CampaignStatus.Claimed:
        return {
          label: "Claimed",
          bgColor: "bg-gradient-to-r from-gray-500 to-gray-600",
          textColor: "text-white",
          dotColor: "bg-gray-400",
        };
      default:
        return {
          label: "Unknown",
          bgColor: "bg-gray-500",
          textColor: "text-white",
          dotColor: "bg-gray-400",
        };
    }
  };

  const statusConfig = getStatusConfig(campaign.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 + index * 0.2 }}
      className="relative flex flex-col bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 w-full sm:w-[300px] overflow-hidden group"
      key={campaign.title}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30 dark:from-blue-900/10 dark:to-purple-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Status Badge */}
      <div className="absolute top-4 right-4 z-10">
        <div
          className={`${statusConfig.bgColor} ${statusConfig.textColor} px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1.5`}
        >
          <div className={`w-2 h-2 ${statusConfig.dotColor} rounded-full animate-pulse`} />
          {statusConfig.label}
        </div>
      </div>

      {/* Header Section */}
      <div className="relative z-10 mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 pr-20 leading-tight">{campaign.title}</h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed line-clamp-3">{campaign.description}</p>
      </div>

      {/* Goal and Progress Section */}
      <div className="relative z-10 mb-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Goal</span>
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            {parseAmount(Number(campaign.goal))} USDC
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-3 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 1, delay: 0.5 }}
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full relative"
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          </motion.div>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500 dark:text-gray-400">{progressPercentage.toFixed(1)}% funded</span>
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            {parseAmount(Number(campaign.amountRaised))} USDC raised
          </span>
        </div>
      </div>

      {/* Action Section */}
      <div className="relative z-10 mb-6">
        {campaign.status === CampaignStatus.Active ? (
          <div className="space-y-3">
            <IntegerInput
              value={amount.toString()}
              onChange={value => setAmount(Number(value))}
              disableMultiplyBy1e18
              placeholder="Enter contribution amount"
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
              onClick={() => {
                if (!CrowdfundingPlatformData?.address) return;
                handleButtonClick(index + 1, CrowdfundingPlatformData.address);
              }}
            >
              <span>Contribute Now</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </motion.button>
          </div>
        ) : campaign.status === CampaignStatus.Completed &&
          campaign.creator.toLowerCase() === connectedAddress.toLowerCase() ? (
          <motion.button
            whileHover={{ scale: isClaimingFunds ? 1 : 1.02 }}
            whileTap={{ scale: isClaimingFunds ? 1 : 0.98 }}
            className={`w-full font-semibold py-3 px-6 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 ${
              isClaimingFunds
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 hover:shadow-xl"
            } text-white`}
            onClick={handleClaimFunds}
            disabled={isClaimingFunds}
          >
            {isClaimingFunds ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Claiming...</span>
              </>
            ) : (
              <>
                <span>Claim Funds</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </>
            )}
          </motion.button>
        ) : campaign.status === CampaignStatus.Completed ? (
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Campaign Completed
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 font-semibold">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Funds Claimed
            </div>
          </div>
        )}
      </div>

      {/* Stats Section */}
      <div className="relative z-10 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Your Contribution
            </p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{parseAmount(Number(userContribution))}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">USDC</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Total Raised
            </p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {parseAmount(Number(campaign.amountRaised))}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">USDC</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
