document.querySelectorAll(".sticker").forEach((sticker) => {
  sticker.addEventListener("dragstart", (event) => {
    event.dataTransfer.setData("text", event.target.src);
  });
});
