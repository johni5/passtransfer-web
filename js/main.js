function Messages(_id) {

    const id = _id || 'messages';
    let root, ctx, tm, timeout;


    this.init = function (p) {
        p = p || {};
        timeout = p['timeout'] || 5000;
        root = $(`#${id}`).hide();
        root.append(
            $('<a class="msg-close" href="#">×</a>')
                .on('click', () => _hide())
        );
        ctx = $(el('messages-ctx', ''));
        root.append(ctx);
    };

    this.showAction = function (txt, cb, _timeout) {
        let act = $(el('action', txt));
        if (cb) act.on('click', cb);
        ctx.append(act);
        _show(_timeout || timeout);
    };

    this.showWarn = function (txt, _timeout) {
        ctx.append(el('warn', txt));
        _show(_timeout || timeout);
    };

    this.showErr = function (txt, _timeout) {
        ctx.append(el('err', txt));
        _show(_timeout || timeout);
    };

    this.showInfo = function (txt, _timeout) {
        ctx.append(el('info', txt));
        _show(_timeout || timeout);
    };

    function el(cls, text) {
        return `<div class="${cls}">${text}</div>`;
    }

    function _show(_t) {
        if (tm) clearTimeout(tm);
        root.fadeIn(500);
        if (_t > 0) {
            tm = setTimeout(() => _hide(), _t);
        }
    }

    function _hide() {
        root.fadeOut(500, () => ctx.html(""));
    }

}

function copyToClipboard(textToCopy) {
    // navigator clipboard api needs a secure context (https)
    if (navigator.clipboard && window.isSecureContext) {
        // navigator clipboard api method'
        return navigator.clipboard.writeText(textToCopy);
    } else {
        // text area method
        let textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        // make the textarea out of viewport
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        return new Promise((res, rej) => {
            // here the magic happens
            document.execCommand('copy') ? res() : rej();
            textArea.remove();
        });
    }
}