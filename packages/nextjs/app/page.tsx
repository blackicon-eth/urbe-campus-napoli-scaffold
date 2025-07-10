"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
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

  return (
    <div className="flex items-start size-full justify-center py-20 px-16 gap-10">
      {isLoadingCampaigns ? (
        <div className="flex items-center justify-center mt-36">
          <Loader2 className="animate-spin text-white size-10" />
        </div>
      ) : (
        <div className="grid grid-cols-4 w-full place-items-center">
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
        </div>
      )}
    </div>
  );
};

export default Home;
