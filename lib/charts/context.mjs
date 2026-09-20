export class SlideContext {
  constructor({ tokens, slotName = "full", data = {} }) {
    this.tokens = tokens;
    this.slotName = slotName;
    this.data = data;
  }

  get slot() {
    return this.tokens.slot(this.slotName);
  }

  color(index) {
    const colors = this.tokens.seriesColors;
    return colors[index % colors.length];
  }

  /** Pixel size for Chart.js canvas — keep a readable ~2:1 aspect for slide charts. */
  canvasSize() {
    const w = Math.round(this.tokens.slideWidthPx * this.slot.widthFrac);
    const slotH = Math.round(this.tokens.slideHeightPx * this.slot.heightFrac);
    // Never flatter than 2.2:1 (was ~3.2:1 and looked squashed on slide)
    const minH = Math.round(w / 2.2);
    const h = Math.max(slotH, minH);
    return { width: w, height: h };
  }
}
