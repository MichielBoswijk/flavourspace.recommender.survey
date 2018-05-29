/* Javascript for adding functionality to the Flavourspace recipe recommender survey front-end.
 * This file contains functions for querying the Flavourspace API, keypress events,
 * recipe/ingredient selection, obtaining user selection results, and removing/adding DOM elements.
 *
 * May 2018
 * Michiel Boswijk, michiel.boswijk@gmail.com
 *
 * TODO: check var declarations
 * TODO: check single versus double quotes
 */

/*
 * executions on page load
 */

progress = 0;              // keeps track of the survey progress
dislikedIngredients = []   // keeps track of disliked ingredients
likedRecipes        = []   // keeps track of liked recipes
// searchRecipes();           // initial search for recipes
toggleHideQuestionFive(true);
toggleHideQuestionSix(true);

/* -----------------------------------------------------------------------------
 * functions for API calls
 */

// search for an ingredient in the ingredients database
function searchIngredients(keyword) {
    var query = 'http://52.59.154.51/api/ingredients/?search='.concat(keyword);

    var request = new XMLHttpRequest();
    request.open('GET', query);
    request.setRequestHeader('Content-Type', 'application/json');
    request.setRequestHeader('Authorization', 'Token 062dd53168722a366f6147f413316148a62282b4');

    request.onreadystatechange = function() {
        if (this.readyState === 4) {
            console.log('Status:', this.status);
            console.log('Headers:', this.getAllResponseHeaders());
            console.log('Body:', this.responseText);
            displayIngredientResults(JSON.parse(this.responseText));
        }
    };
    request.send();
}

// search for recipes in the recipe database
function searchRecipes() {
    // TODO: RELATE TO HOW MANY RECIPES ARE RETURNED
    var recipeCount = 50;

    var request = new XMLHttpRequest();
    request.open('GET', 'http://52.59.154.51/api/recipes/?search=&ordering=&vegetarian_flag=&image_url__icontains=JamieOliver&limit=9999999999');
    request.setRequestHeader('Content-Type', 'application/json');
    request.setRequestHeader('Authorization', 'Token 062dd53168722a366f6147f413316148a62282b4');

    request.onreadystatechange = function () {
        if (this.readyState === 4) {
            console.log(this.responseText);
            displayRecipeResults(JSON.parse(this.responseText), recipeCount);
        }
    };
    request.send();
}

/* -----------------------------------------------------------------------------
 * obtaining results functions
 */

// obtain the result of the vegetarian question
 function getVegetarianResult() {
     var vegetarianY = document.getElementById('vegetarianTrue');
     var vegetarianN = document.getElementById('vegetarianFalse');

     if(vegetarianY.checked) {
         return 1;
     } else if (vegetarianN.checked) {
         return 0;
     }
     return -1;
 }

// obtain the result of the dietary restriction question
function getRestrictionsResult() {
    if(document.getElementById("noRestrictionsTrue").checked) {
        return ["none"];
    }
    return $('#restrictions').selectpicker('val');
}

// obtain the result of the experimentation level question
function getExperimentationLevelResult() {
    return $('#experimentation').selectpicker('val');
}

function getDislikedIngredientsResult() {

    return dislikedIngredients;
}

// obtain the recipes that the user indicated to likely enjoy
function getEnjoyedRecipesResult() {
    var selectedIds = []
    var recipeSection = document.getElementById("recipe-section");
    var rows = recipeSection.children;

    for(var i = 0; i < rows.length; i++) {
        var row = rows[i].children;
        for(var j = 0; j < row.length; j++) {
            recipe = row[j];
            titleElement = recipe.children[0];

            if(titleElement.tagName == "SPAN") {
                if(recipeSelected(titleElement.parentNode)) {
                    selectedIds.push(titleElement.id);
                    likedRecipes.push(titleElement.id);
                }
            } else {
                alert("Something went wrong trying to find selected Recipes")
            }
        }
    }
    return selectedIds;
}

/* -----------------------------------------------------------------------------
 * functions related to the restrictions
 */

// function for disabling the restrictions multiple select
function disableRestrictions() {
    if(document.getElementById('noRestrictionsTrue').checked) {
        $('#restrictions').selectpicker('deselectAll');
        $('#restrictions').prop('disabled', true);
        $('#restrictions').selectpicker('refresh');
    } else {
        $('#restrictions').prop('disabled', false);
        $('#restrictions').selectpicker('refresh');
    }
}

