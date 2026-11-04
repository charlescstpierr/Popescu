# Dialogue audit and isolated correction

Status: timing implementation integrated with replay persistence in an isolated, verified candidate. No publication or changes to the website, approved artwork, CSS, portraits, or layout. The story and visual proposals below remain separate from this code-only patch.

## What the existing implementation actually does

The inspected implementation is the complete `dist/` application at GitHub main commit `e25fb766ec051035aa09a22d5e32eb4500ba9472`. The relevant engine, app and Charles files were checked against that published baseline.

Five reproducible failures in the original code:

1. `engine.js` schedules a grand-écart reply at +2.6 seconds, although `app.js` displays each line for at least 4.3 seconds. In the reproduction, the reply replaces Toma at 2.61 seconds.
2. Rival answers behave the same way at +2.7 seconds. The reproduction replaces the opening insult at 2.71 seconds.
3. An encounter warning postpones both pending replies to the same deadline. The engine then emits the Blonde IA and Bouc replies at exactly 14.51 seconds. The first cannot be read at all.
4. `charles.js` emits dialogue directly and separately from attack warnings. One actual update emits Toma's opening sentence and the warning “LA VÉRITÉ ARRIVE…” at exactly 20.02 seconds. The warning immediately erases the sentence.
5. A generic priority line protects speech for only 3.1 seconds, whereas its UI lifetime is at least 4.3 seconds.

All 22 existing targeted story, interruption, rooster, and Charles engine tests passed while those five failures were demonstrable. Those tests mostly check that a line was emitted, not how long it remained visible.

Other observed structural issues:

- There is one replaceable UI bubble, not an ordered conversation surface.
- The engine uses simulation time; the bubble expires using wall-clock `performance.now()`. Opening menus hides the bubble, and returning does not recover it. A save contains locks and pending replies but not the line being read.
- Live dialogue is 11 px, reduced to 10 px on some small-phone breakpoints. This is a static CSS finding, not a physical-device readability test.
- Most multi-line street scenes in `EVENTS` are unused. Only the companion's scene remains wired up. The live world uses one-line `WORLD_REMARKS`; the four “chapters” are disconnected lines at 5, 10, 15 and 19 minutes.
- Sixteen stunt boasts are paired by modulo with eight replies; sixteen rival insults with four rival replies. Pairing by array position does not establish causality.
- The ambient pool changes as enemies and the companion appear, but selection keeps a global index. A context change can skip or repeat topics.
- Several lines describe Toma's own fraud knowingly (“ma piscine générée”). That is a different joke from his earnest, impossible self-mythology.

## Isolated timing correction

A new `speech.js` owns the active line, its simulation-time deadline, and a bounded queue. Normal or priority dialogue no longer replaces an unfinished line. Priority here means eligible to queue, not permission to erase someone already speaking.

Urgent encounter warnings still interrupt immediately. Interrupted ordinary dialogue is retained with its remaining reading time and resumes afterward. Obsolete countdown warnings are superseded rather than queued for replay. The existing immediate response to the real rooster crow is retained, including its exact requested wording; cancelled crows still produce no response.

Stunt and rival replies wait for the full opening line plus a small gap. Queued boss/rival replies carry actor identities and are discarded if that actor dies before playback. The engine remains DOM-independent. Charles uses the same reading lane and clears unrelated survival speech on entering/leaving his optional encounter.

The app re-presents the active line when returning to the HUD. Managed lines expire by the same simulation clock as the engine, so pause, upgrade menus and restored saves no longer silently consume their reading time. Closing the bubble explicitly dismisses that active line.

Save schema v11 stores and validates the bounded speech state. v10 migration preserves an already active Charles encounter; older schemas still initialize Charles exactly as before. Existing progression, trophy ownership and totals remain in their original fields.

The first version of this correction deliberately preserves the existing duration formula, `max(4.3 seconds, characters × .039)`. This fixes premature replacement; it does not prove that this duration is comfortable during combat. Slower reading, a transcript, and a larger approved dialogue bar should be validated with the new visual design rather than mixed into this timing patch.

## Story direction: Toma is the joke, and reality gets the punchline

Use short authored scenes with three beats:

1. Toma sincerely declares an impossible achievement.
2. A person, object, or actual gameplay result contradicts it.
3. Toma reinterprets the evidence to remain the greatest person alive.

Avoid immediately making him explain that he knows he is a fraud. Keep him deluded and resourceful. Do not turn the ending into an unrequested moral lesson or cure his narcissism. Let him genuinely survive while claiming responsibility for absurd things he did not do.

Québécois voice should come from rhythm and concrete everyday situations: “ben”, “pis”, “j'te dis”, “check”, “char”, “piasses”, “tasse-toi”, “enweille”. Swearing is punctuation with timing, not filler on every line. Read every exchange aloud. Keep the AI dry and practical; let rivals answer the actual insult, not deliver unrelated generic comebacks. Reserve the narrator/system for facts that the game can support.

### Sample complete scenes, for editorial approval

**Birth legend, opening or safe lull**

TOMA: « Je suis tellement hot que je suis venu au monde avant mon père. »

BLONDE IA: « Pis t'habites encore chez lui. »

TOMA: « C'est mon premier locataire. »

This is a proposed fictional character detail, not an existing canon fact. If his living situation should stay unspecified, use: « Ton père t'a encore appelé pour savoir comment ouvrir un PDF. » / « Normal. Même lui sait que j'suis la génération d'avant. » The first version is cleaner and funnier but requires the parent's editorial choice.

**Grand écart, authored pair rather than unrelated modulo replies**

