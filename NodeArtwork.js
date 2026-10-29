export function nodeArtwork(kind, eventId = "") {
  if (kind === "treasure") return '<img class="node-scene-art node-scene-art--treasure" src="./assets/treasure-chest.png" alt="金色镶边、蓝灰箱体的拱盖宝箱" />';
  if (kind === "anchor") return '<img class="node-scene-art node-scene-art--anchor" src="./assets/anchor-background.png" alt="蓝色光柱中的传送锚点" />';
  const artKind = kind === "event" ? eventId : kind;
  let scene;
  if (artKind === "shop") {
    scene = `<path d="M96 125h208v113H96z" fill="#f9e5b5"/><path d="M83 126l32-61h170l32 61z" fill="#e48076"/>
      <path d="M123 65l-12 61m62-61l-5 61m59-61l5 61m53-61l13 61" stroke="#ffe9ae" stroke-width="24"/>
      <path d="M83 127h234" stroke="#553e54" stroke-width="6"/><rect x="120" y="149" width="160" height="66" rx="8" fill="#6c9ba3"/>
      <path d="M105 219h190v21H105z" fill="#bc865a"/><path d="M128 187l14-26 14 26-14 17z" fill="#a3e6ed"/>
      <rect x="173" y="162" width="27" height="37" rx="5" fill="#e4b8ec"/><path d="M225 191q-15-30 7-32 24 5 7 32z" fill="#f5c664"/>
      <circle cx="320" cy="194" r="25" fill="#ffd564"/><path d="M320 179v30m-9-23h18m-18 16h18" stroke="#b28143" stroke-width="4"/>`;
  } else if (artKind === "cooking_stall") {
    scene = `<path d="M115 200l170 39m-170 0l170-39" stroke="#a37752" stroke-width="15"/>
      <path d="M176 221q-27-27 2-45-2 26 17 9 36 39-19 36z" fill="#ffb260"/>
      <path d="M119 130h162l-15 66H134z" fill="#718693"/><ellipse cx="200" cy="130" rx="81" ry="18" fill="#e3bf75"/>
      <path d="M119 144q-45-25-26 17 4 10 33 8m155-25q45-25 26 17-4 10-33 8" fill="none" stroke="#8b9aab" stroke-width="8"/>
      <path d="M167 102q-23-19 0-37m33 39q-22-28 0-48m33 46q-23-19 0-37" fill="none" stroke="#edf8e5" stroke-width="8" stroke-linecap="round"/>
      <circle cx="175" cy="130" r="8" fill="#93b57c"/><circle cx="226" cy="127" r="10" fill="#e9a06e"/>`;
  } else if (artKind === "lost_seelie") {
    scene = `<path d="M92 232q32-76 76-44t135 44" fill="#759e98"/>
      <path d="M196 69q-48-10-39 38-30 12-6 45 24 35 65 12 34-25 9-49 16-35-29-46z" fill="#a4f4f1"/>
      <path d="M180 154q21 16-7 51 48-7 45-54" fill="#8fdde5"/><ellipse cx="187" cy="117" rx="5" ry="9" fill="#537b91"/>
      <ellipse cx="210" cy="117" rx="5" ry="9" fill="#537b91"/><path d="M192 137q8 6 15-1" fill="none" stroke="#537b91" stroke-width="3"/>
      <path d="M113 92v23m-11-11h22m163 38v23m-11-11h22M259 54v17m-8-8h16" stroke="#fff6c4" stroke-width="4"/>`;
  } else if (artKind === "traveler_mirage") {
    scene = `<path d="M116 228q-5-66 31-116m138 116q5-66-31-116" fill="none" stroke="#c1a1eb" stroke-width="9"/>
      <circle cx="200" cy="94" r="31" fill="#eedb9a"/><path d="M168 82l14-27 36 3 15 31-21-12-20 13z" fill="#fff0be"/>
      <path d="M169 124h62l30 99H139z" fill="#e5d6f4"/><path d="M170 137l-35 43m94-43l35 43" stroke="#b3e5ee" stroke-width="13" stroke-linecap="round"/>
      <ellipse cx="200" cy="233" rx="84" ry="13" fill="#c9a8ef" opacity=".4"/><path d="M100 70v21m-10-10h20m181 6v23m-11-11h22" stroke="#fff2c4" stroke-width="4"/>`;
  } else {
    scene = `<path d="M112 136q0-70 88-70t88 70z" fill="#f4c065"/><path d="M112 137h176v91H112z" fill="#b37a4d"/>
      <path d="M112 142h176m-130 0V83m84 59V83m-87 64v78m90-78v78" stroke="#ffe29b" stroke-width="10"/>
      <rect x="184" y="130" width="32" height="38" rx="7" fill="#ffe5a1"/><circle cx="200" cy="145" r="5" fill="#8e5b42"/>
      <path d="M117 118q82-66 166 0" fill="none" stroke="#fff0ad" stroke-width="7"/>
      <path d="M95 70v23m-11-11h22m198 11v23m-11-11h22" stroke="#fff7c6" stroke-width="4"/>`;
  }
  return `<svg class="node-scene-art" viewBox="0 0 400 270" role="img" aria-label="${kind === "shop" ? "卡通行商小铺" : kind === "anchor" ? "发光的传送锚点" : "事件场景插画"}">
    <rect width="400" height="270" rx="22" fill="#283e50"/><circle cx="200" cy="130" r="113" fill="#53637b" opacity=".55"/>
    <circle cx="70" cy="46" r="3" fill="#ffe9b1"/><circle cx="325" cy="42" r="4" fill="#ffe9b1"/>
    <path d="M0 230q88-29 156 0t244-4v44H0z" fill="#254b4b"/>
    <g stroke="#4e4356" stroke-width="3" stroke-linejoin="round">${scene}</g>
  </svg>`;
}
