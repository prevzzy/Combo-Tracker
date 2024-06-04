import { buildPatchNotesHtml, getPatchNotesActions } from './uiPatchNotes';

const closeButton = document.getElementById('hide-general-purpose-modal-button')

closeButton.addEventListener('click', () => {
  const scrollContainer = document.getElementById('general-purpose-modal-scroll-container')
  setTimeout(() => {
    scrollContainer.scrollTo(0, 0)
  }, 120)
})

export function showGeneralPurposeModal() {
  const showModalButton = document.getElementById('general-purpose-modal-button')
  showModalButton.click();
}

function setGeneralPurposeModalBody(body) {
  const modalBody = document.getElementById('general-purpose-modal-body')
  modalBody.innerHTML = ''

  modalBody.innerHTML = body
}

function setModalActions(actions) {
  const actionsContainer = document.getElementById('general-purpose-modal-dynamic-actions');
  actionsContainer.innerHTML = ''

  actions.forEach(action => {
    actionsContainer.appendChild(action)
  })
}

export function setAndShowPatchNotesModal(patchNotes, isManuallyClicked) {
  const body = buildPatchNotesHtml(patchNotes)
  const actions = getPatchNotesActions(patchNotes, isManuallyClicked);

  setGeneralPurposeModalBody(body)
  setModalActions(actions)
  showGeneralPurposeModal()
}
