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

  /** Pixel size for Chart.js canvas from layout slot. */
  canvasSize() {
    const w = Math.round(this.tokens.slideWidthPx * this.slot.widthFrac);
    const h = Math.round(this.tokens.slideHeightPx * this.slot.heightFrac);
    return { width: w, height: h };
  }
}
