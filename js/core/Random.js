export class Random {
  constructor(seed = Date.now()) {
    this.seed = Math.abs(Number(seed)) % 2147483647 || 1;
  }

  next() {
    this.seed = (this.seed * 48271) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  integer(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick(items) {
    return items[this.integer(0, items.length - 1)];
  }

  shuffle(items) {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const target = this.integer(0, index);
      [copy[index], copy[target]] = [copy[target], copy[index]];
    }
    return copy;
  }
}
