"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { NextPage } from "next";
import { erc20Abi } from "viem";
import { usePublicClient } from "wagmi";
import { useAccount } from "wagmi";
import { Campaign } from "~~/components/Campaign";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";
import { useDeployedContractInfo, useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { USDC_ADDRESS } from "~~/utils/constants";

const Home: NextPage = () => {
  // States
  const [userAllowance, setUserAllowance] = useState(0);

  // Gets the connected wallet address
  const { address: connectedAddress } = useAccount();

  // Gets the deployed contract data for our deployed contract
  const { data: CrowdfundingPlatformData } = useDeployedContractInfo({ contractName: "CrowdfundingPlatform" });

  // Gets the current target network (from your config)
  const { targetNetwork } = useTargetNetwork();

  // Gets the public client for the current network
  const publicClient = usePublicClient({ chainId: targetNetwork.id });

  // Reads all the created campaigns from our deployed contract
  const {
    data: campaigns,
    refetch: refetchCampaigns,
    isLoading: isLoadingCampaigns,
  } = useScaffoldReadContract({
    contractName: "CrowdfundingPlatform",
    functionName: "getCampaigns",
  });

  // A function to fetch the allowance of the user (spender is the crowdfunding smart contract)
  const fetchAllowance = useCallback(async () => {
    if (!connectedAddress || !CrowdfundingPlatformData?.address || !publicClient) return;
    const data = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: "allowance",
      args: [connectedAddress, CrowdfundingPlatformData?.address],
    });
    setUserAllowance(Number(data));
  }, [connectedAddress, CrowdfundingPlatformData?.address, publicClient]);

  // When all the dependencies are here, it fetches the allowance of the user
  useEffect(() => {
    fetchAllowance();
  }, [fetchAllowance]);

  // It logs the allowance of the user to the console when it changes
  useEffect(() => {
    console.log("allowance", userAllowance);
  }, [userAllowance]);

  // Debounce the loading state
  const [debouncedIsLoadingCampaigns, setDebouncedIsLoadingCampaigns] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedIsLoadingCampaigns(isLoadingCampaigns);
    }, 2000);

    return () => clearTimeout(timer);
  }, [isLoadingCampaigns]);

  return (
    <div className="flex items-start size-full justify-center sm:py-20 py-7 sm:px-16 px-6 gap-10">
      <AnimatePresence mode="wait">
        {debouncedIsLoadingCampaigns ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="flex items-center justify-center mt-36"
          >
            <Loader2 className="animate-spin text-white size-10" />
          </motion.div>
        ) : (
          <motion.div
            key="campaigns"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="grid sm:grid-cols-4 grid-cols-1 gap-3 w-full place-items-center"
          >
            {campaigns?.map((campaign, index) => {
              return (
                <Campaign
                  key={index}
                  campaign={campaign}
                  userAllowance={userAllowance}
                  CrowdfundingPlatformData={CrowdfundingPlatformData}
                  index={index}
                  connectedAddress={connectedAddress || ""}
                  fetchAllowance={fetchAllowance}
                  refetchCampaigns={refetchCampaigns}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;
