// ============================= HARMONOGRAMY ===========================
window.formatRepeatDays = function(daysArray) {
  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];
  
  if (!Array.isArray(daysArray) || daysArray.length === 0) {
    return t.repeatOnce;
  }
  
  const allDays = [1, 2, 3, 4, 5, 6, 7];
  const weekdays = [1, 2, 3, 4, 5];
  const weekend = [6, 7];
  
  const sortedDays = [...daysArray].sort((a, b) => a - b);
  
  if (JSON.stringify(sortedDays) === JSON.stringify(allDays)) {
    return t.everydayLabel;
  }
  
  if (JSON.stringify(sortedDays) === JSON.stringify(weekdays)) {
    return t.weekdaysLabel;
  }
  
  if (JSON.stringify(sortedDays) === JSON.stringify(weekend)) {
    return t.weekendLabel;
  }
  
  const dayMap = {
    1: t.calendarWeekdayMon,
    2: t.calendarWeekdayTue,
    3: t.calendarWeekdayWed,
    4: t.calendarWeekdayThu,
    5: t.calendarWeekdayFri,
    6: t.calendarWeekdaySat,
    7: t.calendarWeekdaySun
  };
  
  const dayNames = sortedDays.map(day => dayMap[day] || day);
  return dayNames.join(', ');
};

window.setupWeekdayCheckboxes = function() {
  const modalContent = window.scheduleEditModal ? window.scheduleEditModal.querySelector('.modal') : null;
  if (!modalContent) return;
  
  const checkboxes = modalContent.querySelectorAll('.weekday-checkbox-input');
  const selectedDaysText = modalContent.querySelector('#selectedDaysText');
  
  if (!selectedDaysText || checkboxes.length === 0) return;
  
  const updateSelectedDaysText = () => {
    const selectedDays = [];
    checkboxes.forEach(checkbox => {
      if (checkbox.checked) {
        selectedDays.push(parseInt(checkbox.value));
      }
    });
    
    selectedDays.sort((a, b) => a - b);
    selectedDaysText.textContent = window.formatRepeatDays(selectedDays);
  };
  
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', updateSelectedDaysText);
  });
  
  updateSelectedDaysText();
};

window.loadBillboardsForSchedule = async function() {
  if (window.billboardsCache && window.billboardsCache.expires > Date.now()) {
    window.populateBillboardSelect(window.billboardsCache.data);
    return;
  }
  
  try {
    const lang = window.getCookie("language") || "pl";
    const t = window.translations[lang];
    
    if (window.scheduleBillboardSelect) {
      window.scheduleBillboardSelect.innerHTML = `<option value="">${t.selectBillboardPlaceholder}</option>`;
    }
    
    if (window.scheduleList) {
      window.scheduleList.innerHTML = `<p>${t.noScheduleSelected}</p>`;
    }
    
    const res = await fetch("/api/telebimlist", {
      credentials: 'include'
    });
    
    if (!res.ok) {
      if (res.status === 401) {
        window.showToast("Sesja wygasła. Zaloguj się ponownie.", "error");
        window.location.href = '/';
        return;
      }
      throw new Error(t.scheduleErrorLoadingBillboards);
    }
    
    const billboards = await res.json();
    
    const uniqueBillboardsMap = new Map();
    billboards.forEach(b => {
      if (!uniqueBillboardsMap.has(b.uuid)) {
        uniqueBillboardsMap.set(b.uuid, b);
      }
    });
    
    const uniqueBillboards = Array.from(uniqueBillboardsMap.values());
    
    const formattedBillboards = uniqueBillboards.map(b => ({
      uuid: b.uuid,
      name: b.name,
      is_connected: b.is_connected,
      group_id: b.group_id
    }));
    
    window.billboardsCache = {
      data: formattedBillboards,
      expires: Date.now() + 30000
    };
    
    window.populateBillboardSelect(formattedBillboards);
    
  } catch (err) {
    console.error("Błąd ładowania urządzeń:", err);
    const lang = window.getCookie("language") || "pl";
    const t = window.translations[lang];
    window.showToast(t.scheduleErrorLoadingBillboards, "error");
    
    if (window.scheduleList) {
      window.scheduleList.innerHTML = `
        <div class="error-message">
          <div style="font-size: 48px; margin-bottom: 10px; color: var(--danger);">❌</div>
          <p>${t.errorLoading}</p>
          <button onclick="window.loadBillboardsForSchedule()" class="tile-btn" style="margin-top: 10px;">
            ${t.retryBtn || 'Try again'}
          </button>
        </div>
      `;
    }
  }
}

window.populateBillboardSelect = function(billboards) {
  if (!window.scheduleBillboardSelect) return;
  
  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];
  
  if (!billboards || billboards.length === 0) {
    window.scheduleBillboardSelect.innerHTML += `
      <option value="" disabled>
        ${t.noneFound}
      </option>
    `;
    
    if (window.scheduleList) {
      const message = window.currentUser && window.currentUser.ranga !== "root" 
        ? (lang === 'pl' 
            ? 'Nie masz przypisanych żadnych telebimów do swojej grupy' 
            : 'You have no billboards assigned to your group')
        : t.noneFound;
      
      window.scheduleList.innerHTML = `
        <p style="color: var(--text-secondary); text-align: center; padding: 40px;">
          ${t.noneFound}
          <br>
          <small>${message}</small>
        </p>
      `;
    }
    
    if (window.visualizeBtn) {
      window.visualizeBtn.style.display = 'none';
    }
    return;
  }

  billboards.sort((a, b) => a.name.localeCompare(b.name));
  
  window.scheduleBillboardSelect.innerHTML = `<option value="">${t.selectBillboardPlaceholder}</option>`;
  
  billboards.forEach(billboard => {
    const option = document.createElement("option");
    option.value = billboard.uuid;
    option.textContent = billboard.name;
    window.scheduleBillboardSelect.appendChild(option);
  });
  
  if (window.scheduleBillboardSelect._changeListenerAdded) {
    window.scheduleBillboardSelect.removeEventListener("change", window.scheduleBillboardSelect._changeListener);
  }
  
  const changeHandler = async (e) => {
    const selectedUuid = e.target.value;
    
    if (selectedUuid) {
      window.selectedBillboardForSchedule = selectedUuid;
      
      if (window.visualizeBtn) {
        window.visualizeBtn.style.display = 'inline-block';
      }
      
      const selectedBillboard = billboards.find(b => b.uuid === selectedUuid);
      if (selectedBillboard) {
        window.currentVisualizationBillboardName = selectedBillboard.name;
      }
      
      await window.loadBillboardImages(selectedUuid);
      await window.loadSchedules(selectedUuid);
    } else {
      if (window.scheduleList) {
        window.scheduleList.innerHTML = `<p>${t.noScheduleSelected}</p>`;
      }
      window.selectedBillboardForSchedule = null;
      window.billboardImages = [];
      
      if (window.visualizeBtn) {
        window.visualizeBtn.style.display = 'none';
      }
    }
  };
  
  window.scheduleBillboardSelect._changeListener = changeHandler;
  window.scheduleBillboardSelect._changeListenerAdded = true;
  window.scheduleBillboardSelect.addEventListener("change", changeHandler);
};

window.loadBillboardImages = async function(uuid) {
  try {
    const res = await fetch(`/api/billboard/${uuid}/files`, {
      credentials: 'include'
    });
    
    if (!res.ok) {
      if (res.status === 403) {
        const lang = window.getCookie("language") || "pl";
        window.showToast(
          lang === 'pl' 
            ? 'Brak dostępu do plików tego urządzenia' 
            : 'No access to this device files', 
          "error"
        );
        window.billboardImages = [];
        return;
      }
      throw new Error(`HTTP ${res.status}`);
    }
    
    const data = await res.json();
    
    if (data.success && data.files) {
      window.billboardImages = data.files.filter(file => 
        file.type === 'image' || file.type === 'video' ||
        file.type === 'pdf' || file.type === 'zip' || file.type === 'js'
      );
    } else {
      window.billboardImages = [];
    }
  } catch (err) {
    console.error("Błąd ładowania obrazków:", err);
    window.billboardImages = [];
    const lang = window.getCookie("language") || "pl";
    window.showToast(
      lang === 'pl' 
        ? 'Błąd ładowania plików' 
        : 'Error loading files', 
      "error"
    );
  }
}

window.renderImageGallery = function(selectedFilename = '') {
  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];
  
  if (!window.billboardImages || window.billboardImages.length === 0) {
    return `
      <div class="no-images">
        <div style="font-size: 48px; margin-bottom: 10px;">🖼️</div>
        <p>${t.noFilesAvailable || 'No files available'}</p>
        <p style="font-size: 12px; margin-top: 5px;">${t.uploadFilesFirst || 'Upload files first'}</p>
      </div>
    `;
  }
  
  const images = Array.isArray(window.billboardImages) ? window.billboardImages : [];
  
  const escapedImages = images.map(file => {
    if (!file || !file.filename) return null;
    return {
      ...file,
      escapedFilename: file.filename
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
    };
  }).filter(file => file !== null);
  
  if (escapedImages.length === 0) {
    return `
      <div class="no-images">
        <div style="font-size: 48px; margin-bottom: 10px;">🖼️</div>
        <p>${t.noFilesAvailable || 'No files available'}</p>
      </div>
    `;
  }
  
  return `
    <div class="image-gallery" id="imageGallery">
      ${escapedImages.map(file => {
        const isSelected = file.filename === selectedFilename;
        const _gfn = file.filename.toLowerCase();
        const isVideo = file.type === 'video' ||
                       _gfn.endsWith('.mp4') || _gfn.endsWith('.webm') ||
                       _gfn.endsWith('.avi') || _gfn.endsWith('.mov') ||
                       _gfn.endsWith('.mkv') || _gfn.endsWith('.ogg');
        const isPdf = file.type === 'pdf' || _gfn.endsWith('.pdf');
        const isZip = file.type === 'zip' || _gfn.endsWith('.zip');
        const isJs  = file.type === 'js'  || _gfn.endsWith('.js');
        const fileKind = isVideo ? 'video' : isPdf ? 'pdf' : isZip ? 'zip' : isJs ? 'js' : 'image';
        const typeIcon = isVideo ? '🎬' : isPdf ? '📄' : isZip ? '🗜️' : isJs ? '📜' : '🖼️';
        const typeText = isVideo ? (t.videoType || 'Video') : isPdf ? 'PDF' : isZip ? 'ZIP' : isJs ? 'JS' : (t.imageType || 'Image');
        const videoUrl = isVideo ? `/api/billboard/${window.selectedBillboardForSchedule}/file/${encodeURIComponent(file.filename)}` : '';
        
        return `
          <div class="image-item ${isSelected ? 'selected' : ''}" 
               data-filename="${file.escapedFilename}" 
               data-type="${fileKind}"
               title="${file.escapedFilename} (${typeText})"
               onclick="window.selectImage('${file.escapedFilename}', '${fileKind}')">
            
            <div class="delete-file-btn" 
                 onclick="window.deleteFile('${file.escapedFilename}', '${fileKind}', event)"
                 title="${t.deleteFileTitle || 'Delete file'}">
              🗑️
            </div>
            
            ${isVideo ? `
              <div style="position: relative; width: 100%; height: 100px; background: var(--background); border-radius: 8px 8px 0 0; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <div style="font-size: 48px; color: var(--text-secondary); margin-bottom: 5px;">🎬</div>
                <div style="font-size: 12px; color: var(--text-secondary); padding: 0 5px; text-align: center;">${window.truncateFilename(file.escapedFilename, 20)}</div>
                <button onclick="window.openVideoInNewTab('${videoUrl}'); event.stopPropagation();" 
                        style="position: absolute; bottom: 5px; right: 5px; background: var(--primary); color: white; border: none; border-radius: 4px; padding: 3px 8px; font-size: 11px; cursor: pointer; display: flex; align-items: center; gap: 3px;">
                  ▶️ ${t.videoPlayBtn || 'Play'}
                </button>
              </div>
            ` : (isPdf || isZip || isJs) ? `
              <div style="width: 100%; height: 100px; background: var(--background); border-radius: 8px 8px 0 0; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer;">
                <div style="font-size: 48px; margin-bottom: 5px;">${typeIcon}</div>
                <div style="font-size: 11px; font-weight: 700; letter-spacing: 1px; color: var(--text-secondary);">${typeText}</div>
              </div>
            ` : `
              <img src="/api/billboard/${window.selectedBillboardForSchedule}/file/${encodeURIComponent(file.filename)}" 
                   alt="${file.escapedFilename}" 
                   class="image-thumbnail"
                   onclick="window.selectImage('${file.escapedFilename}', 'image')"
                   onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmMWYyZjQiLz48cGF0aCBkPSJNNTAgMzMuMzMzM0M0NC44IDEzLjMzMzMgMzMuMzMzMyAyMjQ2NjcgMzMuMzMzMyAzMy4zMzMzVjY2LjY2NjdDMzMuMzMzMyA3Ny41MzMzIDQ0LjggODYuNjY2NyA1MCA2Ni42NjY3QzU1LjIgODYuNjY2NyA2Ni42NjY3IDc3LjUzMzMgNjYuNjY2NyA2Ni42NjY3VjMzLjMzMzNDNjYuNjY2NyAyMi40NjY3IDU1LjIgMTMuMzMzMyA1MCAzMy4zMzMzWiIgZmlsbD0iI2NjYyIvPjwvc3ZnPg=='; this.style.objectFit='contain'; this.style.padding='10px'">
            `}
            <div class="image-type">${typeIcon}</div>
            <div class="image-name">${window.truncateFilename(file.escapedFilename, 15)}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
};

