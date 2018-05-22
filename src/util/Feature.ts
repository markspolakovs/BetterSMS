import $ from "jquery";
import UrlGlob from "url-glob";
import { isBackground, isContent } from "./context";
import { log } from "./log";
import { Message, MessageHandler } from "./messaging";
import { createDivMonkeyPatch } from "./scripts";

export interface Feature {
  name: string;
  enabledByDefault?: boolean;
  activePaths: string[];
  init?: () => void;
  apply: () => void;
  applyBackground?: () => void;
  unloadBackground?: () => void;
  onContentMessage?: MessageHandler;
  onBackgroundMessage?: MessageHandler;
  onPageMessage?: MessageHandler;
  onBeforeCreateDiv?: (id: string) => void;
  onAfterCreateDiv?: (id: string, returnValue: any) => void;
  unload?: () => void;
  /** If an active glob matches both before and after navigation, unload and reapply it anyway */
  reloadOnSamePage?: boolean;
}

export interface BackgroundFeature extends Feature {
  applyBackground: () => void;
}

export enum Context {
  CONTENT,
  BACKGROUND
}

interface LoadedContext {
  _context: Context;
}

type ExtensionMap<T> = { [name: string]: T };

const features: Array<[UrlGlob[], Feature & LoadedContext]> = [];
const loadedFeatures: Array<string> = [];
const backgroundMessageHandlers: ExtensionMap<MessageHandler> = {};
const contentMessageHandlers: ExtensionMap<MessageHandler> = {};
const pageMessageHandlers: ExtensionMap<MessageHandler> = {};
const beforeCreateDivHandlers: ExtensionMap<(id: string) => void> = {};
const afterCreateDivHandlers: ExtensionMap<
  (id: string, returnValue: any) => void
> = {};

export function enableContentFeature(feature: Feature) {
  return enableFeature(feature, Context.CONTENT);
}

export function enableBackgroundFeature(feature: BackgroundFeature) {
  return enableFeature(feature, Context.BACKGROUND);
}

export function enableFeature(feature: Feature, context: Context) {
  // TODO: allow users to enable/disable features in configuration
  const enable = feature.enabledByDefault || true;
  if (!enable) {
    log("↩️", "Skipping", feature.name);
    return;
  }

  try {
    if (feature.init) {
      feature.init();
    }
    if (context === Context.BACKGROUND) {
      if (feature.applyBackground) {
        try {
          feature.applyBackground();
        } catch (e) {
          console.log("❌ (background)", feature.name);
          console.error(e);
        }
      }
      if (feature.onBackgroundMessage) {
        backgroundMessageHandlers[feature.name] = feature.onBackgroundMessage;
      }
    }
    const globs = feature.activePaths.map(x => new UrlGlob(x));
    features.push([globs, { ...feature, _context: context }]);
    log("✅", feature.name);
  } catch (e) {
    console.log("❌", feature.name);
    console.error(e);
  }
}

let messageHandlerReady = false;
function activateMessageHandler() {
  if (messageHandlerReady) {
    return;
  }
  const handler: browser.runtime.onMessagePromise = async (
    msg,
    sender,
    sendResponse
  ): Promise<void> => {
    if (!Message.guard(msg)) {
      console.error(
        `Malformed message sent to feature ${(msg as any).feature ||
          "[NO NAME]"}`
      );
      console.log(msg);
      return;
    }
    if (contentMessageHandlers[msg.feature]) {
      contentMessageHandlers[msg.feature](msg.action, msg.payload);
    }
  };
  browser.runtime.onMessage.addListener(handler);
}

