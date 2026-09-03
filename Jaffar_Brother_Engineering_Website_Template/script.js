const menuBtn = document.getElementById('menuBtn');
const navLinks = document.getElementById('navLinks');

menuBtn.addEventListener('click',()=>{
    navLinks.classList.toggle('active');
});

function sendMessage(){
    alert("Thank you for contacting Jaffar Brothers Engineering!");
}

const counters=document.querySelectorAll('.counter');

counters.forEach(counter=>{

const updateCounter=()=>{

const target=+counter.getAttribute('data-target');
const count=+counter.innerText;

const increment=target/100;

if(count<target){
counter.innerText=Math.ceil(count+increment);
setTimeout(updateCounter,20);
}
else{
counter.innerText=target;
}

};

updateCounter();

});
