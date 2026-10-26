import { C } from "@/lib/palette";
import type { Palette } from "./sprite";

// Shared keys: K ink outline, W white, H/h hard hat, S/s skin, M mustache,
// T shirt, O/o overalls, Y/y gold, R/r barrel red, G/g steel, D oil, L oil shine.
export const base: Palette = {
  K: C.ink,
  W: C.white,
  H: C.hat,
  h: C.hatShade,
  S: C.skin,
  s: C.skinShade,
  M: C.mustache,
  T: C.shirt,
  O: C.overall,
  o: C.overallShade,
  Y: C.sun,
  y: C.sunDeep,
  R: C.red,
  r: C.redDeep,
  G: C.steel,
  g: C.steelDeep,
  D: C.oil,
  L: C.oilShine,
  B: C.sea,
  b: C.seaDeep,
};

/** The roughneck from the Barrel Royale icon; swap H/h for other crews' hard hats. */
export const roughneck = [
  "................",
  ".....KKKKKK.....",
  "....KHHHHHHK....",
  "...KHHWHHHHHK...",
  "..KhhhhhhhhhhK..",
  "..KKKKKKKKKKKK..",
  "...KSSSSSSSSK...",
  "...KSKSSSSKSK...",
  "...KSSSSSSSSK...",
  "...KSSSssSSSK...",
  "...KMMMMMMMMK...",
  "....KSSSSSSK....",
  "..KKOTTTTTTOKK..",
  ".KOOOOTTTTOOooK.",
  ".KSKOOOOOOOOKSK.",
  ".KSKOOOYYOOOKSK.",
  "..KKOOOOOOOOKK..",
  "...KOOOKKOOOK...",
  "...KKKK..KKKK...",
] as const;

export const roughneckHead = roughneck.slice(0, 12);

export const hat = (H: string, h: string): Palette => ({ ...base, H, h });

/** The logo mark: a red barrel wearing a crown. */
export const crownBarrel = [
  ".K.....KK.....K.",
  "KYK...KYYK...KYK",
  "KYYK.KYYYYK.KYYK",
  "KYYYKYYYYYYKYYYK",
  "KYYYYYYRRYYYYYYK",
  "KyyyyyyyyyyyyyyK",
  "KKKKKKKKKKKKKKKK",
  "KWWRRRRRRRRRRrrK",
  "KWWRRRRRRRRRRrrK",
  "KKKKKKKKKKKKKKKK",
  "KWWRRRRRRRRRRrrK",
  "KWWRRRRRRRRRRrrK",
  "KWWRRRRRRRRRRrrK",
  "KKKKKKKKKKKKKKKK",
  "KWWRRRRRRRRRRrrK",
  ".KKKKKKKKKKKKKK.",
] as const;

export const barrel = [
  ".KKKKKKKKKKK.",
  "KWRRRRRRRRrrK",
  "KKKKKKKKKKKKK",
  "KWWRRRRRRRrrK",
  "KWWRRRRRRRrrK",
  "KWWRRRRRRRrrK",
  "KWWRRRRRRRrrK",
  "KWWRRRRRRRrrK",
  "KWWRRRRRRRrrK",
  "KKKKKKKKKKKKK",
  "KWRRRRRRRRrrK",
  ".KKKKKKKKKKK.",
] as const;

export const drop = [
  "....K....",
  "...KDK...",
  "...KDK...",
  "..KDDDK..",
  "..KDDDK..",
  ".KDDDDDK.",
  ".KLDDDDK.",
  "KDLDDDDDK",
  "KDLDDDDDK",
  "KDDDDDDDK",
  ".KDDDDDK.",
  "..KKKKK..",
] as const;

export const icons = {
  hardHat: [
    "................",
    "................",
    "................",
    ".....KKKKKK.....",
    "...KKHHHHHHKK...",
    "..KHHHWHHHHHHK..",
    "..KHHWHHKHHHHK..",
    ".KHHHHHHKHHHHHK.",
    ".KHHHHHHKHHHHHK.",
    ".KhhhhhhhhhhhhK.",
    "KKKKKKKKKKKKKKKK",
    "KhhhhhhhhhhhhhhK",
    ".KKKKKKKKKKKKKK.",
    "................",
    "................",
    "................",
  ],
  derrick: [
    ".....KKKKKK.....",
    ".....KYYYYK.....",
    ".....KKKKKK.....",
    "......KRRK......",
    "......RKKR......",
    ".....KR..RK.....",
    ".....RK..KR.....",
    "....KRKRRKRK....",
    "....RK....KR....",
    "...KR.R..R.RK...",
    "...RK..RR..KR...",
    "..KRRRRRRRRRRK..",
    "..RK........KR..",
    ".KR..........RK.",
    "KKKKKKKKKKKKKKKK",
    "KGKGKGKGKGKGKGKK",
  ],
  gauge: [
    ".....KKKKKK.....",
    "...KKWWWWWWKK...",
    "..KWWWWWWWRRWK..",
    ".KWWWWWWWWWRRWK.",
    ".KWWWWWWWWWWRWK.",
    "KWWWWWWWWWWWWWWK",
    "KWWWWWWWWWWWWWWK",
    "KWWWWWKKWWWWWWWK",
    "KWWWWWKKWWWWWWWK",
    "KWWWWWWWWWWWWWWK",
    ".KWWWWWWWWWWWWK.",
    ".KWWWWWWWWWWWWK.",
    "..KWWWWWWWWWWK..",
    "...KKWWWWWWKK...",
    ".....KKKKKK.....",
    "......KKKK......",
  ],
  coin: [
    "....KKKKKK....",
    "..KKYYYYYYKK..",
    ".KYYWYYYYYYyK.",
    ".KYWYYYYYYYyK.",
    "KYYYKYYYYKYYyK",
    "KYYYYKYYKYYYyK",
    "KYYYYYKKYYYYyK",
    "KYYYYYKKYYYYyK",
    "KYYYYKYYKYYYyK",
    "KYYYKYYYYKYYyK",
    ".KYYYYYYYYYyK.",
    ".KyYYYYYYYyyK.",
    "..KKyyyyyyKK..",
    "....KKKKKK....",
  ],
  storm: [
    "................",
    ".....KKKK.......",
    "...KKggggKKK....",
    "..KgggggggggK...",
    ".KgggggGgggggKK.",
    "KgggGGGGGgggggK.",
    "KggGGGGGGGGgggK.",
    ".KKKKKKKKKKKKKK.",
    "......KYYK......",
    ".....KYYK.......",
    "....KYYYYYK.....",
    "......KYYK......",
    ".....KYYK.......",
    ".....KYK........",
    ".....KK.........",
    "................",
  ],
} as const;

