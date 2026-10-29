import { Game } from "./core/Game.js";
import { GameUI } from "./ui/GameUI.js";

const root = document.querySelector("#app");
const ui = new GameUI(root);
const game = new Game(ui);

game.showHome();
function readMonsterRoute() {
  if (game.enemyTurnInProgress && !game.trialSnapshot) { setTimeout(readMonsterRoute,100); return; }
  const match=location.hash.match(/^#monsters(?:\/(.*))?$/);
  if (match) { let id=match[1] || null; try { if(id) id=decodeURIComponent(id); } catch {} game.openMonsterLibrary(id); }
  else if (game.screen==='monsters' || game.trialSnapshot) game.closeMonsterLibrary(false);
}
window.addEventListener('hashchange',readMonsterRoute);
readMonsterRoute();

window.__PAIMON_GAME__ = game;
