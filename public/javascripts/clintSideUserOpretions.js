const userHomeOptionsDiv = document.querySelector(".homeLinks");
const userHomeOptions = document.querySelector(".userOptions");

const postFileSpace = document.querySelector("#postFileSpace")
const IgFileSpace = document.querySelector("#IgFileSpace")

const postClossButton = document.querySelector("#postClossBtn");
const igClossButton = document.querySelector("#igClossBtn");

const postOpenButton = document.querySelector("#show-post");
const igOpenButton = document.querySelector("#show-ig");

const postForm = document.querySelector("#post");
const igForm = document.querySelector("#igtv");

const postTexeria = document.querySelector(".post-control");
const igTexeria = document.querySelector(".ig-control");

const submitPost = document.querySelector("#posts");
const submitIg = document.querySelector("#ig");

userHomeOptionsDiv.addEventListener("click",() => {
    userHomeOptions.classList.toggle("hiden");
});

postOpenButton.addEventListener("click",() => {
    postTexeria.value = ""
    postFileSpace.value = ""
    postForm.classList.toggle("hiden")
});
igOpenButton.addEventListener("click",() => {
    igTexeria.value = ""
    IgFileSpace.value = ""
    igForm.classList.toggle("hiden")
});


postClossButton.addEventListener("click", () => {
    postForm.classList.toggle("hiden");
});
igClossButton.addEventListener("click", () => {
    igForm.classList.toggle("hiden");
});
submitPost.addEventListener("click",() => {
    postForm.classList.toggle("hiden");

})
submitIg.addEventListener("click",() => {
    igForm.classList.toggle("hiden");

})