window.selectImage = function(filename, type) {
  const modalContent = window.scheduleEditModal ? window.scheduleEditModal.querySelector('.modal') : null;
  if (!modalContent) return;
  
  const selectFromGalleryBtn = modalContent.querySelector("#selectFromGalleryBtn");
  const uploadNewBtn = modalContent.querySelector("#uploadNewBtn");
  const galleryContainer = modalContent.querySelector('#galleryContainer');
  const uploadContainer = modalContent.querySelector('#uploadContainer');
  
  if (selectFromGalleryBtn && uploadNewBtn) {
    selectFromGalleryBtn.style.backgroundColor = 'var(--primary)';
    uploadNewBtn.style.backgroundColor = 'var(--text-secondary)';
  }
  
  if (galleryContainer) galleryContainer.style.display = 'block';
  if (uploadContainer) uploadContainer.style.display = 'none';
  
  modalContent.querySelectorAll('.image-item').forEach(item => {
    item.classList.remove('selected');
  });
  
  const escapedFilename = filename
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'");
  
  const selectedItem = modalContent.querySelector(`.image-item[data-filename="${escapedFilename}"]`);
  if (selectedItem) {
    selectedItem.classList.add('selected');
    selectedItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  
  const selectedImageInput = modalContent.querySelector('#selectedImage');
  const selectedImageTypeInput = modalContent.querySelector('#selectedImageType');
  if (selectedImageInput) selectedImageInput.value = filename;
  if (selectedImageTypeInput) selectedImageTypeInput.value = type;
  
  const selectedFileDiv = modalContent.querySelector('#selectedFileInfo');
  if (selectedFileDiv) {
    const lang = window.getCookie("language") || "pl";
    const t = window.translations[lang];
    selectedFileDiv.innerHTML = `
      <div class="selected-file">
        <strong>${t.fileSelected}</strong> ${filename}
        <br><small style="opacity: 0.8;">${t.changeSelection}</small>
      </div>
    `;
  }
};

window.handleFileUpload = function(event) {
  const files = event.target.files;
  if (files.length === 0) return;
  
  const file = files[0];
  
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'image/svg+xml', 'image/bmp',
    'video/mp4', 'video/webm', 'video/avi', 'video/x-msvideo',
    'video/quicktime', 'video/x-matroska', 'video/ogg',
    'application/pdf',
    'application/zip', 'application/x-zip-compressed', 'application/x-zip',
    'text/javascript', 'application/javascript', 'application/x-javascript',
    'application/octet-stream', 'text/plain'
  ];

  const allowedExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|mp4|webm|avi|mov|mkv|ogg|pdf|zip|js)$/i;
  
  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];
  
  if (!allowedTypes.includes(file.type) && !file.name.match(allowedExtensions)) {
    window.showToast(
      t.invalidFileType || 'Dozwolone tylko pliki obrazów (JPEG, PNG, GIF, WebP, SVG, BMP) i wideo (MP4, WebM, AVI, MOV, MKV, OGG)',
      'error'
    );
    return;
  }
  
  if (file.size > 50 * 1024 * 1024) {
    window.showToast(
      t.fileTooLarge || 'Plik jest zbyt duży. Maksymalny rozmiar: 50MB',
      'error'
    );
    return;
  }
  
  const modalContent = window.scheduleEditModal ? window.scheduleEditModal.querySelector('.modal') : null;
  if (!modalContent) return;
  
  const progressDiv = modalContent.querySelector('#uploadProgress');
  const selectedFileDiv = modalContent.querySelector('#selectedFileInfo');
  
  if (!progressDiv || !selectedFileDiv) return;
  
  const originalName = file.name;
  const normalizedName = window.normalizeFilename ? window.normalizeFilename(originalName) : originalName;
  
  const getCurrentFiles = async () => {
    try {
      const res = await fetch(`/api/billboard/${window.selectedBillboardForSchedule}/files`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        return data.success ? data.files.map(f => ({ filename: f.filename })) : [];
      }
    } catch (err) {
      console.error('Błąd pobierania plików:', err);
    }
    return window.billboardImages ? window.billboardImages.map(img => ({ filename: img.filename })) : [];
  };
  
  const uploadAndRefresh = async () => {
    const filesList = await getCurrentFiles();
    const uniqueFilename = window.getUniqueFilename ? window.getUniqueFilename(filesList, normalizedName) : normalizedName;
    
    progressDiv.style.display = 'block';
    progressDiv.innerHTML = '';
    
    const progressText = document.createElement('div');
    progressText.innerHTML = `📤 ${t.uploading || 'Uploading'} "${uniqueFilename}"...`;
    progressDiv.appendChild(progressText);
    
    const progressBar = document.createElement('div');
    progressBar.style.width = '100%';
    progressBar.style.height = '4px';
    progressBar.style.background = 'var(--border)';
    progressBar.style.borderRadius = '2px';
    progressBar.style.marginTop = '5px';
    progressBar.style.overflow = 'hidden';
    
    const progressFill = document.createElement('div');
    progressFill.style.width = '0%';
    progressFill.style.height = '100%';
    progressFill.style.background = 'var(--primary)';
    progressFill.style.transition = 'width 0.3s ease';
    progressBar.appendChild(progressFill);
    progressDiv.appendChild(progressBar);
    
    const cancelBtn = document.createElement('button');
    cancelBtn.innerHTML = '❌';
    cancelBtn.style.marginLeft = '10px';
    cancelBtn.style.background = 'transparent';
    cancelBtn.style.border = 'none';
    cancelBtn.style.cursor = 'pointer';
    cancelBtn.style.color = 'var(--text)';
    cancelBtn.style.float = 'right';
    cancelBtn.title = t.cancelUpload || 'Cancel upload';
    cancelBtn.onclick = (e) => {
      e.stopPropagation();
      progressText.innerHTML = `⏹️ ${t.cancelUpload || 'Upload cancelled'}`;
      progressFill.style.width = '0%';
      setTimeout(() => {
        progressDiv.style.display = 'none';
      }, 1500);
      
      if (event.target) {
        event.target.value = '';
      }
      
      const fileUpload = modalContent.querySelector('#fileUpload');
      if (fileUpload) fileUpload.value = '';
    };
    progressText.appendChild(cancelBtn);
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          progressFill.style.width = `${percentComplete}%`;
        }
      });
      
      xhr.addEventListener('load', async () => {
        if (xhr.status === 200) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.success) {
              progressText.innerHTML = `✅ ${t.uploadSuccess || 'Upload successful!'}`;
              progressFill.style.width = '100%';
              
              const selectedImageInput = modalContent.querySelector('#selectedImage');
              const selectedImageTypeInput = modalContent.querySelector('#selectedImageType');
              if (selectedImageInput) selectedImageInput.value = uniqueFilename;
              if (selectedImageTypeInput) {
                const _fn = file.name.toLowerCase();
                selectedImageTypeInput.value =
                  file.type.startsWith('image') ? 'image' :
                  file.type.startsWith('video') || _fn.match(/\.(mp4|webm|avi|mov|mkv|ogg)$/i) ? 'video' :
                  _fn.endsWith('.pdf') ? 'pdf' :
                  _fn.endsWith('.zip') ? 'zip' :
                  _fn.endsWith('.js')  ? 'js' : 'image';
              }
              
              selectedFileDiv.innerHTML = `
                <div class="selected-file">
                  <strong>${t.fileSelected || 'Selected file:'}</strong> ${uniqueFilename}
                  ${originalName !== uniqueFilename ? `<br><small style="opacity: 0.7;">${t.uploadHint || 'Uploaded as'} (oryginalnie: ${originalName})</small>` : ''}
                </div>
              `;
              
              await window.loadBillboardImages(window.selectedBillboardForSchedule);
              
              setTimeout(() => {
                progressDiv.style.display = 'none';
                
                const selectFromGalleryBtn = modalContent.querySelector("#selectFromGalleryBtn");
                const uploadNewBtn = modalContent.querySelector("#uploadNewBtn");
                const galleryContainer = modalContent.querySelector('#galleryContainer');
                const uploadContainer = modalContent.querySelector('#uploadContainer');
                
                if (selectFromGalleryBtn && uploadNewBtn) {
                  selectFromGalleryBtn.style.backgroundColor = 'var(--primary)';
                  uploadNewBtn.style.backgroundColor = 'var(--text-secondary)';
                }
                
                if (galleryContainer) {
                  galleryContainer.style.display = 'block';
                  const lang = window.getCookie("language") || "pl";
                  const t = window.translations[lang];
                  
                  galleryContainer.innerHTML = `
                    <div style="margin-bottom: 10px; font-size: 14px; color: var(--text-secondary);">
                      ${t.galleryTitle || 'Gallery'}
                    </div>
                    ${window.renderImageGallery(uniqueFilename)}
                  `;
                  
                  setTimeout(() => {
                    window.setupModalEvents();
                    
                    const escapedNewFilename = uniqueFilename
                      .replace(/"/g, '\\"')
                      .replace(/'/g, "\\'");
                    
                    const selectedItem = galleryContainer.querySelector(`.image-item[data-filename="${escapedNewFilename}"]`);
                    if (selectedItem) {
                      selectedItem.classList.add('selected');
                      selectedItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                  }, 50);
                }
                
                if (uploadContainer) {
                  uploadContainer.style.display = 'none';
                }
                
                if (event.target && event.target.value) {
                  event.target.value = '';
                }
                
                resolve(uniqueFilename);
              }, 800);
            } else {
              throw new Error(data.error || t.uploadError || 'Upload failed');
            }
          } catch (error) {
            progressText.innerHTML = `❌ ${error.message}`;
            progressFill.style.background = 'var(--danger)';
            reject(error);
            
            setTimeout(() => {
              progressDiv.style.display = 'none';
              if (event.target) {
                event.target.value = '';
              }
            }, 3000);
          }
        } else {
          progressText.innerHTML = `❌ ${t.uploadError || 'Upload failed'} (HTTP ${xhr.status})`;
          progressFill.style.background = 'var(--danger)';
          reject(new Error(`HTTP ${xhr.status}`));
          
          setTimeout(() => {
            progressDiv.style.display = 'none';
            if (event.target) {
              event.target.value = '';
            }
          }, 3000);
        }
      });
      
      xhr.addEventListener('error', () => {
        progressText.innerHTML = `❌ ${t.uploadError || 'Upload failed - network error'}`;
        progressFill.style.background = 'var(--danger)';
        reject(new Error('Network error'));
        
        setTimeout(() => {
          progressDiv.style.display = 'none';
          if (event.target) {
            event.target.value = '';
          }
        }, 3000);
      });
      
      const formData = new FormData();
      formData.append('file', file, uniqueFilename);
      
      xhr.open('POST', `/api/billboard/${window.selectedBillboardForSchedule}/upload`);
      xhr.send(formData);
    });
  };
  
  uploadAndRefresh().catch(error => {
    console.error('Błąd uploadu:', error);
    window.showToast(error.message || t.uploadError || 'Upload failed', 'error');
  });
};

