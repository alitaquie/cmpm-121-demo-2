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


app.appendChild(titleElement);
app.appendChild(canvas);
