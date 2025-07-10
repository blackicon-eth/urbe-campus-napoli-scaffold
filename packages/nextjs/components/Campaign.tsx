import { useEffect, useState } from "react";
import { IntegerInput } from "./scaffold-eth/Input";
import { erc20Abi } from "viem";
import { useWriteContract } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { parseAmount } from "~~/utils";
import { USDC_ADDRESS } from "~~/utils/constants";

enum CampaignStatus {
  Active = 0,
  Completed = 1,
  Claimed = 2,
}

interface CampaignInterface {
  campaign: {
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

  // Use Write Contract function from wagmi
  const { writeContract } = useWriteContract();

  // Creates a write contract function that can be used to write to our deployed contract
  const { writeContractAsync } = useScaffoldWriteContract({
    contractName: "CrowdfundingPlatform",
  });

  // Handles the button click
  const handleButtonClick = async (campaignId: number) => {
    if (userAllowance < Number(amount)) {
      if (!CrowdfundingPlatformData?.address) return;
      try {
        writeContract({
          abi: erc20Abi,
          address: USDC_ADDRESS,
          functionName: "approve",
          args: [CrowdfundingPlatformData.address, BigInt(amount)],
        });
        await fetchAllowance();
      } catch (error) {
        console.error("Error approving: ", error);
      } finally {
        await refetchCampaigns();
      }
    } else {
      try {
        writeContractAsync({
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

  // Check how much the user has contributed to the campaign
  const { data: userContribution } = useScaffoldReadContract({
    contractName: "CrowdfundingPlatform",
    functionName: "getContributionByUser",
    args: [BigInt(index + 1), connectedAddress],
  });

  useEffect(() => {
    console.log(userContribution);
  }, [userContribution]);

  return (
    <div
      className="relative flex flex-col gap-4 border border-gray-300 rounded-xl bg-black/50 p-4 min-w-[300px] overflow-hidden"
      key={campaign.title}
    >
      {/* Status Badge */}
      <div className="absolute top-0 right-0">
        <span
          className={`${
            campaign.status === CampaignStatus.Active
              ? "bg-amber-500"
              : campaign.status === CampaignStatus.Completed
                ? "bg-green-500"
                : "bg-gray-500"
          } text-white px-2 py-1 rounded-bl-xl text-sm`}
        >
          {campaign.status === CampaignStatus.Active
            ? "Active"
            : campaign.status === CampaignStatus.Completed
              ? "Completed"
              : "Claimed"}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <label className="font-bold text-md">Title</label>
        <p className="my-0.5 text-xl">{campaign.title}</p>
      </div>
      <div className="flex flex-col gap-1">
        <label className="font-bold text-md">Description</label>
        <p className="my-0.5 text-xl">{campaign.description}</p>
      </div>
      <div className="flex flex-col gap-1">
        <label className="font-bold text-md">Goal</label>
        <p className="my-0.5 text-xl">{parseAmount(Number(campaign.goal))} USDC</p>
      </div>

      <div className="flex flex-col gap-1.5 mt-5">
        <IntegerInput
          value={amount.toString()}
          onChange={value => setAmount(Number(value))}
          disableMultiplyBy1e18
          placeholder="Amount you want to add"
        />
        <div className="flex justify-center items-center">
          <button
            className="bg-blue-500 text-white p-2 rounded-md w-[93%] hover:bg-blue-600 transition-all duration-300 hover:scale-105 cursor-pointer"
            onClick={() => {
              handleButtonClick(index + 1);
            }}
          >
            Contribute
          </button>
        </div>

        <div className="flex flex-col gap-1.5 mt-5">
          <div className="flex w-full justify-between items-center">
            <label className="font-bold text-md text-gray-400">Your Contribution</label>
            <p className="my-0 text-md">{parseAmount(Number(userContribution))} USDC</p>
          </div>
          <div className="flex w-full justify-between items-center">
            <label className="font-bold text-md">Total Contribution</label>
            <p className="my-0 text-md">{parseAmount(Number(campaign.amountRaised))} USDC</p>
          </div>
        </div>
      </div>
    </div>
  );
};