window.clearUploadInput = function() {
  const modalContent = window.scheduleEditModal ? window.scheduleEditModal.querySelector('.modal') : null;
  if (!modalContent) return;
  
  const fileUpload = modalContent.querySelector('#fileUpload');
  const uploadProgress = modalContent.querySelector('#uploadProgress');
  const selectedFileDiv = modalContent.querySelector('#selectedFileInfo');
  
  if (fileUpload) fileUpload.value = '';
  if (uploadProgress) {
    uploadProgress.style.display = 'none';
    uploadProgress.innerHTML = '';
  }
  if (selectedFileDiv) {
    const lang = window.getCookie("language") || "pl";
    const t = window.translations[lang];
    selectedFileDiv.innerHTML = `
      <div style="color: var(--text-secondary); font-size: 14px; margin-bottom: 10px;">
        ${t.selectFile} ${t.dragAndDrop || 'lub przeciągnij i upuść tutaj'}
      </div>
    `;
  }
};

window.refreshGalleryWithNewImage = async function(newFilename) {
  const modalContent = window.scheduleEditModal ? window.scheduleEditModal.querySelector('.modal') : null;
  if (!modalContent) return;
  
  await window.loadBillboardImages(window.selectedBillboardForSchedule);
  
  const galleryContainer = modalContent.querySelector('#galleryContainer');
  const selectFromGalleryBtn = modalContent.querySelector("#selectFromGalleryBtn");
  
  if (selectFromGalleryBtn) {
    selectFromGalleryBtn.style.backgroundColor = 'var(--primary)';
    const uploadNewBtn = modalContent.querySelector("#uploadNewBtn");
    if (uploadNewBtn) uploadNewBtn.style.backgroundColor = 'var(--text-secondary)';
    
    if (galleryContainer) {
      galleryContainer.style.display = 'block';
      const uploadContainer = modalContent.querySelector('#uploadContainer');
      if (uploadContainer) uploadContainer.style.display = 'none';
      
      const lang = window.getCookie("language") || "pl";
      const t = window.translations[lang];
      
      galleryContainer.innerHTML = `
        <div style="margin-bottom: 10px; font-size: 14px; color: var(--text-secondary);">
          ${t.galleryTitle || 'Gallery'}
        </div>
        ${window.renderImageGallery(newFilename)}
      `;
      
      setTimeout(() => {
        window.setupModalEvents();
        
        if (newFilename) {
          const escapedNewFilename = newFilename
            .replace(/"/g, '\\"')
            .replace(/'/g, "\\'");
          
          const selectedItem = galleryContainer.querySelector(`.image-item[data-filename="${escapedNewFilename}"]`);
          if (selectedItem) {
            selectedItem.classList.add('selected');
            selectedItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            
            const selectedImageInput = modalContent.querySelector('#selectedImage');
            const selectedImageTypeInput = modalContent.querySelector('#selectedImageType');
            if (selectedImageInput) selectedImageInput.value = newFilename;
            
            const isVideo = newFilename.match(/\.(mp4|webm|avi|mov|mkv|ogg)$/i);
            const _fnl = newFilename.toLowerCase();
            const _type = isVideo ? 'video' : _fnl.endsWith('.pdf') ? 'pdf' : _fnl.endsWith('.zip') ? 'zip' : _fnl.endsWith('.js') ? 'js' : 'image';
            if (selectedImageTypeInput) selectedImageTypeInput.value = _type;
            
            const selectedFileDiv = modalContent.querySelector('#selectedFileInfo');
            if (selectedFileDiv) {
              selectedFileDiv.innerHTML = `
                <div class="selected-file">
                  <strong>${t.fileSelected}</strong> ${newFilename}
                  <br><small style="opacity: 0.8;">${t.changeSelection}</small>
                </div>
              `;
            }
          }
        }
      }, 50);
    }
  }
};

window.deleteFile = async function(filename, fileType, event) {
  event.stopPropagation();
  event.preventDefault();
  
  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];
  
  let rawFileType = 'image';
  if (fileType === t.imageType || fileType.toLowerCase().includes('image') || fileType === 'image') {
    rawFileType = 'image';
  } else if (fileType === t.videoType || fileType.toLowerCase().includes('video') || fileType === 'video') {
    rawFileType = 'video';
  } else if (fileType === 'pdf') {
    rawFileType = 'pdf';
  } else if (fileType === 'zip') {
    rawFileType = 'zip';
  } else if (fileType === 'js') {
    rawFileType = 'js';
  }
  
  const isVideo = filename.toLowerCase().match(/\.(mp4|webm|avi|mov|mkv|ogg)$/);
  if (isVideo) rawFileType = 'video';
  if (filename.toLowerCase().endsWith('.pdf')) rawFileType = 'pdf';
  if (filename.toLowerCase().endsWith('.zip')) rawFileType = 'zip';
  if (filename.toLowerCase().endsWith('.js'))  rawFileType = 'js';
  
  const modalContent = window.scheduleEditModal ? window.scheduleEditModal.querySelector('.modal') : null;
  const isInModal = modalContent && modalContent.contains(event.target);
  
  const confirmModal = document.createElement('div');
  confirmModal.classList.add('modal-overlay');
  confirmModal.style.display = 'flex';
  confirmModal.style.alignItems = 'center';
  confirmModal.style.justifyContent = 'center';
  confirmModal.style.zIndex = '1001';
  
  confirmModal.innerHTML = `
    <div class="modal" style="max-width: 450px; text-align: center;">
      <div style="margin-bottom: 20px;">
        <div style="font-size: 48px; margin-bottom: 10px; color: var(--danger);">
          ⚠️
        </div>
        <h3 style="margin-bottom: 10px; color: var(--text);">
          ${t.deleteBtn} ${rawFileType === 'image' ? t.imageType : t.videoType}
        </h3>
        <p style="color: var(--text-secondary); margin-bottom: 5px;">
          ${lang === 'pl' 
            ? `Czy na pewno chcesz usunąć plik "${filename}"?` 
            : `Are you sure you want to delete file "${filename}"?`}
        </p>
        <p style="color: var(--danger); font-size: 14px; margin-top: 10px;">
          ⚠️ ${lang === 'pl' 
            ? 'UWAGA: To również usunie wszystkie harmonogramy przypięte do tego pliku!' 
            : 'WARNING: This will also delete all schedules attached to this file!'}
        </p>
      </div>
      
      <div style="display: flex; gap: 10px; margin-top: 20px;">
        <button id="confirmDeleteFileBtn" class="modal-btn delete-btn" style="flex: 1;">
          ${t.deleteBtn}
        </button>
        <button id="cancelDeleteFileBtn" class="modal-btn cancel-btn" style="flex: 1;">
          ${t.cancelBtn}
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(confirmModal);
  
  confirmModal.addEventListener('click', (e) => {
    if (e.target === confirmModal) {
      confirmModal.remove();
    }
  });
  
  confirmModal.querySelector('#cancelDeleteFileBtn').addEventListener('click', () => {
    confirmModal.remove();
  });
  
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      confirmModal.remove();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
  
  confirmModal.querySelector('#confirmDeleteFileBtn').addEventListener('click', async () => {
    const confirmBtn = confirmModal.querySelector('#confirmDeleteFileBtn');
    const cancelBtn = confirmModal.querySelector('#cancelDeleteFileBtn');
    
    confirmBtn.innerHTML = `<span class="loading-spinner"></span> ${t.deleting || 'Deleting...'}`;
    confirmBtn.disabled = true;
    cancelBtn.disabled = true;
    
    try {
      const response = await fetch(`/api/billboard/${window.selectedBillboardForSchedule}/file/${encodeURIComponent(filename)}/with-schedules`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        const deletedSchedules = data.deleted_schedules || 0;
        
        confirmModal.remove();
        document.removeEventListener('keydown', handleEscape);
        
        const successModal = document.createElement('div');
        successModal.classList.add('modal-overlay');
        successModal.style.display = 'flex';
        successModal.style.alignItems = 'center';
        successModal.style.justifyContent = 'center';
        successModal.style.zIndex = '1001';
        
        successModal.innerHTML = `
          <div class="modal" style="max-width: 450px; text-align: center;">
            <div style="margin-bottom: 20px;">
              <div style="font-size: 48px; margin-bottom: 10px; color: var(--success);">
                ✅
              </div>
              <h3 style="margin-bottom: 10px; color: var(--text);">
                ${t.success}
              </h3>
              <p style="color: var(--text-secondary); margin-bottom: 5px;">
                ${lang === 'pl' 
                  ? `Plik "${filename}" został usunięty.` 
                  : `File "${filename}" has been deleted.`}
              </p>
              <p style="color: ${deletedSchedules > 0 ? 'var(--danger)' : 'var(--text-secondary)'}; font-size: 14px; margin-top: 10px;">
                ${lang === 'pl' 
                  ? `Usunięto ${deletedSchedules} powiązanych harmonogramów.` 
                  : `Deleted ${deletedSchedules} related schedules.`}
              </p>
            </div>
            
            <button id="closeSuccessModalBtn" class="modal-btn" style="background-color: var(--primary); color: white; width: 100%;">
              ${t.closeBtn || 'OK'}
            </button>
          </div>
        `;
        
        document.body.appendChild(successModal);
        
        successModal.addEventListener('click', (e) => {
          if (e.target === successModal || e.target.id === 'closeSuccessModalBtn') {
            successModal.remove();
          }
        });
        
        if (window.selectedBillboardForSchedule) {
          await window.loadSchedules(window.selectedBillboardForSchedule);
          if (window.visualizationModal && window.visualizationModal.style.display === "flex") {
            await window.openVisualizationModal();
          }
        }
        
        await window.loadBillboardImages(window.selectedBillboardForSchedule);
        
        if (isInModal && modalContent) {
          const galleryContainer = modalContent.querySelector('#galleryContainer');
          if (galleryContainer) {
            galleryContainer.innerHTML = `
              <div style="margin-bottom: 10px; font-size: 14px; color: var(--text-secondary);">
                ${t.galleryTitle}
              </div>
              ${window.renderImageGallery()}
            `;
          }
          
          const selectedImageInput = modalContent.querySelector('#selectedImage');
          if (selectedImageInput && selectedImageInput.value === filename) {
            selectedImageInput.value = '';
            const selectedFileDiv = modalContent.querySelector('#selectedFileInfo');
            if (selectedFileDiv) {
              selectedFileDiv.innerHTML = '';
            }
          }
        }
        
      } else {
        throw new Error(data.error || t.deleteFileError);
      }
      
    } catch (error) {
      console.error('Błąd usuwania pliku:', error);
      
      confirmModal.remove();
      document.removeEventListener('keydown', handleEscape);
      
      const errorModal = document.createElement('div');
      errorModal.classList.add('modal-overlay');
      errorModal.style.display = 'flex';
      errorModal.style.alignItems = 'center';
      errorModal.style.justifyContent = 'center';
      errorModal.style.zIndex = '1001';
      
      errorModal.innerHTML = `
        <div class="modal" style="max-width: 450px; text-align: center;">
          <div style="margin-bottom: 20px;">
            <div style="font-size: 48px; margin-bottom: 10px; color: var(--danger);">
              ❌
            </div>
            <h3 style="margin-bottom: 10px; color: var(--text);">
              ${t.error}
            </h3>
            <p style="color: var(--text-secondary); margin-bottom: 5px;">
              ${lang === 'pl' 
                ? `Błąd: ${error.message}` 
                : `Error: ${error.message}`}
            </p>
          </div>
          
          <button id="closeErrorModalBtn" class="modal-btn" style="background-color: var(--danger); color: white; width: 100%;">
            ${t.closeBtn || 'OK'}
          </button>
        </div>
      `;
      
      document.body.appendChild(errorModal);
      
      errorModal.addEventListener('click', (e) => {
        if (e.target === errorModal || e.target.id === 'closeErrorModalBtn') {
          errorModal.remove();
        }
      });
    }
  });
};

window.loadSchedules = async function(billboardUuid) {
  try {
    const res = await fetch(`/api/schedules/${billboardUuid}?page=1&limit=100`, {
      credentials: 'include'
    });
    
    if (res.status === 403) {
      const lang = window.getCookie("language") || "pl";
      const t = window.translations[lang];
      if (window.scheduleList) {
        window.scheduleList.innerHTML = `
          <div class="error-message">
            <div style="font-size: 48px; margin-bottom: 10px; color: var(--danger);">🚫</div>
            <p>${t.accessDenied}</p>
            <p style="font-size: 14px; color: var(--text-secondary); margin-top: 10px;">
              ${lang === 'pl' 
                ? 'Nie masz dostępu do harmonogramów tego urządzenia' 
                : 'You do not have access to this billboard\'s schedules'}
            </p>
            <button onclick="window.loadBillboardsForSchedule()" class="tile-btn" style="margin-top: 10px;">
              ${lang === 'pl' ? 'Wróć do wyboru urządzenia' : 'Back to device selection'}
            </button>
          </div>
        `;
      }
      return;
    }
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const data = await res.json();
    
    const lang = window.getCookie("language") || "pl";
    const t = window.translations[lang];
    
    if (!data.success || !data.schedules || data.schedules.length === 0) {
      if (window.scheduleList) {
        window.scheduleList.innerHTML = `
          <div class="no-schedules-message">
            <div style="font-size: 48px; margin-bottom: 10px; color: var(--text-secondary);">📅</div>
            <p>${t.noSchedulesFound}</p>
          </div>
        `;
      }
      return;
    }

    const groupedSchedules = new Map();
    
    data.schedules.forEach(schedule => {
      let repeatDays = [];
      try {
        if (typeof schedule.repeat === 'string') {
          repeatDays = JSON.parse(schedule.repeat);
        } else if (Array.isArray(schedule.repeat)) {
          repeatDays = schedule.repeat;
        }
      } catch (e) {
        console.error("Błąd parsowania repeat:", e);
      }
      
      const sortedRepeat = [...repeatDays].sort((a, b) => a - b);
      
      const groupKey = JSON.stringify({
        billboard_uuid: schedule.billboard_uuid,
        task_name: schedule.task_name,
        content: schedule.content,
        repeat: sortedRepeat,
        status: schedule.status,
        priority: schedule.priority || 0
      });
      
      if (!groupedSchedules.has(groupKey)) {
        groupedSchedules.set(groupKey, {
          billboard_uuid: schedule.billboard_uuid,
          task_name: schedule.task_name,
          content: schedule.content,
          repeat: sortedRepeat,
          status: schedule.status,
          priority: schedule.priority || 0,
          schedules: []
        });
      }
      
      groupedSchedules.get(groupKey).schedules.push({
        id: schedule.id,
        start_date: schedule.start_date,
        end_date: schedule.end_date,
        created_at: schedule.created_at,
        updated_at: schedule.updated_at
      });
    });

    if (window.scheduleList) {
      window.scheduleList.innerHTML = `
        <div class="bulk-actions-container" id="bulkActionsContainer" style="display: none;">
          <div class="bulk-selection-info">
            <span id="selectedCount">0</span> ${t.selectedCountLabel}
          </div>
          <div class="bulk-action-buttons">
            <button class="bulk-action-btn bulk-delete-btn" id="bulkDeleteBtn">
              <span class="bulk-btn-icon">🗑️</span>
              ${t.deleteBtn} (<span id="deleteCount">0</span>)
            </button>
            <button class="bulk-action-btn bulk-select-all-btn" id="bulkSelectAllBtn">
              ${t.selectAll || 'Select all'}
            </button>
            <button class="bulk-action-btn bulk-deselect-btn" id="bulkDeselectBtn">
              ${t.deselectAll || 'Deselect all'}
            </button>
          </div>
        </div>
        <div id="schedulesItemsContainer"></div>
      `;
    }
    
    const itemsContainer = document.getElementById('schedulesItemsContainer');
    
    if (itemsContainer) {
      itemsContainer.innerHTML = Array.from(groupedSchedules.values()).map(group => {
        let contentObj = {};
        let filename = '';
        let fileType = 'image';
        
        try {
          contentObj = JSON.parse(group.content);
          filename = contentObj.filename || '';
          fileType = contentObj.type || 'image';
        } catch (e) {
          if (group.content && typeof group.content === 'string') {
            const match = group.content.match(/filename["']?\s*:\s*["']([^"']+)["']/);
            if (match) {
              filename = match[1];
            }
          }
        }
        
        const statusClass = group.status ? `status-${group.status}` : 'status-active';
        const statusText = window.getStatusLabel(group.status, lang);
        
        const _sfn = filename ? filename.toLowerCase() : '';
        const isVideo = fileType === 'video' ||
                        _sfn.endsWith('.mp4') || _sfn.endsWith('.webm') ||
                        _sfn.endsWith('.avi') || _sfn.endsWith('.mov') ||
                        _sfn.endsWith('.mkv') || _sfn.endsWith('.ogg');
        const isPdf = fileType === 'pdf' || _sfn.endsWith('.pdf');
        const isZip = fileType === 'zip' || _sfn.endsWith('.zip');
        const isJs  = fileType === 'js'  || _sfn.endsWith('.js');
        
        const scheduleIds = group.schedules.map(s => s.id).join(',');
        const mainSchedule = group.schedules[0];
        
        const hoursHtml = group.schedules.map(sch => {
          const start = new Date(sch.start_date);
          const end = new Date(sch.end_date);
          const startTime = start.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const endTime = end.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          return `<span class="time-range">${startTime} - ${endTime}</span>`;
        }).join(', ');
        
        const startDate = new Date(mainSchedule.start_date);
        const endDate = new Date(mainSchedule.end_date);
        const duration = window.calculateDuration(startDate, endDate);
        
        const formatDateWithoutTime = (dateString) => {
          const date = new Date(dateString);
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${day}.${month}.${year}`;
        };
        
        const formattedStartDate = formatDateWithoutTime(mainSchedule.start_date);
        const formattedEndDate = formatDateWithoutTime(mainSchedule.end_date);
        
        const priorityStars = group.priority > 0 ? '★'.repeat(group.priority) : '';
        const priorityTitle = group.priority > 0 ? 
          `${t.priorityLabel || 'Priority'}: ${group.priority}` : 
          `${t.priorityLabel || 'Priority'}: Normal`;
        
        return `
          <div class="schedule-item" data-group-ids="${scheduleIds}">
            <div class="schedule-checkbox">
              <input type="checkbox" class="schedule-select-checkbox" id="schedule-${scheduleIds}" 
                     data-ids="${scheduleIds}" 
                     data-name="${window.escapeHtml(group.task_name)}">
              <label for="schedule-${scheduleIds}"></label>
            </div>
            
            <div class="schedule-content-main">
              <div class="schedule-header">
                <div class="schedule-info">
                  <div class="schedule-title">
                    ${window.escapeHtml(group.task_name)}
                    ${priorityStars ? `<span class="schedule-priority" title="${priorityTitle}">${priorityStars}</span>` : ''}
                  </div>
                  <div class="schedule-uuid">
                    <strong>UUID:</strong> ${group.billboard_uuid}
                  </div>
                </div>
                <div class="schedule-status ${statusClass}">
                  ${statusText}
                </div>
              </div>
              
              <div class="schedule-content-preview">
                ${filename ? `
                  ${isVideo ? `
                    <div class="preview-image-container">
                      <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--tile-bg);">
                        <div style="font-size: 32px; color: var(--text-secondary); margin-bottom: 10px;">🎬</div>
                        <div style="font-size: 12px; color: var(--text-secondary); text-align: center; padding: 0 10px; margin-bottom: 10px;">${window.truncateFilename(filename, 20)}</div>
                        <button onclick="window.openVideoInNewTab('/api/billboard/${group.billboard_uuid}/file/${encodeURIComponent(filename)}'); event.stopPropagation();" 
                                style="background: var(--primary); color: white; border: none; border-radius: 6px; padding: 6px 12px; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 5px;">
                          ▶️ ${t.videoPlayBtn}
                        </button>
                      </div>
                      <div class="preview-type ${fileType}">
                        🎬 Video
                      </div>
                    </div>
                  ` : isPdf ? `
                    <div class="preview-image-container">
                      <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--tile-bg);">
                        <div style="font-size: 40px; margin-bottom: 8px;">📄</div>
                        <div style="font-size: 11px; font-weight: 700; letter-spacing: 1px; color: var(--text-secondary);">PDF</div>
                      </div>
                      <div class="preview-type pdf">📄 PDF</div>
                    </div>
                  ` : isZip ? `
                    <div class="preview-image-container">
                      <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--tile-bg);">
                        <div style="font-size: 40px; margin-bottom: 8px;">🗜️</div>
                        <div style="font-size: 11px; font-weight: 700; letter-spacing: 1px; color: var(--text-secondary);">ZIP</div>
                      </div>
                      <div class="preview-type zip">🗜️ ZIP</div>
                    </div>
                  ` : isJs ? `
                    <div class="preview-image-container">
                      <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--tile-bg);">
                        <div style="font-size: 40px; margin-bottom: 8px;">📜</div>
                        <div style="font-size: 11px; font-weight: 700; letter-spacing: 1px; color: var(--text-secondary);">JS</div>
                      </div>
                      <div class="preview-type js">📜 JS</div>
                    </div>
                  ` : `
                    <div class="preview-image-container">
                      <img src="/api/billboard/${group.billboard_uuid}/file/${encodeURIComponent(filename)}" 
                           alt="${filename}" 
                           class="preview-thumbnail"
                           onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmMWYyZjQiLz48cGF0aCBkPSJNNTAgMzMuMzMzM0M0NC44IDEzLjMzMzMgMzMuMzMzMyAyMjQ2NjcgMzMuMzMzMyAzMy4zMzMzVjY2LjY2NjdDMzMuMzMzMyA3Ny41MzMzIDQ0LjggODYuNjY2NyA1MCA2Ni42NjY3QzU1LjIgODYuNjY2NyA2Ni42NjY3IDc3LjUzMzMgNjYuNjY2NyA2YuNjY2NyVjMzMuMzMzNDNjYuNjY2NyAyMi40NjY3IDU1LjIgMTMuMzMzMyA1MCAzMy4zMzMzWiIgZmlsbD0iI2NjYyIvPjwvc3ZnPg=='>
                      <div class="preview-type ${fileType}">
                        🖼️ Image
                      </div>
                    </div>
                  `}
                ` : `
                  <div class="preview-image-container">
                    <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-secondary);">
                      📄 No file
                    </div>
                  </div>
                `}
                
                <div class="preview-info">
                  ${filename ? `
                    <div class="preview-filename">${filename}</div>
                  ` : `
                    <div class="preview-filename" style="color: var(--text-secondary);">
                      No file selected
                    </div>
                  `}
                  
                  <div class="schedule-timing">
                    <div class="timing-item">
                      <span class="timing-label">${t.startDateLabel}:</span>
                      <span class="timing-value">${formattedStartDate}</span>
                    </div>
                    <div class="timing-item">
                      <span class="timing-label">${t.endDateLabel}:</span>
                      <span class="timing-value">${formattedEndDate}</span>
                    </div>
                    <div class="timing-item" style="grid-column: 1 / -1;">
                      <span class="timing-label">${lang === 'pl' ? 'Godziny' : 'Hours'}:</span>
                      <span class="timing-value" style="display: flex; flex-wrap: wrap; gap: 5px;">${hoursHtml}</span>
                    </div>
                    <div class="timing-item">
                      <span class="timing-label">${t.repeatLabel}:</span>
                      <span class="timing-value">${window.formatRepeatDays(group.repeat)}</span>
                    </div>
                    <div class="timing-item">
                      <span class="timing-label">${t.duration}</span>
                      <span class="timing-value">${duration}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="schedule-actions">
                <button class="schedule-action-btn edit-schedule-btn" 
                        data-action="edit" 
                        data-ids="${scheduleIds}">
                  ${t.editScheduleBtn}
                </button>
                <button class="schedule-action-btn delete-schedule-btn" 
                        data-action="delete" 
                        data-ids="${scheduleIds}" 
                        data-name="${window.escapeHtml(group.task_name)}">
                  ${t.deleteScheduleBtn}
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
    
    window.setupScheduleEventListeners();
    window.initBulkActions();
    
  } catch (err) {
    console.error("Błąd ładowania harmonogramów:", err);
    const lang = window.getCookie("language") || "pl";
    const t = window.translations[lang];
    if (window.scheduleList) {
      window.scheduleList.innerHTML = `
        <div class="error-message">
          <div style="font-size: 48px; margin-bottom: 10px; color: var(--danger);">❌</div>
          <p>${t.scheduleErrorLoading}</p>
          <p style="font-size: 14px; color: var(--text-secondary); margin-top: 5px;">
            ${err.message}
          </p>
          <button onclick="window.loadSchedules('${billboardUuid}')" class="tile-btn" style="margin-top: 10px;">
            ${t.retryBtn || 'Try again'}
          </button>
        </div>
      `;
    }
  }
};

window.bulkDeleteSchedules = function(schedules) {
  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];
  
  const modal = document.createElement('div');
  modal.classList.add('modal-overlay');
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.zIndex = '1001';
  
  const schedulesList = schedules.map(s => 
    `<div class="schedule-to-delete">• ${window.escapeHtml(s.name)}</div>`
  ).join('');
  
  modal.innerHTML = `
    <div class="modal" style="max-width: 500px; text-align: center;">
      <div style="margin-bottom: 20px;">
        <div style="font-size: 48px; margin-bottom: 10px; color: var(--danger);">
          ⚠️
        </div>
        <h3 style="margin-bottom: 10px; color: var(--text);">
          ${t.bulkDeleteTitle || 'Bulk Delete Schedules'}
        </h3>
        <p style="color: var(--text-secondary); margin-bottom: 15px;">
          ${t.bulkDeleteConfirm || 'Are you sure you want to delete'} <strong>${schedules.length}</strong> ${schedules.length === 1 ? t.scheduleSingle || 'schedule' : t.schedulePlural || 'schedules'}?
        </p>
        
        <div style="max-height: 200px; overflow-y: auto; text-align: left; margin: 15px 0; padding: 10px; background: var(--background); border-radius: 8px; border: 1px solid var(--border);">
          ${schedulesList}
        </div>
        
        <p style="color: var(--danger); font-size: 14px; margin-top: 10px;">
          ⚠️ ${t.operationIrreversible}
        </p>
      </div>
      
      <div style="display: flex; gap: 10px; margin-top: 20px;">
        <button id="confirmBulkDeleteBtn" class="modal-btn delete-btn" style="flex: 1;">
          ${t.deleteBtn} (${schedules.length})
        </button>
        <button id="cancelBulkDeleteBtn" class="modal-btn cancel-btn" style="flex: 1;">
          ${t.cancelBtn}
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
  
  modal.querySelector('#confirmBulkDeleteBtn').addEventListener('click', async () => {
    const confirmBtn = modal.querySelector('#confirmBulkDeleteBtn');
    const cancelBtn = modal.querySelector('#cancelBulkDeleteBtn');
    
    confirmBtn.innerHTML = `<span class="loading-spinner"></span> ${t.deleting || 'Deleting...'} (${schedules.length})`;
    confirmBtn.disabled = true;
    cancelBtn.disabled = true;
    
    try {
      const deletePromises = schedules.map(schedule => 
        fetch(`/api/schedule/${schedule.id}`, { 
          method: "DELETE",
          headers: { "Content-Type": "application/json" }
        }).then(res => res.json())
      );
      
      const results = await Promise.allSettled(deletePromises);
      
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
      const failed = results.filter(r => r.status === 'rejected' || !r.value.success);
      
      modal.remove();
      
      if (failed.length === 0) {
        window.showToast(`${successful.length} ${t.schedulesDeleted}`, "success");
      } else if (successful.length > 0) {
        window.showToast(`${successful.length} ${t.deletedWithErrors}${failed.length} ${t.failedToDelete}`, "warning");
      } else {
        window.showToast(t.scheduleErrorDeleting, "error");
      }
      
      if (window.selectedBillboardForSchedule) {
        await window.loadSchedules(window.selectedBillboardForSchedule);
        if (window.visualizationModal && window.visualizationModal.style.display === "flex") {
          await window.openVisualizationModal();
        }
      }
      
    } catch (err) {
      console.error(err);
      window.showToast(err.message, "error");
      
      confirmBtn.innerHTML = `${t.deleteBtn} (${schedules.length})`;
      confirmBtn.disabled = false;
      cancelBtn.disabled = false;
    }
  });
  
  modal.querySelector('#cancelBulkDeleteBtn').addEventListener('click', () => {
    modal.remove();
  });
  
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      modal.remove();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  
  document.addEventListener('keydown', handleEscape);
};

