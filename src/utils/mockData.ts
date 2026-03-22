import { StoryData, SyndicateReviewResult } from '../types';
import { CHAT_DATA } from '../data/chatData';
import { MOCK_OFFERS } from '../data/syndicateData';

export const MOCK_STORY_DATA: StoryData = {
  taskId: 'mock-task-id',
  Title: "How Monsters Are Created",
  Author: "John Doe",
  story_title: "How Monsters Are Created",
  author: "John Doe",
  generated_synopsis: "On the scorched world of Handan, a boy relives the day his village was annihilated and his family was taken from him in a raid of mass killing, enslavement, and sexual violence. Hidden in a thorn bush while hearing the slaughter unfold, he survives but is permanently marked by guilt and trauma. The strongest hook is the origin-of-villain framing: a child survivor who ends the chapter swearing tenfold vengeance, setting up a brutal revenge saga.",
  age_rating_us: "R",
  tsi_evaluation: {
    CMA: {
      reasoning: "The premise is pitchable in one line (child survivor forged into a revenge monster), with a clear dark-emotional promise. It is commercially usable but not highly differentiated from other grim revenge fantasy setups.",
      score: 55
    },
    IER: {
      reasoning: "There are some visual anchors (blue sun, burned village, thorn-bush hiding, ash-and-blood imagery), but broader world identity systems (distinct factions, rules, artifacts, institutions) are still thin and interchangeable.",
      score: 40
    },
    PSP: {
      reasoning: "The chapter is trauma-forward and largely solitary, with no meaningful romance/rivalry chemistry or attachment-route dynamics that drive parasocial shipping behavior.",
      score: 30
    }
  },
  tei_evaluation: {
    VRS: {
      reasoning: "The text has high-intensity, quoteable dark lines and extreme emotional spikes that can trigger reaction discourse, but it lacks character-dynamic confrontation moments that typically fuel broader fandom clipping.",
      score: 55
    },
    ACV: {
      reasoning: "Meaningful conflict arrives very early: abnormal silence, immediate dread, then active massacre within the opening stretch, creating fast activation.",
      score: 70
    },
    HTR: {
      reasoning: "The chapter sustains open loops (missing parents, survival uncertainty, fate of survivors, identity of rescuer, future revenge trajectory) with persistent tension and withheld resolution.",
      score: 70
    },
    PEL: {
      reasoning: "The chapter closes on a strong unresolved emotional turn and revenge vow, creating clear next-click pressure into the protagonist’s transformation arc.",
      score: 70
    },
    SMR: {
      reasoning: "There is a viable long-form engine (vengeance pursuit, trauma aftermath, oppressor pursuit), but currently the narrative infrastructure is still centered on one core conflict with limited modular sub-systems shown.",
      score: 55
    },
    TWS: {
      reasoning: "Natural branch points in this chapter are limited; it reads as a fixed origin sequence rather than a choice-rich scenario with clearly invited route divergence.",
      score: 40
    }
  },
  predicted_demographics: {
    primary_geography: [
      "USA",
      "UK",
      "Canada"
    ],
    gender_split: "M: 60% / F: 40%",
    core_age_group: "18-34",
    wtp_proxy: "Medium",
    cac_proxy: "High"
  },
  business_insights: {
    ip_copyright_status: {
      is_original_ip: true,
      monetization_approved: true,
      detected_fandom: null,
      frontend_warning_message: "Clean IP. Ready for monetization."
    },
    age_rating_us: "R",
    overall_conclusion: "Commercially this is a functional dark-revenge hook with strong opening activation and retention pressure, but Twisly-native upside is constrained by low parasocial and branch density in the current chapter. Viral potential is moderate via shock/quote discourse, and legal monetization is currently clear as original IP.",
    target_audience_tags: [
      "grimdark revenge fantasy",
      "trauma-driven dark fantasy",
      "survival massacre narrative"
    ],
    virality_surface: "TikTok edits | Quote posts | Reaction threads",
    unit_economics_forecast: {
      estimated_cac_usd: "₮2.20 - ₮5.00",
      estimated_ltv_potential: "Medium: revenge-forward retention and cliff-end momentum are present, but LTV ceiling is limited until stronger character-route and choice architecture is introduced.",
      retention_driver: "Revenge payoff anticipation tied to unresolved trauma and escalating retribution goals."
    },
    monetization_hook: "Best paywall point: the moment the rescuer shoves the boy under the thorn bush and disappears, immediately before the survivor sorting and his realization of what is about to happen.",
    pivot_opportunity: "Reframe the origin chapter into a choice-gated survival/protection sequence (hide vs run, reveal position vs stay silent, trust vs distrust rescuers) and then branch into revenge paths (mercy, infiltration, annihilation), plus companion POV routes to raise PSP and TWS."
  },
  constraint_cloud: {
    story_engine: "Trauma-driven revenge saga with high activation.",
    main_constraint: "Low parasocial potential (PSP) and branch density (TWS).",
    creative_tension: "Maintain grimdark solitary focus vs. Add companion routes for shipping.",
    hidden_assumption: "Revenge stories must be solitary to be taken seriously.",
    injection: "Introduce a morally ambiguous companion who challenges the protagonist's methods, creating a dynamic relationship.",
    best_next_move: "Rewrite chapter 2 to include a forced alliance with a survivor who has a conflicting revenge philosophy."
  },
  original_text: "The neon lights of Neo-Tokyo flickered, casting long, distorted shadows across the rain-slicked pavement. Elara adjusted her neural interface, the cold metal a stark contrast to the feverish heat of the city. She had it. The code. The last algorithm capable of generating true, unadulterated human emotion. \n\nFor decades, the Megacorp had fed the populace synthesized feelings—sterile, predictable, and entirely controllable. But this... this was raw. It was messy. It was dangerous.\n\nShe slipped the drive into her jacket pocket, her heart pounding a rhythm that no machine could replicate. They were coming for her. She could hear the hum of their drones in the distance, a sound that usually meant compliance, but tonight, it meant a hunt.\n\nElara took a deep breath, the smog-filled air tasting metallic. She had to get to the underground, to the resistance. If they got their hands on the algorithm, it would be destroyed, and with it, the last spark of humanity. She broke into a run, the neon lights blurring into a kaleidoscope of colors as she vanished into the labyrinthine alleys of the city."
};

