import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Activity,
  ArrowDownRight,
  CreditCard,
  Image as ImageIcon,
  MessageSquare,
  Heart,
  Repeat,
  ExternalLink,
  Loader2,
  Bookmark,
  Share2,
  Music,
  Play,
  Globe,
  MoreHorizontal,
  ThumbsUp,
  ArrowBigUp,
  ArrowBigDown,
  BadgeCheck,
  ThumbsDown,
  MoreVertical,
  X,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { collection, query, where, onSnapshot, addDoc, getDocs, limit } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { StoryData } from "../types";
import { MarketingExecutionSchema } from "../schemas";
import { TrustBadge } from "../components/dashboard/TrustBadge";
import { ethers } from "ethers";
import { extractJsonFromString, unwrapBackendResponse } from "../utils/jsonUtils";
import { wdk } from "../services/wdk/WdkCore";
import { TreasureChest } from "../components/icons/TreasureChest";

interface AdvertisingViewProps {
  setCurrentView: (
    view: "dashboard" | "new" | "syndicate" | "advertising",
  ) => void;
  analyzedStory?: StoryData | null;
}

const mockMarketingExecution = {
  type: "marketing_execution",
  status: "completed",
  processorVersion: "marketing-execution-v1",
  validationPassed: true,
  completedAt: "2026-03-18T16:04:12.000Z",
  result: {
    executed: true,
    settlement_task_id: "SETTLEMENT_TASK_ID",
    author_uid: "AUTHOR_UID",
    story_title: "Moonbound Fey Pact",
    source_syndicate_task_id: "SYNDICATE_TASK_ID",
    source_analyze_task_id: "mock-task-id",
    contract_terms: {
      amount_usd: 180,
      equity_pct: 9,
      ad_spend_pct: 35,
      influencer_pct: 5,
      quality_improvement_pct: 60,
      rights_requests: ["Monthly KPI reporting rights"],
      special_terms: ["Kill switch if CAC exceeds ₮6 for 30 consecutive days"],
      pricing_terms: {
        base_story_price: 1.99,
        paid_choices_per_chapter: 2,
        paid_choice_price: 0.49,
        premium_route_unlock: 1.49,
        bundle_price: 3.99,
      },
      content_plan_terms: {
        target_chapters: 5,
        choice_density: "2 paid + 1 free per chapter",
        paywall_rules: "before reveal/confession/betrayal",
        max_hard_paywalls_per_session: 2,
      },
    },
    budget_execution: {
      total_amount_usd: 180,
      ad_spend_pct: 35,
      influencer_pct: 5,
      quality_improvement_pct: 60,
      channels_count: 10,
    },
    channel_transfers: [
      {
        channel_id: "tiktok_ads",
        lane: "ad",
        platform: "TikTok Ads",
        allocated_amount_usd: 18.9,
        channel_wallet_id: "wallet_tiktok_ads",
        channel_wallet_address: "0x1234567890abcdef",
        tx_hash: "0xabc123def456",
        explorer_url: "https://sepolia.etherscan.io/tx/0xabc123def456",
      },
      {
        channel_id: "voiceover_studio",
        lane: "quality",
        platform: "Voiceover Studio",
        allocated_amount_usd: 48.6,
        channel_wallet_id: "wallet_voiceover_studio",
        channel_wallet_address: "0xfedcba0987654321",
        tx_hash: "0xdef456abc123",
        explorer_url: "https://sepolia.etherscan.io/tx/0xdef456abc123",
      },
    ],
    marketing_posts: [
      {
        platform: "TikTok",
        format: "15s hook video ad",
        caption:
          "POV: you just entered How Monsters Are Created and one choice changes everything. Best paywall point: the moment the rescuer shoves the boy under the thorn bush and disappears, immediately before the survivor sorting and his realization of what is about to happen.",
        creative_brief:
          "Fast-cut captions, dramatic sting at 0:07, CTA to unlock next branch.",
      },
      {
        platform: "Meta Ads",
        format: "feed + story ad set",
        caption: "How Monsters Are Created: one decision flips survival into trust. Tap to choose your route.",
        creative_brief: "A/B creatives: fear hook vs relationship hook; optimize for installs."
      },
      {
        platform: "Reddit Ads",
        format: "discussion ad",
        caption: "\"On the scorched world of Handan, a boy relives the day his village was annihilated and his family was taken from him in ...\"\nWould you trust your captor if he saved your life?",
        creative_brief: "Question-led post to spark comments and branch-choice debate."
      },
      {
        platform: "X",
        format: "quote thread ad",
        caption: '"On the scorched world of Handan, a boy relives the day his village was annihilated and his family was taken from him in ..."\nIf you had one choice here, what would you do next?',
        creative_brief:
          "Thread with 3 choice-poll replies; pin paywall teaser panel.",
      },
      {
        platform: "TikTok Creators",
        format: "creator reaction collab",
        caption: "Creator reacts to How Monsters Are Created betrayal/protection twist and asks audience to pick a side.",
        creative_brief: "Duet/stitch format with branch-choice CTA."
      },
      {
        platform: "Instagram Reels",
        format: "ship/character reel",
        caption: "How Monsters Are Created: chemistry, conflict, and one dangerous decision. Which route are you taking?",
        creative_brief: "Character cards + route labels + CTA to choose a branch."
      },
      {
        platform: "YouTube Shorts",
        format: "30s recap + cliffhanger",
        caption: "How Monsters Are Created in 30 seconds: captivity, mistrust, and a choice that rewrites everything.",
        creative_brief: "Quick recap ending on CTA to unlock next chapter route."
      },
      {
        platform: "Owned Media",
        format: "voice teaser asset",
        caption: "New voiced teaser for How Monsters Are Created: hear the moment trust breaks and reforms.",
        creative_brief: "Produce voiced hook clip for reuse across paid/social posts."
      },
      {
        platform: "Owned Media",
        format: "character art drop",
        caption: "How Monsters Are Created character art pack released: pick your route allegiance.",
        creative_brief: "Poster + route-themed cards for campaign creative refresh."
      },
      {
        platform: "Owned Media",
        format: "quality patch note",
        caption: "How Monsters Are Created narrative polish update: improved pacing and cleaner route choice prompts.",
        creative_brief: "Publish transparent quality update to improve conversion confidence."
      }
    ],
    performance_mock: {
      note: "Synthetic but budget-constrained marketing KPIs for frontend demo. Values are scaled to spend and channel type.",
      channel_metrics: [
        {
          channel_id: "tiktok_ads",
          lane: "ad",
          spend_usd: 1890,
          impressions: 247100,
          clicks: 3300,
          installs: 700,
          purchases: 100,
          ctr_pct: 1.34,
          cpc_usd: 0.57,
          cvr_install_pct: 21.21,
          cvr_purchase_pct: 14.29,
        },
        {
          channel_id: "voiceover_studio",
          lane: "quality",
          spend_usd: 4860,
          assets_produced: 40,
          views: 281300,
          clicks: 2200,
          installs: 500,
          purchases: 20,
          ctr_pct: 0.78,
          cpc_usd: 2.21,
          cvr_install_pct: 22.73,
          cvr_purchase_pct: 4,
        },
      ],
      summary: {
        spend_usd: 6750,
        impressions: 528400,
        clicks: 5500,
        installs: 1200,
        purchases: 120,
        ctr_pct: 1.04,
        cpc_usd: 1.22,
        cpi_usd: 5.62,
        cac_purchase_usd: 56.25,
      },
    },
    revenue_mock: {
      note: "Synthetic monetization projection from investor pricing terms and simulated funnel outputs.",
      pricing_terms: {
        base_story_price: 1.99,
        paid_choices_per_chapter: 2,
        paid_choice_price: 0.49,
        premium_route_unlock: 1.49,
        bundle_price: 3.99,
      },
      content_plan_terms: {
        target_chapters: 5,
        choice_density: "2 paid + 1 free per chapter",
        paywall_rules: "before reveal/confession/betrayal",
        max_hard_paywalls_per_session: 2,
      },
      projection: {
        installs: 1200,
        buyers: 120,
        monetization_mix: {
          base_sales: 120,
          choice_payers: 60,
          route_buyers: 30,
          bundle_buyers: 10,
        },
        revenue_breakdown_usd: {
          base_story: 238.8,
          paid_choices: 58.8,
          premium_routes: 44.7,
          bundles: 39.9,
          total: 382.2,
        },
      },
      roas: {
        spend_usd: 6750,
        projected_revenue_usd: 382.2,
        roas_ratio: 0.06,
      },
    },
  },
};

const marketingCache = new Map<string, any>();
const seenAnimations = new Set<string>();

const generateFakePurchases = (id: string | undefined) => {
  if (!id) return Math.floor(Math.random() * 2900) + 100;
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return 100 + (Math.abs(hash) % 2901);
};

