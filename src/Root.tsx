import { Composition } from "remotion";
import { Film, TOTAL } from "./myter/Film";

export const Root = () => <Composition id="Myter" component={Film} width={1080} height={1080} fps={30} durationInFrames={TOTAL} />;
