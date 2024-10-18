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

// Marker tool buttons
const thinMarkerButton = document.createElement("button");
thinMarkerButton.textContent = "Thin Marker";
const thickMarkerButton = document.createElement("button");
thickMarkerButton.textContent = "Thick Marker";

// Sticker buttons
const sticker1Button = document.createElement("button");
sticker1Button.textContent = "⚽";
const sticker2Button = document.createElement("button");
sticker2Button.textContent = "🚀";
const sticker3Button = document.createElement("button");
sticker3Button.textContent = "🐱";

app.appendChild(titleElement);
app.appendChild(canvas);
app.appendChild(thinMarkerButton);
app.appendChild(thickMarkerButton);
app.appendChild(sticker1Button);
app.appendChild(sticker2Button);
app.appendChild(sticker3Button);
app.appendChild(undoButton);
app.appendChild(redoButton);
app.appendChild(clearButton);

const ctx = canvas.getContext("2d");
let isDrawing = false;
let currentThickness = 1; // Default to thin marker
let currentSticker = ""; // Track selected sticker

const lines: MarkerLine[] = [];
const redoStack: MarkerLine[] = [];
const stickers: Sticker[] = [];
let stickerPreview: StickerPreview | null = null; // Nullable reference for sticker preview

// MarkerLine class that accepts thickness
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
        ctx.lineWidth = this.thickness; // Set the line thickness
        ctx.moveTo(this.points[0].x, this.points[0].y);
        this.points.forEach(point => {
            ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
    }
}

// StickerPreview class to preview where a sticker will be placed
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

// Sticker class for sticker placement and repositioning
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
    lines.forEach(line => line.display(ctx));
    stickers.forEach(sticker => sticker.display(ctx));
    if (!isDrawing && stickerPreview) {
        stickerPreview.draw(ctx);
    }
}

canvas.addEventListener("mousedown", (event) => {
    if (currentSticker) {
        const newSticker = new Sticker(event.offsetX, event.offsetY, currentSticker);
        stickers.push(newSticker);
        currentSticker = ""; // Reset sticker after placement
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

// Tool selection logic
thinMarkerButton.addEventListener("click", () => {
    currentThickness = 1;
    setActiveTool(thinMarkerButton);
});

thickMarkerButton.addEventListener("click", () => {
    currentThickness = 5; // Thicker line
    setActiveTool(thickMarkerButton);
});

sticker1Button.addEventListener("click", () => {
    setupStickerPreview("⚽");
    canvas.dispatchEvent(new Event("tool-moved"));
});

sticker2Button.addEventListener("click", () => {
    setupStickerPreview("🚀");
    canvas.dispatchEvent(new Event("tool-moved"));
});

sticker3Button.addEventListener("click", () => {
    setupStickerPreview("🐱");
    canvas.dispatchEvent(new Event("tool-moved"));
});

// Function to set active tool and provide visual feedback
function setActiveTool(selectedButton: HTMLButtonElement) {
    // Remove the "selectedTool" class from all buttons
    thinMarkerButton.classList.remove("selectedTool");
    thickMarkerButton.classList.remove("selectedTool");

    // Add the "selectedTool" class to the selected button
    selectedButton.classList.add("selectedTool");
}

// Redraw when canvas updates
canvas.addEventListener("drawing-changed", () => {
    redraw();
});

canvas.addEventListener("tool-moved", () => {
    redraw();
});
