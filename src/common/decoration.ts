import {
  ColorThemeKind,
  Range,
  TextEditor,
  ThemableDecorationAttachmentRenderOptions,
  ThemeColor,
  window,
  workspace,
} from "vscode";
import { TokenType } from "../leaderkey/command";
import { addAlphaToColor } from "./utils";

type ThemeType = "dark" | "light";
let globalThemeType: ThemeType = "dark";

export function updateGlobalThemeType() {
  switch (window.activeColorTheme.kind) {
    case ColorThemeKind.Dark:
    case ColorThemeKind.HighContrast:
      globalThemeType = "dark";
      break;
    case ColorThemeKind.Light:
    case ColorThemeKind.HighContrastLight:
      globalThemeType = "light";
      break;
    default:
      globalThemeType = "dark";
      break;
  }
}

export let stickyScrollMaxRows: number = 0;
export function updateStickyScrollConf() {
  const ss = workspace.getConfiguration("editor.stickyScroll");
  if (ss.get("enabled") === true) {
    stickyScrollMaxRows = ss.get("maxLineCount", 5);
  } else {
    stickyScrollMaxRows = 0;
  }
}
updateStickyScrollConf();

type BackgroundType = "default" | "header" | "border" | "cursor" | "gray";

const config = workspace.getConfiguration("leaderkey")
const configColors = {
  dark: {
    background: config.get("darkModeBackgroundColor", "#292b2e"),
    header: config.get("darkModeHeaderColor", "#5d4d7a"),
    border: config.get("darkModeBorderColor", "#68217A",),
    key: config.get("darkModeKeyColor", "#bc6ec5"),
    arrow: config.get("darkModeArrowColor", "#2d9574"),
    command: config.get("darkModeCommandColor", "#ccc"),
  },
  light: {
    background: config.get("lightModeBackgroundColor", "#FAF7EC"),
    heeader: config.get("lightModeHeaderColor", "#E6E6EA"),
    border: config.get("darkModeBorderColor", "#E7E5EB"),
    key: config.get("lightModeKeyColor", "#692F60"),
    arrow: config.get("lightModeArrowColor", "#2A976D"),
    command: config.get("lightModeCommandColor", "#67537A"),
  }
};

const decoRenderOpts: {
  [themeType in ThemeType]: { [decoType in BackgroundType]: string };
} = {
  dark: {
    default: configColors.dark.background,
    header: configColors.dark.header,
    border: configColors.dark.border,
    cursor: "#BBB",
    gray: "#88888833",

  },
  light: {
    default: configColors.light.background,
    header: configColors.light.heeader,
    border: configColors.light.border,
    cursor: "#444",
    gray: "#88888833",
  },
};

export type TextType =
  | TokenType
  | "dir"
  | "highlight"
  | "arrow-bold"
  | "error-bold"
  | "dim"
  | "dimdim";

const themeRenderOpts: {
  [themeType in ThemeType]: {
    [tokenType in TextType]: ThemableDecorationAttachmentRenderOptions;
  };
} = {
  dark: {
    dir: { color: configColors.dark.key },
    key: { color: configColors.dark.key, fontWeight: "bold" },
    arrow: { color: configColors.dark.arrow },
    "arrow-bold": { color: configColors.dark.arrow, fontWeight: "bold" },
    binding: { color: "#4190d8" },
    highlight: { color: "#4190d8", fontWeight: "bold" },
    command: { color: config.get("darkModeCommandColor", "#ccc") },
    dim: { color: addAlphaToColor(configColors.dark.command, "8") },
    dimdim: { color: addAlphaToColor(configColors.dark.command, "3") },
    "error-bold": { color: new ThemeColor("errorForeground"), fontWeight: "bold" },
  },
  light: {
    key: { color: configColors.light.key, fontWeight: "bold" },
    dir: { color: configColors.light.key },
    arrow: { color: configColors.light.arrow },
    "arrow-bold": { color: configColors.light.arrow, fontWeight: "bold" },
    binding: { color: "#3781C2" },
    highlight: { color: "#3781C2", fontWeight: "bold" },
    command: { color: configColors.light.command },
    dim: { color: addAlphaToColor(configColors.light.command, "8") },
    dimdim: { color: addAlphaToColor(configColors.light.command, "3") },
    "error-bold": { color: new ThemeColor("errorForeground"), fontWeight: "bold" },
  },
};

export type Decoration =
  | {
    type: "background";
    background?: BackgroundType;
    lines: number;
    width?: number;
    lineOffset?: number;
    charOffset?: number;
    zOffset?: number;
  }
  | {
    type: "text";
    background?: BackgroundType;
    foreground: TextType;
    lineOffset?: number;
    charOffset?: number;
    text: string;
    zOffset?: number;
  };

function escapeTextForBeforeContentText(text: string) {
  return text
    .replaceAll("\\", "\\\\")
    .replaceAll("'", "\\'")
    .replaceAll(" ", "\\00a0 ")
    .replace(/(\r\n|\r|\n)/g, " \\A ");
}

export function renderDecorations(
  decorations: Decoration[],
  editor: TextEditor,
  range: Range,
) {
  const dts = decorations.map((deco) => {
    switch (deco.type) {
      case "background":
        return window.createTextEditorDecorationType({
          color: "transparent",
          before: {
            contentText: "",
            backgroundColor:
              decoRenderOpts[globalThemeType][deco.background ?? "default"],
            height: `${100 * deco.lines}%`,
            width: `${deco.width ?? 200}ch`,
            margin: `0 -1ch 0 ${deco.charOffset !== undefined ? 0.5 + deco.charOffset : 0}ch;
                position: absolute; z-index: ${100 + (deco.zOffset ?? 0)};
                ${deco.lineOffset === undefined ? "" : `top: ${deco.lineOffset * 100}%;`}`,
          },
        });
      case "text":
        return window.createTextEditorDecorationType({
          color: "transparent",
          before: {
            fontWeight: "normal",
            ...themeRenderOpts[globalThemeType][deco.foreground],
            ...(deco.background === undefined
              ? {}
              : { backgroundColor: decoRenderOpts[globalThemeType][deco.background] }),
            height: "100%",
            width: "200ch",
            margin: `0 -1ch 0 ${deco.charOffset ?? 0}ch; position: absolute; z-index: ${110 + (deco.zOffset ?? 0)}; padding-left: 0.5ch; white-space: pre;
               ${deco.lineOffset === undefined ? "" : `top: ${deco.lineOffset * 100}%;`}
               content: '${escapeTextForBeforeContentText(deco.text)}'`,
          },
        });
    }
  });
  dts.forEach((dt) => editor.setDecorations(dt, [range]));
  return dts;
}

export function getThemeRenderOpts(tokenType: TextType) {
  return themeRenderOpts[globalThemeType][tokenType];
}
