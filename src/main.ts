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

// Create a clear button
const clearButton = document.createElement("button");
clearButton.textContent = "Clear Canvas";

// Append elements to the app
app.appendChild(titleElement);
app.appendChild(canvas);
app.appendChild(clearButton);


const ctx = canvas.getContext("2d");
let isDrawing = false;


canvas.addEventListener("mousedown", (event) => {
    isDrawing = true;
    ctx.beginPath(); 
    ctx.moveTo(event.offsetX, event.offsetY); 
});

canvas.addEventListener("mousemove", (event) => {
    if (!isDrawing) return;
    ctx.lineTo(event.offsetX, event.offsetY); 
    ctx.stroke(); 
});


canvas.addEventListener("mouseup", () => {
    isDrawing = false;
});


clearButton.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
});


canvas.addEventListener("mouseleave", () => {
    isDrawing = false;
});
