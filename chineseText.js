// Only localize presentation text; source records, routes and combat identifiers stay intact.
const chineseElementLabels = {
  pyro: '火', hydro: '水', cryo: '冰', electro: '雷',
  anemo: '风', geo: '岩', dendro: '草', physical: '物理',
};

export function elementChineseLabel(element) {
  return element == null ? '物理' : chineseElementLabels[element] || '未知元素';
}

// These are Chinese transliterations of the source's Hilichurl names, not official translations.
const hilichurlChineseNames = {
  'Plata Plama': '普拉塔·普拉玛', 'Da Plama': '达·普拉玛',
  'Aba Movo': '阿巴·莫沃', 'Du Plama': '杜·普拉玛',
  'Upa Shato': '乌帕·沙托', 'Plama Lawa': '普拉玛·拉瓦',
  'Movo Lawa': '莫沃·拉瓦', 'Oto Tiga': '奥托·提加', 'Upa': '乌帕',
};

export function localizeGameText(value) {
  let text = String(value ?? '');
  for (const [source, chinese] of Object.entries(hilichurlChineseNames)) {
    text = text.replaceAll(source, chinese);
  }
  return text.replace(/BOSS\s+候选/g, '首领候选').replace(/最终\s+BOSS/g, '最终首领').replace(/\bBOSS\b/g, '首领');
}

export function hasTransliteratedSkill(monster) {
  return monster.skills.some(skill => localizeGameText(skill.name) !== skill.name);
}