export const AdvertisingView: React.FC<AdvertisingViewProps> = ({
  setCurrentView,
  analyzedStory,
}) => {
  const { user, requestPin } = useAuth();
  const [marketingData, setMarketingData] = useState<any>(() => {
    if (analyzedStory?.taskId === "mock-task-id") {
      marketingCache.set("mock-task-id", mockMarketingExecution.result);
      return mockMarketingExecution.result;
    }
    if (analyzedStory?.taskId && marketingCache.has(analyzedStory.taskId)) {
      return marketingCache.get(analyzedStory.taskId);
    }
    return null;
  });

  const [skipAnimations] = useState(() => {
    if (analyzedStory?.taskId === "mock-task-id") {
      return true;
    }
    if (analyzedStory?.taskId) {
      return seenAnimations.has(analyzedStory.taskId);
    }
    return false;
  });

  // Animation states
  const [displayedBudget, setDisplayedBudget] = useState(0);
  const [displayedPurchases, setDisplayedPurchases] = useState(0);
  const [displayedTransfers, setDisplayedTransfers] = useState<any[]>([]);
  const [displayedPosts, setDisplayedPosts] = useState<any[]>([]);
  const [isBuying, setIsBuying] = useState(false);
  const [buySuccess, setBuySuccess] = useState(false);
  const [buyResult, setBuyResult] = useState<any>(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [isCheckingPurchase, setIsCheckingPurchase] = useState(true);
  const [pendingBalance, setPendingBalance] = useState<string>("0.00");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showPendingContractModal, setShowPendingContractModal] = useState(false);
  const [pendingContractTaskId, setPendingContractTaskId] = useState<string | null>(null);
  const unsubscribeRef = React.useRef<(() => void) | null>(null);
  const carouselRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pendingTaskId = localStorage.getItem('pending_marketing_execution');
    if (pendingTaskId) {
      setPendingContractTaskId(pendingTaskId);
      setShowPendingContractModal(true);
      localStorage.removeItem('pending_marketing_execution');
    }
  }, []);

  useEffect(() => {
    if (!user || !analyzedStory) return;

    const fetchBalances = async () => {
      try {
        const balance = await wdk.getPendingWithdrawals(user.uid);
        setPendingBalance(balance);
      } catch (error) {
        console.error("Error fetching pending balance:", error);
      }
    };
    fetchBalances();
  }, [user, analyzedStory]);

  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Check if user has already purchased this story
  useEffect(() => {
    if (!user || !analyzedStory) {
      setIsCheckingPurchase(false);
      return;
    }

    const checkPurchaseStatus = async () => {
      try {
        let currentTokenId = analyzedStory.tokenId;
        
        // Recover tokenId if missing
        if (currentTokenId === undefined || currentTokenId === null) {
          if (analyzedStory.txHash && analyzedStory.txHash.startsWith("0x")) {
            try {
              let provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
              let receipt = await provider.getTransactionReceipt(analyzedStory.txHash);
              
              if (!receipt) {
                provider = new ethers.JsonRpcProvider("https://rpc.sepolia.org");
                receipt = await provider.getTransactionReceipt(analyzedStory.txHash);
              }

              if (receipt && receipt.logs) {
                for (const log of receipt.logs) {
                  if (log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' && log.topics.length === 4) {
                    currentTokenId = Number(log.topics[3]);
                    break;
                  }
                }
              }
            } catch (e) {
              console.error("Failed to recover tokenId for purchase check", e);
            }
          }
        }

        if (currentTokenId === undefined || currentTokenId === null) {
          setIsCheckingPurchase(false);
          return;
        }

        const q = query(
          collection(db, "agent_tasks"),
          where("authorUid", "==", user.uid),
          where("type", "==", "buy_story")
        );
        
        const querySnapshot = await getDocs(q);
        let purchased = false;
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (
            data.payload && 
            String(data.payload.storyId) === String(currentTokenId) &&
            (data.status === "completed" || data.status === "pending")
          ) {
            purchased = true;
          }
        });
        
        setHasPurchased(purchased);
      } catch (error) {
        console.error("Error checking purchase status:", error);
      } finally {
        setIsCheckingPurchase(false);
      }
    };

    checkPurchaseStatus();
  }, [user, analyzedStory]);

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -320, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 320, behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (!analyzedStory) return;

    if (analyzedStory.taskId === "mock-task-id") {
      if (!marketingData) {
        setMarketingData(mockMarketingExecution.result);
      }
      return;
    }

    if (!user) return;

    const q = query(
      collection(db, "agent_tasks"),
      where("authorUid", "==", user.uid),
      where("type", "==", "marketing_execution"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Find the task that matches our source_analyze_task_id
      const task = snapshot.docs.find((doc) => {
        const data = doc.data();
        return (
          data.payload?.source_analyze_task_id === analyzedStory.taskId ||
          data.result?.source_analyze_task_id === analyzedStory.taskId ||
          data.payload?.sourceTaskId === analyzedStory.taskId
        );
      });

      if (task) {
        const data = task.data();
        if (data.status === "completed" && data.result) {
          let parsedResult = data.result;
          if (typeof parsedResult === "string") {
            try {
              let cleanStr = parsedResult.trim();
              cleanStr = extractJsonFromString(cleanStr);
              parsedResult = JSON.parse(cleanStr);
            } catch (e) {
              console.error("Failed to parse marketing execution result", e);
              return;
            }
          }
          
          parsedResult = unwrapBackendResponse(parsedResult);

          // Inject top-level verificationReport if it exists
          if (data.verificationReport && !parsedResult.verification_report) {
            parsedResult.verification_report = data.verificationReport;
          }

          const validationResult =
            MarketingExecutionSchema.safeParse(parsedResult);
          if (validationResult.success) {
            marketingCache.set(analyzedStory.taskId, validationResult.data);
            setMarketingData(validationResult.data);
          } else {
            console.warn(
              "Invalid marketing data format:",
              validationResult.error,
            );
          }
        }
      }
    });

    return () => unsubscribe();
  }, [user, analyzedStory]);

  // Animation effect
  useEffect(() => {
    if (!marketingData) return;

    if (skipAnimations) {
      setDisplayedBudget(marketingData.budget_execution?.total_amount_usd || 0);
      setDisplayedPurchases(generateFakePurchases(analyzedStory?.taskId));
      
      const allTransfers =
        marketingData.channel_transfers?.map((transfer: any, index: number) => ({
          id: `TX-${9921 - index}`,
          date: "Today",
          platform: transfer.platform,
          campaign: `${transfer.lane} allocation`,
          amount: -transfer.allocated_amount_usd,
          status: "Completed",
          hash: transfer.tx_hash
            ? `${transfer.tx_hash.substring(0, 6)}...${transfer.tx_hash.substring(transfer.tx_hash.length - 4)}`
            : "0x...",
          explorer_url: transfer.explorer_url,
          isDeposit: false,
        })) || [];

      if (marketingData.budget_execution?.total_amount_usd) {
        allTransfers.unshift({
          id: `TX-9000`,
          date: "Initial",
          platform: analyzedStory.investorAgentName || "Syndicate",
          campaign: "Initial Funding",
          amount: marketingData.budget_execution.total_amount_usd,
          status: "Deposit",
          hash: analyzedStory.txHash 
            ? `${analyzedStory.txHash.substring(0, 6)}...${analyzedStory.txHash.substring(analyzedStory.txHash.length - 4)}` 
            : "0x...",
          fullHash: analyzedStory.txHash || "0x...",
          explorer_url: analyzedStory.txHash 
            ? `https://sepolia.etherscan.io/tx/${analyzedStory.txHash}` 
            : "#",
          isDeposit: true,
        });
      }
      setDisplayedTransfers(allTransfers);

      const allPosts = [
        ...(marketingData.marketing_posts?.map((post: any, index: number) => {
          const prefixes = ["book", "story", "read", "novel", "fiction", "tale", "lore", "myth", "epic", "saga", "plot"];
          const suffixes = ["tok", "junkie", "daily", "reads", "hub", "fan", "geek", "nerd", "lover", "addict", "verse"];
          const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
          const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
          const num = Math.floor(Math.random() * 999);
          
          const handle = (post.platform || "").includes("YouTube")
            ? `${prefix.charAt(0).toUpperCase() + prefix.slice(1)} ${suffix.charAt(0).toUpperCase() + suffix.slice(1)} ${num > 500 ? num : ''}`.trim()
            : `@${prefix}_${suffix}${num > 500 ? num : ''}`;
                  
          const metrics = marketingData.performance_mock?.channel_metrics?.find(
            (m: any) => m.channel_id === post.channel_id,
          );
          
          const impressions = metrics?.impressions || Math.floor(Math.random() * 50000 + 10000);
          const clicks = metrics?.clicks || Math.floor(Math.random() * 2000 + 100);
          
          const likeMult = 0.02 + Math.random() * 0.08;
          const commentMult = 0.1 + Math.random() * 0.3;
          const shareMult = 0.2 + Math.random() * 0.6;
          
          return {
            platform: post.platform,
            format: post.format,
            channel_id: post.channel_id,
            spend: metrics?.spend_usd || 0,
            handle,
            content: post.caption,
            likes: Math.floor(impressions * likeMult).toLocaleString(),
            comments: Math.floor(clicks * commentMult).toLocaleString(),
            shares: Math.floor(clicks * shareMult).toLocaleString(),
            image:
              (post.platform || "").includes("TikTok")
                ? `https://picsum.photos/seed/${analyzedStory?.taskId}-tiktok${index + 100}/1080/1920`
                : (post.platform || "").includes("Meta") || (post.platform || "").includes("Instagram")
                  ? `https://picsum.photos/seed/${analyzedStory?.taskId}-meta${index + 200}/1080/1080`
                  : (post.platform || "").includes("Reddit")
                    ? `https://picsum.photos/seed/${analyzedStory?.taskId}-reddit${index + 300}/1080/1080`
                    : (post.platform || "").includes("X")
                      ? `https://picsum.photos/seed/${analyzedStory?.taskId}-x${index + 400}/1080/1080`
                      : (post.platform || "").includes("YouTube")
                        ? `https://picsum.photos/seed/${analyzedStory?.taskId}-youtube${index + 500}/1080/1920`
                        : `https://picsum.photos/seed/${analyzedStory?.taskId}-other${index + 600}/1080/1080`,
            avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${handle.replace('@', '')}`,
            roi: "+" + (Math.floor(Math.random() * 200) + 100) + "%",
          };
        }) || []),
        ...(marketingData.purchased_assets?.map((asset: any, index: number) => {
          const prefixes = ["art", "design", "create", "draw", "paint", "sketch", "pixel", "vector", "craft", "studio"];
          const suffixes = ["pro", "master", "guru", "ninja", "wizard", "expert", "star", "king", "queen", "lord"];
          const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
          const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
          const num = Math.floor(Math.random() * 999);
          const handle = `@${prefix}_${suffix}${num > 500 ? num : ''}`;

          return {
            platform: asset.provider || "Asset",
            format: asset.asset_type || "art",
            channel_id: `asset-${index}`,
            spend: asset.cost_usd || 0,
            handle: handle,
            content: asset.description || "Purchased Asset",
            likes: Math.floor(Math.random() * 5000 + 1000).toLocaleString(),
            comments: Math.floor(Math.random() * 200 + 10).toLocaleString(),
            shares: Math.floor(Math.random() * 500 + 50).toLocaleString(),
            image: `https://picsum.photos/seed/${analyzedStory?.taskId}-asset${index + 700}/1080/1080`,
            avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${handle.replace('@', '')}`,
            roi: "+" + (Math.floor(Math.random() * 200) + 100) + "%",
          };
        }) || [])
      ];
      setDisplayedPosts(allPosts);
      
      if (analyzedStory?.taskId) {
        seenAnimations.add(analyzedStory.taskId);
      }
      return;
    }

    // 1. Animate Budget
    const targetBudget = marketingData.budget_execution?.total_amount_usd || 0;
    let currentBudget = 0;
    const budgetInterval = setInterval(() => {
      currentBudget += targetBudget / 20;
      if (currentBudget >= targetBudget) {
        currentBudget = targetBudget;
        clearInterval(budgetInterval);
      }
      setDisplayedBudget(Math.floor(currentBudget));
    }, 50);

    // 2. Animate Purchases
    const targetPurchases = generateFakePurchases(analyzedStory?.taskId);
    let currentPurchases = 0;
    const purchasesInterval = setInterval(() => {
      currentPurchases += targetPurchases / 20;
      if (currentPurchases >= targetPurchases) {
        currentPurchases = targetPurchases;
        clearInterval(purchasesInterval);
      }
      setDisplayedPurchases(Math.floor(currentPurchases));
    }, 50);

    // 3. Staggered Transfers
    const allTransfers =
      marketingData.channel_transfers?.map((transfer: any, index: number) => ({
        id: `TX-${9921 - index}`,
        date: "Today",
        platform: transfer.platform,
        campaign: `${transfer.lane} allocation`,
        amount: -transfer.allocated_amount_usd,
        status: "Completed",
        hash: transfer.tx_hash
          ? `${transfer.tx_hash.substring(0, 6)}...${transfer.tx_hash.substring(transfer.tx_hash.length - 4)}`
          : "0x...",
        explorer_url: transfer.explorer_url,
        isDeposit: false,
      })) || [];

    if (marketingData.budget_execution?.total_amount_usd) {
      allTransfers.unshift({
        id: `TX-9000`,
        date: "Initial",
        platform: analyzedStory.investorAgentName || "Syndicate",
        campaign: "Initial Funding",
        amount: marketingData.budget_execution.total_amount_usd,
        status: "Deposit",
        hash: analyzedStory.txHash 
          ? `${analyzedStory.txHash.substring(0, 6)}...${analyzedStory.txHash.substring(analyzedStory.txHash.length - 4)}` 
          : "0x...",
        fullHash: analyzedStory.txHash || "0x...",
        explorer_url: analyzedStory.txHash 
          ? `https://sepolia.etherscan.io/tx/${analyzedStory.txHash}` 
          : "#",
        isDeposit: true,
      });
    }

    let transferIndex = 0;
    const transferInterval = setInterval(() => {
      if (transferIndex < allTransfers.length) {
        const currentTransfer = allTransfers[transferIndex];
        setDisplayedTransfers((prev) => {
          if (prev.find((t) => t.id === currentTransfer.id)) return prev;
          return [...prev, currentTransfer];
        });
        transferIndex++;
      } else {
        clearInterval(transferInterval);
      }
    }, 600);

    // 4. Staggered Posts
    const allPosts = [
      ...(marketingData.marketing_posts?.map((post: any, index: number) => {
        const prefixes = ["book", "story", "read", "novel", "fiction", "tale", "lore", "myth", "epic", "saga", "plot"];
        const suffixes = ["tok", "junkie", "daily", "reads", "hub", "fan", "geek", "nerd", "lover", "addict", "verse"];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        const num = Math.floor(Math.random() * 999);
        
        const handle = (post.platform || "").includes("YouTube")
          ? `${prefix.charAt(0).toUpperCase() + prefix.slice(1)} ${suffix.charAt(0).toUpperCase() + suffix.slice(1)} ${num > 500 ? num : ''}`.trim()
          : `@${prefix}_${suffix}${num > 500 ? num : ''}`;
                
        const metrics = marketingData.performance_mock?.channel_metrics?.find(
          (m: any) => m.channel_id === post.channel_id,
        );
        
        const impressions = metrics?.impressions || Math.floor(Math.random() * 50000 + 10000);
        const clicks = metrics?.clicks || Math.floor(Math.random() * 2000 + 100);
        
        const likeMult = 0.02 + Math.random() * 0.08;
        const commentMult = 0.1 + Math.random() * 0.3;
        const shareMult = 0.2 + Math.random() * 0.6;
        
        return {
          platform: post.platform,
          format: post.format,
          channel_id: post.channel_id,
          spend: metrics?.spend_usd || 0,
          handle,
          content: post.caption,
          likes: Math.floor(impressions * likeMult).toLocaleString(),
          comments: Math.floor(clicks * commentMult).toLocaleString(),
          shares: Math.floor(clicks * shareMult).toLocaleString(),
          image:
            (post.platform || "").includes("TikTok")
              ? `https://picsum.photos/seed/${analyzedStory?.taskId}-tiktok${index + 100}/1080/1920`
              : (post.platform || "").includes("Meta") || (post.platform || "").includes("Instagram")
                ? `https://picsum.photos/seed/${analyzedStory?.taskId}-meta${index + 200}/1080/1080`
                : (post.platform || "").includes("Reddit")
                  ? `https://picsum.photos/seed/${analyzedStory?.taskId}-reddit${index + 300}/1080/1080`
                  : (post.platform || "").includes("X")
                    ? `https://picsum.photos/seed/${analyzedStory?.taskId}-x${index + 400}/1080/1080`
                    : (post.platform || "").includes("YouTube")
                      ? `https://picsum.photos/seed/${analyzedStory?.taskId}-youtube${index + 500}/1080/1920`
                      : `https://picsum.photos/seed/${analyzedStory?.taskId}-other${index + 600}/1080/1080`,
          avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${handle.replace('@', '')}`,
          roi: "+" + (Math.floor(Math.random() * 200) + 100) + "%",
        };
      }) || []),
      ...(marketingData.purchased_assets?.map((asset: any, index: number) => {
        const prefixes = ["art", "design", "create", "draw", "paint", "sketch", "pixel", "vector", "craft", "studio"];
        const suffixes = ["pro", "master", "guru", "ninja", "wizard", "expert", "star", "king", "queen", "lord"];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        const num = Math.floor(Math.random() * 999);
        const handle = `@${prefix}_${suffix}${num > 500 ? num : ''}`;

        return {
          platform: asset.provider || "Asset",
          format: asset.asset_type || "art",
          channel_id: `asset-${index}`,
          spend: asset.cost_usd || 0,
          handle: handle,
          content: asset.description || "Purchased Asset",
          likes: Math.floor(Math.random() * 5000 + 1000).toLocaleString(),
          comments: Math.floor(Math.random() * 200 + 10).toLocaleString(),
          shares: Math.floor(Math.random() * 500 + 50).toLocaleString(),
          image: `https://picsum.photos/seed/${analyzedStory?.taskId}-asset${index + 700}/1080/1080`,
          avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${handle.replace('@', '')}`,
          roi: "+" + (Math.floor(Math.random() * 200) + 100) + "%",
        };
      }) || [])
    ];

    let postIndex = 0;
    const postInterval = setInterval(() => {
      if (postIndex < allPosts.length) {
        const currentPost = allPosts[postIndex];
        setDisplayedPosts((prev) => {
          if (prev.length > postIndex) return prev;
          return [...prev, currentPost];
        });
        postIndex++;
      } else {
        clearInterval(postInterval);
        if (analyzedStory?.taskId) {
          seenAnimations.add(analyzedStory.taskId);
        }
      }
    }, 800);

    return () => {
      clearInterval(budgetInterval);
      clearInterval(purchasesInterval);
      clearInterval(transferInterval);
      clearInterval(postInterval);
    };
  }, [marketingData, analyzedStory]);

  // Generate dynamic sales data based on total purchases
  const totalPurchases = displayedPurchases;

  // Create a simple distribution over 7 days
  const dynamicSalesData = [
    {
      name: "Mon",
      sales: Math.floor(totalPurchases * 0.1),
      target: Math.floor(totalPurchases * 0.15),
    },
    {
      name: "Tue",
      sales: Math.floor(totalPurchases * 0.15),
      target: Math.floor(totalPurchases * 0.15),
    },
    {
      name: "Wed",
      sales: Math.floor(totalPurchases * 0.2),
      target: Math.floor(totalPurchases * 0.2),
    },
    {
      name: "Thu",
      sales: Math.floor(totalPurchases * 0.1),
      target: Math.floor(totalPurchases * 0.15),
    },
    {
      name: "Fri",
      sales: Math.floor(totalPurchases * 0.25),
      target: Math.floor(totalPurchases * 0.2),
    },
    {
      name: "Sat",
      sales: Math.floor(totalPurchases * 0.15),
      target: Math.floor(totalPurchases * 0.1),
    },
    {
      name: "Sun",
      sales: Math.max(
        0,
        totalPurchases -
          Math.floor(totalPurchases * 0.1) -
          Math.floor(totalPurchases * 0.15) -
          Math.floor(totalPurchases * 0.2) -
          Math.floor(totalPurchases * 0.1) -
          Math.floor(totalPurchases * 0.25) -
          Math.floor(totalPurchases * 0.15),
      ),
      target: Math.floor(totalPurchases * 0.05),
    },
  ];

  // Calculate average ROI
  const avgRoi =
    displayedPosts.length > 0
      ? Math.round(
          displayedPosts.reduce(
            (sum: number, post: any) =>
              sum + parseInt((post.roi || "+0%").replace("+", "").replace("%", "")),
            0,
          ) / displayedPosts.length,
        )
      : 0;

  if (!marketingData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#E4E3E0] text-black h-full relative">
        <div className="bg-[#F5F5F0] border-4 border-black rounded-3xl p-8 max-w-md w-full mx-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
          <Loader2 className="w-12 h-12 text-black animate-spin mb-6" />
          <h3 className="text-xl md:text-2xl font-black text-black uppercase tracking-widest mb-4 animate-pulse">
            Executing Marketing Campaign...
          </h3>
          <p className="text-black/60 font-bold text-sm md:text-base">
            Sterling is allocating funds and launching ads.
          </p>
        </div>
        {showPendingContractModal && pendingContractTaskId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-md bg-white border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl overflow-hidden flex flex-col p-8 text-center animate-in fade-in zoom-in-95 duration-200">
              <button 
                onClick={() => setShowPendingContractModal(false)}
                className="absolute top-4 right-4 w-8 h-8 bg-white border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-lg flex items-center justify-center text-black hover:bg-gray-50 transition-colors active:translate-y-[2px] active:shadow-none"
              >
                <X className="w-4 h-4 font-black" />
              </button>
              <div className="w-20 h-20 bg-[#86F29F] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-full flex items-center justify-center mb-6 mx-auto mt-2">
                <BadgeCheck className="w-10 h-10 text-black" />
              </div>
              <h3 className="text-2xl font-black text-black uppercase tracking-widest mb-3">Funds Locked</h3>
              <p className="text-black font-bold mb-8 text-sm uppercase tracking-wider">
                The smart contract is active and funds are secured.
              </p>
              <button 
                onClick={async () => {
                  if (user && pendingContractTaskId !== 'mock-task-id') {
                    try {
                      await addDoc(collection(db, 'agent_tasks'), {
                        type: 'marketing_execution',
                        status: 'pending',
                        authorUid: user.uid,
                        payload: {
                          settlementTaskId: pendingContractTaskId,
                          sourceTaskId: analyzedStory?.taskId || 'unknown'
                        },
                        createdAt: new Date().toISOString()
                      });
                      localStorage.removeItem('pending_marketing_execution');
                    } catch (err) {
                      console.error("Failed to trigger marketing execution", err);
                    }
                  }
                  setShowPendingContractModal(false);
                }}
                className="w-full px-6 py-4 rounded-xl font-black text-sm text-black bg-[#86F29F] hover:bg-[#6ce688] transition-colors border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase tracking-widest"
              >
                Go to Advertising Cabinet
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  let pricingTerms =
    marketingData?.contract_terms?.pricing_terms ||
    marketingData?.revenue_mock?.pricing_terms ||
    (marketingData as any)?.pricing_terms;
  if (typeof pricingTerms === "string") {
    try {
      pricingTerms = JSON.parse(pricingTerms);
    } catch (e) {}
  }
  if (Array.isArray(pricingTerms)) {
    const ptObj: any = {};
    pricingTerms.forEach((item) => {
      const key = (item.name || item.type || item.key || "").toLowerCase();
      if (key.includes("base"))
        ptObj.base_story_price = item.price || item.value || item.amount;
      if (key.includes("premium"))
        ptObj.premium_route_unlock = item.price || item.value || item.amount;
      if (key.includes("choice"))
        ptObj.paid_choice_price = item.price || item.value || item.amount;
      if (key.includes("bundle"))
        ptObj.bundle_price = item.price || item.value || item.amount;
    });
    pricingTerms = ptObj;
  }
  if (
    pricingTerms &&
    typeof pricingTerms === "object" &&
    !Array.isArray(pricingTerms)
  ) {
    const ptObj: any = { ...pricingTerms };
    Object.keys(pricingTerms).forEach((key) => {
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes("base"))
        ptObj.base_story_price = ptObj.base_story_price || pricingTerms[key];
      if (lowerKey.includes("premium"))
        ptObj.premium_route_unlock =
          ptObj.premium_route_unlock || pricingTerms[key];
      if (lowerKey.includes("choice") || lowerKey.includes("paid"))
        ptObj.paid_choice_price = ptObj.paid_choice_price || pricingTerms[key];
      if (lowerKey.includes("bundle"))
        ptObj.bundle_price = ptObj.bundle_price || pricingTerms[key];
    });
    pricingTerms = ptObj;
  }

  let contentPlanTerms =
    marketingData?.contract_terms?.content_plan_terms ||
    marketingData?.revenue_mock?.content_plan_terms ||
    (marketingData as any)?.content_plan_terms;
  if (typeof contentPlanTerms === "string") {
    try {
      contentPlanTerms = JSON.parse(contentPlanTerms);
    } catch (e) {}
  }
  if (Array.isArray(contentPlanTerms)) {
    const cptObj: any = {};
    contentPlanTerms.forEach((item) => {
      const key = (item.name || item.type || item.key || "").toLowerCase();
      if (key.includes("chapter") || key.includes("target"))
        cptObj.target_chapters = item.value || item.amount || item.count;
      if (key.includes("density") || key.includes("choice"))
        cptObj.choice_density = item.value || item.description || item.text;
      if (key.includes("paywall") || key.includes("rule"))
        cptObj.paywall_rules = item.value || item.description || item.text;
    });
    contentPlanTerms = cptObj;
  }
  if (
    contentPlanTerms &&
    typeof contentPlanTerms === "object" &&
    !Array.isArray(contentPlanTerms)
  ) {
    const cptObj: any = { ...contentPlanTerms };
    Object.keys(contentPlanTerms).forEach((key) => {
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes("chapter") || lowerKey.includes("target"))
        cptObj.target_chapters =
          cptObj.target_chapters || contentPlanTerms[key];
      if (lowerKey.includes("density") || lowerKey.includes("choice"))
        cptObj.choice_density = cptObj.choice_density || contentPlanTerms[key];
      if (lowerKey.includes("paywall") || lowerKey.includes("rule"))
        cptObj.paywall_rules = cptObj.paywall_rules || contentPlanTerms[key];
    });
    contentPlanTerms = cptObj;
  }

  const baseStoryPrice =
    pricingTerms?.base_story_price ??
    pricingTerms?.base_story ??
    pricingTerms?.base_price ??
    pricingTerms?.base ??
    0;
  const premiumRouteUnlock =
    pricingTerms?.premium_route_unlock ??
    pricingTerms?.premium_route ??
    pricingTerms?.premium_price ??
    pricingTerms?.premium ??
    0;
  const paidChoicePrice =
    pricingTerms?.paid_choice_price ??
    pricingTerms?.paid_choice ??
    pricingTerms?.choice_price ??
    pricingTerms?.paid_choices ??
    0;
  const bundlePrice =
    pricingTerms?.bundle_price ??
    pricingTerms?.bundle ??
    pricingTerms?.bundle_offer ??
    0;

  const targetChapters =
    contentPlanTerms?.target_chapters ??
    contentPlanTerms?.chapters ??
    contentPlanTerms?.target ??
    0;
  const choiceDensity =
    contentPlanTerms?.choice_density ??
    contentPlanTerms?.density ??
    contentPlanTerms?.choices ??
    "";
  const paywallRules =
    contentPlanTerms?.paywall_rules ??
    contentPlanTerms?.paywall ??
    contentPlanTerms?.rules ??
    "";

  return (
    <div className="flex-1 flex flex-col xl:flex-row min-h-0 overflow-hidden bg-[#E4E3E0] text-black">
      {/* Left Content (Main Area) */}
      <div className="flex-1 min-h-0 min-w-0 flex flex-col md:flex-row gap-4 md:gap-6 p-4 md:p-6 pb-0 overflow-hidden relative">
        {/* Vertical Header (Desktop) */}
        <div className="hidden md:flex flex-col items-center justify-between shrink-0 border-r-4 border-black/10 pr-4 lg:pr-6 pt-2 pb-8">
          <div className="mb-6">
            <TrustBadge score={marketingData.verification_report?.trust_score} />
          </div>
          <div className="flex-1 flex flex-row justify-center items-end gap-1 lg:gap-2">
            <h1 
              className="text-3xl lg:text-4xl font-black text-black uppercase tracking-tighter whitespace-nowrap flex items-center" 
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              Sterling's Cabinet
            </h1>
            <p 
              className="text-black/60 font-bold text-[9px] lg:text-[10px] tracking-[0.2em] uppercase whitespace-nowrap flex items-center"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              * Posts and sales are mock, transactions are real
            </p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 w-full flex flex-col min-h-0 overflow-y-auto overflow-x-hidden hide-scrollbar">
          <div className="max-w-7xl mx-auto w-full relative z-10 flex flex-col gap-6 min-h-full p-4 sm:p-6 sm:pr-8 sm:pb-8 pt-6">
            {/* Horizontal Header (Mobile) */}
            <div className="flex md:hidden flex-col gap-3 mb-4 shrink-0">
              <div className="flex items-center justify-between gap-3">
                <h1 className="text-2xl font-black text-black uppercase tracking-tighter leading-none">
                  Sterling's Cabinet
                </h1>
                <TrustBadge score={marketingData.verification_report?.trust_score} />
              </div>
              <p className="text-black/60 font-bold text-[10px] tracking-[0.2em] uppercase">
                * Posts and sales are mock, transactions are real
              </p>
            </div>

            {/* Top Row: Chart & Monetization */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
            {/* Sales History Chart */}
            <div className="lg:col-span-2 xl:col-span-2 w-full bg-white border-4 border-black rounded-3xl p-5 flex flex-col shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all text-black min-h-[295px] h-full">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-black tracking-tight uppercase mb-1 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" /> Sales Velocity
                  </h2>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 bg-[#86F29F] border-2 border-black rounded-full"></div>
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        Actual Sales
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 bg-[#E4E3E0] border-2 border-black rounded-full"></div>
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        Target
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-black tracking-tighter">
                    {displayedPurchases}
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                    Units Sold (7d)
                  </div>
                </div>
              </div>

              <div className="flex-1 w-full min-h-[150px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart
                    data={dynamicSalesData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#E4E3E0"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={{ stroke: "#000", strokeWidth: 2 }}
                      tickLine={false}
                      tick={{ fill: "#000", fontSize: 12, fontWeight: 900 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#000", fontSize: 12, fontWeight: 900 }}
                    />
                    <Tooltip
                      cursor={{ fill: "#F5F5F0" }}
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "4px solid #000",
                        borderRadius: "16px",
                        boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
                        fontWeight: 900,
                      }}
                    />
                    <Bar
                      dataKey="target"
                      fill="#E4E3E0"
                      radius={[4, 4, 0, 0]}
                      stroke="#000"
                      strokeWidth={2}
                    />
                    <Bar
                      dataKey="sales"
                      fill="#86F29F"
                      radius={[4, 4, 0, 0]}
                      stroke="#000"
                      strokeWidth={2}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monetization Strategy Row */}
            {(marketingData.contract_terms || marketingData.revenue_mock) && (
              <>
                {/* Contract & Pricing Terms */}
                <div className="lg:col-span-1 xl:col-span-1 bg-[#E9D5FF] border-4 border-black rounded-3xl p-4 flex flex-col shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all text-black min-h-[295px] h-full">
                  <div className="flex justify-between items-center mb-3 border-b-4 border-black pb-2">
                    <h2 className="text-xl font-black tracking-tight uppercase flex items-center gap-2">
                      Pricing Strategy
                    </h2>
                  </div>

                  <div className="flex flex-col gap-2 flex-1 justify-center">
                    <div className="flex justify-between items-end border-b-2 border-black/10 pb-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-black/70">
                        Base Story
                      </span>
                      <span className="text-base font-black leading-none">
                        ₮{baseStoryPrice}
                      </span>
                    </div>
                    <div className="flex justify-between items-end border-b-2 border-black/10 pb-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-black/70">
                        Paid Choice
                      </span>
                      <span className="text-base font-black leading-none">
                        ₮{paidChoicePrice}
                      </span>
                    </div>
                    <div className="flex justify-between items-end border-b-2 border-black/10 pb-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-black/70">
                        Premium Route
                      </span>
                      <span className="text-base font-black leading-none">
                        ₮{premiumRouteUnlock}
                      </span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-black/70">
                        Bundle
                      </span>
                      <span className="text-base font-black leading-none">
                        ₮{bundlePrice}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <button
                      onClick={async () => {
                        if (!user || !analyzedStory) return;
                        
                        setIsBuying(true);
                        setBuySuccess(false);
                        setBuyResult(null);
                        
                        let currentTokenId = analyzedStory.tokenId;
                        let txHashToUse = analyzedStory.txHash;
                        
                        // Fallback: try to recover tokenId from txHash if missing
                        if (currentTokenId === undefined || currentTokenId === null) {
                          if (!txHashToUse) {
                            txHashToUse = prompt("This story seems to be missing its on-chain transaction hash. If you have minted it, please enter the transaction hash (e.g., 0x...):") || undefined;
                          }
                          
                          if (txHashToUse && txHashToUse.startsWith("0x")) {
                            try {
                              // Using standard ethers provider for Sepolia
                              let provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
                              let receipt = await provider.getTransactionReceipt(txHashToUse);
                              
                              if (!receipt) {
                                // Try fallback RPC
                                provider = new ethers.JsonRpcProvider("https://rpc.sepolia.org");
                                receipt = await provider.getTransactionReceipt(txHashToUse);
                              }

                              if (receipt && receipt.logs) {
                                for (const log of receipt.logs) {
                                  // Transfer event signature
                                  if (log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' && log.topics.length === 4) {
                                    currentTokenId = Number(log.topics[3]);
                                    break;
                                  }
                                }
                              }
                            } catch (e) {
                              console.error("Failed to recover tokenId from txHash", e);
                            }
                          }
                        }

                        if (currentTokenId === undefined || currentTokenId === null) {
                          setIsBuying(false);
                          alert("This story does not have an on-chain tokenId and cannot be purchased. Please ensure it was minted successfully.");
                          return;
                        }

                        // Double check if already purchased before creating task
                        try {
                          const q = query(
                            collection(db, "agent_tasks"),
                            where("authorUid", "==", user.uid),
                            where("type", "==", "buy_story")
                          );
                          
                          const querySnapshot = await getDocs(q);
                          let purchased = false;
                          
                          querySnapshot.forEach((doc) => {
                            const data = doc.data();
                            if (
                              data.payload && 
                              String(data.payload.storyId) === String(currentTokenId) &&
                              (data.status === "completed" || data.status === "pending")
                            ) {
                              purchased = true;
                            }
                          });
                          
                          if (purchased) {
                            setIsBuying(false);
                            setHasPurchased(true);
                            alert("Already Purchased");
                            return;
                          }
                        } catch (error) {
                          console.error("Error checking purchase status before buying:", error);
                        }

                        try {
                          const payloadData = {
                            type: "buy_story",
                            status: "pending",
                            authorUid: user.uid,
                            buyerUid: `reader_${Math.random().toString(36).substring(2, 11)}`,
                            createdAt: new Date().toISOString(),
                            payload: {
                              storyId: Number(currentTokenId),
                              priceUsd: Number(baseStoryPrice) || 0,
                              contractAddress: "0x45933728ED383B8f7DAe014e5ebdcD8315aBA1a7"
                            },
                          };
                          console.log("Buying story with payload:", payloadData);
                          const docRef = await addDoc(collection(db, "agent_tasks"), payloadData);
                          
                          unsubscribeRef.current = onSnapshot(docRef, (docSnap) => {
                            const data = docSnap.data();
                            if (data && data.status === "completed") {
                              setBuySuccess(true);
                              setIsBuying(false);
                              setHasPurchased(true);
                              setBuyResult(data.result);
                              if (unsubscribeRef.current) unsubscribeRef.current();
                            } else if (data && data.status === "failed") {
                              setIsBuying(false);
                              setBuySuccess(false);
                              console.error("Buy story failed:", data.error);
                              
                              const errorStr = String(data.error || "").toLowerCase();
                              if (errorStr.includes("already") || errorStr.includes("purchased") || errorStr.includes("revert")) {
                                setHasPurchased(true);
                                alert("Already Purchased");
                              } else {
                                alert("Purchase failed: " + (data.error || "Unknown error"));
                              }
                              
                              if (unsubscribeRef.current) unsubscribeRef.current();
                            }
                          });
                        } catch (error: any) {
                          console.error("Error buying story:", error);
                          setIsBuying(false);
                          setBuySuccess(false);
                          alert("Purchase failed: " + (error.message || "Unknown error"));
                        }
                      }}
                      disabled={isBuying || buySuccess || hasPurchased || isCheckingPurchase}
                      className="w-full bg-black text-white font-black uppercase tracking-widest py-2 px-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-800 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                    >
                      {isCheckingPurchase ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Checking...
                        </>
                      ) : isBuying ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : buySuccess || hasPurchased ? (
                        "Already Purchased"
                      ) : (
                        `Buy Story for ₮${baseStoryPrice}`
                      )}
                    </button>
                  </div>
                </div>

                {/* Balance Widget */}
                <div className="lg:col-span-1 xl:col-span-1 bg-[#BBF7D0] border-4 border-black rounded-3xl p-4 flex flex-col shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all text-black min-h-[295px] h-full">
                  <div className="flex justify-between items-center mb-3 border-b-4 border-black pb-2">
                    <h2 className="text-xl font-black tracking-tight uppercase flex items-center gap-2">
                      Balance
                    </h2>
                  </div>

                  <div className="flex flex-col items-center justify-center flex-1 gap-2">
                    <div className="text-sm font-bold uppercase tracking-widest text-black/60">Available Funds</div>
                    <div className="text-3xl font-black tracking-tighter drop-shadow-sm">
                      ₮{pendingBalance}
                    </div>
                  </div>
                  <div className="mt-3">
                    <button
                      onClick={async () => {
                        if (!user || isWithdrawing || parseFloat(pendingBalance) <= 0) return;
                        setIsWithdrawing(true);
                        try {
                          const pin = await requestPin("Enter your 6-digit PIN to authorize withdrawal.");
                          if (!pin) {
                            setIsWithdrawing(false);
                            return;
                          }
                          await wdk.unlockWallet(user.uid, pin);
                          await wdk.withdraw(user.uid);
                          // Refresh balance after withdrawal
                          const newBalance = await wdk.getPendingWithdrawals(user.uid);
                          setPendingBalance(newBalance);
                        } catch (error: any) {
                          console.error("Withdrawal failed:", error);
                          if (String(error.message || error).toLowerCase().includes("pin")) {
                            alert("Invalid PIN");
                          } else {
                            alert("Withdrawal failed: " + (error.message || "Unknown error"));
                          }
                        } finally {
                          setIsWithdrawing(false);
                        }
                      }}
                      disabled={isWithdrawing || parseFloat(pendingBalance) <= 0}
                      className="w-full bg-[#166534] text-white border-2 border-black font-black uppercase tracking-widest py-2 px-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#14532d] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                    >
                      {isWithdrawing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <ArrowBigUp className="w-5 h-5" />
                          Withdraw Funds
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Ad Creatives / Posts Feed - Full width of left column */}
          <div className="bg-[#F5F5F0] border-4 border-black rounded-3xl p-4 flex flex-col shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-black flex-1">
            <div className="flex justify-between items-center mb-3 border-b-4 border-black pb-2 shrink-0">
              <h2 className="text-xl font-black tracking-tight uppercase flex items-center gap-2">
                Active Creatives Feed
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest bg-white px-2 py-1 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  Avg ROI: +{avgRoi}%
                </span>
                <div className="flex items-center gap-2 ml-2">
                  <button
                    onClick={scrollLeft}
                    className="p-1.5 bg-white border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-[2px] active:shadow-none"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={scrollRight}
                    className="p-1.5 bg-white border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-[2px] active:shadow-none"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="relative w-full flex-1 flex flex-col justify-center">
              <div
                ref={carouselRef}
                className="flex items-center h-full gap-4 overflow-x-auto snap-x snap-mandatory pb-4 hide-scrollbar"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {displayedPosts.map((post: any, i: number) => {
                  if (post.platform.includes("TikTok")) {
                    return (
                      <div
                        key={i}
                        className="min-w-[280px] max-w-[280px] h-[480px] snap-center bg-black border-4 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col shrink-0 relative group"
                      >
                        {/* Background Image */}
                        <div className="absolute inset-0 bg-black flex items-center justify-center rounded-xl overflow-hidden">
                          <img
                            src={post.image}
                            alt="TikTok Creative"
                            className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        
                        {/* Dark Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/90 rounded-xl" />

                        {/* Top Header */}
                        <div className="absolute top-3 left-3 right-3 flex justify-end items-center z-10">
                          <div className="bg-black text-white border-2 border-white/20 rounded-md px-2 py-1 text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1">
                            <Play className="w-3 h-3 fill-white" /> TikTok
                          </div>
                        </div>

                        {/* Right Sidebar Actions */}
                        <div className="absolute right-3 bottom-20 flex flex-col items-center gap-4 z-10">
                          {/* Profile Pic */}
                          <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden relative mb-2 shadow-lg bg-white">
                            <img src={post.avatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#FE2C55] text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold border border-white shadow-sm">+</div>
                          </div>
                          
                          {/* Likes */}
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/10">
                              <Heart className="w-5 h-5 text-white fill-white" />
                            </div>
                            <span className="text-white text-[10px] font-bold drop-shadow-md">{post.likes}</span>
                          </div>

                          {/* Comments */}
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/10">
                              <MessageSquare className="w-5 h-5 text-white fill-white" />
                            </div>
                            <span className="text-white text-[10px] font-bold drop-shadow-md">{post.comments}</span>
                          </div>

                          {/* Bookmark */}
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/10">
                              <Bookmark className="w-5 h-5 text-white fill-white" />
                            </div>
                            <span className="text-white text-[10px] font-bold drop-shadow-md">Save</span>
                          </div>

                          {/* Share */}
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/10">
                              <Share2 className="w-5 h-5 text-white fill-white" />
                            </div>
                            <span className="text-white text-[10px] font-bold drop-shadow-md">{post.shares}</span>
                          </div>
                        </div>

                        {/* Bottom Info */}
                        <div className="absolute bottom-4 left-3 right-16 z-10 flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-bold text-sm drop-shadow-md">@{(post.handle || "").replace(/\s+/g, '').toLowerCase()}</span>
                          </div>
                          <p className="text-white text-xs line-clamp-3 leading-5 drop-shadow-md font-medium">
                            {post.content}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Music className="w-3 h-3 text-white animate-pulse" />
                            <div className="text-white text-[10px] overflow-hidden whitespace-nowrap w-32 relative" style={{ WebkitMaskImage: 'linear-gradient(to right, black 80%, transparent 100%)' }}>
                              <div className="animate-[marquee_5s_linear_infinite] inline-block font-medium drop-shadow-md">
                                original sound - {post.handle}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/70 transition-all duration-300 z-50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-sm pointer-events-none rounded-xl">
                          <div className="flex flex-col items-center gap-4 scale-90 group-hover:scale-100 transition-transform duration-300">
                            <div className="bg-[#86F29F] border-4 border-black rounded-xl px-4 py-2 text-xl font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black text-center">
                              <div className="text-xs opacity-70 mb-1">Ad Spend</div>
                              ₮{post.spend.toFixed(2)}
                            </div>
                            <div className="bg-[#86F29F] border-4 border-black rounded-xl px-4 py-2 text-xl font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-[#00A843] text-center">
                              <div className="text-xs opacity-70 mb-1 text-black">Est. ROI</div>
                              {post.roi}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (post.platform.includes("Meta") || post.platform.includes("Instagram")) {
                    return (
                      <div
                        key={i}
                        className="min-w-[320px] max-w-[320px] h-[480px] snap-center bg-white border-4 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col shrink-0 font-sans group relative"
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between p-3 border-b-2 border-black/5">
                          <div className="flex items-center gap-2">
                            <img src={post.avatar} alt="avatar" className="w-10 h-10 rounded-full border-2 border-black" referrerPolicy="no-referrer" />
                            <div className="flex flex-col">
                              <span className="font-bold text-[13px] text-black leading-tight">{(post.handle || "").replace('@', '')}</span>
                              <div className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                                <span>Sponsored</span>
                                <span>·</span>
                                <Globe className="w-3 h-3" />
                              </div>
                            </div>
                          </div>
                          <MoreHorizontal className="w-5 h-5 text-gray-500" />
                        </div>

                        {/* Primary Text */}
                        <div className="px-3 py-2">
                          <div className="text-[13px] text-black leading-5 line-clamp-3">
                            {post.content}
                          </div>
                        </div>

                        {/* Image */}
                        <div className="w-full flex-1 min-h-0 bg-black relative border-y-2 border-black/5 flex items-center justify-center">
                          <img src={post.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>

                        {/* CTA Banner */}
                        <div className="bg-[#F0F2F5] p-3 flex items-center justify-between border-b-2 border-black/5">
                          <div className="flex flex-col overflow-hidden pr-2">
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">twisly.io</span>
                            <span className="font-bold text-[13px] text-black truncate">Learn More About This Story</span>
                          </div>
                          <button className="bg-gray-200 hover:bg-gray-300 text-black font-bold text-[12px] px-3 py-1.5 rounded-md transition-colors shrink-0 border-2 border-transparent">
                            Learn more
                          </button>
                        </div>

                        {/* Engagement Stats */}
                        <div className="px-3 py-2 flex items-center justify-between text-[11px] text-gray-500 font-medium border-b-2 border-black/5">
                          <div className="flex items-center gap-1">
                            <div className="flex -space-x-1">
                              <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center border border-white z-10">
                                <ThumbsUp className="w-2.5 h-2.5 text-white fill-white" />
                              </div>
                              <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center border border-white z-0">
                                <Heart className="w-2.5 h-2.5 text-white fill-white" />
                              </div>
                            </div>
                            <span className="ml-1 text-black font-bold">{post.likes}</span>
                          </div>
                          <div className="flex gap-2">
                            <span>{post.comments} comments</span>
                            <span>{post.shares} shares</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="px-2 py-1 flex items-center justify-between">
                          <button className="flex-1 flex items-center justify-center gap-2 py-1.5 hover:bg-gray-100 rounded-md text-gray-600 font-bold text-[12px] transition-colors">
                            <ThumbsUp className="w-4 h-4" /> Like
                          </button>
                          <button className="flex-1 flex items-center justify-center gap-2 py-1.5 hover:bg-gray-100 rounded-md text-gray-600 font-bold text-[12px] transition-colors">
                            <MessageSquare className="w-4 h-4" /> Comment
                          </button>
                          <button className="flex-1 flex items-center justify-center gap-2 py-1.5 hover:bg-gray-100 rounded-md text-gray-600 font-bold text-[12px] transition-colors">
                            <Share2 className="w-4 h-4" /> Share
                          </button>
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/70 transition-all duration-300 z-50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-sm pointer-events-none rounded-xl">
                          <div className="flex flex-col items-center gap-4 scale-90 group-hover:scale-100 transition-transform duration-300">
                            <div className="bg-[#86F29F] border-4 border-black rounded-xl px-4 py-2 text-xl font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black text-center">
                              <div className="text-xs opacity-70 mb-1">Ad Spend</div>
                              ₮{post.spend.toFixed(2)}
                            </div>
                            <div className="bg-[#86F29F] border-4 border-black rounded-xl px-4 py-2 text-xl font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-[#00A843] text-center">
                              <div className="text-xs opacity-70 mb-1 text-black">Est. ROI</div>
                              {post.roi}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (post.platform.includes("Reddit")) {
                    return (
                      <div
                        key={i}
                        className="min-w-[320px] max-w-[320px] h-[480px] snap-center bg-white border-4 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col shrink-0 font-sans group relative"
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between p-3 pb-1">
                          <div className="flex items-center gap-2">
                            <img src={post.avatar} alt="avatar" className="w-8 h-8 rounded-full border border-gray-200" referrerPolicy="no-referrer" />
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1 text-xs">
                                <span className="font-bold text-gray-900">u/{(post.handle || "").replace('@', '')}</span>
                                <span className="text-gray-500">•</span>
                                <span className="text-gray-500 font-medium">Promoted</span>
                              </div>
                            </div>
                          </div>
                          <MoreHorizontal className="w-5 h-5 text-gray-500" />
                        </div>

                        {/* Title */}
                        <div className="px-3 py-2">
                          <div className="text-[15px] font-medium text-gray-900 leading-6 line-clamp-3">
                            {post.content}
                          </div>
                        </div>

                        {/* Image */}
                        <div className="w-full flex-1 min-h-0 bg-black relative flex items-center justify-center">
                          <img src={post.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>

                        {/* CTA Banner */}
                        <div className="bg-[#E2E7EC] px-3 py-2.5 flex items-center justify-between">
                          <span className="text-[13px] font-bold text-[#0045AC]">twisly.io</span>
                          <button className="bg-[#0045AC] hover:bg-[#003A91] text-white font-bold text-[12px] px-4 py-1.5 rounded-full transition-colors flex items-center gap-1">
                            Learn More <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Engagement Stats (Footer) */}
                        <div className="px-3 py-2 flex items-center justify-between text-gray-500 border-t border-gray-100">
                          <div className="flex items-center gap-1 bg-gray-100 rounded-full px-2 py-1">
                            <ArrowBigUp className="w-5 h-5 hover:text-orange-500 cursor-pointer transition-colors" />
                            <span className="text-xs font-bold text-gray-900">{post.likes}</span>
                            <ArrowBigDown className="w-5 h-5 hover:text-blue-500 cursor-pointer transition-colors" />
                          </div>
                          <div className="flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-1.5 hover:bg-gray-200 cursor-pointer transition-colors">
                            <MessageSquare className="w-4 h-4" />
                            <span className="text-xs font-bold text-gray-900">{post.comments}</span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-1.5 hover:bg-gray-200 cursor-pointer transition-colors">
                            <Share2 className="w-4 h-4" />
                            <span className="text-xs font-bold text-gray-900">Share</span>
                          </div>
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/70 transition-all duration-300 z-50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-sm pointer-events-none rounded-xl">
                          <div className="flex flex-col items-center gap-4 scale-90 group-hover:scale-100 transition-transform duration-300">
                            <div className="bg-[#86F29F] border-4 border-black rounded-xl px-4 py-2 text-xl font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black text-center">
                              <div className="text-xs opacity-70 mb-1">Ad Spend</div>
                              ₮{post.spend.toFixed(2)}
                            </div>
                            <div className="bg-[#86F29F] border-4 border-black rounded-xl px-4 py-2 text-xl font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-[#00A843] text-center">
                              <div className="text-xs opacity-70 mb-1 text-black">Est. ROI</div>
                              {post.roi}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (post.platform.includes("X")) {
                    return (
                      <div
                        key={i}
                        className="min-w-[320px] max-w-[320px] h-[480px] snap-center bg-black border-4 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col shrink-0 font-sans text-white group relative"
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between p-3 pb-1">
                          <div className="flex items-center gap-2">
                            <img src={post.avatar} alt="avatar" className="w-10 h-10 rounded-full bg-white" referrerPolicy="no-referrer" />
                            <div className="flex flex-col leading-tight">
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-[15px] hover:underline cursor-pointer">{(post.handle || "").replace('@', '')}</span>
                                <BadgeCheck className="w-4 h-4 text-[#1D9BF0] fill-[#1D9BF0]" />
                              </div>
                              <span className="text-[13px] text-gray-500">{post.handle}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-gray-500 font-bold">Ad</span>
                            <MoreHorizontal className="w-5 h-5 text-gray-500" />
                          </div>
                        </div>

                        {/* Text */}
                        <div className="px-3 py-2">
                          <div className="text-[14px] leading-5 line-clamp-3">
                            {post.content}
                          </div>
                        </div>

                        {/* Image Container */}
                        <div className="w-full flex-1 min-h-0 px-3 pb-2 flex flex-col">
                          <div className="w-full h-full rounded-2xl border border-gray-800 overflow-hidden relative flex flex-col bg-black items-center justify-center">
                            <img src={post.image} className="w-full flex-1 object-cover min-h-0" referrerPolicy="no-referrer" />
                            
                            {/* Link Preview Bar */}
                            <div className="bg-[#16181C] px-3 py-2 flex items-center justify-between border-t border-gray-800 shrink-0">
                              <span className="text-[13px] text-gray-400 truncate">twisly.io</span>
                              <span className="text-[13px] font-bold text-white shrink-0 ml-2">Sign up</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="px-3 py-2 flex items-center justify-between text-gray-500 border-t border-gray-800">
                          <div className="flex items-center gap-1.5 hover:text-[#1D9BF0] cursor-pointer transition-colors group">
                            <div className="p-1.5 rounded-full group-hover:bg-[#1D9BF0]/10"><MessageSquare className="w-4 h-4" /></div>
                            <span className="text-xs">{post.comments}</span>
                          </div>
                          <div className="flex items-center gap-1.5 hover:text-[#00BA7C] cursor-pointer transition-colors group">
                            <div className="p-1.5 rounded-full group-hover:bg-[#00BA7C]/10"><Repeat className="w-4 h-4" /></div>
                            <span className="text-xs">{post.shares}</span>
                          </div>
                          <div className="flex items-center gap-1.5 hover:text-[#F91880] cursor-pointer transition-colors group">
                            <div className="p-1.5 rounded-full group-hover:bg-[#F91880]/10"><Heart className="w-4 h-4" /></div>
                            <span className="text-xs">{post.likes}</span>
                          </div>
                          <div className="flex items-center gap-1.5 hover:text-[#1D9BF0] cursor-pointer transition-colors group">
                            <div className="p-1.5 rounded-full group-hover:bg-[#1D9BF0]/10"><Activity className="w-4 h-4" /></div>
                            <span className="text-xs">{(parseInt(post.likes) * 3.5).toFixed(0)}K</span>
                          </div>
                          <div className="flex items-center gap-1 hover:text-[#1D9BF0] cursor-pointer transition-colors group">
                            <div className="p-1.5 rounded-full group-hover:bg-[#1D9BF0]/10"><Bookmark className="w-4 h-4" /></div>
                            <div className="p-1.5 rounded-full group-hover:bg-[#1D9BF0]/10"><Share2 className="w-4 h-4" /></div>
                          </div>
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/70 transition-all duration-300 z-50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-sm pointer-events-none rounded-xl">
                          <div className="flex flex-col items-center gap-4 scale-90 group-hover:scale-100 transition-transform duration-300">
                            <div className="bg-[#86F29F] border-4 border-black rounded-xl px-4 py-2 text-xl font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black text-center">
                              <div className="text-xs opacity-70 mb-1">Ad Spend</div>
                              ₮{post.spend.toFixed(2)}
                            </div>
                            <div className="bg-[#86F29F] border-4 border-black rounded-xl px-4 py-2 text-xl font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-[#00A843] text-center">
                              <div className="text-xs opacity-70 mb-1 text-black">Est. ROI</div>
                              {post.roi}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (post.platform.includes("YouTube")) {
                    return (
                      <div
                        key={i}
                        className="min-w-[280px] max-w-[280px] h-[480px] snap-center bg-black border-4 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col shrink-0 relative group font-sans text-white"
                      >
                        {/* Background Image */}
                        <div className="absolute inset-0 bg-black flex items-center justify-center rounded-xl overflow-hidden">
                          <img
                            src={post.image}
                            alt="YouTube Shorts Creative"
                            className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/90 pointer-events-none rounded-xl" />

                        {/* Top Right - Camera/More */}
                        <div className="absolute top-4 right-3 flex items-center gap-3 z-10">
                          <MoreVertical className="w-6 h-6 text-white drop-shadow-md" />
                        </div>

                        {/* Right Sidebar Actions */}
                        <div className="absolute right-2 bottom-20 flex flex-col items-center gap-5 z-10">
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm">
                              <ThumbsUp className="w-5 h-5 text-white fill-white" />
                            </div>
                            <span className="text-[11px] font-bold drop-shadow-md">{post.likes}</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm">
                              <ThumbsDown className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-[11px] font-bold drop-shadow-md">Dislike</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm">
                              <MessageSquare className="w-5 h-5 text-white fill-white" />
                            </div>
                            <span className="text-[11px] font-bold drop-shadow-md">{post.comments}</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm">
                              <Share2 className="w-5 h-5 text-white fill-white" />
                            </div>
                            <span className="text-[11px] font-bold drop-shadow-md">Share</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm">
                              <Repeat className="w-5 h-5 text-white" />
                            </div>
                          </div>
                        </div>

                        {/* Bottom Info */}
                        <div className="absolute bottom-0 left-0 right-14 p-3 flex flex-col gap-2 z-10">
                          <div className="flex items-center gap-2">
                            <img src={post.avatar} className="w-8 h-8 rounded-full border border-white/20 bg-white" referrerPolicy="no-referrer" />
                            <span className="font-bold text-[13px] drop-shadow-md">{(post.handle || "").replace('@', '')}</span>
                          </div>
                          <p className="text-[13px] font-medium leading-5 drop-shadow-md line-clamp-3">
                            {post.content}
                          </p>
                          {/* Sponsored CTA */}
                          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-2 flex items-center justify-between mt-1 cursor-pointer hover:bg-white/20 transition-colors">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-gray-300 uppercase">Sponsored</span>
                              <span className="text-[12px] font-bold text-white">twisly.io</span>
                            </div>
                            <div className="bg-white text-black text-[11px] font-bold px-3 py-1.5 rounded-full">
                              Visit
                            </div>
                          </div>
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/70 transition-all duration-300 z-50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-sm pointer-events-none rounded-xl">
                          <div className="flex flex-col items-center gap-4 scale-90 group-hover:scale-100 transition-transform duration-300">
                            <div className="bg-[#86F29F] border-4 border-black rounded-xl px-4 py-2 text-xl font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black text-center">
                              <div className="text-xs opacity-70 mb-1">Ad Spend</div>
                              ₮{post.spend.toFixed(2)}
                            </div>
                            <div className="bg-[#86F29F] border-4 border-black rounded-xl px-4 py-2 text-xl font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-[#00A843] text-center">
                              <div className="text-xs opacity-70 mb-1 text-black">Est. ROI</div>
                              {post.roi}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (post.format?.includes("voice")) {
                    return (
                      <div
                        key={i}
                        className="min-w-[300px] max-w-[300px] snap-center bg-[#F5F5F0] border-4 border-black rounded-2xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col gap-4 shrink-0 font-sans group relative"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[#C8BFF4] border-2 border-black flex items-center justify-center">
                              <Music className="w-4 h-4 text-black" />
                            </div>
                            <span className="font-black text-sm uppercase tracking-wider text-black">Voice Asset</span>
                          </div>
                        </div>

                        {/* Audio Player UI */}
                        <div className="bg-white border-2 border-black rounded-xl p-3 flex items-center gap-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                          <button className="w-10 h-10 shrink-0 bg-[#86F29F] border-2 border-black rounded-full flex items-center justify-center hover:bg-[#6CE086] transition-colors">
                            <Play className="w-4 h-4 text-black fill-black ml-1" />
                          </button>
                          <div className="flex-1 flex items-center gap-1 h-8">
                            {/* Waveform bars */}
                            {[...Array(12)].map((_, idx) => (
                              <div 
                                key={idx} 
                                className="flex-1 bg-black rounded-full" 
                                style={{ 
                                  height: `${Math.max(20, Math.random() * 100)}%`,
                                  opacity: idx < 4 ? 1 : 0.2 
                                }}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col justify-between flex-1">
                          <p className="text-sm font-medium leading-5 mb-4 line-clamp-4 text-black">
                            {post.content}
                          </p>
                          <div className="flex items-center justify-between text-xs font-black border-t-2 border-black/10 pt-3 text-gray-500">
                            <div className="flex items-center gap-1.5">
                              <Play className="w-4 h-4" /> {post.likes} Plays
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Share2 className="w-4 h-4" /> {post.shares}
                            </div>
                          </div>
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/70 transition-all duration-300 z-50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-sm pointer-events-none rounded-xl">
                          <div className="flex flex-col items-center gap-4 scale-90 group-hover:scale-100 transition-transform duration-300">
                            <div className="bg-[#86F29F] border-4 border-black rounded-xl px-4 py-2 text-xl font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black text-center">
                              <div className="text-xs opacity-70 mb-1">Ad Spend</div>
                              ₮{post.spend.toFixed(2)}
                            </div>
                            <div className="bg-[#86F29F] border-4 border-black rounded-xl px-4 py-2 text-xl font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-[#00A843] text-center">
                              <div className="text-xs opacity-70 mb-1 text-black">Est. ROI</div>
                              {post.roi}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (post.format?.includes("art")) {
                    return (
                      <div
                        key={i}
                        className="min-w-[300px] max-w-[300px] snap-center bg-white border-4 border-black rounded-2xl p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col gap-3 shrink-0 font-sans"
                      >
                        <div className="w-full h-48 border-2 border-black rounded-xl overflow-hidden relative bg-[#FDE073] flex items-center justify-center">
                          <img
                            src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${post.handle}${i}&backgroundColor=transparent`}
                            alt="Character Art"
                            className="w-full h-full object-contain p-2"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-2 left-2 bg-white border-2 border-black rounded-md px-2 py-1 text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" /> Art Drop
                          </div>
                          <div className="absolute top-2 right-2 text-[10px] font-black text-[#00A843] bg-[#86F29F] px-2 py-1 border-2 border-black rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            {post.roi}
                          </div>
                        </div>
                        <div className="flex flex-col justify-between flex-1">
                          <p className="text-sm font-medium leading-5 mb-4 line-clamp-3 text-black">
                            {post.content}
                          </p>
                          <div className="flex items-center justify-between text-xs font-black border-t-2 border-black/10 pt-3 text-gray-500">
                            <div className="flex items-center gap-1.5">
                              <Heart className="w-4 h-4" /> {post.likes}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MessageSquare className="w-4 h-4" /> {post.comments}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Repeat className="w-4 h-4" /> {post.shares}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (post.format?.includes("patch")) {
                    return (
                      <div
                        key={i}
                        className="min-w-[300px] max-w-[300px] snap-center bg-[#F5F5F0] border-4 border-black rounded-2xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col gap-4 shrink-0 font-sans text-black group relative"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[#86F29F] border-2 border-black flex items-center justify-center">
                              <Activity className="w-4 h-4 text-black" />
                            </div>
                            <span className="font-black text-sm uppercase tracking-wider text-black">Patch Note</span>
                          </div>
                        </div>

                        <div className="flex flex-col justify-between flex-1">
                          <div className="bg-white border-2 border-black/10 rounded-xl p-3 mb-4">
                            <p className="text-sm font-medium leading-snug text-black">
                              {post.content}
                            </p>
                          </div>
                          <div className="flex items-center justify-between text-xs font-black border-t-2 border-black/10 pt-3 text-gray-500">
                            <div className="flex items-center gap-1.5">
                              <ThumbsUp className="w-4 h-4" /> {post.likes}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MessageSquare className="w-4 h-4" /> {post.comments}
                            </div>
                          </div>
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/70 transition-all duration-300 z-50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-sm pointer-events-none rounded-xl">
                          <div className="flex flex-col items-center gap-4 scale-90 group-hover:scale-100 transition-transform duration-300">
                            <div className="bg-[#86F29F] border-4 border-black rounded-xl px-4 py-2 text-xl font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black text-center">
                              <div className="text-xs opacity-70 mb-1">Ad Spend</div>
                              ₮{post.spend.toFixed(2)}
                            </div>
                            <div className="bg-[#86F29F] border-4 border-black rounded-xl px-4 py-2 text-xl font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-[#00A843] text-center">
                              <div className="text-xs opacity-70 mb-1 text-black">Est. ROI</div>
                              {post.roi}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={i}
                      className="min-w-[300px] max-w-[300px] snap-center bg-white border-4 border-black rounded-2xl p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col gap-3 shrink-0 group relative"
                    >
                      <div className="w-full h-40 border-2 border-black rounded-xl overflow-hidden relative bg-black flex items-center justify-center">
                        <img
                          src={post.image}
                          alt="Ad Creative"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div
                          className={`absolute top-2 right-2 border-2 border-black rounded-md px-2 py-1 text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                            post.platform.includes("TikTok")
                              ? "bg-black text-white"
                              : post.platform.includes("Instagram")
                                ? "bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white"
                                : post.platform.includes("X")
                                  ? "bg-[#1DA1F2] text-white"
                                  : post.platform.includes("Reddit")
                                    ? "bg-[#FF4500] text-white"
                                    : post.platform.includes("YouTube")
                                      ? "bg-[#FF0000] text-white"
                                      : post.platform.includes("Meta")
                                        ? "bg-[#0668E1] text-white"
                                        : "bg-white text-black"
                          }`}
                        >
                          {post.platform}
                        </div>
                      </div>
                      <div className="flex flex-col justify-between flex-1">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-black text-sm">{post.handle}</div>
                          </div>
                          <p className="text-sm font-medium leading-5 mb-4 line-clamp-4">
                            {post.content}
                          </p>
                        </div>
                        <div className="flex items-center justify-between text-xs font-black border-t-2 border-black pt-3">
                          <div className="flex items-center gap-1.5">
                            <Heart className="w-4 h-4" /> {post.likes}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MessageSquare className="w-4 h-4" /> {post.comments}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Repeat className="w-4 h-4" /> {post.shares}
                          </div>
                        </div>
                      </div>

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/70 transition-all duration-300 z-50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-sm pointer-events-none rounded-xl">
                        <div className="flex flex-col items-center gap-4 scale-90 group-hover:scale-100 transition-transform duration-300">
                          <div className="bg-[#86F29F] border-4 border-black rounded-xl px-4 py-2 text-xl font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black text-center">
                            <div className="text-xs opacity-70 mb-1">Ad Spend</div>
                            ₮{post.spend.toFixed(2)}
                          </div>
                          <div className="bg-[#86F29F] border-4 border-black rounded-xl px-4 py-2 text-xl font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-[#00A843] text-center">
                            <div className="text-xs opacity-70 mb-1 text-black">Est. ROI</div>
                            {post.roi}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-full xl:w-[420px] min-h-0 p-4 md:p-6 pb-8 flex flex-col gap-4 md:gap-6 overflow-y-auto overflow-x-hidden hide-scrollbar shrink-0 border-t-2 xl:border-t-0 xl:border-l-2 border-black/5 bg-[#F5F5F0]">
        {/* Syndicate Bank Card */}
        <div className="bg-gradient-to-br from-zinc-800 to-zinc-950 border-4 border-black rounded-[2rem] p-6 flex flex-col justify-between shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all relative overflow-hidden group text-white aspect-[1.586/1] shrink-0">
          <img
            src="https://firebasestorage.googleapis.com/v0/b/fleet-space-412512.firebasestorage.app/o/story-assets%2Fsterling_loves_tether.png?alt=media&token=b74c6562-d4ad-485f-8959-36f8f75f68b9"
            alt="Sterling Background"
            className="absolute -right-2 -bottom-2 w-[85%] h-[115%] object-contain object-right-bottom z-0"
            referrerPolicy="no-referrer"
          />

          {/* Card Chip & Logo */}
          <div className="flex justify-between items-start relative z-10">
            <div className="w-12 h-8 bg-[#FDE073] rounded-md border-2 border-black flex items-center justify-center opacity-90">
              <div className="w-6 h-5 border border-black/30 rounded-[2px] flex items-center justify-center">
                <div className="w-2 h-full border-x border-black/30"></div>
              </div>
            </div>
          </div>

          {/* Balance */}
          <div className="my-auto relative z-10">
            <div className="text-white/60 text-xs font-black uppercase tracking-[0.2em] mb-1">
              Sterling Balance
            </div>
            <div className="text-4xl font-black text-white tracking-tighter flex items-baseline gap-1 drop-shadow-md">
              <span className="text-2xl font-sans">₮</span>
              0
              <span className="text-xl">.00</span>
            </div>
          </div>

          {/* Card Details */}
          <div className="flex justify-between items-end relative z-10">
            <div>
              <div className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">
                Card Holder
              </div>
              <div className="font-black uppercase tracking-widest text-sm text-white drop-shadow-md">
                Sterling Agent
              </div>
            </div>
          </div>
        </div>

        {/* Income / Expense Blocks */}
        <div className="grid grid-cols-2 gap-4 shrink-0">
          {/* Income */}
          <div className="bg-[#86F29F] border-4 border-black rounded-3xl p-4 sm:p-5 flex flex-col shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group">
            <div className="text-[10px] font-black uppercase tracking-widest text-black/60 mb-1 relative z-10 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> Income
            </div>
            <div className="text-2xl sm:text-3xl font-black text-black mb-4 relative z-10 flex items-baseline">
              +
              {(
                marketingData?.budget_execution?.total_amount_usd || 0
              ).toLocaleString()}
              <span className="text-lg sm:text-xl text-black/60 ml-1">₮</span>
            </div>
            <div className="flex justify-between items-end mt-auto relative z-10">
              <div className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-black/60 leading-tight max-w-[50%]">
                Total Funding
              </div>
              <div className="bg-white border-2 border-black rounded-lg px-2 py-1 text-[10px] font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform -rotate-2 group-hover:rotate-0 transition-transform">
                +100%
              </div>
            </div>
          </div>

          {/* Expense */}
          <div className="bg-[#FFA3C5] border-4 border-black rounded-3xl p-4 sm:p-5 flex flex-col shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group">
            <div className="text-[10px] font-black uppercase tracking-widest text-black/60 mb-1 relative z-10 flex items-center gap-1">
              <ArrowDownRight className="w-3 h-3" /> Expense
            </div>
            <div className="text-2xl sm:text-3xl font-black text-black mb-4 relative z-10 flex items-baseline">
              -
              {(
                marketingData?.channel_transfers?.reduce(
                  (sum: number, tx: any) =>
                    sum + (tx.allocated_amount_usd || 0),
                  0,
                ) || 0
              ).toLocaleString()}
              <span className="text-lg sm:text-xl text-black/60 ml-1">₮</span>
            </div>
            <div className="flex justify-between items-end mt-auto relative z-10">
              <div className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-black/60 leading-tight max-w-[50%]">
                Allocated Spend
              </div>
              <div className="bg-white border-2 border-black rounded-lg px-2 py-1 text-[10px] font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform rotate-2 group-hover:rotate-0 transition-transform">
                -
                {Math.round(
                  ((marketingData?.channel_transfers?.reduce(
                    (sum: number, tx: any) =>
                      sum + (tx.allocated_amount_usd || 0),
                    0,
                  ) || 0) /
                    (marketingData?.budget_execution?.total_amount_usd || 1)) *
                    100,
                )}
                %
              </div>
            </div>
          </div>
        </div>

        {/* Spend Log */}
        <div className="bg-white border-4 border-black rounded-3xl p-6 flex flex-col shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all flex-1 text-black min-h-0">
          <div className="flex justify-between items-center mb-6 border-b-4 border-black pb-4">
            <h2 className="text-xl font-black tracking-tight uppercase flex items-center gap-2">
              Ledger
            </h2>
            <button className="text-xs font-black uppercase tracking-widest bg-[#E4E3E0] px-3 py-1.5 border-2 border-black rounded-lg hover:bg-gray-300 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
              View All
            </button>
          </div>

          <div className="flex flex-col gap-4 overflow-y-auto pr-2 hide-scrollbar">
            {displayedTransfers.map((tx: any, i: number) => (
              <div
                key={i}
                className="flex flex-col p-3 rounded-xl border-2 border-black bg-[#F5F5F0] hover:bg-white transition-colors group gap-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 shrink-0 rounded-lg border-2 border-black flex items-center justify-center ${tx.isDeposit ? "bg-[#86F29F]" : "bg-black text-[#86F29F]"}`}
                    >
                      {tx.isDeposit ? (
                        <ArrowDownRight className="w-5 h-5 text-black" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="font-black text-sm uppercase">
                        {tx.platform}
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                        {tx.campaign}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div
                      className={`font-black text-lg ${tx.isDeposit ? "text-[#00A843]" : "text-black"}`}
                    >
                      {tx.isDeposit ? "+" : ""}
                      {tx.amount
                        .toLocaleString("en-US", {
                          style: "currency",
                          currency: "USD",
                        })
                        .replace("$", "₮")}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      {tx.date}
                    </div>
                  </div>
                </div>
                {!tx.isDeposit && (
                  <div className="flex items-center justify-between border-t-2 border-black/10 pt-2 mt-1">
                    <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1">
                      <CreditCard className="w-3 h-3" /> Payment
                    </div>
                    <a
                      href={tx.explorer_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-black text-blue-600 hover:underline flex items-center gap-1 w-fit"
                    >
                      {tx.hash} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                {tx.isDeposit && (
                  <div className="flex items-center justify-between border-t-2 border-black/10 pt-2 mt-1">
                    <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1">
                      <CreditCard className="w-3 h-3" /> Smart Contract Fund
                    </div>
                    <a
                      href={tx.explorer_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-black text-blue-600 hover:underline flex items-center gap-1 w-fit truncate max-w-[120px]"
                      title={tx.fullHash || tx.hash}
                    >
                      {tx.fullHash || tx.hash} <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {buyResult && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black rounded-3xl p-6 max-w-md w-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all">
            <h2 className="text-2xl font-black uppercase tracking-tight mb-4">
              Purchase Successful
            </h2>
            <div className="space-y-3 text-sm font-medium">
              <div>
                <span className="text-gray-500 uppercase tracking-wider text-xs block">TX Hash</span>
                <a href={`https://sepolia.etherscan.io/tx/${buyResult.tx_hash}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all">
                  {buyResult.tx_hash}
                </a>
              </div>
              {buyResult.approve_tx_hash && (
                <div>
                  <span className="text-gray-500 uppercase tracking-wider text-xs block">Approve TX Hash</span>
                  <a href={`https://sepolia.etherscan.io/tx/${buyResult.approve_tx_hash}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all">
                    {buyResult.approve_tx_hash}
                  </a>
                </div>
              )}
              <div>
                <span className="text-gray-500 uppercase tracking-wider text-xs block">Contract Address</span>
                <span className="break-all">{buyResult.contract_address}</span>
              </div>
              {buyResult.contract_address_input_ignored && (
                <div>
                  <span className="text-gray-500 uppercase tracking-wider text-xs block">Ignored Input Address</span>
                  <span className="break-all text-gray-400">{buyResult.contract_address_input_ignored}</span>
                </div>
              )}
              <div>
                <span className="text-gray-500 uppercase tracking-wider text-xs block">Payment Token</span>
                <span className="break-all">{buyResult.payment_token}</span>
              </div>
              <div>
                <span className="text-gray-500 uppercase tracking-wider text-xs block">Amount</span>
                <span className="break-all">{buyResult.approved_amount_atomic}</span>
              </div>
            </div>
            <button
              onClick={() => setBuyResult(null)}
              className="mt-6 w-full bg-black text-white font-black uppercase tracking-widest py-3 px-4 rounded-xl hover:bg-gray-800 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showPendingContractModal && pendingContractTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl overflow-hidden flex flex-col p-8 text-center animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowPendingContractModal(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-white border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-lg flex items-center justify-center text-black hover:bg-gray-50 transition-colors active:translate-y-[2px] active:shadow-none"
            >
              <X className="w-4 h-4 font-black" />
            </button>
            <div className="w-20 h-20 bg-[#86F29F] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-full flex items-center justify-center mb-6 mx-auto mt-2">
              <BadgeCheck className="w-10 h-10 text-black" />
            </div>
            <h3 className="text-2xl font-black text-black uppercase tracking-widest mb-3">Funds Locked</h3>
            <p className="text-black font-bold mb-8 text-sm uppercase tracking-wider">
              The smart contract is active and funds are secured.
            </p>
            <button 
              onClick={async () => {
                if (user && pendingContractTaskId !== 'mock-task-id') {
                  try {
                    await addDoc(collection(db, 'agent_tasks'), {
                      type: 'marketing_execution',
                      status: 'pending',
                      authorUid: user.uid,
                      payload: {
                        settlementTaskId: pendingContractTaskId,
                        sourceTaskId: analyzedStory?.taskId || 'unknown'
                      },
                      createdAt: new Date().toISOString()
                    });
                    localStorage.removeItem('pending_marketing_execution');
                  } catch (err) {
                    console.error("Failed to trigger marketing execution", err);
                  }
                }
                setShowPendingContractModal(false);
              }}
              className="w-full px-6 py-4 rounded-xl font-black text-sm text-black bg-[#86F29F] hover:bg-[#6ce688] transition-colors border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase tracking-widest"
            >
              Go to Advertising Cabinet
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
