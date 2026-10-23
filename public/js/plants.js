/** Shared inline plant artwork for the tracker and landing preview. */
export function plantSVG(stage, color) {
  const accent = { sage:'#86a982', moss:'#a0ad68', sky:'#82aebb', lavender:'#a28ab5', peach:'#d58b71', butter:'#c8ad58' }[color] || '#86a982';
  const height = [0, 1, 2, 3, 4][stage];
  const small = '<path d="M60 83V69" stroke="#58805c" stroke-width="4" stroke-linecap="round"/><path d="M60 75c-10-1-13-8-12-13 8-1 13 4 12 13Z" fill="#83ae7e"/><path d="M60 71c1-8 7-11 13-10 1 7-5 11-13 10Z" fill="#a8c795"/>';
  const sprout = '<path d="M60 84V55" stroke="#58805c" stroke-width="4.5" stroke-linecap="round"/><path d="M60 73c-12 0-16-9-14-16 10-1 16 6 14 16Z" fill="#75a36f"/><path d="M60 65c1-11 9-16 17-14 1 9-7 15-17 14Z" fill="#a9c993"/><path d="M60 56c-2-8 2-15 8-18 5 7 2 14-8 18Z" fill="#87b77d"/>';
  const leafy = '<path d="M60 84V42" stroke="#547c58" stroke-width="5" stroke-linecap="round"/><path d="M60 75c-16 1-21-10-19-18 13-2 21 7 19 18Z" fill="#6f9e6c"/><path d="M60 69c2-15 13-20 23-17 1 12-9 20-23 17Z" fill="#a9cb91"/><path d="M60 57c-3-12 3-21 12-24 8 10 4 20-12 24Z" fill="#81b47b"/><path d="M60 79c11 0 15-7 14-13-9-1-15 5-14 13Z" fill="#bdd69e"/>';
  const flower = `<g transform="translate(60 31)"><ellipse cy="-12" rx="7" ry="12" fill="#efb0a4"/><ellipse cy="12" rx="7" ry="12" fill="#e99b98"/><ellipse cx="-12" rx="12" ry="7" fill="#efb0a4"/><ellipse cx="12" rx="12" ry="7" fill="#e99b98"/><ellipse cx="-8.5" cy="-8.5" rx="7" ry="11" transform="rotate(-45 -8.5 -8.5)" fill="#f4c0ae"/><ellipse cx="8.5" cy="8.5" rx="7" ry="11" transform="rotate(-45 8.5 8.5)" fill="#e99b98"/><circle r="7" fill="${accent}"/><circle cx="-2" cy="-2" r="1.5" fill="#fff1ba"/></g>`;
  const plantGrowth = height === 0 ? small : height === 1 ? sprout : leafy;
  const upperLeaves = plantGrowth;
  const extraLeaf = height >= 3 ? '<path d="M60 51c-13 0-18-8-16-15 10-1 17 5 16 15Z" fill="#b8d49c"/><path d="M60 61c13 0 19-8 17-15-11-1-18 5-17 15Z" fill="#79a874"/>' : '';
  const bloomMarkup = height === 4 ? flower : '';
  const seed = height === 0 ? '<ellipse cx="51" cy="82" rx="5" ry="6.5" transform="rotate(-24 51 82)" fill="#bd8960"/><path d="M51 78c1-3 3-4 5-4" fill="none" stroke="#e4b78c" stroke-width="1.5" stroke-linecap="round"/>' : '';
  return `<svg viewBox="0 0 120 120" role="img" aria-label="${['seed','sprout','small plant','leafy plant','blooming plant'][stage]}"><path d="M28 83c7-8 16-11 29-9 15-3 27 0 35 9v7H28Z" fill="#a87955"/><path d="M34 87h52l-6 27H40Z" fill="#d69372"/><path d="M34 88h52l-2 8H36Z" fill="#e7a282"/><path d="M43 101h34" stroke="#c77f65" stroke-width="2" stroke-linecap="round" opacity=".7"/><path d="M54 109l1 3m10-3-1 3" stroke="#b86f5b" stroke-width="2" stroke-linecap="round"/><path d="M28 84h64" stroke="#8c654e" stroke-width="3" stroke-linecap="round"/>${upperLeaves}${extraLeaf}${bloomMarkup}${seed}</svg>`;
}
