function initializeMap() {
    const minZoom = 2;
    const center = [0, 118];
    const map = L.map('map', {
        center,
        minZoom,
        maxZoom: 4,
        crs: L.CRS.Simple,
        maxBoundsViscosity: 1.0, // Prevent white space surrounding image when click-and-dragging map.
    }).setView(center, minZoom);

    const url = 'images/map.jpg';
    const imageWidth = 1920;
    const imageHeight = 1915;

    // Calculate the edges of the image, in coordinate space.
    const southWest = map.unproject([0, imageHeight], map.getMaxZoom() - 1);
    const northEast = map.unproject([imageWidth, 0], map.getMaxZoom() - 1);
    const bounds = new L.LatLngBounds(southWest, northEast);
    
    // Add the image overlay, so that it covers the entire map.
    L.imageOverlay(url, bounds).addTo(map);

    // Tell leaflet that the map is exactly as big as the image.
    map.setMaxBounds(bounds);
    
    setupBookmarks(map);
}

const customFormPopupFields = {
    categoryInputId: 'categoryInput',
    levelInputId: 'levelInput',
};

function showOrHideLevelSelection(event) {
    getLevelInputElement().style.display = (event.target.value === 'placeOfInterest') ? 'none' : 'inline';
}

function getLevelInputElement() {
   return document.getElementById(customFormPopupFields.levelInputId);
}

function setupBookmarks(map) {
    const bookmarkOptions = {

        // no bookmarks text
        emptyMessage: "Add something, ye lone wanderer.",
        addNewOption: false, // TODO: Add feature to show all markers at once.
        popupTemplate: `
            <div>
                <h3>{name}</h3>
                <p>{description}</p>
            </div>
        `,
        getPopupContent: function(bookmark) {
            return L.Util.template(this.options.popupTemplate, {
                name: bookmark.name,
                description: getBookmarkDescription(bookmark),
            });
        },
        formPopup: {
            generateNamesPrefix: 'Marker',
            templateOptions: {
                formClass: 'leaflet-bookmarks-form',
                inputClass: 'leaflet-bookmarks-form-name',
                inputErrorClass: 'has-error',
                idInputClass: 'leaflet-bookmarks-form-id',
                coordsClass: 'leaflet-bookmarks-form-coords',
                submitClass: 'leaflet-bookmarks-form-submit',
                inputPlaceholder: 'Bookmark name',
                removeClass: 'leaflet-bookmarks-form-remove',
                editClass: 'leaflet-bookmarks-form-edit',
                cancelClass: 'leaflet-bookmarks-form-cancel',
                editableClass: 'editable',
                removableClass: 'removable',
                menuItemClass: 'nav-item',
                editMenuText: 'Edit',
                removeMenuText: 'Remove',
                cancelMenuText: 'Cancel',
                submitTextCreate: '+',
                submitTextEdit: '<span class="icon-checkmark"></span>',
                ...customFormPopupFields,
            },
            template: `
                <form class="{{ formClass }}">
                    <div class="input-group">
                        <input type="text" name="bookmark-name" placeholder="Marker name" class="name-textbox form-control {{ inputClass }}" value="{{ name }}">
                        <button type="submit" class="add-new-bookmark-button input-group-addon {{ submitClass }}">{{ submitText }}</button>
                        <input type="hidden" class={{ idInputClass }} value="{{ id }}">
                        <br>
                        <select name="category" id={{ categoryInputId }} onchange="showOrHideLevelSelection(event)">
                            <option value="placeOfInterest" selected>Place of Interest</option>
                            <option value="lockpick">Lockpick</option>
                            <option value="hacking">Hacking</option>
                        </select>
                        <select name="level" id={{ levelInputId }} style="display: none;">
                            <option value="1" selected>1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                        </select>
                    </div>
                </form>
            `,
            getBookmarkData: function() {
                const nameInput = this._contentNode.querySelector(`.${this.options.templateOptions.inputClass}`);
                const category = this._contentNode.querySelector(`#${customFormPopupFields.categoryInputId}`).value;
                const level = this._contentNode.querySelector(`#${customFormPopupFields.levelInputId}`).value;
                return {
                    category,
                    level,
                    id: nameInput.value + Math.floor(Math.random() * 1000),
                    name: nameInput.value || categoryInput.value + ': ' + levelInput.value,
                    latlng: this._source.getLatLng(),
                };
            },
        },
        bookmarkTemplate: `
            <li class="{{ itemClass }}" data-id="{{ data.id }}">
                <span class="{{ removeClass }}">&times;</span>
                <span class="{{ nameClass }}">{{ data.name }}</span>
                <span class="{{ coordsClass }}">{{ data.description }}</span>
            </li>
        `,
         getBookmarkDataForTemplate: function(bookmark) {
            return {
                id: bookmark.id,
                name: bookmark.name,
                description: getBookmarkDescription(bookmark),
            };
        },
    };

    new L.Control.Bookmarks(bookmarkOptions).addTo(map);
    map.on('contextmenu', function(e) {
        map.fire('bookmark:new', {
            latlng: e.latlng,
        });
    });
}

function getBookmarkDescription(bookmark) {
    let description = 'Place of Interest';
    if (bookmark.category !== 'placeOfInterest') {
        const capitalizedCategoryName = bookmark.category.charAt(0).toUpperCase() + bookmark.category.slice(1);
        description = bookmark.level ? `${capitalizedCategoryName}: ${bookmark.level}` : capitalizedCategoryName;
    }
    return description;
}
