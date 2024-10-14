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


app.appendChild(titleElement);
app.appendChild(canvas);
app.appendChild(clearButton);


const ctx = canvas.getContext("2d");
let isDrawing = false;


const lines: Array<Array<{ x: number; y: number }>> = [];

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
    lines.length = 0; // Clear all lines
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
});


canvas.addEventListener("drawing-changed", () => {
    redraw(); // Redraw the lines whenever the drawing changes
});

canvas.addEventListener("mouseleave", () => {
    isDrawing = false;
});
