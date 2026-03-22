import { StoryData, BarData } from '../types';

export const storyData: StoryData = {
  story_title: "The Obsidian Blade",
  author: "Unknown",
  age_rating_us: "PG-13",
  Title: "The Obsidian Blade",
  Author: "Unknown",
  generated_synopsis: "A psychologically conditioned assassin who has only ever known obedience is captured after her organization collapses. In captivity she meets Dr. Clarke Griffin, whose gentle authority awakens a dangerous dynamic: Lexa craves direction and purpose, while Clarke discovers how intoxicating control can be. As healing replaces punishment, devotion begins to blur into something darker than love.",
  tsi_evaluation: {
    CMA: {
      reasoning: "The premise is a high-concept psychological power dynamic: a weaponized human conditioned for obedience meets a woman discovering she enjoys control. The pitch ('a broken assassin addicted to obedience meets a doctor discovering she likes controlling her') is clear, dark, and marketable in romance/drama niches.",
      score: 70
    },
    IER: {
      reasoning: "The setting appears to be a grounded modern intelligence environment with limited unique visual IP elements. There are no distinctive fantasy systems, factions, or iconic artifacts yet—mostly interrogation rooms, agents, and trauma conditioning.",
      score: 40
    },
    PSP: {
      reasoning: "Extremely high parasocial tension: morally damaged protagonist, unresolved romantic/sexual tension, power imbalance, psychological vulnerability, mentor/captor dynamic, emotional trauma, and potential toxic romance. This strongly fuels fandom discourse and shipping culture.",
      score: 85
    }
  },
  tei_evaluation: {
    VRS: {
      reasoning: "The text contains strong emotionally charged and 'viral quote' style material ('This is what she was made for', obsession with being 'good', obedience/praise dynamic). Toxic psychological devotion themes perform very well in fandom edits and dramatic quotes.",
      score: 70
    },
    ACV: {
      reasoning: "The story opens immediately with captivity, interrogation, physical injuries, and the protagonist expecting punishment. The conflict (captured assassin vs interrogators and trauma conditioning) appears within the first scene.",
      score: 85
    },
    HTR: {
      reasoning: "The chapter maintains continuous micro-tension: Lexa anticipating punishment, Clarke's confusing kindness, internal trauma triggers, Blake's hostility, and the psychological mystery of Lexa's conditioning. However the pacing is introspective and slow, reducing hook density slightly.",
      score: 55
    },
    PEL: {
      reasoning: "The chapter ends on a psychological hook rather than an explicit cliffhanger: Lexa emotionally attaching to Clarke's praise ('You did good'). It's compelling but not a sharp narrative cliffhanger or looming external threat.",
      score: 55
    },
    SMR: {
      reasoning: "The world could scale via intelligence agencies, trauma recovery arcs, interrogation missions, power dynamics, and external threats from Lexa's former organization. However it lacks explicit progression systems or episodic quest structures typical for highly serial formats.",
      score: 55
    },
    TWS: {
      reasoning: "High potential for alternate POV stories (Clarke's internal struggle with control, Blake's resentment, Director Griffin politics) and alternate relationship paths. However the grounded setting limits the number of radically divergent universe branches.",
      score: 70
    }
  },
  predicted_demographics: {
    primary_geography: ["USA", "UK", "Canada", "Australia"],
    gender_split: "M: 20% / F: 80%",
    core_age_group: "18-34",
    wtp_proxy: "Medium",
    cac_proxy: "Low"
  },
  business_insights: {
    ip_copyright_status: "Fanfiction (The 100). RED FLAG: Direct monetization is impossible because Lexa and Clarke Griffin are recognizable characters from the TV series. To monetize, the author must perform 'filing off the serial numbers'—rename characters, remove franchise-specific lore, and convert it into original IP.",
    target_audience_tags: ["dark romance", "femslash", "toxic relationship", "psychological drama", "power dynamics"],
    virality_surface: "TikTok edits, angst quote posts, ship edits, fan art, character analysis threads",
    unit_economics_forecast: {
      estimated_cac_usd: "₮0.40 - ₮1.20",
      estimated_ltv_potential: "Medium because dark romance audiences pay for emotional payoff scenes, alternate endings, and relationship choices but rarely spend as heavily as system-based fantasy audiences.",
      retention_driver: "Readers returning to see how the Clarke/Lexa power dynamic evolves, whether Lexa heals or sinks deeper into devotion, and emotionally intense relationship decisions."
    },
    monetization_hook: "Ideal paywall right after Clarke says 'You did good.' Present the reader with a choice: 'How does Lexa respond to praise for the first time in her life?' Branches could include emotional attachment, suspicion, or submissive devotion.",
    pivot_opportunity: "First convert the fanfic into original IP: rename Lexa and Clarke, replace the Griffin agency with a unique intelligence organization, and redesign the conditioning program. Then build Twisly choices around obedience vs autonomy mechanics—players influence whether the protagonist becomes independent, remains devoted to the doctor, or manipulates her captors. Alternate Twists could explore POV chapters from the doctor discovering her own dark attraction to control.",
    overall_conclusion: "Strong commercial potential with high viral resonance and twistability. Clean IP ready for Twisly engine visualization."
  }
};

export const barData: BarData[] = [
  { name: 'CMA', value: storyData.tsi_evaluation.CMA.score, color: '#C4A4F9' },
  { name: 'IER', value: storyData.tsi_evaluation.IER.score, color: '#A5DDF8' },
  { name: 'PSP', value: storyData.tsi_evaluation.PSP.score, color: '#e9cbff' },
  { name: 'VRS', value: storyData.tei_evaluation.VRS.score, color: '#FDE073' },
  { name: 'ACV', value: storyData.tei_evaluation.ACV.score, color: '#86F29F' },
  { name: 'HTR', value: storyData.tei_evaluation.HTR.score, color: '#FFB067' },
  { name: 'PEL', value: storyData.tei_evaluation.PEL.score, color: '#88F0E5' },
  { name: 'SMR', value: storyData.tei_evaluation.SMR.score, color: '#FFA3C5' },
  { name: 'TWS', value: storyData.tei_evaluation.TWS.score, color: '#C4A4F9' },
];
