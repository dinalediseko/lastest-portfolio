const form = document.querySelector("[data-form]");
const result = document.querySelector("[data-result]");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const entries = new FormData(event.target);
  const { dividend, divider } = Object.fromEntries(entries);

  // Non‑numeric input → critical error
  if (isNaN(dividend) || isNaN(divider)) {
    document.body.innerHTML = `
      <div class="critical-error">
        Something critical went wrong.<br>Please reload the page.
      </div>`;
    console.error("Invalid input provided. Both values must be numbers.");
    return;
  }

  // Empty fields
  if (dividend === "" || divider === "") {
    result.innerText = "Division not performed. Both values are required in inputs. Try again";
    console.error("One or both input values are missing.");
    return;
  }

  // Division by zero
  if (divider == 0) {
    result.innerText = "Division not performed. Invalid number provided. Try again";
    console.error("Division by zero error.");
    return;
  }

  // Perform division and floor to whole number if needed
  const divisionResult = dividend / divider;
  if (divisionResult % 1 === 0) {
    result.innerText = divisionResult;
  } else {
    result.innerText = Math.floor(divisionResult);
  }
});