let hasEventListener = false;
function pageMessageEventHandler(event: MessageEvent) {
  console.log("page message event handler hit");
  if (event.source != window) {
    console.warn("no script kiddies please!");
    return;
  }
  const msg = event.data;
  if (!Message.guard(msg)) {
    console.error(
      `Malformed message sent to feature ${(msg as any).feature || "[NO NAME]"}`
    );
    console.log(msg);
    return;
  }
  const payload = msg.payload as any;
  if (msg.feature === "__core") {
    switch (msg.action) {
      case "beforeCreateDiv":
        Object.keys(beforeCreateDivHandlers)
          .map(x => beforeCreateDivHandlers[x])
          .forEach(x => x(payload.id));
        break;
      case "afterCreateDiv":
        Object.keys(afterCreateDivHandlers)
          .map(x => afterCreateDivHandlers[x])
          .forEach(x => x(payload.id, payload.returnValue));
        break;
    }
  } else {
    if (pageMessageHandlers[msg.feature]) {
      pageMessageHandlers[msg.feature](msg.action, payload);
    }
  }
}

function activateFeatures(url?: string) {
  const legitUrl = url || window.location.origin + window.location.pathname;
  log("⏩", legitUrl);
  features.forEach(tuple => {
    const [globs, feature] = tuple;
    if (globs.some(glob => glob.match(legitUrl))) {
      // should be enabled
      if (loadedFeatures.indexOf(feature.name) === -1) {
        // if we're in the content context, apply the feature
        // also register its message/createDiv handler if it has one
        if (isContent()) {
          feature.apply();
          if (feature.onContentMessage) {
            contentMessageHandlers[feature.name] = feature.onContentMessage;
          }
          if (feature.onPageMessage) {
            pageMessageHandlers[feature.name] = feature.onPageMessage;
          }
          if (feature.onBeforeCreateDiv) {
            beforeCreateDivHandlers[feature.name] = feature.onBeforeCreateDiv;
          }
          if (feature.onAfterCreateDiv) {
            afterCreateDivHandlers[feature.name] = feature.onAfterCreateDiv;
          }
        }
        loadedFeatures.push(feature.name);
        log("🔰", feature.name);
      } else if (feature.reloadOnSamePage && isContent()) {
        // we've gone from and to the same page and the feature requests to be reloaded
        // don't need to re-register the message handler here
        if (feature.unload) {
          feature.unload();
        }
        feature.apply();
        log("💱", feature.name);
      }
    } else {
      if (loadedFeatures.indexOf(feature.name) !== -1) {
        if (feature.onBeforeCreateDiv) {
          delete beforeCreateDivHandlers[feature.name];
        }
        if (feature.onAfterCreateDiv) {
          delete afterCreateDivHandlers[feature.name];
        }
        if (feature.unload) {
          feature.unload();
        }
        if (feature.onContentMessage) {
          delete contentMessageHandlers[feature.name];
        }
        if (feature.onPageMessage) {
          delete pageMessageHandlers[feature.name];
        }
        loadedFeatures.splice(loadedFeatures.indexOf(feature.name), 1);
        log("♻️", feature.name);
      }
    }
  });
  if (
    Object.keys(beforeCreateDivHandlers).length > 0 ||
    Object.keys(afterCreateDivHandlers).length > 0
  ) {
    $(document.body).append(createDivMonkeyPatch);
    $("#interface_frame")
      .contents()
      .find("body")
      .first()
      .append(createDivMonkeyPatch);
    console.log("ENGAGE THE MONKEY");
    if (!hasEventListener) {
      window.addEventListener("message", pageMessageEventHandler);
      hasEventListener = true;
    }
  } else {
    window.removeEventListener("message", pageMessageEventHandler);
    hasEventListener = false;
  }
}

function activateBackgroundFeatures() {
  const handler: browser.runtime.onMessagePromise = async (
    msg,
    sender,
    sendResponse
  ): Promise<void> => {
    if (!Message.guard(msg)) {
      console.error(
        `Malformed message sent to feature ${(msg as any).feature ||
          "[NO NAME]"}`
      );
      console.log(msg);
      return;
    }
    if (backgroundMessageHandlers[msg.feature]) {
      backgroundMessageHandlers[msg.feature](msg.action, msg.payload);
    }
  };
  browser.runtime.onMessage.addListener(handler);
}

if (isBackground()) {
  console.log("activating background features");
  activateBackgroundFeatures();
} else {
  document.addEventListener("DOMContentLoaded", () => {
    activateFeatures();
  });
}
