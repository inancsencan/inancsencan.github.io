const gallery = document.getElementById("gallery");

// Create a card for each experiment
experiments.forEach((experiment) => {
  const card = document.createElement("a");
  card.classList.add("sketch-card");

  // Link to experiment page
  card.href = `experiment.html?id=${experiment.id}`;

  // Create thumbnail
  const image = document.createElement("img");
  image.src = experiment.thumbnail;
  image.alt = experiment.title;
  image.loading = "lazy";

  // Create title
  const title = document.createElement("h2");
  title.textContent = experiment.title;

  // Assemble card
  card.appendChild(image);
  card.appendChild(title);

  // Add card to gallery
  gallery.appendChild(card);
});