/* -----------------------------------------------------------------------------
 * functions related to the ingredient search
 */

// function called on keypress in the ingredient search bar
function processKeypress(event) {
    searchField = document.getElementById('search').value
    clearSearchResults();
    if(searchField.length > 3) {
        // TODO: set delay to avoid duplicate results
        // window.setTimeout(function () {search(searchField)}, 3000);
        searchIngredients(searchField);
    }
}

// function for displaying the results from an ingredient search
function displayIngredientResults(jsonResult) {
    var resultTable = document.getElementById('resultTable');
    var tableBody = document.createElement('tbody');

    for(var i = 0; i < Object.keys(jsonResult).length; i++) {
        var tableRow = document.createElement('tr');
        tableRow.className = 'clickable-row';
        tableRow.style.backgroundColor = 'white';
        tableRow.style.fontWeight = '400';
        // TODO: inline highlight functions?
        tableRow.addEventListener('mouseover', highlightIngredient);
        tableRow.addEventListener('mouseout', dehighlightIngredient);
        tableRow.addEventListener('click', addIngredientToList);

        var tableHeader = document.createElement('th');
        tableHeader.innerHTML = jsonResult[i].name;
        tableRow.appendChild(tableHeader);
        tableBody.appendChild(tableRow);
    }
    resultTable.appendChild(tableBody);
}

// function for highlighting a hovered ingredient in search results
function highlightIngredient(e) {
    this.style.backgroundColor = '#d9edf7';
}

// function for background reset when mouse does not hover ingredient anymore
function dehighlightIngredient(e) {
    this.style.backgroundColor = 'white';
}

// function for removing the ingredient search results
function clearSearchResults() {
    var resultTable = document.getElementById('resultTable');
    while (resultTable.hasChildNodes()) {
        resultTable.removeChild(resultTable.firstChild);
    }
}

// function for adding a clicked ingredient to a list of all selected disliked ingredients
function addIngredientToList(e) {
    var ingredient = this.childNodes[0].innerHTML;

    if(dislikedIngredients.indexOf(ingredient) == -1) {
      document.getElementById("first-selection").innerHTML = "Your dislikes:";
      dislikedIngredients.push(ingredient);

      var selectedList = document.getElementById("selected-dislikes");
      var ingredientElement = document.createElement("li");
      var removeButton = document.createElement("img");

      removeButton.onclick = removeSelectedIngredient;
      removeButton.className = "remove";
      removeButton.src = "cross.png";

      ingredientElement.className = "list-group-item selected-ingredient";
      ingredientElement.innerHTML = ingredient;
      ingredientElement.appendChild(removeButton);

      selectedList.appendChild(ingredientElement);
    } else {
      alert("You already selected this ingredient");
    }
}

// function called when user clicks on remove button of a disliked ingredient
function removeSelectedIngredient(e) {
    var parent = document.getElementById("selected-dislikes");
    this.parentNode.parentNode.removeChild(this.parentNode);
    var ingredient = this.parentNode.innerHTML.split("<img")[0];

    dislikedIngredients.splice(dislikedIngredients.indexOf(ingredient), 1);

    if(dislikedIngredients.length == 0) {
        var selectionIndicator = document.getElementById("first-selection");
        selectionIndicator.innerHTML = "No disliked ingredients selected";
    }
}

/* -----------------------------------------------------------------------------
 * functions related to liked recipes
 */

// function for creating one recipe element (with title, image and ingredients)
function createRecipeElement(id, title, link, ingredients) {
    recipeElement = document.createElement('div');
    recipeElement.className = 'col-lg-6 recipe';
    mediaElement = document.createElement('div');
    mediaElement.className = 'media';

    // create the title
    titleElement = document.createElement('span');
    titleElement.className = 'recipe-title';
    titleElement.id = id;
    titleElement.innerHTML = title;

    // create the image
    mediaElementLeft = document.createElement('div');
    mediaElementLeft.className = 'media-left';
    imageElement = document.createElement('img');
    imageElement.className = 'media-object';
    imageElement.src = link
    mediaElementLeft.appendChild(imageElement);

    // create ingredients
    mediaElementRight = document.createElement('div');
    mediaElementRight.className = 'media-body';
    ingredientListElement = document.createElement('ul');
    ingredientListElement.className = 'list-group recipe-ingredients';

    for(var i = 0; i < Object.keys(ingredients).length; i++) {
        var listRow = document.createElement('li');
        listRow.className = 'list-group-item';
        listRow.innerHTML = ingredients[i].full_text;
        ingredientListElement.appendChild(listRow);
    }
    mediaElementRight.appendChild(ingredientListElement);

    // add title, image and ingredient list
    recipeElement.appendChild(titleElement);
    mediaElement.appendChild(mediaElementLeft);
    mediaElement.appendChild(mediaElementRight);
    recipeElement.appendChild(mediaElement);

    return recipeElement;
}

