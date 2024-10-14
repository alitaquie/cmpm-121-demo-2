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

app.appendChild(titleElement);
app.appendChild(canvas);
app.appendChild(undoButton);
app.appendChild(redoButton);
app.appendChild(clearButton);

const ctx = canvas.getContext("2d");
let isDrawing = false;
const lines: Array<Array<{ x: number; y: number }>> = [];
const redoStack: Array<Array<{ x: number; y: number }>> = [];

function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); 
    lines.forEach((line) => {
        ctx.beginPath();
        ctx.moveTo(line[0].x, line[0].y); 
        line.forEach((point) => {
            ctx.lineTo(point.x, point.y); 
        });
        ctx.stroke(); 
    });
}

canvas.addEventListener("mousedown", (event) => {
    isDrawing = true;
    redoStack.length = 0; 
    lines.push([]); 
    const point = { x: event.offsetX, y: event.offsetY };
    lines[lines.length - 1].push(point); 
    canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mousemove", (event) => {
    if (!isDrawing) return;
    const point = { x: event.offsetX, y: event.offsetY };
    lines[lines.length - 1].push(point); 
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

// Redo button click event
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
    redraw(); // Redraw the lines whenever the drawing changes
});

canvas.addEventListener("mouseleave", () => {
    isDrawing = false;
});
