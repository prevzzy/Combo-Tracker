import { app } from '@electron/remote'

export function buildPatchNotesHtml(patchNotes) {
  const {
    version,
    releaseDate,
    title,
    description,
    downloadLink,
    changelog
  } = patchNotes;

  const changelogHtml = buildChangelogHtml(changelog)

  return `
    ${buildNewUpdateMessageForModal(version, downloadLink)}
    ${buildPatchMetaDataHtml(version, releaseDate)}
    ${buildTitleAndDescriptionHtml(title, description)}
    ${changelogHtml}
  `
}

function buildNewUpdateMessageForModal(version, downloadLink) {
  if (version === app.getVersion()) {
    return ''
  }

  return `
    <div class="row py-3 mx-1 mb-4 bg-primary-dark rounded" >
      <div class="col text-center">
        <div class="text-light font-weight-bold display-5">
          There is an update available
        </div>
        <div class="my-2">
          <a href="${downloadLink}" class="btn btn-primary">
            <div class="font-weight-semibold display-6 py-1 px-1" style="margin-top: -3px">Download Combo Tracker v${version}</div>
          </a>
        </div>
        <small class="text-muted display-8">Unpack .zip to Combo Tracker directory, replace all files and restart the application. All your saved scores will be preserved.</small>
      </div>
    </div>
  `
}

function buildPatchMetaDataHtml(version, date) {
  const parsedDate = parseReleaseDate(date);

  return `
    <div class="row mb-1">
      <div class="col d-flex justify-content-between">
        <div class="text-muted display-8 font-weight-semibold">Update v${version} Overview</div>
        <div class="text-muted display-8 font-weight-semibold">${parsedDate ? parsedDate : ''}</div>
      </div>
    </div>
  `
}

function buildTitleAndDescriptionHtml(title, description) {
  const titleHtml = title ? `<div class="section-title">${title}</div>` : ''
  const descriptionHtml = description ? `<div class="text-light">${description}</div>` : ''

  return `
    <div class="row mb-3 pb-3" style="border-bottom: solid 2px var(--primary-dark)">
      <div class="col">
        ${titleHtml}
        ${descriptionHtml}
      </div>
    </div>
  `
}

function parseReleaseDate(date) {
  try {
    return new Date(date).toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  } catch(error) {
    console.error(error)
  }
}

function buildChangelogHtml(changelog) {
  const changelogSections = changelog.map((section, i) => createChangelogSectionElement(section, i))

  return `
    <div class="row mb-1">
      <div class="col d-flex justify-content-between">
        <div class="text-muted display-8 font-weight-semibold">
          Release Notes
        </div>
      </div>
    </div>
    <div class="row pb-3" style="border-bottom: solid 2px var(--primary-dark)">
      <div class="col">
        ${changelogSections.join('')}
      </div>
    </div>
  `
}


function createChangelogSectionElement(section, i) {
  const {
    sectionName,
    changes
  } = section;
  
  return `
    <div class="section-title ${i === 0 ? 'mt-0' : 'mt-3'} mb-2">${sectionName}</div>
    ${createChangelogChangesList(changes)}
  `

}

function createChangelogChangesList(changes) {
  const changesListItems = changes.map(change => {
    const { title, description } = change

    let descriptionHtml = description
      ? `<span class="text-muted">- ${description}</span>`
      : ''

    return `
      <div class="mb-1">
        <div class="text-light">
          &#x2022; ${title} ${descriptionHtml}
        </div>
      </div>
    `
  })

  return `
    <div>
      ${changesListItems.join('')}
    </div>
  `
}

export function getPatchNotesActions(patchNotes, isManuallyClicked) {
  const {
    downloadLink,
    version,
  } = patchNotes;


  return [
    isManuallyClicked ? null : createDontShowAgainButton(version),
    createDownloadButton(downloadLink)
  ].filter(Boolean)
}

function createDontShowAgainButton(version) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn btn-outline-danger mr-2';
  button.setAttribute('data-dismiss', 'modal');
  button.setAttribute('data-target', '#general-purpose-modal');
  button.innerText = "Don't show again";

  button.addEventListener('click', () => {
    localStorage.setItem('dismissed-update-version', version);
  });

  return button;
}


function createDownloadButton(downloadLink) {
  const button = document.createElement('a');
  button.className = 'btn btn-primary';
  button.href = downloadLink;
  button.innerText = 'Download';
  button.style.fontSize = '0.875rem';

  return button;
}
