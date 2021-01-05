(function () {
    var uniqId = uuidv4();
    var parentElement = window.document.body;
    var key = 'popupResult';
    var POPUP_STATES = Object.freeze({
        OPENING: 'opening',
        OPENED: 'opened',
        CLOSING: 'closing',
        CLOSED: 'closed',
    });
    var STATUS = Object.freeze({
        ACCEPTED: 'accepted',
        REJECTED: 'rejected',
    });
    var state = {
        popup: POPUP_STATES.CLOSED,//'opening'|'opened'|'closing'|'closed'
        status: null,//'accepted'|'rejected'|null
    };

    function toggleStyles () {
        if (state.popup === POPUP_STATES.OPENING) {
            var style = document.createElement('style');
            style.type = 'text/css';
            style.id = `styled-${uniqId}`;
            style.innerHTML = `
                .popup-element-${uniqId} {
                    width: 300px;
                    display: flex;
                    flex-direction: column;
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: white;
                    z-index: 9999;
                    padding: 10px;
                }
                .header-${uniqId} {
                    border-bottom: 0.5px solid gray;
                }
                .content-${uniqId} {}
                .footer-${uniqId} {
                    display: flex;
                    justify-content: space-between;
                }
                .overlay-${uniqId} {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(0,0,0,0.3);
                    z-index: 9998;
                }
                #accept-${uniqId} {}
                #reject-${uniqId} {}
                .popup-overlapped-${uniqId} {
                    overflow: hidden !important;
                    max-width: 100vw !important;
                    max-height: 100vh !important;
                    position: relative !important;
                }
            `
            parentElement.insertBefore(style, parentElement.firstChild);
        } else if (state.popup === POPUP_STATES.CLOSING) {
            var style = window.document.getElementById(`styled-${uniqId}`);
            style.remove();
        }
    };

    function toggleWidget (
                               header,
                               content,
                               accept,
                               reject
    ) {
        if (state.popup === POPUP_STATES.OPENING) {
            var popup = htmlToElements(`
                <div class="popup-element-${uniqId}" id="popup-${uniqId}">
                    <div class="header-${uniqId}">
                        ${header}
                    </div>
                    <div class="content-${uniqId}">
                        ${content}
                    </div>
                    <div class="footer-${uniqId}">
                        <div>
                            <button id="accept-${uniqId}">
                                Accept
                            </button>
                        </div>
                        <div>
                            <button id="reject-${uniqId}">
                                Reject
                            </button>
                        </div>
                    </div>
                </div>
            `);

            var overlay = htmlToElements(`
                <div class="overlay-${uniqId}" id="overlay-${uniqId}"></div>
            `);

            parentElement.insertBefore(overlay, parentElement.firstChild);
            parentElement.insertBefore(popup, parentElement.firstChild);
            parentElement.classList.add(`popup-overlapped-${uniqId}`);

            const acceptButton = window.document.getElementById(`accept-${uniqId}`);
            const rejectButton = window.document.getElementById(`reject-${uniqId}`);

            acceptButton.addEventListener('click', accept);
            rejectButton.addEventListener('click', reject);

            toggleStyles();

            state.popup = POPUP_STATES.OPENED;
        } else if (state.popup === POPUP_STATES.CLOSING) {
            parentElement.classList.remove(`popup-overlapped-${uniqId}`);
            var popupElement = window.document.getElementById(`popup-${uniqId}`);
            var overlayElement = window.document.getElementById(`overlay-${uniqId}`);
            popupElement.remove();
            overlayElement.remove();

            toggleStyles();

            state.popup = POPUP_STATES.CLOSED;
        }
    };

    function changeContent (content) {
        var popupElement = window.document.getElementById(`popup-${uniqId}`);
        if (popupElement) {
            if (state.popup === POPUP_STATES.OPENED) {
                const contentElement = popupElement.querySelector(`.content-${uniqId}`);
                if (contentElement) {
                    contentElement.innerHTML = content;
                }
            }
        }
    };

    function hideAcceptButton () {
        var popupElement = window.document.getElementById(`popup-${uniqId}`);
        if (popupElement) {
            if (state.popup === POPUP_STATES.OPENED) {
                const acceptBtn = popupElement.querySelector(`#accept-${uniqId}`);
                if (acceptBtn) {
                    acceptBtn.remove();
                }
            }
        }
    };

    function disableGA () {
        // as mentioned here
        // https://developers.google.com/analytics/devguides/collection/gtagjs/user-opt-out#:~:text=To%20disable%20Analytics%20programmatically%2C%20set,you%20would%20like%20to%20disable.
        window['ga-disable-GA_MEASUREMENT_ID'] = true;
    };

    function accept () {
        state.status = STATUS.ACCEPTED;
        state.popup = POPUP_STATES.CLOSING;
        toggleWidget();
        storeData(key, {status: state.status});
    };

    function reject () {
        state.status = STATUS.REJECTED;
        changeContent("SOME ANOTHER CONTENT");
        hideAcceptButton();
        disableGA();
        storeData(key, {status: state.status});
    };

    function htmlToElements(html) {
        var template = document.createElement('template');
        template.innerHTML = html;
        return template.content;
    };

    function storeData (key, data) {
        try {
            data = JSON.stringify(data);
            if (window.localStorage) {
                window.localStorage.setItem(key, data)
                return;
            }
            if (window.sessionStorage) {
                window.sessionStorage.setItem(key, data)
                return;
            }
            if (!window.temporaryStorage) window.temporaryStorage = {};
            window.temporaryStorage = {[key]: data};
            return;
        } catch (err) {
            if (err instanceof SyntaxError) clearData(key);
            else throw err;
            return;
        }
    };

    function getData (key) {
        try {
            if (window.localStorage) {
                var data = JSON.parse(window.localStorage.getItem(key, data));
                return data;
            }
            if (window.sessionStorage) {
                JSON.parse(window.sessionStorage.getItem(key));
                return data;
            }
            if (window.temporaryStorage) {
                return JSON.parse(window.temporaryStorage[key]);
            }
            return null;
        } catch (err) {
            if (err instanceof SyntaxError) clearData(key);
            return null;
        }
    };

    function clearData (key) {
        if (window.localStorage) {
            window.localStorage.removeItem(key)
            return true;
        }
        if (window.sessionStorage) {
            window.sessionStorage.removeItem(key)
            return true;
        }
        if (window.temporaryStorage) {
            delete window.temporaryStorage[key];
            return true;
        }
        return false;
    };

    function uuidv4 () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    window.onload = function () {
        var data = getData(key);
        state.status = data && data.status;
        state.popup = data ? POPUP_STATES.CLOSED : POPUP_STATES.OPENING;
        toggleWidget(
            "Header",
            "Content",
            accept,
            reject
        );
    };
})();
