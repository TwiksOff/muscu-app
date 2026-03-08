let workout=[]

function showPage(page){

document.querySelectorAll(".page").forEach(p=>p.style.display="none")

document.getElementById(page).style.display="block"

}

function addExercise(){

let name=document.getElementById("exerciseName").value
let reps=document.getElementById("reps").value
let weight=document.getElementById("weight").value

let exercise={name,reps,weight}

workout.push(exercise)

let li=document.createElement("li")
li.innerText=name+" "+reps+" reps "+weight+"kg"

document.getElementById("workoutList").appendChild(li)

}

function saveWorkout(){

let history=JSON.parse(localStorage.getItem("workouts"))||[]

history.push({

date:new Date().toLocaleDateString(),

exercises:workout

})

localStorage.setItem("workouts",JSON.stringify(history))

workout=[]

alert("Entraînement enregistré")

loadHistory()

}

function loadHistory(){

let history=JSON.parse(localStorage.getItem("workouts"))||[]

let list=document.getElementById("historyList")

list.innerHTML=""

history.forEach(w=>{

let li=document.createElement("li")

li.innerText=w.date+" - "+w.exercises.length+" exercices"

list.appendChild(li)

})

}

loadHistory()