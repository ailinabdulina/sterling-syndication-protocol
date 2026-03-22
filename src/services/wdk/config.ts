// @ts-ignore
const getEnv = (key: string) => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
};

export const WDK_CONFIG = {
  network: getEnv('VITE_NETWORK') || 'sepolia',
  rpcUrl: getEnv('VITE_RPC_URL') || 'https://ethereum-sepolia-rpc.publicnode.com',
  chainId: Number(getEnv('VITE_CHAIN_ID')) || 11155111,
  usdtAddress: getEnv('VITE_USDT_ADDRESS') || '0xd077A400968890Eacc75cdc901F0356c943e4fDb',
  twislyStoryAddress: getEnv('VITE_TWISLY_STORY_ADDRESS') || '0x45933728ED383B8f7DAe014e5ebdcD8315aBA1a7',
};

export const TWISLY_STORY_ABI = [
  "function mintOriginal(uint256 _storyPrice, uint256 _twistPrice, uint32 _authorRoyaltyBps, uint32 _agentPercentBps, address _agent, string calldata _uri, string calldata _documentHash) external returns (uint256)",
  "function mintTwist(uint256 parentId, uint256 _storyPrice, string calldata _uri, string calldata _documentHash) external returns (uint256)",
  "function purchaseStory(uint256 tokenId) external",
  "function isUnlocked(uint256 tokenId, address user) external view returns (bool)",
  "function stories(uint256) external view returns (address author, bool isTwist, uint32 authorRoyalty, uint32 agentPercent, uint256 parentId, uint256 storyPrice, uint256 twistPrice, address agent)",
  "function documentHashes(uint256) external view returns (string)",
  "function pendingWithdrawals(address) external view returns (uint256)",
  "function withdraw() external"
];

export const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)"
];
