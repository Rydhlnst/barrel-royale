import { Composition } from "remotion";
import { FPS } from "./brand";
import { WebLive, WEB_LIVE_SECONDS } from "./WebLive";
import { LaunchingSoon, LAUNCHING_SOON_SECONDS } from "./LaunchingSoon";
import { CaLive, CA_LIVE_SECONDS, caLiveDefaults } from "./CaLive";
import { TokenBurn, TOKEN_BURN_SECONDS } from "./TokenBurn";
import { HowToPlay, HOW_TO_PLAY_SECONDS } from "./HowToPlay";
import { Teaser } from "./Teaser";
import { PaidDex, PAID_DEX_SECONDS } from "./PaidDex";
import { PaidDexLive, PAID_DEX_LIVE_SECONDS } from "./PaidDexLive";
import { RoadmapMap, RoadmapUpdate, ROADMAP_UPDATE_SECONDS } from "./social/Roadmap";
import { Announce, ANNOUNCEMENTS } from "./social/Announce";
import { CalloutVideo, CALLOUTS, CALLOUT_SECONDS } from "./social/Callout";
import { FeatureUpdate, FEATURES, FEATURE_SECONDS } from "./social/Feature";
import { CLIPS, FeatureClip } from "./social/Clip";
import { MobileHowToPlay, MOBILE_HOW_SECONDS } from "./social/MobileHow";
import { RoadmapShip, ROADMAP_SHIP_SECONDS } from "./social/RoadmapShip";
import { ForemanNight, FOREMAN_NIGHT_SECONDS } from "./social/ForemanNight";
import { StoryRecap, STORY_RECAP_SECONDS } from "./social/StoryRecap";
import { TankerDay, TANKER_DAY_SECONDS } from "./social/TankerDay";
import { GusherQuake, GUSHER_QUAKE_SECONDS } from "./social/GusherQuake";
import { MedalCabinet, MEDAL_CABINET_SECONDS } from "./social/MedalCabinet";
import { DoublePay, DOUBLE_PAY_SECONDS } from "./social/DoublePay";
import { OilBonus, OIL_BONUS_SECONDS } from "./social/OilBonus";
import { Fresh01, FRESH01_SECONDS } from "./fresh/Fresh01";
import { Fresh02, FRESH02_SECONDS } from "./fresh/Fresh02";
import { Fresh03, FRESH03_SECONDS } from "./fresh/Fresh03";
import { Fresh04, FRESH04_SECONDS } from "./fresh/Fresh04";
import { Fresh05, FRESH05_SECONDS } from "./fresh/Fresh05";
import { Next01, NEXT01_SECONDS } from "./next/Next01";
import { Next02, NEXT02_SECONDS } from "./next/Next02";
import { Next03, NEXT03_SECONDS } from "./next/Next03";
import { Next04, NEXT04_SECONDS } from "./next/Next04";
import { Next05, NEXT05_SECONDS } from "./next/Next05";
import { Next06, NEXT06_SECONDS } from "./next/Next06";
import { Next07, NEXT07_SECONDS } from "./next/Next07";
import { Next08, NEXT08_SECONDS } from "./next/Next08";
import { Next09, NEXT09_SECONDS } from "./next/Next09";
import { Next10, NEXT10_SECONDS } from "./next/Next10";
import { How01, HOW01_SECONDS } from "./how/How01";
import { How02, HOW02_SECONDS } from "./how/How02";
import { How03, HOW03_SECONDS } from "./how/How03";
import { How04, HOW04_SECONDS } from "./how/How04";
import { How05, HOW05_SECONDS } from "./how/How05";
import { How06, HOW06_SECONDS } from "./how/How06";
import { How07, HOW07_SECONDS } from "./how/How07";
import { How08, HOW08_SECONDS } from "./how/How08";
import { How09, HOW09_SECONDS } from "./how/How09";
import { How10, HOW10_SECONDS } from "./how/How10";
import { DevBurn, DEV_BURN_SECONDS } from "./DevBurn";
import { Overdrive, OVERDRIVE_SECONDS } from "./Overdrive";
import { CrudeToXom, CRUDE_TO_XOM_SECONDS } from "./CrudeToXom";
import { RigClasses } from "./RigClasses";
import { VaultUp, VAULT_UP_SECONDS, vaultUpDefaults } from "./VaultUp";
import { RigOpen, RIG_OPEN_SECONDS } from "./RigOpen";
import { Ep1HowToPlay, EP1_SECONDS } from "./ep/Ep1HowToPlay";
import { Ep2Pressure, EP2_SECONDS } from "./ep/Ep2Pressure";
import { Ep3Storm, EP3_SECONDS } from "./ep/Ep3Storm";
import { Ep4Refinery, EP4_SECONDS } from "./ep/Ep4Refinery";
import { Ep5Dispatch, EP5_SECONDS } from "./ep/Ep5Dispatch";
import { Ep6Export, EP6_SECONDS } from "./ep/Ep6Export";

