let axiom = "F";
let currentString = axiom;

const rules = {
  F: "F+F-F",
};

function applyRule(character) {
  if (rules[character]) {
    return rules[character];
  }

  return character;
}

function generateNextIteration() {
  let nextString = "";

  for (let i = 0; i < currentString.length; i++) {
    let currentCharacter = currentString[i];
    nextString += applyRule(currentCharacter);
  }

  currentString = nextString;
}

console.log("Iteration 0:", currentString);

generateNextIteration();
console.log("Iteration 1:", currentString);

generateNextIteration();
console.log("Iteration 2:", currentString);

generateNextIteration();
console.log("Iteration 3:", currentString);
