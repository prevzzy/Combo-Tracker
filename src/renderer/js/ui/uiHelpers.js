export function createElementFromTemplate(templateId) {
  const template = document.getElementById(templateId)
  return document.importNode(template.content, true);
}

export function adjustTextInputUI(isValid, borderElement, elementToAppendTo, messageElementId, message) {
  const existingMessageElement = document.getElementById(messageElementId)
  addValidityBorder(borderElement, isValid)

  if (existingMessageElement) {
    existingMessageElement.remove()
  }

  if (!isValid) {
    appendInvalidMessageBox(messageElementId, elementToAppendTo, message)
  }
}

export function addValidityBorder(input, isValid) {
  if (isValid) {
    input.classList.remove('is-invalid')
    input.classList.add('is-valid')
  } else {
    input.classList.remove('is-valid')
    input.classList.add('is-invalid')
  }
}

export function appendInvalidMessageBox(id, elementToAppendTo, message) {
  const div = document.createElement('div')
  div.classList.add('invalid-feedback', 'invalidMessageBox')
  div.id = id
  div.textContent = message
  div.style = "display: block"
  elementToAppendTo.appendChild(div)
}

export function createTextElement(desiredElement, classesString, elementToAppendTo, message) {
  const element = document.createElement(desiredElement);

  if (!element) {
    return message
  }

  element.classList.add(...classesString.split(' '))
  element.textContent = message
  elementToAppendTo.appendChild(element)
}

export function setItemDisplay(item, display) {
  item.style.display = display;
}

export function colorComboPropertyText(element, value, dangerThreshold,  warningThreshold = 1) {
  element.classList.remove('text-danger', 'text-warning', 'text-success')

  if (typeof value !== 'number' || value >= dangerThreshold) {
    element.classList.add('text-danger')
  } else if (value >= warningThreshold) {
    element.classList.add('text-warning')
  } else {
    element.classList.add('text-success')
  }
}

export function setActiveNavigationClasses(navElement, target) {
  navElement === target
    ? navElement.classList.add('active')
    : navElement.classList.remove('active')
}