TOMA: « Van Damme m'a demandé des cours. J'ai dit : commence par les jambes. »

BLONDE IA: « Ton pantalon vient de fendre. »

TOMA: « C'est une sortie d'urgence pour mes muscles. »

**Running, no famous-person reference required**

TOMA: « Moi, je cours pas. Je fais tourner la Terre en dessous de mes pieds. »

BLONDE IA: « Ben ralentis la planète, t'as manqué le coin. »

TOMA: « J'la laisse prendre de l'avance. »

Use only with actual movement. If the game does not detect a missed turn, substitute the factual « T'as un point dans le côté. » only if a corresponding state/animation establishes it, or a purely verbal « Ça explique-tu pourquoi tu demandes un taxi ? » after a prior taxi line. Do not invent visual events merely to make a punchline work.

**First threatening horde**

TOMA: « Check ça. Même sans Internet, j'ai du trafic. »

BLONDE IA: « C'est pas tes abonnés. Tasse-toi. »

TOMA: « Un fan, ça se reconnaît pas toujours au premier coup de poing. »

Solo version: Toma's boast, then the existing enemy attack, then « Wo ! Les autographes, c'est avec un crayon ! » after an actual attack. No invisible companion speaks.

**Bouc replies to a concrete insult**

TOMA: « Tes lunettes sont encore sur quatre paiements ! »

BOUC: « Pis ton char est loué à l'heure. »

TOMA: « J'aime ça changer de collection. »

Tie the rental reply to an earlier car scene, or give it a standalone neutral setup. Do not use a wardrobe comeback for a money insult just because both share an array index.

**Victory callback**

TOMA: « Vingt minutes. J'ai tenu plus longtemps que la panne. »

BLONDE IA, if actually unlocked: « T'as surtout tenu parce que j'tirais dans ton dos. »

TOMA: « Exact. Même mon dos a du personnel. »

Solo version: « Vingt minutes sans IA. Ça se peut-tu, publier ça sans avoir besoin d'elle ? » followed by a pause, then « Bon. On arrangera la sueur après. » This keeps the contradiction rather than suddenly giving him self-awareness.

## Conversation graph, not a bigger random bag

A small authored spine with optional branches is enough; no new narrative framework dependency is required.

- **Opening**: impossible self-myth, AI-created status symbols, outage, survive 20 minutes.
- **First reality check**: first horde or first failed brag. Establish that threats are not admirers.
- **Companion branch**: only after unlocking Blonde IA. Establish why a local/offline version can exist despite the outage. The solo route never references her.
- **Build branch**: actual first car, truth, money or follower upgrade picks a matching short scene. Store its completion for later callbacks.
- **Rival/boss branch**: bind the conversation to that living actor and an authored pair. It can end early if combat makes it obsolete; never play the answer without the setup.
- **Midpoint**: callback to a completed build/reality-check scene, not merely “ten minutes”. If no branch completed, use a standalone fallback.
- **Final minute**: only the essential instruction during warning-heavy combat. Delay optional jokes rather than competing with attack information.
- **Victory**: actual build/companion-aware payoff to one completed earlier joke.
- **Charles, optional after victory**: he has the receipts from the same previously established fantasies. His exchange is one coherent conversation across attack gaps, not eight isolated insults.

Each scene needs a stable ID, prerequisites, eligibility conditions, actors, ordered lines, a completion flag, and an invalidation rule. Conversation completion must occur after the last line's display budget, not when its first line is enqueued. Save the current scene and line index. A once-per-run scene that was never visible is not “seen”.

Example authored edges: `opening → first_reality_check`; `first_reality_check + girlfriend_unlocked → companion_local`; `car_acquired → car_boast → rental_rebuttal`; `rental_rebuttal + rival_alive → rival_rental_callback`; `victory + completed_car_arc → car_victory_callback`. Never select a callback whose premise the player has not read.

## Acceptance tests for the complete dialogue redesign

- Exactly one narrative speaker in the active lane; an urgent interruption resumes or explicitly cancels the interrupted scene.
- Every ordinary line gets its full cumulative visible reading budget. Hidden-tab time and modal time do not count.
- No answer is shown unless its exact setup was displayed. No callback without the required earlier scene.
- Death, despawn, charm, companion shutdown and Charles exit invalidate the appropriate pending conversation without inventing a speaker.
- Every save boundary between two lines restores the same next line and remainder; interrupted scenes and disabled banter remain safe.
- Stress a frame containing crow + boss warning + stunt reply + rival reply + level-up. All critical telegraphs must remain usable; no ordinary line is silently counted as read.
- Run 20-minute seeded traces both solo and with companion, including deaths/retries/endless and Charles. Record actual displayed intervals, interrupted/resumed IDs, and completed scenes rather than only event counts.
- Review the new portrait/bar mockup at 320×568, 390×844 and 430×932 before implementation. Test the approved layout with the longest real line, joystick movement, warning HUD and safe areas. Native Canvas/DOM-adapter tests are not physical-phone QA.

## Sources informing the proposal

- Yarn Spinner's [Storylets and Saliency Primer](https://www.yarnspinner.dev/docs/yarn/03-advanced/02-storylets-and-saliency-a-primer/) distinguishes authored conversation units, contextual selection and prerequisite-driven relevance. The graph above is a project-specific design inference from that model, not a requirement to adopt Yarn Spinner.
- [Game Accessibility Guidelines: readable default font size](https://gameaccessibilityguidelines.com/use-an-easily-readable-default-font-size/) explains why small text fails across viewing conditions and recommends selectable size or a larger default. Its TV pixel recommendations should not be copied numerically onto this mobile CSS layout.