// function for displaying the recipes for the user to like
function displayRecipeResults(jsonResult, recipeCount) {
    var allRecipesSection = document.getElementById('recipe-section');
    var allRecipes = jsonResult.results;
    console.log(jsonResult);

    var recipesDisplayedCount = 10;
    var recipesPerRowCount = 2;
    var rowCount = Math.ceil(recipesDisplayedCount / recipesPerRowCount);

    for(var i = 0; i < rowCount; i++) {
        var rowElement = document.createElement('div');
        rowElement.className = 'row';

        for(var j = 0; j < recipesPerRowCount; j++) {
            recipeIndex = getRandomInt(0, recipeCount - 1);

            try{
                var id = allRecipes[recipeIndex].id
            } catch(err) {
                console.log(recipeIndex);
                console.log(allRecipes);
            }
            var title = allRecipes[recipeIndex].title;
            var ingredients = allRecipes[recipeIndex].ingredients;
            var link = allRecipes[recipeIndex].image_url;
            rowElement.appendChild(createRecipeElement(id, title, link, ingredients));
        }
        allRecipesSection.appendChild(rowElement);
    }
    makeRecipesSelectable();
}

// function for adding selection option to all recipes
function makeRecipesSelectable() {
    var recipes = document.getElementsByClassName('recipe');
    for(var i = 0; i < recipes.length; i++) {
        recipes[i].onclick = selectRecipe;
    }
}

// function called when recipe is selected, adds styling to indicate selection
function selectRecipe(e) {
    if(recipeSelected(this)) {
        this.style.borderRadius = '0px';
        this.style.border = 'none';
        this.style.backgroundColor = '#f9f9f9';
        this.className = this.className.replace(" selected", "");
    } else {
        this.style.borderRadius = "5px";
        this.style.border = 'thin solid #bce8f1';
        this.style.backgroundColor = '#d9edf7';
        this.className = this.className.concat(" selected");
    }
}

// function for checking whether a recipe is selected or not
function recipeSelected(element) {
    if(element.className.indexOf("selected") !== -1) {
        return true;
    }
    return false;
}

/* -----------------------------------------------------------------------------
 * functions for regulating the user progress
 */

// function for adding one step of progress to the progress bar
function addProgress(steps) {
    var questionCount = 5;
    var likedRecipeCount = 10;
    var percentageStep = 100 / (questionCount + likedRecipeCount - 1);

    if(progress < 99) {
        var progressElement = document.getElementById("question-progress");
        var percentageCompleted = progress + (steps * percentageStep);
        if(percentageCompleted >= 100) {
            percentageCompleted = 100;
        }
        progressElement.style.width = Math.round(percentageCompleted).toString().concat("%");
        progressElement.innerHTML = Math.round(percentageCompleted).toString().concat("% Completed");

        progress = percentageCompleted;
    }
}

// function for gathering all results and checking whether required data is obtained
function obtainResultsFirstStep() {
    var steps = 0

    vegetarianResult = getVegetarianResult();
    if(vegetarianResult == -1) {
        alert("Please indicate whether you are vegetarian or not");
        throw("Not enough data");
    }
    steps++;

    restrictionsResult = getRestrictionsResult();
    if(restrictionsResult.length == 0) {
        alert("Please indicate whether you have dietary restrictions");
        throw("Not enough data");
    }
    steps++;

    experimentationLevelResult = getExperimentationLevelResult();
    if(experimentationLevelResult.length == 0) {
        alert("Please select your experimentation level");
        throw("Not enough data");
    }
    steps++;

    dislikedIngredientsResult = getDislikedIngredientsResult;
    steps++;

    hideQuestionOne();
    hideQuestionTwo();
    hideQuestionThree();
    hideQuestionFour();

    addProgress(steps);

    toggleHideQuestionFive(false);
    searchRecipes();
    var finishButton = document.getElementById("finish-button");
    finishButton.innerHTML = "Select";
    finishButton.onclick = obtainResultsSecondStep;
}