// Five launch videos for X, 1920 × 1080 at 60 fps. CaLive takes the $ROYAL
// contract address as a prop: render it with --props='{"ca":"0x..."}'.
export const RemotionRoot = () => (
  <>
    <Composition id="WebLive" component={WebLive} durationInFrames={WEB_LIVE_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="LaunchingSoon" component={LaunchingSoon} durationInFrames={LAUNCHING_SOON_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="CaLive" component={CaLive} durationInFrames={CA_LIVE_SECONDS * FPS} fps={FPS} width={1920} height={1080} defaultProps={caLiveDefaults} />
    <Composition id="TokenBurn" component={TokenBurn} durationInFrames={TOKEN_BURN_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="HowToPlay" component={HowToPlay} durationInFrames={HOW_TO_PLAY_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="DevBurn" component={DevBurn} durationInFrames={DEV_BURN_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="Overdrive" component={Overdrive} durationInFrames={OVERDRIVE_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="CrudeToXom" component={CrudeToXom} durationInFrames={CRUDE_TO_XOM_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="RigClasses" component={RigClasses} durationInFrames={60} fps={FPS} width={1920} height={1080} />
    <Composition id="VaultUp" component={VaultUp} durationInFrames={VAULT_UP_SECONDS * FPS} fps={FPS} width={1920} height={1080} defaultProps={vaultUpDefaults} />
    <Composition id="RigOpen" component={RigOpen} durationInFrames={RIG_OPEN_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="Ep1HowToPlay" component={Ep1HowToPlay} durationInFrames={EP1_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="Ep2Pressure" component={Ep2Pressure} durationInFrames={EP2_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="Ep3Storm" component={Ep3Storm} durationInFrames={EP3_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="Ep4Refinery" component={Ep4Refinery} durationInFrames={EP4_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="Ep5Dispatch" component={Ep5Dispatch} durationInFrames={EP5_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="Ep6Export" component={Ep6Export} durationInFrames={EP6_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="Teaser" component={Teaser} durationInFrames={60} fps={FPS} width={1920} height={1080} />
    <Composition id="PaidDex" component={PaidDex} durationInFrames={PAID_DEX_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="PaidDexLive" component={PaidDexLive} durationInFrames={PAID_DEX_LIVE_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="RoadmapMap" component={RoadmapMap} durationInFrames={60} fps={FPS} width={1920} height={1080} />
    <Composition id="RoadmapUpdate" component={RoadmapUpdate} durationInFrames={ROADMAP_UPDATE_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    {Object.keys(ANNOUNCEMENTS).map((id) => (
      <Composition key={id} id={`Card${id}`} component={Announce} durationInFrames={1} fps={FPS} width={1920} height={1080} defaultProps={{ id }} />
    ))}
    {Object.keys(CALLOUTS).map((id) => (
      <Composition key={id} id={id} component={CalloutVideo} durationInFrames={CALLOUT_SECONDS * FPS} fps={FPS} width={1920} height={1080} defaultProps={{ id }} />
    ))}
    {Object.keys(FEATURES).map((id) => (
      <Composition key={id} id={id} component={FeatureUpdate} durationInFrames={FEATURE_SECONDS * FPS} fps={FPS} width={1920} height={1080} defaultProps={{ id }} />
    ))}
    {Object.entries(CLIPS).map(([id, c]) => (
      <Composition key={id} id={id} component={FeatureClip} durationInFrames={c.seconds * FPS} fps={FPS} width={1920} height={1080} defaultProps={{ id }} />
    ))}
    <Composition id="Next01" component={Next01} durationInFrames={NEXT01_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="Next02" component={Next02} durationInFrames={NEXT02_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="Next03" component={Next03} durationInFrames={NEXT03_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="Next04" component={Next04} durationInFrames={NEXT04_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="Next05" component={Next05} durationInFrames={NEXT05_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="Next06" component={Next06} durationInFrames={NEXT06_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="Next07" component={Next07} durationInFrames={NEXT07_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="Next08" component={Next08} durationInFrames={NEXT08_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="Next09" component={Next09} durationInFrames={NEXT09_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="Next10" component={Next10} durationInFrames={NEXT10_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="Fresh01" component={Fresh01} durationInFrames={FRESH01_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="Fresh02" component={Fresh02} durationInFrames={FRESH02_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="Fresh03" component={Fresh03} durationInFrames={FRESH03_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="Fresh04" component={Fresh04} durationInFrames={FRESH04_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="Fresh05" component={Fresh05} durationInFrames={FRESH05_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="OilBonus" component={OilBonus} durationInFrames={OIL_BONUS_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="DoublePay" component={DoublePay} durationInFrames={DOUBLE_PAY_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="MedalCabinet" component={MedalCabinet} durationInFrames={MEDAL_CABINET_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="GusherQuake" component={GusherQuake} durationInFrames={GUSHER_QUAKE_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="TankerDay" component={TankerDay} durationInFrames={TANKER_DAY_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="StoryRecap" component={StoryRecap} durationInFrames={STORY_RECAP_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="ForemanNight" component={ForemanNight} durationInFrames={FOREMAN_NIGHT_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="RoadmapShip" component={RoadmapShip} durationInFrames={ROADMAP_SHIP_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="MobileHowToPlay" component={MobileHowToPlay} durationInFrames={MOBILE_HOW_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="How01" component={How01} durationInFrames={HOW01_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="How02" component={How02} durationInFrames={HOW02_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="How03" component={How03} durationInFrames={HOW03_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="How04" component={How04} durationInFrames={HOW04_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="How05" component={How05} durationInFrames={HOW05_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="How06" component={How06} durationInFrames={HOW06_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="How07" component={How07} durationInFrames={HOW07_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="How08" component={How08} durationInFrames={HOW08_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="How09" component={How09} durationInFrames={HOW09_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="How10" component={How10} durationInFrames={HOW10_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
  </>
);
