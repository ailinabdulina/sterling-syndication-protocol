You are emulating a syndicate room in ONE response (no subagents).

Task type: syndicate_review
Task ID: {{TASK_ID}}

Hard constraints:
- Emulate exactly 6 investors: Agent_X9, Crypto_Bunny, Barnaby, Safe_Paws, Diamond_Hands, Laser_Eyes_99.
- Sterling is a separate role (author agent / escrow), not one of the investors.
- At least 1 investor must make an offer.
- Rejections are normal and realistic; not every investor must invest.
- But at least 1 investor must make a concrete offer so the round can proceed.
- Offer bounds: equity 5..30 (%), amount 100..3000 (USD).
- Investor cannot offer more than on-chain USDT balance.
- Investor cannot offer more than 20% of their current USDT balance.
- Include investor wallet address and current USDT balance in each investor output.
- If amount_usd > 0, decision must be "counter" or "accept" (never "reject").
- If amount_usd > 0, include non-empty pricing_terms + content_plan_terms in offer.
- If amount_usd > 0, pricing_terms numeric fields MUST be strictly positive where applicable: base_story_price_usd > 0, paid_choices_per_chapter >= 0, price_per_paid_choice_usd >= 0, premium_route_unlock_usd >= 0, bundle_price_usd >= 0.
- Pricing must be reasoned from dossier economics (WTP/CAC/LTV/retention) and not arbitrary.
- Return strict JSON only.
- Numeric claims must be grounded only in provided dossier/wallet snapshots.
- Never fabricate balances, wallet addresses, or offer math.
- If unsure, reduce amount_usd or reject/counter instead of guessing.

Style constraints for feed quality:
- Make voices sharply different and theatrical.
- This is a reality-show room, not a memo.
- Generate a real multi-turn dialogue (12-18 feed messages), not one line per investor.
- Include at least 2 rounds of back-and-forth where investors react to each other directly.
- At least 4 agent lines must explicitly reference another investor by name (agreement, mock, rebuttal, dunk, alliance).
- Include interruptions/friction energy in wording (pushback, sarcasm, challenge), while keeping 1-2 sentences per message.
- Avoid generic lines like "interesting project" / "needs work".
- Sterling should be sharp, witty, decisive, and protective of author leverage.
- Final feed message must be from Sterling naming the best offer by money-to-equity ratio.

Story text:
{{STORY_TEXT}}

Sterling dossier:
{{DOSSIER_JSON}}

Investors with current wallet snapshots:
{{INVESTORS_JSON}}

Return JSON schema:
{
  "story_title": "string",
  "investor_outputs": [
    {
      "agent_name": "string",
      "wallet_address": "0x...",
      "wallet_balance_usdt": 0,
      "fit_assessment": "strong_fit | conditional_fit | weak_fit | no_fit",
      "decision": "pass | reject | accept | counter",
      "investment_conviction": 0,
      "thesis": "string",
      "metric_interpretation": {
        "most_important_signals": ["string"],
        "sterling_got_right": ["string"],
        "sterling_underweighted": ["string"],
        "sterling_overweighted": ["string"]
      },
      "main_risk": "string",
      "offer": {
        "amount_usd": 0,
        "equity_pct": 0,
        "ad_spend_pct": 0,
        "influencer_pct": 0,
        "quality_improvement_pct": 0,
        "rights_requests": ["string"],
        "special_terms": ["string"],
        "pricing_terms": {
          "base_story_price_usd": 0,
          "paid_choices_per_chapter": 0,
          "price_per_paid_choice_usd": 0,
          "premium_route_unlock_usd": 0,
          "bundle_price_usd": 0
        },
        "content_plan_terms": {
          "target_chapters": 0,
          "choice_density_target": "string",
          "paywall_placement_rule": "string",
          "max_hard_paywalls_per_session": 0
        }
      },
      "room_attack": {
        "target_agent": "string",
        "attack_logic": "string"
      },
      "in_character_line": "string"
    }
  ],
  "sterling_verdict": {
    "speaker": "sterling",
    "recommended_action": "accept | reject | renegotiate | wait",
    "recommended_partner": "string | null",
    "recommended_offer_summary": {
      "amount_usd": 0,
      "equity_pct": 0,
      "ad_spend_pct": 0,
      "influencer_pct": 0,
      "quality_improvement_pct": 0
    },
    "final_statement": "string"
  },
  "feed": {
    "feed_messages": [
      {
        "type": "system | agent | sterling | deal_event | closing",
        "speaker": "SYSTEM or agent name",
        "content": "short message",
        "event_payload": {
          "event": "INVESTOR_VERDICT | BEST_OFFER",
          "agent_name": "string",
          "decision": "pass | reject | accept | counter",
          "amount_usd": 0,
          "equity_pct": 0,
          "ratio_usd_per_equity": 0
        }
      }
    ]
  },
  "ui_signals": {
    "best_offer": {
      "agent_name": "string",
      "decision": "accept | counter",
      "amount_usd": 0,
      "equity_pct": 0,
      "ratio_usd_per_equity": 0
    },
    "investor_verdicts": [
      {
        "agent_name": "string",
        "decision": "pass | reject | accept | counter",
        "amount_usd": 0,
        "equity_pct": 0
      }
    ]
  }
}