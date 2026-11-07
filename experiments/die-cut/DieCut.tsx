import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type KeyboardEvent,
  type PointerEvent,
  type SVGProps,
} from 'react'
import './DieCut.css'

/* The drawings. Each one was redrawn by hand from an image generated with Codex.
   `base` is the white die-cut border with its 1px neutral edge, `art` is the object on top.
   The ids b, c, y (blue, coral, yellow gradients) and s (the silhouette) are scoped per sticker. */

type StickerDrawing = { title: string; defs: string; base: string; art: string }

const DEFS =
  '<radialGradient id="b" cx=".35" cy=".25" r=".9"><stop offset="0" stop-color="#6f97ff"/><stop offset=".55" stop-color="#3461f2"/><stop offset="1" stop-color="#1f3fc4"/></radialGradient><radialGradient id="c" cx=".3" cy=".25" r=".95"><stop offset="0" stop-color="#ff9a7c"/><stop offset=".6" stop-color="#ff7653"/><stop offset="1" stop-color="#e2553a"/></radialGradient><radialGradient id="y" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffe066"/><stop offset="1" stop-color="#f2b300"/></radialGradient>'

const STICKERS = {
  headphones: {
    title: 'Headphones',
    defs: '<g id="s"><path d="M19 53C19 29 39 15 64 15s45 14 45 38H97c0-14-14-23-33-23S31 39 31 53Z"/><rect x="17.5" y="51" width="12" height="11" rx="3"/><rect x="98.5" y="51" width="12" height="11" rx="3"/><rect x="19.5" y="60" width="8" height="12"/><rect x="100.5" y="60" width="8" height="12"/><ellipse cx="31" cy="90" rx="20" ry="23"/><ellipse cx="97" cy="90" rx="20" ry="23"/><ellipse cx="46.5" cy="89" rx="12.5" ry="25" transform="rotate(-15 46.5 89)"/><ellipse cx="81.5" cy="89" rx="12.5" ry="25" transform="rotate(15 81.5 89)"/></g>',
    base: '<use href="#s" fill="#1b1d2b" stroke="#1b1d2b" stroke-opacity=".14" stroke-width="6.5" stroke-linejoin="round" stroke-linecap="round"/><use href="#s" fill="#fff" stroke="#fff" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>',
    art: '<path d="M33 48c2-12 15-19 31-19s29 7 31 19c-8-6-19-9-31-9s-23 3-31 9Z" fill="#23253a"/><path d="M19 53C19 29 39 15 64 15s45 14 45 38H97c0-14-14-23-33-23S31 39 31 53Z" fill="url(#b)"/><rect x="19.5" y="60" width="8" height="12" fill="#23253a"/><rect x="100.5" y="60" width="8" height="12" fill="#23253a"/><rect x="17.5" y="51" width="12" height="11" rx="3" fill="url(#y)"/><rect x="98.5" y="51" width="12" height="11" rx="3" fill="url(#y)"/><ellipse cx="31" cy="90" rx="20" ry="23" fill="url(#b)"/><ellipse cx="97" cy="90" rx="20" ry="23" fill="url(#b)"/><ellipse cx="18" cy="91" rx="5.5" ry="8" fill="#23253a"/><ellipse cx="110" cy="91" rx="5.5" ry="8" fill="#23253a"/><ellipse cx="17.5" cy="91" rx="4" ry="6.5" fill="url(#y)"/><ellipse cx="110.5" cy="91" rx="4" ry="6.5" fill="url(#y)"/><ellipse cx="46.5" cy="89" rx="12.5" ry="25" transform="rotate(-15 46.5 89)" fill="url(#c)"/><ellipse cx="81.5" cy="89" rx="12.5" ry="25" transform="rotate(15 81.5 89)" fill="url(#c)"/><ellipse cx="50" cy="88" rx="4" ry="15" transform="rotate(-15 50 88)" fill="#d8482f"/><ellipse cx="78" cy="88" rx="4" ry="15" transform="rotate(15 78 88)" fill="#d8482f"/><g fill="none" stroke="#fff" stroke-linecap="round"><path d="M34 27c6-5 14-8 24-9" stroke-width="3.2" opacity=".85"/><path d="M90 26l2 2" stroke-width="3"/><path d="M17 79c1-3 3-5 6-6" stroke-width="2.6" opacity=".8"/><path d="M107 74c2 1 4 3 5 5" stroke-width="2.6" opacity=".8"/><path d="M37 69l-1 9" stroke-width="2.6" opacity=".9"/><path d="M87 68l1 9" stroke-width="2.6" opacity=".9"/></g>',
  },
  laptop: {
    title: 'Laptop',
    defs: '<g id="s"><path d="M12 78 33 70 46 75 44 103 14 93Q7 90 7.5 85 8 80.5 12 78Z"/><path d="M44 28 111 23Q118 22.5 117 30L111 86Q110 93 103 94L41 99Q34 99.5 34.5 92L37 35Q37.5 28.5 44 28Z"/></g>',
    base: '<use href="#s" fill="#1b1d2b" stroke="#1b1d2b" stroke-opacity=".14" stroke-width="6.5" stroke-linejoin="round" stroke-linecap="round"/><use href="#s" fill="#fff" stroke="#fff" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>',
    art: '<path d="M12 78 33 70 46 75 44 103 14 93Q7 90 7.5 85 8 80.5 12 78Z" fill="url(#c)"/><path d="M8 86Q9 90 14 92L44 102.5V98L13 87.5Q9 86 8 83Z" fill="#d9502f"/><g fill="#23253a" transform="rotate(-21 22 82)"><rect x="13" y="78" width="7" height="4" rx="1.5"/><rect x="22" y="78" width="7" height="4" rx="1.5"/><rect x="15" y="84" width="7" height="4" rx="1.5"/><rect x="24" y="84" width="6" height="4" rx="1.5"/></g><path d="M44 28 111 23Q118 22.5 117 30L111 86Q110 93 103 94L41 99Q34 99.5 34.5 92L37 35Q37.5 28.5 44 28Z" fill="url(#b)"/><circle cx="80.5" cy="61.5" r="12.5" fill="url(#y)"/><path d="M84.5 53.5 77.5 62.5H82L77.5 70 87 60.5H82.5Z" fill="#23253a" stroke="#23253a" stroke-width="1" stroke-linejoin="round"/><g fill="none" stroke="#fff" stroke-linecap="round"><path d="M45 42c6-6 16-9 32-10" stroke-width="3.4" opacity=".85"/><path d="M109 33.5l2 1.5" stroke-width="3.2" opacity=".85"/><path d="M72 54c2-2 4-3 6-3" stroke-width="2" opacity=".9"/><path d="M12 85l4 1.5" stroke-width="2.4" opacity=".8"/></g>',
  },
  notebook: {
    title: 'Notebook',
    defs: '<g id="s"><g transform="rotate(-8 64 64)"><rect x="29" y="19" width="82" height="88" rx="10"/><rect x="31" y="23" width="80" height="88" rx="10"/><rect x="14" y="26" width="22" height="78" rx="9"/></g></g>',
    base: '<use href="#s" fill="#1b1d2b" stroke="#1b1d2b" stroke-opacity=".14" stroke-width="6.5" stroke-linejoin="round" stroke-linecap="round"/><use href="#s" fill="#fff" stroke="#fff" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>',
    art: '<g transform="rotate(-8 64 64)"><rect x="31" y="23" width="80" height="88" rx="10" fill="#f6eedb"/><path d="M38 106H104" stroke="#dccfb1" stroke-width="1.4"/><rect x="29" y="18" width="82" height="86" rx="10" fill="url(#c)"/><rect x="86" y="18" width="7" height="88" fill="url(#b)"/><rect x="44" y="31" width="35" height="18" rx="5" fill="url(#y)"/><g fill="#c4442c"><circle cx="36.5" cy="32.5" r="2.2"/><circle cx="36.5" cy="47.5" r="2.2"/><circle cx="36.5" cy="62.5" r="2.2"/><circle cx="36.5" cy="77.5" r="2.2"/><circle cx="36.5" cy="92.5" r="2.2"/></g><g fill="none" stroke="#23253a" stroke-width="5.5" stroke-linecap="round"><path d="M36 32C30 27 19 28 19 35C19 41 28 42 34 38"/><path d="M36 47C30 42 19 43 19 50C19 56 28 57 34 53"/><path d="M36 62C30 57 19 58 19 65C19 71 28 72 34 68"/><path d="M36 77C30 72 19 73 19 80C19 86 28 87 34 83"/><path d="M36 92C30 87 19 88 19 95C19 101 28 102 34 98"/></g></g><g fill="none" stroke="#fff" stroke-linecap="round"><g transform="rotate(-8 64 64)"><path d="M40 26c6-2 14-3 22-3" stroke-width="3.2" opacity=".85"/><path d="M105 26v5" stroke-width="2.8" opacity=".85"/><path d="M89 24v14" stroke-width="1.8" opacity=".8"/><path d="M48 36c2-2 5-3 9-3" stroke-width="2.2" opacity=".9"/><path d="M21 33c2-2 4-2.5 6-2.5M21 48c2-2 4-2.5 6-2.5M21 63c2-2 4-2.5 6-2.5M21 78c2-2 4-2.5 6-2.5M21 93c2-2 4-2.5 6-2.5" stroke-width="1.6" opacity=".7"/></g></g>',
  },
  lightbulb: {
    title: 'Light bulb',
    defs: '<g id="s"><path d="M64 24C83 24 97 38 97 56 97 68 90 75 85 81 83 84 82 87 82 89H46C46 87 45 84 43 81 38 75 31 68 31 56 31 38 45 24 64 24Z"/><rect x="60.5" y="5.5" width="7" height="14" rx="3.5"/><rect x="31.5" y="17.5" width="7" height="14" rx="3.5" transform="rotate(-45 35 24.5)"/><rect x="89.5" y="17.5" width="7" height="14" rx="3.5" transform="rotate(45 93 24.5)"/><rect x="44" y="86" width="40" height="13" rx="6"/><rect x="48" y="96" width="32" height="25" rx="9"/></g>',
    base: '<use href="#s" fill="#1b1d2b" stroke="#1b1d2b" stroke-opacity=".14" stroke-width="6.5" stroke-linejoin="round" stroke-linecap="round"/><use href="#s" fill="#fff" stroke="#fff" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>',
    art: '<g fill="url(#y)"><rect x="60.5" y="5.5" width="7" height="14" rx="3.5"/><rect x="31.5" y="17.5" width="7" height="14" rx="3.5" transform="rotate(-45 35 24.5)"/><rect x="89.5" y="17.5" width="7" height="14" rx="3.5" transform="rotate(45 93 24.5)"/></g><path d="M64 24C83 24 97 38 97 56 97 68 90 75 85 81 83 84 82 87 82 89H46C46 87 45 84 43 81 38 75 31 68 31 56 31 38 45 24 64 24Z" fill="url(#y)"/><path d="M60 88V64c0-7-6-11-10-8.5S46 63 51.5 63H76.5C82 63 82 57 78 55.5S68 57 68 64V88" fill="none" stroke="#ff7a5c" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/><rect x="49" y="105" width="30" height="16" rx="7.5" fill="url(#b)"/><rect x="46" y="97" width="36" height="6" rx="3" fill="#23253a"/><rect x="47" y="103" width="34" height="3.5" fill="#3461f2"/><rect x="47" y="106" width="34" height="6" rx="3" fill="#23253a"/><rect x="44" y="87" width="40" height="11" rx="5.5" fill="url(#b)"/><g fill="none" stroke="#fff" stroke-linecap="round"><path d="M39 47c4-8 11-13 20-15" stroke-width="3.4" opacity=".85"/><path d="M78 36.5l3 2.5" stroke-width="3.2" opacity=".85"/><path d="M50 90.5h12" stroke-width="2" opacity=".85"/><path d="M64 9.5v5" stroke-width="2" opacity=".8"/><path d="M54 116h6" stroke-width="1.8" opacity=".8"/></g>',
  },
  paperclip: {
    title: 'Paperclip',
    defs: '',
    base: '<g transform="rotate(26 64 64)" stroke-linecap="round" stroke-linejoin="round"><path d="M57 84V46a7.5 7.5 0 0 1 15 0V98a13 13 0 0 1-26 0V32a18.5 18.5 0 0 1 37 0V88" fill="none" stroke="#1b1d2b" stroke-opacity=".14" stroke-width="15.5"/></g><g transform="rotate(26 64 64)" stroke-linecap="round" stroke-linejoin="round"><path d="M57 84V46a7.5 7.5 0 0 1 15 0V98a13 13 0 0 1-26 0V32a18.5 18.5 0 0 1 37 0V88" fill="#fff" stroke="#fff" stroke-width="14"/></g>',
    art: '<g transform="rotate(26 64 64)"><path d="M57 84V46a7.5 7.5 0 0 1 15 0V98a13 13 0 0 1-26 0V32a18.5 18.5 0 0 1 37 0V88" fill="none" stroke="url(#b)" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></g><g fill="none" stroke="#fff" stroke-linecap="round"><g transform="rotate(26 64 64)"><path d="M46 38v14" stroke-width="2.4" opacity=".8"/><path d="M83 58v12" stroke-width="2.4" opacity=".8"/><path d="M54 21c3-4 9-6 14-5" stroke-width="2.6" opacity=".85"/><path d="M60 43c1-2 3-3.5 5-3.5" stroke-width="2" opacity=".85"/></g></g>',
  },
  floppy: {
    title: 'Floppy disk',
    defs: '<g id="s"><path d="M23 16H100L113 29V104Q113 112 105 112H23Q15 112 15 104V24Q15 16 23 16Z" transform="rotate(-4 64 64)"/></g>',
    base: '<use href="#s" fill="#1b1d2b" stroke="#1b1d2b" stroke-opacity=".14" stroke-width="6.5" stroke-linejoin="round" stroke-linecap="round"/><use href="#s" fill="#fff" stroke="#fff" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>',
    art: '<g transform="rotate(-4 64 64)"><path d="M23 16H100L113 29V104Q113 112 105 112H23Q15 112 15 104V24Q15 16 23 16Z" fill="url(#b)"/><rect x="33" y="16" width="56" height="33" rx="5" fill="#23253a"/><rect x="72" y="23" width="10" height="19" rx="2.5" fill="#3461f2"/><rect x="27" y="56" width="74" height="44" rx="9" fill="url(#y)"/><g fill="#ff7653" stroke="#23253a" stroke-width="1.2"><rect x="20" y="101" width="6" height="6" rx="1.5"/><rect x="102" y="101" width="6" height="6" rx="1.5"/></g></g><g fill="none" stroke="#fff" stroke-linecap="round"><g transform="rotate(-4 64 64)"><path d="M38 25c6-2 12-3 20-3" stroke-width="3" opacity=".8"/><path d="M80 18.5h3" stroke-width="2.2" opacity=".8"/><path d="M32 67c2-5 7-7 18-7" stroke-width="3.2" opacity=".9"/><path d="M90 60l3 2.5" stroke-width="3" opacity=".85"/><path d="M19 38c0-5 1.5-9 4-11" stroke-width="2.6" opacity=".8"/><path d="M103 22l5 5" stroke-width="2.4" opacity=".75"/></g></g>',
  },
  coffee: {
    title: 'Coffee mug',
    defs: '<linearGradient id="v" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f1f1fa"/><stop offset="1" stop-color="#c3c4de"/></linearGradient><g id="s"><path d="M24 54C24 47 82 47 82 54L80 106C80 116 74 118 64 118H42C32 118 26 116 26 106Z"/><ellipse cx="90" cy="83" rx="15" ry="21"/></g>',
    base: '<use href="#s" fill="#1b1d2b" stroke="#1b1d2b" stroke-opacity=".14" stroke-width="6.5" stroke-linejoin="round" stroke-linecap="round"/><g stroke-linecap="round" stroke-linejoin="round"><path d="M46 49C36 40 38 30 52 26 64 22 68 14 57 9" fill="none" stroke="#1b1d2b" stroke-opacity=".14" stroke-width="15.5"/><path d="M63 49C59 40 64 36 72 34 79 32 81 27 77 24" fill="none" stroke="#1b1d2b" stroke-opacity=".14" stroke-width="14.0"/><path d="M81 67C97 62 104 72 101 86 99 98 90 102 80 100" fill="none" stroke="#1b1d2b" stroke-opacity=".14" stroke-width="16.5"/></g><use href="#s" fill="#fff" stroke="#fff" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/><g stroke-linecap="round" stroke-linejoin="round"><path d="M46 49C36 40 38 30 52 26 64 22 68 14 57 9" fill="none" stroke="#fff" stroke-width="14"/><path d="M63 49C59 40 64 36 72 34 79 32 81 27 77 24" fill="none" stroke="#fff" stroke-width="12.5"/><path d="M81 67C97 62 104 72 101 86 99 98 90 102 80 100" fill="none" stroke="#fff" stroke-width="15"/></g>',
    art: '<g fill="none" stroke-linecap="round"><path d="M46 49C36 40 38 30 52 26 64 22 68 14 57 9" stroke="url(#v)" stroke-width="9"/><path d="M63 49C59 40 64 36 72 34 79 32 81 27 77 24" stroke="url(#v)" stroke-width="7.5"/><path d="M81 67C97 62 104 72 101 86 99 98 90 102 80 100" stroke="url(#c)" stroke-width="10"/></g><path d="M24 54C24 47 82 47 82 54L80 106C80 116 74 118 64 118H42C32 118 26 116 26 106Z" fill="url(#c)"/><ellipse cx="53" cy="53" rx="29" ry="6.5" fill="#ff8e6f"/><ellipse cx="53" cy="54" rx="24.5" ry="5" fill="#23253a"/><g fill="none" stroke="#fff" stroke-linecap="round"><path d="M31 72c-1 8-1 18 1 26" stroke-width="4" opacity=".85"/><path d="M33 106v2" stroke-width="3.6" opacity=".85"/><path d="M66 52h5" stroke-width="2" opacity=".85"/><path d="M89 66c4 0 7 2 8 5" stroke-width="2.6" opacity=".85"/><path d="M41 37c1-4 4-7 8-8" stroke-width="2.2" opacity=".9"/><path d="M76 27.5c1 1 1.5 2 1.4 3" stroke-width="1.8" opacity=".9"/></g>',
  },
  assistant: {
    title: 'Assistant',
    defs: '<linearGradient id="w" x1="0" y1="0" x2="1" y2="1"><stop offset=".3" stop-color="#fff"/><stop offset="1" stop-color="#d4d6f5"/></linearGradient><g id="s"><ellipse cx="61" cy="64" rx="47" ry="37"/><path d="M26 86C26 98 23 104 19.5 110 18 113 21 114.5 24 113.5 32 110 40 105 46 100Z"/><path d="M93 15C95 28 99 32 113 34 99 36 95 40 93 53 91 40 87 36 73 34 87 32 91 28 93 15Z"/><path d="M107.5 16.5C108.2 21 109 22 114 23 109 24 108.2 25 107.5 29.5 106.8 25 106 24 101 23 106 22 106.8 21 107.5 16.5Z"/></g>',
    base: '<use href="#s" fill="#1b1d2b" stroke="#1b1d2b" stroke-opacity=".14" stroke-width="6.5" stroke-linejoin="round" stroke-linecap="round"/><use href="#s" fill="#fff" stroke="#fff" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>',
    art: '<g fill="url(#b)"><ellipse cx="61" cy="64" rx="47" ry="37"/><path d="M26 86C26 98 23 104 19.5 110 18 113 21 114.5 24 113.5 32 110 40 105 46 100Z"/></g><path d="M93 15C95 28 99 32 113 34 99 36 95 40 93 53 91 40 87 36 73 34 87 32 91 28 93 15Z" fill="url(#w)" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/><path d="M107.5 16.5C108.2 21 109 22 114 23 109 24 108.2 25 107.5 29.5 106.8 25 106 24 101 23 106 22 106.8 21 107.5 16.5Z" fill="url(#y)"/><g fill="none" stroke="#fff" stroke-linecap="round"><path d="M29 50c6-9 17-15 30-16" stroke-width="3.6" opacity=".85"/><path d="M24.5 59l-2 4" stroke-width="3" opacity=".85"/><path d="M28 96c-.5 4-2 8-3.5 10.5" stroke-width="2.4" opacity=".8"/></g>',
  },
} satisfies Record<string, StickerDrawing>