window.addAdditionalHour = function() {
  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];
  
  const container = window.scheduleEditModal.querySelector('#additionalHoursContainer');
  if (!container) return;
  
  const hourElement = document.createElement('div');
  hourElement.className = 'additional-hour-item';
  hourElement.style.position = 'relative';
  hourElement.style.padding = '10px';
  hourElement.style.backgroundColor = 'var(--background)';
  hourElement.style.borderRadius = '6px';
  hourElement.style.border = '1px solid var(--border)';
  hourElement.style.marginBottom = '8px';
  
  hourElement.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
      <div style="flex: 1;">
        <label style="display: block; margin-bottom: 5px; font-size: 12px; color: var(--text-secondary);">${t.startTimeLabel}</label>
        <input type="time" class="modal-input additional-hour-start" value="" step="1" style="width: 100%; padding: 6px; border: 1px solid var(--border); border-radius: 4px; font-size: 13px;">
      </div>
      <div style="flex: 1;">
        <label style="display: block; margin-bottom: 5px; font-size: 12px; color: var(--text-secondary);">${t.endTimeLabel}</label>
        <input type="time" class="modal-input additional-hour-end" value="" step="1" style="width: 100%; padding: 6px; border: 1px solid var(--border); border-radius: 4px; font-size: 13px;">
      </div>
      <div style="margin-top: 18px;">
        <button type="button" class="remove-hour-btn" style="background: transparent; color: var(--danger); border: none; cursor: pointer; font-size: 16px; padding: 4px; border-radius: 4px; transition: background 0.2s;" title="Usuń tę parę godzin">
          🗑️
        </button>
      </div>
    </div>
  `;
  
  container.appendChild(hourElement);
  
  const removeBtn = hourElement.querySelector('.remove-hour-btn');
  removeBtn.addEventListener('click', () => {
    hourElement.remove();
  });
};

window.openScheduleModal = async function() {
  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];
  
  if (!window.selectedBillboardForSchedule) {
    window.showToast(t.selectBillboardFirst, "error");
    return;
  }
  
  window.currentSchedule = null;
  window.currentScheduleGroup = null;
  
  await window.loadBillboardImages(window.selectedBillboardForSchedule);
  
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const startDateTime = window.formatDateTimeLocal(now);
  const endDateTime = window.formatDateTimeLocal(tomorrow);
  
  const startParts = window.splitDateTime(startDateTime);
  const endParts = window.splitDateTime(endDateTime);
  
  if (window.scheduleEditModal) {
    window.scheduleEditModal.innerHTML = `
      <div class="modal" style="max-width: 700px; max-height: 90vh; overflow-y: auto;">
        <h3 id="scheduleEditTitle">${t.scheduleEditTitle}</h3>
        
        <div style="display: grid; gap: 15px;">
          <div>
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">${t.taskNameLabel}</label>
            <input type="text" id="scheduleTaskName" class="modal-input" placeholder="${t.taskNameLabel}">
          </div>
          
          <div>
            <div style="display: flex; gap: 10px; margin-bottom: 15px;">
              <button type="button" id="selectFromGalleryBtn" class="tile-btn" style="flex: 1; background-color: var(--primary);">
                ${t.selectFromGallery}
              </button>
              <button type="button" id="uploadNewBtn" class="tile-btn" style="flex: 1; background-color: var(--text-secondary);">
                ${t.uploadNew}
              </button>
            </div>
            
            <input type="hidden" id="selectedImage" value="">
            <input type="hidden" id="selectedImageType" value="">
            <div id="selectedFileInfo"></div>
            
            <div id="galleryContainer">
              <div style="margin-bottom: 10px; font-size: 14px; color: var(--text-secondary);">
                ${t.galleryTitle}
              </div>
              ${window.renderImageGallery()}
            </div>
            
            <div id="uploadContainer" style="display: none;">
              <div class="upload-section" id="uploadSection">
                <div class="upload-icon">📤</div>
                <div class="upload-text">${t.clickToUpload}</div>
                <div class="upload-hint">${t.uploadHint}</div>
                <div class="upload-hint" style="margin-top: 5px; font-size: 12px;">${t.maxSize}</div>
                <input type="file" id="fileUpload" class="upload-input" accept="image/*,video/*,.pdf,.zip,.js">
              </div>
              <div id="uploadProgress" class="upload-progress"></div>
            </div>
          </div>
          
          <div style="border: 1px solid var(--border); border-radius: 8px; padding: 15px; background: var(--tile-bg);">
            <h4 style="margin-top: 0; margin-bottom: 15px; color: var(--text);">${t.dateTimeSection || 'Data i czas'}</h4>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div>
                <label style="display: block; margin-bottom: 5px; font-weight: 600;">${t.startDateLabel}</label>
                <input type="date" id="scheduleStartDate" class="modal-input" value="${startParts.date}">
              </div>
              
              <div>
                <label style="display: block; margin-bottom: 5px; font-weight: 600;">${t.endDateLabel}</label>
                <input type="date" id="scheduleEndDate" class="modal-input" value="${endParts.date}">
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
              <div>
                <label style="display: block; margin-bottom: 5px; font-weight: 600;">${t.startTimeLabel || 'Godzina rozpoczęcia'}</label>
                <input type="time" id="scheduleStartTime" class="modal-input" value="${startParts.time}" step="1">
                <div style="font-size: 12px; color: var(--text-secondary); margin-top: 5px;">${t.timeFormatHint || 'Format: HH:MM:SS'}</div>
              </div>
              
              <div>
                <label style="display: block; margin-bottom: 5px; font-weight: 600;">${t.endTimeLabel || 'Godzina zakończenia'}</label>
                <input type="time" id="scheduleEndTime" class="modal-input" value="${endParts.time}" step="1">
                <div style="font-size: 12px; color: var(--text-secondary); margin-top: 5px;">${t.timeFormatHint || 'Format: HH:MM:SS'}</div>
              </div>
            </div>
            
            <div style="margin-top: 20px; border-top: 1px dashed var(--border); padding-top: 15px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <label style="font-weight: 600;">${t.additionalHoursLabel || 'Dodatkowe godziny'}</label>
                <button type="button" id="addHourBtn" class="tile-btn" style="padding: 8px 16px; display: flex; align-items: center; gap: 6px;">
                  <span style="font-size: 16px;">+</span>
                  ${t.addHourBtn || 'Dodaj godzinę'}
                </button>
              </div>
              <div id="additionalHoursContainer" style="display: grid; gap: 15px;">
              </div>
            </div>
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">${t.repeatLabel}</label>
            <div class="weekdays-checkbox-container" style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px;">
              <label class="weekday-checkbox" style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                <input type="checkbox" value="1" checked class="weekday-checkbox-input"> ${t.calendarWeekdayMon || 'Mon'}
              </label>
              <label class="weekday-checkbox" style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                <input type="checkbox" value="2" checked class="weekday-checkbox-input"> ${t.calendarWeekdayTue || 'Tue'}
              </label>
              <label class="weekday-checkbox" style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                <input type="checkbox" value="3" checked class="weekday-checkbox-input"> ${t.calendarWeekdayWed || 'Wed'}
              </label>
              <label class="weekday-checkbox" style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                <input type="checkbox" value="4" checked class="weekday-checkbox-input"> ${t.calendarWeekdayThu || 'Thu'}
              </label>
              <label class="weekday-checkbox" style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                <input type="checkbox" value="5" checked class="weekday-checkbox-input"> ${t.calendarWeekdayFri || 'Fri'}
              </label>
              <label class="weekday-checkbox" style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                <input type="checkbox" value="6" checked class="weekday-checkbox-input"> ${t.calendarWeekdaySat || 'Sat'}
              </label>
              <label class="weekday-checkbox" style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                <input type="checkbox" value="7" checked class="weekday-checkbox-input"> ${t.calendarWeekdaySun || 'Sun'}
              </label>
            </div>
            <div id="selectedDaysText" style="margin-top: 8px; font-size: 13px; color: var(--text-secondary); font-style: italic;">
              ${window.formatRepeatDays([1,2,3,4,5,6,7])}
            </div>
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">${t.statusLabel}</label>
            <select id="scheduleStatus" class="modal-select">
              <option value="active" selected>${t.statusActive}</option>
              <option value="paused">${t.statusPaused}</option>
            </select>
          </div>

          <div>
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">${t.priorityLabel || 'Priority'}</label>
            <input type="number" id="schedulePriority" class="modal-input" min="0" max="2" step="1" value="0">
            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 5px;">
              ${t.priorityHint || '0 = lowest, 2 = highest'}
            </div>
          </div>
        </div>
        
        <div class="modal-btn-container" style="margin-top: 25px;">
          <button id="saveScheduleBtn" class="modal-btn save-btn">${t.saveBtn}</button>
          <button id="cancelScheduleBtn" class="modal-btn cancel-btn">${t.cancelBtn}</button>
        </div>
      </div>
    `;
    
    window.scheduleEditModal.style.display = "flex";
    
    setTimeout(() => {
      window.setupModalEvents();
      window.setupWeekdayCheckboxes();
      
      const priorityInput = window.scheduleEditModal.querySelector("#schedulePriority");
      if (priorityInput) {
        priorityInput.addEventListener('input', function() {
          let value = parseInt(this.value);
          if (isNaN(value) || value < 0) {
            this.value = 0;
          } else if (value > 5) {
            this.value = 5;
          } else if (!Number.isInteger(value)) {
            this.value = Math.floor(value);
          }
        });
      }
      
      const cancelBtn = window.scheduleEditModal.querySelector("#cancelScheduleBtn");
      if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
          window.scheduleEditModal.style.display = "none";
        });
      }
      
      const saveBtn = window.scheduleEditModal.querySelector("#saveScheduleBtn");
      if (saveBtn) {
        saveBtn.addEventListener("click", window.saveScheduleData);
      }
      
      const addHourBtn = window.scheduleEditModal.querySelector("#addHourBtn");
      if (addHourBtn) {
        addHourBtn.addEventListener("click", window.addAdditionalHour);
      }
      
      const selectFromGalleryBtn = window.scheduleEditModal.querySelector("#selectFromGalleryBtn");
      const uploadNewBtn = window.scheduleEditModal.querySelector("#uploadNewBtn");
      
      if (selectFromGalleryBtn) {
        selectFromGalleryBtn.addEventListener("click", () => {
          const galleryContainer = window.scheduleEditModal.querySelector('#galleryContainer');
          const uploadContainer = window.scheduleEditModal.querySelector('#uploadContainer');
          
          selectFromGalleryBtn.style.backgroundColor = 'var(--primary)';
          uploadNewBtn.style.backgroundColor = 'var(--text-secondary)';
          
          if (galleryContainer) {
            galleryContainer.style.display = 'block';
            window.refreshGallery();
          }
          if (uploadContainer) uploadContainer.style.display = 'none';
        });
      }
      
      if (uploadNewBtn) {
        uploadNewBtn.addEventListener("click", () => {
          const galleryContainer = window.scheduleEditModal.querySelector('#galleryContainer');
          const uploadContainer = window.scheduleEditModal.querySelector('#uploadContainer');
          const selectedFileDiv = window.scheduleEditModal.querySelector('#selectedFileInfo');
          
          uploadNewBtn.style.backgroundColor = 'var(--primary)';
          selectFromGalleryBtn.style.backgroundColor = 'var(--text-secondary)';
          
          if (galleryContainer) galleryContainer.style.display = 'none';
          if (uploadContainer) uploadContainer.style.display = 'block';
          
          if (selectedFileDiv) {
            const lang = window.getCookie("language") || "pl";
            const t = window.translations[lang];
            selectedFileDiv.innerHTML = `
              <div style="color: var(--text-secondary); font-size: 14px; margin-bottom: 10px;">
                ${t.selectFile} ${t.dragAndDrop || 'lub przeciągnij i upuść tutaj'}
              </div>
            `;
          }
          
          window.scheduleEditModal.querySelectorAll('.image-item').forEach(item => {
            item.classList.remove('selected');
          });
          
          const selectedImageInput = window.scheduleEditModal.querySelector('#selectedImage');
          const selectedImageTypeInput = window.scheduleEditModal.querySelector('#selectedImageType');
          if (selectedImageInput) selectedImageInput.value = '';
          if (selectedImageTypeInput) selectedImageTypeInput.value = '';
        });
      }
    }, 50);
  }
};

window.refreshGallery = function() {
  const modalContent = window.scheduleEditModal ? window.scheduleEditModal.querySelector('.modal') : null;
  if (!modalContent) return;
  
  const galleryContainer = modalContent.querySelector('#galleryContainer');
  if (!galleryContainer || galleryContainer.style.display === 'none') return;
  
  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];
  
  galleryContainer.innerHTML = `
    <div style="margin-bottom: 10px; font-size: 14px; color: var(--text-secondary);">
      ${t.galleryTitle || 'Gallery'}
    </div>
    ${window.renderImageGallery()}
  `;
  
  window.setupModalEvents();
};

window.editSchedule = function(scheduleIdsStr) {
  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];
  
  const scheduleIds = scheduleIdsStr.split(',').map(id => id.trim());
  const firstId = scheduleIds[0];
  
  window.currentScheduleGroup = scheduleIds;
  
  fetch(`/api/schedule/${firstId}`)
    .then(res => res.json())
    .then(async data => {
      if (!data.success) throw new Error("Błąd ładowania harmonogramu");
      
      const schedule = data.schedule;
      window.currentSchedule = schedule;
      
      await window.loadBillboardImages(schedule.billboard_uuid);
      
      let selectedFilename = '';
      let selectedType = '';
      
      try {
        const contentObj = JSON.parse(schedule.content);
        selectedFilename = contentObj.filename || '';
        selectedType = contentObj.type || '';
      } catch {}
      
      const allSchedulesData = await Promise.all(
        scheduleIds.map(id => 
          fetch(`/api/schedule/${id}`).then(r => r.json()).then(d => d.schedule)
        )
      );
      
      const startParts = window.splitDateTime(schedule.start_date);
      const endParts = window.splitDateTime(schedule.end_date);
      
      let repeatDays = [1,2,3,4,5,6,7];
      try {
        if (schedule.repeat) {
          const parsedRepeat = JSON.parse(schedule.repeat);
          if (Array.isArray(parsedRepeat)) {
            repeatDays = parsedRepeat.filter(day => day >= 1 && day <= 7);
          }
          if (repeatDays.length === 0) {
            repeatDays = [1,2,3,4,5,6,7];
          }
        }
      } catch (e) {
        console.error("Błąd parsowania repeat:", e);
        repeatDays = [1,2,3,4,5,6,7];
      }
      
      const initialMode = selectedFilename ? 'select' : 'upload';
      
      const additionalHoursHtml = allSchedulesData.slice(1).map(sch => {
        const sParts = window.splitDateTime(sch.start_date);
        const eParts = window.splitDateTime(sch.end_date);
        return `
          <div class="additional-hour-item" data-schedule-id="${sch.id}" style="position: relative; padding: 10px; background-color: var(--background); border-radius: 6px; border: 1px solid var(--border); margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="flex: 1;">
                <label style="display: block; margin-bottom: 5px; font-size: 12px; color: var(--text-secondary);">${t.startTimeLabel}</label>
                <input type="time" class="modal-input additional-hour-start" value="${sParts.time}" step="1" style="width: 100%; padding: 6px; border: 1px solid var(--border); border-radius: 4px; font-size: 13px;">
              </div>
              <div style="flex: 1;">
                <label style="display: block; margin-bottom: 5px; font-size: 12px; color: var(--text-secondary);">${t.endTimeLabel}</label>
                <input type="time" class="modal-input additional-hour-end" value="${eParts.time}" step="1" style="width: 100%; padding: 6px; border: 1px solid var(--border); border-radius: 4px; font-size: 13px;">
              </div>
              <div style="margin-top: 18px;">
                <button type="button" class="remove-hour-btn" style="background: transparent; color: var(--danger); border: none; cursor: pointer; font-size: 16px; padding: 4px; border-radius: 4px; transition: background 0.2s;" title="Usuń tę parę godzin">
                  🗑️
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');
      
      if (window.scheduleEditModal) {
        window.scheduleEditModal.innerHTML = `
          <div class="modal" style="max-width: 700px; max-height: 90vh; overflow-y: auto;">
            <h3 id="scheduleEditTitle">Edytuj harmonogram (${scheduleIds.length} godzin)</h3>
            
            <div style="display: grid; gap: 15px;">
              <div>
                <label style="display: block; margin-bottom: 5px; font-weight: 600;">${t.taskNameLabel}</label>
                <input type="text" id="scheduleTaskName" class="modal-input" value="${schedule.task_name}">
              </div>
              
              <div>
                <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                  <button type="button" id="selectFromGalleryBtn" class="tile-btn" style="flex: 1; ${initialMode === 'select' ? 'background-color: var(--primary); color: white;' : 'background-color: var(--text-secondary);'}">
                    ${t.selectFromGallery}
                  </button>
                  <button type="button" id="uploadNewBtn" class="tile-btn" style="flex: 1; ${initialMode === 'upload' ? 'background-color: var(--primary); color: white;' : 'background-color: var(--text-secondary);'}">
                    ${t.uploadNew}
                  </button>
                </div>
                
                <input type="hidden" id="selectedImage" value="${selectedFilename}">
                <input type="hidden" id="selectedImageType" value="${selectedType}">
                ${selectedFilename ? `
                  <div id="selectedFileInfo">
                    <div class="selected-file" style="background: var(--success-light); border: 1px solid var(--success); border-radius: 6px; padding: 10px; margin: 10px 0;">
                      <strong style="color: var(--success);">${t.fileSelected}</strong> ${selectedFilename}
                    </div>
                  </div>
                ` : ''}
                
                <div id="galleryContainer" ${initialMode === 'upload' ? 'style="display: none;"' : ''}>
                  <div style="margin-bottom: 10px; font-size: 14px; color: var(--text-secondary);">
                    ${t.galleryTitle}
                  </div>
                  ${window.renderImageGallery(selectedFilename)}
                </div>
                
                <div id="uploadContainer" ${initialMode === 'select' ? 'style="display: none;"' : 'style="display: block;"'}>
                  <div class="upload-section" id="uploadSection">
                    <div class="upload-icon">📤</div>
                    <div class="upload-text">${t.clickToUpload}</div>
                    <div class="upload-hint">${t.uploadHint}</div>
                    <div class="upload-hint" style="margin-top: 5px; font-size: 12px;">${t.maxSize}</div>
                    <input type="file" id="fileUpload" class="upload-input" accept="image/*,video/*,.pdf,.zip,.js">
                  </div>
                  <div id="uploadProgress" class="upload-progress"></div>
                </div>
              </div>
              
              <div style="border: 1px solid var(--border); border-radius: 8px; padding: 15px; background: var(--tile-bg);">
                <h4 style="margin-top: 0; margin-bottom: 15px; color: var(--text);">${t.dateTimeSection || 'Data i czas'}</h4>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                  <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">${t.startDateLabel}</label>
                    <input type="date" id="scheduleStartDate" class="modal-input" value="${startParts.date}">
                  </div>
                  
                  <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">${t.endDateLabel}</label>
                    <input type="date" id="scheduleEndDate" class="modal-input" value="${endParts.date}">
                  </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
                  <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">${t.startTimeLabel || 'Godzina rozpoczęcia'}</label>
                    <input type="time" id="scheduleStartTime" class="modal-input" value="${startParts.time}" step="1">
                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 5px;">${t.timeFormatHint || 'Format: HH:MM:SS'}</div>
                  </div>
                  
                  <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">${t.endTimeLabel || 'Godzina zakończenia'}</label>
                    <input type="time" id="scheduleEndTime" class="modal-input" value="${endParts.time}" step="1">
                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 5px;">${t.timeFormatHint || 'Format: HH:MM:SS'}</div>
                  </div>
                </div>
                
                <div style="margin-top: 20px; border-top: 1px dashed var(--border); padding-top: 15px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <label style="font-weight: 600;">${t.additionalHoursLabel || 'Dodatkowe godziny'}</label>
                    <button type="button" id="addHourBtn" class="tile-btn" style="padding: 8px 16px; display: flex; align-items: center; gap: 6px;">
                      <span style="font-size: 16px;">+</span>
                      ${t.addHourBtn || 'Dodaj godzinę'}
                    </button>
                  </div>
                  <div id="additionalHoursContainer" style="display: grid; gap: 10px;">
                    ${additionalHoursHtml}
                  </div>
                </div>
              </div>
              
              <div>
                <label style="display: block; margin-bottom: 5px; font-weight: 600;">${t.repeatLabel}</label>
                <div class="weekdays-checkbox-container" style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px;">
                  <label class="weekday-checkbox" style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                    <input type="checkbox" value="1" ${repeatDays.includes(1) ? 'checked' : ''} class="weekday-checkbox-input"> ${t.calendarWeekdayMon || 'Mon'}
                  </label>
                  <label class="weekday-checkbox" style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                    <input type="checkbox" value="2" ${repeatDays.includes(2) ? 'checked' : ''} class="weekday-checkbox-input"> ${t.calendarWeekdayTue || 'Tue'}
                  </label>
                  <label class="weekday-checkbox" style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                    <input type="checkbox" value="3" ${repeatDays.includes(3) ? 'checked' : ''} class="weekday-checkbox-input"> ${t.calendarWeekdayWed || 'Wed'}
                  </label>
                  <label class="weekday-checkbox" style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                    <input type="checkbox" value="4" ${repeatDays.includes(4) ? 'checked' : ''} class="weekday-checkbox-input"> ${t.calendarWeekdayThu || 'Thu'}
                  </label>
                  <label class="weekday-checkbox" style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                    <input type="checkbox" value="5" ${repeatDays.includes(5) ? 'checked' : ''} class="weekday-checkbox-input"> ${t.calendarWeekdayFri || 'Fri'}
                  </label>
                  <label class="weekday-checkbox" style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                    <input type="checkbox" value="6" ${repeatDays.includes(6) ? 'checked' : ''} class="weekday-checkbox-input"> ${t.calendarWeekdaySat || 'Sat'}
                  </label>
                  <label class="weekday-checkbox" style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                    <input type="checkbox" value="7" ${repeatDays.includes(7) ? 'checked' : ''} class="weekday-checkbox-input"> ${t.calendarWeekdaySun || 'Sun'}
                  </label>
                </div>
                <div id="selectedDaysText" style="margin-top: 8px; font-size: 13px; color: var(--text-secondary); font-style: italic;">
                  ${window.formatRepeatDays(repeatDays)}
                </div>
              </div>
              
              <div>
                <label style="display: block; margin-bottom: 5px; font-weight: 600;">${t.statusLabel}</label>
                <select id="scheduleStatus" class="modal-select">
                  <option value="active" ${schedule.status === 'active' ? 'selected' : ''}>${t.statusActive}</option>
                  <option value="paused" ${schedule.status === 'paused' ? 'selected' : ''}>${t.statusPaused}</option>
                </select>
              </div>

              <div>
                <label style="display: block; margin-bottom: 5px; font-weight: 600;">${t.priorityLabel || 'Priority'}</label>
                <input type="number" id="schedulePriority" class="modal-input" min="0" max="2" step="1" value="${schedule.priority || 0}">
                <div style="font-size: 12px; color: var(--text-secondary); margin-top: 5px;">
                  ${t.priorityHint || '0 = lowest, 2 = highest'}
                </div>
              </div>
            </div>
            
            <div class="modal-btn-container" style="margin-top: 25px;">
              <button id="saveScheduleBtn" class="modal-btn save-btn">${t.saveBtn}</button>
              <button id="cancelScheduleBtn" class="modal-btn cancel-btn">${t.cancelBtn}</button>
            </div>
          </div>
        `;

        window.scheduleEditModal.style.display = "flex";
        
        setTimeout(() => {
          window.setupModalEvents();
          window.setupWeekdayCheckboxes();
            
          const priorityInput = window.scheduleEditModal.querySelector("#schedulePriority");
          if (priorityInput) {
            priorityInput.addEventListener('input', function() {
              let value = parseInt(this.value);
              if (isNaN(value) || value < 0) {
                this.value = 0;
              } else if (value > 2) {
                this.value = 2;
              } else if (!Number.isInteger(value)) {
                this.value = Math.floor(value);
              }
            });
          }
          
          const cancelBtn = window.scheduleEditModal.querySelector("#cancelScheduleBtn");
          if (cancelBtn) {
            cancelBtn.addEventListener("click", () => {
              window.scheduleEditModal.style.display = "none";
            });
          }
          
          const saveBtn = window.scheduleEditModal.querySelector("#saveScheduleBtn");
          if (saveBtn) {
            saveBtn.addEventListener("click", window.saveScheduleData);
          }
          
          const addHourBtn = window.scheduleEditModal.querySelector("#addHourBtn");
          if (addHourBtn) {
            addHourBtn.addEventListener("click", window.addAdditionalHour);
          }
          
          const removeHourBtns = window.scheduleEditModal.querySelectorAll('.remove-hour-btn');
          removeHourBtns.forEach(btn => {
            btn.addEventListener('click', function() {
              this.closest('.additional-hour-item').remove();
            });
          });
          
          const selectFromGalleryBtn = window.scheduleEditModal.querySelector("#selectFromGalleryBtn");
          const uploadNewBtn = window.scheduleEditModal.querySelector("#uploadNewBtn");
          
          if (selectFromGalleryBtn) {
            selectFromGalleryBtn.addEventListener("click", () => {
              const galleryContainer = window.scheduleEditModal.querySelector('#galleryContainer');
              const uploadContainer = window.scheduleEditModal.querySelector('#uploadContainer');
              
              selectFromGalleryBtn.style.backgroundColor = 'var(--primary)';
              selectFromGalleryBtn.style.color = 'white';
              uploadNewBtn.style.backgroundColor = 'var(--text-secondary)';
              uploadNewBtn.style.color = 'var(--text)';
              
              if (galleryContainer) galleryContainer.style.display = 'block';
              if (uploadContainer) uploadContainer.style.display = 'none';
            });
          }
          
          if (uploadNewBtn) {
            uploadNewBtn.addEventListener("click", () => {
              const galleryContainer = window.scheduleEditModal.querySelector('#galleryContainer');
              const uploadContainer = window.scheduleEditModal.querySelector('#uploadContainer');
              const selectedFileDiv = window.scheduleEditModal.querySelector('#selectedFileInfo');
              
              uploadNewBtn.style.backgroundColor = 'var(--primary)';
              uploadNewBtn.style.color = 'white';
              selectFromGalleryBtn.style.backgroundColor = 'var(--text-secondary)';
              selectFromGalleryBtn.style.color = 'var(--text)';
              
              if (galleryContainer) galleryContainer.style.display = 'none';
              if (uploadContainer) uploadContainer.style.display = 'block';
              
              if (selectedFileDiv) {
                const lang = window.getCookie("language") || "pl";
                const t = window.translations[lang];
                selectedFileDiv.innerHTML = `
                  <div style="color: var(--text-secondary); font-size: 14px; margin-bottom: 10px;">
                    ${t.selectFile} ${t.dragAndDrop}
                  </div>
                `;
              }
              
              window.scheduleEditModal.querySelectorAll('.image-item').forEach(item => {
                item.classList.remove('selected');
              });
              
              const selectedImageInput = window.scheduleEditModal.querySelector('#selectedImage');
              const selectedImageTypeInput = window.scheduleEditModal.querySelector('#selectedImageType');
              if (selectedImageInput) selectedImageInput.value = '';
              if (selectedImageTypeInput) selectedImageTypeInput.value = '';
            });
          }
        }, 50);
      }

    })
    .catch(err => {
      console.error(err);
      window.showToast(t.scheduleErrorLoading, "error");
    });
};

