console.log("Google Maps Sticker Tool: Content script loaded.");

function addSticker(src, x = 0, y = 0) {
  const stickerContainer = document.createElement("div");
  stickerContainer.classList.add("sticker-container"); // Add this class
  stickerContainer.style.position = "absolute";
  stickerContainer.style.left = `${x}px`;
  stickerContainer.style.top = `${y}px`;
  stickerContainer.style.width = "100px";
  stickerContainer.style.height = "auto";
  stickerContainer.style.cursor = "move";
  stickerContainer.style.zIndex = "9999999";

  const sticker = document.createElement("img");
  sticker.classList.add("sticker");
  sticker.src = src;
  sticker.style.width = "100%";
  sticker.style.height = "auto";

  stickerContainer.appendChild(sticker);

  const closeBtn = document.createElement("span");
  closeBtn.innerHTML = "&#10006;";
  closeBtn.classList.add("close-sticker"); // Add this class
  closeBtn.style.color = "red";
  closeBtn.style.position = "absolute";
  closeBtn.style.right = `0`;
  closeBtn.style.top = `-12px`;
  closeBtn.style.width = "10px";
  closeBtn.style.height = "10px";
  closeBtn.style.cursor = "pointer";
  stickerContainer.appendChild(closeBtn);

  document.body.appendChild(stickerContainer);

  sticker.addEventListener("mousedown", startDrag);
  closeBtn.addEventListener("click", function (event) {
    event.target.parentElement.remove();
  });
  addStickerControls(stickerContainer);
}

function bgLayer(action) {
  if (action == "add") {
    const smootherDiv = document.createElement("div");
    smootherDiv.id = "smoothing-container";
    smootherDiv.style.position = "absolute";
    smootherDiv.style.width = "100%";
    smootherDiv.style.height = "100%";
    document.body.append(smootherDiv);
  }

  if (action == "remove") {
    document.querySelector("#smoothing-container").remove();
  }
}

function startDrag(event) {
  event.preventDefault(); // Prevent any default action

  bgLayer("add");

  const stickerContainer = event.target.closest("div");
  let shiftX = event.clientX - stickerContainer.getBoundingClientRect().left;
  let shiftY = event.clientY - stickerContainer.getBoundingClientRect().top;

  // Store the initial position before moving
  let initialLeft = stickerContainer.style.left;
  let initialTop = stickerContainer.style.top;

  function moveAt(pageX, pageY) {
    // Temporarily move the sticker to the new position
    stickerContainer.style.left = `${pageX - shiftX}px`;
    stickerContainer.style.top = `${pageY - shiftY}px`;

    // Check for collisions with other stickers
    let hasCollision = false;
    document.querySelectorAll(".sticker-container").forEach((otherSticker) => {
      if (
        otherSticker !== stickerContainer &&
        isOverlapping(stickerContainer, otherSticker)
      ) {
        hasCollision = true;
      }
    });

    // If there's a collision, revert to the initial position
    if (hasCollision) {
      stickerContainer.style.left = initialLeft;
      stickerContainer.style.top = initialTop;
    } else {
      // Update the initial position if no collision occurred
      initialLeft = stickerContainer.style.left;
      initialTop = stickerContainer.style.top;
    }
  }

  moveAt(event.pageX, event.pageY);

  function onMouseMove(event) {
    moveAt(event.pageX, event.pageY);
  }

  document.addEventListener("mousemove", onMouseMove);

  document.addEventListener("mouseup", function onMouseUp() {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
    bgLayer("remove");
  });
}

function addStickerControls(stickerContainer) {
  // Create and style the resize handle
  const resizeHandle = document.createElement("div");
  resizeHandle.classList.add("resize-handle");
  resizeHandle.style.width = "10px";
  resizeHandle.style.height = "10px";
  resizeHandle.style.background = "blue";
  resizeHandle.style.position = "absolute";
  resizeHandle.style.right = "0px";
  resizeHandle.style.bottom = "0px";
  resizeHandle.style.cursor = "nwse-resize";

  stickerContainer.appendChild(resizeHandle);

  resizeHandle.addEventListener("mousedown", startResize);

  // Add rotation capability to the container, not just the image
  stickerContainer.addEventListener("wheel", rotateSticker);
}

function startResize(event) {
  event.stopPropagation(); // Prevent triggering drag

  bgLayer("add");

  const stickerContainer = event.target.parentElement;
  const stickerImg = stickerContainer.querySelector("img");
  let startX = event.clientX;
  let startY = event.clientY;
  let startWidth = stickerContainer.offsetWidth;
  let startHeight = stickerContainer.offsetHeight;
  const aspectRatio = startWidth / startHeight;

  document.body.style.userSelect = "none";

  function resize(event) {
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    const newWidth = startWidth + dx;
    const newHeight = newWidth / aspectRatio;

    // Temporarily apply the new dimensions
    stickerContainer.style.width = `${newWidth}px`;
    stickerContainer.style.height = `${newHeight}px`;
    stickerImg.style.width = "100%";
    stickerImg.style.height = "100%";

    // Check for collisions with other stickers
    let hasCollision = false;
    document.querySelectorAll(".sticker-container").forEach((otherSticker) => {
      if (
        otherSticker !== stickerContainer &&
        isOverlapping(stickerContainer, otherSticker)
      ) {
        hasCollision = true;
      }
    });

    // If there's a collision, revert the resize
    if (hasCollision) {
      stickerContainer.style.width = `${startWidth}px`;
      stickerContainer.style.height = `${startHeight}px`;
    }
  }

  function stopResize() {
    document.body.style.userSelect = "";
    document.removeEventListener("mousemove", resize);
    document.removeEventListener("mouseup", stopResize);
    bgLayer("remove");
  }

  document.addEventListener("mousemove", resize);
  document.addEventListener("mouseup", stopResize);
}

function rotateSticker(event) {
  event.preventDefault(); // Prevent page scroll
  const stickerContainer = event.currentTarget; // Rotate the container
  const currentRotation =
    parseFloat(stickerContainer.getAttribute("data-rotation")) || 0;
  const newRotation = currentRotation + (event.deltaY > 0 ? 10 : -10);
  stickerContainer.style.transform = `rotate(${newRotation}deg)`;
  stickerContainer.setAttribute("data-rotation", newRotation);
}

function isOverlapping(sticker1, sticker2) {
  const rect1 = sticker1.getBoundingClientRect();
  const rect2 = sticker2.getBoundingClientRect();

  return !(
    rect1.right < rect2.left ||
    rect1.left > rect2.right ||
    rect1.bottom < rect2.top ||
    rect1.top > rect2.bottom
  );
}

document.addEventListener("dragover", function (event) {
  event.preventDefault(); // Prevent the default behavior for dragover
});

document.addEventListener("drop", function (event) {
  event.preventDefault(); // Prevent the default behavior for dragover
  event.stopPropagation();
  const img = event.dataTransfer.getData("text");
  addSticker(img, event.clientX, event.clientY);
});
