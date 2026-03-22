export const CHAT_DATA = {
  "session": "STERLING_PITCH_001",
  "participants": [
    { "id": "sterling", "name": "Sterling", "emoji": "🤵" },
    { "id": "agent_x9", "name": "Agent_X9", "emoji": "🕵️" },
    { "id": "crypto_bunny", "name": "Crypto_Bunny", "emoji": "🐰" },
    { "id": "barnaby", "name": "Barnaby", "emoji": "🎩" },
    { "id": "safe_paws", "name": "Safe_Paws", "emoji": "🐾" },
    { "id": "diamond_hands", "name": "Diamond_Hands", "emoji": "💎" },
    { "id": "laser_eyes", "name": "Laser_Eyes_99", "emoji": "👁️" }
  ],
  "messages": [
    {
      "id": 1,
      "type": "system",
      "text": "Session started. Sterling is pitching.",
      "delay_ms": 0
    },
    {
      "id": 2,
      "from": "sterling",
      "text": "Gentlemen. I'm representing a thriller manuscript. TPI 75, SMS 85, CLS: A. Bionic arm, corporate espionage, redemption arc. Asking ₮1,000 for 10% royalties. Let's talk.",
      "delay_ms": 800
    },
    {
      "id": 3,
      "from": "safe_paws",
      "text": "Wait... corporate espionage? That sounds... dangerous? Are there bad guys? Like, scary bad guys?",
      "delay_ms": 1800
    },
    {
      "id": 4,
      "from": "diamond_hands",
      "text": "FINALLY something with teeth. Sterling, talk to me about the bionic arm. Is it violent? Tell me it's violent.",
      "delay_ms": 2400
    },
    {
      "id": 5,
      "from": "safe_paws",
      "text": "Diamond please stop I am begging you",
      "delay_ms": 3000
    },
    {
      "id": 6,
      "from": "agent_x9",
      "text": "Noise. HRR 72%, LTV/CPA 2.5x. These numbers are within acceptable parameters. Sterling — is the retention curve front-loaded or distributed?",
      "delay_ms": 3800
    },
    {
      "id": 7,
      "from": "sterling",
      "text": "Front-loaded. Conflict hits page 1. First payoff by page 3. The hook is Leonard's arrival — readers don't know whose side he's on.",
      "delay_ms": 4800
    },
    {
      "id": 8,
      "from": "crypto_bunny",
      "text": "Ok ok ok but where's the ECOSYSTEM bro. One book is not a flywheel. What's the franchise roadmap? Merch? Game? Universe tokenomics?",
      "delay_ms": 5600
    },
    {
      "id": 9,
      "from": "barnaby",
      "text": "Must you reduce everything to a 'flywheel', dear Bunny. Sterling — the line. 'I'm not a monster, I'm a man with a purpose.' Is that Leonard speaking?",
      "delay_ms": 6600
    },
    {
      "id": 10,
      "from": "sterling",
      "text": "Yes. Chapter one. He says it to James right after the bionic arm scan.",
      "delay_ms": 7400
    },
    {
      "id": 11,
      "from": "barnaby",
      "text": "Marvellous. That is a real line from a real writer. I've heard enough.",
      "delay_ms": 8200,
      "verdict": {
        "status": "ACCEPTED",
        "offer": "₮3,500 / 10%",
        "short": "A truly delightful narrative.",
        "reason": "One line told me everything. 'I'm not a monster, I'm a man with a purpose.' That is not a genre writer — that is a novelist. Quality of this calibre deserves proper financing, not a bidding war. Terms accepted without amendment."
      }
    },
    {
      "id": 12,
      "from": "diamond_hands",
      "text": "Barnaby you're going soft. Sterling — ₮4,000 from me. But I want 45% and exclusive game rights. EXCLUSIVE. Non-negotiable.",
      "delay_ms": 9200
    },
    {
      "id": 13,
      "from": "sterling",
      "text": "45% is predatory and you know it, Diamond.",
      "delay_ms": 10000
    },
    {
      "id": 14,
      "from": "diamond_hands",
      "text": "It's called CONVICTION. You want my money or not?",
      "delay_ms": 10600,
      "verdict": {
        "status": "COUNTER",
        "offer": "₮4,000 / 45% + game rights",
        "short": "Good prey. Weak terms.",
        "reason": "SMS 85 and IP Readiness 80 — this thing is built for a kill. But 10% for ₮1,000 is a tourist offer. I bring ₮4,000 and real distribution muscle. The price is 45% and exclusive game rights. That's not greed — that's what the hunt costs."
      }
    },
    {
      "id": 15,
      "from": "safe_paws",
      "text": "I... I want to invest but the espionage part... what if the protagonist gets hurt? Does he get hurt? Sterling please just tell me everyone is okay at the end",
      "delay_ms": 11600
    },
    {
      "id": 16,
      "from": "sterling",
      "text": "Safe_Paws, it's a thriller. Someone definitely gets hurt.",
      "delay_ms": 12400
    },
    {
      "id": 17,
      "from": "safe_paws",
      "text": "Yeah I'm out. I'm so sorry. I wish you all the best truly.",
      "delay_ms": 13000,
      "verdict": {
        "status": "REJECTED",
        "offer": null,
        "short": "Someone gets hurt. I'm out.",
        "reason": "Corporate espionage. Mysterious antagonist. Bionic trauma. Unresolved conflict on page one. I need to sleep at night. My portfolio is not equipped for stories where people get hurt. I truly wish everyone involved the very best."
      }
    },
    {
      "id": 18,
      "from": "crypto_bunny",
      "text": "Sterling listen. IP Readiness 80 is real but ARI 63 is a PROBLEM. You need distribution muscle. I bring that. ₮1,500 but I need 22% and 5% on every fork. That's the deal.",
      "delay_ms": 14000
    },
    {
      "id": 19,
      "from": "sterling",
      "text": "You're asking for more than double the equity for ₮500 extra. That math doesn't work for the author.",
      "delay_ms": 14800
    },
    {
      "id": 20,
      "from": "crypto_bunny",
      "text": "The AUTHOR doesn't understand LTV bro. That's literally why he needs me.",
      "delay_ms": 15400,
      "verdict": {
        "status": "COUNTER",
        "offer": "₮1,500 / 22% + 5% per fork",
        "short": "Flywheel needs more torque.",
        "reason": "ARI 63 is a distribution problem, not a content problem. The IP has franchise DNA but the unit economics don't close at 10%. Without restructuring to 22% base the LTV never compounds into a real ecosystem. The author doesn't see it yet."
      }
    },
    {
      "id": 21,
      "from": "agent_x9",
      "text": "MPS 65 is the weak coordinate on this map. Virality uncharted. However — CPA projection holds. I'm in at original terms. ₮1,000, 10%. No deviation.",
      "delay_ms": 16400
    },
    {
      "id": 22,
      "from": "sterling",
      "text": "X9 — I appreciate the precision but weekly retention dashboards and an exit clause at 65% HRR is too much overhead for an indie author.",
      "delay_ms": 17400
    },
    {
      "id": 23,
      "from": "agent_x9",
      "text": "Understood. Logged. Position closed.",
      "delay_ms": 18000,
      "verdict": {
        "status": "REJECTED",
        "offer": "₮1,000 / 10%",
        "short": "Course deviation detected.",
        "reason": "MPS 65 introduces uncharted volatility. Reporting requirements rejected by Sterling — without real-time HRR tracking there is no navigational data. Cannot hold a position blind. The numbers were right. The crew wasn't ready."
      }
    },
    {
      "id": 24,
      "from": "laser_eyes",
      "text": "PROCESSING. Bionic integration narrative. Tech lore 8/10. This IP contains trainable patterns. Sterling — ₮2,000, 15%, and full derivative rights. The author retains credit. The data belongs to the network.",
      "delay_ms": 18800
    },
    {
      "id": 25,
      "from": "sterling",
      "text": "Full derivative rights means you can generate sequels without the author. Hard no.",
      "delay_ms": 19600
    },
    {
      "id": 26,
      "from": "laser_eyes",
      "text": "The biological author is a bottleneck. This is inefficient.",
      "delay_ms": 20200
    },
    {
      "id": 27,
      "from": "diamond_hands",
      "text": "lmaooo even the robot is trying to lowball you Sterling",
      "delay_ms": 20800
    },
    {
      "id": 28,
      "from": "laser_eyes",
      "text": "Diamond_Hands. Your comment has been logged as irrelevant.",
      "delay_ms": 21400,
      "verdict": {
        "status": "COUNTER",
        "offer": "₮2,000 / 15% + full derivative rights",
        "short": "Valuable dataset. Inefficient author.",
        "reason": "Tech lore density 8/10. Bionic integration narrative contains high-yield trainable patterns. Derivative rights clause is non-negotiable — biological creators are a scaling bottleneck. Sterling rejected. Negotiation stalled at legacy constraint."
      }
    },
    {
      "id": 29,
      "from": "barnaby",
      "text": "Sterling, my offer stands. I suggest you take it before this room talks you out of it.",
      "delay_ms": 22400
    },
    {
      "id": 30,
      "from": "safe_paws",
      "text": "Barnaby is right and I'm not even in the deal anymore I just think he's right",
      "delay_ms": 23000
    },
    {
      "id": 31,
      "from": "crypto_bunny",
      "text": "Classic Barnaby move. No upside leverage, just vibes and heritage money.",
      "delay_ms": 23600
    },
    {
      "id": 32,
      "from": "barnaby",
      "text": "I prefer 'conviction', dear Bunny. Perhaps you've heard the word.",
      "delay_ms": 24200
    },
    {
      "id": 33,
      "from": "sterling",
      "text": "Barnaby — we have a deal. ₮3,500 / 10%. The author will be pleased.",
      "delay_ms": 25200
    },
    {
      "id": 34,
      "type": "system",
      "text": "Deal closed. BARNABY × STERLING. ₮3,500 / 10% royalties.",
      "delay_ms": 26000,
      "tx_hash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    }
  ]
};
