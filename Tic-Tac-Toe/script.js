const cells = document.querySelectorAll(".cell");
const statusText = document.getElementById("status");
const restartBtn = document.getElementById("restart");
const themeBtn = document.getElementById("themeBtn");

let board = ["","","","","","","","",""];
let gameOver = false;

const wins = [
[0,1,2],
[3,4,5],
[6,7,8],
[0,3,6],
[1,4,7],
[2,5,8],
[0,4,8],
[2,4,6]
];

cells.forEach(cell=>{
    cell.addEventListener("click", playerMove);
});

function playerMove(){

    let index = this.dataset.index;

    if(board[index] !== "" || gameOver) return;

    board[index] = "X";
    this.textContent = "X";

    if(checkWinner("X")){
        statusText.textContent = "🎉 You Win!";
        return;
    }

    if(isDraw()){
        statusText.textContent = "🤝 Draw!";
        return;
    }

    statusText.textContent = "🤖 AI Thinking...";

    setTimeout(aiMove,500);
}

function aiMove(){

    let empty = [];

    board.forEach((cell,index)=>{
        if(cell==="") empty.push(index);
    });

    if(empty.length===0) return;

    let move = empty[Math.floor(Math.random()*empty.length)];

    board[move] = "O";
    cells[move].textContent = "O";

    if(checkWinner("O")){
        statusText.textContent = "🤖 AI Wins!";
        return;
    }

    if(isDraw()){
        statusText.textContent = "🤝 Draw!";
        return;
    }

    statusText.textContent = "Your Turn (X)";
}

function checkWinner(player){

    for(let pattern of wins){

        let [a,b,c] = pattern;

        if(
            board[a]===player &&
            board[b]===player &&
            board[c]===player
        ){

            cells[a].classList.add("winner");
            cells[b].classList.add("winner");
            cells[c].classList.add("winner");

            gameOver = true;
            return true;
        }
    }

    return false;
}

function isDraw(){

    if(!board.includes("")){
        gameOver = true;
        return true;
    }

    return false;
}

restartBtn.addEventListener("click",()=>{

    board = ["","","","","","","","",""];

    gameOver = false;

    cells.forEach(cell=>{
        cell.textContent = "";
        cell.classList.remove("winner");
    });

    statusText.textContent = "Your Turn (X)";
});

themeBtn.addEventListener("click",()=>{

    document.body.classList.toggle("light");

    if(document.body.classList.contains("light")){
        themeBtn.textContent = "☀️ Light Mode";
    }
    else{
        themeBtn.textContent = "🌙 Dark Mode";
    }
});