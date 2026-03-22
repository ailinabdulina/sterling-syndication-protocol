import React, { useState, useEffect } from 'react';
import { OfferCard } from '../components/syndicate/OfferCard';
import { SterlingSidebar } from '../components/syndicate/SterlingSidebar';
import { FeedItem } from '../types/syndicate';
import { ContractModal } from '../components/dashboard/ContractModal';
import { TrustBadge } from '../components/dashboard/TrustBadge';
import { useAuth } from '../contexts/AuthContext';
import { openclawService } from '../services/openclaw';
import { StoryData, SyndicateReviewResult } from '../types';
import { MOCK_OFFERS, INVESTOR_PHRASES } from '../data/syndicateData';
import { extractJsonFromString } from '../utils/jsonUtils';
import { InvestorVerdictSchema, BestOfferSchema } from '../schemas';

interface SyndicateViewProps {
  isActive?: boolean;
  setCurrentView: (view: 'dashboard' | 'new' | 'syndicate' | 'advertising') => void;
  analyzedStory: StoryData | null;
  onContractSigned?: (txHash?: string, tokenId?: number) => void;
  hasSignedContract?: boolean;
  onVerdictsReady?: () => void;
}

const getCompletedChats = (): Set<string> => {
  try {
    return new Set(JSON.parse(localStorage.getItem('completed_chats') || '[]'));
  } catch {
    return new Set<string>();
  }
};

const completedChats = getCompletedChats();
const syndicateResultCache = new Map<string, SyndicateReviewResult>();