export const cloudBig = [
  ".......WWWW.........",
  ".....WWWWWWWW.......",
  "...WWWWWWWWWWW.WWW..",
  "..WWWWWWWWWWWWWWWWW.",
  ".WWWWWWWWWWWWWWWWWWW",
  "wwWWWWWWWWWWWWWWWWww",
  ".wwwwwwwwwwwwwwwwww.",
  "...wwwwwwwwwwwwww...",
] as const;

export const gullUp = [
  "KK.......KK",
  ".WK.....KW.",
  "..WK.K.KW..",
  "...WWWWWY..",
  "....KKK....",
] as const;

export const gullDown = [
  "...........",
  "...........",
  "..KWWWWWY..",
  ".WK.KKK.KW.",
  "KK.......KK",
] as const;

export const distantRig = [
  "....X....",
  "...XXX...",
  "...X.X...",
  "..XXXXX..",
  "..X...X..",
  ".XXXXXXX.",
  "XXXXXXXXX",
  ".X.....X.",
  ".X.....X.",
] as const;

export const cloudSmall = [
  "....WWWW....",
  "..WWWWWWWW..",
  ".WWWWWWWWWW.",
  "wwWWWWWWWWww",
  ".wwwwwwwwww.",
] as const;

/** A red valve wheel, for the storm brace and the capping drill. */
export const valve = [
  "....KKKK....",
  "..KKRRRRKK..",
  ".KRRKRRKRRK.",
  ".KRKKRRKKRK.",
  "KRRRKKKKRRRK",
  "KRKKKWWKKKRK",
  "KRKKKWWKKKRK",
  "KRRRKKKKRRRK",
  ".KRKKRRKKRK.",
  ".KRRKRRKRRK.",
  "..KKRRRRKK..",
  "....KKKK....",
] as const;

/** The X (formerly Twitter) mark: a heavy back-slash crossed by a thin slash. */
export const xMark = [
  "KKKK......KK",
  ".KKKK....KK.",
  "..KKKK..KK..",
  "...KKKKKK...",
  "....KKKK....",
  "....KKKK....",
  "...KKKKKK...",
  "..KK..KKKK..",
  ".KK....KKKK.",
  "KK......KKKK",
] as const;

export const flameA = [
  "....R....",
  "...RR....",
  "...ROR...",
  "..ROOR...",
  "..ROYOR..",
  ".ROOYYOR.",
  ".ROYYYOR.",
  ".ROYYYYOR",
  "..ROYYOR.",
  "...ROOR..",
  "....RR...",
] as const;

export const flameB = [
  "....R....",
  "....RR...",
  "...ROR...",
  "...ROOR..",
  "..ROYOR..",
  ".ROYYOOR.",
  ".ROYYYOR.",
  "ROYYYYOR.",
  ".ROYYOR..",
  "..ROOR...",
  "...RR....",
] as const;

export const flamePalette: Palette = { R: C.flameEdge, O: C.flame, Y: C.flameCore };

/** The low red boat from the banner. */
export const boat = [
  "..............KKKK..........",
  "..............KWWK..........",
  "..............KWBK..........",
  "KKKKKKKKKKKKKKKKKKKKKKKKKKKK",
  "KRRRRRRRRRRRRRRRRRRRRRRRRRRK",
  ".KrrrrrrrrrrrrrrrrrrrrrrrrK.",
  "..KKKKKKKKKKKKKKKKKKKKKKKK..",
] as const;

export const crate = [
  "KKKKKKKKKK",
  "KyyyyyyyyK",
  "KyKyyyyKyK",
  "KyyKyyKyyK",
  "KyyyKKyyyK",
  "KyyyKKyyyK",
  "KyyKyyKyyK",
  "KyKyyyyKyK",
  "KyyyyyyyyK",
  "KKKKKKKKKK",
] as const;
