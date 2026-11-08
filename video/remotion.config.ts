import { Config } from "@remotion/cli/config";
// @ts-expect-error plain JS module shared with scripts/render.mjs
import { override } from "./scripts/webpack.mjs";

// H.264, yuv420p: what X plays without re-encoding badly.
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setCodec("h264");
Config.setPixelFormat("yuv420p");
Config.setCrf(16);
Config.setColorSpace("bt709");
Config.setStudioPort(3133);
Config.setRendererPort(3157);
Config.overrideWebpackConfig(override);