window.showCollisionErrorModal = function(collisionDetails) {
  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];
  
  const modal = document.createElement('div');
  modal.classList.add('modal-overlay');
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.zIndex = '1001';
  
  const dayNames = {
    1: t.calendarWeekdayMon,
    2: t.calendarWeekdayTue,
    3: t.calendarWeekdayWed,
    4: t.calendarWeekdayThu,
    5: t.calendarWeekdayFri,
    6: t.calendarWeekdaySat,
    7: t.calendarWeekdaySun
  };
  
  const collisionList = collisionDetails.map(collision => {
    const startDate = new Date(collision.start_date);
    const endDate = new Date(collision.end_date);
    
    const formatTime = (date) => {
      return date.toLocaleTimeString('pl-PL', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });
    };
    
    const commonDays = collision.commonDays
      .map(day => dayNames[day] || day)
      .join(', ');
    
    return `
      <div class="collision-item" style="margin-bottom: 15px; padding: 12px; background: var(--background); border-radius: 8px; border: 1px solid var(--danger);">
        <div style="font-weight: 600; color: var(--text); margin-bottom: 5px;">
          ${collision.task_name} (Priorytet: ${collision.priority})
        </div>
        <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 3px;">
          <strong>${t.startDateLabel}:</strong> ${startDate.toLocaleDateString()} ${formatTime(startDate)}
        </div>
        <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 3px;">
          <strong>${t.endDateLabel}:</strong> ${endDate.toLocaleDateString()} ${formatTime(endDate)}
        </div>
        <div style="font-size: 12px; color: var(--text-secondary);">
          <strong>${t.repeatLabel}:</strong> ${commonDays}
        </div>
      </div>
    `;
  }).join('');
  
  modal.innerHTML = `
    <div class="modal" style="max-width: 600px; text-align: center;">
      <div style="margin-bottom: 20px;">
        <div style="font-size: 48px; margin-bottom: 10px; color: var(--danger);">
          ⚠️
        </div>
        <h3 style="margin-bottom: 10px; color: var(--text);">
          ${t.collisionErrorTitle || 'Kolizja harmonogramów'}
        </h3>
        <p style="color: var(--text-secondary); margin-bottom: 15px;">
          ${t.collisionErrorMessage || 'Nie można zapisać harmonogramu ze względu na kolizję z istniejącymi harmonogramami:'}
        </p>
        
        <div style="max-height: 250px; overflow-y: auto; text-align: left; margin: 15px 0; padding: 10px; background: var(--tile-bg); border-radius: 8px;">
          ${collisionList}
        </div>
        
        <div style="background: var(--warning-light); border: 1px solid var(--warning); border-radius: 8px; padding: 10px; margin-top: 15px;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
            <span style="font-size: 20px;">📋</span>
            <span style="font-weight: 600; color: var(--text);">${t.collisionRulesTitle || 'Zasady kolizji:'}</span>
          </div>
          <div style="text-align: left; font-size: 12px; color: var(--text-secondary);">
            <div>• <strong>Priority 0:</strong> ${t.collisionRule0 || 'Brak kolizji z żadnym harmonogramem'}</div>
            <div>• <strong>Priority 1:</strong> ${t.collisionRule1 || 'Kolizja tylko z innymi Priority 1'}</div>
            <div>• <strong>Priority 2:</strong> ${t.collisionRule2 || 'Kolizja tylko z innymi Priority 2'}</div>
          </div>
        </div>
        
        <p style="color: var(--danger); font-size: 14px; margin-top: 15px;">
          ⚠️ ${t.collisionErrorHint || 'Proszę zmienić daty, godziny, dni tygodnia lub priorytet.'}
        </p>
      </div>
      
      <button id="closeCollisionModalBtn" class="modal-btn" style="background-color: var(--danger); color: white; width: 100%;">
        ${t.closeBtn || 'Zamknij'}
      </button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.id === 'closeCollisionModalBtn') {
      modal.remove();
    }
  });
  
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      modal.remove();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  
  document.addEventListener('keydown', handleEscape);
};

window.saveScheduleData = async function() {
  const modalContent = window.scheduleEditModal ? window.scheduleEditModal.querySelector('.modal') : null;
  if (!modalContent) return;
  
  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];
  
  const taskName = modalContent.querySelector("#scheduleTaskName").value.trim();
  const selectedImage = modalContent.querySelector("#selectedImage").value;
  const selectedImageType = modalContent.querySelector("#selectedImageType").value;
  
  const startDate = modalContent.querySelector("#scheduleStartDate").value;
  const endDate = modalContent.querySelector("#scheduleEndDate").value;
  const startTime = modalContent.querySelector("#scheduleStartTime").value || "00:00:00";
  const endTime = modalContent.querySelector("#scheduleEndTime").value || "00:00:00";
  
  const repeatCheckboxes = modalContent.querySelectorAll('.weekday-checkbox-input:checked');
  const repeatType = Array.from(repeatCheckboxes).map(cb => parseInt(cb.value)).sort((a,b) => a-b);
  
  let status = modalContent.querySelector("#scheduleStatus").value;
  if (status !== 'active' && status !== 'paused') {
    status = 'active';
  }

  const priorityInput = modalContent.querySelector("#schedulePriority");
  let priority = 0;
  if (priorityInput) {
    priority = parseInt(priorityInput.value);
    if (isNaN(priority) || priority < 0) {
      priority = 0;
    } else if (priority > 2) {
      priority = 2;
    }
    priorityInput.value = priority;
  }

  if (!taskName || !selectedImage || !startDate || !endDate) {
    window.showToast(t.fillRequiredFields, "error");
    return;
  }
  
  if (repeatType.length === 0) {
    window.showToast("Wybierz przynajmniej jeden dzień tygodnia", "error");
    return;
  }
  
  const content = JSON.stringify({
    type: selectedImageType,
    filename: selectedImage,
    billboard_uuid: window.selectedBillboardForSchedule,
    timestamp: new Date().toISOString()
  });
  
  const mainStartDateTime = window.joinDateTime(startDate, startTime);
  const mainEndDateTime = window.joinDateTime(endDate, endTime);
  
  const mainStart = new Date(mainStartDateTime);
  const mainEnd = new Date(mainEndDateTime);
  
  if (mainStart >= mainEnd) {
    window.showToast(t.dateError, "error");
    return;
  }
  
  const schedulesToCreate = [];
  
  schedulesToCreate.push({
    billboard_uuid: window.selectedBillboardForSchedule,
    task_name: taskName,
    content: content,
    start_date: mainStartDateTime,
    end_date: mainEndDateTime,
    repeat: repeatType,
    status: status,
    priority: priority
  });
  
  const additionalHours = [];
  const additionalHourItems = modalContent.querySelectorAll('.additional-hour-item');
  
  additionalHourItems.forEach((item) => {
    const addStartTime = item.querySelector('.additional-hour-start').value;
    const addEndTime = item.querySelector('.additional-hour-end').value;
    
    if (addStartTime && addEndTime) {
      const addStartTimeWithSeconds = addStartTime.includes(':') ? 
        (addStartTime.split(':').length === 2 ? addStartTime + ':00' : addStartTime) : 
        addStartTime + ':00:00';
      
      const addEndTimeWithSeconds = addEndTime.includes(':') ? 
        (addEndTime.split(':').length === 2 ? addEndTime + ':00' : addEndTime) : 
        addEndTime + ':00:00';
      
      const addStartDateTime = window.joinDateTime(startDate, addStartTimeWithSeconds);
      const addEndDateTime = window.joinDateTime(startDate, addEndTimeWithSeconds);
      
      const addStart = new Date(addStartDateTime);
      const addEnd = new Date(addEndDateTime);
      
      if (addStart < addEnd) {
        schedulesToCreate.push({
          billboard_uuid: window.selectedBillboardForSchedule,
          task_name: taskName,
          content: content,
          start_date: addStartDateTime,
          end_date: addEndDateTime,
          repeat: repeatType,
          status: status,
          priority: priority
        });
        
        additionalHours.push({
          start_date: addStartDateTime,
          end_date: addEndDateTime
        });
      }
    }
  });
  
  if (schedulesToCreate.length === 0) {
    window.showToast("Brak harmonogramów do zapisania", "error");
    return;
  }
  
  try {
    const saveBtn = modalContent.querySelector("#saveScheduleBtn");
    const originalText = saveBtn.textContent;
    saveBtn.innerHTML = `<span class="loading-spinner"></span> ${t.saving || 'Zapisywanie...'}`;
    saveBtn.disabled = true;
    
    if (window.currentSchedule && window.currentScheduleGroup) {
      const schedulesToCheck = schedulesToCreate.map(s => ({
        start_date: s.start_date,
        end_date: s.end_date,
        repeat: s.repeat,
        priority: s.priority,
        task_name: s.task_name
      }));
      
      const checkRes = await fetch("/api/schedules/check-collisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billboard_uuid: window.selectedBillboardForSchedule,
          schedules: schedulesToCheck,
          exclude_ids: window.currentScheduleGroup
        })
      });
      
      const checkData = await checkRes.json();
      
      if (!checkRes.ok || !checkData.success) {
        throw new Error(checkData.error || t.scheduleErrorChecking);
      }
      
      if (checkData.hasCollision) {
        const allCollisions = [];
        checkData.collisions.forEach(item => {
          item.collisions.forEach(collision => {
            allCollisions.push({
              id: collision.id,
              task_name: collision.task_name,
              start_date: collision.start_date,
              end_date: collision.end_date,
              priority: collision.priority,
              commonDays: collision.commonDays
            });
          });
        });
        
        window.showCollisionErrorModal(allCollisions);
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
        return;
      }
      
      const groupUpdateRes = await fetch(`/api/schedule-group/${window.currentScheduleGroup.join(',')}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billboard_uuid: window.selectedBillboardForSchedule,
          task_name: taskName,
          content: content,
          schedules: schedulesToCreate.map(s => ({
            start_date: s.start_date,
            end_date: s.end_date,
            repeat: s.repeat,
            priority: s.priority,
            status: s.status
          }))
        })
      });
      
      const groupUpdateData = await groupUpdateRes.json();
      
      if (!groupUpdateRes.ok || !groupUpdateData.success) {
        if (groupUpdateRes.status === 409 && groupUpdateData.error === "Kolizja harmonogramów") {
          window.showCollisionErrorModal(groupUpdateData.collisions || []);
          saveBtn.textContent = originalText;
          saveBtn.disabled = false;
          return;
        }
        
        throw new Error(groupUpdateData.error || t.scheduleErrorSaving);
      }
      
      window.scheduleEditModal.style.display = "none";
      window.showToast(groupUpdateData.message || t.scheduleUpdated, "success");
      
    } else {
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billboard_uuid: window.selectedBillboardForSchedule,
          task_name: taskName,
          content: content,
          start_date: mainStartDateTime,
          end_date: mainEndDateTime,
          repeat: repeatType,
          status: status,
          priority: priority,
          additional_hours: additionalHours
        })
      });
      
      const data = await res.json();
      
      if (res.status === 409 && data.error === "Kolizja harmonogramów") {
        window.showCollisionErrorModal(data.collisions || []);
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
        return;
      }
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || t.scheduleErrorSaving);
      }
      
      window.scheduleEditModal.style.display = "none";
      window.showToast(data.message || t.scheduleCreated, "success");
    }
    
    await window.loadSchedules(window.selectedBillboardForSchedule);
    
    if (window.visualizationModal && window.visualizationModal.style.display === "flex") {
      await window.openVisualizationModal();
    }
    
  } catch (err) {
    window.showToast(err.message, "error");
    console.error(err);
    
    const saveBtn = modalContent.querySelector("#saveScheduleBtn");
    saveBtn.textContent = originalText;
    saveBtn.disabled = false;
  }
};

