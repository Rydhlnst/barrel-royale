import { Composition, registerRoot } from "remotion";
import { FPS } from "./brand";
import { NightShift, NIGHT_SHIFT_SECONDS } from "./NightShift";

// A standalone entry for the Halloween Double Pay video, so it renders without the main Root.
const NightShiftRoot = () => <Composition id="NightShift" component={NightShift} durationInFrames={NIGHT_SHIFT_SECONDS * FPS} fps={FPS} width={1920} height={1080} />;

registerRoot(NightShiftRoot);