export const SyndicateView: React.FC<SyndicateViewProps> = ({ isActive = true, setCurrentView, analyzedStory, onContractSigned, hasSignedContract, onVerdictsReady }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [reviewResult, setReviewResult] = useState<SyndicateReviewResult | null>(null);
  const [mobileTab, setMobileTab] = useState<'offers' | 'feed'>('offers');
  const { user } = useAuth();

  const onVerdictsReadyRef = React.useRef(onVerdictsReady);
  React.useEffect(() => {
    onVerdictsReadyRef.current = onVerdictsReady;
  }, [onVerdictsReady]);

  useEffect(() => {
    if (!analyzedStory?.taskId || (!user && analyzedStory.taskId !== 'mock-task-id')) {
      setErrorMsg('No analyzed story found or user not logged in.');
      setStatus('error');
      return;
    }

    if (syndicateResultCache.has(analyzedStory.taskId)) {
      setReviewResult(syndicateResultCache.get(analyzedStory.taskId)!);
      setStatus('success');
      return;
    }

    setStatus('loading');
    openclawService.getSyndicateVerdicts(
      analyzedStory.taskId,
      user?.uid || 'mock-uid',
      (result, isExisting) => {
        if (isExisting && analyzedStory.taskId) {
          completedChats.add(analyzedStory.taskId);
          localStorage.setItem('completed_chats', JSON.stringify(Array.from(completedChats)));
        }
        syndicateResultCache.set(analyzedStory.taskId, result);
        setReviewResult(result);
        setStatus('success');
        if (onVerdictsReadyRef.current && !isExisting && analyzedStory.taskId !== 'mock-task-id') {
          onVerdictsReadyRef.current();
        }
      },
      (err) => {
        setErrorMsg(err.message);
        setStatus('error');
      }
    );
  }, [analyzedStory, user]);

  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [isChatComplete, setIsChatComplete] = useState(false);
  const [revealedVerdicts, setRevealedVerdicts] = useState<Record<string, any>>({});
  const [bestOffer, setBestOffer] = useState<any>(null);
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);
  const [activePhrase, setActivePhrase] = useState<string | null>(null);
  const [typingAgent, setTypingAgent] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const showRandomPhrase = () => {
      if (!isMounted) return;
      
      const agents = Object.keys(INVESTOR_PHRASES);
      const randomAgent = agents[Math.floor(Math.random() * agents.length)];
      const phrases = INVESTOR_PHRASES[randomAgent as keyof typeof INVESTOR_PHRASES];
      
      if (phrases && phrases.length > 0) {
        const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
        setActiveSpeaker(randomAgent);
        setActivePhrase(randomPhrase);
      }

      timeoutId = setTimeout(() => {
        if (!isMounted) return;
        setActiveSpeaker(null);
        setActivePhrase(null);
        // Wait 1 second before showing the next one
        timeoutId = setTimeout(showRandomPhrase, 1000);
      }, 5000);
    };

    if (status === 'loading' && feed.length <= 2) {
      timeoutId = setTimeout(showRandomPhrase, 4000);
    } else {
      setActiveSpeaker(null);
      setActivePhrase(null);
    }

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [status, feed.length]);

  useEffect(() => {
    let timeouts: NodeJS.Timeout[] = [];
    if (status === 'loading') {
      const title = analyzedStory?.story_title || analyzedStory?.Title || "Untitled";
      const author = analyzedStory?.author || analyzedStory?.Author || "Unknown";
      
      const msg1 = {
        id: -1,
        type: undefined,
        from: 'sterling',
        text: `Ladies and gentlemen, I present to you a story by ${author} titled "${title}". The floor is open.`,
        delay_ms: 1500
      };
      
      const msg2 = {
        id: -2,
        type: undefined,
        from: 'sterling',
        text: `While the investors are deliberating, you can explore your story's metrics. We'll notify you when they're ready.`,
        delay_ms: 1500,
        action: {
          label: "View Metrics",
          view: "dashboard" as const
        }
      };
      
      const msg3 = {
        id: -3,
        type: undefined,
        from: 'sterling',
        text: `The investors will be deliberating and depositing funds for about 5 minutes. Please be patient.`,
        delay_ms: 1500
      };

      setFeed([]);
      setTypingAgent('Sterling');

      timeouts.push(setTimeout(() => {
        setFeed(prev => {
          if (!prev.some(m => m.id === -1)) return [...prev, msg1];
          return prev;
        });
        setTypingAgent('Sterling');
      }, 2000));

      timeouts.push(setTimeout(() => {
        setFeed(prev => {
          if (!prev.some(m => m.id === -2)) return [...prev, msg2];
          return prev;
        });
        setTypingAgent('Sterling');
      }, 7000));

      timeouts.push(setTimeout(() => {
        setFeed(prev => {
          if (!prev.some(m => m.id === -3)) return [...prev, msg3];
          return prev;
        });
        
        const agents = ['Barnaby', 'Crypto_Bunny', 'Safe_Paws', 'Diamond_Hands', 'Laser_Eyes_99', 'Agent_X9'];
        const changeTypingAgent = () => {
          setTypingAgent(prev => {
            const available = agents.filter(a => a !== prev);
            return available[Math.floor(Math.random() * available.length)];
          });
          timeouts.push(setTimeout(changeTypingAgent, 2500));
        };
        changeTypingAgent();
      }, 12000));
    }
    return () => timeouts.forEach(clearTimeout);
  }, [status, analyzedStory]);

  useEffect(() => {
    if (!reviewResult) return;

    const taskId = analyzedStory?.taskId;

    const feedMessages = Array.isArray(reviewResult) ? reviewResult : (reviewResult.feed?.feed_messages || reviewResult.feed_messages || []);
    const rawMessages = feedMessages.map((msg: any, idx: number) => {
      let payload = msg?.event_payload;
      let text = msg?.content || msg?.text || msg?.message || payload?.content || payload?.text || payload?.message || '';
      
      if (typeof text === 'string' && text.includes('"event":"INVESTOR_VERDICT"')) {
        try { 
          const cleanStr = extractJsonFromString(text);
          const parsed = JSON.parse(cleanStr);
          if (!payload) {
            const validation = InvestorVerdictSchema.safeParse(parsed);
            if (validation.success) {
              payload = validation.data;
            } else {
              console.warn("Zod validation failed for INVESTOR_VERDICT:", validation.error);
              payload = parsed; // Fallback to parsed data
            }
          }
          text = text.replace(cleanStr, '').replace(/```json\s*```/g, '').replace(/```\s*```/g, '').trim();
        } catch(e) {}
      }
      if (typeof text === 'string' && text.includes('"event":"BEST_OFFER"')) {
        try { 
          const cleanStr = extractJsonFromString(text);
          const parsed = JSON.parse(cleanStr);
          if (!payload) {
            const validation = BestOfferSchema.safeParse(parsed);
            if (validation.success) {
              payload = validation.data;
            } else {
              console.warn("Zod validation failed for BEST_OFFER:", validation.error);
              payload = parsed; // Fallback to parsed data
            }
          }
          text = text.replace(cleanStr, '').replace(/```json\s*```/g, '').replace(/```\s*```/g, '').trim();
        } catch(e) {}
      }

      let verdict;
      const isVerdict = payload && payload.event === 'INVESTOR_VERDICT' && msg?.type !== 'system';

      if (isVerdict) {
        verdict = {
          status: payload.decision?.toUpperCase() === 'ACCEPT' || payload.decision?.toUpperCase() === 'INVEST' ? 'ACCEPTED' : payload.decision?.toUpperCase() === 'COUNTER' ? 'COUNTER' : 'REJECTED',
          offer: payload.amount_usd > 0 ? `₮${payload.amount_usd} for ${payload.equity_pct}%` : null,
          short: payload.reasoning || payload.thesis || null,
          distribution: payload.ad_spend_pct !== undefined ? {
            ad_spend_pct: payload.ad_spend_pct,
            influencer_pct: payload.influencer_pct,
            quality_improvement_pct: payload.quality_improvement_pct
          } : null
        };
      }

      return {
        id: idx,
        type: isVerdict ? undefined : (msg?.type === 'system' ? 'system' : msg?.type === 'deal_event' ? 'deal_event' : undefined),
        from: isVerdict ? (payload.agent_name || msg?.speaker) : msg?.speaker,
        text: text,
        delay_ms: 1500,
        event_payload: msg?.type === 'system' ? undefined : payload,
        verdict: verdict
      };
    });

    const title = analyzedStory?.story_title || analyzedStory?.Title || "Untitled";
    const author = analyzedStory?.author || analyzedStory?.Author || "Unknown";
    const introMessage = {
      id: -1,
      type: undefined,
      from: 'sterling',
      text: `Ladies and gentlemen, I present to you a story by ${author} titled "${title}". The floor is open.`,
      delay_ms: 1500
    };
    const introMessage2 = {
      id: -2,
      type: undefined,
      from: 'sterling',
      text: `While the investors are deliberating, you can explore your story's metrics. We'll notify you when they're ready.`,
      delay_ms: 1500,
      action: {
        label: "View Metrics",
        view: "dashboard" as const
      }
    };
    const introMessage3 = {
      id: -3,
      type: undefined,
      from: 'sterling',
      text: `The investors will be deliberating and depositing funds for about 5 minutes. Please be patient.`,
      delay_ms: 1500
    };

    const messages = [...rawMessages];
    if (messages.length > 0 && messages[0].type === 'system') {
      messages.splice(1, 0, introMessage, introMessage2, introMessage3);
    } else {
      messages.unshift(introMessage, introMessage2, introMessage3);
    }

    if (taskId && completedChats.has(taskId)) {
      setFeed(messages);
      setIsChatComplete(true);
      setTypingAgent(null);
      
      const verdicts: Record<string, any> = {};
      let best: any = null;
      messages.forEach(msg => {
        let payload = msg.event_payload;
        
        if (payload) {
          if (payload.event === 'INVESTOR_VERDICT') {
            verdicts[payload.agent_name || msg.from] = payload;
          } else if (payload.event === 'BEST_OFFER') {
            best = payload;
          }
        }
      });
      setRevealedVerdicts(verdicts);
      setBestOffer(best || reviewResult.ui_signals?.best_offer);
      return;
    }

    let currentIndex = 0;
    const initialFeed = [];
    if (messages.length > 0 && messages[0].type === 'system') {
      initialFeed.push(messages[0]);
      if (messages.length > 1) {
        initialFeed.push(messages[1]);
        if (messages.length > 2) {
          initialFeed.push(messages[2]);
          if (messages.length > 3) {
            initialFeed.push(messages[3]);
            currentIndex = 4;
          } else {
            currentIndex = 3;
          }
        } else {
          currentIndex = 2;
        }
      } else {
        currentIndex = 1;
      }
    } else if (messages.length > 0) {
      initialFeed.push(messages[0]);
      if (messages.length > 1) {
        initialFeed.push(messages[1]);
        if (messages.length > 2) {
          initialFeed.push(messages[2]);
          currentIndex = 3;
        } else {
          currentIndex = 2;
        }
      } else {
        currentIndex = 1;
      }
    }
    setFeed(initialFeed);
    setIsChatComplete(false);
    setRevealedVerdicts({});
    setBestOffer(null);

    const showNextMessage = () => {
      if (currentIndex < messages.length) {
        const msg = messages[currentIndex];
        
        let payload = msg.event_payload;
        
        if (payload) {
          if (payload.event === 'INVESTOR_VERDICT') {
            setRevealedVerdicts(prev => ({...prev, [payload.agent_name || msg.from]: payload}));
          } else if (payload.event === 'BEST_OFFER') {
            setBestOffer(payload);
          }
        }

        setFeed(prev => [...prev, msg]);
        currentIndex++;
        
        if (currentIndex < messages.length) {
          setTypingAgent(messages[currentIndex].from || null);
        } else {
          setTypingAgent(null);
        }

        setTimeout(showNextMessage, 1500); // 1.5s delay between messages
      } else {
        setIsChatComplete(true);
        setTypingAgent(null);
        if (taskId) {
          completedChats.add(taskId);
          localStorage.setItem('completed_chats', JSON.stringify(Array.from(completedChats)));
        }
        setBestOffer(prev => prev || reviewResult.ui_signals?.best_offer);
      }
    };

    if (currentIndex < messages.length) {
      setTypingAgent(messages[currentIndex].from || null);
    } else {
      setTypingAgent(null);
    }
    const timer = setTimeout(showNextMessage, 500);
    return () => clearTimeout(timer);
  }, [reviewResult, analyzedStory?.taskId]);

  const currentOffers = React.useMemo(() => {
    if (!reviewResult || !reviewResult.investor_outputs) return [];

    return (reviewResult.investor_outputs || []).map((output, idx) => {
      const mockOffer = MOCK_OFFERS.find(m => m.nickname === output.agent_name);
      
      const verdict = revealedVerdicts[output.agent_name];
      
      let mappedStatus: 'accept' | 'reject' | 'counter' | 'pending' = 'pending';
      let amountUsd = output.offer?.amount_usd || 0;
      let equityPct = output.offer?.equity_pct || 0;
      let adSpendPct = output.offer?.ad_spend_pct || 0;
      let influencerPct = output.offer?.influencer_pct || 0;
      let qualityPct = output.offer?.quality_improvement_pct || 0;

      if (verdict) {
        const decision = verdict.decision?.toLowerCase();
        if (decision === 'accept' || decision === 'invest') mappedStatus = 'accept';
        else if (decision === 'counter') mappedStatus = 'counter';
        else mappedStatus = 'reject';

        if (verdict.amount_usd !== undefined) amountUsd = verdict.amount_usd;
        if (verdict.equity_pct !== undefined) equityPct = verdict.equity_pct;
        if (verdict.ad_spend_pct !== undefined) adSpendPct = verdict.ad_spend_pct;
        if (verdict.influencer_pct !== undefined) influencerPct = verdict.influencer_pct;
        if (verdict.quality_improvement_pct !== undefined) qualityPct = verdict.quality_improvement_pct;
      } else if (isChatComplete) {
        const decision = output.decision?.toLowerCase();
        if (decision === 'accept' || decision === 'invest') mappedStatus = 'accept';
        else if (decision === 'counter') mappedStatus = 'counter';
        else mappedStatus = 'reject';
      }

      const acceptedOfferId = reviewResult.onchain_offer_meta?.accepted_offer_id;
      const isBestOffer = acceptedOfferId 
        ? (output.onchain_offer?.offer_id === acceptedOfferId)
        : (bestOffer?.agent_name === output.agent_name || reviewResult.ui_signals?.best_offer?.agent_name === output.agent_name);

      return {
        ...output,
        id: `offer-${idx}`,
        avatar: mockOffer?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${output.agent_name}&backgroundColor=transparent`,
        status: mappedStatus,
        contract_terms: verdict?.contract_terms || verdict?.offer?.contract_terms || output.contract_terms,
        revenue_mock: verdict?.revenue_mock || verdict?.offer?.revenue_mock || output.revenue_mock,
        offer: {
          ...output.offer,
          amount_usd: amountUsd,
          equity_pct: equityPct,
          ad_spend_pct: adSpendPct,
          influencer_pct: influencerPct,
          quality_improvement_pct: qualityPct,
          pricing_terms: verdict?.pricing_terms || verdict?.offer?.pricing_terms || output.offer?.pricing_terms,
          content_plan_terms: verdict?.content_plan_terms || verdict?.offer?.content_plan_terms || output.offer?.content_plan_terms
        },
        onchain_offer: verdict?.onchain_offer || output.onchain_offer,
        wallet_balance_usdt: output.wallet_balance_usdt || (mockOffer?.treasury ? parseFloat(mockOffer.treasury.replace(/[^0-9.]/g, '')) * (mockOffer.treasury.includes('M') ? 1000000 : 1000) : 0),
        followers: mockOffer?.followers || output.followers,
        roi: mockOffer?.roi || output.roi,
        level: mockOffer?.level || output.level,
        genres: mockOffer?.genres || output.genres,
        isBestOffer: isBestOffer
      };
    });
  }, [reviewResult, isChatComplete, analyzedStory, revealedVerdicts, bestOffer]);

  const hasAcceptedOffer = currentOffers.some(o => o.status === 'accept' || o.status === 'counter');

  const displayOffers = status === 'loading' ? MOCK_OFFERS.slice(0, 6).map((offer, i) => ({
    id: `offer-${i}`,
    agent_name: offer.nickname,
    wallet_address: '0x...',
    wallet_balance_usdt: offer.treasury ? parseFloat(offer.treasury.replace(/[^0-9.]/g, '')) * (offer.treasury.includes('M') ? 1000000 : 1000) : 0,
    thesis: '',
    offer: {
      amount_usd: 0,
      equity_pct: 0,
      influencer_pct: 0,
      ad_spend_pct: 0,
      quality_improvement_pct: 0
    },
    status: 'pending' as const,
    avatar: offer.avatar,
    followers: offer.followers,
    roi: offer.roi,
    level: offer.level,
    genres: offer.genres
  })) : currentOffers;

  const getAnimationClass = (index: number) => {
    if (status !== 'loading') return '';
    const animations = ['animate-flyInLeft', 'animate-flyInRight', 'animate-flyInTop', 'animate-flyInBottom', 'animate-flyInLeft', 'animate-flyInRight'];
    return animations[index % animations.length];
  };

  if (status === 'error') {
    const isSecurityViolation = errorMsg?.includes('отклонено по безопасности') || errorMsg?.includes('PROMPT_INJECTION_DETECTED');
    const headerText = isSecurityViolation ? 'Review Failed / отклонено по безопасности' : 'Review Failed';
    const displayMsg = errorMsg?.replace('Review Failed / отклонено по безопасности: ', '');

    return (
      <div className={`${isActive ? 'flex-1 flex flex-col items-center justify-center bg-[#E4E3E0] text-black p-8' : 'hidden'}`}>
        <div className="bg-red-500/20 border-2 border-red-500 p-6 rounded-2xl max-w-lg text-center shadow-[4px_4px_0px_0px_rgba(239,68,68,1)]">
          <h2 className="text-2xl font-black uppercase tracking-widest text-red-600 mb-2">{headerText}</h2>
          <p className="text-black/80 font-bold">{displayMsg}</p>
          <button 
            onClick={() => setCurrentView('dashboard')}
            className="mt-6 px-6 py-2 bg-white text-black font-black uppercase tracking-widest rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Tabs */}
      <div className={`${isActive ? 'flex xl:hidden bg-[#E4E3E0] p-2 px-4 shrink-0 border-b-4 border-black/10' : 'hidden'}`}>
        <div className="flex bg-black/5 p-1 rounded-xl w-full">
          <button 
            onClick={() => setMobileTab('offers')}
            className={`flex-1 px-6 py-2 rounded-lg font-black uppercase tracking-widest text-sm transition-colors ${mobileTab === 'offers' ? 'bg-black text-white' : 'text-black hover:bg-black/10'}`}
          >
            Offers
          </button>
          <button 
            onClick={() => setMobileTab('feed')}
            className={`flex-1 px-6 py-2 rounded-lg font-black uppercase tracking-widest text-sm transition-colors ${mobileTab === 'feed' ? 'bg-[#A5DDF8] text-black' : 'text-black hover:bg-black/10'}`}
          >
            Live Feed
          </button>
        </div>
      </div>

      <div className={`${isActive ? 'flex-1 flex flex-col xl:flex-row min-h-0 w-full animate-in fade-in duration-200' : 'hidden'}`}>
        {/* Left Content (Main Area) */}
        <div className={`flex-none xl:flex-1 min-h-0 min-w-0 flex flex-col p-4 md:p-6 xl:pb-8 overflow-hidden relative bg-[#E4E3E0] ${mobileTab === 'offers' ? 'flex' : 'hidden xl:flex'}`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.02)_0%,transparent_100%)] pointer-events-none" />
          
          <div className="flex flex-col md:flex-row w-full gap-4 md:gap-6 h-full min-h-0">
            {/* Vertical Header (Desktop) */}
            <div className="hidden md:flex flex-col items-center justify-between shrink-0 border-r-4 border-black/10 pr-4 lg:pr-6 py-2">
              <div className="mb-6">
                <TrustBadge score={reviewResult?.verification_report?.trust_score} />
              </div>
              <h1 
                className="text-4xl lg:text-5xl font-black text-black uppercase tracking-tighter whitespace-nowrap flex-1 flex items-center" 
                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
              >
                Inside the Syndicate
              </h1>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 w-full flex flex-col min-h-0">
              {/* Horizontal Header (Mobile) */}
              <div className="flex md:hidden items-center justify-between gap-3 mb-4 shrink-0">
                <h1 className="text-2xl font-black text-black uppercase tracking-tighter">Inside the Syndicate</h1>
                <TrustBadge score={reviewResult?.verification_report?.trust_score} />
              </div>

              {/* Offers Grid */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 xl:grid-rows-2 gap-4 md:gap-6 w-full h-full overflow-y-auto xl:overflow-visible hide-scrollbar">
                {displayOffers.map((offer, index) => (
                  <div key={offer.id} className={`h-full min-h-[430px] xl:min-h-0 ${getAnimationClass(index)}`} style={{ animationDelay: `${index * 0.15}s` }}>
                    <OfferCard 
                      offer={offer} 
                      activePhrase={activeSpeaker === offer.agent_name ? (activePhrase || undefined) : undefined}
                      onViewOffer={(o) => {
                        setSelectedOffer(o);
                        setIsModalOpen(true);
                      }}
                      hasSignedContract={hasSignedContract}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className={`w-full xl:w-[420px] min-h-0 p-4 md:p-6 xl:pb-8 flex flex-col gap-4 md:gap-6 shrink-0 border-t-2 xl:border-t-0 xl:border-l-2 border-black/5 bg-[#F5F5F0] ${mobileTab === 'feed' ? 'flex' : 'hidden xl:flex'}`}>
          <SterlingSidebar 
            feed={feed} 
            isAnalyzing={status === 'loading' || (status === 'success' && !isChatComplete)} 
            isChatComplete={isChatComplete}
            bestOffer={bestOffer}
            onAcceptBestOffer={() => {
              if (bestOffer) {
                const offerToSelect = currentOffers.find(o => o.agent_name === bestOffer.agent_name);
                if (offerToSelect) setSelectedOffer(offerToSelect);
              }
              setIsModalOpen(true);
            }}
            hasSignedContract={hasSignedContract}
            onNavigate={setCurrentView}
            typingAgent={typingAgent}
            hasAcceptedOffer={hasAcceptedOffer}
            onViewAllOffers={() => setIsModalOpen(true)}
          />
        </div>
      </div>

      {isActive && (
        <ContractModal 
          isOpen={isModalOpen} 
          onClose={() => {
            setIsModalOpen(false);
            setSelectedOffer(null);
          }} 
          onSuccess={(txHash?: string, tokenId?: number) => {
            setIsModalOpen(false);
            setSelectedOffer(null);
            if (onContractSigned) onContractSigned(txHash, tokenId);
            setCurrentView('advertising');
          }}
          onTransactionSent={(txHash: string, tokenId?: number) => {
            if (onContractSigned) onContractSigned(txHash, tokenId);
          }}
          monetizationApproved={true}
          offer={selectedOffer}
          offers={currentOffers.filter(o => o.status === 'accept' || o.status === 'counter')}
          storyData={analyzedStory}
          hasSignedContract={hasSignedContract}
        />
      )}
    </>
  );
};
