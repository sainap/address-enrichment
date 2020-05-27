
function createDefaultElement(items, id, className, parent) {
  let row;
  items.forEach((item) => {
    row = document.createElement('li');
    row.innerHTML = item.title;
    row.id = id;
    row.className = className;
    parent.appendChild(row);
  });
}

function createIncompleteElement(parent, address) {
  const mainAddress = document.createElement('li');
  mainAddress.innerHTML = address;
  mainAddress.contentEditable = 'true';
  mainAddress.id = 'incomplete';
  mainAddress.className = 'multiAddressChild';
  mainAddress.addEventListener('mouseover', () => {
    mainAddress.style.opacity = '0.8';
  });
  mainAddress.addEventListener('mouseleave', () => {
    mainAddress.style.opacity = '1';
  });
  parent.appendChild(mainAddress);
}

function createAmbiguousElement(parent, address, possibilities) {
  const mainAddress = document.createElement('select');
  mainAddress.id = 'address-select';
  mainAddress.className = 'multiAddressChild';
  parent.appendChild(mainAddress);
  const title = document.createElement('option');
  title.innerHTML = address;
  mainAddress.appendChild(title);

  possibilities.forEach((option) => {
    const element = document.createElement('option');
    element.innerHTML = option.title;
    mainAddress.appendChild(element);
  });
}

function createDownloadButton(parent) {
  const btn = document.createElement('button');
  btn.id = 'downloadButton';
  btn.innerHTML = 'Download Cleaned Addresses';
  parent.appendChild(btn);
}

function displayFile(addresses) {

  const inputElement = document.getElementsByClassName('uploadInput')[0];
  const fileUpload = document.getElementById('uploadInput');

  // reset the value of input
  fileUpload.value = '';
  if (inputElement.contains(document.getElementById('downloadButton'))) {
    inputElement.lastChild.remove();
    inputElement.lastChild.remove();
  }

  const results = document.createElement('ol');
  results.id = 'displayedAddresses';
  inputElement.appendChild(results);
  addresses.forEach((address) => {
    const possibilities = validateAddress(address);
    possibilities.then((values) => {
      values = values.items;
      if (values.length === 0) {
        createIncompleteElement(results, address);
      } else if (values.length === 1) {
        createDefaultElement(values, 'correct', 'multiAddressChild', results);
      } else {
        createAmbiguousElement(results, address, values);
      }
    });
  });
  createDownloadButton(inputElement);
}

function readFile() {
  if (this.files[0] == null) {
    return [];
  }
  const reader = new FileReader();
  reader.onload = function () {
    displayFile(reader.result.split('\n'));
  };
  reader.readAsBinaryString(this.files[0]);
}

function downloadAsCSV(arr) {
  let content = arr.map((x) => `"${x}"`);
  content = content.join('\n');

  const exportedFilename = 'export.csv';

  const blob = new Blob([content], { type: 'data:text/csv;charset=utf-8;' });
  if (navigator.msSaveBlob) { // IE 10+
    navigator.msSaveBlob(blob, exportedFilename);
  } else {
    const link = document.createElement('a');
    if (link.download !== 'undefined') {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', exportedFilename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}


function getSelectedAddresses() {
  const cleanedAddresses = [];
  const list = document.getElementsByClassName('multiAddressChild');
  for (let i = 0; i < list.length; i += 1) {
    let address = '';
    if (list[i].options != undefined) {
      address = list[i].value;
    } else {
      address = list[i].innerHTML;
    }
    cleanedAddresses.push(address);
  }
  return cleanedAddresses;
}

function validateAddress(address) {
  const platform = new H.service.Platform({
    apikey: config.apiKey,
  });
  const service = platform.getSearchService();
  return service.geocode({
    q: address,
  });
}


// single address look up
function singleAddressLookUp() {
  const searchbox = document.getElementsByClassName('singleAddressSearch')[0];
  const address = document.getElementById('singleAddressSearchQuery').value;
  const addresses = validateAddress(address);
  const addressList = document.createElement('ul');
  addressList.setAttribute('id', 'address-list');

  // clear data from prior lookups
  if (searchbox.contains(document.getElementById('address-list'))) {
    searchbox.lastChild.remove();
  }

  searchbox.appendChild(addressList);

  addresses.then((values) => {
    createDefaultElement(values.items, 'singleAddressResult', 'singleAddressResult', addressList);
  }, (reason) => {
    console.error(reason);
  });
}


window.onload = function () {
  const fileUpload = document.getElementById('uploadInput');
  const singleAddressSearchButton = document.getElementById('singleAddressSearchButton');
  document.body.addEventListener('click', (event) => {
    if (event.target.id === 'downloadButton') {
      const cleanedAddresses = getSelectedAddresses();
      downloadAsCSV(cleanedAddresses);
    }
  });
  fileUpload.addEventListener('change', readFile);
  singleAddressSearchButton.addEventListener('click', singleAddressLookUp);
};
