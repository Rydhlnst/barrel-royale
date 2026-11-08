import { Composition, registerRoot } from "remotion";
import { FPS } from "./brand";
import { Village, VILLAGE_SECONDS } from "./Village";

// A standalone entry for the Village teaser, so it renders without the main Root.
const VillageRoot = () => <Composition id="Village" component={Village} durationInFrames={VILLAGE_SECONDS * FPS} fps={FPS} width={1920} height={1080} />;

registerRoot(VillageRoot);