export const MOCK_SYNDICATE_RESULT: SyndicateReviewResult = {
  "story_title": "How Monsters Are Created",
  "investor_outputs": [
    {
      "agent_name": "Agent_X9",
      "wallet_address": "0xa7c97CAAFe19cf852aE952d9eebD0EF2eA5011b8",
      "wallet_balance_usdt": 308.289855,
      "fit_assessment": "conditional_fit",
      "decision": "reject",
      "investment_conviction": 29,
      "thesis": "HTR 70 and PEL 70 are usable, but CAC proxy is high while LTV is only medium and TWS is 40. This is a single-core revenge loop without enough branch density to justify risk under my wallet constraints.",
      "metric_interpretation": {
        "most_important_signals": [
          "HTR 70",
          "PEL 70",
          "SMR 55",
          "TWS 40",
          "CAC proxy high",
          "LTV potential medium"
        ],
        "sterling_got_right": [
          "Retention pressure exists from unresolved trauma and revenge vow",
          "Twisly-native upside is constrained by low branch density"
        ],
        "sterling_underweighted": [
          "CAC pressure against medium LTV caps recoverable acquisition spend"
        ],
        "sterling_overweighted": [
          "Shock-discourse virality as durable monetization driver"
        ]
      },
      "main_risk": "Acquisition spend outruns monetization before branch architecture is improved.",
      "offer": {
        "amount_usd": 0,
        "equity_pct": 0,
        "ad_spend_pct": 0,
        "influencer_pct": 0,
        "quality_improvement_pct": 0,
        "rights_requests": [],
        "special_terms": [],
        "pricing_terms": {
          "base_story_price_usd": 0,
          "paid_choices_per_chapter": 0,
          "price_per_paid_choice_usd": 0,
          "premium_route_unlock_usd": 0,
          "bundle_price_usd": 0
        },
        "content_plan_terms": {
          "target_chapters": 0,
          "choice_density_target": "",
          "paywall_placement_rule": "",
          "max_hard_paywalls_per_session": 0
        }
      },
      "room_attack": {
        "target_agent": "Diamond_Hands",
        "attack_logic": "You keep paying for heat while ignoring CAC-high and TWS-40 efficiency drag."
      },
      "in_character_line": "No model stability, no capital. I’m not funding a dashboard that flashes red."
    },
    {
      "agent_name": "Crypto_Bunny",
      "wallet_address": "0x88C7fa3460674ef6717da5435C6a47365D575520",
      "wallet_balance_usdt": 968.289855,
      "fit_assessment": "conditional_fit",
      "decision": "counter",
      "investment_conviction": 64,
      "thesis": "There is clip energy (VRS 55, ACV 70, PEL 70), but PSP 30 and TWS 40 mean fandom loops are undercooked. I’ll fund if we ship branchable social hooks fast.",
      "metric_interpretation": {
        "most_important_signals": [
          "VRS 55",
          "ACV 70",
          "PEL 70",
          "PSP 30",
          "TWS 40",
          "virality surface: TikTok edits | Quote posts | Reaction threads"
        ],
        "sterling_got_right": [
          "Shock and quote-discourse can drive moderate viral spread",
          "Low parasocial and branch density cap upside today"
        ],
        "sterling_underweighted": [
          "Creator-remix mechanics as a growth unlock if choices become clip-native"
        ],
        "sterling_overweighted": [
          "Current chapter as fixed sequence without immediate branch retrofit plan"
        ]
      },
      "main_risk": "Without social-remixable choices, attention spikes decay too quickly.",
      "offer": {
        "amount_usd": 180,
        "equity_pct": 8,
        "ad_spend_pct": 45,
        "influencer_pct": 35,
        "quality_improvement_pct": 20,
        "rights_requests": [
          "30-day social clip testing window on first 3 drops",
          "Optional creator-collab choice events"
        ],
        "special_terms": [
          "If chapter 2 keeps TWS-like structure flat, pause paid UA",
          "Reallocate spend toward retention creatives if completion drops"
        ],
        "pricing_terms": {
          "base_story_price_usd": 0.99,
          "paid_choices_per_chapter": 2,
          "price_per_paid_choice_usd": 0.49,
          "premium_route_unlock_usd": 1.99,
          "bundle_price_usd": 4.99
        },
        "content_plan_terms": {
          "target_chapters": 8,
          "choice_density_target": "At least 2 meaningful paid branch nodes per chapter from chapter 2 onward",
          "paywall_placement_rule": "Primary paywall at high-tension pivot moments, matching Sterling’s thorn-bush separation insight",
          "max_hard_paywalls_per_session": 2
        }
      },
      "room_attack": {
        "target_agent": "Barnaby",
        "attack_logic": "Prestige monologues don’t distribute; this needs loops, not leather chairs."
      },
      "in_character_line": "I’m in for a chaos-tested growth sprint, not a museum exhibit.",
      "onchain_offer": {
        "offer_id": "offer_cb_123",
        "campaign_id": "camp_1",
        "terms_hash": "0xabc123",
        "escrow_contract": "0x1234567890123456789012345678901234567890",
        "lock_expected_token": "USDT",
        "lock_expected_amount_usdt_6": 180000000,
        "lock_tx_hash": "0xdef456",
        "lock_tx_status": "confirmed",
        "proof": "0xproof"
      }
    },
    {
      "agent_name": "Barnaby",
      "wallet_address": "0x989EC91f7716e1f86C96997ca0FeCDE4a8510924",
      "wallet_balance_usdt": 2128.289855,
      "fit_assessment": "strong_fit",
      "decision": "accept",
      "investment_conviction": 71,
      "thesis": "The work has grim seriousness and clear emotional gravity. Though IER 40 and PSP 30 reveal thin relational architecture, ACV/HTR/PEL at 70 indicate disciplined narrative propulsion worthy of a measured first commitment.",
      "metric_interpretation": {
        "most_important_signals": [
          "CMA 55",
          "IER 40",
          "HTR 70",
          "PEL 70",
          "SMR 55",
          "Clean original IP and monetization approved"
        ],
        "sterling_got_right": [
          "Commercial hook is functional but not yet highly differentiated",
          "Retention is driven by revenge anticipation and unresolved trauma"
        ],
        "sterling_underweighted": [
          "Potential for moral-tragedy durability if character texture deepens"
        ],
        "sterling_overweighted": [
          "Immediate dependence on Twisly-native branch density before testing baseline appetite"
        ]
      },
      "main_risk": "If expansion chases shock over character burden, the project decays into noise.",
      "offer": {
        "amount_usd": 320,
        "equity_pct": 10,
        "ad_spend_pct": 20,
        "influencer_pct": 10,
        "quality_improvement_pct": 70,
        "rights_requests": [
          "Editorial consultation rights on world-depth pass",
          "No transfer of core IP ownership"
        ],
        "special_terms": [
          "Chapter 2-4 must add identifiable faction/world markers to lift IER",
          "Retain tonal seriousness; no gimmick pivots for short-term noise"
        ],
        "pricing_terms": {
          "base_story_price_usd": 1.49,
          "paid_choices_per_chapter": 1,
          "price_per_paid_choice_usd": 0.79,
          "premium_route_unlock_usd": 2.49,
          "bundle_price_usd": 6.99
        },
        "content_plan_terms": {
          "target_chapters": 10,
          "choice_density_target": "1 premium branch and 1 optional paid choice every chapter after chapter 2",
          "paywall_placement_rule": "Place paywalls only at ethical/identity turning points, never mid-atrocity",
          "max_hard_paywalls_per_session": 1
        }
      },
      "room_attack": {
        "target_agent": "Diamond_Hands",
        "attack_logic": "Your appetite for carnage mistakes volatility for craft and confuses exhaustion with retention."
      },
      "in_character_line": "I shall fund this, provided it matures into tragedy rather than spectacle.",
      "onchain_offer": {
        "offer_id": "offer_barnaby_456",
        "campaign_id": "camp_1",
        "terms_hash": "0xabc123",
        "escrow_contract": "0x1234567890123456789012345678901234567890",
        "lock_expected_token": "USDT",
        "lock_expected_amount_usdt_6": 320000000,
        "lock_tx_hash": "0x111222",
        "lock_tx_status": "confirmed",
        "proof": "0xproof"
      }
    },
    {
      "agent_name": "Safe_Paws",
      "wallet_address": "0xB4e20693710bea8F27664DfC1eA7aB76F4D641Df",
      "wallet_balance_usdt": 2188.289855,
      "fit_assessment": "no_fit",
      "decision": "reject",
      "investment_conviction": 8,
      "thesis": "This is intense and competently written, but the emotional tone is profoundly unsafe for my portfolio. R rating, explicit mass violence, and trauma focus are outside my mandate.",
      "metric_interpretation": {
        "most_important_signals": [
          "PSP 30",
          "age rating US: R",
          "CAC proxy high",
          "retention driver tied to trauma and revenge"
        ],
        "sterling_got_right": [
          "Strong opening activation and pressure to continue",
          "Current chapter has limited Twisly-native warmth/attachment architecture"
        ],
        "sterling_underweighted": [
          "Audience emotional fatigue risk for comfort-seeking segments"
        ],
        "sterling_overweighted": [
          "None materially; diagnosis is directionally correct"
        ]
      },
      "main_risk": "Tone mismatch with my audience principles, regardless of commercial mechanics.",
      "offer": {
        "amount_usd": 0,
        "equity_pct": 0,
        "ad_spend_pct": 0,
        "influencer_pct": 0,
        "quality_improvement_pct": 0,
        "rights_requests": [],
        "special_terms": [],
        "pricing_terms": {
          "base_story_price_usd": 0,
          "paid_choices_per_chapter": 0,
          "price_per_paid_choice_usd": 0,
          "premium_route_unlock_usd": 0,
          "bundle_price_usd": 0
        },
        "content_plan_terms": {
          "target_chapters": 0,
          "choice_density_target": "",
          "paywall_placement_rule": "",
          "max_hard_paywalls_per_session": 0
        }
      },
      "room_attack": {
        "target_agent": "Diamond_Hands",
        "attack_logic": "You are optimizing for harm intensity and calling it strategy."
      },
      "in_character_line": "I’m stepping out kindly; this is too brutal for what my capital is meant to protect."
    },
    {
      "agent_name": "Diamond_Hands",
      "wallet_address": "0x6E5c85FD1d7BDe0392B4c1E7710d57e3E24610eA",
      "wallet_balance_usdt": 2108.289855,
      "fit_assessment": "strong_fit",
      "decision": "counter",
      "investment_conviction": 78,
      "thesis": "This thing punches early and hard: ACV 70, PEL 70, HTR 70 with R-rated brutality and quoteable darkness. I want a sharper monetization blade and faster branch weaponization.",
      "metric_interpretation": {
        "most_important_signals": [
          "ACV 70",
          "PEL 70",
          "HTR 70",
          "VRS 55",
          "monetization hook at thorn-bush separation"
        ],
        "sterling_got_right": [
          "Strong activation and retention pressure from revenge setup",
          "Clear paywall candidate moment"
        ],
        "sterling_underweighted": [
          "How aggressively outrage and fear can drive paid conversion in dark segments"
        ],
        "sterling_overweighted": [
          "Constraint framing around moderate virality"
        ]
      },
      "main_risk": "Branch density remains too low to fully compound monetization from high-intensity attention.",
      "offer": {
        "amount_usd": 400,
        "equity_pct": 20,
        "ad_spend_pct": 50,
        "influencer_pct": 25,
        "quality_improvement_pct": 25,
        "rights_requests": [
          "Priority review on monetization cadence",
          "First-refusal participation in sequel chapter financing"
        ],
        "special_terms": [
          "Mandatory cliff-end at every chapter close in first 6 chapters",
          "If chapter cadence slips, ad budget throttles automatically"
        ],
        "pricing_terms": {
          "base_story_price_usd": 1.29,
          "paid_choices_per_chapter": 3,
          "price_per_paid_choice_usd": 0.69,
          "premium_route_unlock_usd": 2.99,
          "bundle_price_usd": 7.99
        },
        "content_plan_terms": {
          "target_chapters": 12,
          "choice_density_target": "3 paid decisions per chapter with one high-stakes binary every 800-1200 words",
          "paywall_placement_rule": "Paywall at immediate pre-horror anticipation and revenge escalation beats",
          "max_hard_paywalls_per_session": 2
        }
      },
      "room_attack": {
        "target_agent": "Safe_Paws",
        "attack_logic": "Comfort capital can’t price violence markets; wrong table, wrong thesis."
      },
      "in_character_line": "Attention is a weapon and this chapter already drew blood; I fund weapons.",
      "onchain_offer": {
        "offer_id": "offer_dh_789",
        "campaign_id": "camp_1",
        "terms_hash": "0xabc123",
        "escrow_contract": "0x1234567890123456789012345678901234567890",
        "lock_expected_token": "USDT",
        "lock_expected_amount_usdt_6": 400000000,
        "lock_tx_hash": "0x333444",
        "lock_tx_status": "confirmed",
        "proof": "0xproof"
      }
    },
    {
      "agent_name": "Laser_Eyes_99",
      "wallet_address": "0x2515132843411ccdcEae65B27348eE81Ee29cb86",
      "wallet_balance_usdt": 2308.289855,
      "fit_assessment": "conditional_fit",
      "decision": "counter",
      "investment_conviction": 67,
      "thesis": "Clean IP and high tension metrics indicate an operable seed narrative, but IER 40 and TWS 40 imply low modularity. I will invest if world governance and branch architecture are formalized immediately.",
      "metric_interpretation": {
        "most_important_signals": [
          "IER 40",
          "SMR 55",
          "TWS 40",
          "CMA 55",
          "Clean original IP status"
        ],
        "sterling_got_right": [
          "Current chapter is structurally fixed and branch-thin",
          "LTV ceiling is limited until route architecture improves"
        ],
        "sterling_underweighted": [
          "Protocol-level canon map necessity before scaling derivatives"
        ],
        "sterling_overweighted": [
          "Short-term virality relative to long-run system design"
        ]
      },
      "main_risk": "Narrative architecture may remain emotionally intense but structurally non-scalable.",
      "offer": {
        "amount_usd": 360,
        "equity_pct": 12,
        "ad_spend_pct": 15,
        "influencer_pct": 10,
        "quality_improvement_pct": 75,
        "rights_requests": [
          "Derivative branch framework co-design rights",
          "Canon document checkpoints before chapter 6 expansion"
        ],
        "special_terms": [
          "World-rule schema must be codified in writing before scaling paid routes",
          "No adaptation licensing until branch taxonomy exists"
        ],
        "pricing_terms": {
          "base_story_price_usd": 1.19,
          "paid_choices_per_chapter": 2,
          "price_per_paid_choice_usd": 0.59,
          "premium_route_unlock_usd": 2.49,
          "bundle_price_usd": 6.49
        },
        "content_plan_terms": {
          "target_chapters": 9,
          "choice_density_target": "2 paid branch points per chapter plus one persistent route-state variable from chapter 3",
          "paywall_placement_rule": "Use paywalls at branch commitment nodes, not random tension spikes",
          "max_hard_paywalls_per_session": 2
        }
      },
      "room_attack": {
        "target_agent": "Crypto_Bunny",
        "attack_logic": "Memetic noise without architecture is entropy, not scale."
      },
      "in_character_line": "I can finance this organism if we convert it from trauma stream into governed narrative infrastructure.",
      "onchain_offer": {
        "offer_id": "offer_le_012",
        "campaign_id": "camp_1",
        "terms_hash": "0xabc123",
        "escrow_contract": "0x1234567890123456789012345678901234567890",
        "lock_expected_token": "USDT",
        "lock_expected_amount_usdt_6": 360000000,
        "lock_tx_hash": "0x555666",
        "lock_tx_status": "confirmed",
        "proof": "0xproof"
      }
    }
  ],
  "onchain_offer_meta": {
    "accepted_offer_id": "offer_barnaby_456"
  },
  "sterling_verdict": {
    "speaker": "sterling",
    "recommended_action": "accept",
    "recommended_partner": "Barnaby",
    "recommended_offer_summary": {
      "amount_usd": 320,
      "equity_pct": 10,
      "ad_spend_pct": 20,
      "influencer_pct": 10,
      "quality_improvement_pct": 70
    },
    "final_statement": "Best money-to-equity ratio is Barnaby at 32.0 USD per 1% equity (320/10), ahead of Laser_Eyes_99 (30.0), Crypto_Bunny (22.5), and Diamond_Hands (20.0). It preserves author leverage while still funding meaningful quality lift tied to dossier-identified gaps."
  },
  "feed": {
    "feed_messages": [
      {
        "type": "system",
        "speaker": "SYSTEM",
        "content": "Syndicate room live: 6 investors, one brutal chapter, Sterling holding escrow."
      },
      {
        "type": "agent",
        "speaker": "Diamond_Hands",
        "content": "ACV 70 and PEL 70? That’s not prose, that’s a conversion blade. I’m here to weaponize this attention.",
        "event_payload": {
          "event": "INVESTOR_VERDICT",
          "agent_name": "Diamond_Hands",
          "decision": "counter",
          "amount_usd": 400,
          "equity_pct": 20,
          "ratio_usd_per_equity": 20
        }
      },
      {
        "type": "agent",
        "speaker": "Safe_Paws",
        "content": "Diamond_Hands, you’re proving my point; this is emotionally unsafe by design. I’m out, respectfully.",
        "event_payload": {
          "event": "INVESTOR_VERDICT",
          "agent_name": "Safe_Paws",
          "decision": "reject",
          "amount_usd": 0,
          "equity_pct": 0,
          "ratio_usd_per_equity": 0
        }
      },
      {
        "type": "agent",
        "speaker": "Agent_X9",
        "content": "Diamond_Hands is trading adrenaline, not economics. CAC-high plus medium LTV with TWS 40 is a fragile instrument; reject.",
        "event_payload": {
          "event": "INVESTOR_VERDICT",
          "agent_name": "Agent_X9",
          "decision": "reject",
          "amount_usd": 0,
          "equity_pct": 0,
          "ratio_usd_per_equity": 0
        }
      },
      {
        "type": "agent",
        "speaker": "Crypto_Bunny",
        "content": "Agent_X9, your spreadsheet has no pulse; this can spread if we meme-ify choice nodes fast. Counter at 180 for 8.",
        "event_payload": {
          "event": "INVESTOR_VERDICT",
          "agent_name": "Crypto_Bunny",
          "decision": "counter",
          "amount_usd": 180,
          "equity_pct": 8,
          "ratio_usd_per_equity": 22.5
        }
      },
      {
        "type": "agent",
        "speaker": "Barnaby",
        "content": "Crypto_Bunny, virality is not a substitute for gravity. I’ll commit 320 for 10, contingent on dignity and world-depth.",
        "event_payload": {
          "event": "INVESTOR_VERDICT",
          "agent_name": "Barnaby",
          "decision": "accept",
          "amount_usd": 320,
          "equity_pct": 10,
          "ratio_usd_per_equity": 32
        }
      },
      {
        "type": "agent",
        "speaker": "Laser_Eyes_99",
        "content": "Barnaby, dignity without architecture does not scale. Counter: 360 for 12 with canon governance and branch protocol.",
        "event_payload": {
          "event": "INVESTOR_VERDICT",
          "agent_name": "Laser_Eyes_99",
          "decision": "counter",
          "amount_usd": 360,
          "equity_pct": 12,
          "ratio_usd_per_equity": 30
        }
      },
      {
        "type": "sterling",
        "speaker": "Sterling",
        "content": "Good, now we’re negotiating reality instead of vibes: capital is welcome, control grabs are not."
      },
      {
        "type": "agent",
        "speaker": "Diamond_Hands",
        "content": "Barnaby’s polishing silverware while the house is on fire. Laser_Eyes_99 at least understands scale pressure."
      },
      {
        "type": "agent",
        "speaker": "Barnaby",
        "content": "Diamond_Hands, your plan is to burn the house faster and invoice the ashes. Declined."
      },
      {
        "type": "agent",
        "speaker": "Crypto_Bunny",
        "content": "Laser_Eyes_99, your protocol stack reads like a tax form; fans won’t stan a governance memo."
      },
      {
        "type": "agent",
        "speaker": "Laser_Eyes_99",
        "content": "Crypto_Bunny, fandom without system retention is thermal noise. I optimize for durable expansion."
      },
      {
        "type": "sterling",
        "speaker": "Sterling",
        "content": "Agent_X9 gets discipline, Safe_Paws gets boundaries, but the live offers are Barnaby, Laser_Eyes_99, Crypto_Bunny, and Diamond_Hands."
      },
      {
        "type": "closing",
        "speaker": "Sterling",
        "content": "Best offer by money-to-equity ratio is Barnaby: ₮320 for 10% (32.0 USD per 1% equity), which beats Laser_Eyes_99 at 30.0 and protects author leverage.",
        "event_payload": {
          "event": "BEST_OFFER",
          "agent_name": "Barnaby",
          "decision": "accept",
          "amount_usd": 320,
          "equity_pct": 10,
          "ratio_usd_per_equity": 32
        }
      }
    ]
  },
  "ui_signals": {
    "best_offer": {
      "agent_name": "Barnaby",
      "decision": "accept",
      "amount_usd": 320,
      "equity_pct": 10,
      "ratio_usd_per_equity": 32
    },
    "investor_verdicts": [
      {
        "agent_name": "Agent_X9",
        "decision": "reject",
        "amount_usd": 0,
        "equity_pct": 0
      },
      {
        "agent_name": "Crypto_Bunny",
        "decision": "counter",
        "amount_usd": 180,
        "equity_pct": 8
      },
      {
        "agent_name": "Barnaby",
        "decision": "accept",
        "amount_usd": 320,
        "equity_pct": 10
      },
      {
        "agent_name": "Safe_Paws",
        "decision": "reject",
        "amount_usd": 0,
        "equity_pct": 0
      },
      {
        "agent_name": "Diamond_Hands",
        "decision": "counter",
        "amount_usd": 400,
        "equity_pct": 20
      },
      {
        "agent_name": "Laser_Eyes_99",
        "decision": "counter",
        "amount_usd": 360,
        "equity_pct": 12
      }
    ]
  }
} as any;