window.deleteScheduleGroup = function(scheduleIdsStr, scheduleName = '') {
  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];
  
  const scheduleIds = scheduleIdsStr.split(',').map(id => id.trim());
  
  if (!scheduleName) {
    const scheduleItem = document.querySelector(`.schedule-item[data-group-ids="${scheduleIdsStr}"]`);
    if (scheduleItem) {
      const titleElement = scheduleItem.querySelector('.schedule-title');
      if (titleElement) {
        scheduleName = titleElement.textContent.trim();
      }
    }
  }
  
  const modal = document.createElement('div');
  modal.classList.add('modal-overlay');
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.zIndex = '1001';
  
  modal.innerHTML = `
    <div class="modal" style="max-width: 450px; text-align: center;">
      <div style="margin-bottom: 20px;">
        <div style="font-size: 48px; margin-bottom: 10px; color: var(--danger);">
          ⚠️
        </div>
        <h3 style="margin-bottom: 10px; color: var(--text);">
          ${t.deleteScheduleBtn}
        </h3>
        <p style="color: var(--text-secondary); margin-bottom: 5px;">
          ${t.scheduleConfirmDelete || 'Czy na pewno chcesz usunąć tę grupę harmonogramów?'}
        </p>
        ${scheduleName ? `
          <p style="font-size: 18px; font-weight: 600; color: var(--text); margin: 10px 0;">
            "${scheduleName}"
          </p>
        ` : ''}
        ${scheduleIds.length > 1 ? `
          <p style="color: var(--text-secondary); font-size: 14px; margin-top: 10px;">
            ${lang === 'pl' ? `(${scheduleIds.length} godzin)` : `(${scheduleIds.length} hours)`}
          </p>
        ` : ''}
        <p style="color: var(--danger); font-size: 14px; margin-top: 10px;">
          ⚠️ ${t.operationIrreversible}
        </p>
      </div>
      
      <div style="display: flex; gap: 10px; margin-top: 20px;">
        <button id="confirmDeleteScheduleBtn" class="modal-btn delete-btn" style="flex: 1;">
          ${t.deleteBtn}
        </button>
        <button id="cancelDeleteScheduleBtn" class="modal-btn cancel-btn" style="flex: 1;">
          ${t.cancelBtn}
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
  
  modal.querySelector('#confirmDeleteScheduleBtn').addEventListener('click', async () => {
    const confirmBtn = modal.querySelector('#confirmDeleteScheduleBtn');
    const cancelBtn = modal.querySelector('#cancelDeleteScheduleBtn');
    
    confirmBtn.innerHTML = `<span class="loading-spinner"></span> ${t.deleting || 'Deleting...'}`;
    confirmBtn.disabled = true;
    cancelBtn.disabled = true;
    
    try {
      const deletePromises = scheduleIds.map(id => 
        fetch(`/api/schedule/${id}`, { 
          method: "DELETE",
          headers: { "Content-Type": "application/json" }
        }).then(res => res.json())
      );
      
      const results = await Promise.all(deletePromises);
      
      const allSuccess = results.every(r => r.success);
      
      if (!allSuccess) {
        throw new Error(t.scheduleErrorDeleting);
      }
      
      modal.remove();
      window.showToast(results[0].message || t.scheduleDeleted, "success");
      
      if (window.selectedBillboardForSchedule) {
        await window.loadSchedules(window.selectedBillboardForSchedule);
        if (window.visualizationModal && window.visualizationModal.style.display === "flex") {
          await window.openVisualizationModal();
        }
      }
      
    } catch (err) {
      console.error(err);
      window.showToast(err.message, "error");
      
      confirmBtn.innerHTML = t.deleteBtn;
      confirmBtn.disabled = false;
      cancelBtn.disabled = false;
    }
  });
  
  modal.querySelector('#cancelDeleteScheduleBtn').addEventListener('click', () => {
    modal.remove();
  });
  
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      modal.remove();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  
  document.addEventListener('keydown', handleEscape);
};

document.addEventListener('DOMContentLoaded', function() {
  if (window.openScheduleBtn) {
    if (window.openScheduleBtn._clickListenerAdded) {
      window.openScheduleBtn.removeEventListener("click", window.openScheduleBtn._clickListener);
    }
    
    const openHandler = async () => {
      window.currentUser = await window.loadCurrentUser();
      if(!window.currentUser){ 
        window.showToast("Nie udało się pobrać danych aktualnego użytkownika. Zaloguj się ponownie.", "error"); 
        return; 
      }
      
      await window.loadBillboardsForSchedule();
      if (window.scheduleModal) {
        window.scheduleModal.style.display = "flex";
      }
    };
    
    window.openScheduleBtn._clickListener = openHandler;
    window.openScheduleBtn._clickListenerAdded = true;
    window.openScheduleBtn.addEventListener("click", openHandler);
  }
  
  if (window.addScheduleBtn) {
    if (window.addScheduleBtn._clickListenerAdded) {
      window.addScheduleBtn.removeEventListener("click", window.addScheduleBtn._clickListener);
    }
    
    window.addScheduleBtn._clickListener = window.openScheduleModal;
    window.addScheduleBtn._clickListenerAdded = true;
    window.addScheduleBtn.addEventListener("click", window.openScheduleModal);
  }
});