import "./style.css";

const APP_NAME = "Fun Sketchbook";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;

const titleElement = document.createElement("h1");
titleElement.textContent = APP_NAME;

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.id = "appCanvas";

const clearButton = document.createElement("button");
clearButton.textContent = "Clear";

const undoButton = document.createElement("button");
undoButton.textContent = "Undo";

const redoButton = document.createElement("button");
redoButton.textContent = "Redo";

const thinPenButton = document.createElement("button");
thinPenButton.textContent = "Thin Pen";

const thickPenButton = document.createElement("button");
thickPenButton.textContent = "Thick Pen";

const createStampButton = document.createElement("button");
createStampButton.textContent = "Create Custom Stamp";

const exportButton = document.createElement("button");
exportButton.textContent = "Export as PNG";

const initialStamps = ["🌸", "✨", "🎉", "🔥", "🍕"];
const stampButtons: HTMLButtonElement[] = [];

initialStamps.forEach((stamp) => {
  const stampButton = document.createElement("button");
  stampButton.textContent = stamp;
  stampButtons.push(stampButton);
  app.appendChild(stampButton);
});

app.appendChild(titleElement);
app.appendChild(canvas);
app.appendChild(thinPenButton);
app.appendChild(thickPenButton);
stampButtons.forEach((button) => app.appendChild(button));
app.appendChild(createStampButton);
app.appendChild(exportButton);
app.appendChild(undoButton);
app.appendChild(redoButton);
app.appendChild(clearButton);

const ctx = canvas.getContext("2d");
let isDrawing = false;
let currentThickness = 2;
let currentColor = getRandomColor();
let currentStamp = "";
let currentRotation = 0;

const lines: PenLine[] = [];
const redoStack: PenLine[] = [];
const stamps: Stamp[] = [];
let stampPreview: StampPreview | null = null;

class PenLine {
  private points: { x: number; y: number }[];
  private thickness: number;
  private color: string;

  constructor(initialPoint: { x: number; y: number }, thickness: number, color: string) {
    this.points = [initialPoint];
    this.thickness = thickness;
    this.color = color;
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.lineWidth = this.thickness;
    ctx.strokeStyle = this.color;
    ctx.moveTo(this.points[0].x, this.points[0].y);
    this.points.forEach((point) => {
      ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
  }
}

class StampPreview {
  // Private properties - only accessible within the class
  private x: number;          // X coordinate of the preview
  private y: number;          // Y coordinate of the preview
  private stamp: string;      // The emoji/character to be displayed
  private rotation: number;   // Current rotation in degrees

  constructor(x: number, y: number, stamp: string, rotation: number) {
    this.x = x;
    this.y = y;
    this.stamp = stamp;
    this.rotation = rotation;
  }

  // Public method - explicitly marked as accessible from outside
  public updatePosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  // Public method - handles rendering of the preview
  public draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate((this.rotation * Math.PI) / 180);  // Rotation preview
    ctx.font = "48px Arial";
    ctx.fillText(this.stamp, 0, 0);
    ctx.restore();
  }
}

/**
 * Stamp class represents a placed stamp on the canvas
 * Updated with consistent access modifier pattern for better maintainability
 */
class Stamp {
  // Private properties - internal state of the stamp
  private x: number;          // X coordinate of the placed stamp
  private y: number;          // Y coordinate of the placed stamp
  private stamp: string;      // The emoji/character being displayed
  private rotation: number;   // Fixed rotation angle in degrees

  constructor(x: number, y: number, stamp: string, rotation: number) {
    this.x = x;
    this.y = y;
    this.stamp = stamp;
    this.rotation = rotation;
  }

  // Public method - provides the rendering interface
  public display(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.font = "36px Arial";
    ctx.fillText(this.stamp, 0, 0);
    ctx.restore();
  }
}


function setupStampPreview(stamp: string, rotation: number) {
  currentStamp = stamp;
  currentRotation = rotation;
  stampPreview = new StampPreview(0, 0, stamp, rotation);
}

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  lines.forEach((line) => line.display(ctx));
  stamps.forEach((stamp) => stamp.display(ctx));
  if (!isDrawing && stampPreview) {
    stampPreview.draw(ctx);
  }
}

canvas.addEventListener("mousedown", (event) => {
  if (currentStamp) {
    const newStamp = new Stamp(event.offsetX, event.offsetY, currentStamp, currentRotation);
    stamps.push(newStamp);
    currentStamp = "";
    stampPreview = null;
    canvas.dispatchEvent(new Event("drawing-changed"));
  } else {
    isDrawing = true;
    redoStack.length = 0;
    const initialPoint = { x: event.offsetX, y: event.offsetY };
    const newLine = new PenLine(initialPoint, currentThickness, currentColor);
    lines.push(newLine);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

canvas.addEventListener("mousemove", (event) => {
  if (!isDrawing) {
    if (currentStamp) {
      if (!stampPreview) {
        stampPreview = new StampPreview(event.offsetX, event.offsetY, currentStamp, currentRotation);
      } else {
        stampPreview.updatePosition(event.offsetX, event.offsetY);
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
  stamps.length = 0;
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

thinPenButton.addEventListener("click", () => {
  currentThickness = 2;
  currentColor = getRandomColor();  // Randomize color on selection
  setActiveTool(thinPenButton);
});

thickPenButton.addEventListener("click", () => {
  currentThickness = 8;
  currentColor = getRandomColor();  // Randomize color on selection
  setActiveTool(thickPenButton);
});

stampButtons.forEach((button, index) => {
  button.addEventListener("click", () => {
    const randomRotation = getRandomRotation();
    setupStampPreview(initialStamps[index], randomRotation);
    canvas.dispatchEvent(new Event("tool-moved"));
  });
});

createStampButton.addEventListener("click", () => {
  const customStamp = prompt("Enter a custom stamp:", "🌟");
  if (customStamp) {
    initialStamps.push(customStamp);
    const stampButton = document.createElement("button");
    stampButton.textContent = customStamp;
    stampButton.addEventListener("click", () => {
      const randomRotation = getRandomRotation();
      setupStampPreview(customStamp, randomRotation);
      canvas.dispatchEvent(new Event("tool-moved"));
    });
    stampButtons.push(stampButton);
    app.appendChild(stampButton);
  }
});

exportButton.addEventListener("click", () => {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = 1024;
  exportCanvas.height = 1024;
  const exportCtx = exportCanvas.getContext("2d")!;

  exportCtx.scale(4, 4);  // Scale the canvas 4x in each dimension to fit the new size

  lines.forEach((line) => line.display(exportCtx));
  stamps.forEach((stamp) => stamp.display(exportCtx));

  const dataUrl = exportCanvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = "sketch.png";
  link.click();
});

function setActiveTool(activeButton: HTMLElement) {
  [thinPenButton, thickPenButton, ...stampButtons].forEach((button) => {
    button.style.backgroundColor = "";
  });
  activeButton.style.backgroundColor = "lightgray";
}

function getRandomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function getRandomRotation() {
  return Math.floor(Math.random() * 360);
}

canvas.addEventListener("drawing-changed", redraw);
canvas.addEventListener("tool-moved", redraw);