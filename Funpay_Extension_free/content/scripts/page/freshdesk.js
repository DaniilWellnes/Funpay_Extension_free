const urlParams = new URLSearchParams(window.location.search);

document.querySelector("#ticket_fields_1").value = urlParams.get("name");
document.querySelector("#ticket_fields_2").value = urlParams.get("order");
document.querySelector("#ticket_fields_3 #ticket_fields_3_1").checked = true;

document.querySelector(`#ticket_fields_5 `).removeAttribute("disabled");
document.querySelector(`#ticket_fields_5 option[value="${urlParams.get("type") == "review" ? "203" : "201"}"]`).selected = true;