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

app.appendChild(titleElement);
app.appendChild(canvas);
app.appendChild(thinMarkerButton);
app.appendChild(thickMarkerButton);
app.appendChild(undoButton);
app.appendChild(redoButton);
app.appendChild(clearButton);

const ctx = canvas.getContext("2d");
let isDrawing = false;
let currentThickness = 1; // Default to thin marker

const lines: MarkerLine[] = [];
const redoStack: MarkerLine[] = [];

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

function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    lines.forEach(line => line.display(ctx));
}

canvas.addEventListener("mousedown", (event) => {
    isDrawing = true;
    redoStack.length = 0;
    const initialPoint = { x: event.offsetX, y: event.offsetY };
    const newLine = new MarkerLine(initialPoint, currentThickness);
    lines.push(newLine);
    canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mousemove", (event) => {
    if (!isDrawing) return;
    const currentLine = lines[lines.length - 1];
    currentLine.drag(event.offsetX, event.offsetY);
    canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mouseup", () => {
    isDrawing = false;
});

clearButton.addEventListener("click", () => {
    lines.length = 0;
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

canvas.addEventListener("drawing-changed", () => {
    redraw();
});

canvas.addEventListener("mouseleave", () => {
    isDrawing = false;
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

// Function to set active tool and provide visual feedback
function setActiveTool(selectedButton: HTMLButtonElement) {
    // Remove the "selectedTool" class from all buttons
    thinMarkerButton.classList.remove("selectedTool");
    thickMarkerButton.classList.remove("selectedTool");

    // Add the "selectedTool" class to the selected button
    selectedButton.classList.add("selectedTool");
}
