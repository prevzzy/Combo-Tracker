const disallowedSubstrings = [
  'SHIFT',
  'ALTGRAPH',
  'ALT',
  'CONTROL',
  'META',
  'ARROW',
  'NUMLOCK',
  'DEAD',
]

// to prevent things like ę ą ó ż ź etc
const disallowedCharactersRegex = /[^A-Za-z0-9\!\@\#\$\%\^\&\*\(\)\-\_\=\+\[\]\{\}\\\|\;\:\'\"\,\<\.\>\/\?\`\~]/g

function checkForDisallowedSubstring(string) {
  return disallowedSubstrings.find((substring) =>
    string.includes(substring)
  )
}

export function mapKeyToAccelerator(key, shiftKey, altKey, ctrlKey, metaKey) {
  let accelerator = key.toUpperCase()

  
  const disallowedCharactersMatch = accelerator.match(disallowedCharactersRegex)
  
  if (!accelerator || metaKey || disallowedCharactersMatch) {
    return
  }

  const foundDisallowedSubstring = checkForDisallowedSubstring(accelerator)
  if (foundDisallowedSubstring) {
    const substringRe = new RegExp(foundDisallowedSubstring)
    accelerator = accelerator.replace(substringRe, '');
  }
  
  if (accelerator.length) {
    if (altKey) {
      accelerator = `Alt + ${accelerator}`
    }

    if (shiftKey) {
      accelerator = `Shift + ${accelerator}`
    }

    if (ctrlKey) {
      accelerator = `Ctrl + ${accelerator}`
    }
  }

  return accelerator.toUpperCase()
}