export type StickerName = keyof typeof STICKERS
export const stickerNames = Object.keys(STICKERS) as StickerName[]
export const stickerTitle = (name: StickerName) => STICKERS[name].title

const SIZES = { sm: 48, md: 80, lg: 128 }
export type StickerSize = keyof typeof SIZES | number
export const stickerPixels = (size: StickerSize) => (typeof size === 'number' ? size : SIZES[size])

/** Prefixes every id in a drawing, so two stickers on one page never share a gradient. */
function scope(markup: string, prefix: string) {
  return markup.replace(/(id="|url\(#|href="#)([a-z])(?=[")])/g, `$1${prefix}$2`)
}

/** The back of a peeled sticker: the same silhouette, in the color of the paper backing. */
const BACK = '#eceef3'

function drawing(name: StickerName, prefix: string, side: 'front' | 'back' = 'front') {
  const d = STICKERS[name]
  const body = side === 'front' ? d.base + d.art : d.base.replaceAll('"#fff"', `"${BACK}"`)
  return scope(`<defs>${DEFS}${d.defs}</defs>${body}`, prefix)
}

function useScope() {
  return useId().replace(/[^\w-]/g, '') + '-'
}

/** A standalone SVG file for a sticker, ready to paste into Figma or save to disk. */
export function stickerSvg(name: StickerName, size: StickerSize = 'lg') {
  const s = stickerPixels(size)
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="${s}" height="${s}">` +
    `<title>${STICKERS[name].title}</title>${drawing(name, `${name}-`)}</svg>`
  )
}

/** The JSX that renders a sticker, for people who copied this component. */
export function stickerJsx(name: StickerName, size: StickerSize = 'md') {
  const sizeProp = size === 'md' ? '' : typeof size === 'number' ? ` size={${size}}` : ` size="${size}"`
  return `<DieCut name="${name}"${sizeProp} />`
}


type Vec = { x: number; y: number }

export type DieCutProps = {
  name: StickerName
  /** `sm` 48px, `md` 80px, `lg` 128px, or any number of pixels. Below 48px the white border turns to mush. */
  size?: StickerSize
  /** Without a label the sticker is decoration and screen readers skip it. With one, it is an image with that name. */
  label?: string
  /** Resting angle in degrees. */
  angle?: number
  /** Leans toward the pointer in 3D on hover. */
  tilt?: boolean
  /** Can be picked up, thrown and dropped anywhere inside its parent element. Implies `tilt`. */
  movable?: boolean
} & Omit<SVGProps<SVGSVGElement>, 'name' | 'children' | 'dangerouslySetInnerHTML'>

/** How far a hovered sticker leans, in degrees, at its edge. */
const TILT = 12
/** How much a sticker grows when it is picked up. */
const LIFT = 1.1

let topLayer = 1

export function DieCut({ name, size = 'md', label, angle = 0, tilt, movable, className, style, ...rest }: DieCutProps) {
  const prefix = useScope()
  const px = stickerPixels(size)
  const el = useRef<SVGSVGElement>(null)
  const st = useRef({
    x: spring(0, 0.05),
    y: spring(0, 0.05),
    r: spring(angle, 0.01),
    s: spring(1, 0.0005),
    rx: spring(0, 0.01),
    ry: spring(0, 0.01),
    // The angle it settles to; each landing nudges it a little.
    rest: angle,
    landing: false,
    hoverBox: null as DOMRect | null,
    drag: null as null | {
      id: number
      start: Vec
      from: Vec
      lo: Vec
      hi: Vec
      moved: boolean
      trail: { x: number; y: number; t: number }[]
    },
  })
  const interactive = tilt || movable

  const transform = () => {
    const s = st.current
    const lean = s.rx.x || s.ry.x ? ` perspective(${px * 5}px) rotateX(${s.rx.x}deg) rotateY(${s.ry.x}deg)` : ''
    return `translate(${s.x.x}px, ${s.y.x}px)${lean} rotate(${s.r.x}deg) scale(${s.s.x})`
  }

  const run = useFrames((dt) => {
    const s = st.current
    let moving = false
    for (const sp of [s.x, s.y, s.r, s.s, s.rx, s.ry]) if (advance(sp, dt)) moving = true
    // It squashes as it lands, not as it leaves the hand.
    if (s.landing && Math.hypot(s.x.to - s.x.x, s.y.to - s.y.x) < 12) {
      s.landing = false
      aim(s.s, 1, 0.22, 0.5)
      moving = true
    }
    if (el.current) el.current.style.transform = transform()
    return moving || s.drag !== null
  })

  // A new `angle` from the parent becomes the resting angle.
  useEffect(() => {
    const s = st.current
    s.rest = angle
    jump(s.r, angle)
    if (el.current) el.current.style.transform = transform()
  }, [angle])

  /** Where it may go, as translate limits that keep it inside its parent. */
  function limits() {
    const node = el.current!
    const parent = node.parentElement!.getBoundingClientRect()
    const s = st.current
    // Measure the box without the current translate: that is where the layout put it.
    const box = node.getBoundingClientRect()
    const home = { left: box.left - s.x.x, top: box.top - s.y.x, right: box.right - s.x.x, bottom: box.bottom - s.y.x }
    // A few pixels of margin: a new resting angle makes the box a little wider than it was.
    const m = 4
    return {
      lo: { x: parent.left - home.left + m, y: parent.top - home.top + m },
      hi: { x: parent.right - home.right - m, y: parent.bottom - home.bottom - m },
    }
  }

  function onPointerMove(e: PointerEvent<SVGSVGElement>) {
    rest.onPointerMove?.(e)
    const s = st.current
    const d = s.drag
    if (d && e.pointerId === d.id) {
      const now = performance.now()
      d.trail.push({ x: e.clientX, y: e.clientY, t: now })
      while (d.trail.length > 2 && now - d.trail[0].t > 100) d.trail.shift()
      const dx = e.clientX - d.start.x
      const dy = e.clientY - d.start.y
      if (!d.moved && Math.hypot(dx, dy) < 3) return
      d.moved = true
      // 1:1 with the pointer, resisting past the edges of the parent.
      jump(s.x, resist(d.from.x + dx, d.lo.x, d.hi.x, px))
      jump(s.y, resist(d.from.y + dy, d.lo.y, d.hi.y, px))
      // It leans the way it is moving.
      if (!reducedMotion()) aim(s.r, s.rest + clamp(velocity(d.trail).x * 0.012, -14, 14), 0.2)
      run()
      return
    }
    // Hover: lean toward the pointer, only with a real mouse.
    if (!interactive || e.pointerType !== 'mouse' || reducedMotion()) return
    const b = (s.hoverBox ??= e.currentTarget.getBoundingClientRect())
    const nx = clamp(((e.clientX - b.left) / b.width) * 2 - 1, -1, 1)
    const ny = clamp(((e.clientY - b.top) / b.height) * 2 - 1, -1, 1)
    aim(s.rx, -ny * TILT, 0.3)
    aim(s.ry, nx * TILT, 0.3)
    run()
  }

  function onPointerLeave(e: PointerEvent<SVGSVGElement>) {
    rest.onPointerLeave?.(e)
    const s = st.current
    s.hoverBox = null
    if (s.drag) return
    aim(s.rx, 0, 0.3)
    aim(s.ry, 0, 0.3)
    run()
  }

  function onPointerDown(e: PointerEvent<SVGSVGElement>) {
    rest.onPointerDown?.(e)
    if (!movable || e.button !== 0 || st.current.drag) return
    e.preventDefault()
    const s = st.current
    capture(e.currentTarget, e.pointerId)
    e.currentTarget.style.zIndex = String(++topLayer)
    const { lo, hi } = limits()
    s.drag = {
      id: e.pointerId,
      start: { x: e.clientX, y: e.clientY },
      from: { x: s.x.x, y: s.y.x },
      lo,
      hi,
      moved: false,
      trail: [{ x: e.clientX, y: e.clientY, t: performance.now() }],
    }
    s.landing = false
    e.currentTarget.setAttribute('data-held', '')
    if (!reducedMotion()) {
      // It pops into the hand: a quick grow with a little overshoot, and it stops leaning.
      aim(s.s, LIFT, 0.16, 0.6)
      aim(s.rx, 0, 0.2)
      aim(s.ry, 0, 0.2)
    }
    run()
  }

  function onPointerUp(e: PointerEvent<SVGSVGElement>) {
    rest.onPointerUp?.(e)
    const s = st.current
    const d = s.drag
    if (!d || e.pointerId !== d.id) return
    s.drag = null
    e.currentTarget.removeAttribute('data-held')
    if (reducedMotion()) {
      jump(s.x, clamp(s.x.x, d.lo.x, d.hi.x))
      jump(s.y, clamp(s.y.x, d.lo.y, d.hi.y))
      jump(s.s, 1)
      run()
      return
    }
    if (!d.moved) {
      // Only pressed: it pops back down where it was.
      aim(s.s, 1, 0.22, 0.5)
      run()
      return
    }
    // Thrown: it keeps the pointer's speed, slides to where that speed would carry it, and lands.
    const v = velocity(d.trail)
    aim(s.x, clamp(s.x.x + project(v.x), d.lo.x, d.hi.x), 0.4, 0.85)
    aim(s.y, clamp(s.y.x + project(v.y), d.lo.y, d.hi.y), 0.4, 0.85)
    s.x.v = v.x
    s.y.v = v.y
    s.rest = angle + Math.round((Math.random() * 2 - 1) * 6)
    aim(s.r, s.rest, 0.4, 0.7)
    s.landing = true
    run()
  }

  function onKeyDown(e: KeyboardEvent<SVGSVGElement>) {
    rest.onKeyDown?.(e)
    if (!movable) return
    const step = e.shiftKey ? 32 : 8
    const move = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key]
    if (!move) return
    e.preventDefault()
    // The keyboard moves it at once, with no animation.
    const s = st.current
    const { lo, hi } = limits()
    jump(s.x, clamp(s.x.x + move[0], lo.x, hi.x))
    jump(s.y, clamp(s.y.x + move[1], lo.y, hi.y))
    e.currentTarget.style.transform = transform()
  }

  const title = STICKERS[name].title
  const a11y = movable
    ? { role: 'img', 'aria-label': label ?? title, 'aria-roledescription': 'movable sticker', tabIndex: 0 }
    : label
      ? { role: 'img', 'aria-label': label }
      : { 'aria-hidden': true as const }

  return (
    <svg
      viewBox="0 0 128 128"
      width={px}
      height={px}
      {...a11y}
      {...rest}
      ref={el}
      className={cx('die-cut', className)}
      data-sticker={name}
      data-movable={movable || undefined}
      style={{ ...style, transform: interactive || angle ? transform() : style?.transform }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={onPointerLeave}
      onKeyDown={onKeyDown}
      // The markup is the constant drawing above, never user input.
      dangerouslySetInnerHTML={{ __html: drawing(name, prefix) }}
    />
  )
}

/** Rubber band: inside [lo, hi] the value is unchanged; past it, it moves less the further it goes. */
function resist(v: number, lo: number, hi: number, dimension: number) {
  const band = (over: number) => (over * dimension * 0.55) / (dimension + 0.55 * over)
  if (v < lo) return lo - band(lo - v)
  if (v > hi) return hi + band(v - hi)
  return v
}


function velocity(trail: { x: number; y: number; t: number }[]): Vec {
  if (trail.length < 2) return { x: 0, y: 0 }
  const a = trail[0]
  const b = trail[trail.length - 1]
  const dt = (b.t - a.t) / 1000
  if (dt <= 0) return { x: 0, y: 0 }
  return { x: (b.x - a.x) / dt, y: (b.y - a.y) / dt }
}

/** Where a throw would come to rest, with the decay Apple uses for scrolling (0.99 is the snappier rate). */
function project(v: number, rate = 0.99) {
  return ((v / 1000) * rate) / (1 - rate)
}

/* ───────────── Springs ─────────────
   Damping and response as in Apple's two-parameter model: damping 1 doesn't overshoot,
   response is roughly how many seconds it takes to get there. */

type Spring = { x: number; v: number; to: number; damping: number; response: number; rest: number }

const spring = (x: number, rest: number): Spring => ({ x, v: 0, to: x, damping: 1, response: 0.4, rest })

function aim(s: Spring, to: number, response: number, damping = 1) {
  s.to = to
  s.response = response
  s.damping = damping
}

function jump(s: Spring, to: number) {
  s.x = s.to = to
  s.v = 0
}

/** Returns true while the spring is still moving. */
function advance(s: Spring, dt: number) {
  if (s.x === s.to && s.v === 0) return false
  const w = (2 * Math.PI) / s.response
  // Small fixed steps stay stable with a stiff spring, whatever the frame rate.
  for (let left = dt; left > 0; left -= 1 / 240) {
    const h = Math.min(left, 1 / 240)
    s.v += (-w * w * (s.x - s.to) - 2 * s.damping * w * s.v) * h
    s.x += s.v * h
  }
  if (Math.abs(s.x - s.to) < s.rest && Math.abs(s.v) < s.rest * 10) {
    jump(s, s.to)
    return false
  }
  return true
}

function useFrames(tick: (dt: number) => boolean) {
  const latest = useRef(tick)
  latest.current = tick
  const frame = useRef(0)
  useEffect(
    () => () => {
      cancelAnimationFrame(frame.current)
      frame.current = 0
    },
    [],
  )
  return useCallback(() => {
    if (frame.current) return
    let last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30)
      last = now
      frame.current = latest.current(dt) ? requestAnimationFrame(loop) : 0
    }
    frame.current = requestAnimationFrame(loop)
  }, [])
}

/** Keeps a drag tracked outside the element. It throws for a pointer that is already gone. */
function capture(el: Element, pointerId: number) {
  try {
    el.setPointerCapture(pointerId)
  } catch {
    // The drag still works while the pointer stays over the element.
  }
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

const cx = (...names: (string | undefined)[]) => names.filter(Boolean).join(' ')

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches
