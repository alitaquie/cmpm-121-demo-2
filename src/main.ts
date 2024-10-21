import "./style.css";

const APP_NAME = "Hello";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;

const titleElement = document.createElement("h1");
titleElement.textContent = APP_NAME;

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.id = "appCanvas";

const clearButton = document.createElement("button");
clearButton.textContent = "Clear Canvas";

const undoButton = document.createElement("button");
undoButton.textContent = "Undo";

const redoButton = document.createElement("button");
redoButton.textContent = "Redo";

const thinMarkerButton = document.createElement("button");
thinMarkerButton.textContent = "Thin Marker";
const thickMarkerButton = document.createElement("button");
thickMarkerButton.textContent = "Thick Marker";

const createStickerButton = document.createElement("button");
createStickerButton.textContent = "Create Custom Sticker";

const exportButton = document.createElement("button");
exportButton.textContent = "Export as PNG";

const initialStickers = ["⚽", "🚀", "🐱"];
const stickerButtons: HTMLButtonElement[] = [];

initialStickers.forEach((sticker) => {
  const stickerButton = document.createElement("button");
  stickerButton.textContent = sticker;
  stickerButtons.push(stickerButton);
  app.appendChild(stickerButton);
});

app.appendChild(titleElement);
app.appendChild(canvas);
app.appendChild(thinMarkerButton);
app.appendChild(thickMarkerButton);
stickerButtons.forEach((button) => app.appendChild(button));
app.appendChild(createStickerButton);
app.appendChild(exportButton);
app.appendChild(undoButton);
app.appendChild(redoButton);
app.appendChild(clearButton);

const ctx = canvas.getContext("2d");
let isDrawing = false;
let currentThickness = 1;
let currentSticker = "";

const lines: MarkerLine[] = [];
const redoStack: MarkerLine[] = [];
const stickers: Sticker[] = [];
let stickerPreview: StickerPreview | null = null;

class MarkerLine {
  private points: { x: number; y: number }[];
  private thickness: number;

  constructor(initialPoint: { x: number; y: number }, thickness: number) {
    this.points = [initialPoint];
    this.thickness = thickness;
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.lineWidth = this.thickness;
    ctx.moveTo(this.points[0].x, this.points[0].y);
    this.points.forEach((point) => {
      ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
  }
}

class StickerPreview {
  private x: number;
  private y: number;
  private sticker: string;

  constructor(x: number, y: number, sticker: string) {
    this.x = x;
    this.y = y;
    this.sticker = sticker;
  }

  updatePosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.font = "24px Arial";
    ctx.fillText(this.sticker, this.x, this.y);
  }
}

class Sticker {
  private x: number;
  private y: number;
  private sticker: string;

  constructor(x: number, y: number, sticker: string) {
    this.x = x;
    this.y = y;
    this.sticker = sticker;
  }

  reposition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.font = "24px Arial";
    ctx.fillText(this.sticker, this.x, this.y);
  }
}

function setupStickerPreview(sticker: string) {
  currentSticker = sticker;
  stickerPreview = new StickerPreview(0, 0, sticker);
}

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  lines.forEach((line) => line.display(ctx));
  stickers.forEach((sticker) => sticker.display(ctx));
  if (!isDrawing && stickerPreview) {
    stickerPreview.draw(ctx);
  }
}

canvas.addEventListener("mousedown", (event) => {
  if (currentSticker) {
    const newSticker = new Sticker(event.offsetX, event.offsetY, currentSticker);
    stickers.push(newSticker);
    currentSticker = "";
    stickerPreview = null;
    canvas.dispatchEvent(new Event("drawing-changed"));
  } else {
    isDrawing = true;
    redoStack.length = 0;
    const initialPoint = { x: event.offsetX, y: event.offsetY };
    const newLine = new MarkerLine(initialPoint, currentThickness);
    lines.push(newLine);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

canvas.addEventListener("mousemove", (event) => {
  if (!isDrawing) {
    if (currentSticker) {
      if (!stickerPreview) {
        stickerPreview = new StickerPreview(event.offsetX, event.offsetY, currentSticker);
      } else {
        stickerPreview.updatePosition(event.offsetX, event.offsetY);
      }
      canvas.dispatchEvent(new Event("tool-moved"));
    }
  } else {
    const currentLine = lines[lines.length - 1];
    currentLine.drag(event.offsetX, event.offsetY);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
  canvas.dispatchEvent(new Event("tool-moved"));
});

clearButton.addEventListener("click", () => {
  lines.length = 0;
  stickers.length = 0;
  redoStack.length = 0;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

undoButton.addEventListener("click", () => {
  if (lines.length > 0) {
    const lastLine = lines.pop();
    if (lastLine) {
      redoStack.push(lastLine);
    }
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

redoButton.addEventListener("click", () => {
  if (redoStack.length > 0) {
    const lastRedo = redoStack.pop();
    if (lastRedo) {
      lines.push(lastRedo);
    }
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

thinMarkerButton.addEventListener("click", () => {
  currentThickness = 1;
  setActiveTool(thinMarkerButton);
});

thickMarkerButton.addEventListener("click", () => {
  currentThickness = 5;
  setActiveTool(thickMarkerButton);
});

stickerButtons.forEach((button, index) => {
  button.addEventListener("click", () => {
    setupStickerPreview(initialStickers[index]);
    canvas.dispatchEvent(new Event("tool-moved"));
  });
});

createStickerButton.addEventListener("click", () => {
  const customSticker = prompt("Enter a custom sticker:", "🌟");
  if (customSticker) {
    initialStickers.push(customSticker);
    const stickerButton = document.createElement("button");
    stickerButton.textContent = customSticker;
    stickerButton.addEventListener("click", () => {
      setupStickerPreview(customSticker);
      canvas.dispatchEvent(new Event("tool-moved"));
    });
    stickerButtons.push(stickerButton);
    app.appendChild(stickerButton);
  }
});

function setActiveTool(selectedButton: HTMLButtonElement) {
  thinMarkerButton.classList.remove("selectedTool");
  thickMarkerButton.classList.remove("selectedTool");
  selectedButton.classList.add("selectedTool");
}

canvas.addEventListener("drawing-changed", () => {
  redraw();
});

canvas.addEventListener("tool-moved", () => {
  redraw();
});

exportButton.addEventListener("click", () => {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = 1024;
  exportCanvas.height = 1024;
  const exportCtx = exportCanvas.getContext("2d")!;

  exportCtx.scale(4, 4); // Scale the canvas 4x in each dimension to fit the new size

  lines.forEach((line) => line.display(exportCtx));
  stickers.forEach((sticker) => sticker.display(exportCtx));

  const dataUrl = exportCanvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = "canvas_export.png";
  link.click();
});