// function for gathering the results of the liked recipes
function obtainResultsSecondStep() {
    addProgress(getEnjoyedRecipesResult().length);
    // TODO create global for this purpose
    if(likedRecipes.length >= 10) {
        toggleHideQuestionFive(true);
        var finishButton = document.getElementById("finish-button");
        finishButton.onclick = obtainResultsThirdStep;
        toggleHideQuestionSix(false);
    } else {
        refreshRecipes();
    }
}

function obtainResultsThirdStep() {
    console.log("Getting your recommendation ratings");
}

/* -----------------------------------------------------------------------------
 * functions for hiding and displaying questions
 */

function hideQuestionOne(hide) {
    document.getElementById("question1").style.display = "none";
    document.getElementById("subtext1").style.display = "none";
    document.getElementById("yes-radio").style.display = "none";
    document.getElementById("no-radio").style.display = "none";
}

function hideQuestionTwo() {
    document.getElementById("question2").style.display = "none";
    document.getElementById("subtext2").style.display = "none";
    document.getElementById("restrictions-check").style.display = "none";
    $('.selectpicker').selectpicker('hide'); // TODO: Hides also picker of q3
}

function hideQuestionThree() {
    document.getElementById("question3").style.display = "none";
    document.getElementById("subtext3").style.display = "none";
    document.getElementById("experimentation").style.display = "none";
    $('.selectpicker').selectpicker('hide'); // TODO: Hides also picker of q2
}

function hideQuestionFour() {
    document.getElementById("question4").style.display = "none";
    document.getElementById("subtext4").style.display = "none";
    document.getElementById("disliked-ingredients").style.display = "none";
}

function toggleHideQuestionFive(hide) {
    if(hide) {
        document.getElementById("question5").style.display = "none";
        document.getElementById("subtext5").style.display = "none";
        document.getElementById("recipe-section").style.display = "none";
    } else {
        document.getElementById("question5").style.display = "block";
        document.getElementById("subtext5").style.display = "block";
        document.getElementById("recipe-section").style.display = "block";
    }
}

function toggleHideQuestionSix(hide) {
    if(hide) {
        document.getElementById("question6").style.display = "none";
        document.getElementById("subtext6").style.display = "none";
        document.getElementById("recommendation-section").style.display = "none";
    } else {
        document.getElementById("question6").style.display = "block";
        document.getElementById("subtext6").style.display = "block";
        document.getElementById("recommendation-section").style.display = "block";
    }
}

/* -----------------------------------------------------------------------------
 * helper functions
 */

// function for returning a random integer within a range
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function refreshRecipes() {
    var recipesSection = document.getElementById("recipe-section");
    while (recipesSection.firstChild) {
        recipesSection.removeChild(recipesSection.firstChild);
    }
    searchRecipes();
}

function showUsers() {
    var request = new XMLHttpRequest();

    request.open('GET', 'http://52.59.154.51/api/users/');
    request.setRequestHeader('Content-Type', 'application/json');
    request.setRequestHeader('Authorization', 'Token 062dd53168722a366f6147f413316148a62282b4');

    request.onreadystatechange = function () {
      if (this.readyState === 4) {
        console.log('Status:', this.status);
        console.log('Headers:', this.getAllResponseHeaders());
        console.log('Body:', this.responseText);
      }
    };
    request.send();
}

function testAddUser() {
    var request = new XMLHttpRequest();

    request.open('POST', 'http://52.59.154.51/api/users/');

    request.setRequestHeader('Content-Type', 'application/json');
    request.setRequestHeader('Authorization', 'Token 062dd53168722a366f6147f413316148a62282b4');

    request.onreadystatechange = function () {
      if (this.readyState === 4) {
        console.log('Status:', this.status);
        console.log('Headers:', this.getAllResponseHeaders());
        console.log('Body:', this.responseText);
      }
    };

    var body = {
        'user_id': '101',
        'default_location': 'TR',
        'favourite_recipes': [3, 4],
        'vegetarian_flag': true,
        'avoid_ingredients': [1952],
        'allergies': []
    };

    request.send(JSON.stringify(body));
}
