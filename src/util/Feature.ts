import UrlGlob from "url-glob";
import { log } from "./log";

export interface Feature {
    name: string;
    enabledByDefault?: boolean;
    activePaths: string[];
    init?: () => void;
    apply: () => void;
    unload?: () => void;
}

const features: Array<[UrlGlob[], Feature]> = [];
const loadedFeatures: Array<string> = [];

export function enableFeature(feature: Feature) {
    // TODO: allow users to enable/disable features in configuration
    const enable = feature.enabledByDefault || true;
    if (!enable) {
        log('↩️', 'Skipping', feature.name);
        return;
    }

    try {
        if (feature.init) {
            feature.init();
        }
        const globs = feature.activePaths.map(x => new UrlGlob(x));
        features.push([globs, feature]);
        log('✅', feature.name);
    } catch (e) {
        console.log('❌', feature.name);
		console.error(e);
    }
}

function activateFeatures(url?: string) {
    const legitUrl = url = url || window.location.origin + window.location.pathname;
    log("⏩", legitUrl);
    features.forEach(tuple => {
        const [globs, feature] = tuple;
        if (globs.some(glob => glob.match(legitUrl))) {
            // should be enabled
            if (loadedFeatures.indexOf(feature.name) === -1) {
                feature.apply();
                loadedFeatures.push(feature.name);
                log("🔰", feature.name);
            }
        } else {
            if (loadedFeatures.indexOf(feature.name) !== -1) {
                if (feature.unload) {
                    feature.unload();
                }
                loadedFeatures.splice(loadedFeatures.indexOf(feature.name), 1);
                log("♻️", feature.name);
            }
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("interface_frame");
    if (container) {
        container.addEventListener("load", () => {
            activateFeatures((container as HTMLIFrameElement).src);
        });
    } else {
        activateFeatures();
    }
});

